# Skalierungs-Plan: 1 → 1000 Schulen

> **Status: 📋 PLAN-DOKUMENT (nicht zu bauen).**
> Dieser Plan ist die **Schublade** für Architektur-Migrationen wenn die App wächst. Er ist KEINE aktuelle Arbeits­vorgabe — jede Sub-Phase wird erst aktiviert wenn klare Wachstums-Signale da sind.
> **Standing Rule:** Niemals vorzeitig migrieren. YAGNI. Erst aufrüsten wenn Metriken (siehe `docs/COST-CONTROLS.md`) zeigen dass das aktuelle Tier knapp wird.

## Zweck dieses Dokuments

Geo's strategische Sorge: „Wenn SEO greift und 500 Schulen kommen, darf nichts ruckeln. Aber ich will auch nicht heute schon 4 Monate Architektur bauen für ein Problem das vielleicht nie eintritt."

→ Dieser Plan sortiert die **Wachstums-Stufen** mit klaren **Triggern**, **Migrations­aufwand**, **Kosten** und **Risiken**. So weiß Geo immer:

1. Auf welcher Stufe stehe ich gerade?
2. Was ist der **nächste** Schritt — nicht der übernächste?
3. Wann (welche Metrik) muss ich diesen Schritt machen?
4. Was kostet er an Zeit und Geld?

## Wachstums-Stufen-Übersicht

| Stufe                  | Schul-Range | Architektur                                   | Monatliche Kosten | Trigger zum Nächsten                                        |
| ---------------------- | ----------- | --------------------------------------------- | ----------------- | ----------------------------------------------------------- |
| **0 — MVP**            | 1–10        | Vercel Hobby + Supabase Free + Polling        | **€0**            | Vercel-Function-Limit >80 % oder Supabase-Egress >4 GB      |
| **1 — Realtime + Pro** | 10–50       | + Phase T (Realtime-Broadcast) + Supabase Pro | **~€25**          | Vercel-Function-Limit Pro >80 % oder Concurrent-Quizzes >15 |
| **2 — Cloudflare**     | 50–200      | + Cloudflare Pages + CDN für Bilder           | **~€30–50**       | Supabase-DB >5 GB oder Bandwidth >180 GB                    |
| **3 — Self-Hosted**    | 200–2000    | + Hetzner-Server, Self-Hosted Supabase        | **~€30–80**       | Hetzner-Server >70 % CPU oder >100 GB DB                    |
| **4 — Verteilt**       | 2000+       | + Read-Replica + dedizierter WS-Server        | **~€100–250**     | …                                                           |

**Wichtig:** Stufe 0 → 1 → 2 → 3 → 4 ist die **Reihenfolge**, niemand überspringt. Jede Stufe hat einen klaren Trigger der sie auslöst. Stufe X bauen ohne Trigger = Over-Engineering.

---

## Stufe 0 — MVP (heute)

**Architektur:** Vercel Hobby + Supabase Free + HTTP-Polling
**Kosten:** €0/Monat
**Decke:** ~10 aktive Schulen, ~5–8 parallel laufende Quizzes

### Was bereits da ist

- Supabase Postgres + Auth + Storage + RLS
- Vercel Hobby mit Next.js 16
- Polling für Live-Sync (Lobby, Quiz, Präsentation)
- Code+PIN-Login + Microsoft-SSO
- Sprint S (Live-Quiz) — Sub-Phase S2 in Arbeit

### Trigger zum Wechsel auf Stufe 1

- Vercel-Dashboard zeigt >80 % der 100k Function-Calls/Tag
- Supabase-Dashboard zeigt >4 GB Egress/Monat
- ODER: erste Lehrer:innen melden „Quiz hängt manchmal"
- ODER: SEO-Launch geplant in <4 Wochen → proaktiv

### Aktivitäten in dieser Stufe

- Sprint S abschließen (Leaderboard, Podest)
- Pre-Launch-Härtung: Optimistic Updates, Lasttest, Graceful-Errors
- Status-Page bauen (`/status`)
- Soft-Limits einbauen (siehe `COST-CONTROLS.md`)

---

## Stufe 1 — Realtime + Pro (10–50 Schulen)

**Architektur:** + Phase T (Realtime-Broadcast für Quiz/Live) + Supabase Pro ($25)
**Kosten:** ~€25/Monat (Supabase Pro)
**Decke:** ~50 Schulen, ~20–50 parallele Quizzes

### Migration aus Stufe 0

Komplette Schritte stehen in `docs/PHASE-T-PLAN.md` (T0–T7, ~9–11 Tage).

