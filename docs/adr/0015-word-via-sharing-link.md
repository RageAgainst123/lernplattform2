# ADR-0015: Word-Heft-Integration via OneDrive-Sharing-Link, kein API-Zugriff

**Status:** accepted
**Datum:** 2026-06-03

## Kontext

Geo ist mit dem selbstgebauten Tiptap-Heft (Phasen H, H+) unzufrieden. Für
O365-Schüler:innen (A1-Education-Lizenz mit Word-Web + 100 GB OneDrive) wäre
echtes Word der bessere Editor. Wunsch: Heft landet im OneDrive der
Schüler:in, Lehrer:in kann es einsehen, kein technischer Aufwand für
Schul-IT-Admins anderer Schulen.

Drei Pfade in der Recherche geprüft (Workflow `wf_9390f7a0-933` + Detail-
Recherche zum Sharing-Link):

1. **Word inline embedden (WOPI/CSPP)** — Voraussetzung Microsoft-Cloud-
   Storage-Partner-Vertrag, monatelanges Onboarding, Enterprise-Setup.
   Für Solo-Lehrer unerreichbar.
2. **OneDrive-Datei via Graph-API (`Files.ReadWrite`) anlegen** — seit
   Microsofts Juli-2025-Consent-Policy-Verschärfung scheitert das in 50–80%
   der Schul-Tenants am „Admin approval required"-Screen. Bricht die
   harte Anforderung „muss in fremden Schulen ohne IT-Eingriff laufen".
3. **Eigener Storage (Supabase / Cloudflare R2 / Hetzner)** — funktioniert
   überall, aber Schüler:in muss `.docx` runterladen und zu uns hochladen.
   UX-Bruch, Storage-Kosten, AV-Scan-Pflicht (Aufsichtspflicht),
   Backup-Pflicht.
4. **Sharing-Link** — Schüler:in legt selbst in OneDrive an, klickt
   „Freigeben → Link kopieren", paste in unsere App. Wir speichern nur
   die URL.

## Entschieden

**Sharing-Link-Pfad mit UI-Coaching + Server-Side-Validierung.**

- Wir speichern nur die OneDrive-URL in `word_heft_links` — keine Datei-
  Inhalte, kein Microsoft-API-Zugriff, keine neuen Azure-Scopes über die
  Phase-O-`openid profile email` hinaus.
- Schüler:in legt das Heft manuell in ihrem OneDrive an (Word-Web oder
  Desktop). Sie klickt „Freigeben → Personen in [Schule] mit Link →
  Bearbeitungs-Rechte → Link kopieren" und klebt den Link in unser
  Eingabefeld.
- Wir validieren die URL-Form (`*.sharepoint.com`, `*-my.sharepoint.com`,
  `*.onedrive.live.com`) und machen einen Server-Side-HEAD-Request um zu
  prüfen ob die URL überhaupt antwortet. Bei `unverified` (CORS/Auth)
  speichern wir trotzdem und zeigen Lehrer:in beim Click einen Hinweis.
- UI führt Schüler:innen durch ein Modal mit 4 Screenshots Schritt für
  Schritt durch den Sharing-Klick-Pfad — sonst landet der Default
  „Bestimmte Personen mit Link" und niemand kann öffnen.
- Lehrer:in klickt auf das Heft-Symbol in der Klassen-Matrix → öffnet
  Sharing-URL in neuem Tab → Word-Web zeigt die Datei.
- **Cross-Tenant funktioniert nur wenn Lehrer:in selbst mit O365 in
  unserer App eingeloggt ist** (Phase O5 wird damit semi-Pflicht für
  Word-Heft-Einsicht aus fremden Schulen — same-tenant geht ohne).

## Verworfen

- **WOPI / Cloud Storage Partner Program** — Solo-Entwickler-unerreichbar.
- **Graph-API `Files.ReadWrite` (Auto-Anlage)** — Microsoft-Consent-Hürde
  in 50–80% der Tenants. Plattform die in jeder dritten Schule beim ersten
  Klick scheitert ist unbenutzbar.
