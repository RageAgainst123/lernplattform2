'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { searchImagesAction } from '@/lib/db/pexels-action';
import type { PexelsImage } from '@/lib/pexels';

// Bild-Picker-Dialog (Phase H2). Modal mit Suchfeld + 3×4 Grid mit
// Thumbnails. Schüler:in tippt eine Suchanfrage → Server Action ruft
// Pexels → 12 Bilder als Grid. Klick auf ein Bild → onPick(image) → der
// NotebookEditor fügt es als Tiptap-Image ein.
//
// Footer: kleine Lizenz-Notiz. Pexels ist frei, aber Attribution ist
// guter Stil und pädagogisch eine Bonus-Lektion (Urheberrecht).

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (image: PexelsImage) => void;
  initialQuery?: string;
};

// Kapselt Such-State + Pexels-Action. Hauptkomponente bleibt unter
// max-lines-per-function durch Auslagerung in diesen Hook.
function useImageSearch() {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<PexelsImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runSearch() {
    const q = query.trim();
    if (!q) {
      setError('Bitte ein Suchwort eingeben.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await searchImagesAction(q);
      if (!result.ok) {
        setError(result.error);
        setImages([]);
        return;
      }
      setImages(result.images);
      if (result.images.length === 0) {
        setError(`Keine Bilder für „${q}“ gefunden. Versuch ein anderes Wort.`);
      }
    });
  }

  return { query, setQuery, images, error, pending, runSearch };
}

export function ImagePickerDialog({ open, onClose, onPick, initialQuery = '' }: Props) {
  const search = useImageSearch();
  // initialQuery (z.B. aus Topic-Keywords) einmalig setzen
  useState(() => {
    if (initialQuery) search.setQuery(initialQuery);
    return null;
  });

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bild auswählen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <DialogBody onClose={onClose} onPick={onPick} search={search} />
    </div>
  );
}

function DialogBody({
  onClose,
  onPick,
  search,
}: {
  onClose: () => void;
  onPick: (image: PexelsImage) => void;
  search: ReturnType<typeof useImageSearch>;
}) {
  return (
    <div
      className="bg-background flex max-h-[85vh] w-full max-w-2xl flex-col gap-3 rounded-lg border p-4 shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <DialogHeader onClose={onClose} />
      <SearchBar
        query={search.query}
        setQuery={search.setQuery}
        onSearch={search.runSearch}
        pending={search.pending}
      />
      {search.error && (
        <p role="alert" className="text-destructive bg-destructive/10 rounded-md p-2 text-sm">
          {search.error}
        </p>
      )}
      <ImageGrid images={search.images} onPick={onPick} pending={search.pending} />
      <p className="text-muted-foreground border-t pt-2 text-center text-xs">
        Bildquelle: Pexels (kostenlos für persönlichen und kommerziellen Einsatz)
      </p>
    </div>
  );
}

function DialogHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">Bild für dein Heft suchen</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Schließen"
        className="text-muted-foreground hover:bg-muted rounded p-1 text-xl"
      >
        ✕
      </button>
    </div>
  );
}

function SearchBar({
  query,
  setQuery,
  onSearch,
  pending,
}: {
  query: string;
  setQuery: (v: string) => void;
  onSearch: () => void;
  pending: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
      className="flex gap-2"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="z.B. Tastatur, Computer, Buch"
        className="border-input bg-background h-9 flex-1 rounded-md border px-3 text-sm"
        autoFocus
      />
      <Button type="submit" disabled={pending}>
        {pending ? 'Suche…' : 'Suchen'}
      </Button>
    </form>
  );
}

function ImageGrid({
  images,
  onPick,
  pending,
}: {
  images: PexelsImage[];
  onPick: (image: PexelsImage) => void;
  pending: boolean;
}) {
  if (images.length === 0 && !pending) {
    return (
      <p className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        Such ein Wort und klick „Suchen“.
      </p>
    );
  }
  return (
    <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
      {images.map((img) => (
        <button
          key={img.id}
          type="button"
          onClick={() => onPick(img)}
          className="hover:ring-primary group bg-muted/40 relative aspect-square overflow-hidden rounded-md border transition hover:ring-2"
          aria-label={`Bild von ${img.photographer}: ${img.alt || 'ohne Beschreibung'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.thumbnail}
            alt={img.alt}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}
