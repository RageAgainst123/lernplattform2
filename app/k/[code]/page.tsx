import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClassByJoinCode, getCodenamesForClass } from '@/lib/db/student-login';
import { StudentLoginForm } from '@/components/student/StudentLoginForm';

export const metadata: Metadata = {
  title: 'Anmelden',
};

export default async function StudentLoginPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const schoolClass = await getClassByJoinCode(code);

  if (!schoolClass) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Code nicht gefunden</CardTitle>
            <CardDescription>
              Bitte überprüfe den Code, den du von deiner Lehrkraft bekommen hast.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const codenames = await getCodenamesForClass(schoolClass.id);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Hallo!</CardTitle>
          <CardDescription className="text-base">
            Du meldest dich für {schoolClass.name} an. Wähle deinen Namen und gib deine PIN ein.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentLoginForm joinCode={code} codenames={codenames} />
        </CardContent>
      </Card>
    </main>
  );
}
