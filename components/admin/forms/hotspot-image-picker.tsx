'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { searchHotspotImages } from '@/lib/db/hotspot-image-actions';
import type { PexelsImage } from '@/lib/pexels';

// Pexels-Bild-Picker für den Hotspot-Editor (Admin). Eigenständig statt
// ImagePickerDialog (das verlangt eine Schüler:innen-Session) — ruft die
// admin-geschützte searchHotspotImages. Klick auf ein Bild → onPick(url).

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
};

function useSearch() {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<PexelsImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  function run() {
    const q = query.trim();
    if (!q) return;
    setError(null);
    start(async () => {
      const res = await searchHotspotImages(q);
      if (!res.ok) {
        setError(res.error);
        setImages([]);
        return;
      }
      setImages(res.images);
      if (res.images.length === 0) setError(`Keine Bilder für „${q}".`);
    });
  }
  return { query, setQuery, images, error, pending, run };
}

export function HotspotPexelsPicker({ open, onClose, onPick }: Props) {
  const s = useSearch();
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bild über Pexels suchen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background flex max-h-[85vh] w-full max-w-2xl flex-col gap-3 rounded-lg border p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Bild über Pexels suchen</h2>
          <button type="button" onClick={onClose} aria-label="Schließen" className="text-xl">
            ✕
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            s.run();
          }}
          className="flex gap-2"
        >
          <input
            type="search"
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            placeholder="z.B. Tastatur, Browser, Stadtplan"
            className="border-input bg-background h-9 flex-1 rounded-md border px-3 text-sm"
            autoFocus
          />
          <Button type="submit" disabled={s.pending}>
            {s.pending ? 'Suche…' : 'Suchen'}
          </Button>
        </form>
        {s.error && <p className="text-destructive text-sm">{s.error}</p>}
        <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
          {s.images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onPick(img.full)}
              className="hover:ring-primary bg-muted/40 relative aspect-square overflow-hidden rounded-md border hover:ring-2"
              aria-label={`Bild von ${img.photographer}: ${img.alt || 'ohne Beschreibung'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbnail}
                alt={img.alt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
        <p className="text-muted-foreground border-t pt-2 text-center text-xs">
          Bildquelle: Pexels (kostenlos für persönlichen und kommerziellen Einsatz)
        </p>
      </div>
    </div>
  );
}
