import Link from 'next/link';
import type { AssignedModule } from '@/lib/db/student-modules';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ModuleCard({ module }: { module: AssignedModule }) {
  return (
    <Link href={`/s/modul/${module.id}`} className="block">
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-xl">
            {module.title}
            {module.completed && <span className="text-base text-green-600">✓ geschafft</span>}
          </CardTitle>
          {module.description && <CardDescription>{module.description}</CardDescription>}
        </CardHeader>
      </Card>
    </Link>
  );
}
