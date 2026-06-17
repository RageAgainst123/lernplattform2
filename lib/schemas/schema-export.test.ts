import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// B1 (docs/AI-AUTHORING-DX.md §1): das auto-generierte JSON-Schema muss
// existieren UND zu den aktuellen Block-Typen passen. Der CI-Step
// `pnpm export:schema --check` ist die scharfe Drift-Sicherung; dieser Test
// fängt das Vergessen schon lokal beim normalen Testlauf ab.

const GEN_DIR = join(process.cwd(), 'docs', 'generated');
const SCHEMA = join(GEN_DIR, 'module-schema.json');
const FIELDS = join(GEN_DIR, 'block-fields.md');

describe('Auto-Schema-Export (B1)', () => {
  it('die generierten Artefakte existieren', () => {
    expect(existsSync(SCHEMA)).toBe(true);
    expect(existsSync(FIELDS)).toBe(true);
  });

  it('das JSON-Schema deckt alle Block-Typen ab (oneOf je Variante)', async () => {
    const { blockSchema } = await import('./blocks.ts');
    // Anzahl Varianten der diskriminierten Union = Anzahl Block-Typen.
    const typeCount = (blockSchema as unknown as { options: unknown[] }).options.length;
    const schema = JSON.parse(readFileSync(SCHEMA, 'utf8'));
    const variants = schema.properties?.blocks?.items?.oneOf;
    expect(Array.isArray(variants)).toBe(true);
    expect(variants).toHaveLength(typeCount);
  });

  it('die Felder-Tabelle nennt jeden Block-Typ als Überschrift', async () => {
    const { blockSchema } = await import('./blocks.ts');
    const md = readFileSync(FIELDS, 'utf8');
    const types = (
      blockSchema as unknown as { options: { shape: { type: { value: string } } }[] }
    ).options.map((o) => o.shape.type.value);
    for (const t of types) {
      expect(md).toContain(`### \`${t}\``);
    }
  });
});
