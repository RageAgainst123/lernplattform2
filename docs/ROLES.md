# Rollen & Zugriffsrechte

> Diese Datei klärt das **Wer** der Plattform — welche Rollen es gibt, was
> sie dürfen, wie sie technisch erkannt werden, wo geprüft wird.
> Ergänzt [INHALTSKONZEPT.md](INHALTSKONZEPT.md) (das **Was** der Inhalte).
> Stand: 2026-05-28.

## 1. Vier Rollen

| Rolle             | Wer                      | Auth-Mechanismus                                    | Session                           |
| ----------------- | ------------------------ | --------------------------------------------------- | --------------------------------- |
| **Öffentlich**    | jede:r ohne Login        | kein Auth                                           | keine                             |
| **Schüler:in**    | Kinder im Klassenverband | Klassencode + 4-stellige PIN                        | jose-JWT, HTTP-Only Cookie (8 h)  |
| **Lehrer:in**     | Lehrkräfte               | Magic-Link via Supabase Auth                        | Supabase Session-Cookie (Refresh) |
| **Admin (Autor)** | aktuell nur Geo          | Lehrer:in-Login **+** E-Mail in `BRAND.adminEmails` | wie Lehrer:in                     |

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
- `student_progress`: Schüler:in schreibt via Service-Role; Lehrer:in liest nur
  Fortschritte eigener Klassen

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

| Rolle          | Mittlerer Nav-Link           | Rechter Slot                                                   |
| -------------- | ---------------------------- | -------------------------------------------------------------- |
| **Öffentlich** | „Schüler:innen-Login" → `/k` | Button „Lehrer:innen-Login" → `/login`                         |
| **Schüler:in** | „Mein Bereich" → `/s`        | „Angemeldet als 5A-01" + Abmelden-Form (`studentLogout`)       |
| **Lehrer:in**  | „Mein Dashboard" → `/lehrer` | E-Mail (max 24 Zeichen, sonst „…") + Abmelden-Form (`signOut`) |
| **Admin**      | „Mein Dashboard" → `/lehrer` | Zusätzlich „Admin"-Link → `/admin`, sonst wie Lehrer:in        |

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
  adminEmails: ['geoschlegel@gmail.com'] as const,
} as const;
```

```typescript
// lib/auth/admin-auth.ts
import 'server-only';
import { BRAND } from '@/lib/brand';

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return BRAND.adminEmails.includes(email.toLowerCase() as never);
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

## 7. Änderungs-Protokoll

- **2026-05-28** — Datei angelegt; Admin-Rolle als E-Mail-Allowlist eingeführt,
  damit Geo nicht mehr „als Lehrer:in mit Spezialwissen" arbeiten muss.
- **2026-05-29** — Schüler:innen-UX-Polish (Phase 13): Login-Status wird im
  Header sichtbar (Codename + Abmelden); siehe §3a.
- **2026-05-29** — Rollenabhängiger Header (Phase 14, ADR-0008): mittlerer
  Nav-Link wechselt je nach Rolle (Schüler:in → Mein Bereich, Lehrer:in →
  Mein Dashboard, Anonym → Schüler:innen-Login). „Mein Bereich" `/s` zeigt
  Übersichts-Pille + 3-stufige Modul-Status-Badges.
