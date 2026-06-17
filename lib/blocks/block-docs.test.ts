import { describe, expect, it } from 'vitest';
import { blockSchema, moduleContentStrictSchema, type BlockType } from '@/lib/schemas/blocks';
import { blockGradedness } from '@/lib/blocks/evaluate';
import { publishGateIssues } from '@/lib/schemas/blocks-refine';
import { BLOCK_DOCS, type BlockGroup } from '@/lib/blocks/block-docs';
import { BLOCK_CATALOG } from '@/components/admin/block-catalog';

// B2 (docs/AI-AUTHORING-DX.md §2): die Doku-Registry muss VOLLSTÄNDIG bleiben
// (jeder Block-Typ ein Eintrag) und KONSISTENT mit dem Code sein (group ==
// Katalog-Gruppe, graded == echte Scoring-Klassifikation, example schema-gültig).
// Vergisst jemand bei einem neuen Block-Typ den Registry-Eintrag, wird der Test
// rot — Drift unmöglich.

const ALL_TYPES = blockSchema.options.map((o) => (o.shape.type as { value: BlockType }).value);

// Katalog-Gruppe (theory/worksheet/live) pro Typ — Erwartungswert für doc.group.
const CATALOG_GROUP = new Map<BlockType, BlockGroup>();
for (const group of ['theory', 'worksheet', 'live'] as const) {
  for (const entry of BLOCK_CATALOG[group]) CATALOG_GROUP.set(entry.type, group);
}

describe('BLOCK_DOCS (B2-Registry)', () => {
  it('hat genau einen Eintrag pro Block-Typ (keine fehlenden/verwaisten)', () => {
    expect(Object.keys(BLOCK_DOCS).sort()).toEqual([...ALL_TYPES].sort());
  });

  for (const type of ALL_TYPES) {
    describe(type, () => {
      const doc = BLOCK_DOCS[type];

      it('Schlüssel und example.type stimmen mit dem Typ überein', () => {
        expect(doc.type).toBe(type);
        expect(doc.example.type).toBe(type);
      });

      it('aiHints (≥1) und answerFormat sind nicht leer', () => {
        expect(doc.aiHints.length).toBeGreaterThan(0);
        expect(doc.aiHints.every((h) => h.trim().length > 0)).toBe(true);
        expect(doc.answerFormat.trim().length).toBeGreaterThan(0);
      });

      it('group stimmt mit der Editor-Katalog-Gruppe überein', () => {
        expect(doc.group).toBe(CATALOG_GROUP.get(type));
      });

      it('graded stimmt mit der echten Scoring-Klassifikation überein', () => {
        expect(doc.graded).toBe(blockGradedness(type));
      });

      it('example ist strukturell + fachlich gültig (strict + Publish-Gate)', () => {
        // example ist die Eingabe-Form (Defaults dürfen fehlen) → parsen, dann
        // den geparsten Block (mit gefüllten Defaults) gegen die Regeln prüfen.
        const parsed = blockSchema.safeParse(doc.example);
        expect(parsed.success).toBe(true);
        if (!parsed.success) return;
        const strict = moduleContentStrictSchema.safeParse({ blocks: [parsed.data] });
        expect(strict.success).toBe(true);
        // Auch die Entwurf→Veröffentlichen-Regeln (hotspot/label_image-Geometrie)
        // müssen erfüllt sein, damit die Beispiele als B4-Test-Material taugen.
        expect(publishGateIssues([parsed.data])).toEqual([]);
      });
    });
  }
});
