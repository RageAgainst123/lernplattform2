import { z } from 'zod';

// Quiz-Session-Typen (Phase S).
// Spezifikation: docs/QUIZ-MODI-SPEZIFIKATION.md
// Migration: supabase/migrations/0020_quiz_sessions.sql
//
// Geteilt zwischen Server-Side-Lesern (lib/db/quiz-sessions.ts) und
// Client-Side-Konsumenten (Polling, Lobby, Beamer). Zod ist Single-Source.

// State-Maschine (Spec §5.8). Hausaufgaben-Sessions starten direkt in 'active'.
export const quizSessionStatusSchema = z.enum(['lobby', 'active', 'between_questions', 'ended']);
export type QuizSessionStatus = z.infer<typeof quizSessionStatusSchema>;

export const quizModeSchema = z.enum(['live_class', 'homework', 'team']);
export type QuizMode = z.infer<typeof quizModeSchema>;

// Frage-Reihenfolge: kompakter Snapshot der Blocks, die der Quiz tatsächlich
// abfragt. Wird beim Session-Anlegen aus modules.content abgeleitet, dabei
// werden 'match'-Blocks gefiltert (Spec §3.9) und ggf. shuffled. Damit ist
// die Reihenfolge stabil über die Session — auch wenn Admin das Modul später
// ändert.
export const quizQuestionRefSchema = z.object({
  blockId: z.string().min(1),
  // Block-Typ explizit mitgeführt, damit der Beamer ohne Modul-Reload den
  // richtigen Renderer wählen kann.
  blockType: z.string().min(1),
});
export type QuizQuestionRef = z.infer<typeof quizQuestionRefSchema>;

export const quizQuestionOrderSchema = z.array(quizQuestionRefSchema);

// Setup-Konfiguration aus dem Lobby-Formular (Spec §5.2).
export const quizSessionSettingsSchema = z.object({
  timeLimitSeconds: z.number().int().min(5).max(300).default(30),
  scoringTimeLimitS: z.number().int().min(5).max(300).default(30),
  teamMode: z.boolean().default(false),
  showLeaderboardBetween: z.boolean().default(true),
  shuffleQuestions: z.boolean().default(false),
  shuffleAnswers: z.boolean().default(true),
  // Nur bei mode='homework' gesetzt.
  dueDate: z.string().datetime().nullable().default(null),
});
export type QuizSessionSettings = z.infer<typeof quizSessionSettingsSchema>;
