'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { channels, events } from '@/lib/realtime/channels';

// Router-Type aus useRouter inferieren — next/navigation exportiert keinen
// öffentlichen AppRouterInstance-Type direkt.
type AppRouter = ReturnType<typeof useRouter>;

// Phase T6 (ADR-0016): wrapper um die Fortschrittsmatrix der lehrer:innen-
// sicht. subscribed auf class_progress:{classId} und triggert bei jedem
// progress-event einen router.refresh() — die server-component-matrix wird
// neu gerendert ohne F5.
//
// Pre-Launch-Audit HIGH-2 (2026-06-04): Zusätzlich Polling-Fallback alle
// 60s — wenn Realtime-Service hängt (Supabase-Outage, WebSocket-Abriss,
// Browser-Suspend zu lange), sieht Lehrer:in trotzdem irgendwann aktuelle
// Daten. 60s ist bewusst langsam (nicht latenz-kritisch wie Quiz/Live).
// Damit erfüllt der Hook das ADR-0016-Pattern „Polling-Fallback bleibt
// zwingend aktiv".
//
// events: module_submitted, worksheet_returned, heft_entry_saved

const PROGRESS_EVENTS = [
  events.classProgress.moduleSubmitted,
  events.classProgress.worksheetReturned,
  events.classProgress.heftEntrySaved,
] as const;

const POLLING_FALLBACK_MS = 60 * 1000;

export function ProgressMatrixLive({
  classId,
  children,
}: {
  classId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  useEffect(() => setupRealtimeAndPolling(classId, router), [classId, router]);
  return <>{children}</>;
}

// Setup-Helper: subscribed auf den Realtime-Channel + startet Polling-
// Fallback + visibility-handling. Returnt eine Cleanup-Funktion.
function setupRealtimeAndPolling(classId: string, router: AppRouter): () => void {
  const supabase = createClient();
  const channel = supabase.channel(channels.classProgress(classId), {
    config: { broadcast: { self: false } },
  });
  for (const eventName of PROGRESS_EVENTS) {
    channel.on('broadcast', { event: eventName }, () => router.refresh());
  }
  channel.subscribe();

  let timer: ReturnType<typeof setInterval> | null = null;
  const startPolling = () => {
    if (timer) return;
    timer = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, POLLING_FALLBACK_MS);
  };
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
  const onVisibility = () => {
    if (document.hidden) {
      stopPolling();
    } else {
      router.refresh();
      startPolling();
    }
  };
  startPolling();
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    stopPolling();
    document.removeEventListener('visibilitychange', onVisibility);
    void supabase.removeChannel(channel);
  };
}
