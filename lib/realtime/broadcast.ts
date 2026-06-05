import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';

// Server-Helper für Realtime-Broadcast-Pushes (Phase T1, ADR-0016).
//
// Wird aus Server-Actions aufgerufen NACH erfolgreichem DB-Write. Pattern:
// fire-and-forget — Fehler im Broadcast dürfen die Action nicht failen
// lassen (Polling-Fallback fängt es auf).
//
// Serverless-Constraint: keine persistente Connection halten. Wir öffnen
// pro Aufruf einen kurzlebigen Channel, senden, schließen sofort. Das ist
// supabase-js-konform (siehe https://supabase.com/docs/guides/realtime/broadcast).

export type BroadcastResult = 'ok' | 'error' | 'rate_limited';

/**
 * Sendet ein Broadcast-Event auf einen benannten Channel.
 *
 * @param channelName  vollständiger Channel-Name aus `channels.*` Helper
 * @param event        Event-Name aus `events.*` Helper
 * @param payload      JSON-serialisierbarer Payload, <500 Bytes empfohlen
 * @returns            Promise mit Send-Resultat; 'error' bei Failure
 *
 * Fehler werden geloggt aber nicht geworfen — der Caller (Server-Action)
 * soll im Failure-Fall einfach weitermachen. Polling fängt die Aussetzer
 * auf.
 *
 * Performance: ~50-200ms pro Aufruf (Connection-Setup-Overhead). Caller
 * sollte das fire-and-forget aufrufen (await ist nicht zwingend, aber
 * vermeidet unhandled-promise-rejection).
 */
export async function publishBroadcast(
  channelName: string,
  event: string,
  payload: Record<string, unknown>
): Promise<BroadcastResult> {
  try {
    const supabase = createServiceClient();
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false, ack: false } },
    });
    // subscribe() ist nötig BEVOR send() — sonst wird das Event silently
    // verworfen. Wir warten kurz auf SUBSCRIBED, dann senden, dann cleanup.
    //
    // Pre-Launch-Audit HIGH-3 (2026-06-04): Timeout von 3000ms auf 1000ms
    // reduziert. Bei hängender Realtime-Verbindung kostete die Server-Action
    // vorher bis zu 3s Vercel-Function-Zeit (auch trotz fire-and-forget,
    // weil Promise-Settle die Invocation-Dauer beeinflusst). 1s genügt für
    // normales Subscribe (T0-Spike: 75-115 ms), schneidet aber Cost-Drift
    // bei Supabase-Realtime-Down ab. Bei Failure übernimmt der 5s-Polling-
    // Fallback im Client.
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('subscribe timeout')), 1000);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timer);
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timer);
          reject(new Error(`subscribe failed: ${status}`));
        }
      });
    });
    const result = await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
    await supabase.removeChannel(channel);
    if (result === 'ok') return 'ok';
    if (result === 'rate limited') return 'rate_limited';
    return 'error';
  } catch (err) {
    // Logging nur als Console-Warn — kein Throw. Polling-Fallback übernimmt.
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[broadcast] publish failed: channel=${channelName} event=${event}`, err);
    }
    return 'error';
  }
}
