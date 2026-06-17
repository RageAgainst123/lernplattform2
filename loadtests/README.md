# Lasttests (Pre-Launch-C8)

k6-Skripte zum Belastbarkeits-Test der App vor SEO-Launch. Ziel:
heraus­finden, ab welcher Last die App in Probleme kommt — bevor reale
Schulen sie das herausfinden.

## Voraussetzungen

1. **k6 installieren** (https://k6.io/docs/get-started/installation/):
   - Windows: `choco install k6`
   - macOS: `brew install k6`
   - Linux: `sudo apt install k6` (nach Repo-Setup)

2. **RATE_LIMIT_DISABLED=true** für die Test-Instance setzen — sonst
   blockt der eigene Rate-Limit alle 200 VUs (kommen alle von derselben
   localhost-IP). In Vercel: Project Settings → Environment Variables.
   Lokal: in `.env.local`.

3. **Optional: echtes Schüler:innen-Cookie** für realistischen DB-Pfad.
   - Im Browser einloggen als Test-Schüler:in
   - DevTools → Application → Cookies → `student_session`-Wert kopieren
   - Beim k6-Aufruf als `COOKIE` env-var mitgeben

## Verfügbare Skripte

### `quiz-polling.js` — Schüler:innen-Polling-Last

Simuliert 200 gleichzeitige Schüler:innen die alle 1s `/api/quiz/question`
pollen. Sustained 60s + 10s Ramp-Up/Down.

**Erwartung:** p95 < 1500ms, Fehler-Rate < 5%.

```bash
# lokal gegen Dev-Server
k6 run loadtests/quiz-polling.js \
  -e BASE_URL=http://localhost:3000

# lokal mit echter Session
k6 run loadtests/quiz-polling.js \
  -e BASE_URL=http://localhost:3000 \
  -e COOKIE='student_session=eyJ...'

# gegen Production (Achtung: kostet Vercel-Functions!)
k6 run loadtests/quiz-polling.js \
  -e BASE_URL=https://lernplattform.vercel.app
```

## Interpretation der Ergebnisse

```
✓ status 200
✓ response < 2s

checks.........................: 100.00% ✓ 12000   ✗ 0
http_req_duration..............: avg=250ms  p(95)=800ms  p(99)=1500ms
http_req_failed................: 0.00%   ✓ 0      ✗ 12000
iterations.....................: 12000   200/s
```

**Grün:**

- p95 < 800ms
- Fehler-Rate 0%
- Throughput nahe Target (200 RPS)

**Gelb (Pro-Tier ratsam):**

- p95 zwischen 800-1500ms
- Fehler-Rate 0-2%

**Rot (Architektur-Wechsel nötig — Phase T Realtime-Broadcast):**

- p95 > 1500ms
- Fehler-Rate > 5%
- 503-Fehler (Supabase-Drosselung)
- 504-Timeouts (Vercel-Function-Limit)

## Wann ausführen?

1. **Pre-Launch:** einmal vor SEO-Live-Gang
2. **Nach Phase T (Realtime):** Vergleich Polling vs. Broadcast
3. **Bei jedem Stufen-Wechsel:** Stufe 0 → 1 → 2 (siehe SCALE-PLAN.md)
4. **Bei jeder größeren Architektur-Änderung**

## Sicherheits-Hinweise

- **NIE** in Production während echter Schul-Stunden testen — würde
  echte Schüler:innen ausbremsen
- **NIE** k6 ohne Spending-Cap auf Vercel/Supabase laufen lassen —
  Funktion-Limits können überschritten werden
- **IMMER** vorher `QUIZ_DAILY_LIMIT_PER_CLASS=0` und
  `RATE_LIMIT_DISABLED=true` setzen für die Test-Instance
- **IMMER** nach dem Test die Env-Vars wieder zurücksetzen
