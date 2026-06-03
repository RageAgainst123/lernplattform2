'use server';

import { revalidatePath } from 'next/cache';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { validateOneDriveLink } from '@/lib/onedrive/validate-link';
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

export type SaveWordHeftState = {
  ok: boolean;
  error?: string;
  validationStatus?: ValidationStatus;
};

// Server-side HEAD-Request gegen die OneDrive-URL.
// EHRLICH: wir können von außen ohne Microsoft-Login-Cookie kaum zuverlässig
// sagen ob ein Link funktioniert. Microsoft redirected oft zu login.live.com
// (HTTP 302/200 auf der Login-Seite) oder gibt 403 zurück wenn die Permission
// auf "Personen in deiner Organisation" steht — das heißt aber NICHT dass der
// Link kaputt ist, sondern nur dass UNSER anonymer Server nicht reinkommt.
//
// Strategie:
//   - 200 OHNE redirect zu login → wirklich öffentlich → 'ok'
//   - 200 MIT redirect zu login.* → org-only-link, vermutlich ok → 'unverified'
//   - 401/403 → wahrscheinlich org-only oder permission-restricted → 'unverified'
//   - 404 → Datei existiert nicht → 'broken'
//   - sonst → 'unverified'
//
// Wir wollen lieber "ℹ️ gespeichert" zeigen als fälschlich "⚠️ kaputt" wenn
// der Link für eine eingeloggte Lehrer:in eigentlich funktioniert.
async function probeOneDriveUrl(url: string): Promise<ValidationStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // 404 ist hartes "Datei weg" → wirklich broken
    if (response.status === 404) return 'broken';
    // 200 könnte ein Login-Redirect-Ziel sein (login.live.com etc.) — auch
    // dann ist der ursprüngliche Link aber vermutlich ok, nur wir nicht
    // berechtigt zu sehen. Wir setzen 'unverified' wenn finale URL auf einer
    // Microsoft-Login-Domain landet.
    const finalUrl = response.url.toLowerCase();
    if (finalUrl.includes('login.microsoftonline.com') || finalUrl.includes('login.live.com')) {
      return 'unverified';
    }
    if (response.ok) return 'ok';
    // 401/403/302 → wir kommen ohne Login nicht rein, sagt nichts über
    // tatsächliche Erreichbarkeit für die Lehrer:in. Lieber 'unverified'
    // als fälschlich 'broken'.
    return 'unverified';
  } catch {
    return 'unverified';
  }
}

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
