'use client';

import { useEffect, useRef, useState } from 'react';
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
};

export function useRealtimeWithFallback<T>(args: UseRealtimeWithFallbackArgs<T>): T {
  const [state, setState] = useState<T>(args.initial);
  const fetcherRef = useRef(args.fetcher);

  // fetcher in einem Effect aktualisieren — KEIN Lesen/Schreiben von refs
  // während des Renders (React-19-Regel).
  useEffect(() => {
    fetcherRef.current = args.fetcher;
  });

  useEffect(() => {
    return setupRealtimeAndPolling({
      channelName: args.channelName,
      events: args.events,
      pollIntervalMs: args.pollIntervalMs ?? DEFAULT_POLL_MS,
      pauseOnHidden: args.pauseOnHidden !== false,
      fetcherRef,
      setState,
    });
    // channelName und events sollen einen neuen Subscribe triggern wenn
    // sie sich ändern. fetcher liest via Ref → keine Re-Subscribes nötig.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.channelName, JSON.stringify(args.events), args.pollIntervalMs, args.pauseOnHidden]);

  return state;
}

type SetupArgs<T> = {
  channelName: string;
  events: readonly string[];
  pollIntervalMs: number;
  pauseOnHidden: boolean;
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
  void safeFetch();
  schedulePoll(setup, stopper, safeFetch);
  const detachVisibility = attachVisibility(setup.pauseOnHidden, safeFetch);
  return () => {
    stopper.cancelled = true;
    if (stopper.pollTimer) clearTimeout(stopper.pollTimer);
    void supabase.removeChannel(channel);
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
  const channel = supabase.channel(setup.channelName, {
    config: { broadcast: { self: false } },
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
