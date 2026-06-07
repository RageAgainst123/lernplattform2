import type { BlockType } from '@/lib/schemas/blocks';

// Zentrale Konstanten für die drei Aktivitäts-Typen der Plattform. Single Source
// of Truth für Labels, URLs, Beschreibungen und welche Block-Typen pro Aktivität
// erlaubt sind. Pattern wie lib/brand.ts und lib/curriculum.ts.
//
// Konzept (siehe Phase E im Plan): drei eigenständige Aktivitäten mit klaren
// User-sichtbaren Begriffen, getrennten Admin-Routen, sauberer Daten-Trennung.
//   1. Arbeitsblatt   → lebt in materials-Tabelle (PDF-Upload, kein Login nötig)
//   2. Lernmodul      → modules-Tabelle, activity_kind='lernmodul'
//                        Display-Sub-Variante: display_mode='quiz' | 'worksheet'
//   3. Präsentation   → modules-Tabelle, activity_kind='praesentation'
//                        Display-Sub-Variante existiert hier nicht
//
// Arbeitsblatt ist KEIN activity_kind im DB-Sinn (lebt in einer anderen Tabelle),
// wird im UI aber als gleichberechtigte dritte Aktivität dargestellt — siehe
// MATERIAL_AS_ACTIVITY unten.

// ─── DB-seitige Diskriminator-Werte (CHECK constraint in Migration 0012/0013) ──
// Phase G erweitert die Union um 'quiz' (Live-Quiz ohne Konsequenzen) und
// 'abschlusstest' (Themen-Abschluss mit Voraussetzungs-Check).
export const ACTIVITY_KINDS = ['lernmodul', 'praesentation', 'quiz', 'abschlusstest'] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

// ─── Anzeige-Informationen pro Aktivität ──────────────────────────────────
type ActivityInfo = {
  label: string;
  plural: string;
  urlSegment: string; // wird zu /admin/<segment>
  description: string;
  iconEmoji: string; // Platzhalter bis ein Icon-System eingeführt wird
};

export const ACTIVITY_INFO: Record<ActivityKind, ActivityInfo> = {
  lernmodul: {
    label: 'Lernmodul',
    plural: 'Lernmodule',
    urlSegment: 'lernmodule',
    description:
      'Online-Übung für eingeloggte Schüler:innen — Block-für-Block mit Sofort-Feedback ' +
      '(Quiz) oder als Arbeitsblatt mit Abgabe an die Lehrer:in.',
    iconEmoji: '📝',
  },
  praesentation: {
    label: 'Präsentation',
    plural: 'Präsentationen',
    urlSegment: 'praesentationen',
    description:
      'Live am Beamer mit Schüler:innen-Geräten — Folien, Live-Umfragen, Quiz, Wortwolken, ' +
      'Verständnis-Ampel. Lehrer:in steuert, Kinder stimmen am Handy/Tablet ab.',
    iconEmoji: '🎬',
  },
  quiz: {
    label: 'Quiz',
    plural: 'Quizze',
    urlSegment: 'quizze',
    description:
      'Test-Wissen ohne Konsequenzen — Block-für-Block mit Sofort-Feedback, kein Score zählt. ' +
      'Zwischen Lernmodulen einsetzbar für lockere Selbstkontrolle.',
    iconEmoji: '🧠',
  },
  abschlusstest: {
    label: 'Abschlusstest',
    plural: 'Abschlusstests',
    urlSegment: 'abschlusstests',
    description:
      'Themen-Abschluss — alle Lernmodule des Themas müssen vorher erledigt sein. ' +
      'Pro Thema maximal einer. Schaltet sich automatisch frei.',
    iconEmoji: '🏆',
  },
};

// Arbeitsblatt ist konzeptionell eine Aktivität, lebt aber in der materials-
// Tabelle (PDF-Upload). Eigene Konstante, damit das UI sie gleichberechtigt
// neben den activity_kinds anzeigen kann.
export const MATERIAL_AS_ACTIVITY: ActivityInfo = {
  label: 'Arbeitsblatt',
  plural: 'Arbeitsblätter',
  urlSegment: 'arbeitsblaetter',
  description:
    'PDF zum Drucken und Verteilen. Wird im öffentlichen Bereich zum Download ' +
    'angeboten — Kinder brauchen keinen Login. Optional mit einem Lernmodul verknüpfbar.',
  iconEmoji: '📄',
};

// ─── Block-Filter pro Aktivität ───────────────────────────────────────────
// Welche Block-Typen darf der Autor in welcher Aktivität verwenden? Lernmodule
// haben Worksheet-Aufgaben + Theorie (ohne slide), Präsentationen haben Live-
// Blöcke + Theorie (mit slide). Der AddBlockDialog filtert auf dieser Basis,
// das Validate-Script nutzt dieselbe Logik für die Mix-Warnung.

const LERNMODUL_BLOCKS: ReadonlySet<BlockType> = new Set([
  // Theorie ohne slide (slide ist nur am Beamer sinnvoll)
  'text',
  'infobox',
  // Worksheet-Aufgaben
  'multiple_choice',
  'true_false',
  'fill_blank',
  'match',
  'categorize',
  'mark_words',
  'order',
  'reflection',
]);

const PRAESENTATION_BLOCKS: ReadonlySet<BlockType> = new Set([
  // Theorie inklusive Folien
  'text',
  'infobox',
  'slide',
  // Live-Interaktionen
  'live_poll',
  'quiz_poll',
  'word_cloud',
  'scale',
  'understanding',
]);

// Quiz und Abschlusstest erlauben nur Aufgaben-Blöcke (keine Theorie, kein
// Live-Interaktion). Dieselbe Menge — Unterschied liegt in der Semantik
// (Quiz = ohne Konsequenz, Abschlusstest = Themen-Abschluss mit Voraussetzungen),
// nicht in den erlaubten Blöcken.
const TEST_BLOCKS: ReadonlySet<BlockType> = new Set([
  'multiple_choice',
  'true_false',
  'fill_blank',
  'match',
  'categorize',
]);

const ALLOWED_BLOCKS_BY_KIND: Record<ActivityKind, ReadonlySet<BlockType>> = {
  lernmodul: LERNMODUL_BLOCKS,
  praesentation: PRAESENTATION_BLOCKS,
  quiz: TEST_BLOCKS,
  abschlusstest: TEST_BLOCKS,
};

export function isBlockAllowedFor(blockType: BlockType, activity: ActivityKind): boolean {
  return ALLOWED_BLOCKS_BY_KIND[activity].has(blockType);
}
