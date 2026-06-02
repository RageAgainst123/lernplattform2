# Rollen & Zugriffsrechte

> Diese Datei klärt das **Wer** der Plattform — welche Rollen es gibt, was
> sie dürfen, wie sie technisch erkannt werden, wo geprüft wird.
> Ergänzt [INHALTSKONZEPT.md](INHALTSKONZEPT.md) (das **Was** der Inhalte).
> Stand: 2026-05-30.

## 1. Vier Rollen

| Rolle             | Wer                      | Auth-Mechanismus                                         | Session                           |
| ----------------- | ------------------------ | -------------------------------------------------------- | --------------------------------- |
| **Öffentlich**    | jede:r ohne Login        | kein Auth                                                | keine                             |
| **Schüler:in**    | Kinder im Klassenverband | Klassencode + 4-stellige PIN **oder** O365-SSO (Phase O) | jose-JWT, HTTP-Only Cookie (1 J.) |
| **Lehrer:in**     | Lehrkräfte               | Magic-Link via Supabase Auth                             | Supabase Session-Cookie (Refresh) |
| **Admin (Autor)** | aktuell nur Geo          | Lehrer:in-Login **+** E-Mail in `BRAND.adminEmails`      | wie Lehrer:in                     |

**Wichtig:** Admin ist eine **erweiterte Lehrer:in-Rolle** — kein zweites Login-System.
Geo loggt sich genauso ein wie jede andere Lehrkraft; die Allowlist hebt ihn ab.

## 2. Was darf welche Rolle?

| Aktionsbereich                                                   | Öffentlich | Schüler:in | Lehrer:in                       | Admin                 |
| ---------------------------------------------------------------- | ---------- | ---------- | ------------------------------- | --------------------- |
| **Öffentliche Inhalte ansehen** (Materialien, Module-Übersicht)  | ✓          | ✓          | ✓                               | ✓                     |
| **PDF herunterladen** (Material, außer `is_teacher_only`)        | ✓          | ✓          | ✓                               | ✓                     |
| **Material online ausfüllen** (verknüpftes Modul starten)        | ✗          | ✓          | (technisch ja, didaktisch nein) | ✓                     |
| **Eigene Klassen verwalten** (anlegen, ansehen)                  | ✗          | ✗          | ✓ (nur eigene)                  | ✓ (nur eigene)        |
| **Schüler:innen-Codes generieren** (PINs anlegen, Liste drucken) | ✗          | ✗          | ✓                               | ✓                     |
| **Module der eigenen Klasse zuweisen**                           | ✗          | ✗          | ✓                               | ✓                     |
| **Eigene Fortschritte ansehen / fortsetzen**                     | ✗          | ✓          | ✗                               | ✗                     |
| **Klassen-Fortschritt ansehen** (Auswertung Lehrer:in)           | ✗          | ✗          | ✓ (nur eigene Klassen)          | ✓ (eigene + alle?)    |
| **Materialien hochladen / bearbeiten**                           | ✗          | ✗          | ✗                               | ✓                     |
| **Module erstellen / bearbeiten / publizieren**                  | ✗          | ✗          | ✗                               | ✓                     |
| **Material ↔ Modul verknüpfen**                                  | ✗          | ✗          | ✗                               | ✓                     |
| **Lehrer:innen-Konten verwalten**                                | ✗          | ✗          | ✗                               | (vorerst nicht im UI) |

**Bewusst nicht:** Lehrer:innen erstellen weder Materialien noch Module. Wenn eine
Lehrkraft ein neues Arbeitsblatt braucht, schreibt sie Geo eine E-Mail.

## 3. Wo wird Zugriff geprüft?

Drei Verteidigungs-Linien, von außen nach innen:

### 3.1 Edge: `proxy.ts`

Erste Bordwand — verhindert, dass falsche Rollen Routen überhaupt erreichen.

