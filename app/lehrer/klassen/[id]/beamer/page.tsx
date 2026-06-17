import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/teacher-auth';
import { getClass } from '@/lib/db/classes';
import { BeamerCodeScreen } from '@/components/teacher/BeamerCodeScreen';

// Beamer-Modus: groß-formatige Klassen-Code-Anzeige für den Stunden-Einstieg.
// Lehrer:in wirft den Browser an den Beamer, Schüler:innen sehen Code und
// Login-URL groß. Kein Header, kein Chrome — pure Fokus-Anzeige.

export const metadata: Metadata = {
  title: 'Klassen-Code (Beamer)',
};

export default async function BeamerCodePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const schoolClass = await getClass(id);
  if (!schoolClass) notFound();

  return <BeamerCodeScreen className={schoolClass.name} joinCode={schoolClass.joinCode} />;
}
