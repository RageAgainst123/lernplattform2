'use client';

import type { Block } from '@/lib/schemas/blocks';
import { MultipleChoiceForm } from './MultipleChoiceForm';
import { TrueFalseForm } from './TrueFalseForm';
import { FillBlankForm } from './FillBlankForm';
import { ReflectionForm } from './ReflectionForm';
import { TextForm } from './TextForm';
import { InfoboxForm } from './InfoboxForm';
import { MatchForm } from './MatchForm';
import { CategorizeForm } from './CategorizeForm';
import { MarkWordsForm } from './MarkWordsForm';
import { OrderForm } from './OrderForm';
import { HotspotForm } from './HotspotForm';
import { LabelImageForm } from './LabelImageForm';
import { MemoryForm } from './MemoryForm';
import { CrosswordForm } from './CrosswordForm';
import { WordSearchForm } from './WordSearchForm';

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
  'categorize',
  'mark_words',
  'order',
  'hotspot',
  'label_image',
  'memory',
  'crossword',
  'word_search',
] as const);

export function hasForm(type: Block['type']): boolean {
  return (FORM_TYPES as ReadonlySet<string>).has(type);
}

// Theorie- + Basis-Aufgaben-Forms (text/infobox/mc/tf/fill_blank/reflection).
function renderBasicForm({ block, onChange }: Props): React.ReactElement | null {
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
    default:
      return null;
  }
}

// Interaktive Zuordnungs-/Reihenfolge-Forms (match/categorize/mark_words/order).
function renderTaskForm({ block, onChange }: Props): React.ReactElement | null {
  switch (block.type) {
    case 'match':
      return <MatchForm value={block} onChange={onChange} />;
    case 'categorize':
      return <CategorizeForm value={block} onChange={onChange} />;
    case 'mark_words':
      return <MarkWordsForm value={block} onChange={onChange} />;
    case 'order':
      return <OrderForm value={block} onChange={onChange} />;
    case 'hotspot':
      return <HotspotForm value={block} onChange={onChange} />;
    case 'label_image':
      return <LabelImageForm value={block} onChange={onChange} />;
    case 'memory':
      return <MemoryForm value={block} onChange={onChange} />;
    case 'crossword':
      return <CrosswordForm value={block} onChange={onChange} />;
    case 'word_search':
      return <WordSearchForm value={block} onChange={onChange} />;
    default:
      return null;
  }
}

export function BlockForm(props: Props): React.ReactElement | null {
  return renderBasicForm(props) ?? renderTaskForm(props);
}
