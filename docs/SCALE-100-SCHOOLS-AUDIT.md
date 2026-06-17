# Skalierungs-Audit: 100 Schulen

> **Datum:** 2026-06-05 · **Stand:** post-Phase-T (Realtime-Broadcast + Polling-Fallback fertig)
> **Frage:** Würde die App bei 100 aktiven Schulen × 25 Schüler:innen flüssig laufen, und was würde das kosten?
> **Kurz:** Nein. Phase T reicht für 10–20 Schulen. Für 100 brauchst du Stufe-3-Architektur (Self-Hosted).

---

## TL;DR — Antwort auf die Frage

| Schulen    | Status                                  | Monats-Kosten                        | Architektur                      |
| ---------- | --------------------------------------- | ------------------------------------ | -------------------------------- |
| **1–10**   | ✅ Läuft heute (Stufe 0)                | ~€25                                 | Vercel Hobby + Supabase Pro      |
| **10–20**  | ✅ Läuft nach kleinen Optimierungen     | ~€25–80                              | Vercel Pro + Supabase Pro        |
| **20–50**  | ⚠ Cloudflare-Migration (Stufe 2) nötig  | ~€80–150                             | + Cloudflare Workers für Polling |
| **50–100** | 🚨 Self-Hosted Realtime nötig (Stufe 3) | ~€50–100                             | Hetzner für Realtime + DB        |
| **100+**   | 🚨 Aktuelle Architektur kollabiert      | Vercel-Plan kostet €700+ oder bricht | → Stufe 3 zwingend               |

**Bottom line:** Bei 100 Schulen ist **Self-Hosted günstiger als Vercel/Supabase-Hosted** — €50 statt €700. Die Phase-T-Architektur ist gut für 10–20 Klassen, kollabiert bei 400 (= 100 Schulen × 4 Klassen).

---

## 🚨 4 Stop-Worlds bei 100 Schulen

Was bei diesem Volumen **wirklich 500-Fehler werfen würde**, nicht nur „langsamer wäre":

1. **Supabase-Realtime-Connection-Cap gerissen** — Pro hat 500 Connections, Peak wäre **10.400** (100 Schulen × 4 Klassen × 26 Tabs). Neue Schüler:innen können sich nicht subscriben.
2. **PgBouncer-Connection-Saturation** — 520 RPS × 200ms = >100 gleichzeitige DB-Verbindungen → "no available connections" → 500.
3. **Function-Overage trifft Vercel-Spending-Cap** ($50) → Vercel **pausiert Functions** → komplette App-Downtime bis nächster Monat.
4. **`live_presence`-Table-Bloat** ohne TTL → autovacuum kommt nicht hinterher → DB-CPU auf 100% → alle Queries timeouten.

---

## Was schon GUT skaliert

Die Phase-T-Architektur hat einige starke Fundamente:

- ✅ **DB-Indices** auf allen Hot-Spalten (class_id, session_id, etc.)
- ✅ **`force-dynamic` korrekt** nur auf API-Polling-Routes, statische Pages bleiben CDN-fähig
- ✅ **Server-Actions vs API-Routes** sauber getrennt
- ✅ **Polling-Fallback 5s** statt 1s (Phase T Optimierung)
- ✅ **Lazy-Loading** für teure Bundle-Teile (PDF, Tiptap)
- ✅ **Rate-Limits** auf allen API-Polling-Endpoints (Pre-Launch C6)
- ✅ **Quiz-Tagespensum-Quota** verhindert Bot-Spike (Pre-Launch C4)
- ✅ **Global-Kill-Switch** (Env-Vars) für Notbremse (Pre-Launch C3)

Diese Fundamente bleiben auch bei Stufe-3-Architektur erhalten.

---

## Was BRECHEN würde

### 🚨 CRITICAL — Hot-Path-Cost-Explosion

#### S1 — Polling-Function-Cost

**Rechnung:** Mittwoch 10:00, 100 Schulen × 5 Min Quiz × 25 Schüler:innen

- pro Schüler-Tab: 12 Polls/Min × 5 Min = **60 Calls/Quiz**
- pro Klasse: 25 Schüler + 1 Beamer = **1.560 Calls/Quiz**
- 100 Schulen parallel: **156.000 Function-Invocations in 5 Minuten** ≈ **520 RPS Peak**

**Monats-Hochrechnung:** 30–160 Mio Function-Invocations/Monat (je nach Quiz-Frequenz). Vercel Pro hat 1 Mio inklusive → **$36–96 Overage** monatlich + GB-Hours (kann $50–200 sein).

