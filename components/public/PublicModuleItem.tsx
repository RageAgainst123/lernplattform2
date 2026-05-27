import type { PublicModule } from '@/lib/db/public-content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Modul-Karte im öffentlichen Bereich: sichtbar, aber nicht durchklickbar.
// Hinweis, dass eine Lehrkraft es der Klasse zuweisen kann.
export function PublicModuleItem({ module }: { module: PublicModule }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{module.title}</CardTitle>
        {module.description && <CardDescription>{module.description}</CardDescription>}
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Interaktives Modul. Als Lehrkraft anmelden, um es einer Klasse zuzuweisen.
      </CardContent>
    </Card>
  );
}
