# Phase T — Realtime-Broadcast für Live-Quiz und Live-Präsentation

> **Status: 🔜 Geplant.** Branch wird `feature/realtime-broadcast` (oder Fortsetzung von `feature/thema-workflow`).
> **Voraussetzung:** Sprint S vollständig abgeschlossen (S1–S6).
> **Standing Rule:** Migration als Copy-Paste-SQL → User führt im Supabase-Dashboard aus. SUPABASE_SECRET_KEY nie ins Transkript lesen. Lowercase-Conventional-Commits mit Claude-Footer.

## Context — Warum Phase T

Sprint S (Live-Quiz) und Phase A–C (Live-Präsentation) nutzen heute **HTTP-Polling** als Sync-Mechanismus (siehe ADR-0013). Das funktioniert für Solo-Lehrer + 1–10 Schulen, hat aber zwei strukturelle Grenzen:

1. **Wahrgenommene Latenz:** 1–2,5 Sekunden zwischen Lehrer-Klick und Schüler-Reaktion. Kahoot liegt bei <200 ms — Lehrer:innen merken den Unterschied im Klassenzimmer-Tempo.
2. **Vercel-Function-Last:** Bei 30 Schüler:innen pro Klasse × 1 Sek Polling = 30 Requests/Sek pro Klasse. Bei 30 parallelen Quizzes (z. B. Dienstag 10:00) sind das 900 Req/s nur für Quiz-Polling. Vercel-Hobby-Tier wird gesprengt.

**Phase T migriert genau diesen heißen Pfad** (4–6 Quiz-Events + 4 Live-Präsentations-Events) von Polling auf **Supabase Realtime Broadcast**. Alles andere (Lobby-Auto-Refresh, Heft, Lernpfad-Navigation) bleibt Polling — das ist nicht latenz-kritisch und braucht keine WebSocket-Connection.

**Zielmarke:**

- Wahrgenommene Latenz: <200 ms (Kahoot-Niveau)
- Vercel-Function-Last für Live-Phasen: −70 %
- Free-Tier-Decke: 200 Realtime-Connections gleichzeitig = ~8 parallel laufende Quizzes
- Bei `Supabase Pro $25`: 500 Connections inklusive = ~20 parallele Quizzes → mit Connection-Overage ($10 pro 1000) realistisch ~50 parallele Quizzes für ~$33/Monat

## Architektur-Prinzip Phase T

**Hybrid-Modell:** Polling bleibt der Default, Realtime nur für eng definierte Hot-Path-Events.

