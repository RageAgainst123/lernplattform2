// Zentrale Channel-Namens-Helper (Phase T1, ADR-0016).
//
// Alle Realtime-Channel-Namen werden hier konstruiert — keine Magic-Strings
// in Server-Actions oder Client-Hooks. Das macht das Refactoring später
// einfach (z.B. wenn wir auf RLS-Variante umsteigen, ändern wir nur hier).
//
// Channel-Namen folgen dem Muster `{scope}:{uuid}`. Die UUIDs sind 128-Bit,
// stammen aus quiz_sessions.id oder classes.id, sind nicht ratbar. Damit
// brauchen wir keine RLS-Auth-Layer (siehe ADR-0016 §Authentifizierungs-
// Pattern).

export const channels = {
  /**
   * Quiz-Session-Channel. Events: question_started, answer_received,
   * question_revealed, next_question, quiz_ended, participant_joined.
   * Subscriber: alle Schüler:innen der Klasse + Lehrer:innen-Beamer.
   */
  quizSession: (sessionId: string): string => `quiz_session:${sessionId}`,

  /**
   * Live-Präsentations-Channel pro Klasse. Events: block_changed,
   * block_revealed, block_locked, presentation_ended.
   * Subscriber: alle Schüler:innen der Klasse.
   */
  liveSession: (classId: string): string => `live_session:${classId}`,

  /**
   * Klassen-Fortschritts-Channel. Events: module_submitted,
   * worksheet_returned, heft_entry_saved.
   * Subscriber: Lehrer:in der eigenen Klasse (Fortschrittsmatrix).
   */
  classProgress: (classId: string): string => `class_progress:${classId}`,
} as const;

/**
 * Event-Namen pro Channel-Scope. Hilft Tipper-Fehler vermeiden + ermöglicht
 * Compile-Time-Check über das `BroadcastEvent`-Union.
 */
export const events = {
  quiz: {
    questionStarted: 'question_started',
    answerReceived: 'answer_received',
    questionRevealed: 'question_revealed',
    nextQuestion: 'next_question',
    quizEnded: 'quiz_ended',
    participantJoined: 'participant_joined',
  },
  live: {
    blockChanged: 'block_changed',
    blockRevealed: 'block_revealed',
    blockLocked: 'block_locked',
    presentationEnded: 'presentation_ended',
  },
  classProgress: {
    moduleSubmitted: 'module_submitted',
    worksheetReturned: 'worksheet_returned',
    heftEntrySaved: 'heft_entry_saved',
  },
} as const;
