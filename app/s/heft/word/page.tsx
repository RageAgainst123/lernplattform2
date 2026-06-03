import Link from 'next/link';
import type { Metadata } from 'next';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getStudentIdentityById } from '@/lib/db/student-login';
import { getWordHeftLinkForStudent } from '@/lib/db/word-heft-links';
import { WordHeftSlot } from '@/components/student/WordHeftSlot';

// Phase Q (ab Migration 0019): zentrale Seite fürs Schulübungsheft.
// O365-Schüler:innen sehen WordHeftSlot (Word-OneDrive-Variante).
// Code+PIN-Schüler:innen werden weitergeleitet auf /s/heft (Tiptap).

export const metadata: Metadata = {
  title: 'Mein Schulübungsheft',
};

export default async function MyWordHeftPage() {
  const session = await requireStudentSession();
  const [identity, link] = await Promise.all([
    getStudentIdentityById(session.studentCodeId),
    getWordHeftLinkForStudent(session.studentCodeId),
  ]);
  const isSso = Boolean(identity?.o365Email);

  if (!isSso) {
    // Code+PIN-Schüler:innen haben kein Word-Heft, sondern Tiptap. Hinweis.
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10">
        <Link href="/s" className="text-muted-foreground text-sm hover:underline">
          ← Zurück
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Mein Schulübungsheft</h1>
        <p className="text-muted-foreground">
          Das Word-Schulübungsheft steht nur Schüler:innen zur Verfügung, die sich mit ihrem
          Microsoft-Schul-Konto angemeldet haben.{' '}
          <Link href="/s/heft" className="text-primary hover:underline">
            Zum Tiptap-Heft
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10">
      <Link href="/s" className="text-muted-foreground text-sm hover:underline">
        ← Zurück
      </Link>
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span aria-hidden>📓</span>
          Mein Schulübungsheft
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Dein generelles Heft für alle Themen. Liegt in deinem OneDrive, du kannst es überall
          öffnen — auch zuhause.
        </p>
      </header>
      <WordHeftSlot link={link} />
    </div>
  );
}
