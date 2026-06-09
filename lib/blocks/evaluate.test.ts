import { describe, expect, it } from 'vitest';
import type { Block } from '@/lib/schemas/blocks';
import {
  blockResult,
  blockScore,
  evaluateBlock,
  gradeBlock,
  isGraded,
  isPassed,
  maxScore,
  percentScore,
  scoreModule,
} from '@/lib/blocks/evaluate';

const mc: Block = {
  id: 'mc',
  type: 'multiple_choice',
  question: 'Eingabegerät?',
  options: [
    { id: 'o1', text: 'Tastatur', correct: true },
    { id: 'o2', text: 'Drucker', correct: false },
    { id: 'o3', text: 'Maus', correct: true },
  ],
};

const tf: Block = { id: 'tf', type: 'true_false', question: 'Drucker = Eingabe?', answer: false };

const fb: Block = {
  id: 'fb',
  type: 'fill_blank',
  text: 'Ein {0} ist ein Eingabegerät.',
  solutions: ['Mikrofon'],
  distractors: ['Drucker'],
};

const match: Block = {
  id: 'm',
  type: 'match',
  pairs: [
    { id: 'p1', term: 'Tastatur', category: 'Eingabe' },
    { id: 'p2', term: 'Drucker', category: 'Ausgabe' },
  ],
};

const categorize: Block = {
  id: 'cat',
  type: 'categorize',
  question: 'Sortiere ein.',
  buckets: [
    { id: 'b-ein', label: 'Eingabe' },
    { id: 'b-aus', label: 'Ausgabe' },
  ],
  items: [
    { id: 'i1', text: 'Tastatur', bucketId: 'b-ein' },
    { id: 'i2', text: 'Maus', bucketId: 'b-ein' },
    { id: 'i3', text: 'Drucker', bucketId: 'b-aus' },
    { id: 'i4', text: 'Bildschirm', bucketId: 'b-aus' },
  ],
};

describe('isGraded', () => {
  it('marks content/reflection blocks as not graded', () => {
    expect(isGraded({ id: 't', type: 'text', content: 'x' })).toBe(false);
    expect(isGraded({ id: 'r', type: 'reflection', prompt: '?' })).toBe(false);
    expect(isGraded(mc)).toBe(true);
  });
});

describe('evaluateBlock — multiple_choice', () => {
  it('accepts exactly the correct set', () => {
    expect(evaluateBlock(mc, ['o1', 'o3'])).toBe(true);
  });
  it('rejects a missing or extra option', () => {
    expect(evaluateBlock(mc, ['o1'])).toBe(false);
    expect(evaluateBlock(mc, ['o1', 'o2', 'o3'])).toBe(false);
  });
  it('ignores duplicate selections', () => {
    expect(evaluateBlock(mc, ['o1', 'o1', 'o3'])).toBe(true);
  });
});

describe('evaluateBlock — true_false', () => {
  it('matches the boolean answer', () => {
    expect(evaluateBlock(tf, false)).toBe(true);
    expect(evaluateBlock(tf, true)).toBe(false);
  });
});

describe('evaluateBlock — fill_blank', () => {
  it('is case-insensitive and trims', () => {
    expect(evaluateBlock(fb, ['  mikrofon '])).toBe(true);
  });
  it('rejects wrong word or wrong count', () => {
    expect(evaluateBlock(fb, ['Drucker'])).toBe(false);
    expect(evaluateBlock(fb, [])).toBe(false);
  });

  // Tippfehlertoleranz (R1.5, siehe docs/QUIZ-MODI-SPEZIFIKATION.md §9).
  it('accepts a single typo on words ≥ 4 chars (Levenshtein ≤ 1)', () => {
    // „mikrofon" (8) ↔ „mikrofen" (1 substitution) → ok
    expect(evaluateBlock(fb, ['mikrofen'])).toBe(true);
    // 1 fehlender Buchstabe → ok
    expect(evaluateBlock(fb, ['mikrofn'])).toBe(true);
    // 1 extra Buchstabe → ok
    expect(evaluateBlock(fb, ['mikrofonn'])).toBe(true);
  });

  it('still rejects 2+ typos', () => {
    // „mikrofon" ↔ „mokrofin" → 2 substitutions
    expect(evaluateBlock(fb, ['mokrofin'])).toBe(false);
  });

  it('respects strict=true (no typo tolerance)', () => {
    const fbStrict: Block = {
      id: 'fb-strict',
      type: 'fill_blank',
      text: 'Die chemische Formel von Wasser ist {0}.',
      solutions: ['H2O'],
      distractors: [],
      strict: true,
    };
    // Genau richtig → ok (auch mit Trim+Lowercase)
    expect(evaluateBlock(fbStrict, ['h2o'])).toBe(true);
    // 1 Edit-Distanz, aber strict → falsch
    expect(evaluateBlock(fbStrict, ['h2p'])).toBe(false);
  });
});