| Pfad                                                                    | Pflicht                                                                    |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `/` , `/dgb/*`, `/k`, `/login`, `/impressum`, `/datenschutz`, `/auth/*` | offen                                                                      |
| `/k/[code]`                                                             | offen (Schüler:innen-Login)                                                |
| `/s/*`                                                                  | gültige Schüler:innen-Session (jose) — sonst → `/k`                        |
| `/lehrer/*`                                                             | Supabase-Login — sonst → `/login`                                          |
| `/admin/*`                                                              | Supabase-Login **+** E-Mail in Allowlist — sonst → `/login` bzw. `/lehrer` |

### 3.2 Server-Funktionen: `requireXxx()`

Zweite Bordwand — auch wer am Proxy vorbeikommt, scheitert hier.

- `requireUser()` in `lib/auth/teacher-auth.ts` — Lehrer:in
- `requireStudentSession()` in `lib/auth/student-auth.ts` — Schüler:in
- `requireAdmin()` in `lib/auth/admin-auth.ts` — Admin (ruft intern `requireUser` + Allowlist-Check)

Jede Server Action und jede protected Page **muss** mit einem `requireXxx` beginnen.

### 3.3 Datenbank: Row Level Security

Dritte Bordwand — Supabase-RLS-Policies verhindern, dass jemand falsche Daten
liest oder schreibt, selbst wenn Code falsch ist.

- `teachers`: nur eigene Datensätze (`auth.uid() = id`)
- `classes`: nur eigene (`auth.uid() = teacher_id`)
- `student_codes`: nur Codes eigener Klassen
- `modules`: `is_published OR auth.uid() = created_by`
- `materials`: ähnlich (öffentlich lesbar wenn nicht `is_teacher_only`)
- `student_progress`: Schüler:in schreibt via Service-Role; Lehrer:in liest
  Fortschritte eigener Klassen (`student_progress_select_own_classes`) **und**
  darf seit Phase 16 für eigene Klassen schreiben (`student_progress_update_own_classes`,
  Migration 0007) — Feedback geben + Modul zurückgeben (`completed_at` zurücksetzen).
  Dieser Schreibzugriff läuft über den **User-Client + RLS**, NICHT Service-Role
  (siehe `teacher-feedback-actions.ts`; ADR-0012).

**Admin-Spezial:** Da Admin technisch eine Lehrer:in ist, gelten dieselben RLS-Policies.
Admin-spezifische Aktionen (Modul-CRUD) laufen über den **Service-Role-Client**
(`lib/supabase/admin.ts`) — RLS wird dabei bewusst umgangen. Das ist sicher, weil
zuerst `requireAdmin()` läuft.

## 3a. Header-Verhalten je Rolle

Der globale Header (`components/site/SiteHeader.tsx`) zeigt **einen einzigen
kontextabhängigen Nav-Link** in der Mitte — je nach Rolle. Der rechte Slot
zeigt Login-Status oder Login-CTA. Quelle der Wahrheit ist
`fetchAuthSlot()` aus `HeaderAuth.tsx` (paralleler `getUser` +
`getStudentSession`, ein Request, kein doppelter DB-Roundtrip).

| Rolle          | Mittlerer Nav-Link           | Rechter Slot                                                                                                |
| -------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Öffentlich** | „Schüler:innen-Login" → `/k` | Button „Lehrer:innen-Login" → `/login`                                                                      |
| **Schüler:in** | „Mein Bereich" → `/s`        | Anzeigename (Vorname Nachname bei SSO, Codename bei Code+PIN) + ⚙️-Dropdown („Klasse verlassen" + Abmelden) |
| **Lehrer:in**  | „Mein Dashboard" → `/lehrer` | E-Mail (max 24 Zeichen, sonst „…") + Abmelden-Form (`signOut`)                                              |
| **Admin**      | „Mein Dashboard" → `/lehrer` | Zusätzlich „Admin"-Link → `/admin`, sonst wie Lehrer:in                                                     |

**Materialien** (`/dgb`) ist für alle Rollen sichtbar — als zweiter Link
links neben dem rollenabhängigen Nav-Link.

