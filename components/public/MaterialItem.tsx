import Link from 'next/link';
import type { PublicMaterial } from '@/lib/db/public-content';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TYPE_LABEL: Record<PublicMaterial['materialType'], string> = {
  theorie: 'Theorie',
  arbeitsblatt: 'Arbeitsblatt',
  loesung: 'Lösung',
  stundenbild: 'Stundenbild',
};

type Props = {
  material: PublicMaterial;
  // Wenn true (Schüler:in eingeloggt) UND material.relatedModuleId gesetzt:
  // zeige zusätzlich „Online ausfüllen"-Button.
  studentLoggedIn?: boolean;
};

export function MaterialItem({ material, studentLoggedIn = false }: Props) {
  const canFillOnline = studentLoggedIn && material.relatedModuleId;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-lg">
          {material.title}
          <span className="text-muted-foreground text-xs font-normal">
            {TYPE_LABEL[material.materialType]}
          </span>
        </CardTitle>
        {material.description && <CardDescription>{material.description}</CardDescription>}
      </CardHeader>
      <div className="flex flex-wrap items-center gap-2 px-6 pb-6">
        <a
          href={`${material.fileUrl}?download`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          PDF herunterladen
        </a>
        {canFillOnline && (
          <Link
            href={`/s/modul/${material.relatedModuleId}`}
            className={buttonVariants({ size: 'sm' })}
          >
            ✏️ Online ausfüllen
          </Link>
        )}
        {!studentLoggedIn && material.relatedModuleId && (
          <span className="text-muted-foreground text-xs">
            🔒 Mit Klassencode anmelden, um online auszufüllen
          </span>
        )}
      </div>
    </Card>
  );
}
