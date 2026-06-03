# Phase P — Word-Heft in OneDrive für O365-Schüler:innen

> **Status:** geplant, noch nicht implementiert. **Ausführlicher Plan damit Geo drüberschläft.**
> **Voraussetzung:** Phase O (O365-SSO) ist fertig und live.
> **Branch (geplant):** `feature/word-onedrive-heft`

## Kontext

Tiptap-Heft (Phase H + H+) ist gebaut, funktioniert, aber Geo ist unzufrieden — es
ist im Vergleich zu echtem Word ein eingeschränkter Editor. Mit Phase O sind
SSO-Schüler:innen sowieso bei Microsoft eingeloggt und haben A1-Education-Lizenz
(Word-Web + 100 GB OneDrive). Naheliegender Schritt: für diese Gruppe das echte
Word nutzen statt unseres Tiptap-Klons.

## Entscheidungen (vom User)

- **Tiptap bleibt für Code+PIN-Schüler:innen** (Volksschule, Vertretung, ohne O365).
- **O365-Schüler:innen sehen Tiptap NICHT mehr** — saubere Trennung, klare Empfehlung
  pro Login-Pfad. Keine Doppel-Welt mit zwei Editoren.
- **Lehrer:innen sehen Word-Hefte als read-only-Vorschau in Word-Web** (eigener Tab),
  über kurzlebigen Sharing-Link via Graph.

## Was technisch realistisch ist (aus Recherche)

