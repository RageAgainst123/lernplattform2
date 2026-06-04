'use client';

import { useCallback } from 'react';
import type { LiveState } from '@/app/api/live/route';
import { useRealtimeWithFallback } from '@/components/realtime/useRealtimeWithFallback';
import { channels, events } from '@/lib/realtime/channels';

// Pollt /api/live und liefert den aktuellen Live-Zustand (Phase T5).
//
// Phase T5 (ADR-0016): Hook ist jetzt ein Wrapper über useRealtimeWithFallback.
// Bei jedem Folien-/Reveal-/Lock-/End-Event triggert der Broadcast einen
// sofortigen Refetch von /api/live (authoritative source mit ownVote +
// locked-Flag, etc.). Polling-Tick 5s ist Sicherheitsnetz.
//
// Channel: live_session:{classId}. classId kommt vom Server-Layout
// (jose-Session). Bei classId=null (nicht eingeloggt) wird ein
// Disabled-Channel verwendet — Polling reicht.

const POLL_FALLBACK_MS = 5000;
const LIVE_EVENTS = [
  events.live.blockChanged,
  events.live.blockRevealed,
  events.live.blockLocked,
  events.live.presentationEnded,
] as const;

export function useLiveSync(classId: string | null): LiveState {
  const fetcher = useCallback(async (): Promise<LiveState> => {
    const res = await fetch('/api/live', { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    return (await res.json()) as LiveState;
  }, []);

  return useRealtimeWithFallback<LiveState>({
    channelName: classId ? channels.liveSession(classId) : 'live_session:disabled',
    events: LIVE_EVENTS,
    fetcher,
    initial: { active: false },
    pollIntervalMs: POLL_FALLBACK_MS,
  });
}