| Bereich                                                                       | Bleibt Polling    | Wird Realtime                                             |
| ----------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------- |
| Themen-Navigation, Lehrpfad, Heft                                             | ✅                | —                                                         |
| Lobby (Lehrer wartet auf Schüler:innen)                                       | ✅ (3 Sek reicht) | —                                                         |
| Live-Quiz: Frage-Start, Antwort eingegangen, Reveal, Nächste Frage, Quiz-Ende | —                 | ✅ Broadcast-Channel                                      |
| Live-Präsentation: Folien-Wechsel, Reveal, Lock, Heartbeat                    | —                 | ✅ Broadcast-Channel                                      |
| Schüler-Antwort-Submit (Schreiben in DB)                                      | ✅ Server-Action  | —                                                         |
| Statistik-Updates auf Beamer (z. B. „12 von 25 geantwortet")                  | —                 | ✅ via Broadcast (Lehrer bekommt Update bei jedem Submit) |

**Authoritative Quelle bleibt Postgres.** Broadcast ist nur das **Benachrichtigungs-Layer** — wenn Realtime-Connection abreißt, fällt der Client zurück auf Polling als Sicherheitsnetz (2–3 Sek Tick).

## Geos Entscheidungen (bindend nach Diskussion mit zwei KIs)

1. **Realtime nur für 4–5 Events pro System** (Quiz + Live-Präsentation), kein Komplett-Umbau
2. **Polling-Fallback bleibt aktiv** für Resilienz bei WLAN-Hänger
3. **Soft-Limits einbauen** (siehe `COST-CONTROLS.md`) damit auch bei viralem Ansturm nichts explodiert
4. **Migration JETZT, vor SEO-Launch**, damit erste User die schnelle Variante sehen
5. **DB-Schema bleibt unverändert** — Broadcast ist ephemerer Push, persistente Daten bleiben in Postgres

## Sub-Phasen-Übersicht

| #      | Sub-Phase                                             | Dauer    | Inhalt                                                                                                       |
| ------ | ----------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| **T0** | Vorbereitung + Spike                                  | 1 Tag    | Realtime-Broadcast lokal testen, Auth-Pattern für Schüler:innen-Cookie klären, ADR-0016 schreiben            |
| **T1** | Broadcast-Helper + Hook (`useQuizBroadcast`)          | 1–2 Tage | `lib/realtime/quiz-channel.ts` + `components/quiz/useQuizBroadcast.ts`, mit Polling-Fallback                 |
| **T2** | Quiz-Events publishen (Server-Actions erweitern)      | 1 Tag    | `startQuiz`, `revealQuizQuestion`, `nextQuizQuestion`, `submitQuizAnswer`, `endQuizSession` senden Broadcast |
| **T3** | Quiz-Beamer + Schüler-Overlay auf Broadcast umstellen | 2 Tage   | `useQuizBeamerPoll` + `useQuizQuestionPoll` werden dünne Wrapper über `useQuizBroadcast`                     |
| **T4** | Live-Präsentation auf Broadcast                       | 2 Tage   | Analog für Folien-Wechsel, Reveal, Lock                                                                      |
| **T5** | Soft-Limits + Throttling                              | 1 Tag    | Quiz-Kontingent pro Tag/Schule, Banner bei Limit-Nähe                                                        |
| **T6** | Lasttest mit k6 + Monitoring                          | 1 Tag    | 200 simulierte Schüler:innen, 10 parallele Quizzes, RLS-Latenz prüfen                                        |
| **T7** | ADR + Doku + CHANGELOG + Gate-Lauf                    | ½ Tag    | Spec-Update, MIGRATION-NOTES, Phase-T-Tag                                                                    |

**Gesamt:** ~9–11 Solo-Lehrer-Tage = **3–4 Wochen Kalenderzeit** für jemand mit Tagesjob.

## Sub-Phase T0 — Vorbereitung + Spike (1 Tag)

### T0.1 — Realtime im Supabase-Dashboard aktivieren

1. Supabase-Dashboard → Project → **Database** → **Replication** → sicherstellen dass „Source: supabase_realtime" angelegt ist (per Default da)
2. **Authentication** → **Realtime Settings** → Broadcast bleibt offen, kein Tabellen-Listen-Setup nötig (wir nutzen reine Broadcasts, keine Postgres-Changes)

### T0.2 — Auth-Pattern klären (kritisch)

Schüler:innen haben **kein Supabase-Auth-Token**, sondern eine jose-JWT (`student_session`). Realtime erwartet aber per Default `auth.uid()` für RLS. Drei Lösungswege:

**Variante A: Public Channels (einfach, geringere Sicherheit)**

- Channel-Name enthält Quiz-Session-UUID (raten ist unmöglich bei 128-Bit)
- Jeder mit Channel-Namen kann subscriben
- Schüler:in bekommt Channel-Namen vom Server beim Join (per regulärer DB-Query)
- **Risiko:** Wenn jemand den Channel-Namen abfängt (Browser-DevTools), kann er mitlesen
- **Vorteil:** Implementierung trivial, keine Token-Verwaltung

**Variante B: Custom JWT für Realtime**

- Server signiert kurzes JWT (1h TTL) mit Supabase JWT-Secret
- Client setzt es per `supabase.realtime.setAuth(token)`
- RLS-Policies prüfen `auth.jwt() ->> 'student_code_id'` gegen Quiz-Teilnehmer-Liste
- **Vorteil:** Echte Authorization
- **Nachteil:** Token-Refresh-Logik, mehr Code

**Empfehlung:** **Variante A für Phase T**, weil:

- Channel-Namen sind UUIDs (nicht ratbar)
- Broadcast enthält keine sensiblen Daten (Frage selbst kommt ohne `correct`-Flag, persistente Daten laufen über bestehende Server-Actions mit jose-Session)
- DevTools-Abfangen erfordert physischen Zugriff auf Schüler-Gerät — irrelevant im Klassenzimmer
- Bei späterem Bedarf einfach auf Variante B upgrade-bar

### T0.3 — ADR-0016 schreiben

`docs/decisions/0016-hybrid-realtime-fuer-quiz-und-praesentation.md` mit:

- Kontext (Polling-Limit, Anti-Churn, 500-Schulen-Vision)
- Entscheidung (Hybrid: Polling für 90 %, Realtime für 10 % kritischen Pfad)
- Verworfen: WebRTC (AP-Isolation in Schul-WLANs), Komplett-Realtime (Over-Engineering), Self-Hosted Socket.IO-Server (jetzt zu früh)
- Konsequenzen: Supabase-Pro irgendwann nötig (~$25 + Overage), Polling bleibt als Fallback aktiv

### T0.4 — Lokaler Spike (max 3 Stunden)

Mini-Test in einer Test-Page:

1. Zwei Browser-Tabs öffnen
2. Tab A subscribed auf `quiz:test-channel`, Tab B sendet `broadcast({event: 'next', payload: {q: 1}})`
3. Latenz messen (sollte <100 ms im Schul-WLAN sein)
4. Connection-Abriss simulieren (WLAN aus/an) → wie reagiert die Library?

→ **Gate T0:** Realtime funktioniert lokal, Auth-Pattern entschieden, ADR-0016 commitet.

## Sub-Phase T1 — Broadcast-Helper + Hook (1–2 Tage)

### T1.1 — `lib/realtime/quiz-channel.ts` (Server-Side)

Helper-Funktionen für Server-Actions:

```ts
// lib/realtime/quiz-channel.ts
import { createServiceClient } from '@/lib/supabase/admin';

export type QuizBroadcastEvent =
  | { type: 'question_started'; questionIndex: number }
  | { type: 'answer_received'; answered: number; total: number }
  | { type: 'question_revealed'; questionIndex: number }
  | { type: 'next_question'; questionIndex: number }
  | { type: 'quiz_ended' };

export async function broadcastQuizEvent(
  sessionId: string,
  event: QuizBroadcastEvent
): Promise<void> {
  const supabase = createServiceClient();
  const channel = supabase.channel(`quiz:${sessionId}`, {
    config: { broadcast: { self: false, ack: false } },
  });
  await channel.send({
    type: 'broadcast',
    event: event.type,
    payload: event,
  });
  await supabase.removeChannel(channel);
}
```

**Wichtig:** Server-seitig wird der Channel **pro Aufruf** geöffnet und sofort geschlossen — wir halten serverless keine persistenten Connections.

### T1.2 — `components/quiz/useQuizBroadcast.ts` (Client-Side)

Hook mit Polling-Fallback:

```ts
// components/quiz/useQuizBroadcast.ts
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuizQuestionPoll } from './useQuizQuestionPoll';

export function useQuizBroadcast(initial: QuizQuestionState): QuizQuestionState {
  // 1) Polling als Sicherheitsnetz (3 Sek Tick statt 1 Sek)
  const pollState = useQuizQuestionPoll(initial, { intervalMs: 3000 });
  const [broadcastState, setBroadcastState] = useState<QuizQuestionState>(initial);

  useEffect(() => {
    if (initial.kind !== 'active' && initial.kind !== 'lobby') return;
    const sessionId = 'sessionId' in initial ? initial.sessionId : null;
    if (!sessionId) return;

    const supabase = createClient();
    const channel = supabase.channel(`quiz:${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'question_started' }, ({ payload }) => {
        // Trigger sofort einen Polling-Refresh — die DB hat die volle Wahrheit
        void refetchQuizState().then(setBroadcastState);
      })
      .on('broadcast', { event: 'question_revealed' }, () => {
        void refetchQuizState().then(setBroadcastState);
      })
      .on('broadcast', { event: 'next_question' }, () => {
        void refetchQuizState().then(setBroadcastState);
      })
      .on('broadcast', { event: 'quiz_ended' }, () => {
        void refetchQuizState().then(setBroadcastState);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [initial]);

  // Broadcast hat Vorrang wenn neuer als Polling
  return broadcastState.kind !== 'lobby' ? broadcastState : pollState;
}
```

**Design-Trick:** Broadcast **triggert** nur einen sofortigen Refetch, schickt nicht die ganzen Daten. Vorteil:

- Payload klein (= Realtime-Message-Quota schont)
- Authoritative Daten kommen weiter aus DB (kein Schema-Drift zwischen Broadcast und Polling)
- Polling bleibt als Sicherheitsnetz aktiv → wenn Broadcast verpasst wird, holt Polling auf

### T1.3 — Tests

- Unit: `broadcastQuizEvent` ruft `channel.send` korrekt auf
- Hook-Test (testing-library): Broadcast-Event triggert State-Update
- E2E (manuell): 2 Tabs, Lehrer löst aus, Schüler sieht <500 ms später

→ **Gate T1:** Helper + Hook funktionieren mit Polling-Fallback.

## Sub-Phase T2 — Server-Actions erweitern (1 Tag)

In `lib/db/quiz-session-actions.ts` + `quiz-answer-actions.ts` an jeder schreibenden Stelle nach erfolgreicher DB-Mutation ein `broadcastQuizEvent` aufrufen:

```ts
// Beispiel: startQuiz
export async function startQuiz(classId: string) {
  // ... bestehende DB-Logik
  await broadcastQuizEvent(sess.id, {
    type: 'question_started',
    questionIndex: 0,
  });
}

