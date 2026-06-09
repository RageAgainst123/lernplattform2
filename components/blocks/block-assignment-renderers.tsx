'use client';

import type { Block } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import { MatchBlock } from '@/components/blocks/MatchBlock';
import { CategorizeBlock } from '@/components/blocks/CategorizeBlock';
import { MarkWordsBlock } from '@/components/blocks/MarkWordsBlock';
import { OrderBlock } from '@/components/blocks/OrderBlock';
import { HotspotBlock } from '@/components/blocks/HotspotBlock';
import { LabelImageBlock } from '@/components/blocks/LabelImageBlock';

// Renderer-Dispatcher für die interaktiven Zuordnungs-/Markier-/Reihenfolge-/
// Hotspot-Blöcke. Ausgelagert aus BlockView.tsx, damit beide Dateien unter
// der Zeilen-Grenze bleiben. Jeder Helper übersetzt den generischen `answer`
// in die typspezifischen Props seiner Renderer-Komponente.

export type AssignmentProps = {
  answer: BlockAnswer | undefined;
  checked: boolean;
  readOnly: boolean;
  onAnswer: (answer: BlockAnswer) => void;
};

export type AssignmentBlock = Extract<
  Block,
  { type: 'match' | 'categorize' | 'mark_words' | 'order' | 'hotspot' | 'label_image' }
>;

function renderMatch(block: Extract<Block, { type: 'match' }>, p: AssignmentProps) {
  return (
    <MatchBlock
      block={block}
      assignment={(p.answer as Record<string, string>) ?? {}}
      checked={p.checked}
      readOnly={p.readOnly}
      onAssign={p.onAnswer}
    />
  );
}

function renderCategorize(block: Extract<Block, { type: 'categorize' }>, p: AssignmentProps) {
  return (
    <CategorizeBlock
      block={block}
      answer={(p.answer as Record<string, string>) ?? {}}
      checked={p.checked}
      readOnly={p.readOnly}
      onAssign={p.onAnswer}
    />
  );
}

function renderMarkWords(block: Extract<Block, { type: 'mark_words' }>, p: AssignmentProps) {
  return (
    <MarkWordsBlock
      block={block}
      answer={(p.answer as number[]) ?? []}
      checked={p.checked}
      readOnly={p.readOnly}
      onMark={p.onAnswer}
    />
  );
}

function renderOrder(block: Extract<Block, { type: 'order' }>, p: AssignmentProps) {
  return (
    <OrderBlock
      block={block}
      answer={(p.answer as string[]) ?? []}
      checked={p.checked}
      readOnly={p.readOnly}
      onReorder={p.onAnswer}
    />
  );
}

function renderHotspot(block: Extract<Block, { type: 'hotspot' }>, p: AssignmentProps) {
  return (
    <HotspotBlock
      block={block}
      answer={(p.answer as string[]) ?? []}
      checked={p.checked}
      readOnly={p.readOnly}
      onSelect={p.onAnswer}
    />
  );
}

function renderLabelImage(block: Extract<Block, { type: 'label_image' }>, p: AssignmentProps) {
  return (
    <LabelImageBlock
      block={block}
      assignment={(p.answer as Record<string, string>) ?? {}}
      checked={p.checked}
      readOnly={p.readOnly}
      onAssign={p.onAnswer}
    />
  );
}

export function renderAssignment(block: AssignmentBlock, p: AssignmentProps) {
  switch (block.type) {
    case 'match':
      return renderMatch(block, p);
    case 'categorize':
      return renderCategorize(block, p);
    case 'mark_words':
      return renderMarkWords(block, p);
    case 'order':
      return renderOrder(block, p);
    case 'hotspot':
      return renderHotspot(block, p);
    case 'label_image':
      return renderLabelImage(block, p);
  }
}
