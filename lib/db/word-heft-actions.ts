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

// Phase Q3: Server Actions für Word-Heft-Link-Verwaltung.
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
// Was wir damit prüfen können: ist die URL überhaupt erreichbar? Gibt
// Microsoft 200 zurück oder 403/404?
// Was wir NICHT prüfen können: ob die Lehrer:in später mit ihrem
// Microsoft-Login auch reinkommt — das hängt vom Sharing-Modus ab den
// die Schüler:in gewählt hat, und das sehen wir als anonymer Aufrufer nicht.
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

    // 200-299 → Link antwortet, vermutlich ok
    if (response.ok) return 'ok';
    // 401/403 → Permission verweigert. Schüler:in muss Sharing-Modus ändern.
    // 404 → Datei existiert nicht / wurde gelöscht.
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      return 'broken';
    }
    // Sonstige Codes (Microsoft kann auch 302 zu Login-Page geben,
    // was im Browser anders aussieht als bei HEAD) → unverified.
    return 'unverified';
  } catch {
    // Netzwerk-Fehler, Timeout, CORS-Block etc. → unverified, nicht broken.
    // Wir geben dem Link den Benefit of the Doubt.
    return 'unverified';
  }
}

export async function saveWordHeftLink(args: {
  topicId: string | null;
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

  // HEAD-Request: prüft Erreichbarkeit. Wenn broken: Schüler:in trotzdem
  // speichern lassen, aber Status flaggen — sie muss dann in OneDrive die
  // Permission ändern und kann später Re-Validierung anstoßen.
  const probeStatus = await probeOneDriveUrl(formValidation.normalizedUrl);

  try {
    await upsertWordHeftLink({
      studentCodeId: session.studentCodeId,
      topicId: args.topicId,
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

  revalidatePath('/s');
  revalidatePath('/s/thema/[slug]', 'page');
  return { ok: true, validationStatus: probeStatus };
}

export async function markWordHeftOpened(linkId: string): Promise<void> {
  const session = await requireStudentSession();
  await touchWordHeftLinkOpened(linkId, session.studentCodeId);
}

export async function removeWordHeftLink(linkId: string): Promise<void> {
  const session = await requireStudentSession();
  await deleteWordHeftLink(linkId, session.studentCodeId);
  revalidatePath('/s');
  revalidatePath('/s/thema/[slug]', 'page');
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
