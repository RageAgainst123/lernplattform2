import { SpikeRunner } from '@/app/dev/realtime-spike/SpikeRunner';

// Temporäre Spike-Page für T0 (Realtime-Broadcast-Test).
//
// Ziel: Beweisen dass Supabase Realtime auf der eigenen Instanz funktioniert,
// Latenz <100ms im LAN, und Reconnect nach WLAN-Abriss automatisch passiert.
//
// Diese Page wird nach erfolgreichem T0-Test wieder gelöscht (oder hinter
// /admin geschützt). Für jetzt: Public Route, weil sie nichts Sensibles tut
// und nur in der lokalen Dev-Session läuft.
//
// Nutzung:
//   1. pnpm dev starten
//   2. Zwei Browser-Tabs auf http://localhost:3000/dev/realtime-spike öffnen
//   3. Tab A: „Subscribe" klicken
//   4. Tab B: „Send Broadcast" klicken
//   5. Latenz in Tab A ablesen
//
// Erwartung: Latenz <100 ms lokal, <500 ms gegen Supabase-Cloud.

export const metadata = {
  title: 'Realtime Spike — Phase T Test',
};

export default function RealtimeSpikePage() {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-2 text-2xl font-bold">Realtime Spike Test</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Temporäre Test-Seite für Phase T0 (ADR-0016). Wird nach erfolgreicher Verifikation wieder
        entfernt.
      </p>
      <SpikeRunner />
    </div>
  );
}
