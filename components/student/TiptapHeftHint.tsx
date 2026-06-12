import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

// Heft-Hinweis auf der Themen-Detailseite für Code+PIN-Schüler:innen
// (HEFT-CRIT-2): Gegenstück zum WordHeftHint der SSO-Kinder, führt zum
// eingebauten Tiptap-Heft unter /s/heft. Rein präsentational
// (Server-Komponente, kein Client-State nötig).

export function TiptapHeftHint({ topicLabel }: { topicLabel: string }) {
  return (
    <div className="bg-muted/50 flex flex-col gap-2 rounded-md border p-4">
      <p className="font-medium">📓 Tipp: dein Schulheft</p>
      <p className="text-muted-foreground text-sm">
        Notiere dir Wichtiges zu {'„'}
        {topicLabel}
        {'“'} in deinem Schulheft — Notizen, Übungen oder Vorbereitung auf den Abschlusstest.
      </p>
      <Link href="/s/heft" className={buttonVariants({ variant: 'outline' })}>
        📓 Schulheft öffnen
      </Link>
    </div>
  );
}
