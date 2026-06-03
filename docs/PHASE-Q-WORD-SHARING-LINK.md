# Phase Q — Word-Heft in OneDrive via Sharing-Link

> **Status:** geplant, noch nicht implementiert. Plan zum Drüberschlafen.
> **Voraussetzung:** Phase O (O365-SSO) ist live.
> **Branch (geplant):** `feature/word-onedrive-sharing-link`

## Context

Geo ist mit dem selbstgebauten Tiptap-Heft unzufrieden („wie für Kleinkinder").
O365-Schüler:innen haben A1-Education-Lizenz mit Word-Web + 100 GB OneDrive
eingebaut — naheliegender Wunsch: Word-Web statt Tiptap.

Recherche-Erkenntnisse aus Workflow `wf_9390f7a0-933` und ergänzender Detail-
Recherche zum Sharing-Link-Pfad:

- **Word inline als iframe einbetten** → unmöglich ohne Microsoft Cloud Storage
  Partner Program (CSPP), Vertragsverhandlung, monatelanges Onboarding. Für
  Solo-Lehrer-Entwickler unerreichbar.
- **Word-Datei via Graph-API in OneDrive anlegen** (`Files.ReadWrite`) →
  Microsoft-Juli-2025-Policy triggert in 50–80% der Schul-Tenants den
  „Admin approval required"-Screen. Bricht „muss einfach und simpel sein".
- **Eigener Storage (Supabase / R2 / Hetzner)** → funktioniert technisch
  überall, aber Schüler:in muss `.docx` runterladen + zu uns hochladen.
  UX-Bruch. Plus Storage-Kosten, AV-Scan-Pflicht, Backup-Pflicht.
- **Sharing-Link-Pfad (DIESE PHASE)** → Schüler:in legt selbst in OneDrive
  an, kopiert Sharing-Link in unsere App. Wir speichern nur die URL.

Vergleich der drei realistischen Pfade:

| Kriterium                 | Eigener Storage                   | Sharing-Link              | Tiptap (heute)             |
| ------------------------- | --------------------------------- | ------------------------- | -------------------------- |
| Storage-Kosten            | ab 1 GB nötig (R2 free / Pro $25) | 0 € (nur URL gespeichert) | 0 € (Supabase Free reicht) |
| Microsoft-Admin-Hürde     | keine                             | keine                     | keine                      |
| Datei-Inhalt liegt bei    | uns                               | Schüler:in OneDrive       | uns                        |
| AV-Scan-Pflicht           | ja (Aufsichtspflicht)             | nein (Datei nie bei uns)  | nein                       |
| UX-Bruch                  | Download → Upload                 | Permission-Dropdown-Klick | keiner                     |
| Cross-Tenant funktioniert | ja                                | nur mit O365-Lehrer-Login | ja                         |
| Versionierung             | wir bauen                         | OneDrive eingebaut        | wir haben                  |
| Word-Features             | voll                              | voll                      | sehr eingeschränkt         |
| Aufwand                   | 2–3 Wochen                        | 4–5 Tage                  | 0 (existiert)              |

## Entscheidungen (vom User)

- **Sharing-Link-Pfad bauen** — kein Storage-Backend bei uns, Schüler:in
  legt selbst an, klebt Link.
- **Tiptap bleibt parallel** als Fallback für Code+PIN-Schüler:innen.
- **O365-Schüler:innen sehen Tiptap NICHT** — saubere Trennung, Word ist
  ihr Editor.
- **Mit Anleitung + Live-Validierung** — die Permission-Falle (Default
  „Bestimmte Personen") wird durch UI-Coaching abgefangen.

## Architektur

### Identitäts-Modell — keine Schema-Änderung am Schüler-Konto

`student_codes.o365_oid IS NOT NULL` → Word-Heft-UI sichtbar. Sonst Tiptap.

### Neue DB-Tabelle: `word_heft_links`

```sql
create table public.word_heft_links (
  id              uuid primary key default gen_random_uuid(),
  student_code_id uuid not null references public.student_codes (id) on delete cascade,
  topic_id        uuid references public.topics (id) on delete set null,
  one_drive_url   text not null,                 -- Word-Web-Edit-URL / Sharing-Link
  display_name    text,                          -- Optional vom User vergeben
  validation_status text not null default 'pending'
    check (validation_status in ('pending','ok','broken','unverified')),
  last_validated_at timestamptz,
  last_opened_at    timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Pro Schüler:in × Thema EIN Word-Heft
create unique index word_heft_links_student_topic_idx
  on public.word_heft_links (student_code_id, topic_id)
  where topic_id is not null;

-- "Freies" Heft ohne Thema: pro Schüler:in beliebig viele
create index word_heft_links_student_idx
  on public.word_heft_links (student_code_id, created_at desc);
```

RLS:

- Schüler:in sieht/schreibt eigene Links (Service-Role, weil kein `auth.uid()`)
- Lehrer:in der Klasse sieht Links ihrer Schüler:innen (User-Client + RLS)

### Validierungs-Strategie

`validation_status` mit 4 Werten:

- `pending` — gerade eingefügt, noch nicht geprüft
- `ok` — HEAD-Request hat 200 zurückgegeben, Link funktioniert (zumindest
  für uns als Service-Role-Server)
- `broken` — HEAD hat 403/404 → Schüler:in muss Sharing-Permission ändern
- `unverified` — Validierung nicht möglich (Microsoft-CORS blockt, oder
  Link verlangt Login). Wir gehen davon aus dass er stimmt, zeigen aber
  bei Lehrer-Click einen Vorab-Hinweis „Falls Fehler kommt, frag die
  Schüler:in nach der Freigabe-Einstellung".

Validierung passiert **server-side** beim Eintragen (Server Action), nicht
clientseitig (CORS-Probleme).

### Was die Validierung NICHT garantiert

Ein 200-Response unsererseits sagt nur dass Microsofts Server überhaupt
antwortet. Es sagt **nicht**:

- ob Lehrer:in den Link auch öffnen kann (Permission „People you choose"
  würde uns 200 geben weil wir gar nicht eingeloggt sind, aber Lehrer:in
  bekommt 403)
- ob Cross-Tenant-Sharing aktiv ist

Deshalb auch das UI-Coaching mit Screenshot-Anleitung.

## Phasen

### Q1 — Plan + ADR (HEUTE, ½ Tag)

- `docs/PHASE-Q-WORD-SHARING-LINK.md` (diese Datei)
- `docs/adr/0015-word-via-sharing-link.md`
- CHANGELOG-Notiz

### Q2 — Migration 0018 + DB-Layer (½ Tag)

- Migration 0018: `word_heft_links` + RLS
- `lib/db/word-heft-links.ts`: `createLink`, `getLinkForTopic`,
  `getLinksForStudent`, `getLinksForClass`, `updateLastOpened`,
  `revalidateLink`
- 8–10 Unit-Tests für die pure Helper

### Q3 — Pure Link-Validation-Helper + Tests (½ Tag)

- `lib/onedrive/validate-link.ts` — Pure Helper der URL-Form prüft
  (`*.sharepoint.com/*` oder `*.onedrive.live.com/*` oder
  `*-my.sharepoint.com/*`) und Server-Action die HEAD-Request macht
- ~12 Tests: gültige Links, Phishing-URLs (z.B. `sharepoint.com.böse.at`),
  leere Strings, Whitespace, Cross-Site-Scripting in URL

### Q4 — Schüler-UI „Mein Word-Heft" (1 Tag)

Auf `/s/thema/[slug]` für O365-Schüler:innen (Conditional Rendering):

```
┌─────────────────────────────────────────────────┐
│ 📝 Mein Word-Heft                               │
│                                                  │
│ Noch nicht angelegt.                            │
│                                                  │
│ [Anleitung: So legst du dein Heft an]           │
│  ↓                                               │
│ Modal mit 4 Screenshots:                        │
│  1. Office.com öffnen → Word → Neue Datei       │
│  2. Datei umbenennen (z.B. "EVA-Prinzip.docx")  │
│  3. Klick "Freigeben" → Permission "Personen    │
│     in [Schule] mit Link" wählen                │
│  4. "Link kopieren" → in unten stehendes Feld   │
│     pasten                                       │
│                                                  │
│ [Word-Heft-Link eingeben] ___________________   │
│ [Speichern]                                      │
└─────────────────────────────────────────────────┘
```

Nach Speichern:

```
┌─────────────────────────────────────────────────┐
│ 📝 Mein Word-Heft                               │
│ ✅ EVA-Prinzip.docx                              │
│ Zuletzt geöffnet vor 3 Tagen                    │
│                                                  │
│ [📝 Heft öffnen]  [🔄 Link aktualisieren]      │
└─────────────────────────────────────────────────┘
```

Klick „Heft öffnen" → `window.open(oneDriveUrl, '_blank')` + Server-Action
`updateLastOpened`.

### Q5 — Lehrer-Klassen-Heft-Matrix erweitern (1 Tag)

`/lehrer/klassen/[id]/heft` zeigt heute Tiptap-Hefte. Erweitern um eine
zweite Sektion „Word-Hefte" mit derselben Matrix-Logik.

Pro Zelle:

- Symbol `📝` falls Word-Heft existiert
- Klick → `window.open(oneDriveUrl)` mit Pre-Hinweis-Modal beim ersten Mal:
  „Du wirst zu Microsoft Word-Web weitergeleitet. Falls 'Zugriff verweigert'
  kommt: Die Schüler:in muss in Word auf 'Freigeben' klicken und die Datei
  für die Schule freigeben."

Wenn Lehrer:in noch nicht via O365 eingeloggt: Hinweis-Banner oben
„Word-Hefte können nur eingesehen werden wenn du selbst mit Microsoft
eingeloggt bist. → Jetzt mit Microsoft anmelden" (führt zu Phase O5).

### Q6 — Datenschutz-Update + ADR-0015 + CHANGELOG (½ Tag)

Datenschutz-Seite ergänzen:

- „Word-Heft-Modus: die Datei liegt im OneDrive der Schüler:in (Schul-
  Tenant). Wir speichern nur die Sharing-Link-URL, keine Datei-Inhalte.
  Beim Klassen-Verlassen löschen wir die URL, die Datei selbst bleibt
  im OneDrive der Schüler:in."

ADR-0015 dokumentiert:

- Warum Sharing-Link statt Graph-API (Microsoft-Consent-Policy Juli 2025)
- Warum Sharing-Link statt eigenem Storage (Kosten, AV-Scan, UX-Bruch)
- Warum mit UI-Coaching + Validation (Permission-Falle Default)
- Was bewusst nicht enthalten ist

### Q7 — Gates + Commit + Push (1 h)

Voller Gate-Lauf, Browser-E2E mit echtem O365-Test-Konto, Commit, Push.

## Aufwand gesamt

**~4–5 Arbeitstage verteilt.** Hauptbrocken: Q4 (UI-Coaching-Modal mit
Screenshots) und Q5 (Lehrer-Matrix-Integration).

## Risiken (ehrlich)

1. **Permission-Falle bei Schüler:innen.** Default in Word-Web ist
   „Bestimmte Personen mit Link" — der frisch kopierte Link funktioniert
   für niemand. Mitigation: Modal-Anleitung mit Screenshots + Live-
   Validation. Real-Welt-Fehlerrate bleibt trotzdem ~10–20% beim ersten
   Versuch.
2. **Cross-Tenant nur mit O365-Lehrer-Login.** Lehrer:innen die heute nur
   Magic-Link nutzen, können Schüler-Word-Hefte aus FREMDEN Schulen nicht
   öffnen (Microsoft B2B-Redemption-Flow verlangt O365-Auth). Mitigation:
   Hinweis-Banner mit Verweis auf Phase O5 (Lehrer-SSO). Für same-tenant
   (Lehrer:in und Schüler:in selbe Schule) funktioniert es ohne Auth-Sorge.
3. **„View-Only"-Permission blockiert Lehrer-Kommentare.** Wenn Schüler:in
   einen Read-Only-Link teilt, kann Lehrer:in keine Kommentare in
   Word-Web setzen. Mitigation: in der Anleitung empfehlen
   „Bearbeitungs-Rechte für die Schule" (nicht View) — damit kann
   Lehrer:in kommentieren. Risiko: Lehrer:in könnte versehentlich Text
   löschen. Akzeptiert: Word-Web hat Versionsverlauf, Schüler:in kann
   wiederherstellen.
4. **Link-Rotation / OneDrive-Datei umbenannt oder gelöscht.** Wenn
   Schüler:in die Datei umbenennt → URL bleibt gültig. Wenn löscht → 404.
   Mitigation: Lehrer:in-Klick triggert Re-Validierung; bei 404 wird
   Status auf `broken` gesetzt, Schüler:in bekommt beim nächsten Login
   einen Hinweis.
5. **Microsoft ändert URL-Format.** Risiko gering aber nicht null. Unsere
   URL-Pattern-Validierung (`*.sharepoint.com`, `*-my.sharepoint.com`,
   `*.onedrive.live.com`) muss flexibel bleiben.

## Out of Scope für Phase Q

- **Auto-Anlage der Word-Datei in OneDrive** (das wäre Graph-API mit
  `Files.ReadWrite`, Admin-Consent-Hürde — bewusst nicht)
- **Lehrer:in legt Heft im Namen der Schüler:in an** (geht nicht ohne
  Graph-API mit Delegate-Permissions)
- **Inline-Word-Editor in iframe** (CSPP nötig, unmöglich)
- **Bidirektionale Sync Tiptap ↔ Word-docx** (Lossy-Albtraum)
- **PDF-Export-Alternative** für Lehrer-Download (Phase R falls Bedarf)
- **Word-Heft-Vorlagen** (z.B. „Hier ist eine leere Word-Vorlage für deinen
  Aufsatz") — würde Graph-API verlangen oder ein .docx als Asset
  hosten + Schüler:in muss runterladen → uploaden. Bewusst nicht für Q.

## Migrationen die Geo am Ende ausführen muss

- Migration 0017 (Phase O4, Domain-Allowlist) — noch ausstehend?
- **Migration 0018 (Phase Q, word_heft_links) — neu**

Beide STOP-Punkte im Supabase-Dashboard.
