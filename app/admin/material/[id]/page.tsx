import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getMaterialByIdForAdmin } from '@/lib/db/materials';
import { getModulesForLink } from '@/lib/db/modules';
import { MaterialEditForm } from '@/components/admin/MaterialEditForm';
import { BRAND } from '@/lib/brand';

export default async function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const material = await getMaterialByIdForAdmin(id);
  if (!material) notFound();

  // Modul-Vorschläge: gleiche Stufe (falls gesetzt), Bereich passt oder ist null
  const moduleOptions = material.schulstufe
    ? await getModulesForLink(material.schulstufe, material.kompetenzbereich)
    : [];

  const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/materials/${material.filePath}`;

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Material bearbeiten</h1>
        <p className="text-muted-foreground text-sm">
          PDF:{' '}
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            herunterladen
          </a>
        </p>
      </header>
      {!material.schulstufe && (
        <p className="bg-muted/40 text-muted-foreground rounded-md p-3 text-sm">
          Wähle erst eine Schulstufe + Kompetenzbereich, speichere und kehre zurück — dann erscheint
          die Modul-Verknüpfungs-Liste. {BRAND.shortName}.
        </p>
      )}
      <MaterialEditForm material={material} moduleOptions={moduleOptions} />
    </div>
  );
}
