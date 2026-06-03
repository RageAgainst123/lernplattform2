'use client';

import { useState } from 'react';
import type { WordHeftLink } from '@/lib/schemas/entities';
import { WordHeftSlotEmpty } from './WordHeftSlotEmpty';
import { WordHeftSlotExisting } from './WordHeftSlotExisting';

// Phase Q (ab Migration 0019): generelles Word-Heft pro Schüler:in.
// Dispatcher-Komponente — wählt Empty- oder Existing-Variante basierend auf
// vorhandenem Link + lokalem "editing"-State (für "Link aktualisieren"-Klick).

export type WordHeftSlotProps = {
  link: WordHeftLink | null;
};

export function WordHeftSlot(props: WordHeftSlotProps) {
  const [editing, setEditing] = useState(false);

  if (!props.link || editing) {
    return <WordHeftSlotEmpty onSaved={() => setEditing(false)} />;
  }

  return (
    <WordHeftSlotExisting
      link={props.link}
      onUpdate={() => setEditing(true)}
      onRemove={() => setEditing(false)}
    />
  );
}