// Beispiel: submitQuizAnswer
export async function submitQuizAnswer(args: ...) {
  // ... bestehende DB-Logik
  // Beamer braucht counter-Update
  await broadcastQuizEvent(sess.id, {
    type: 'answer_received',
    answered: progress.answered + 1,
    total: progress.total,
  });
}
```

**Wichtig:** Broadcast-Fehler darf die Server-Action nicht failen lassen — wrap in `try/catch` mit Console-Warning. Der Polling-Fallback fängt Aussetzer auf.

→ **Gate T2:** Alle 5 Quiz-Events publishen Broadcast.

## Sub-Phase T3 — Beamer + Schüler auf Broadcast (2 Tage)

- `useQuizBeamerPoll` wird zu `useQuizBeamerBroadcast` (gleiche Schnittstelle, intern Broadcast + Polling-Fallback)
- `useQuizQuestionPoll` analog
- Keine Änderung an Page-Komponenten nötig (gleiche Schnittstelle)
- Pollings-Intervall auf 5 Sek erhöhen (statt 1 Sek) — Broadcast macht die schnelle Reaktion, Polling ist nur noch Fallback

**Erwartete Vercel-Last:** Statt 30 Polls/Sek pro Klasse nur noch 6 Polls/Sek (5 Sek Tick). → **−80 % Polling-Requests**.

→ **Gate T3:** Quiz fühlt sich Kahoot-schnell an, gemessen <200 ms.

## Sub-Phase T4 — Live-Präsentation (2 Tage)

Analog zu T2+T3 für die Live-Präsentation:

- Events: `slide_changed`, `revealed`, `locked`, `signal_raised`, `presentation_ended`
- Channel-Name: `live:${classId}` (Klassen-UUID)
- Heartbeat bleibt Polling (alle 20 s) — niedrige Last, kein Realtime-Bedarf

→ **Gate T4:** Beamer-Dimm-Sync läuft <200 ms.

## Sub-Phase T5 — Soft-Limits + Throttling (1 Tag)

Siehe `docs/COST-CONTROLS.md` für die volle Strategie. In Phase T konkret:

1. **Concurrent-Quiz-Sperre pro Klasse:** schon vorhanden (`start_quiz_session` RPC prüft gegen `live_sessions`). Nichts zu tun.
2. **Concurrent-Quiz-Sperre pro Lehrer:in:** neu — max 1 Quiz pro Lehrer:in gleichzeitig
3. **Tagespensum pro Schule:** neu — max 20 Quiz-Starts pro Tag pro Schule (Soft-Default, im Code änderbar). Bei Erreichen: Banner „Quiz-Kontingent für heute aufgebraucht — geht morgen wieder, oder schalte Pro frei"
4. **Global-Kill-Switch:** Env-Var `QUIZ_DISABLED=true` lässt Quiz-Buttons komplett ausgrauen mit Maintenance-Banner. Damit kannst du im Notfall in 30 Sek alle Quizzes stoppen ohne Deploy.

→ **Gate T5:** Limits greifen, sichtbare Banner, Tests vorhanden.

## Sub-Phase T6 — Lasttest mit k6 (1 Tag)

Skript: `loadtests/quiz-broadcast.js`

- 200 virtuelle Schüler:innen
- 10 simulierte Lehrer:innen, jede startet ein 10-Frage-Quiz parallel
- Messen: Latenz (p50, p95, p99), Realtime-Connection-Stability, Fehler-Rate

Lokal gegen Dev-Supabase (eigene Projekt-Instanz) laufen lassen. Bei groben Problemen: ADR ergänzen, Fix-Iteration.

→ **Gate T6:** 200 Schüler:innen × 10 Quizzes laufen ohne Fehler, p95 <300 ms.

## Sub-Phase T7 — Doku + ADR + Commit (½ Tag)

- `docs/QUIZ-MODI-SPEZIFIKATION.md` §5.X um Realtime-Broadcast erweitern
- `docs/decisions/0016-hybrid-realtime.md` finalisieren
- `CHANGELOG.md` Phase-T-Eintrag
- `CLAUDE.md` Phasen-Status auf 2026-XX-YY aktualisieren
- Git Tag `phase-t-realtime-savepoint` setzen

## Datei-Übersicht (kompakt)

| Sub-Phase | NEU                                                                            | MODIFIZIERT                                                                                                   |
| --------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| T0        | `docs/decisions/0016-hybrid-realtime.md`                                       | —                                                                                                             |
| T1        | `lib/realtime/quiz-channel.ts` · `components/quiz/useQuizBroadcast.ts` · Tests | —                                                                                                             |
| T2        | —                                                                              | `lib/db/quiz-session-actions.ts` · `lib/db/quiz-answer-actions.ts`                                            |
| T3        | —                                                                              | `components/quiz/useQuizBeamerPoll.ts` (→ Broadcast) · `components/quiz/useQuizQuestionPoll.ts` (→ Broadcast) |
| T4        | `lib/realtime/live-channel.ts` · `components/blocks/useLiveBroadcast.ts`       | `lib/db/live-session-actions.ts` · `components/blocks/usePresentationLive.ts` · `app/api/live/route.ts`       |
| T5        | `lib/db/quiz-quota.ts` · `components/quiz/QuotaBanner.tsx`                     | `lib/db/quiz-session-actions.ts` · Quiz-Setup-Page                                                            |
| T6        | `loadtests/quiz-broadcast.js` · `loadtests/README.md`                          | —                                                                                                             |
| T7        | —                                                                              | `docs/QUIZ-MODI-SPEZIFIKATION.md` · `CHANGELOG.md` · `CLAUDE.md`                                              |

## Sicherheits-/Konventions-Checkliste

- SUPABASE_SECRET_KEY nie ins Transkript lesen
- Service-Role-Key niemals im Client-Bundle (Broadcast-Auth läuft auf Anon-Key wenn Channel public)
- Realtime-Latenz für RLS in Production prüfen (komplexe RLS-Policies können erste Subscription >500 ms verzögern)
- Polling-Fallback bleibt zwingend aktiv — keine reine Realtime-Architektur
- Broadcast-Payloads klein halten (<1 KB) — Quoten-schonend
- ESLint max-lines 200/Datei beachten — neue Hook-Files bewusst klein
- Tabs, TS strict, Tests neben dem Modul
- Lowercase-Conventional-Commits, Footer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Gate pro Sub-Phase: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check`