### Zusätzlich auf Stufe 1

1. **Supabase Pro buchen:** Dashboard → Project Settings → Billing → Upgrade. 1-Klick, sofort aktiv.
2. **Bandwidth-Caching aktivieren:** Cache-Control-Header für statische Endpoints (Themen, Module). Spart 50–70 % Egress.
3. **Bild-Optimierung:** Next.js `<Image>` korrekt nutzen, AVIF/WebP-Konvertierung.
4. **Vercel-Edge-Runtime** für `/api/quiz/*` und `/api/live/*` (Cold-Start <100 ms statt 400 ms).
5. **Monitoring:** Better Stack Free-Tier einrichten (Uptime + Logs), Alert bei Vercel-Function-Errors >10/Stunde.

### Trigger zum Wechsel auf Stufe 2

- Vercel-Pro-Limit (1 Mio Functions/Tag) >70 %
- Supabase-DB >5 GB (gegen Pro-Limit 8 GB)
- Supabase-Egress >180 GB/Monat (gegen Pro-Limit 250 GB)
- Realtime-Connections im Peak regelmäßig >400 (von 500 Pro-inklusive)

---

## Stufe 2 — Cloudflare (50–200 Schulen)

**Architektur:** + Cloudflare Pages (statt Vercel) + Cloudflare R2 + CDN für Bilder
**Kosten:** ~€30–50/Monat (Supabase Pro + Cloudflare Workers Paid $5)
**Decke:** ~200 Schulen, ~50–100 parallele Quizzes

### Warum Cloudflare statt Vercel?

- **Function-Kosten viel günstiger:** Cloudflare Workers haben 10 Mio Requests/Monat für $5; Vercel Pro hat 1 Mio/Tag = 30 Mio/Monat aber Overage explodiert.
- **CDN bereits eingebaut:** kein extra CDN-Vertrag nötig
- **Edge-Computing global:** noch niedrigere Latenz für entfernte Schulen
- **DSGVO:** EU-Datacenter wählbar (Frankfurt/London/Wien)

### Migration aus Stufe 1

Eigener Plan-File: `docs/PHASE-U-CLOUDFLARE-PLAN.md` (zu schreiben sobald Trigger erreicht). Grobe Schritte:

1. **OpenNext-Adapter installieren:** `@opennextjs/cloudflare`. Konvertiert Next.js-Build zu Cloudflare-Workers-kompatibel.
2. **Edge-Runtime-Inkompatibilitäten fixen:**
   - jose-JWT: läuft auf Edge ✅
   - bcryptjs: läuft auf Edge ✅
   - @react-pdf/renderer: läuft NUR auf Node — entweder Lambda lassen oder Migration auf clientseitige PDF-Generierung
   - Supabase-SSR: läuft auf Edge ✅
3. **R2-Bucket einrichten:** Cloudflare R2 als S3-kompatibler Storage. Bestehende Supabase-Storage-PDFs migrieren (1-Mal-Skript).
4. **Cloudflare CDN für Bilder:** Pexels-URLs durch eigenen R2-Proxy ersetzen oder Cloudflare-Bild-Resize nutzen.
5. **DNS-Wechsel:** Domain bei Cloudflare verwalten lassen, Pages-Deployment automatisch via GitHub.
6. **Vercel parallel laufen lassen** für 2 Wochen als Fallback, dann abschalten.

**Aufwand:** 3–5 Tage. Hauptrisiko: Edge-Runtime-Inkompatibilitäten in Third-Party-Libs.

### Trigger zum Wechsel auf Stufe 3

- Supabase-Cloud-Kosten >€80/Monat (durch Overage)
- Supabase Pro Decke gerissen (DB >8 GB → Team-Tier $599 zwingend — STOP, jetzt Self-Hosting)
- Bandwidth >250 GB/Monat (Pro-Decke)
- Datenschutz-Befragung einer Schule: „Wo liegen die Daten?" → Supabase-AWS-Frankfurt ist zwar EU, eigene Hetzner-Instanz ist die noch sauberere Story

---

## Stufe 3 — Self-Hosted Supabase auf Hetzner (200–2000 Schulen)

**Architektur:** + Hetzner-Server mit Self-Hosted Supabase (Docker Compose oder Coolify) + Cloudflare Pages + Hetzner Storage Box für Backups
**Kosten:** ~€30–80/Monat (Hetzner CCX23 €27 + Cloudflare $5 + Backup €6 + Monitoring $10)
**Decke:** ~2000 Schulen, ~200 parallele Quizzes

### Warum Self-Hosted?