describe('evaluateBlock — match', () => {
  it('requires every pair in the right category', () => {
    expect(evaluateBlock(match, { p1: 'Eingabe', p2: 'Ausgabe' })).toBe(true);
    expect(evaluateBlock(match, { p1: 'Ausgabe', p2: 'Ausgabe' })).toBe(false);
  });
});

describe('scoreModule / maxScore', () => {
  const blocks: Block[] = [{ id: 't', type: 'text', content: 'Intro' }, mc, tf, fb, match];

  it('counts only graded, correct blocks', () => {
    const answers = {
      mc: ['o1', 'o3'],
      tf: false,
      fb: ['Mikrofon'],
      m: { p1: 'Eingabe', p2: 'Ausgabe' },
    };
    expect(scoreModule(blocks, answers)).toBe(4);
    expect(maxScore(blocks)).toBe(4);
  });

  it('partial score when some are wrong', () => {
    expect(scoreModule(blocks, { mc: ['o1'], tf: false, fb: [], m: {} })).toBe(1);
  });
});

describe('gradeBlock', () => {
  it('returns 1 for a correct graded block, 0 for wrong', () => {
    expect(gradeBlock(mc, ['o1', 'o3'])).toBe(1);
    expect(gradeBlock(mc, ['o1'])).toBe(0);
  });
  it('treats an undefined answer as 0 (unanswered)', () => {
    expect(gradeBlock(tf, undefined)).toBe(0);
  });
  it('returns 0 for non-graded blocks', () => {
    expect(gradeBlock({ id: 'r', type: 'reflection', prompt: '?' }, 'irgendwas')).toBe(0);
  });
});

describe('percentScore', () => {
  it('computes rounded percent', () => {
    expect(percentScore(4, 5)).toBe(80);
    expect(percentScore(2, 3)).toBe(67);
    expect(percentScore(5, 5)).toBe(100);
    expect(percentScore(0, 5)).toBe(0);
  });
  it('returns null when there are no gradable blocks', () => {
    expect(percentScore(0, 0)).toBeNull();
  });
});

describe('isPassed', () => {
  it('passes when percent >= threshold', () => {
    expect(isPassed(4, 5, 80)).toBe(true); // 80% >= 80
    expect(isPassed(5, 5, 80)).toBe(true);
  });
  it('fails when percent < threshold', () => {
    expect(isPassed(3, 5, 80)).toBe(false); // 60% < 80
  });
  it('returns null when no threshold is set', () => {
    expect(isPassed(4, 5, null)).toBeNull();
  });
  it('returns null when there are no gradable blocks (max 0)', () => {
    expect(isPassed(0, 0, 80)).toBeNull();
  });
});

describe('blockResult', () => {
  it('returns correct/wrong for graded blocks', () => {
    expect(blockResult(mc, ['o1', 'o3'])).toBe('correct');
    expect(blockResult(mc, ['o1'])).toBe('wrong');
  });
  it('returns wrong for an unanswered graded block', () => {
    expect(blockResult(tf, undefined)).toBe('wrong');
  });
  it('returns ungraded for text/infobox/reflection', () => {
    expect(blockResult({ id: 't', type: 'text', content: 'x' }, undefined)).toBe('ungraded');
    expect(blockResult({ id: 'r', type: 'reflection', prompt: '?' }, 'text')).toBe('ungraded');
  });
});

