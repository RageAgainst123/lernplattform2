import { describe, expect, it } from 'vitest';
import { isEditorRoute } from './is-editor-route';

describe('isEditorRoute', () => {
  it('matcht Editor-Routen (neu + id) aller Aktivitäten', () => {
    expect(isEditorRoute('/admin/lernmodule/neu')).toBe(true);
    expect(isEditorRoute('/admin/lernmodule/abc-123')).toBe(true);
    expect(isEditorRoute('/admin/praesentationen/neu')).toBe(true);
    expect(isEditorRoute('/admin/praesentationen/x')).toBe(true);
    expect(isEditorRoute('/admin/quizze/q1')).toBe(true);
    expect(isEditorRoute('/admin/abschlusstests/t1')).toBe(true);
  });

  it('matcht NICHT die Listen-Routen', () => {
    expect(isEditorRoute('/admin/lernmodule')).toBe(false);
    expect(isEditorRoute('/admin/praesentationen')).toBe(false);
    expect(isEditorRoute('/admin/quizze')).toBe(false);
  });

  it('matcht NICHT Übersicht/Themen', () => {
    expect(isEditorRoute('/admin')).toBe(false);
    expect(isEditorRoute('/admin/themen')).toBe(false);
    expect(isEditorRoute('/admin/themen/abc')).toBe(false);
  });

  it('matcht NICHT Material (kein ModuleEditor)', () => {
    expect(isEditorRoute('/admin/material')).toBe(false);
    expect(isEditorRoute('/admin/material/neu')).toBe(false);
    expect(isEditorRoute('/admin/material/m1')).toBe(false);
  });

  it('ignoriert Query/Hash und trailing slash', () => {
    expect(isEditorRoute('/admin/lernmodule/abc?tab=preview')).toBe(true);
    expect(isEditorRoute('/admin/lernmodule/abc#zone')).toBe(true);
    expect(isEditorRoute('/admin/lernmodule/abc/')).toBe(true);
  });

  it('robust gegen null/leer', () => {
    expect(isEditorRoute(null)).toBe(false);
    expect(isEditorRoute(undefined)).toBe(false);
    expect(isEditorRoute('')).toBe(false);
    expect(isEditorRoute('/login')).toBe(false);
  });
});
