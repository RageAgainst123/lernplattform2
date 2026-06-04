import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser, isAzureLogin } from '@/lib/auth/teacher-auth';
import { getClass } from '@/lib/db/classes';
import { getStudentCodes } from '@/lib/db/student-codes';
import { isPresentationLiveForTeacher } from '@/lib/db/live-sessions';
import { getAssignedModulesForClass } from '@/lib/db/class-modules';
import { getPublishedModulesAll } from '@/lib/db/modules';
import { getWordHeftLinksForClass } from '@/lib/db/word-heft-links';
import { getAssignedTopicsForClass, getPublishedTopicsAll } from '@/lib/db/class-topics';
import type { Class } from '@/lib/schemas/entities';
import { JoinCodeHint } from '@/components/teacher/JoinCodeHint';
import { LiveSessionBanner } from '@/components/teacher/LiveSessionBanner';
import {
  StudentCodesCard,
  TopicsSection,
  OrphansSection,
  WordHeftSection,
  DangerZone,
} from '@/components/teacher/KlasseDetailSections';

export const metadata: Metadata = {
  title: 'Klasse — Lernplattform',
};

function ClassHeader({ schoolClass }: { schoolClass: Class }) {
  return (
    <>
      <Link href="/lehrer/klassen" className="text-muted-foreground text-sm hover:underline">
        ← Zurück zu den Klassen
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{schoolClass.name}</h1>
          <p className="text-muted-foreground text-sm">
            {schoolClass.schulstufe
              ? `${schoolClass.schulstufe}. Schulstufe`
              : 'Keine Schulstufe angegeben'}
          </p>
        </div>
        <Link
          href={`/lehrer/klassen/${schoolClass.id}/fortschritt`}
          className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50"
        >
          <span aria-hidden>📊</span>
          Fortschritt der Klasse
        </Link>
      </div>
      <JoinCodeHint joinCode={schoolClass.joinCode} classId={schoolClass.id} />
    </>
  );
}

async function loadKlasseData(classId: string) {
  const [
    codes,
    assignedModules,
    availableModules,
    isLive,
    topicsData,
    availableTopics,
    wordHeftLinks,
  ] = await Promise.all([
    getStudentCodes(classId),
    getAssignedModulesForClass(classId),
    getPublishedModulesAll(),
    isPresentationLiveForTeacher(classId),
    getAssignedTopicsForClass(classId),
    getPublishedTopicsAll(),
    getWordHeftLinksForClass(classId),
  ]);

  const orphanModuleIds = new Set(topicsData.orphanModules.map((m) => m.moduleId));
  const orphanFullAssigned = assignedModules.filter((m) => orphanModuleIds.has(m.moduleId));

  return {
    codes,
    availableModules,
    isLive,
    topicsData,
    availableTopics,
    wordHeftLinks,
    orphanFullAssigned,
  };
}

export default async function KlasseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const schoolClass = await getClass(id);
  if (!schoolClass) notFound();
  const data = await loadKlasseData(schoolClass.id);
  const isTeacherSsoAuth = isAzureLogin(user);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <ClassHeader schoolClass={schoolClass} />
      {data.isLive && <LiveSessionBanner classId={schoolClass.id} />}
      <StudentCodesCard classId={schoolClass.id} className={schoolClass.name} codes={data.codes} />
      <TopicsSection
        classId={schoolClass.id}
        topics={data.topicsData.topics}
        availableTopics={data.availableTopics}
      />
      <OrphansSection
        classId={schoolClass.id}
        orphanModules={data.topicsData.orphanModules}
        available={data.availableModules}
        fullAssigned={data.orphanFullAssigned}
      />
      <WordHeftSection
        codes={data.codes}
        links={data.wordHeftLinks}
        isTeacherSsoAuth={isTeacherSsoAuth}
      />
      <DangerZone classId={schoolClass.id} className={schoolClass.name} />
    </div>
  );
}
