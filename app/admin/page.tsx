import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getModulesForAdminByKind } from '@/lib/db/modules';
import { getMaterialsForAdmin } from '@/lib/db/materials';
import { getTopicsForAdmin } from '@/lib/db/topics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { ACTIVITY_INFO, MATERIAL_AS_ACTIVITY } from '@/lib/activities';

// Admin-Dashboard (Phase E): drei große Karten für die drei Aktivitäts-Typen
// statt einer Liste „Module + Materialien". Jede Karte zeigt Anzahl, kurze
// Beschreibung, Link zur Liste + Direktlink „+ Neu".

type ActivityCardProps = {
  emoji: string;
  label: string;
  plural: string;
  description: string;
  count: number;
  publishedCount: number;
  listHref: string;
  newHref: string;
  newLabel: string;
};

function ActivityCard(props: ActivityCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl" aria-hidden>
              {props.emoji}
            </span>
            {props.plural}
          </CardTitle>
          <span className="text-muted-foreground text-sm tabular-nums">
            {props.count} · {props.publishedCount} live
          </span>
        </div>
        <CardDescription className="text-sm leading-relaxed">{props.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-wrap gap-2 pt-3">
        <Link href={props.listHref} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          {props.plural} ansehen
        </Link>
        <Link href={props.newHref} className={buttonVariants({ size: 'sm' })}>
          {props.newLabel}
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboard() {
  await requireAdmin();
  const [lernmodule, praesentationen, quizze, abschlusstests, materials, topics] =
    await Promise.all([
      getModulesForAdminByKind('lernmodul'),
      getModulesForAdminByKind('praesentation'),
      getModulesForAdminByKind('quiz'),
      getModulesForAdminByKind('abschlusstest'),
      getMaterialsForAdmin(),
      getTopicsForAdmin(),
    ]);
  const publishedTopics = topics.filter((t) => t.isPublished).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Admin-Übersicht</h1>
        <p className="text-muted-foreground text-sm">
          Themen bündeln Aktivitäten zu Lernpfaden. Pro Aktivitäts-Typ gibt es daneben eine eigene
          Liste für die Detail-Bearbeitung.
        </p>
      </header>

      {/* Themen-Hero (Phase G): empfohlener Einstiegspunkt — ein Thema kann mehrere
          Aktivitäten enthalten und Schüler:innen sehen den Lernpfad als Karte. */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-baseline justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl" aria-hidden>
                📚
              </span>
              Themen
            </CardTitle>
            <span className="text-muted-foreground text-sm tabular-nums">
              {topics.length} · {publishedTopics} live
            </span>
          </div>
          <CardDescription className="text-sm leading-relaxed">
            Bündeln Lernmodule, Präsentationen, Quiz und einen Abschlusstest zu einem Lernpfad.
            Empfohlener Einstieg — Schüler:innen sehen Themen-Karten mit Fortschritt im Dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex flex-wrap gap-2 pt-3">
          <Link href="/admin/themen" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Themen ansehen
          </Link>
          <Link href="/admin/themen/neu" className={buttonVariants({ size: 'sm' })}>
            + Neues Thema
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActivityCard
          emoji={MATERIAL_AS_ACTIVITY.iconEmoji}
          label={MATERIAL_AS_ACTIVITY.label}
          plural={MATERIAL_AS_ACTIVITY.plural}
          description={MATERIAL_AS_ACTIVITY.description}
          count={materials.length}
          publishedCount={materials.length /* materials kennen kein draft-Konzept */}
          listHref="/admin/material"
          newHref="/admin/material/neu"
          newLabel="+ Neues Arbeitsblatt"
        />
        <ActivityCard
          emoji={ACTIVITY_INFO.lernmodul.iconEmoji}
          label={ACTIVITY_INFO.lernmodul.label}
          plural={ACTIVITY_INFO.lernmodul.plural}
          description={ACTIVITY_INFO.lernmodul.description}
          count={lernmodule.length}
          publishedCount={lernmodule.filter((m) => m.isPublished).length}
          listHref="/admin/lernmodule"
          newHref="/admin/lernmodule/neu"
          newLabel="+ Neues Lernmodul"
        />
        <ActivityCard
          emoji={ACTIVITY_INFO.quiz.iconEmoji}
          label={ACTIVITY_INFO.quiz.label}
          plural={ACTIVITY_INFO.quiz.plural}
          description={ACTIVITY_INFO.quiz.description}
          count={quizze.length}
          publishedCount={quizze.filter((m) => m.isPublished).length}
          listHref="/admin/quizze"
          newHref="/admin/quizze/neu"
          newLabel="+ Neues Quiz"
        />
        <ActivityCard
          emoji={ACTIVITY_INFO.abschlusstest.iconEmoji}
          label={ACTIVITY_INFO.abschlusstest.label}
          plural={ACTIVITY_INFO.abschlusstest.plural}
          description={ACTIVITY_INFO.abschlusstest.description}
          count={abschlusstests.length}
          publishedCount={abschlusstests.filter((m) => m.isPublished).length}
          listHref="/admin/abschlusstests"
          newHref="/admin/abschlusstests/neu"
          newLabel="+ Neuer Abschlusstest"
        />
        <ActivityCard
          emoji={ACTIVITY_INFO.praesentation.iconEmoji}
          label={ACTIVITY_INFO.praesentation.label}
          plural={ACTIVITY_INFO.praesentation.plural}
          description={ACTIVITY_INFO.praesentation.description}
          count={praesentationen.length}
          publishedCount={praesentationen.filter((m) => m.isPublished).length}
          listHref="/admin/praesentationen"
          newHref="/admin/praesentationen/neu"
          newLabel="+ Neue Präsentation"
        />
      </div>
    </div>
  );
}
