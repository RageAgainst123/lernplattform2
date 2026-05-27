import type { PublicMaterial } from '@/lib/db/public-content';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TYPE_LABEL: Record<PublicMaterial['materialType'], string> = {
  theorie: 'Theorie',
  arbeitsblatt: 'Arbeitsblatt',
  loesung: 'Lösung',
  stundenbild: 'Stundenbild',
};

export function MaterialItem({ material }: { material: PublicMaterial }) {
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
      <div className="px-6 pb-6">
        <a
          href={`${material.fileUrl}?download`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          PDF herunterladen
        </a>
      </div>
    </Card>
  );
}
