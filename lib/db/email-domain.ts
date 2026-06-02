// Pure Helper für die optionale E-Mail-Domain-Allowlist pro Klasse (Phase O4).
//
// Eine Klasse kann optional eine Liste erlaubter Domains haben (z.B.
// ['ms-musterschule.at']). Schüler:innen mit O365-Account aus einer
// anderen Domain können der Klasse nicht beitreten.
//
// Semantik:
//   - allowedDomains null/leer → alle Domains erlaubt (kein Filter aktiv)
//   - sonst muss die Email-Domain (lowercase) in der Liste sein
//
// Code+PIN-Schüler:innen haben keine Email → nicht betroffen.

export function isEmailDomainAllowed(
  email: string,
  allowedDomains: string[] | null | undefined
): boolean {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  const lower = email.toLowerCase();
  const atIdx = lower.indexOf('@');
  if (atIdx < 0 || atIdx === lower.length - 1) return false;
  const domain = lower.slice(atIdx + 1);
  return allowedDomains.some((d) => d.toLowerCase().trim() === domain);
}
