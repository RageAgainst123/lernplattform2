import type {
  Block,
  FillBlankBlock,
  MatchBlock,
  MultipleChoiceBlock,
  TrueFalseBlock,
} from '@/lib/schemas/blocks';

// Antwort-Formate pro auswertbarem Block-Typ.
export type MultipleChoiceAnswer = string[]; // gewählte Option-IDs
export type TrueFalseAnswer = boolean;
// Wörter in Platzhalter-Reihenfolge; null = noch leere Lücke (UI-Zustand).
export type FillBlankAnswer = (string | null)[];
export type MatchAnswer = Record<string, string>; // pairId → zugeordnete Kategorie
export type BlockAnswer =
  | MultipleChoiceAnswer
  | TrueFalseAnswer
  | FillBlankAnswer
  | MatchAnswer
  | string;

// Block-Typen ohne Bewertung (reiner Inhalt bzw. freie Antwort).
const NON_GRADED = new Set(['text', 'infobox', 'reflection']);

export function isGraded(block: Block): boolean {
  return !NON_GRADED.has(block.type);
}

function normalize(word: string): string {
  return word.trim().toLowerCase();
}

function evalMultipleChoice(block: MultipleChoiceBlock, answer: MultipleChoiceAnswer): boolean {
  const correct = block.options.filter((o) => o.correct).map((o) => o.id);
  const given = [...new Set(answer)];
  return correct.length === given.length && correct.every((id) => given.includes(id));
}

function evalFillBlank(block: FillBlankBlock, answer: FillBlankAnswer): boolean {
  if (answer.length !== block.solutions.length) {
    return false;
  }
  return block.solutions.every((sol, i) => normalize(sol) === normalize(answer[i] ?? ''));
}

function evalMatch(block: MatchBlock, answer: MatchAnswer): boolean {
  return block.pairs.every((pair) => answer[pair.id] === pair.category);
}

// Wertet die Antwort eines Blocks aus. Nicht-bewertbare Blöcke gelten als korrekt
// (z. B. Reflexion ohne richtige/falsche Antwort).
export function evaluateBlock(block: Block, answer: BlockAnswer): boolean {
  switch (block.type) {
    case 'multiple_choice':
      return evalMultipleChoice(block, (answer as MultipleChoiceAnswer) ?? []);
    case 'true_false':
      return answer === (block as TrueFalseBlock).answer;
    case 'fill_blank':
      return evalFillBlank(block, (answer as FillBlankAnswer) ?? []);
    case 'match':
      return evalMatch(block, (answer as MatchAnswer) ?? {});
    default:
      return true;
  }
}

// Punkte = Anzahl korrekt beantworteter bewertbarer Blöcke.
export function scoreModule(blocks: Block[], answers: Record<string, BlockAnswer>): number {
  return blocks.filter(isGraded).filter((block) => evaluateBlock(block, answers[block.id])).length;
}

// Maximalpunktzahl = Anzahl bewertbarer Blöcke.
export function maxScore(blocks: Block[]): number {
  return blocks.filter(isGraded).length;
}