**Fix-Hebel:** Postgres-RPCs (1 Query statt 3) + Edge-Runtime (4× günstiger) + adaptives Polling (30s statt 5s wenn Realtime healthy). **Wirkung: ~10× Reduktion der Function-Cost.**

#### S2 — `getQuestionProgress` macht 3 COUNT-Queries pro Poll

**Problem:** `lib/db/quiz-question-progress.ts` führt 3 parallele `count: 'exact', head: true` aus. Bei 25 Schüler × 12 Polls/min = 900 COUNT-Queries/min/Klasse. Bei 100 Klassen = **90.000 COUNTs/Min**. Postgres mag große COUNTs nicht (sequential scan trotz Index möglich).

**Fix:** Postgres-RPC `get_quiz_question_progress(session_id, q_index)` returnt JSON mit 3 Counts in 1 Roundtrip. **Aufwand M.**

#### S3 — Realtime-Connections Cap (500 in Pro)

**Architektur-Problem:** Phase T öffnet pro Schüler-Tab + Beamer-Tab je 1 Channel. Pro Klasse 26 Connections. Bei 400 gleichzeitigen Klassen (100 Schulen × 4) → **10.400 Connections**.

Supabase-Tiers:

- Free: 200
- Pro ($25): 500
- Team ($599): 1.000
- Enterprise: 5.000+

**Bei 100 Schulen kostet Supabase-Hosted-Realtime €599/Monat — nur fürs Connection-Limit.**

**Fix-Hebel:** Self-Hosted Realtime (Phoenix/Elixir auf Hetzner) hält 10.000+ Connections für €15/Monat. Oder pro-Schule (statt pro-Klasse) Channel-Pattern.

#### S4 — `live_presence`-Tabelle wächst unkontrolliert

**Problem:** `touchPresence` ist ein UPSERT pro Live-Poll (alle 5s). Bei 2.500 aktiven Schüler:innen = **500 Writes/Sek nur für Presence**. Tabelle ohne TTL = exponentielles Wachstum + autovacuum-Last.

**Fix:** Scheduled DELETE alle 2 Min via `pg_cron`:

```sql
DELETE FROM live_presence WHERE last_seen_at < now() - INTERVAL '5 minutes';
```

**Aufwand: S (1 SQL-Statement + Cron-Job)**.

### ⚠ HIGH — Brechen bei 50+ Schulen

#### H1 — Worksheet-Auto-Save-Storm

**Problem:** Bei 25 Schüler × 1 Save/1.5s × 100 Schulen = **1.700 RPS auf `saveWorksheetDraft`**. Server-Action + DB-Write — würde den Connection-Pool fluten.

**Fix:** Debounce auf 5s erhöhen (statt 1.5s) wenn Klassen-Kontext erkennbar ist. Oder Batch-Writes alle 10s über Edge-Function. **Aufwand: S–M.**

#### H2 — Realtime-Reconnect-Thundering-Herd

**Problem:** Wenn Supabase-Realtime kurz down geht, reconnecten 2.500 Tabs **gleichzeitig** ohne Backoff. `useRealtimeWithFallback` hat aktuell **keinen exponentiellen Backoff**.

**Fix:** Exponentielles Backoff (1s, 2s, 4s, 8s, max 30s) + Jitter im subscribe-Retry. **Aufwand: S.**

#### H3 — Aggregation in JS statt SQL

**Files:** `getQuizLeaderboard`, `getQuizBeamerQuestionState`, `getClassProgress`
**Problem:** Laden alle Rows und aggregieren in TypeScript. Funktioniert bei 25 Schüler, kollabiert bei 100 globale Live-Quizzes parallel (= 50.000 Rows/Sek übers Netz).

**Fix:** Postgres-RPCs für alle Hot-Aggregationen. **Aufwand: M.**

#### H4 — Quiz-Quota-Check wird langsam ab ~50 Mio Rows

**File:** `lib/db/quiz-quota.ts`
**Problem:** `count: 'exact'` mit `gte('created_at', ...)` — bei 290 Mio quiz_sessions (Jahresprojektion) wird das langsam.

**Fix:** Index `(class_id, created_at)` + ggf. Materialized View für tägliche Quota-Counts. **Aufwand: S.**

#### H5 — OAuth-Callback-Spike 8:00 Schulbeginn

**Risiko:** 2.500 SSO-Logins in 5 Minuten = 8 RPS auf `/auth/confirm`. Supabase Auth-Rate-Limit (default 30 req/Sek pro IP) wahrscheinlich OK, aber **nie getestet**.

**Fix:** Burst-Test mit k6 oder Locust einmal durchspielen. **Aufwand: S.**