- **Kosten-Decke wegfallend:** Supabase-Cloud Team-Tier startet bei $599/Monat, Hetzner CCX33 schafft viel mehr für €54
- **Komplette Daten-Souveränität:** alle Daten auf einem Server unter deiner Kontrolle. DSGVO-Story unschlagbar.
- **Kein Vendor-Lockin:** Wenn Supabase 2027 die Preise verdoppelt, bist du immun
- **Performance-Tuning:** du kannst Postgres direkt für deinen Use-Case optimieren

### Migration aus Stufe 2

Eigener Plan-File: `docs/PHASE-V-SELFHOSTING-PLAN.md` (zu schreiben sobald Trigger erreicht). Grobe Schritte:

1. **Hetzner-Account anlegen:** CCX23 (€27/Monat) in Helsinki oder Nürnberg. CCX = AMD-CPU dediziert (nicht shared) für vorhersagbare Performance.
2. **Server härten:** Ubuntu 24.04 LTS, ufw, fail2ban, SSH-Key-Only, Auto-Security-Updates.
3. **Docker + Docker Compose installieren.**
4. **Supabase-Self-Hosted aufsetzen:**
   - Repo clonen, `.env` konfigurieren (eigene Secrets generieren)
   - `docker compose up -d`
   - SSL via Caddy oder Traefik mit Let's Encrypt
5. **Postgres-Tuning:** `shared_buffers`, `work_mem`, `max_connections` für Server-RAM einstellen.
6. **Backup-Strategie:**
   - **Täglich:** `pg_dump` per Cron → Hetzner Storage Box (€3,20/Monat für 100 GB)
   - **Wöchentlich:** Restore-Test in separates Test-Verzeichnis (CRITICAL — unteste Backups sind keine Backups)
   - **Monatlich:** Full-Snapshot des Hetzner-Servers (€2/Monat für Snapshot-Quota)
7. **Monitoring:** Better Stack ($10/Monat) mit:
   - HTTP-Health-Check auf `/health`-Endpoint alle 30 s
   - Push-Notification bei Downtime
   - Postgres-Connection-Pool-Auslastung
   - Disk-Usage >80 %
8. **Daten-Migration:**
   - `pg_dump` aus Supabase-Cloud
   - Wartungsfenster ankündigen (1 h, Sonntag früh)
   - Restore in Self-Hosted Postgres
   - Auth-User-Migration (Magic-Link-Tokens neu generieren)
   - Storage-Bucket-Migration (S3-Kopie von Supabase-Storage zu Self-Hosted Storage)
   - DNS-Wechsel: Lehrplattform → Self-Hosted Supabase-Endpoint
9. **Realtime-Server tunen:** Self-Hosted Realtime nutzt Elixir/Phoenix, hat eigene Tuning-Optionen für Connections.

**Aufwand:** 5–7 Tage Setup + 2–3 Tage Daten-Migration (mit Test-Runs). Realistisch: **2 Wochen Kalenderzeit** für sauberen Migration mit Tests.

### Wartungs-Last (ehrlich)

- **Wöchentlich (~30 Min):** Backup-Restore-Test, Update-Check, Disk-Usage-Check
- **Monatlich (~2 h):** Docker-Image-Updates, Postgres-Major-Version-Updates wenn nötig
- **Bei Vorfällen:** unvorhersehbar. SLA musst du selbst sicherstellen.

### Trigger zum Wechsel auf Stufe 4

- Hetzner-CPU regelmäßig >70 % Peak
- Postgres >100 GB
- Schul-Anzahl real >2000

---

## Stufe 4 — Verteilt (2000+ Schulen)

**Architektur:** + Read-Replica + dedizierter WebSocket-Server für Realtime + Load-Balancer
**Kosten:** ~€100–250/Monat (2× Hetzner + LB + Monitoring + Backups)
**Decke:** theoretisch unbegrenzt

### Komponenten

1. **Primärer Postgres:** Hetzner CCX33 (€54), nur Writes
2. **Read-Replica:** Hetzner CCX23 (€27), alle Read-Queries der Lernpfade/Themen
3. **Realtime-Server separat:** Hetzner CX22 (€4,15), nur Realtime-Subscription-Management
4. **Cloudflare als Edge** (kein Vercel mehr)
5. **Hetzner Load-Balancer** (€5,90/Monat)
6. **Monitoring + Alerting** ($30/Monat Better Stack Pro)

### Wann bauen?