**Mobile-Menü** (`MobileMenu.tsx`) zeigt dieselben Links plus den
Abmelden-Button als eigene Sektion unten im aufgeklappten Menü.

Siehe ADR-0008 für die Architektur-Entscheidung.

## 4. Wie wird Admin erkannt?

```typescript
// lib/brand.ts
export const BRAND = {
  // …
  adminEmails: ['geoschlegel@gmail.com'] as readonly string[],
} as const;
```

```typescript
// lib/auth/admin-auth.ts
import 'server-only';
import { BRAND } from '@/lib/brand';

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return BRAND.adminEmails.some((a) => a.toLowerCase() === normalized);
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user.email)) redirect('/lehrer');
  return user;
}
```

Vorteile:

- Kein DB-Schema-Eingriff
- Single Source: eine Datei (`brand.ts`) ändern → überall wirksam
- Skaliert für 1–3 Admins (mehr ist unwahrscheinlich)
- Wenn doch mehr Admins kommen: später `teachers.is_admin`-Spalte ergänzen, Allowlist als Fallback

## 5. Was ist bewusst ausgeschlossen?

- **Lehrer:innen-Modul-Editor.** Inhalte macht der Autor.
- **Eigenes Admin-Login** (nicht via Lehrer:in-Magic-Link). Zwei Auth-Systeme wären
  Overkill für 1 Admin.
- **„Super-Lehrer:in", die alle Klassen sieht.** RLS bleibt streng. Wenn Geo
  überklassenweite Statistiken braucht, baut er sich eine Admin-Sicht via
  Service-Role-Client mit eigener UI.
- **Public-Registrierung.** Lehrer:innen-Konten entstehen automatisch beim ersten
  Magic-Link-Login (Auto-Profil-Anlage in `ensureTeacherProfile`).
- **„Eltern"-Rolle.** Eltern haben heute keinen eigenen Zugang.
- **„Schul-Admin"-Rolle** (eine Lehrer:in verwaltet ihre Kolleg:innen). Single-User-Modell.

## 6. Querverweise

- [INHALTSKONZEPT.md](INHALTSKONZEPT.md) — Was sind Material/Modul/Thema?
- [adr/](adr/) — Architektur-Entscheidungen (Auth, Schema, Solver-Wahl)
- Datenschutzerklärung in `app/datenschutz/page.tsx` — DSGVO-Verarbeitungs-Sicht
  der Rollen
- `lib/auth/teacher-auth.ts`, `lib/auth/student-auth.ts`, `lib/auth/admin-auth.ts`
  — Implementierungen
- `proxy.ts` — Edge-Schutz
- `supabase/migrations/0002_rls_policies.sql` — DB-Policies

## 6a. Schüler:innen-Identität: zwei parallele Pfade (Phase O)

Seit Phase O kann eine Schüler:in auf zwei Wegen Mitglied einer Klasse werden:

| Login-Pfad     | Erforderlich              | `student_codes`-Felder                                                         | PII-Status                                                  |
| -------------- | ------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Code + PIN** | Klassencode + 4-st. PIN   | `codename`, `pin_hash`; alle O365-Felder NULL                                  | pseudonym (keine PII)                                       |
| **O365-SSO**   | Microsoft-365-Schul-Konto | `codename`, `o365_oid`, `o365_email`, `given_name`, `surname`; `pin_hash` NULL | Vorname/Nachname/E-Mail sind PII — Datenschutz §3 erweitert |

Beide Pfade landen am Ende im **gleichen jose-Cookie** — alle bestehenden
Helper (`getStudentSession`, `requireStudentSession`, RLS-Policies) sind
unverändert. Multi-Klassen-Mitgliedschaft eines O365-Users = mehrere Rows
mit gleicher `o365_oid` (partial unique index auf `(o365_oid, class_id)`).

**Optionale Domain-Allowlist pro Klasse:** `classes.allowed_email_domains text[]`
(Migration 0017). NULL = alle Domains erlaubt. Bei gesetzter Liste prüft
`joinClassWithO365` vor dem Insert (`isEmailDomainAllowed`-Helper, getestet).
Code+PIN-Schüler:innen sind nicht betroffen.

