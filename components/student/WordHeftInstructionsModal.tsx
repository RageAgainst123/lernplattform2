'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Phase Q4: Anleitung-Modal für den ersten Word-Heft-Anlege-Schritt.
// Pragmatisch ohne Screenshots — Text-basierte Schritt-für-Schritt-Anweisung.
// Der KRITISCHE Hinweis ist Schritt 3 (Permission auf "Personen in [Schule]"
// umstellen) — das ist die Standard-Fehlerquelle die wir abfangen wollen.
//
// Click-Outside + Escape schließt das Modal.

export type WordHeftInstructionsModalProps = {
  onClose: () => void;
};

function useEscapeKey(onClose: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
}

const STEPS: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Word öffnen + leeres Dokument erstellen',
    body: (
      <>
        Klick auf <strong>&bdquo;➜ Word in neuem Tab öffnen&ldquo;</strong>. Bei office.com/word
        klick auf <strong>&bdquo;+ Neues leeres Dokument&ldquo;</strong>.
      </>
    ),
  },
  {
    title: 'Datei umbenennen',
    body: (
      <>
        Oben in der Mitte wo &bdquo;Dokument&ldquo; steht — klick drauf, tippe einen klaren Namen
        wie <strong>&bdquo;Mein Schulübungsheft&ldquo;</strong>. Word speichert automatisch in
        deinem OneDrive.
      </>
    ),
  },
  {
    title: 'Auf „Teilen" klicken (blauer Knopf oben rechts)',
    body: (
      <>
        Im Dropdown wähle nochmal <strong>&bdquo;Teilen&ldquo;</strong> (NICHT &bdquo;Link
        kopieren&ldquo;!). Es öffnet sich ein neues Fenster &bdquo;Mein Schulübungsheft.docx
        freigeben&ldquo;.
      </>
    ),
  },
  {
    title: 'Auf das ⚙️-Zahnrad klicken (neben „Link kopieren")',
    body: (
      <>
        Im Fenster siehst du unten einen Button <strong>&bdquo;Link kopieren&ldquo;</strong> und
        rechts daneben ein kleines ⚙️-Symbol. <strong>Klick auf das ⚙️-Symbol</strong>, NICHT auf
        &bdquo;Link kopieren&ldquo;.
      </>
    ),
  },
  {
    title: 'Berechtigung auf „Personen in MS Pitten" stellen — WICHTIG',
    body: (
      <>
        Es öffnet sich <strong>&bdquo;Linkeinstellungen&ldquo;</strong>. Klick auf
        <strong> &bdquo;Personen in MS Pitten&ldquo;</strong> (zweite Option, mit Aktentaschen-
        Symbol). Unten muss <strong>&bdquo;Kann bearbeiten&ldquo;</strong> stehen — so kann deine
        Lehrer:in Kommentare schreiben. Dann <strong>&bdquo;Übernehmen&ldquo;</strong> klicken.
        <br />
        <span className="text-destructive">⚠️ Wichtig:</span> Wenn &bdquo;Von Ihnen ausgewählte
        Personen&ldquo; aktiv bleibt, sieht deine Lehrer:in nichts!
      </>
    ),
  },
  {
    title: 'Jetzt „Link kopieren"',
    body: (
      <>
        Du landest zurück im Freigabe-Fenster. <strong>Jetzt</strong> auf
        <strong> &bdquo;Link kopieren&ldquo;</strong> klicken. Der Link wandert in die
        Zwischenablage.
      </>
    ),
  },
  {
    title: 'Link hier einfügen',
    body: (
      <>
        Wechsle zu diesem Tab zurück, klick
        <strong> &bdquo;🔗 Ich habe schon einen Link&ldquo;</strong>, füge den Link ein und klick{' '}
        <strong>&bdquo;Link speichern&ldquo;</strong>.
      </>
    ),
  },
];

function StepsList() {
  return (
    <ol className="mt-6 flex flex-col gap-5">
      {STEPS.map((step, idx) => (
        <Step key={idx} n={idx + 1} title={step.title} body={step.body} />
      ))}
    </ol>
  );
}

export function WordHeftInstructionsModal({ onClose }: WordHeftInstructionsModalProps) {
  useEscapeKey(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="word-heft-instructions-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="word-heft-instructions-title" className="text-xl font-semibold tracking-tight">
          So legst du dein Word-Heft an
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          7 Schritte. Schritte 4 + 5 sind die wichtigen — sonst kann deine Lehrer:in das Heft nicht
          sehen.
        </p>
        <StepsList />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" onClick={onClose}>
            Verstanden
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="bg-primary text-primary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
      >
        {n}
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        <p className="text-foreground text-sm leading-relaxed">{body}</p>
      </div>
    </li>
  );
}
