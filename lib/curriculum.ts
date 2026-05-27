import type { Kompetenzbereich } from '@/lib/schemas/entities';

// Lehrplan-Struktur Digitale Grundbildung (österr. Sekundarstufe I).
// Labels/Beschreibungen sind ein erster Entwurf — können fachlich verfeinert werden.

export const SEKUNDARSTUFE = [5, 6, 7, 8] as const;
export type Sekundarstufe = (typeof SEKUNDARSTUFE)[number];

// Reihenfolge der Kompetenzbereiche (Anzeige-Reihenfolge im Lehrplan).
export const KOMPETENZBEREICHE: Kompetenzbereich[] = [
  'orientierung',
  'information',
  'kommunikation',
  'produktion',
  'handeln',
];

type BereichInfo = { label: string; description: string };

export const KOMPETENZBEREICH_INFO: Record<Kompetenzbereich, BereichInfo> = {
  orientierung: {
    label: 'Orientierung',
    description: 'Wie funktionieren digitale Geräte und Systeme?',
  },
  information: {
    label: 'Information',
    description: 'Mit Daten und Informationen verantwortungsvoll umgehen.',
  },
  kommunikation: {
    label: 'Kommunikation',
    description: 'Digital kommunizieren und zusammenarbeiten.',
  },
  produktion: {
    label: 'Produktion',
    description: 'Eigene digitale Inhalte gestalten und erstellen.',
  },
  handeln: {
    label: 'Handeln',
    description: 'Sicher, kritisch und selbstbestimmt im digitalen Raum.',
  },
};

// Prüft, ob ein String ein gültiger Kompetenzbereich-Slug ist (für Routen-Parameter).
export function isKompetenzbereich(value: string): value is Kompetenzbereich {
  return (KOMPETENZBEREICHE as string[]).includes(value);
}

// Prüft, ob eine Zahl eine gültige Sekundarstufe ist (für Routen-Parameter).
export function isSekundarstufe(value: number): value is Sekundarstufe {
  return (SEKUNDARSTUFE as readonly number[]).includes(value);
}
