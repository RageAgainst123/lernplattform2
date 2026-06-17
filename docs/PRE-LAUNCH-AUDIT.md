# Pre-Launch-Audit — lernplattform2

> **Audit-Datum:** 2026-06-04 · **Auditor:** 5 parallele Claude-Subagents
> **Stand:** post-Phase-T (T0–T6 fertig, T7+T8 offen, Bugfix `5d8940d`)
> **Ziel:** Codebase ist sauber, refaktoriert, optimiert vor SEO-Launch September 2026.

Dieses Dokument fasst fünf parallele Audit-Läufe zusammen:

1. **Sicherheit & RLS** — Service-Role-Leaks, IDOR, Auth-Flows, Rate-Limits
2. **Performance & Bundle** — N+1 Queries, Bundle-Größe, Caching, DB-Indices
3. **Realtime/T-Phase-Code** — Race-Conditions, Pseudo-Channels, Type-Safety
4. **Doku-Konsistenz** — CHANGELOG, CLAUDE.md, ADRs, fehlende Runbooks
5. **Toter/duplizierter Code** — Spike-Page, ungenutzte Deps, Test-Boilerplate

**Verdict:** Solide Basis (saubere Auth-Trennung, gute DB-Indices, Polling-Last bewältigt, kein `any`, kein TODO-Müll). ABER: **2 echte Sicherheits-Blocker** (anonymer DoS auf Live-Sessions, PIN-Brute-Force) und **3 Realtime-Bugs** müssen vor Launch behoben werden. Doku ist 4 Phasen hinterher.

---

## 🚨 CRITICAL — Launch-Blocker (vor jedem Produktiv-Test fixen)

### CRIT-1 — `/api/live/end` ohne Auth-Check → anonymer DoS

