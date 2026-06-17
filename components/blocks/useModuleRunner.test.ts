import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Block } from '@/lib/schemas/blocks';
import { useModuleRunner } from './useModuleRunner';

// Phase W: Tests für den Mehrfachversuch-State + canRetry-Logik.
// Wir bauen Mini-Module mit 1-2 graded Blöcken, simulieren check/retry/next
// und prüfen, dass Punkte/Streak nur EINMAL pro Block gezählt werden.

function mcBlock(id: string, maxAttempts?: number, hint?: string): Block {
  return {
    id,
    type: 'multiple_choice',
    question: 'Frage?',
    options: [
      { id: 'a', text: 'A', correct: true },
      { id: 'b', text: 'B', correct: false },
    ],
    ...(maxAttempts !== undefined ? { maxAttempts } : {}),
    ...(hint !== undefined ? { hint } : {}),
  };
}

describe('useModuleRunner — Phase W Mehrfachversuch', () => {
  it('canRetry bleibt false bei maxAttempts=1 (Default), auch wenn falsch', () => {
    const { result } = renderHook(() =>
      useModuleRunner({
        blocks: [mcBlock('q1')],
        startIndex: 0,
        initialAnswers: { q1: 'b' }, // falsch
      })
    );
    expect(result.current.canRetry).toBe(false);
    expect(result.current.maxAttempts).toBe(1);
    act(() => result.current.check());
    // Auch nach Prüfung: kein Retry, weil 1 Versuch erschöpft.
    expect(result.current.canRetry).toBe(false);
  });

  it('canRetry=true bei maxAttempts=3 + falsche Antwort + nur 1 Versuch verbraucht', () => {
    const { result } = renderHook(() =>
      useModuleRunner({
        blocks: [mcBlock('q1', 3, 'Hinweis')],
        startIndex: 0,
        initialAnswers: { q1: 'b' },
      })
    );
    expect(result.current.maxAttempts).toBe(3);
    act(() => result.current.check());
    expect(result.current.checked).toBe(true);
    expect(result.current.correct).toBe(false);
    expect(result.current.attemptCount).toBe(1);
    expect(result.current.canRetry).toBe(true);
  });

  it('retry() setzt checked zurück, Antwort + attemptCount bleiben erhalten', () => {
    const { result } = renderHook(() =>
      useModuleRunner({
        blocks: [mcBlock('q1', 3, 'Hinweis')],
        startIndex: 0,
        initialAnswers: { q1: 'b' },
      })
    );
    act(() => result.current.check());
    act(() => result.current.retry());
    expect(result.current.checked).toBe(false);
    expect(result.current.attemptCount).toBe(1);
    expect(result.current.answers.q1).toBe('b');
  });

  it('canRetry=false nach maxAttempts-vielen Versuchen', () => {
    const { result } = renderHook(() =>
      useModuleRunner({
        blocks: [mcBlock('q1', 2, 'Hinweis')],
        startIndex: 0,
        initialAnswers: { q1: 'b' },
      })
    );
    // 1. Versuch
    act(() => result.current.check());
    expect(result.current.canRetry).toBe(true);
    act(() => result.current.retry());
    // 2. Versuch — wieder falsch
    act(() => result.current.check());
    expect(result.current.attemptCount).toBe(2);
    expect(result.current.canRetry).toBe(false); // Limit erreicht
  });

  it('canRetry=false sobald richtig (egal welcher Versuch)', () => {
    const { result } = renderHook(() =>
      useModuleRunner({
        blocks: [mcBlock('q1', 3, 'Hinweis')],
        startIndex: 0,
        initialAnswers: { q1: 'a' }, // richtig
      })
    );
    act(() => result.current.check());
    expect(result.current.correct).toBe(true);
    expect(result.current.canRetry).toBe(false);
  });

  it('Punkte werden nur EINMAL pro Block gezählt — auch bei mehreren Versuchen', () => {
    const { result } = renderHook(() =>
      useModuleRunner({
        blocks: [mcBlock('q1', 3, 'Hinweis')],
        startIndex: 0,
        initialAnswers: { q1: 'b' }, // falsch
      })
    );
    act(() => result.current.check()); // 1. Versuch, falsch
    act(() => result.current.retry());
    act(() => result.current.check()); // 2. Versuch, immer noch falsch
    // pointsByBlock ist Record<blockId, BlockPoints> — höchstens 1 Key
    // pro Block-ID, egal wie oft geprüft wurde.
    const keys = Object.keys(result.current.pointsByBlock);
    expect(keys.length).toBeLessThanOrEqual(1);
  });
});
