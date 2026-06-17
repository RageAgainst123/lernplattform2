'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Hybrid-Realtime-Hook mit Polling-Fallback (Phase T1, ADR-0016).
//
// Macht zwei Dinge gleichzeitig:
//   1. Subscribed auf einen Realtime-Broadcast-Channel und lauscht auf die
//      angegebenen Events. Bei Event: sofortiger fetcher()-Aufruf.
//   2. Pollt im Hintergrund alle pollIntervalMs (default 5000) — falls
//      Realtime ausfällt oder Events verloren gehen, hat man trotzdem
//      authoritative Daten.
//
// Trick: Realtime triggert NUR einen Refetch, holt NICHT die Daten selbst.
// fetcher() ist die einzige Quelle der Wahrheit. Das hält das System
// resilient — auch wenn Broadcast verzögert/verloren ist, der nächste Poll
// fängt es auf, kein Daten-Schiefstand möglich.
//
// Pattern für T3-T6: bestehende Polling-Hooks werden Wrapper über diesen
// Hook. fetcher = die alte Polling-Logik, channelName + events = neu.

const DEFAULT_POLL_MS = 5000;

export type UseRealtimeWithFallbackArgs<T> = {
  /** Channel-Name aus channels.* Helper, z.B. 'quiz_session:abc-uuid' */
  channelName: string;
  /** Event-Namen die einen Refetch triggern, z.B. ['question_revealed'] */
  events: readonly string[];
  /** Authoritative Datenquelle — wird bei Mount, Event und Poll-Tick aufgerufen */
  fetcher: () => Promise<T>;
  /** Initial-State (Server-rendered, kein Flicker beim Mount) */
  initial: T;
  /** Fallback-Polling-Intervall in ms (default: 5000) */
  pollIntervalMs?: number;
  /** Optional: bei Tab-versteckt pausieren? Default true. */
  pauseOnHidden?: boolean;
  /**
   * Pre-Launch-Audit MED-1 (2026-06-04): wenn false, wird KEIN Realtime-
   * Channel geöffnet und KEIN Polling-Timer gestartet — der Hook gibt
   * einfach `initial` zurück. Default true. Nutze das für Wrapper-Hooks
   * die in einem „idle"-Zustand sind (z.B. Schüler-Tab ohne aktives Quiz),
   * damit du keine Pseudo-Channels wie `quiz_session:idle` mit hunderten
   * Connections sammelst.
   */
  enabled?: boolean;
  /**
   * Pre-Launch-Audit MED-3 (2026-06-04): wenn true, kein sofortiger
   * safeFetch beim Mount — der SSR-`initial`-State wird als frisch
   * angenommen, der erste Refetch passiert erst beim Poll-Tick oder
   * beim ersten Broadcast-Event. Default true (vorher war es false,
   * was 125 unnötige Calls bei 25 Schüler × 5 Hooks ergab).
   */
  skipInitialFetch?: boolean;
};

export type UseRealtimeWithFallbackResult<T> = {
  /** Aktueller authoritative State */
  state: T;
  /**
   * Sofortiger Refetch — fuer den schreibenden Tab. Nach erfolgreicher
   * Server-Action aufrufen, statt auf den Realtime-Broadcast-Roundtrip oder
   * den Polling-Tick zu warten. Cuts ~100-300ms latency fuer die Person,
   * die die Aktion ausgeloest hat.
   */
  refetch: () => Promise<void>;
};

export function useRealtimeWithFallback<T>(
  args: UseRealtimeWithFallbackArgs<T>
): UseRealtimeWithFallbackResult<T> {
  const [state, setState] = useState<T>(args.initial);
  const fetcherRef = useRef(args.fetcher);
  const cancelledRef = useRef(false);

  // fetcher in einem Effect aktualisieren — KEIN Lesen/Schreiben von refs
  // während des Renders (React-19-Regel).
  useEffect(() => {
    fetcherRef.current = args.fetcher;
  });

  useEffect(() => {
    cancelledRef.current = false;
    // Pre-Launch-Audit MED-1: enabled=false → kein channel, kein polling.
    // Hook gibt einfach state=initial zurück, refetch() ist no-op.
    if (args.enabled === false) {
      return () => {
        cancelledRef.current = true;
      };
    }
    const cleanup = setupRealtimeAndPolling({
      channelName: args.channelName,
      events: args.events,
      pollIntervalMs: args.pollIntervalMs ?? DEFAULT_POLL_MS,
      pauseOnHidden: args.pauseOnHidden !== false,
      skipInitialFetch: args.skipInitialFetch !== false,
      fetcherRef,
      setState,
    });
    return () => {
      cancelledRef.current = true;
      cleanup();
    };
    // channelName und events sollen einen neuen Subscribe triggern wenn
    // sie sich ändern. fetcher liest via Ref → keine Re-Subscribes nötig.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    args.channelName,
    JSON.stringify(args.events),
    args.pollIntervalMs,
    args.pauseOnHidden,
    args.enabled,
    args.skipInitialFetch,
  ]);

  // Imperative refetch — Caller (z.B. Lehrer-Button-Handler) ruft das nach
  // erfolgreicher Server-Action auf. Liest fetcher via Ref, damit der
  // Callback stabil bleibt.
  const refetch = useCallback(async (): Promise<void> => {
    try {
      const next = await fetcherRef.current();
      if (!cancelledRef.current) setState(next);
    } catch {
      // Netz-Fehler: nächster Tick versucht erneut.
    }
  }, []);

  return { state, refetch };
}

