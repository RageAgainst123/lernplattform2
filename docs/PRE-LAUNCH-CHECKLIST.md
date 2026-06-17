# Pre-Launch-Checkliste

> Stand 2026-06. Vor dem öffentlichen SEO-Launch durchgehen. Die Code-
> Tasks (C2-C7) sind bereits umgesetzt; offen sind nur noch Dashboard-
> Konfiguration + ein optionaler Lasttest.

## ✅ Bereits umgesetzt (im Code)

| #   | Task                          | Status | Datei(en)                 |
| --- | ----------------------------- | ------ | ------------------------- |
| C2  | /api/health-Endpoint          | ✅     | `app/api/health/route.ts` |
| C3  | Global-Kill-Switch (Env-Vars) | ✅     | `lib/feature-flags.ts`    |
| C4  | Quiz-Tagespensum pro Klasse   | ✅     | `lib/db/quiz-quota.ts`    |
| C5  | Status-Page `/status`         | ✅     | `app/status/page.tsx`     |
| C6  | Rate-Limit pro IP (100/Min)   | ✅     | `lib/rate-limit.ts`       |
| C7  | Cache-Header `/dgb`           | ✅     | `app/dgb/page.tsx`        |

## ⚠️ MUSS noch — Geo macht's im Dashboard

### C1 — Vercel + Supabase Spending-Limits ($50)

**Zweck:** Verhindert €1000-Rechnung bei Bug oder viralem Spike. Schutz-
Cap, der die App pausiert sobald $50 ausgegeben wurden.

**Vercel:**

1. https://vercel.com → Project → Settings → Billing
2. **Spending Limit** auf `$50/month` setzen
3. Bei Erreichen: App wird gedrosselt, keine weiteren Kosten

**Supabase:**

1. https://supabase.com → Organization → Billing → **Set Spending Cap**
2. Cap auf `$50` setzen
3. Bei Erreichen: API-Calls werden gedrosselt, aber Daten bleiben lesbar

**Aufwand:** 5 Min, einmalig.

**Tier-Strategie (siehe `docs/SCALE-100-SCHOOLS-AUDIT.md` für Details):**

- **Heute (Solo-Test)**: Vercel Hobby + Supabase Free reichen — $50 Cap
  ist reine Schutzmaßnahme, sollte nie erreicht werden.
- **5+ Schulen**: Vercel Pro ($20) + Supabase Pro ($25) = ~€42/Monat
  fix → Cap auf $100 erhöhen.
- **20+ Schulen**: Postgres-RPCs + Edge-Runtime nötig (Plan steht in
  `SCALE-100-SCHOOLS-AUDIT.md` Phase „Stufe-1-RPC").
- **50+ Schulen**: Cloudflare-Migration prüfen.
- **70+ Schulen**: Self-Hosted Hetzner (Realtime-Connection-Limit wird zum
  Killer-Trigger — Hosted-Realtime kostet ab 500 Connections €599/Monat,
  Self-Hosted €27/Monat für 10.000+ Connections).

### C2-Folge-Setup — Better Stack Uptime-Monitor

Better Stack Free-Tier (oder UptimeRobot) für externes Uptime-Monitoring
des Health-Endpoints.

1. https://betterstack.com/uptime → Sign Up (Free)
2. **New Monitor** → URL: `https://deine-app.vercel.app/api/health`
3. Check frequency: 1 Min
4. Alert via E-Mail an geoschlegel@gmail.com
5. Optional: Status-Page von Better Stack (zeigt Uptime-History öffentlich)

**Aufwand:** 5 Min Signup + 5 Min Setup.

## Optional aber sehr empfohlen — C8 Lasttest

Vor dem öffentlichen Launch einmalig durchführen, um die Belastbar­keits-
Grenze zu kennen.

Siehe `loadtests/README.md` für Anleitung. Kurz:

1. k6 installieren
2. App lokal starten (oder Staging-URL nutzen)
3. `RATE_LIMIT_DISABLED=true` setzen
4. `k6 run loadtests/quiz-polling.js -e BASE_URL=http://localhost:3000`
5. Ergebnisse interpretieren (p95-Latenz, Fehler-Rate)

## Globale Notbremse via Env-Vars

Wenn etwas explodiert, kannst du **in 30 Sekunden** ein Feature offline
nehmen ohne Code-Deploy:

Vercel → Project → Settings → Environment Variables → **Add**:

| Env-Var                       | Wirkung                                        |
| ----------------------------- | ---------------------------------------------- |
| `QUIZ_DISABLED=true`          | Live-Quiz komplett aus                         |
| `LIVE_DISABLED=true`          | Live-Präsentation komplett aus                 |
| `STUDENT_LOGIN_DISABLED=true` | Schüler:in-Login aus (= keiner kann mitmachen) |

Nach dem Setzen: **Redeploy** klicken oder warten bis der nächste Edge-
Container die neue Env-Var aufnimmt (max 5 Min).

Zum **Wieder-Aktivieren:** Env-Var löschen oder auf `false` setzen.

## Quiz-Tagespensum konfigurieren

Default ist 20 Quiz-Starts pro Klasse pro Tag. Anpassbar:

| Env-Var                         | Wert      | Wirkung                   |
| ------------------------------- | --------- | ------------------------- |
| `QUIZ_DAILY_LIMIT_PER_CLASS=20` | (default) | 20/Tag/Klasse             |
| `QUIZ_DAILY_LIMIT_PER_CLASS=50` | Hoch      | Für aktive Schulen        |
| `QUIZ_DAILY_LIMIT_PER_CLASS=0`  | Aus       | Für Dev/Test/Eigennutzung |

## Status-Page nutzen

Lehrer:innen können vor der Stunde `/status` aufrufen und checken ob
alles grün ist. Beispiel-URL: `https://deine-app.vercel.app/status`

## Nach Launch — Wöchentliche Routine (15 Min)

Jeden Sonntag früh:

1. **Vercel-Dashboard** öffnen, Function-Calls + Bandwidth checken
2. **Supabase-Dashboard** öffnen, DB-Size + Egress + Auth-MAU checken
3. **Status-Page** öffnen, alles grün?
4. **Better Stack:** letzte Woche Downtimes?

Bei rotem Wert (>70 % der Tier-Decke): Maßnahme aus `SCALE-PLAN.md`
prüfen.

## Soft-Launch-Plan

Empfohlene Reihenfolge:

1. **Diese Checkliste** komplett durchgehen (C1, C2-Setup, optional C8)
2. **3-5 befreundete Lehrer:innen** für 2 Wochen testen lassen
3. **Bugs fixen** die dabei auftauchen
4. **Erst dann SEO + öffentlicher Launch**
