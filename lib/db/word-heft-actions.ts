'use server';

import { revalidatePath } from 'next/cache';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { validateOneDriveLink } from '@/lib/onedrive/validate-link';
import { probeOneDriveUrl } from '@/lib/onedrive/probe-link';
import {
  upsertWordHeftLink,
  touchWordHeftLinkOpened,
  deleteWordHeftLink,
} from '@/lib/db/word-heft-links';
import type { ValidationStatus } from '@/lib/schemas/entities';

// Phase Q (Modell ab Migration 0019): EIN generelles Word-Heft pro
// Schüler:in. Kein topic_id mehr. Server Actions für Speichern, Touch,
// Löschen.
//
// Sicherheits-Modell: studentCodeId KOMMT IMMER aus der jose-Session
// (requireStudentSession), NIE aus dem Client-Param. So kann eine
// böswillige Schüler:in nicht im Namen einer anderen schreiben.
//
// HEAD-Probe-Logik (gegen Microsoft OneDrive) lebt in
// lib/onedrive/probe-link.ts — eigene Datei weil dort 'use server' nicht
// gilt und die Funktion unit-testbar bleibt.

export type SaveWordHeftState = {
  ok: boolean;
  error?: string;
  validationStatus?: ValidationStatus;
};

export async function saveWordHeftLink(args: {
  oneDriveUrl: string;
  displayName?: string | null;
}): Promise<SaveWordHeftState> {
  const session = await requireStudentSession();

  const formValidation = validateOneDriveLink(args.oneDriveUrl);
  if (!formValidation.ok) {
    return {
      ok: false,
      error: formValidationReason(formValidation.reason),
    };
  }

  const probeStatus = await probeOneDriveUrl(formValidation.normalizedUrl);

  try {
    await upsertWordHeftLink({
      studentCodeId: session.studentCodeId,
      oneDriveUrl: formValidation.normalizedUrl,
      displayName: args.displayName ?? null,
      validationStatus: probeStatus,
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Speichern fehlgeschlagen.',
    };
  }

  revalidatePath('/s', 'layout');
  return { ok: true, validationStatus: probeStatus };
}

export async function markWordHeftOpened(linkId: string): Promise<void> {
  const session = await requireStudentSession();
  await touchWordHeftLinkOpened(linkId, session.studentCodeId);
}

export async function removeWordHeftLink(linkId: string): Promise<void> {
  const session = await requireStudentSession();
  await deleteWordHeftLink(linkId, session.studentCodeId);
  revalidatePath('/s', 'layout');
}

function formValidationReason(
  reason: 'leer' | 'kein_url' | 'kein_https' | 'fremde_domain' | 'zu_lang'
): string {
  switch (reason) {
    case 'leer':
      return 'Bitte einen Link einfügen.';
    case 'kein_url':
      return 'Das sieht nicht nach einem Link aus. Bitte den vollständigen Link kopieren.';
    case 'kein_https':
      return 'Nur sichere Links (https://...) sind erlaubt.';
    case 'fremde_domain':
      return 'Das ist kein OneDrive-Link. Bitte den Link aus Word/OneDrive verwenden.';
    case 'zu_lang':
      return 'Der Link ist ungewöhnlich lang. Bitte nochmal aus Word kopieren.';
  }
}
