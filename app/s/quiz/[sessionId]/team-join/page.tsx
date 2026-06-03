import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getQuizBannerForStudent } from '@/lib/db/quiz-sessions';
import { TeamJoinForm } from '@/components/student/TeamJoinForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Team beitreten — Quiz',
};

// Schüler:innen-Team-Beitritt für Team-Modus-Quizzes (Spec §7.3).
// Eine Schüler:in pro Team-Gerät loggt sich ein und wählt hier den
// Teamnamen. Andere Team-Mitglieder schauen am selben Gerät zu (siehe
// QUIZ-MODI-SPEZIFIKATION.md §7.1 — physische Voraussetzung).

export default async function TeamJoinPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const session = await requireStudentSession();
  await params;
  const banner = await getQuizBannerForStudent(session.classId, session.studentCodeId);

  if (!banner) redirect('/s');
  if (!banner.teamMode) {
    // Non-Team-Session → kein Team-Join nötig. Auf Banner-Seite zurück.
    redirect('/s');
  }
  if (banner.alreadyJoined) {
    redirect(`/s/quiz/${banner.sessionId}`);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🤝 Team beitreten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Quiz: <span className="font-medium">{banner.moduleTitle}</span>
          </p>
          <p className="text-muted-foreground text-xs">
            Bildet eine Gruppe von 2–4 Spieler:innen. Eine Person tippt für euer Team.
          </p>
          <TeamJoinForm sessionId={banner.sessionId} />
        </CardContent>
      </Card>
    </div>
  );
}
