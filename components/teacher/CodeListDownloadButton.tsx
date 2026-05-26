'use client';

import { useState } from 'react';
import type { GeneratedCode } from '@/lib/db/student-code-actions';
import { Button } from '@/components/ui/button';

type Props = { className: string; codes: GeneratedCode[] };

// Erzeugt das PDF erst beim Klick (dynamischer Import der ~500 KB schweren
// react-pdf-Lib → kein Modul-Top-Level-Import, Turbopack-/SSR-sicher, lädt nur
// bei Bedarf). Die Klartext-PINs bleiben im Browser, kein Server-Roundtrip.
export function CodeListDownloadButton({ className, codes }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { CodeListPdf } = await import('@/components/teacher/CodeListPdf');
      const blob = await pdf(<CodeListPdf className={className} codes={codes} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${className.replace(/[^a-zA-Z0-9]+/g, '-')}-codes.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleDownload} disabled={busy}>
      {busy ? 'PDF wird erstellt …' : 'Als PDF herunterladen'}
    </Button>
  );
}
