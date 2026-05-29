import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getModulesForAdmin } from '@/lib/db/modules';
import { getMaterialsForAdmin } from '@/lib/db/materials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {sub && <CardContent className="text-muted-foreground pt-0 text-sm">{sub}</CardContent>}
    </Card>
  );
}

export default async function AdminDashboard() {
  await requireAdmin();
  const [modules, materials] = await Promise.all([getModulesForAdmin(), getMaterialsForAdmin()]);
  const publishedCount = modules.filter((m) => m.isPublished).length;
  const draftCount = modules.length - publishedCount;
  const linkedCount = materials.filter((m) => m.relatedModuleId).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Admin-Übersicht</h1>
        <p className="text-muted-foreground text-sm">
          Hier verwaltest du alle Module und Materialien der Plattform.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Module"
          value={modules.length}
          sub={`${publishedCount} veröffentlicht · ${draftCount} Entwurf`}
        />
        <StatCard
          label="Materialien"
          value={materials.length}
          sub={`${linkedCount} mit Modul verknüpft`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/module/neu" className={buttonVariants()}>
          + Neues Modul
        </Link>
        <Link href="/admin/material/neu" className={buttonVariants({ variant: 'outline' })}>
          + Neues Material
        </Link>
      </div>
    </div>
  );
}
