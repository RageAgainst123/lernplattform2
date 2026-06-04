import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { featureFlags, maintenanceMessages } from '@/lib/feature-flags';

// Öffentliche Status-Page (Pre-Launch-C5, COST-CONTROLS.md M2.4).
//
// Zweck: Lehrer:innen können VOR der Stunde checken ob alles läuft.
// Zeigt Health-Check (DB-Latenz) + Feature-Flags (welche Module sind
// gerade aus). Kein Auth nötig.
//
// Render: Server-Component die direkt /api/health aufruft (interner
// Same-Origin-Fetch). Cache: no-store damit jeder Reload frisch ist.

export const metadata: Metadata = {
  title: 'Systemstatus — Lernplattform',
  description: 'Live-Status der Lernplattform-Dienste',
};

export const dynamic = 'force-dynamic';

type HealthResponse = {
  status: 'ok' | 'degraded';
  latencyMs: number;
  checks: { db: 'ok' | 'fail' };
};

async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    const h = await headers();
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const host = h.get('host') ?? 'localhost:3000';
    const res = await fetch(`${proto}://${host}/api/health`, { cache: 'no-store' });
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export default async function StatusPage() {
  const health = await fetchHealth();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Systemstatus</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Live-Status der Lernplattform. Aktualisiert sich bei jedem Reload.
      </p>
      <SystemSection health={health} />
      <FeaturesSection />
      <ContactFooter />
    </div>
  );
}

function SystemSection({ health }: { health: HealthResponse | null }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold">Allgemein</h2>
      <ul className="space-y-2">
        <StatusRow
          label="Datenbank"
          ok={health?.checks.db === 'ok'}
          detail={health ? `${health.latencyMs} ms` : 'unbekannt'}
        />
      </ul>
    </section>
  );
}

function FeaturesSection() {
  const flags = {
    quiz: featureFlags.isQuizEnabled(),
    live: featureFlags.isLiveEnabled(),
    studentLogin: featureFlags.isStudentLoginEnabled(),
  };
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold">Features</h2>
      <ul className="space-y-2">
        <StatusRow
          label="Schüler:innen-Login"
          ok={flags.studentLogin}
          detail={flags.studentLogin ? 'verfügbar' : maintenanceMessages.studentLogin.teacher}
        />
        <StatusRow
          label="Live-Quiz"
          ok={flags.quiz}
          detail={flags.quiz ? 'verfügbar' : maintenanceMessages.quiz.teacher}
        />
        <StatusRow
          label="Live-Präsentation"
          ok={flags.live}
          detail={flags.live ? 'verfügbar' : maintenanceMessages.live.teacher}
        />
      </ul>
    </section>
  );
}

function ContactFooter() {
  return (
    <p className="text-muted-foreground text-xs">
      Bei Störung melden:{' '}
      <a href="mailto:geoschlegel@gmail.com" className="underline">
        geoschlegel@gmail.com
      </a>
    </p>
  );
}

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-4 py-3">
      <span className="font-medium">{label}</span>
      <span
        className={`inline-flex items-center gap-2 text-sm ${
          ok ? 'text-emerald-700' : 'text-rose-700'
        }`}
      >
        <span
          aria-hidden
          className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`}
        />
        {detail}
      </span>
    </li>
  );
}
