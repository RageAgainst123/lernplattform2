'use client';

import { useEffect, useState } from 'react';
import { shuffle } from '@/lib/blocks/fill-blank';

// Mischt eine Liste Items hydration-sicher. INITIAL liefert der Hook die
// items in Original-Reihenfolge — identisch zum Server-Render → keine
// React-Hydration-Warnung. NACH dem Mount läuft useEffect und ersetzt sie
// durch eine zufällig gemischte Variante.
//
// Hintergrund: shuffle() nutzt Math.random(); ein direkter Aufruf im Render
// (auch in useMemo) produziert unterschiedliche Reihenfolgen auf Server und
// Client → React verwirft den Tree und beklagt einen Hydration-Mismatch.

export function useShuffled<T>(items: T[]): T[] {
  const [shuffled, setShuffled] = useState<T[]>(items);
  useEffect(() => {
    // setState in useEffect ist HIER absichtlich: nach dem Mount soll die
    // Reihenfolge gemischt werden. Der eslint-Hinweis warnt vor Effects, die
    // State setzen — dieses Pattern ist aber der Standardweg, um
    // Hydration-Mismatches mit Math.random() zu vermeiden (Server liefert
    // unshuffled, Client mischt nach Mount).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShuffled(shuffle(items));
  }, [items]);
  return shuffled;
}