**Schüler:innen können selbst austreten:** Settings-Menü oben rechts →
„Klasse verlassen" löscht die `student_codes`-Row (Cascade räumt Progress,
Hefte, Streak), beendet die Session, redirected nach `/k`.

Siehe ADR-0014 für die Architektur-Entscheidung, `docs/adr/0014-o365-sso-fuer-schueler-innen.md`.

## 7. Änderungs-Protokoll

- **2026-05-28** — Datei angelegt; Admin-Rolle als E-Mail-Allowlist eingeführt,
  damit Geo nicht mehr „als Lehrer:in mit Spezialwissen" arbeiten muss.
- **2026-05-29** — Schüler:innen-UX-Polish (Phase 13): Login-Status wird im
  Header sichtbar (Codename + Abmelden); siehe §3a.
- **2026-05-29** — Rollenabhängiger Header (Phase 14, ADR-0008): mittlerer
  Nav-Link wechselt je nach Rolle (Schüler:in → Mein Bereich, Lehrer:in →
  Mein Dashboard, Anonym → Schüler:innen-Login). „Mein Bereich" `/s` zeigt
  Übersichts-Pille + Modul-Status-Badges (damals 3-stufig; seit Phase 16
  4-stufig inkl. `returned`).
- **2026-05-29** — Sicherheits-Sprint: Open-Redirect im Magic-Link-Callback
  geschlossen (ADR-0009 — `safeNext()`-Helper), Login + Logout in beide
  Richtungen symmetrisch (siehe `lib/auth/session-cleanup.ts`): wenn man
  sich neu einloggt oder ausloggt, wird die jeweils andere Rolle-Session
  beendet. Damit gibt es nie zwei aktive Rollen-Cookies gleichzeitig.
- **2026-05-29** — Phase 15: Lehrer:innen können im UI Module zu eigenen
  Klassen zuweisen (`/lehrer/klassen/[id]` Modul-Sektion) und den
  Klassen-Fortschritt als Matrix sehen (`/lehrer/klassen/[id]/fortschritt`).
  RLS-Policies `class_modules_all_own` und `student_progress_select_own_classes`
  erzwingen die Sicht auf eigene Klassen. Codenamen sind anonym — Lehrer:in
  sieht nur Status + Score, keine PII (DSGVO §6).
- **2026-06-02** — Phase O (ADR-0014): O365-SSO als zweiter Login-Pfad für
  Schüler:innen, parallel zu Code+PIN. Erweitert `student_codes` um
  `o365_oid`/`o365_email`/`given_name`/`surname`/`sso_first_login_at`
  (Migration 0015). Optionale E-Mail-Domain-Allowlist pro Klasse
  (Migration 0017). Tinkercad-Pattern für Klassen-Beitritt via Code.
  Schüler:innen-Header bekommt Settings-Dropdown („Klasse verlassen" +
  Abmelden), Klassenname wird im `/s`-Dashboard angezeigt. Lehrer:innen
  können Klassen löschen (Cascade) und Klassen-Code via Beamer-Modus
  groß zeigen. Datenschutz §3 spiegelt die neue PII-Situation für
  SSO-Schüler:innen wider. Siehe §6a.
- **2026-05-30** — Phase 16 (ADR-0011 + ADR-0012): Lehrer:innen sehen Abgaben
  im Detail (`/lehrer/klassen/[id]/fortschritt/[studentCodeId]/[moduleId]`) und
  können sie **mit Feedback zurückgeben** (4. Status `returned`). Neue RLS-
  UPDATE-Policy `student_progress_update_own_classes` (Migration 0007) erlaubt
  Lehrer:innen Schreibzugriff auf `student_progress` der eigenen Klassen —
  über User-Client + RLS, **nie** Service-Role. Bestehens-Schwelle pro Zuweisung
  (`class_modules.pass_threshold`). Schüler:innen-Status hat nun 4 Stufen
  (offen / in Bearbeitung / zurückgegeben / erledigt).
