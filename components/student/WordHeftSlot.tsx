'use client';

import { useState } from 'react';
import type { WordHeftLink } from '@/lib/schemas/entities';
import { WordHeftSlotEmpty } from './WordHeftSlotEmpty';
import { WordHeftSlotExisting } from './WordHeftSlotExisting';

// Phase Q4: Word-Heft-Slot auf der Schüler:innen-Thema-Seite.
// Dispatcher-Komponente — wählt Empty- oder Existing-Variante basierend auf
// vorhandenem Link + lokalem "editing"-State (für "Link aktualisieren"-Klick).

export type WordHeftSlotProps = {
  topicId: string;
  topicLabel: string;
  link: WordHeftLink | null;
};

export function WordHeftSlot(props: WordHeftSlotProps) {
  const [editing, setEditing] = useState(false);

  if (!props.link || editing) {
    return (
      <WordHeftSlotEmpty
        topicId={props.topicId}
        topicLabel={props.topicLabel}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <WordHeftSlotExisting
      link={props.link}
      topicLabel={props.topicLabel}
      onUpdate={() => setEditing(true)}
      onRemove={() => setEditing(false)}
    />
  );
}