### 🔍 MEDIUM — Optimierungen die helfen

#### M1 — `force-dynamic` + `no-store` auf ALLEN API-Routes

Viele Routes (z.B. `/api/quiz/lobby` im "none"-State) sind sehr wohl cachebar. Selective revisit:

- `kind === 'none'` → `Cache-Control: public, max-age=60` → würde **80% Idle-Traffic** sparen
- `/api/health` → public, max-age=30
- `/api/quiz/leaderboard` zwischen Fragen → max-age=10

**Aufwand: S.**

#### M2 — Storage-Egress

Wenn 100 Klassen alle gleichzeitig dasselbe PDF runterladen = **12.5 GB Egress in einer Stunde**. Supabase-Pro hat 250 GB/Monat → 8 GB/Tag. Würde bei viralem PDF reißen.

**Fix:** Cloudflare-CDN vor Supabase-Storage (Stufe 2, einfaches DNS-Setup). **Aufwand: S.**

#### M3 — `createServiceClient` pro Request

Jeder API-Call ruft `createServiceClient()` neu auf. Singleton-Pattern hilft (achtsam wegen Edge-Runtime-Constraints).

**Aufwand: S.**

---

## 💰 Konkrete Monats-Kosten

### Stufe 0 — Heute (Vercel Hobby + Supabase Free)

| Schulen | Kosten                       | Status                 |
| ------- | ---------------------------- | ---------------------- |
| 1–5     | **€0**                       | Free-Tier reicht       |
| 5–10    | **€25** (Supabase Pro nötig) | Connection-Limit-Druck |

### Stufe 1 — Vercel Pro + Supabase Pro

| Schulen | Vercel               | Supabase            | Total        |
| ------- | -------------------- | ------------------- | ------------ |
| 10–20   | **$20**              | **$25**             | **~€42**     |
| 20–50   | $20 + $15 Overage    | $25 + $25 Compute   | **~€80**     |
| 50–100  | $20 + $60 + $80 GB-h | $25 + Team **$599** | **~€700+** ⚠ |

### Stufe 2 — Cloudflare Workers + Supabase Pro

| Schulen | CF Workers      | Supabase            | Total       |
| ------- | --------------- | ------------------- | ----------- |
| 50–100  | $5 (10 Mio req) | $25 + Team $599     | **~€570** ⚠ |
| 100+    | $5              | Team+Realtime-Addon | **~€600+**  |

**Cloudflare löst Vercel-Function-Cost, NICHT Supabase-Realtime-Connection-Cost.**

### Stufe 3 — Self-Hosted (Hetzner)

| Komponente                  | Spec                      | Kosten         |
| --------------------------- | ------------------------- | -------------- |
| CCX23 (4 vCPU, 16GB RAM)    | App + Postgres + Realtime | €27/Mo         |
| Backup-Storage 100GB        | tägliche Snapshots        | €6/Mo          |
| Cloudflare R2 für PDF/Media | 0 Egress-Cost             | $5/Mo          |
| Better Stack Monitoring     | Free Tier                 | €0             |
| **Total**                   | —                         | **~€50/Mo** ✅ |

→ **Bei 100 Schulen ist Self-Hosted 10× günstiger als Vercel/Supabase.** Das ist die einzige Stufe die wirklich für 100 Schulen funktioniert.

---

## 🎯 Roadmap nach Schul-Trigger

### Trigger: ~5 Schulen registriert

**Empfohlene Aktionen (~3-4h):**

- Vercel/Supabase Spending-Limits auf €50 setzen (**Pre-Launch C1** ist noch offen!)
- `live_presence` TTL via pg_cron (1 SQL-Statement)
- Cache-Header für `/api/quiz/lobby` im idle-State
- Reconnect-Backoff in `useRealtimeWithFallback`
- Vercel Pro-Plan ($20)

### Trigger: ~20 Schulen registriert

**Empfohlene Aktionen (~8-12h):**

- Postgres-RPC für `getQuestionProgress` (3 COUNTs → 1)
- Postgres-RPC für `getQuizLeaderboard` (JS-Aggregation → SQL)
- Postgres-RPC für `getQuizBeamerQuestionState` (HIGH-5 aus Pre-Launch-Audit)
- Edge-Runtime für `/api/quiz/*` und `/api/live/*` Polling-Routes
- Adaptiver Poll-Intervall (30s wenn Realtime healthy)
- Worksheet-Auto-Save-Debounce auf 5s
- `quiz_quota`-Index auf `(class_id, created_at)`

### Trigger: ~50 Schulen registriert

**Stufe-2-Migration (~16-24h):**