**File:** `app/api/live/end/route.ts:20-52`
**Befund:** Der Endpoint liest `classId` ausschließlich aus dem JSON-Body und führt mit Service-Role-Client `UPDATE live_sessions SET status='ended'` aus. **Keine Cookie-/Session-Prüfung.** Der Code-Kommentar oben („wir lesen classId zusätzlich aus der Student-Session") beschreibt eine Sicherung, die im Code fehlt.

**Angriff:** Jeder anonyme Aufrufer kann mit einer geratenen oder geleakten `classId` (sichtbar in Lehrer-URLs `/lehrer/klassen/[id]/beamer`, im Realtime-Channel `live_session:{classId}`) jede aktive Live-Präsentation beenden.

**Fix:** Entweder `requireUser()`-Teacher-Auth + classId-Owner-Check, oder Student-Session-classId aus jose-Cookie und Body-classId verwerfen.

### CRIT-2 — PIN-Brute-Force-Lücke

**Files:** `lib/db/student-login-action.ts:20-61` (kein `rateLimitGate`), `lib/auth/pin.ts:5`
**Befund:** PIN ist 4 Ziffern (10 000 Kombinationen), bcrypt cost=10 (~80 ms). `studentLogin` hat keinerlei Rate-Limit. Codename ist über `/k/[code]` enumerierbar. **Komplette Account-Übernahme dauert ~14 Minuten pro Schüler:in.**

**Fix:**

1. Per-IP + per-(classId, codename)-Sliding-Window-Limit auf `studentLogin` (z.B. 5 Versuche pro 10 Min pro Tupel).
2. Bei Überschreitung temp-Lock + Hinweis im Lehrer-Dashboard.
3. Optional bcrypt cost auf 12 anheben (PIN-Login passiert selten).

### CRIT-3 — `touchQuizPresence` Server-Action ohne Session-Check

**File:** `lib/db/quiz-participant-actions.ts:106-113`
**Befund:** Exportierte Server-Action ohne `requireStudentSession`. Aktuell nirgends aufgerufen (toter Code), aber als `'use server'`-Export über die Action-ID per fetch triggerbar. Angreifer kann beliebige `quiz_participants.last_seen_at`-Werte setzen → Heartbeat-Spoofing.

**Fix:** Entweder **löschen** (war ohnehin Dead Code) oder `studentCodeId` aus Session + `sessionId` gegen `classId` cross-checken.

---

## ⚠ HIGH — vor Launch fixen

### HIGH-1 — Race in `commitAdvance` durch fehlende `current_question_index`-WHERE-Klausel

**File:** `lib/db/quiz-auto-advance.ts:113-122`
**Befund:** `UPDATE WHERE id = sess.id AND status = 'active'`. Wenn zwischen `loadAndValidateSession` und `commitAdvance` der Lehrer manuell weiterschaltet, würde `maybeAdvanceQuiz` die _neue_ aktuelle Frage fälschlich reveal-en mit Snapshot-`questionIndex` aus dem alten Zustand.
**Fix:** WHERE-Klausel um `.eq('current_question_index', sess.current_question_index)` ergänzen. (10 min)

### HIGH-2 — `ProgressMatrixLive` ohne Polling-Fallback

**File:** `components/teacher/ProgressMatrixLive.tsx:35-52`
**Befund:** Nutzt direkt `supabase.channel()` + `router.refresh()`, nicht `useRealtimeWithFallback`. Bricht das ADR-0016-Pattern „Polling-Fallback bleibt zwingend aktiv". Bei Realtime-Ausfall sieht Lehrer:in stale Daten bis manueller Reload.
**Fix:** Auf `useRealtimeWithFallback` migrieren mit Poll-Intervall 15–30s. Oder mindestens dokumentierten 60s-`router.refresh`-Tick als Sicherheitsnetz hinzufügen.

### HIGH-3 — `broadcast.ts` 3s-Subscribe-Timeout blockiert Vercel-Functions

**File:** `lib/realtime/broadcast.ts:42-55`
**Befund:** Trotz „fire-and-forget"-Doku ist `publishBroadcast` async und braucht im Worst-Case **3000 ms** auf SUBSCRIBED-Timeout. `void` in Server-Action verhindert nicht zuverlässig dass Vercel-Function-Invocation-Zeit zählt. Bei hängender Realtime-Verbindung: **3 s Vercel-Cost pro Mutation** + Cold-Start-Verschärfung.
**Fix:** Timeout auf 500-1000 ms reduzieren, ODER Next 15's `unstable_after` / Vercel `waitUntil`-Pattern nutzen.

### HIGH-4 — `/api/live/end`, `/api/live/results`, `/api/live/wordcloud` ohne Rate-Limit

**Files:** `app/api/live/{end,results,wordcloud}/route.ts`
**Befund:** Drei Endpoints ohne `rateLimitGate`. In Kombination mit CRIT-1 ein DoS-Multiplikator.
**Fix:** `rateLimitGate(req, 'live-end')` etc. ergänzen — analog zu `/api/live/route.ts`. (10 Zeilen Code)

### HIGH-5 — Beamer/Question-Polling-Hot-Path: ~10 DB-Queries pro Request

**Files:** `app/api/quiz/beamer/route.ts`, `app/api/quiz/question/route.ts`
**Befund:** `/api/quiz/beamer` macht `isOwnClass` (1) + `maybeAdvanceQuiz` (bis 4) + `getActiveQuizSessionForClass` (mehrere) + `getQuizBeamerQuestionState` (bis 4) = **~10 Queries pro Polling-Tick alle 5s.** Bei 50 parallelen Live-Quizzen ≈ 100 qps Supabase-Last nur durch Beamer-Polling.
**Fix-Priorität-Reihenfolge:**

1. Postgres-RPC `quiz_beamer_state(class_id, teacher_id)` als SQL-Function — 1 Roundtrip statt 4. **Hoher Hebel.**
2. `maybeAdvanceQuiz` nur ausführen wenn `quiz.status==='active'` UND `currentQuestionStartedAt + timeLimit < now`.
3. Bei aktivem Realtime-Channel Polling-Intervall auf 10s erhöhen.

### HIGH-6 — `saveProgress`/`submitWorksheet` validieren `moduleId` nicht gegen Klassen-Zuweisung

**File:** `lib/db/progress-action.ts:59-165`
**Befund:** Schüler:in sendet `moduleId` als Argument; Action prüft nicht via `isAssigned(moduleId, classId)`. Folgen: Daten-Pollution + Score-Manipulation für nicht zugewiesene Module + irreführender Broadcast.
**Fix:** Vor jedem `upsert` `isAssigned(args.moduleId, session.classId)` (Helper existiert in `student-modules.ts`) prüfen.

---

## 🔍 MEDIUM — Quality of Life vor Launch

### MED-1 — Pseudo-Channels (`quiz_session:idle`, `live_session:disabled`) sammeln Connections

**Files:** `useQuizQuestionPoll.ts:34`, `useQuizBeamerPoll.ts:31`, `useQuizLobbyPoll.ts:58/71`, `useLiveSync.ts:35`
**Befund:** Alle Schüler-Tabs ohne aktives Quiz/Live landen im selben Channel. Wenn jemand auf den Channel publisht → Refetch-Storm. Außerdem zählen die Connections gegen das Supabase-200-Connection-Limit (Free) bzw. 500 (Pro).
**Fix:** `useRealtimeWithFallback` um `enabled: boolean` erweitern. Wenn `enabled=false` → kein Channel öffnen.

### MED-2 — Channel-Name aus `initial` statt `state` (Quiz-Start-Race)

**Files:** `useQuizBeamerPoll.ts:53`, `useQuizQuestionPoll.ts:46`, `useQuizLobbyPoll.ts:58`
**Befund:** `channelFor(initial)` ist statisch — wenn Quiz von 'none' zu 'active' wechselt, bleibt der Hook auf `quiz_session:idle` subscribed bis zum nächsten Server-Refresh. Polling-Fallback fängt es, aber Realtime-Pfad ist _bis dahin blind_.
**Fix:** `channelName` aus aktuellem State berechnen und als Effect-Dependency setzen.

### MED-3 — Initial-Refetch beim Mount blast frischen SSR-State weg

**File:** `useRealtimeWithFallback.ts:118`
**Befund:** Beim Mount feuert `setupRealtimeAndPolling` SOFORT `safeFetch()` — obwohl `args.initial` der frische SSR-State ist. Bei 25 Schüler × 5 Hooks = 125 unnötige Sofort-Calls pro Quiz-Lobby-Open.
**Fix:** Option `skipInitialFetch: true` mit Default `true`; Polling-Tick übernimmt nach `pollIntervalMs`.

### MED-4 — `self: true` Doppel-Refetch im Lehrer-Beamer

**File:** `useRealtimeWithFallback.ts:164`
**Befund:** `self: true` ist universal. Im Lehrer-Beamer triggert das ZUSÄTZLICH zum `onActionDone={refetch}`-Pattern einen zweiten Refetch beim eigenen Broadcast. Idempotent, aber 2 unnötige API-Roundtrips pro Klick.
**Fix:** Entweder `self` als Hook-Option exponieren (Beamer setzt `false` weil refetch via onActionDone deckt es ab), oder `onActionDone` im Beamer weglassen (Latenz steigt um 100-300 ms).

### MED-5 — Ungenutzte Events `worksheet_returned` & `heft_entry_saved`

**Files:** `lib/realtime/channels.ts:56-57`, `ProgressMatrixLive.tsx:22-23`
**Befund:** Events definiert + abonniert, aber kein Publisher in `lib/db/`. `teacher-feedback-actions.ts` published nicht — Lehrer:in sieht Rückgabe-Status-Änderungen erst nach manuellem Reload.
**Fix:** Entweder Publisher ergänzen (in teacher-feedback-actions + heft-save-action), oder Event-Namen entfernen + ADR-0016 aktualisieren.

### MED-6 — Schüler-Session 1 Jahr Lifetime auf shared devices

**File:** `lib/auth/student-session.ts:13`
**Befund:** `SESSION_DURATION_SECONDS = 365 * 24 * 60 * 60`. Schul-iPads für mehrere Kinder = Account-Übernahme bei „vergessen abzumelden". Mit CRIT-2 (PIN-Brute) verschärft.
**Fix:** Optional „Vertraue diesem Gerät [ja/nein]"-Checkbox beim Login → kurze (1d) vs. lange (1y) Session.

### MED-7 — Suspense fehlt → langsame Server-Components blockieren Page

**Befund:** 0 `<Suspense>`-Boundaries in `app/`. ProgressMatrix für 30 Schüler × 20 Module kann 200-500ms dauern und blockiert die Page.
**Fix:** Selektiv `<Suspense fallback={<MatrixSkeleton/>}>` um teure Children in `/lehrer/klassen/[id]/page.tsx`.

### MED-8 — Keine zentrale Security-Header

**File:** `next.config.ts`
**Befund:** Kein `headers()`-Block. Vercel setzt Defaults, aber CSP fehlt. Lehrer-Pages clickjackbar.
**Fix:** `headers()` mit `X-Frame-Options: DENY` für `/lehrer/*`, restriktive CSP.

---

## 🧹 CLEANUP-WINS (~110 Min Aufwand, sofort umsetzbar)

### CW-1 — `app/dev/realtime-spike/` löschen (-226 LoC)

**Files:** `app/dev/realtime-spike/page.tsx` + `SpikeRunner.tsx`
Außerhalb des Spike-Ordners keinerlei Imports. T0 ist done. Public Route ohne Auth = Angriffsfläche.

```bash
rm -rf app/dev/realtime-spike
```

### CW-2 — 5 ungenutzte Dependencies entfernen

```bash
pnpm remove react-hot-toast @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tiptap/extension-emoji
```

Spart ~3-5 MB node_modules + Bundle-Sanity.

### CW-3 — Broadcast-Test-Helper extrahieren

**Files:** `quiz-session-actions.test.ts:103-109`, `quiz-participant-actions.test.ts:27-33`, `quiz-answer-actions.test.ts:32-38`
Drei Test-Files mocken identisch. → `lib/realtime/__mocks__/broadcast-test-helper.ts` mit `setupBroadcastMock()`. Spart ~30 LoC + zukünftige API-Änderungen einmal pflegen.

### CW-4 — `quiz-sessions.ts` splitten (257 → ~180 LoC)

`QuizSessionRow` + `rowToSession`-Mapper in `quiz-session-row.ts`. Eliminiert 2 von 8 `as unknown as`-Casts.

### CW-5 — `<img>` → `next/image` in `TextBlock.tsx:9`

Bypass von next/image-Optimization. Format-Conversion umsonst.

---

## 📚 DOKU-LÜCKEN (für T8)

### DOC-1 — CHANGELOG.md endet bei Phase Q

**Fehlt:** Sprint R, Phase S (Live-Klassen-Quiz, Migration 0020), Phase C (Pre-Launch C2-C8), Phase T (T0-T6 + 2 Bugfix-Commits).

### DOC-2 — CLAUDE.md Phasen-Status endet bei Phase Q

**Fehlt:** 4 ✅-Einträge (R, S, C, T). Stack-Kurz erwähnt weder Quiz-Sessions noch Supabase Realtime. Architektur-Listen brauchen `lib/realtime/` + `components/realtime/`.

### DOC-3 — ADR-0016 Status weiterhin "proposed"

Sollte nach T1-T6 auf `accepted` mit gemessenen Latenz-Werten (75-115 ms Spike). Konsequenzen-Sektion ist Vorhersage, nicht Realität.

### DOC-4 — ADR-0013 hat keinen "superseded"-Marker

ADR-0016 referenziert ADR-0013 als „supersedes (teilweise)", aber ADR-0013 selbst hat keinen Rückverweis.

### DOC-5 — `docs/PHASE-T-PLAN.md` Status "🔜 Geplant"

Überholt. T0-T6 sind durch. Tags belegen Fortschritt.

### DOC-6 — `docs/SCALE-PLAN.md` Stufe 0/1 nicht als done markiert

TODO-Marker für ADR-0016 entfernen (existiert mittlerweile).

### DOC-7 — README.md ADR-Range "(0001–0012)" — sollte 0016 sein

README listet Features nur bis Phase Q.

### DOC-8 — `docs/COST-CONTROLS.md` zeigt Phase T5-Code als Plan obwohl gebaut

C4 (`lib/db/quiz-quota.ts`) als „✅ implementiert" markieren.

### DOC-9 — Fehlende Launch-Docs

- `docs/RUNBOOK.md` — Notbremse-Env-Vars + Realtime-Debugging
- `docs/DEPLOYMENT.md` — Vercel-Deploy-Hinweise + Env-Vars
- Datenschutz-Update für Realtime-Broadcast

### DOC-10 — `@dnd-kit/*` in CLAUDE.md erwähnen ODER entfernen

Sind in `package.json` aber 0 Imports — gehört zu CW-2.

---

## ✅ Was sauber ist

- **Service-Role-Leaks:** `lib/supabase/admin.ts` hat `import 'server-only'`. Alle 51 Aufruf-Stellen in Server-Code. Kein Client-Bundle-Leak. ✅
- **Schüler-IDOR auf eigene Daten:** `portfolio-actions.ts`, `word-heft-actions.ts`, `submitQuizAnswer`, `joinQuizSession`, `live-vote-actions.ts` ziehen `studentCodeId`/`classId` aus jose-Session. ✅
- **Lehrer-Tenant-Isolation:** `quiz-session-actions.ts`, `live-session-actions.ts`, `class-modules.ts`, `class-progress.ts` nutzen User-Client mit RLS statt Service-Role. ✅
- **CSRF:** Next.js Server-Actions haben eingebaute Action-ID-Validierung. ✅
- **SQL-Injection:** Nur 2 `.rpc`-Aufrufe (`start_live_session`, `start_quiz_session`), beide parametrisiert. ✅
- **Open-Redirect:** `auth/confirm/route.ts` hat `safeNext` mit Härtung. ✅
- **Secrets:** SUPABASE_SECRET_KEY/SESSION_SECRET nur in 3 Files (admin.ts, student-session.ts, sso-pending-session.ts). ✅
- **Broadcast-Payloads:** Bewusst minimal — `blockIndex`, `displayName`, `questionIndex`; keine `student_code_id`/`is_correct`/`points`. ✅
- **jose-Cookie-Flags:** `httpOnly: true`, `secure: NODE_ENV==='production'`, `sameSite: 'lax'`. ✅
- **DB-Indices:** Migrations 0001-0020 deck alle Hot-Spalten ab (class_id, student_code_id, session_id, composite-Indices auf live_votes / quiz_answers / live_presence). ✅
- **Polling-Fallback:** Alle 4 Hooks haben 5000ms (Pre-T waren 1-1.5s). ✅
- **Channel-Cleanup:** `removeChannel` + `clearTimeout` + visibility-detach in useEffect-Cleanup. ✅
- **Lazy-Loading:** PDF (`@react-pdf/renderer`) wird via `await import()` lazy geladen. Tiptap nur in Heft-Routes. ✅
- **`force-dynamic` korrekt:** Nur API-Routen + auth-abhängige Pages. Statische Pages (`/dgb`, `/impressum`) bleiben CDN-fähig. ✅
- **N+1 in Hot-Paths:** `class-progress.ts`, `class-modules.ts`, `public-content.ts` nutzen Promise.all + Join-Selects. ✅
- **Type-Safety:** Kein `any`, kein `@ts-ignore`. Nur 7 `as unknown as` (alle in Supabase-Joins, bekannter Pain). ✅
- **Toter Code:** Kein TODO/FIXME/HACK/XXX. Kein auskommentierter Code. ✅
- **`console.log/warn`:** Nur 1 sinnvolle in `broadcast.ts`. ✅
- **Lint:** 0 errors, 3 unkritische Warnings (alle pre-existing). ✅

---

## 🎯 Priorisierte Fix-Reihenfolge

### Phase U1 — Sofort (vor jedem Browser-Test mit echten Kindern)

| #   | Severity | Task                                                      | Aufwand |
| --- | -------- | --------------------------------------------------------- | ------- |
| 1   | CRIT-1   | `/api/live/end` Auth-Check                                | 20 min  |
| 2   | CRIT-2   | PIN-Brute-Force Rate-Limit                                | 1 h     |
| 3   | CRIT-3   | `touchQuizPresence` löschen ODER absichern                | 15 min  |
| 4   | HIGH-1   | `commitAdvance` WHERE-Klausel um `current_question_index` | 10 min  |
| 5   | HIGH-4   | Rate-Limit auf 3 Live-Endpoints                           | 10 min  |

**Gesamt: ~2 h. Danach grünes Licht für Test-Klassen.**

### Phase U2 — Vor Live-Launch (vor SEO)

| #   | Severity | Task                                      | Aufwand |
| --- | -------- | ----------------------------------------- | ------- |
| 6   | HIGH-2   | `ProgressMatrixLive` Polling-Fallback     | 30 min  |
| 7   | HIGH-3   | Broadcast-Timeout senken / `waitUntil`    | 30 min  |
| 8   | HIGH-6   | `submitWorksheet` `isAssigned`-Check      | 30 min  |
| 9   | MED-1+2  | `enabled`-Option + Channel-Name aus State | 1 h     |
| 10  | MED-3    | `skipInitialFetch`-Option                 | 20 min  |
| 11  | MED-4    | `self: true` per Hook-Option              | 15 min  |
| 12  | MED-5    | Ungenutzte Events publishen ODER löschen  | 30 min  |
| 13  | MED-7    | Suspense um teure Server-Components       | 30 min  |
| 14  | MED-8    | Security-Header in `next.config.ts`       | 20 min  |

**Gesamt: ~5 h. Plus 110 min Cleanup-Wins (CW-1 bis CW-5).**

### Phase U3 — Performance-Sprint (für ≥10 Schulen)

| #   | Severity | Task                                 | Aufwand |
| --- | -------- | ------------------------------------ | ------- |
| 15  | HIGH-5   | Beamer-Polling-RPC                   | 2-3 h   |
| 16  | —        | k6-Lasttest mit echtem Realtime (T7) | 2-3 h   |

### Phase T8 — Doku-Wrap-Up

| #   | Doc                              | Task                                    | Aufwand |
| --- | -------------------------------- | --------------------------------------- | ------- |
| D1  | CHANGELOG.md                     | 3 Einträge (R, S+C, T)                  | 30 min  |
| D2  | CLAUDE.md                        | Phasen-Status erweitern, Stack ergänzen | 30 min  |
| D3  | ADR-0016                         | Status `accepted` + gemessene Werte     | 20 min  |
| D4  | ADR-0013                         | „superseded by 0016 (teilweise)"        | 5 min   |
| D5  | PHASE-T-PLAN.md                  | T0-T6 als done markieren                | 10 min  |
| D6  | SCALE-PLAN.md                    | Stufe 0/1 done, ADR-0016 TODO weg       | 15 min  |
| D7  | README.md                        | Features + ADR-Range                    | 20 min  |
| D8  | COST-CONTROLS.md                 | C4 als implementiert                    | 5 min   |
| D9  | RUNBOOK.md                       | Neu anlegen                             | 1 h     |
| D10 | Tag `phase-t-realtime-savepoint` | Finaler Phase-T-Tag                     | 5 min   |

**Gesamt: ~3-4 h Doku.**

---

## Geschätzter Gesamt-Aufwand vor Launch

- **Phase U1 (Blocker):** 2 h
- **Phase U2 (HIGH/MED):** 5 h
- **CLEANUP-WINS:** 2 h
- **Phase U3 (Performance):** 5 h
- **Phase T8 (Doku):** 4 h

**Total: ~18 h**. Bei einer Stunde pro Tag = 3 Wochen.

Bis September 2026 bleibt deutlich Zeit. Empfehlung: **Phase U1 jetzt** (vor weiteren Browser-Tests), **U2 + Cleanups + T8 in den nächsten Wochen**, **U3 + T7-Lasttest näher am Live-Termin**.
