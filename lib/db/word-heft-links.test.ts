import { beforeEach, describe, expect, it, vi } from 'vitest';

// Phase Q (Sprint 5): upsertWordHeftLink + getWordHeftLinkForStudent
// Mock-Test. Pattern wie in classes.test.ts: per-Methoden vi.fn()-Chains
// die das Supabase-Query-Builder-Chaining nachbauen.
//
// server-only mocken weil die DB-Layer-Datei das importiert und in
// jsdom/vitest sonst sofort wirft.

vi.mock('server-only', () => ({}));

const singleMock = vi.fn();
const selectAfterUpsertMock = vi.fn(() => ({ single: singleMock }));
const upsertMock = vi.fn(() => ({ select: selectAfterUpsertMock }));
const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectAfterFromMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({
  select: selectAfterFromMock,
  upsert: upsertMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({ from: fromMock })),
}));

import { upsertWordHeftLink, getWordHeftLinkForStudent } from '@/lib/db/word-heft-links';

const sampleRow = {
  id: 'l-1',
  student_code_id: 'sc-1',
  topic_id: null,
  one_drive_url: 'https://nms-my.sharepoint.com/x.docx',
  display_name: 'Mein Heft',
  validation_status: 'ok' as const,
  last_validated_at: '2026-06-03T10:00:00Z',
  last_opened_at: null,
  created_at: '2026-06-03T09:00:00Z',
  updated_at: '2026-06-03T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('upsertWordHeftLink', () => {
  it('mapped die DB-Row korrekt zurück nach camelCase WordHeftLink', async () => {
    singleMock.mockResolvedValue({ data: sampleRow, error: null });
    const result = await upsertWordHeftLink({
      studentCodeId: 'sc-1',
      oneDriveUrl: 'https://nms-my.sharepoint.com/x.docx',
      displayName: 'Mein Heft',
      validationStatus: 'ok',
    });
    expect(result).toEqual({
      id: 'l-1',
      studentCodeId: 'sc-1',
      topicId: null,
      oneDriveUrl: 'https://nms-my.sharepoint.com/x.docx',
      displayName: 'Mein Heft',
      validationStatus: 'ok',
      lastValidatedAt: '2026-06-03T10:00:00Z',
      lastOpenedAt: null,
      createdAt: '2026-06-03T09:00:00Z',
      updatedAt: '2026-06-03T10:00:00Z',
    });
  });

  it('ruft upsert mit onConflict student_code_id auf (Migration 0019)', async () => {
    singleMock.mockResolvedValue({ data: sampleRow, error: null });
    await upsertWordHeftLink({
      studentCodeId: 'sc-1',
      oneDriveUrl: 'https://nms-my.sharepoint.com/x.docx',
      displayName: null,
      validationStatus: 'ok',
    });
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ student_code_id: 'sc-1' }),
      expect.objectContaining({ onConflict: 'student_code_id' })
    );
  });

  it('setzt last_validated_at auf NULL wenn status pending ist', async () => {
    singleMock.mockResolvedValue({
      data: { ...sampleRow, validation_status: 'pending' },
      error: null,
    });
    await upsertWordHeftLink({
      studentCodeId: 'sc-1',
      oneDriveUrl: 'https://nms-my.sharepoint.com/x.docx',
      displayName: null,
      validationStatus: 'pending',
    });
    const calls = upsertMock.mock.calls as unknown as Array<
      [{ last_validated_at: string | null }, unknown]
    >;
    const upsertPayload = calls[0][0];
    expect(upsertPayload.last_validated_at).toBeNull();
  });

  it('setzt last_validated_at auf ein ISO-Timestamp wenn status ok ist', async () => {
    singleMock.mockResolvedValue({ data: sampleRow, error: null });
    await upsertWordHeftLink({
      studentCodeId: 'sc-1',
      oneDriveUrl: 'https://nms-my.sharepoint.com/x.docx',
      displayName: null,
      validationStatus: 'ok',
    });
    const calls = upsertMock.mock.calls as unknown as Array<
      [{ last_validated_at: string | null }, unknown]
    >;
    const upsertPayload = calls[0][0];
    expect(upsertPayload.last_validated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('wirft lesbaren Error wenn Supabase einen Fehler zurückgibt', async () => {
    singleMock.mockResolvedValue({ data: null, error: { message: 'unique constraint' } });
    await expect(
      upsertWordHeftLink({
        studentCodeId: 'sc-1',
        oneDriveUrl: 'https://nms-my.sharepoint.com/x.docx',
        displayName: null,
        validationStatus: 'ok',
      })
    ).rejects.toThrow(/unique constraint/);
  });
});

describe('getWordHeftLinkForStudent', () => {
  it('liefert null wenn Schüler:in noch kein Heft hat', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    expect(await getWordHeftLinkForStudent('sc-1')).toBeNull();
  });

  it('mapped die Row und liefert WordHeftLink camelCase', async () => {
    maybeSingleMock.mockResolvedValue({ data: sampleRow, error: null });
    const result = await getWordHeftLinkForStudent('sc-1');
    expect(result?.studentCodeId).toBe('sc-1');
    expect(result?.oneDriveUrl).toBe('https://nms-my.sharepoint.com/x.docx');
    expect(result?.validationStatus).toBe('ok');
  });
});
