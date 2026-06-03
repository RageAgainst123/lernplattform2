// Pure Helper: prüft ob eine URL grundsätzlich nach einem OneDrive-/
// SharePoint-Sharing-Link aussieht. Nur Form-Check, keine Netzwerk-Calls.
// Phishing-Schutz: wir akzeptieren NUR die expliziten Microsoft-Domains.
//
// Tatsächliche Erreichbarkeit prüft ein zweiter Schritt (HEAD-Request,
// separat in der Server-Action). Dieser Helper ist die erste Bordwand
// gegen offensichtlichen Müll (leere Strings, böse URLs, Tippfehler).

// Erlaubte Domains für OneDrive/SharePoint Sharing-Links:
//   - *.sharepoint.com         (klassisches SharePoint, z.B. nms.sharepoint.com)
//   - *-my.sharepoint.com      (OneDrive Business, z.B. nms-my.sharepoint.com)
//   - onedrive.live.com        (OneDrive Personal — eher unwahrscheinlich
//     bei Schul-Konten, aber wir blockieren nicht)
//   - 1drv.ms                  (Microsofts Kurz-Link-Domain)
//
// NICHT erlaubt: Phishing-Versuche wie sharepoint.com.evil.at oder
// my-onedrive.com (kein Microsoft-Eigentum).
const ALLOWED_HOST_PATTERNS: RegExp[] = [
  /^[a-z0-9-]+\.sharepoint\.com$/i,
  /^[a-z0-9-]+-my\.sharepoint\.com$/i,
  /^onedrive\.live\.com$/i,
  /^1drv\.ms$/i,
];

export type LinkValidationResult =
  | { ok: true; normalizedUrl: string; host: string }
  | {
      ok: false;
      reason: 'leer' | 'kein_url' | 'kein_https' | 'fremde_domain' | 'zu_lang';
    };

export function validateOneDriveLink(raw: string): LinkValidationResult {
  const trimmed = (raw ?? '').trim();
  if (trimmed.length === 0) return { ok: false, reason: 'leer' };
  if (trimmed.length > 2000) return { ok: false, reason: 'zu_lang' };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, reason: 'kein_url' };
  }

  // Nur https — http würde uns vor MITM-Risiko ungeschützt lassen.
  if (url.protocol !== 'https:') {
    return { ok: false, reason: 'kein_https' };
  }

  const host = url.host.toLowerCase();
  const matches = ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(host));
  if (!matches) {
    return { ok: false, reason: 'fremde_domain' };
  }

  return { ok: true, normalizedUrl: url.toString(), host };
}
