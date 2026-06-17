# Cost-Controls: Soft-Limits, Monitoring, Trigger-Strategie

> **Status: 📋 STRATEGIE-DOKUMENT (teilweise jetzt umsetzen, Rest in Phase T).**
> Dieses Dokument beschreibt: **Wie verhindere ich dass die App mich finanziell ruiniert**, wenn SEO greift und 500 Schulen plötzlich da sind.
> **Prinzip:** Lieber eine sichtbare Sperre („Kontingent aufgebraucht — morgen wieder") als ein 500-Euro-Rechnung am Monatsende.

## Warum dieses Dokument

Geo's Geschäftsmodell ist gratis. **Es muss ein Wachstums-Korsett geben, sonst killt Erfolg das Projekt.**

Drei Szenarien die wir abwehren wollen:

1. **Viraler Spike:** Bildungsdirektion empfiehlt die Seite, 100 Schulen melden sich in einer Woche an, alle wollen am Mittwoch um 10:00 ein Quiz starten → Polling kollabiert, Vercel-Functions explodieren, Supabase-Bandwidth wird gerissen, Rechnung +€300.

2. **Missbrauch:** Jemand startet aus Spaß 50 Quizzes hintereinander, lädt 10.000 Mal `/api/quiz/lobby` per Bot → kommt vor.

3. **Kostendrift:** Über 6 Monate wachsen Kosten unbemerkt — niemand schaut auf Dashboards → Rechnung verdoppelt sich.

## Die drei Verteidigungslinien

### Linie 1: Soft-Limits im Code (proaktiv)

App-seitige Sperren bevor externe Services anschlagen. Sichtbar, freundlich, kontrollierbar.

### Linie 2: Monitoring + Alerting (reaktiv)

Bei ersten Warnsignalen sofort Push-Benachrichtigung. Geo kann eingreifen bevor es teuer wird.

### Linie 3: Externe Hard-Limits (Notbremse)

Vercel- und Supabase-Spending-Limits konfigurieren. Im Worst-Case wird die App offline genommen statt eine Rechnung über €1000 zu produzieren.

---

## Linie 1 — Soft-Limits im Code

### L1.1 — Quiz-Tagespensum pro Schule

**Was:** Pro `class_id` max **20 Quiz-Starts pro Tag** (konfigurierbar, Default 20).

**Warum:** 20 Quizzes/Tag/Klasse ist mehr als jede Schule realistisch braucht. Wer mehr will, ist entweder Bot oder Missbrauch.

**Implementation (Phase T5):**

```ts
// lib/db/quiz-quota.ts
export const QUIZ_DAILY_LIMIT_PER_CLASS = 20;

export async function checkQuizQuota(classId: string): Promise<{
  ok: boolean;
  used: number;
  limit: number;
}> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const { count } = await supabase
    .from('quiz_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .gte('created_at', `${today}T00:00:00Z`);
  const used = count ?? 0;
  return { ok: used < QUIZ_DAILY_LIMIT_PER_CLASS, used, limit: QUIZ_DAILY_LIMIT_PER_CLASS };
}
```

**Check:** in `startQuizSession` (RPC) und in `createQuizSession` (Server-Action).

**UI:** Wenn `used >= 0.8 * limit` (16/20): Banner „Heute noch 4 Quizzes möglich." Bei `used >= limit`: Banner „Quiz-Kontingent für heute aufgebraucht. Geht morgen wieder."

### L1.2 — Concurrent-Quiz-Sperre pro Lehrer:in

**Was:** Max **1 aktives Quiz** pro Lehrer:in gleichzeitig.

**Warum:** Verhindert Missbrauch + Verwirrung im Klassenzimmer.

**Implementation:** Bereits in `start_quiz_session`-RPC (siehe Migration 0020) gegen `live_sessions`. Erweitern um Check gegen `quiz_sessions` mit `teacher_id` + `status IN ('lobby', 'active', 'between_questions')`.

### L1.3 — Realtime-Connection-Limit-Awareness

**Was:** Wenn Realtime-Connections >180 (90 % von Free-Tier 200): Banner im Lehrer-Dashboard „Hohe Last — falls Quiz hängt, kurz warten."

**Implementation:** `lib/db/connection-health.ts` mit `getActiveQuizCount()` + heuristische Hochrechnung (parallele Quizzes × 25 = Connections). Anzeige nur im Lehrer-Bereich, nicht für Schüler:innen.

### L1.4 — Polling-Rate-Limit pro IP

**Was:** Max **100 Requests/Minute** pro IP auf `/api/quiz/*` und `/api/live/*`.

**Warum:** Bot-Schutz, verhindert auch versehentliche Endlos-Schleifen im Client.

**Implementation:** Upstash Rate-Limit (Free-Tier 10k Commands/Tag reicht) oder simples In-Memory-LRU im Proxy (für Vercel: jeder Edge-Container hat seine eigene Map, das ist „best effort" aber reicht für Bot-Schutz).

```ts
// proxy.ts — beim Request-Hook
if (path.startsWith('/api/quiz/') || path.startsWith('/api/live/')) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (await isRateLimited(ip, 100, 60)) {
    return new NextResponse('Too many requests', { status: 429 });
  }
}
```

### L1.5 — File-Upload-Größenlimit

**Was:** Material-PDFs max **5 MB**, Heft-Bilder bleiben extern (Pexels, kein Upload).

**Warum:** Verhindert dass ein PDF mit 200 MB die Storage-Quote killt.

**Implementation:** Bereits weitgehend da via `lib/db/material-actions.ts`. Prüfen + bei 5 MB hart cutoff.

### L1.6 — Global-Kill-Switch (Notbremse)

**Was:** Env-Var `QUIZ_DISABLED=true` blendet alle Quiz-Buttons aus und zeigt Maintenance-Banner. Analog `LIVE_DISABLED=true` für Live-Präsentation, `STUDENT_LOGIN_DISABLED=true` für komplette Sperre.

**Warum:** Wenn etwas explodiert, kann Geo in 30 Sek per Vercel-Dashboard die Env-Var setzen, die App ist offline für das Feature, Rest läuft weiter.

**Implementation:**

```ts
// lib/feature-flags.ts
export const isQuizEnabled = () => process.env.QUIZ_DISABLED !== 'true';
export const isLiveEnabled = () => process.env.LIVE_DISABLED !== 'true';
export const isStudentLoginEnabled = () => process.env.STUDENT_LOGIN_DISABLED !== 'true';
```

Checks in Server-Actions + UI-Komponenten. Banner via `MaintenanceBanner.tsx`.

### L1.7 — Audit-Log

**Was:** Jeder Quiz-Start + jeder Material-Upload + jede Klassen-Erstellung wird in `audit_log`-Tabelle protokolliert.

**Warum:** Nachvollziehbarkeit bei Missbrauch + Basis für spätere Statistiken.

**Implementation:** Eigene Migration, simple Tabelle `(id, actor_id, actor_type, action, target_type, target_id, metadata jsonb, created_at)`.

---

## Linie 2 — Monitoring + Alerting

### M2.1 — Vercel-Dashboard wöchentlich prüfen

**Was:** Geo schaut wöchentlich (Sonntag früh als Routine) auf:

- Functions/Tag (Hobby: 100k, Pro: 1 Mio/Tag)
- Bandwidth/Monat (Hobby: 100 GB, Pro: 1 TB)
- Errors-Rate (sollte <1 % sein)

**Trigger:** Wenn ein Wert >70 % der Decke → ADR für nächste Stufe lesen.

### M2.2 — Supabase-Dashboard wöchentlich prüfen

**Was:** Geo schaut wöchentlich auf:

- DB-Size (Free: 500 MB, Pro: 8 GB)
- Egress/Monat (Free: 5 GB, Pro: 250 GB)
- Auth-MAU (Free: 50k, Pro: 100k)
- Realtime-Connections-Peak (Free: 200, Pro: 500)
- Realtime-Messages/Monat (Free: 2 Mio, Pro: 5 Mio)

**Trigger:** wie oben, 70 % der Decke = Vorwarnung.

### M2.3 — Better Stack Free-Tier (oder UptimeRobot)

**Was:** Automatisches Uptime-Monitoring:

- `/` alle 60 s
- `/api/health` alle 60 s
- `/k/EVA-5A-2026` (öffentliche Schüler-Page) alle 5 min

**Bei Downtime:** E-Mail + Push-Notification an Geo.

**Kosten:** Free für bis zu 10 Monitore.

### M2.4 — Status-Page (öffentlich)

**Was:** `/status`-Route zeigt Lehrer:innen vor der Stunde:

- ✅ Quiz-Modus funktioniert
- ✅ Live-Präsentation funktioniert
- ✅ Heft funktioniert
- Letzte gemessene Latenz, letzte Wartung

**Warum:** Lehrer:innen können vor der Stunde checken. Verhindert dass jemand mit kaputter App in den Unterricht geht.

**Implementation:** Simple Server-Component die `/api/health` aufruft + Ergebnisse rendert. Optional: kleines Log der letzten 24h aus eigener Tabelle.

### M2.5 — Health-Endpoint

**Was:** `/api/health` macht:

1. DB-Ping (`select 1`)
2. Realtime-Channel-Test (subscribe + send + assert receive within 500 ms)
3. Storage-Ping (head request)

**Response:** `200 OK` mit JSON `{db: 'ok', realtime: 'ok', storage: 'ok', latencyMs: 45}`. Bei Fehler `503`.

---

## Linie 3 — Externe Hard-Limits (Notbremse)

### H3.1 — Vercel Spending-Limit

**Was:** Vercel-Dashboard → Project → Settings → Billing → Spending Limit.

- **Hobby:** automatisch $0 (App wird pausiert wenn Limits überschritten)
- **Pro:** Spending-Cap z. B. $50/Monat. Bei Erreichen: keine weiteren Charges, App ggf. throttled.

**Empfehlung:** Auf Pro $50 setzen (= 2× Pro-Grundpreis als Puffer). Damit zahlst du nie mehr als $50.

### H3.2 — Supabase Spending-Limit

**Was:** Supabase-Dashboard → Organization → Billing → Set Spending Cap.

- **Empfehlung:** $50/Monat (= 2× Pro-Grundpreis).
- Bei Erreichen: Realtime + Function-Invocations werden gedrosselt, aber DB bleibt lesbar.

### H3.3 — Cloudflare Spending-Limit (falls in Stufe 2)

Analog, Cloudflare Workers Paid hat Spending-Cap-Option.

### H3.4 — Domain-Verlust verhindern

**Was:** Domain bei Cloudflare oder INWX registrieren, Auto-Renewal aktivieren, Backup-Zahlungsmethode hinterlegen.

**Warum:** Wer SEO macht und die Domain ausläuft, verliert die ganze Reichweite.

---

## Trigger-Tabelle (Wann muss ich was tun?)

Diese Tabelle ist die **eine Sache**, die Geo wöchentlich prüfen sollte:

| Metrik                             | Aktion bei 50 % | Aktion bei 70 %                     | Aktion bei 90 %                |
| ---------------------------------- | --------------- | ----------------------------------- | ------------------------------ |
| Vercel Functions/Tag               | Beobachten      | Edge-Runtime für mehr Routes prüfen | Sofort Pro upgraden            |
| Vercel Bandwidth                   | Beobachten      | Bild-Optimierung umsetzen           | Cloudflare-Wechsel planen      |
| Supabase DB-Size                   | Beobachten      | Alte Quiz-Daten archivieren         | Pro upgraden oder Self-Hosting |
| Supabase Egress                    | Beobachten      | Cache-Header verstärken             | Pro upgraden                   |
| Supabase Realtime Connections Peak | Beobachten      | Pro upgraden                        | Soft-Limit verschärfen         |
| Supabase Realtime Messages         | Beobachten      | Broadcast-Payloads minimieren       | Pro upgraden                   |
| Auth-MAU                           | Beobachten      | Beobachten                          | Pro upgraden                   |

**Routine:** Jeden Sonntag früh (15 Min):

1. Vercel-Dashboard öffnen, alle 3 Werte checken
2. Supabase-Dashboard öffnen, alle 5 Werte checken
3. Status-Page öffnen, alles grün?
4. Better Stack: letzte Woche Downtimes?

Bei rotem Wert: Maßnahme aus Tabelle umsetzen oder mindestens den nächsten Stufen-Plan aktivieren.

---

## Was JETZT umsetzen (vor SEO-Launch)

Priorisiert nach Aufwand × Risiko-Reduktion:

| Priorität              | Maßnahme                                | Aufwand | Wirkung                     |
| ---------------------- | --------------------------------------- | ------- | --------------------------- |
| **1 (zwingend)**       | Vercel + Supabase Spending-Limit setzen | 5 min   | Verhindert €1000-Rechnung   |
| **2 (zwingend)**       | `/api/health`-Endpoint + Better Stack   | 1 h     | Sofortige Down-Notification |
| **3 (zwingend)**       | Global-Kill-Switch (L1.6)               | 1 h     | Notbremse für Geo           |
| **4 (sehr empfohlen)** | Soft-Limits L1.1 + L1.2 (Quiz-Quota)    | 3 h     | Schutz vor Missbrauch       |
| **5 (sehr empfohlen)** | Status-Page `/status`                   | 2 h     | Professionalität            |
| **6 (empfohlen)**      | Rate-Limit L1.4                         | 2 h     | Bot-Schutz                  |
| **7 (empfohlen)**      | Cache-Header für statische Routes       | 2 h     | Egress-Spar                 |
| **8 (nice-to-have)**   | Audit-Log L1.7                          | 3 h     | Nachvollziehbarkeit         |

**Gesamt-Aufwand:** ~1,5 Solo-Lehrer-Tage. **Das passt VOR SEO-Launch rein.**

## Was in Phase T mit umsetzen

- L1.1 (Quiz-Quota) — schon in Phase-T-Plan T5
- L1.2 (Concurrent-Sperre Lehrer:in) — schon in T5
- L1.3 (Connection-Awareness) — schon in T5
- M2.3 (Better Stack) — falls bis dahin nicht passiert

## Was in späteren Stufen folgt

- M2.5 (Health-Endpoint mit Realtime-Test) — Stufe 1
- Cache-Strategie verschärfen — Stufe 2
- Self-Hosted-Monitoring (Grafana auf Hetzner) — Stufe 3

---

## Beispiel-Szenario: Was passiert wirklich beim viralen Ansturm?

Ohne Cost-Controls:

- Mo 8:00 Uhr: NÖ-Bildungsdirektion verschickt Newsletter
- Mo 9:00–17:00: 50 Schulen melden sich an, 20 nutzen das Quiz spontan
- Mo 22:00: Vercel-Functions-Limit gesprengt, App pausiert
- Di morgens: Lehrer:innen können sich nicht einloggen, Quiz down
- Di Mittag: 30 Lehrer:innen löschen Bookmark, sagen es Kolleg:innen
- → **Reputation für Jahre kaputt**

Mit Cost-Controls:

- Mo 8:00 Uhr: Newsletter
- Mo 10:00 Uhr: 5 Schulen starten parallel Quizzes
- Mo 10:05 Uhr: Better Stack sendet Push „/api/health Latenz >2s"
- Mo 10:06 Uhr: Geo öffnet Vercel-Dashboard auf dem Handy, sieht Function-Last bei 80 %
- Mo 10:10 Uhr: Geo klickt „Upgrade to Pro" ($20), App ist sofort entlastet
- Mo 18:00 Uhr: Geo abends in Ruhe, schaut weitere Werte, plant Stufe-2-Wechsel
- Di morgens: Alles läuft, Lehrer:innen begeistert
- → **Reputation: „Geo ist da, wenn was ist"**

Der Unterschied ist nicht Architektur — **es ist Monitoring + Notbremse + Soft-Limits**.