- **Graph-API `Files.ReadWrite.AppFolder` (Auto-Anlage, schmaler Scope)** —
  selbe Consent-Hürde, gleicher Filter, bringt nichts.
- **Eigener Storage (Supabase/R2/Hetzner)** — funktioniert technisch, aber
  Storage-Kosten + AV-Scan-Pflicht + Backup-Pflicht + Download-Upload-
  Bruch. Workflow-Empfehlung war eigentlich Storage, aber Geo hat den
  Storage-Bedarf abgelehnt.
- **Verified Publisher (MPN)** — hilft nicht für `Files.*`-Scopes, weil
  die nicht in der Default-Low-Impact-Klassifikation sind.

## Konsequenzen

- **Tiptap-Heft bleibt parallel** — für Code+PIN-Schüler:innen
  (Volksschule, Vertretung, ohne O365). O365-Schüler:innen sehen Tiptap
  NICHT, sie kriegen direkt das Word-Heft-UI.
- **Zwei Heft-Modelle nebeneinander** — DB-Tabellen
  `portfolio_entries` (Tiptap) und `word_heft_links` (Word) leben getrennt.
  UI-Conditional anhand `student_codes.o365_oid IS NOT NULL`.
- **Permission-Falle als UX-Risiko** — der Default-Sharing-Modus
  „Bestimmte Personen" ist falsch für unseren Workflow. Schüler:innen
  müssen aktiv umstellen. Modal-Anleitung + Live-Validierung soll
  Fehlerrate von vermutlich ~30–50% (Erstversuch) auf <10% drücken.
- **Cross-Tenant-Sharing seit Juli 2025 wackelig** — Microsofts B2B-
  Invitation-Manager erzwingt MS-Login der Lehrer:in beim Öffnen.
  Magic-Link-only-Lehrer:innen können Schüler-Word-Hefte aus fremden
  Schulen nicht öffnen. Same-tenant (Lehrer:in und Schüler:in selbe Schule)
  geht weiterhin reibungslos. Phase O5 (Lehrer:innen-SSO) wird damit
  praktisch Pflicht für volle Cross-Tenant-Werkbarkeit.
- **„View-Only" blockiert Kommentare** — die Anleitung empfiehlt
  „Bearbeitungs-Rechte für die Schule". Lehrer:in kann theoretisch
  versehentlich Text löschen — Word-Web-Versionsverlauf mitigiert
  dieses Risiko.
- **DSGVO-Konsequenzen sehr gering** — wir speichern nur eine URL
  (200 Zeichen), keine Schüler-Inhalte. Datei liegt im OneDrive der
  Schüler:in (Schul-Tenant, EU-Region bei A1 EDU). Microsoft hat AVV
  mit der Schule direkt. Beim Klassen-Verlassen löschen wir die URL,
  die Datei bleibt im OneDrive (Schüler:in entscheidet selbst über
  Löschung).
- **Storage-Kosten null.** Speicher pro Eintrag: ~250 Bytes (URL +
  Metadaten). Bei 50 Schüler:innen × 10 Themen = 125 KB. Bleibt im
  Supabase-Free-Tier auf ewig.
- **Wartung minimal.** Kein Microsoft-API-Zugriff, kein Token-Refresh,
  kein MSAL.js, kein eigener Storage-Backup, kein AV-Scan.

## Verbundene Entscheidungen

- ADR-0014 (O365-SSO für Schüler:innen) — `student_codes.o365_oid` ist der
  Diskriminator für Tiptap vs. Word-UI.
- Phase O5 (Lehrer:innen-SSO) — wird damit semi-Pflicht für
  Cross-Tenant-Word-Hefte. Magic-Link-only-Lehrer:innen sehen Hinweis.
- Phase H + H+ (Tiptap-Heft) — bleibt für Code+PIN-Schüler:innen.
- Migration 0018 — neue Tabelle `word_heft_links`.