Nur wenn die App **wirklich** an Stufe 3 ihre Grenzen erreicht. Bei 2000 Schulen × 25 Schüler:innen = 50.000 User. Das ist eine kleine Bildungs-Plattform — kommt vermutlich nie ohne Förderung/Trägerverein. In diesem Fall hast du auch Ressourcen für die Komplexität.

### Aufwand

3–6 Wochen Setup + Migration. Eigener Plan-File `docs/PHASE-W-VERTEILT-PLAN.md` wenn jemals nötig.

---

## Entscheidungs-Matrix: Welche Stufe brauchst du wann?

| Frage                                           | Ja →           | Nein →         |
| ----------------------------------------------- | -------------- | -------------- |
| Hast du heute >10 aktive Schulen?               | Stufe 1 jetzt  | Stufe 0 bleibt |
| Stoßt du regelmäßig an Vercel-/Supabase-Limits? | Stufe 1 jetzt  | Bleib auf 0    |
| Plant Stufe 1 Pro-Kosten <€50/Monat?            | Stufe 1 OK     | Stufe 2 prüfen |
| Sind Pro-Kosten >€80/Monat?                     | Stufe 2 jetzt  | Bleib auf 1    |
| DSGVO-Druck einer Schule?                       | Stufe 2 oder 3 | —              |
| Cloud-Kosten >€150/Monat?                       | Stufe 3 jetzt  | Bleib auf 2    |
| >2000 Schulen?                                  | Stufe 4 prüfen | Bleib auf 3    |

## Anti-Pattern (NICHT machen)

1. **Stufe überspringen** — wer von 0 direkt auf 3 springt, baut 4 Wochen Architektur für ein Phantom-Problem. YAGNI.
2. **Self-Hosten ohne Backup-Test** — gelöschte Schülerdaten sind nicht wiederherstellbar
3. **Stufe wechseln ohne Lasttest** — du weißt nicht ob das neue Setup wirklich hält
4. **Mehrere Stufen parallel migrieren** — ein Wechsel pro Quartal max., sonst keine Stabilität
5. **Migration während Schul-Hochbetriebszeit** — immer Sonntag früh, Wartungsfenster ankündigen

## Beziehung zu anderen Plan-Files

- **`docs/PHASE-T-PLAN.md`** — konkreter Plan für Stufe-1-Aufstieg (Realtime-Broadcast)
- **`docs/COST-CONTROLS.md`** — Soft-Limits + Monitoring + Trigger-Metriken
- **`docs/PHASE-U-CLOUDFLARE-PLAN.md`** — TODO, schreiben sobald Stufe-2-Trigger nahe
- **`docs/PHASE-V-SELFHOSTING-PLAN.md`** — TODO, schreiben sobald Stufe-3-Trigger nahe
- **`docs/decisions/0016-hybrid-realtime.md`** — TODO, ADR für Stufe 1
- **`docs/decisions/0017-cloudflare-statt-vercel.md`** — TODO, ADR für Stufe 2 wenn dort
- **`docs/decisions/0018-self-hosted-supabase.md`** — TODO, ADR für Stufe 3 wenn dort

## Realistische Zeitachse (Geo-Wachstums-Szenario)

Ehrliche Prognose, keine Verkaufs-Roadmap:

| Zeitpunkt       | Stufe | Schulen      | Notiz                                      |
| --------------- | ----- | ------------ | ------------------------------------------ |
| 2026-06 (heute) | 0     | 0 (Solo-Dev) | Sprint S in Arbeit                         |
| 2026-08         | 0     | 0            | SEO-Launch + Pre-Launch-Härtung            |
| 2026-10         | 0–1   | 1–5          | Erste befreundete Schulen, evtl. schon Pro |
| 2027-03         | 1     | 5–20         | NÖ-Bildungsdirektion empfiehlt vielleicht  |
| 2027-09         | 1     | 20–50        | Sprint J/K Features ziehen User            |
| 2028-03         | 2     | 50–150       | Cloudflare-Wechsel sinnvoll                |
| 2028-09         | 2     | 100–300      | weitere Politur, Print-Layout              |
| 2029+           | 3     | 300+         | NUR wenn echtes Wachstum, Self-Hosting     |

**Beobachtung:** Realistisch hast du **18 Monate Zeit** bis Stufe 1 wirklich nötig wird. Phase T ist trotzdem jetzt sinnvoll, weil:

- Migration ist einfacher in kleiner App als in großer
- Du gewinnst Latenz + bessere UX _jetzt_
- Pre-Launch-Polish unterstreicht Professionalität

Stufe 2+3 hast du **2–3 Jahre Vorlauf** — kein Grund zur Eile.
