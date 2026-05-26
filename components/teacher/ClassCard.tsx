import Link from 'next/link';
import type { Class } from '@/lib/schemas/entities';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ClassCard({ schoolClass }: { schoolClass: Class }) {
  return (
    <Link href={`/lehrer/klassen/${schoolClass.id}`} className="block">
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader>
          <CardTitle>{schoolClass.name}</CardTitle>
          <CardDescription>
            {schoolClass.schulstufe
              ? `${schoolClass.schulstufe}. Schulstufe`
              : 'Keine Schulstufe angegeben'}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