describe('blockScore (Teilpunkte-Anzeige für Lehrer:innen)', () => {
  it('liefert 1 bei voller Korrektheit', () => {
    expect(blockScore(mc, ['o1', 'o3'])).toBe(1);
  });
  it('liefert 0 bei falscher Antwort', () => {
    expect(blockScore(mc, ['o1'])).toBe(0);
  });
  it('liefert null für nicht-bewertbare Blöcke', () => {
    expect(blockScore({ id: 't', type: 'text', content: 'x' }, undefined)).toBeNull();
    expect(blockScore({ id: 'r', type: 'reflection', prompt: '?' }, 'text')).toBeNull();
  });
});

// Phase Lernformen-2.0: blockResult unterscheidet jetzt 4 Zustände
// (correct/partial/wrong/ungraded). Die 'partial'-Schwelle (0 < score < 1)
// wird mit echten Teilpunkte-Blöcken in A1 (categorize) end-to-end getestet;
// hier sichern wir die binäre Klassifikation ab, damit der Übergang sauber
// bleibt: voll = correct, null = wrong, dazwischen = partial.
describe('blockResult — 3-Wege-Klassifikation (Teilpunkte-bereit)', () => {
  it('voller Score → correct', () => {
    expect(blockResult(mc, ['o1', 'o3'])).toBe('correct');
  });
  it('null Score → wrong', () => {
    expect(blockResult(mc, [])).toBe('wrong');
  });
});

describe('categorize — Teilpunkte (PARTIAL_GRADERS)', () => {
  it('alle 4 richtig → gradeBlock 1', () => {
    expect(gradeBlock(categorize, { i1: 'b-ein', i2: 'b-ein', i3: 'b-aus', i4: 'b-aus' })).toBe(1);
  });
  it('3 von 4 richtig → gradeBlock 0.75', () => {
    expect(gradeBlock(categorize, { i1: 'b-ein', i2: 'b-ein', i3: 'b-aus', i4: 'b-ein' })).toBe(
      0.75
    );
  });
  it('2 von 4 richtig → gradeBlock 0.5', () => {
    expect(gradeBlock(categorize, { i1: 'b-ein', i2: 'b-aus', i3: 'b-ein', i4: 'b-aus' })).toBe(
      0.5
    );
  });
  it('keine Antwort → gradeBlock 0', () => {
    expect(gradeBlock(categorize, {})).toBe(0);
    expect(gradeBlock(categorize, undefined)).toBe(0);
  });
  it('blockResult: voll = correct, teils = partial, null = wrong', () => {
    expect(blockResult(categorize, { i1: 'b-ein', i2: 'b-ein', i3: 'b-aus', i4: 'b-aus' })).toBe(
      'correct'
    );
    expect(blockResult(categorize, { i1: 'b-ein', i2: 'b-ein', i3: 'b-aus', i4: 'b-ein' })).toBe(
      'partial'
    );
    expect(blockResult(categorize, {})).toBe('wrong');
  });
  it('blockScore liefert den rohen Anteil', () => {
    expect(blockScore(categorize, { i1: 'b-ein', i2: 'b-ein', i3: 'b-aus', i4: 'b-ein' })).toBe(
      0.75
    );
  });
  it('zählt im scoreModule als Teilpunkt mit', () => {
    // categorize (0.75) + mc richtig (1) = 1.75 von max 2
    const blocks = [categorize, mc];
    const answers = {
      cat: { i1: 'b-ein', i2: 'b-ein', i3: 'b-aus', i4: 'b-ein' },
      mc: ['o1', 'o3'],
    };
    expect(scoreModule(blocks, answers)).toBe(1.75);
    expect(maxScore(blocks)).toBe(2);
  });
});

// A4: mark_words — Anteil korrekt markierter Wörter minus Falschmarkierungen.
// Text „Anna wohnt in Wien" → Wörter [Anna(0) wohnt(1) in(2) Wien(3)].
// Richtig markiert: Anna(0) + Wien(3).
const markWords: Block = {
  id: 'mw',
  type: 'mark_words',
  instruction: 'Markiere alle persönlichen Daten.',
  text: 'Anna wohnt in Wien',
  correctIndices: [0, 3],
};