type SetupArgs<T> = {
  channelName: string;
  events: readonly string[];
  pollIntervalMs: number;
  pauseOnHidden: boolean;
  skipInitialFetch: boolean;
  fetcherRef: React.MutableRefObject<() => Promise<T>>;
  setState: React.Dispatch<React.SetStateAction<T>>;
};

type Stopper = {
  cancelled: boolean;
  pollTimer: ReturnType<typeof setTimeout> | null;
};

function setupRealtimeAndPolling<T>(setup: SetupArgs<T>): () => void {
  const stopper: Stopper = { cancelled: false, pollTimer: null };
  const safeFetch = makeSafeFetch(setup, stopper);
  const supabase = createClient();
  const channel = subscribeChannel(supabase, setup, safeFetch);
  // Pre-Launch-Audit MED-3: skipInitialFetch=true (default) → SSR-State ist
  // frisch, kein unnötiger Sofort-Call. Erster Refetch kommt mit dem ersten
  // Broadcast-Event oder spätestens nach pollIntervalMs.
  if (!setup.skipInitialFetch) void safeFetch();
  schedulePoll(setup, stopper, safeFetch);
  const detachVisibility = attachVisibility(setup.pauseOnHidden, safeFetch);
  return () => {
    stopper.cancelled = true;
    if (stopper.pollTimer) clearTimeout(stopper.pollTimer);
    if (channel) void supabase.removeChannel(channel);
    detachVisibility();
  };
}

function makeSafeFetch<T>(setup: SetupArgs<T>, stopper: Stopper): () => Promise<void> {
  return async () => {
    try {
      const next = await setup.fetcherRef.current();
      if (!stopper.cancelled) setup.setState(next);
    } catch {
      // Netz-Fehler: nächster Tick versucht es erneut.
    }
  };
}

function schedulePoll<T>(setup: SetupArgs<T>, stopper: Stopper, safeFetch: () => Promise<void>) {
  if (stopper.cancelled) return;
  stopper.pollTimer = setTimeout(async () => {
    const hidden = setup.pauseOnHidden && typeof document !== 'undefined' && document.hidden;
    if (!hidden) await safeFetch();
    schedulePoll(setup, stopper, safeFetch);
  }, setup.pollIntervalMs);
}

function subscribeChannel<T>(
  supabase: ReturnType<typeof createClient>,
  setup: SetupArgs<T>,
  safeFetch: () => Promise<void>
) {
  // Pre-Launch-Audit MED-1+MED-2 (2026-06-04): Wenn channelName leer ist,
  // KEINE Realtime-Subscription öffnen — Polling läuft trotzdem weiter und
  // holt eine Session-id sobald sie da ist. Re-Subscribe passiert automatisch
  // wenn der useEffect mit neuem channelName re-läuft. Spart Pseudo-Channel-
  // Connections (war: 'quiz_session:idle' für alle idle-Tabs).
  if (!setup.channelName) return null;
  // self: true — der publizierende Client KRIEGT seinen eigenen Broadcast
  // zurueck. Klingt komisch (warum sollte ich auf mein eigenes Event
  // lauschen?), ist aber genau richtig fuer unser pattern: der lehrer-tab
  // ruft die server-action auf, die published, und der LEHRER-tab selbst
  // muss seinen state aktualisieren ohne auf den 5-s-polling-tick zu
  // warten. ohne self:true wuerde der lehrer seine eigene aktion erst
  // nach polling sehen — schueler sahen es schon vorher (asymmetrische
  // latenz, sieht nach bug aus). der refetch ist idempotent, also doppelt
  // wuerde nicht schaden — aber durch supabase-internes deduping kommt
  // das event ohnehin nur einmal.
  const channel = supabase.channel(setup.channelName, {
    config: { broadcast: { self: true } },
  });
  for (const eventName of setup.events) {
    channel.on('broadcast', { event: eventName }, () => void safeFetch());
  }
  channel.subscribe();
  return channel;
}

function attachVisibility(pauseOnHidden: boolean, safeFetch: () => Promise<void>): () => void {
  if (!pauseOnHidden || typeof document === 'undefined') return () => undefined;
  const onVisibility = () => {
    if (!document.hidden) void safeFetch();
  };
  document.addEventListener('visibilitychange', onVisibility);
  return () => document.removeEventListener('visibilitychange', onVisibility);
}
