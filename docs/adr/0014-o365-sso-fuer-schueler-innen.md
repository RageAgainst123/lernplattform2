## ADR-0014: O365-SSO für Schüler:innen, parallel zu Code+PIN

**Status:** accepted
**Datum:** 2026-06-02

## Kontext

Heutiger Schüler:innen-Login = Klassen-Code (öffentlich am Beamer) + 4-stellige
PIN (geheim, von Lehrer:in ausgehändigt). Pseudonymer codename, kein PII
(ADR-0001 + ROLES.md §3.3). UX-Schmerz in der Praxis:

- Kinder vergessen PINs ständig → Lehrer:in muss neu generieren → Klassen-Workflow-
  Unterbrechung
- Geräte-Wechsel zwischen Schule/Heim verlangt erneutes Code+PIN-Eintippen
- In Niederösterreich haben **alle Schulen** O365 (auch Volksschulen) — die
  Kinder sind im Schul-Browser meistens schon eingeloggt

Tinkercad / Google Classroom haben das Pattern „SSO + Klassen-Code zum Beitritt"
seit Jahren bewährt. Für die Plattform wollten wir denselben Komfort, ohne den
bestehenden pseudonymen Pfad zu töten (Volksschule ohne O365, Vertretung,
Eltern-Bedenken).

Die plattform ist **multi-tenant**: dieselbe app läuft für alle nö-schulen.
eine azure-app-registrierung pro schule wäre nicht skalierbar — wir brauchen
**eine** azure-app, die alle microsoft-tenants akzeptiert.

## Entschieden

**O365-SSO als bevorzugter Login-Pfad, Code+PIN bleibt als Fallback.**
Beide Pfade landen am ende im gleichen `student_session`-jose-cookie — der
gemeinsame session-träger bleibt unverändert, alle bestehenden routen und
helper funktionieren weiter.

- **Multi-Tenant Azure-App** (`common` als Tenant-URL in Supabase) — eine
  Registrierung deckt alle NÖ-Schulen ab. Schul-Admins müssen nichts zustimmen,
  Microsoft prompted die Schüler:in selbst beim ersten Login (User Consent).
- **Erweiterung der `student_codes`-Tabelle** statt parallele Tabelle:
  optionale Spalten `o365_oid` (Microsoft Object ID — stabil über Email-Wechsel),
  `o365_email`, `given_name`, `surname`, `sso_first_login_at`. `pin_hash`
  wurde nullable, Check-Constraint erzwingt „pin_hash OR o365_oid".
- **Eine Row pro `(o365_oid, class_id)`** (partial unique index, NULL ignoriert).
  Multi-Class-Mitgliedschaft = mehrere Rows mit gleicher oid.
- **Tinkercad-Pattern für Beitritt:** nach OAuth-Callback ohne bestehende
  Mitgliedschaft → temporärer `sso_pending`-jose-Cookie (10 Min TTL) →
  `/k/join` zeigt Begrüßung + Klassen-Code-Form → `joinClassWithO365` legt
  Row an + setzt Standard-Student-Session-Cookie.
- **OAuth-Callback verwirft Supabase-Auth-Session sofort wieder** — Schüler:innen
  nutzen weiter den jose-Cookie, nicht den Supabase-Auth-Cookie. Sonst hätten
  wir Doppel-Session-Welten.
- **Codename-Strategie:** für SSO-User wird ein eindeutiger Slug aus Vorname/
  Nachname (oder Email-Lokalteil bei leeren Namens-Feldern) generiert. Der
  pseudonyme Codename bleibt in der Tabelle, dient aber nur noch als interne ID
  — Anzeige nutzt `studentDisplayName`-Helper (Vorname Nachname → Email-Lokalteil
  → Codename).

## Verworfen

- **Parallele `student_profiles`-Tabelle:** wäre konzeptionell sauberer
  (SSO-User != pseudonyme User), aber Joins überall, doppelte RLS-Policies,
  Komplexität in `requireStudentSession`. Erweiterung der bestehenden Tabelle
  ist minimal-invasiv.
- **Komplette Migration auf Supabase-Auth für alle Schüler:innen:** würde
  Code+PIN-Fallback töten — kritisch für Volksschule ohne O365 und für
  Vertretung. Außerdem widerspricht es ADR-0001/ROLES §5 (Schüler:innen ohne
  auth.uid()).
- **Eine Azure-App-Registrierung pro Schule:** skaliert nicht — wir wollen die
  Plattform für viele NÖ-Schulen anbieten, nicht pro Schule provisionieren.
- **Domain-Whitelist als Default:** wäre strenger („nur @ms-musterschule.at"),
  aber zu invasiv bei Schul-Wechseln und Microsoft-365-Education-Sub-Accounts.
  Optional pro Klasse, default offen.
- **QR-Code auf Beamer-Screen:** wäre nice, hätte aber eine neue Dependency
  (`qrcode.react` ~12 KB) erfordert. Klassen-Code in Riesen-Schrift reicht
  pragmatisch — Folge-Phase wenn echtes Bedürfnis entsteht.

## Konsequenzen

- **PII-Status ändert sich für SSO-Schüler:innen.** Die `student_codes`-Tabelle
  hat jetzt Vorname/Nachname/Email für SSO-User. Datenschutz-Doku
  (`app/datenschutz/page.tsx`) muss updaten — Microsoft Corporation wird
  Sub-Auftragsverarbeiter der Schule. Code+PIN-Schüler:innen bleiben pseudonym
  wie bisher.
- **Header-Anzeige ist Rollen-abhängig komplexer geworden.** SSO-Schüler:innen
  sehen ihren echten Namen, Code+PIN-Schüler:innen den Codenamen. Der
  `studentDisplayName`-Helper kapselt die Fallback-Kette.
- **Codename-Bug-Anfälligkeit:** beim ersten Roll-out hat sich gezeigt, dass
  Microsoft `given_name`/`family_name` nicht in jedem Tenant liefert — der
  Codename wurde `"."` und die Anzeige defekt. Migration 0016 repariert
  Bestand, der Callback nutzt jetzt `name`-Fallback + Email-Lokalteil-Ableitung.
- **Klassen-Verlassen + Klassen-Löschen wurden zur sichtbaren UX.** Vorher
  konnte niemand sich aus einer Klasse entfernen — beim SSO-Workflow ist das
  ein realer Bedarf (Probe-Beitritt, falsche Klasse erwischt). Ein eigenes
  Settings-Dropdown im Schüler:innen-Header bietet die Aktion.
- **Beamer-Code-Screen** ist die UI-Konsequenz aus „SSO + Klassen-Code". Die
  Lehrer:in muss den Code am Beamer groß zeigen können — eigene Route ohne
  Header-Chrome, prominenter Button auf der Klassen-Detail-Seite.
- **Lehrer:innen-SSO bleibt offen** (Phase O5). Sie nutzen bereits Supabase-
  Auth mit Magic-Link; ein zweiter Button „Mit Microsoft anmelden" auf `/login`
  wäre orthogonal. Aufschub, weil Magic-Link für 1 Lehrer:in heute reicht.

## Verbundene Entscheidungen

- ADR-0001: Schüler:innen haben kein `auth.uid()` — bleibt bestehen, jose-
  Cookie ist weiter der einzige Session-Träger.
- ADR-0013: Live-Polling — funktioniert unverändert, weil Session-Schema
  gleich bleibt.
- Migration 0015: erweitert `student_codes` um O365-Felder.
- Migration 0016: repariert Bestand mit defekten Codenames.