describe('mark_words — Teilpunkte (PARTIAL_GRADERS)', () => {
  it('beide richtig markiert → 1', () => {
    expect(gradeBlock(markWords, [0, 3])).toBe(1);
  });
  it('eines von zwei richtig → 0.5', () => {
    expect(gradeBlock(markWords, [0])).toBe(0.5);
  });
  it('eine Falschmarkierung zieht ab: 1 richtig − 1 falsch / 2 = 0', () => {
    expect(gradeBlock(markWords, [0, 1])).toBe(0);
  });
  it('alles markieren lohnt nicht: 2 richtig − 2 falsch / 2 = 0', () => {
    expect(gradeBlock(markWords, [0, 1, 2, 3])).toBe(0);
  });
  it('nur falsche markiert → auf 0 geclampt (nicht negativ)', () => {
    expect(gradeBlock(markWords, [1, 2])).toBe(0);
  });
  it('keine Antwort → 0', () => {
    expect(gradeBlock(markWords, [])).toBe(0);
    expect(gradeBlock(markWords, undefined)).toBe(0);
  });
  it('blockResult: voll = correct, teils = partial, null = wrong', () => {
    expect(blockResult(markWords, [0, 3])).toBe('correct');
    expect(blockResult(markWords, [0])).toBe('partial');
    expect(blockResult(markWords, [1, 2])).toBe('wrong');
  });
});

// A2: order — Anteil korrekter Nachbarpaare. Korrekte Reihenfolge a→b→c→d
// (3 Nachbarpaare: a-b, b-c, c-d).
const order: Block = {
  id: 'ord',
  type: 'order',
  instruction: 'Bring in die richtige Reihenfolge.',
  items: [
    { id: 'a', text: 'Erstens' },
    { id: 'b', text: 'Zweitens' },
    { id: 'c', text: 'Drittens' },
    { id: 'd', text: 'Viertens' },
  ],
};

describe('order — Teilpunkte (Anteil korrekter Nachbarpaare)', () => {
  it('perfekte Reihenfolge → 1', () => {
    expect(gradeBlock(order, ['a', 'b', 'c', 'd'])).toBe(1);
  });
  it('komplett umgekehrt → 0 (kein Paar in richtiger Richtung)', () => {
    expect(gradeBlock(order, ['d', 'c', 'b', 'a'])).toBe(0);
  });
  it('ein Paar vertauscht: a-b ok, dann d-c falsch → 1 von 3 ≈ 0.33', () => {
    // ['a','b','d','c']: a-b ✓, b-c ✗ (b→d), c-d ✗ (d→c) → 1/3
    expect(gradeBlock(order, ['a', 'b', 'd', 'c'])).toBeCloseTo(1 / 3, 5);
  });
  it('zwei von drei Paaren korrekt → 2/3', () => {
    // ['a','b','c'] hat nur 3 von 4 Items; aber teste vollständig:
    // ['b','c','d','a']: a-b ✗, b-c ✓, c-d ✓ → 2/3
    expect(gradeBlock(order, ['b', 'c', 'd', 'a'])).toBeCloseTo(2 / 3, 5);
  });
  it('keine Antwort → 0', () => {
    expect(gradeBlock(order, [])).toBe(0);
    expect(gradeBlock(order, undefined)).toBe(0);
  });
  it('blockResult: voll = correct, teils = partial, null = wrong', () => {
    expect(blockResult(order, ['a', 'b', 'c', 'd'])).toBe('correct');
    expect(blockResult(order, ['a', 'b', 'd', 'c'])).toBe('partial');
    expect(blockResult(order, ['d', 'c', 'b', 'a'])).toBe('wrong');
  });
});

// A3: hotspot — Anteil korrekt angetippter Zonen minus Falschklicks.
// 4 Zonen: z1+z2 richtig, z3+z4 falsch (Distraktoren).
const hotspot: Block = {
  id: 'hs',
  type: 'hotspot',
  instruction: 'Tippe alle Eingabegeräte an.',
  imageUrl: 'https://example.com/bild.jpg',
  revealZones: true,
  zoomable: false,
  areas: [
    { id: 'z1', x: 0.2, y: 0.2, shape: 'circle', r: 0.1, rotation: 0, isCorrect: true },
    { id: 'z2', x: 0.5, y: 0.5, shape: 'circle', r: 0.1, rotation: 0, isCorrect: true },
    { id: 'z3', x: 0.8, y: 0.2, shape: 'circle', r: 0.1, rotation: 0, isCorrect: false },
    { id: 'z4', x: 0.8, y: 0.8, shape: 'circle', r: 0.1, rotation: 0, isCorrect: false },
  ],
};

