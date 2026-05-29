import { requireAdmin } from '@/lib/auth/admin-auth';
import { MaterialUploadForm } from '@/components/admin/MaterialUploadForm';

export default async function NewMaterialPage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Neues Material</h1>
        <p className="text-muted-foreground text-sm">
          PDF hochladen und mit Stufe/Bereich/Thema versehen. Verknüpfung mit einem Modul folgt auf
          der Detailseite nach dem Upload.
        </p>
      </header>
      <MaterialUploadForm />
    </div>
  );
}
