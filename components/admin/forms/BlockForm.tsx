'use client';

import type { Block } from '@/lib/schemas/blocks';
import { MultipleChoiceForm } from './MultipleChoiceForm';
import { TrueFalseForm } from './TrueFalseForm';
import { FillBlankForm } from './FillBlankForm';
import { ReflectionForm } from './ReflectionForm';
import { TextForm } from './TextForm';
import { InfoboxForm } from './InfoboxForm';
import { MatchForm } from './MatchForm';

// Dispatcher: rendert das passende Form für den Block-Typ. Wenn kein
// dediziertes Form existiert (z.B. live-Blöcke wie slide, live_poll), wird
// null zurückgegeben — die BlockCard fällt dann auf JSON-Modus zurück und
// blendet den Form-Tab gar nicht ein.

type Props = {
  block: Block;
  onChange: (next: Block) => void;
};

// Block-Typen für die ein Form existiert. Wenn du hier was ergänzt, musst
// du sowohl den case unten als auch hasForm aktualisieren.
const FORM_TYPES = new Set([
  'multiple_choice',
  'true_false',
  'fill_blank',
  'reflection',
  'text',
  'infobox',
  'match',
] as const);

export function hasForm(type: Block['type']): boolean {
  return (FORM_TYPES as ReadonlySet<string>).has(type);
}

export function BlockForm({ block, onChange }: Props): React.ReactElement | null {
  // Switch ist erschöpfend für die FORM_TYPES — TS bleibt happy weil
  // onChange-Typ-Argumente in jedem Branch passen (gemeinsamer Block-Diskriminator).
  switch (block.type) {
    case 'multiple_choice':
      return <MultipleChoiceForm value={block} onChange={onChange} />;
    case 'true_false':
      return <TrueFalseForm value={block} onChange={onChange} />;
    case 'fill_blank':
      return <FillBlankForm value={block} onChange={onChange} />;
    case 'reflection':
      return <ReflectionForm value={block} onChange={onChange} />;
    case 'text':
      return <TextForm value={block} onChange={onChange} />;
    case 'infobox':
      return <InfoboxForm value={block} onChange={onChange} />;
    case 'match':
      return <MatchForm value={block} onChange={onChange} />;
    default:
      return null;
  }
}