- `docs/PHASE-U-CLOUDFLARE-PLAN.md` schreiben
- API-Routes auf Cloudflare Workers portieren (oder über Vercel-Edge bleiben)
- Storage auf Cloudflare R2 + CDN
- DNS-Wechsel

### Trigger: ~70 Schulen registriert

**Stufe-3-Migration (~40-80h, gut planen!):**

- `docs/PHASE-V-HETZNER-PLAN.md` schreiben
- Hetzner-Server provisionieren (CCX23 reicht)
- Supabase → eigene Postgres-Instanz migrieren
- Realtime → eigener Phoenix/Elixir-Server
- Datenmigration mit minimaler Downtime planen

---

## ⚡ Quick-Wins für SOFORT (1–2h)

Auch wenn du heute nur Solo testest, diese 5 Sachen sind reine Free-Wins:

1. **`live_presence` Cleanup-Cron** (1 SQL-Statement via Supabase Dashboard) — verhindert unbounded Tabellenwachstum
2. **Vercel + Supabase Spending-Cap auf €50** (Pre-Launch C1, Geo-Dashboard-Task)
3. **`useQuizLobbyPoll` mit `enabled=false` wenn Schüler im Idle-Zustand** (analog `useLiveSync`)
4. **Cache-Control auf `/api/quiz/lobby` für `kind='none'`** — spart 80% Idle-Polling-Traffic
5. **Index `(class_id, created_at)` auf `quiz_sessions`** — vorausschauend für Quota-Performance

**Aufwand: ~2h. Wirkung: linearer Cost-Reduktion auch im 5-Schulen-Bereich.**

---

## Anti-Patterns die heute schon zu vermeiden sind

- ❌ **`createServiceClient()` pro Request** statt Singleton
- ❌ **Aggregation in JS** statt Postgres-RPC (Hot-Paths)
- ❌ **`force-dynamic` + `no-store` blind auf allen Routes** — selective revisit
- ❌ **Pro-Schüler-Channel-Pattern** falls Phase T weitergedacht wird — niemals einen Channel pro Schüler:in öffnen, pro Klasse reicht (so ist es jetzt schon)
- ❌ **Realtime ohne Reconnect-Backoff** — Thundering-Herd bei Outage

---

## Architektur-Empfehlung

**Stufen-Plan in der Reihenfolge der Trigger:**

| Stufe     | Trigger      | Was tun                                                                                |
| --------- | ------------ | -------------------------------------------------------------------------------------- |
| **0 → 1** | 5+ Schulen   | Vercel Pro + Spending-Cap + Quick-Wins (1-2h)                                          |
| **1 RPC** | 20+ Schulen  | Postgres-RPCs + Edge-Runtime + adaptives Polling (8-12h)                               |
| **1 → 2** | 50+ Schulen  | Cloudflare-Workers + R2 (Stufe-2-Migration)                                            |
| **2 → 3** | 70+ Schulen  | Self-Hosted Hetzner (Stufe-3-Migration — Realtime-Connections sind der Killer-Trigger) |
| **3+**    | 500+ Schulen | Read-Replica, Sharding, etc.                                                           |

**Wichtigste Erkenntnis:** Die **Realtime-Connection-Cost ist der eigentliche Skalierungs-Killer**, nicht die DB. Sobald >300 Connections in Peak (= ~30 Schulen mit allen Klassen in parallelen Live-Quizzes), wird Self-Hosted günstiger als Hosted. Bei 100 Schulen ist es zwingend.

---

## Was es für dich JETZT bedeutet

Du testest aktuell solo. Folgende Implikationen für die Test-Phase Juni–September 2026:

1. **Du brauchst HEUTE nichts an der Architektur ändern** — alle Architektur-Probleme sind erst ab ~20 Schulen kritisch.
2. **Die 5 Quick-Wins (oben)** sind sinnvoll: ~2h, kosten nichts, helfen sofort.
3. **Vor SEO-Launch:** Phase „Stufe-1-RPC" (8-12h) ist dann das Pflicht-Pre-Launch-Paket. Macht die Codebase fit für die ersten 20–50 echten Schulen.
4. **Bei viralem Erfolg:** Du hast einen klaren Stufen-Plan. Cloudflare bei 50+, Hetzner bei 70+.
5. **Kein Plan-Stress:** Selbst wenn morgen 100 Schulen aufschlagen, ist Cloudflare+Hetzner in 1-2 Wochen migrierbar. Du würdest die App nicht „verlieren", nur kurzzeitig drosseln müssen (via Global-Kill-Switch C3).

**Verbleibende Frage:** Soll ich die 5 Quick-Wins jetzt umsetzen (~2h)?
