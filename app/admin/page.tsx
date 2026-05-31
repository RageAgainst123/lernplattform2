import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getModulesForAdminByKind } from '@/lib/db/modules';
import { getMaterialsForAdmin } from '@/lib/db/materials';
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
  const [lernmodule, praesentationen, materials] = await Promise.all([
    getModulesForAdminByKind('lernmodul'),
    getModulesForAdminByKind('praesentation'),
    getMaterialsForAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Admin-Übersicht</h1>
        <p className="text-muted-foreground text-sm">
          Drei Wege Inhalte zu erstellen — wähle den passenden Typ für deinen Unterricht.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
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
