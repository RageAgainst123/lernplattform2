'use client';

import { useRef, useState, useTransition } from 'react';
import { uploadHotspotImage } from '@/lib/db/hotspot-image-actions';
import { Button } from '@/components/ui/button';
import { HotspotPexelsPicker } from './hotspot-image-picker';

// Bildquelle-Leiste des Hotspot-Editors: Upload-Button + Pexels-Suche. Kapselt
// den Upload-Transition. Ausgelagert aus HotspotForm (Zeilen-Grenze).
export function ImageSourceBar({ onPicked }: { onPicked: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pexelsOpen, setPexelsOpen] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    start(async () => {
      try {
        const { url } = await uploadHotspotImage(file);
        onPicked(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen.');
      }
    });
    e.target.value = '';
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          {pending ? 'Lädt hoch…' : '⬆ Bild hochladen'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setPexelsOpen(true)}>
          🔍 Pexels durchsuchen
        </Button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <HotspotPexelsPicker
        open={pexelsOpen}
        onClose={() => setPexelsOpen(false)}
        onPick={(url) => {
          onPicked(url);
          setPexelsOpen(false);
        }}
      />
    </div>
  );
}
