'use client';

import type { MemoryBlock } from '@/lib/schemas/blocks';
import { ImageSourceBar } from './hotspot-image-source-bar';
import { TextInput } from './form-helpers';

// Editor für EINE Memory-Karte (Seite a oder b eines Paares). Umschalter
// Text ↔ Bild: eine Karte trägt genau text ODER imageUrl (Schema superRefine).
// Ausgelagert, damit MemoryForm unter der Zeilen-Grenze bleibt.

type Card = MemoryBlock['pairs'][number]['a'];

export function MemoryCardField({
  idBase,
  label,
  card,
  onChange,
}: {
  idBase: string;
  label: string;
  card: Card;
  onChange: (next: Card) => void;
}) {
  const isImage = card.imageUrl !== undefined;
  return (
    <div className="flex-1 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        <button
          type="button"
          onClick={() => onChange(isImage ? { text: '' } : { imageUrl: '' })}
          className="text-muted-foreground hover:text-foreground text-xs underline"
        >
          {isImage ? '→ Text' : '→ Bild'}
        </button>
      </div>
      {isImage ? (
        <div className="space-y-1">
          {card.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.imageUrl} alt="" className="max-h-16 rounded border object-contain" />
          ) : (
            <ImageSourceBar onPicked={(url) => onChange({ imageUrl: url })} />
          )}
          {card.imageUrl && (
            <button
              type="button"
              onClick={() => onChange({ imageUrl: '' })}
              className="text-muted-foreground hover:text-foreground text-xs underline"
            >
              Bild ersetzen
            </button>
          )}
        </div>
      ) : (
        <TextInput
          id={idBase}
          value={card.text ?? ''}
          onChange={(v) => onChange({ text: v })}
          placeholder={label}
        />
      )}
    </div>
  );
}