## Bewusst NICHT in Phase T

- **Keine komplette Polling-Abschaffung** — Lobby, Lehrpfad, Heft bleiben Polling/SSR
- **Kein WebRTC** — AP-Isolation in Schul-WLANs, TURN-Server-Kosten, Lehrer-Tab-Stabilität sind reale Showstopper (siehe ADR-0016)
- **Kein Postgres-Changes-Subscription** — wir nutzen nur Broadcast (kleinere Quote, einfacheres Auth)
- **Keine Presence-API** — Teilnehmerzähler bleibt DB-basiert (Polling alle 5 Sek reicht)
- **Kein eigener WebSocket-Server (Socket.IO/uWebSockets)** — frühestens in `docs/SCALE-PLAN.md` Phase X

## Risiken

1. **RLS-Latenz:** Komplexe RLS-Policies auf den Backing-Tabellen können die erste Subscription verzögern. Mitigation: Broadcast nutzt eigene RLS-Policies (oder Public Channels), nicht die Quiz-Tabellen-RLS.
2. **Realtime-Connection-Limit erreicht:** Free-Tier 200 Connections. Mitigation: Soft-Limit aus T5 + Monitoring + Banner.
3. **Lehrer:in schließt Tab → Broadcast endet:** Schüler:innen merken nichts, bis Polling-Fallback (5 Sek) anspringt. Akzeptabel.
4. **Browser-Suspend (mobile Tab im Hintergrund) trennt WebSocket:** Standard-Verhalten. Beim Tab-Wiederherstellen reconnected die Library automatisch.

## Verifikation (E2E nach Phase T komplett)

1. 2-Browser-E2E: Lehrer-Beamer + Schüler:innen-Tab, Quiz durchspielen, gefühlte Latenz <200 ms
2. WLAN-Abriss-Test: Schüler-WLAN für 5 Sek aus → Reconnect erfolgt automatisch, kein Datenverlust
3. Lehrer-Tab-Kill-Test: Lehrer:in schließt Beamer hart → Schüler-Overlay verschwindet via Heartbeat-Tod (60 s)
4. Lasttest k6: 200 Schüler:innen × 10 Quizzes parallel, p95 <300 ms, keine Fehler
5. Cost-Check: Supabase-Dashboard → Realtime-Messages-Counter prüfen, Hochrechnung auf 1 Monat <2 Mio (Free-Tier-Decke)
6. Gate-Lauf: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check`