**Was NICHT geht:** Word-Web als iframe in unserer App. Dafür braucht es das
[Cloud Storage Partner Program (CSPP)](https://learn.microsoft.com/en-us/microsoft-365/cloud-storage-partner-program/)
mit Microsoft-Partnerschaft, monatelangem Onboarding, WOPI-Implementation. Auch
Moodle/Canvas embedden nicht inline — sie öffnen Word-Web in neuem Tab. Für uns
Solo-Entwickler ohne MS-Partnerschaft: ausgeschlossen.

**Was geht:** Microsoft Graph API
([Doku](https://learn.microsoft.com/en-us/graph/api/resources/onedrive)) mit
`Files.ReadWrite`-Scope (delegated, **User-Consent reicht — kein Tenant-Admin pro
Schule nötig**). Wir können:

- Im OneDrive der Schüler:in einen Ordner `Schulheft 2026` anlegen
- Darin eine `.docx` (aus leerer Vorlage) anlegen
- Die `webUrl` der Datei in unserer DB speichern
- Beim nächsten Klick in neuem Tab Word-Web mit genau dieser Datei öffnen

Schüler:in arbeitet im **echten Word mit allem drum und dran**: AutoSave,
Bilder per Drag&Drop, Tabellen, Formeln, Druck-WYSIWYG, Copilot (falls
Lizenz). **Bilder löst Word selbst** — sie werden in die `.docx` eingebettet,
kein eigener Bilder-Storage-Aufwand für uns.

**Showstopper-Risiko (gemildert):** Supabase refresht das Azure-Access-Token
nach 1 Stunde nicht automatisch. Lösung: **MSAL.js parallel zu Supabase**, eigene
Token-Verwaltung im Browser. Industry-Standard, gut beherrschbar, aber zweite
Auth-Schicht im Frontend.

## Architektur

### Identitäts-Modell-Änderung — KEIN Schema-Change

Wir nutzen das vorhandene `student_codes.o365_oid` als Diskriminator: ist sie
gesetzt → SSO-User → Word-Heft-UI. Sonst → Tiptap-UI. Reine UI-Verzweigung.

### Neue DB-Struktur: ein `onedrive_workbook_links`-Mini-Tabelle

```sql
create table public.onedrive_workbook_links (
  id              uuid primary key default gen_random_uuid(),
  student_code_id uuid not null references public.student_codes (id) on delete cascade,
  topic_id        uuid references public.topics (id) on delete set null,
  drive_item_id   text not null,                 -- OneDrive-File-ID
  web_url         text not null,                 -- Word-Web-Edit-URL
  display_name    text not null,                 -- "EVA-Prinzip.docx"
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (student_code_id, topic_id)
);
```

Per Schüler:in × Thema EIN Word-Dokument. Free-Hefte ohne Thema → `topic_id NULL`,
dann eindeutig per `(student_code_id, NULL)` mit partieller Constraint.

**Wichtig: wir speichern NUR Referenzen.** Die `.docx` selbst liegt im OneDrive
der Schüler:in. Beim Klassen-Verlassen löschen wir nur die Referenz — die
Datei bleibt im OneDrive (das ist datenschutzrechtlich genau richtig, Schüler:in
hat ja eigenen Account).

### Neue Azure-Permissions

Im bestehenden Azure-App-Registration unter „API permissions" hinzufügen:

- **`Files.ReadWrite`** (Microsoft Graph, delegated) — User darf eigene OneDrive-
  Dateien lesen/schreiben

KEIN `.All`-Scope nötig, KEIN Tenant-Admin-Consent. Beim ersten Klick auf
„Word-Heft anlegen" sieht Schüler:in einen MS-Consent-Screen: „Lernplattform
möchte auf deine Dateien zugreifen". Klick → fertig.

### MSAL.js parallel zu Supabase

```
┌─ Browser ──────────────────────────────────────────────┐
│                                                         │
│  Supabase-jose-Cookie  ←─── Login-Identität, Session    │
│  (bisher, unverändert)      für unsere DB + RLS         │
│                                                         │
│  MSAL.js-Token-Cache   ←─── Graph-API-Token,            │
│  (NEU, im sessionStorage)   für OneDrive-Calls          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Wichtig:** MSAL.js teilt sich die OAuth-Session mit Microsoft (gleiche Tab-
Session, weil bereits über Supabase angemeldet). Beim ersten Call macht MSAL
einen silent-token-acquire — User sieht keinen zweiten Login-Prompt, nur
einmalig den Consent-Screen für die neuen Scopes.

## Phasen

### P0 — User entscheidet, Plan absegnen (STOP)

Du liest diesen Plan, sagst „los", dann start P1.

### P1 — Azure-Scope erweitern (manuell, 5 Min, User)

1. Azure Portal → Lernplattform2-App → API permissions → Add permission
2. Microsoft Graph → Delegated → `Files.ReadWrite`
3. Speichern. KEIN Admin-Consent klicken (User-Consent ist gewollt).

### P2 — MSAL.js installieren + Auth-Helper (1 Tag)

Neue Dependency: `@azure/msal-browser` (~80 KB gz).

Neue Datei `lib/auth/msal-client.ts`:

- `getGraphToken()` → ruft `acquireTokenSilent`, fällt auf `acquireTokenPopup`
  zurück wenn nötig
- Cached Token in sessionStorage (MSAL macht das automatisch)
- Behandelt Consent-Fehler („AADSTS65001: The user or administrator has not
  consented") mit explizitem Popup-Flow

Tests: 5–8 Unit-Tests für Edge-Cases (Token abgelaufen, Consent fehlt, Popup
blockiert).

### P3 — Graph-API-Wrapper (½ Tag)

Neue Datei `lib/onedrive/workbook.ts`:

```typescript
ensureSchulheftFolder(token: string): Promise<{ folderId: string }>
createWordFile(token: string, folderId: string, filename: string): Promise<{
  driveItemId: string;
  webUrl: string;
}>
createSharingLink(token: string, driveItemId: string, type: 'view'): Promise<string>
```

Leere `.docx`-Vorlage als Asset im `public/assets/templates/empty-heft.docx`
(120 Bytes als ZIP-Container mit minimalem Word-XML).

### P4 — Migration 0018 + DB-Layer (½ Tag)

- Migration 0018: Tabelle `onedrive_workbook_links` + RLS-Policies
- `lib/db/onedrive-links.ts` mit `createLink`, `getLinkForTopic`,
  `getLinksForStudent`, `getLinksForClass`
- 8–10 Unit-Tests

### P5 — UI: „In Word öffnen"-Button (1 Tag)

Auf `/s/thema/[slug]` und `/s/heft`: Conditional Rendering basierend auf
SSO-Status der Schüler:in.

**Für SSO-User:**

- Statt „Heft-Notiz machen" steht „📝 In Word bearbeiten"
- Klick → MSAL-Token holen → Graph-Call: Datei anlegen (falls noch nicht da) →
  webUrl in DB speichern → `window.open(webUrl, '_blank')` mit echtem Word-Web
- Bei zweitem Klick: existierenden Link aus DB holen → direkt öffnen
- Kleine Status-Anzeige: „Zuletzt bearbeitet vor 2 Tagen" (per Graph
  `lastModifiedDateTime` einmal pro Page-Load fetchen)

**Für Code+PIN-User:**

- Tiptap-UI wie heute, unverändert.

### P6 — Lehrer:innen-Sicht (½ Tag)

`/lehrer/klassen/[id]/heft` zeigt Matrix wie bisher, aber für SSO-Schüler:innen
mit Word-Heft:

- Klick auf eine Zelle → MSAL-Token holen → Graph-Call:
  `POST /me/drive/items/{id}/createLink { type: 'view', scope: 'organization' }`
- Antwort enthält Sharing-URL, die für 7 Tage gültig ist (oder konfigurierbar)
- `window.open(sharingUrl, '_blank')` → Lehrer:in sieht Word-Web im
  View-Modus mit dem Schüler:innen-Eintrag

**Edge-Case:** Lehrer:in muss selbst O365-eingeloggt sein damit die `view`-
Sharing-URL funktioniert. Sonst Fehlermeldung „Bitte zuerst mit Microsoft
einloggen" (führt zum Lehrer:innen-SSO-Pfad — der parallel zu P5 oder
in einer eigenen Phase Q gemacht werden kann).

### P7 — Datenschutz-Update + ADR-0015 + CHANGELOG (½ Tag)

- Datenschutz-Seite ergänzen: „Bei Word-Heft-Nutzung liegen die Dateien
  im OneDrive der Schüler:in (Tenant der Schule, EU-Region). Wir speichern
  nur Referenzen + Sharing-Links. Microsoft Ireland ist bereits als
  Auftragsverarbeiter dokumentiert (Phase O4)."
- Retention-Block: „Beim Klassen-Verlassen löschen wir nur die Referenz, die
  Word-Dateien bleiben im OneDrive der Schüler:in. Schule/Eltern können diese
  über das OneDrive-Web-Interface der Schüler:in einsehen/löschen."
- ADR-0015 dokumentiert: warum kein WOPI, warum MSAL.js parallel, warum
  Tiptap nicht ersetzt sondern komplementär.
- CHANGELOG: Phase-P-Block.

### P8 — Gates + Commit + Push (1 h)

Voller Gate-Lauf, Browser-E2E mit echtem Test-O365-Konto, Commit, Push.

## Gesamtaufwand

~3–4 Arbeitstage verteilt. Größter Brocken: P5 (UI + Token-Refresh-Fehlerfälle).
Realistischer als die initialen 1–2 Wochenenden weil MSAL-Fehlerfälle (Popup
geblockt, Consent verweigert, Token expired mitten im Edit) sauber behandelt
werden müssen.

## Risiken

1. **Pop-up-Blocker.** MSAL braucht im Worst-Case Popup für interaktiven
   Consent. Wenn Browser blockt → User muss aktiv erlauben. Mitigation:
   klare Hinweis-UI bevor wir den Token holen.
2. **Wartung.** Microsoft kann Graph-API umbauen. Risiko gering (5+ Jahre
   Rückwärtskompatibilität bisher), aber nicht Null.
3. **Schüler:innen ohne A1-Lizenz.** Wenn eine NÖ-Schule A1 nicht zugewiesen
   hat → Word-Web öffnet nicht, Fehler. Mitigation: beim ersten Versuch
   freundliche Fehlermeldung „Deine Schul-IT muss Office freischalten",
   Fallback bleibt der Code+PIN-Pfad.
4. **Tab-Wechsel-UX.** Word öffnet in neuem Tab, das ist nicht so smooth wie
   inline. Akzeptiert (besseres ist nicht möglich ohne WOPI/CSPP).

## Out of Scope für Phase P

- **Bidirektionale Tiptap ↔ docx-Sync** (Lossy-Albtraum, bewusst nicht).
- **Word inline in iframe** (technisch unmöglich ohne MS-Partnerschaft).
- **Lehrer:in kommentiert direkt in Schüler:in-Word** (geht in Word-Web,
  aber Permissions-Setup wäre groß — später).
- **Microsoft-Teams-Assignments-Integration** (anderes Universum, eigene Phase Q).
- **Word für Lehrer:innen-Material-Erstellung** (Lehrer:in erstellt heute kein
  Material — ROLES.md §2).

## Migrationen die Geo am Ende ausführen muss

- Migration 0017 (Phase O4, Domain-Allowlist) — noch ausstehend
- Migration 0018 (Phase P, onedrive_workbook_links) — neu

Beide STOP-Punkte im Supabase-Dashboard.
