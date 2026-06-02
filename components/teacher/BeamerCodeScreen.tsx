'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Vollbild-Anzeige des Klassen-Codes für den Beamer. Schüler:innen scannen /
// tippen ihn auf ihrem Gerät. Layout pragmatisch:
//   - Schul-URL gut sichtbar oben („Geh auf …")
//   - Klassen-Code RIESIG in der Mitte (font-mono, monospaced)
//   - Klassenname als Beschriftung
//   - Schließen-Button oben rechts (klein, dezent)
//
// Hydration-Schutz: window.location.origin existiert nur im Browser. Wir
// lesen es via useSyncExternalStore (Server-Snapshot "/k", Client-Snapshot
// volle URL) — React tauscht es nach Hydration sauber aus, ohne Mismatch-
// Warning und ohne setState-in-Effect-Lint-Fehler.

const subscribeNoop = () => () => {};
const getClientLoginUrl = () => `${window.location.origin}/k`;
const getServerLoginUrl = () => '/k';

export function BeamerCodeScreen({ className, joinCode }: { className: string; joinCode: string }) {
  const router = useRouter();
  const loginUrl = useSyncExternalStore(subscribeNoop, getClientLoginUrl, getServerLoginUrl);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-8 py-12 text-center">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
      >
        ✕ Schließen
      </Button>

      <p className="mb-2 text-2xl text-gray-600 sm:text-3xl">{className}</p>
      <p className="mb-12 text-xl text-gray-500 sm:text-2xl">
        Anmelden auf <span className="font-semibold text-gray-900">{loginUrl}</span>
      </p>

      <div className="mb-6 text-lg text-gray-500 sm:text-2xl">Klassen-Code:</div>

      <div className="rounded-3xl border-4 border-gray-900 bg-gray-50 px-12 py-8 shadow-lg sm:px-20 sm:py-12">
        <p className="font-mono text-7xl font-bold tracking-widest text-gray-900 sm:text-9xl">
          {joinCode}
        </p>
      </div>

      <p className="mt-12 max-w-2xl text-base text-gray-500 sm:text-lg">
        Microsoft-Login empfohlen. Wer keinen Schul-Account hat: Klassen-Code eintippen + PIN von
        der Lehrer:in nutzen.
      </p>
    </div>
  );
}