describe('hotspot — Teilpunkte (PARTIAL_GRADERS)', () => {
  it('beide richtigen angetippt → 1', () => {
    expect(gradeBlock(hotspot, ['z1', 'z2'])).toBe(1);
  });
  it('eine von zwei richtig → 0.5', () => {
    expect(gradeBlock(hotspot, ['z1'])).toBe(0.5);
  });
  it('ein Falschklick zieht ab: 2 richtig − 1 falsch / 2 = 0.5', () => {
    expect(gradeBlock(hotspot, ['z1', 'z2', 'z3'])).toBe(0.5);
  });
  it('alle antippen lohnt nicht: 2 richtig − 2 falsch / 2 = 0', () => {
    expect(gradeBlock(hotspot, ['z1', 'z2', 'z3', 'z4'])).toBe(0);
  });
  it('nur falsche → auf 0 geclampt (nicht negativ)', () => {
    expect(gradeBlock(hotspot, ['z3', 'z4'])).toBe(0);
  });
  it('keine Antwort → 0', () => {
    expect(gradeBlock(hotspot, [])).toBe(0);
    expect(gradeBlock(hotspot, undefined)).toBe(0);
  });
  it('blockResult: voll = correct, teils = partial, null = wrong', () => {
    expect(blockResult(hotspot, ['z1', 'z2'])).toBe('correct');
    expect(blockResult(hotspot, ['z1'])).toBe('partial');
    expect(blockResult(hotspot, ['z3', 'z4'])).toBe('wrong');
  });
});

// A3.3: hotspot Gruppen-Modus. Gruppe A (a1,a2 richtig), Gruppe B (b1 richtig),
// dazu ein gruppenloser Distraktor d1 (zählt in JEDER Gruppe als falsch).
// Score = Durchschnitt der Pro-Gruppe-Scores.
const hotspotGroups: Block = {
  id: 'hsg',
  type: 'hotspot',
  instruction: 'Tippe pro Schritt an.',
  imageUrl: 'https://example.com/bild.jpg',
  revealZones: true,
  zoomable: false,
  groups: [
    { id: 'gA', label: 'Eingabe' },
    { id: 'gB', label: 'Ausgabe' },
  ],
  areas: [
    {
      id: 'a1',
      x: 0.1,
      y: 0.1,
      shape: 'circle',
      r: 0.1,
      rotation: 0,
      isCorrect: true,
      groupId: 'gA',
    },
    {
      id: 'a2',
      x: 0.2,
      y: 0.1,
      shape: 'circle',
      r: 0.1,
      rotation: 0,
      isCorrect: true,
      groupId: 'gA',
    },
    {
      id: 'b1',
      x: 0.3,
      y: 0.1,
      shape: 'circle',
      r: 0.1,
      rotation: 0,
      isCorrect: true,
      groupId: 'gB',
    },
    { id: 'd1', x: 0.9, y: 0.9, shape: 'circle', r: 0.1, rotation: 0, isCorrect: false },
  ],
};

describe('hotspot — Gruppen-Modus', () => {
  it('alle Gruppen voll → 1 (Durchschnitt 1 und 1)', () => {
    expect(gradeBlock(hotspotGroups, ['a1', 'a2', 'b1'])).toBe(1);
  });
  it('nur Gruppe B voll → 0.5 (Durchschnitt 0 und 1)', () => {
    expect(gradeBlock(hotspotGroups, ['b1'])).toBe(0.5);
  });
  it('Gruppe A halb (1 von 2), Gruppe B voll → Durchschnitt (0.5 + 1)/2 = 0.75', () => {
    expect(gradeBlock(hotspotGroups, ['a1', 'b1'])).toBe(0.75);
  });
  it('gruppenloser Distraktor zieht in jeder Gruppe ab', () => {
    // gA: (2−1)/2 = 0.5 ; gB: (1−1)/1 = 0 → Durchschnitt 0.25
    expect(gradeBlock(hotspotGroups, ['a1', 'a2', 'b1', 'd1'])).toBe(0.25);
  });
  it('leere Antwort → 0', () => {
    expect(gradeBlock(hotspotGroups, [])).toBe(0);
  });
});
