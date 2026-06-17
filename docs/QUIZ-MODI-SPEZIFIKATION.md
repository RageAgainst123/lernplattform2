# Quiz-Modi — Spezifikation

> **Stand:** 2026-06-03 · **Status:** Sprint R + Phase S in Arbeit
> **Vorgängerdokument:** `docs/MODUL-SPEZIFIKATION.md` (allgemeine Block-Engine)
> **Verbindlich:** Diese Datei ist die Single-Source-of-Truth für alle 4
> Quiz-Modi. Bei Widersprüchen zu älteren Notizen gilt diese.

## 1. Vier Modi auf einen Blick

Alle vier Modi nutzen denselben Block-Vorrat (`lib/schemas/blocks.ts`, MC, T/F,
Lückentext, Match) und dieselbe Bewertung (`lib/blocks/evaluate.ts`). Sie
unterscheiden sich darin, **wann gepunktet wird, wo der State lebt, und wie
Lehrer:innen es sehen**.

| Dimension             | Solo                          | Live-Klassen                 | Hausaufgabe               | Team                            |
| --------------------- | ----------------------------- | ---------------------------- | ------------------------- | ------------------------------- |
| Beamer                | nein                          | ja (zentral)                 | nein                      | ja (zentral)                    |
| Synchron              | nein                          | ja, server-getaktet          | nein, individuell         | ja, server-getaktet             |
| Geräte pro Schüler:in | 1 (eigenes)                   | 1 (eigenes)                  | 1 (eigenes)               | **1 pro Team (Captain)**        |
| Punkte in DB?         | **nein** (lokal/UI)           | ja                           | ja                        | ja (pro Captain = Team)         |
| Leaderboard wann?     | nie (privat)                  | zwischen Fragen + Ende       | **erst nach Frist**       | zwischen Fragen + Ende          |
| DB-Session-Row?       | nein (nur `student_progress`) | `mode='live_class'`          | `mode='homework'`         | `live_class` + `team_mode=true` |
| Lobby-Phase?          | nein                          | ja (`status='lobby'`)        | nein (direkt `active`)    | ja                              |
| Disconnect-Verhalten  | gespeicherter Stand           | 30s Karenz → 0 Punkte        | kein Karenz, client-Timer | wie Live, ganzes Team raus      |
| Frist                 | keine                         | keine                        | hart (`due_date`)         | keine                           |
| Wiederholbar          | **beliebig oft** (Upsert)     | nein                         | nein                      | nein                            |
| Konflikt-Sperre       | **keine — läuft immer**       | gegenseitig mit Präsentation | pro `(classId, moduleId)` | wie Live                        |

## 2. Geteilte vs. modi-spezifische Komponenten

### Geteilt (Live + Hausaufgabe + Team)

- **DB-Tabellen** `quiz_sessions`, `quiz_participants`, `quiz_answers`
  (Migration 0020, siehe §10)
- **Punkte-Formel** `base = round(1000 × (1 - 0.5 × elapsed/limit))` +
  Streak-Tiers (lebt in `lib/blocks/points.ts`, R1.2)
- **`submitQuizAnswer`** mit `FOR UPDATE`-Lock + Idempotenz via
  `UNIQUE(session_id, student_code_id, question_index)`
- **Heartbeat-Lazy-Check** analog Phase A (Live-Präsentation)

### Live + Team teilen ~90%

… der Lobby-, Reveal- und Leaderboard-Komponenten. Nur Labels (Codename
vs. Teamname) unterscheiden sich. Eine prop-driven `<ParticipantLabel>` reicht.

### Solo bleibt komplett außen vor

… mit eigenem Code-Pfad (`student_progress`-Upsert via `saveProgress`-Action).
Keine `quiz_sessions`-Berührung.

## 3. Verbindliche Architektur-Entscheidungen (2026-06-03)

Die folgenden Punkte sind in der Planungs-Sitzung am 2026-06-03 mit Geo final
entschieden und gelten für alle weiteren Implementierungsschritte.

1. **4 Modi:** `solo`, `live_class`, `homework`, `team` (1 Gerät pro Team)
2. **Wettbewerb:** voll Kahoot mit öffentlichem Leaderboard
3. **Punkte-Formel** (richtig): `base = round(1000 × (1 - 0.5 × elapsed/timeLimit))`
4. **Streak-Bonus:** ≥3 +100, ≥5 +250, ≥7 +500 (nur der höchste Bonus, nicht
   kumulativ)
5. **Solo bekommt Punkte als optionale Anzeige** (kein Highscore-DB)
6. **Zeit-Limit pro Frage:** Standard 30s, konfigurierbar pro Session
7. **Reveal** nach Frage: richtige Lösung + Verteilung am Beamer
8. **Disconnect:** 30s Karenz → 0 Punkte für die verpasste Frage, Streak=0
9. **Live-Block-Typen:** MC + T/F (+ Lückentext mit Warnhinweis dass
   Tipp-Latenz Punkte verzerrt; bei Kick-off von S1 mit Geo verifizieren).
   `match` bleibt Solo-only.
10. **Anzeigename:** immer Codename (auch SSO), Realname nur im Lehrer-Backend
11. **Konflikt:** Quiz-Session blockiert Live-Präsentation und umgekehrt
12. **Polling:** adaptiv 1s aktiv / 3s reveal, Heartbeat-Tod nach 60s
13. **Live-Beitritt:** aus `/s`-Dashboard, eingeloggte Schüler:innen

## 4. Solo-Modus — vollständiger Ablauf

### 4.1 Vorbedingungen

- **Wer:** Eingeloggte Schüler:in (jose-Cookie aus `/k/[code]` Code+PIN oder
  O365-SSO). Geprüft via `requireStudentSession()` in
  `app/s/modul/[id]/page.tsx`.
- **Daten:**
  - Modul in `modules`, `is_published=true`,
    `activity_kind ∈ {lernmodul, quiz, abschlusstest}`
  - Modul über `class_modules` der eigenen Klasse zugewiesen
  - `display_mode='quiz'` (Default) — sonst `WorksheetRunner` statt
    `ModuleRunner`
  - Bei `activity_kind='abschlusstest'`: alle Lernmodule des Themas müssen
    `done` sein (`guardAbschlusstest`)

### 4.2 Schritt-für-Schritt

1. **Server-Render:** lädt `getStudentModule()` + `getProgress()`, berechnet
   `startIndex = min(progress.currentBlockIndex ?? 0, blocks.length-1)` →
   Wiederaufnahme an letzter Stelle. Rendert `<ModuleRunner />`.
2. **Antwort eingeben:** `runner.setAnswer()` → State-Update lokal,
   **kein DB-Write**. Button zeigt **„Prüfen"**.
3. **„Prüfen":** `runner.check()` setzt `checked=true`. `<BlockFeedback>`
   zeigt richtig/falsch. Button → **„Weiter"** (oder **„Fertig"**).
4. **„Weiter":** wrappt in `startTransition` → Server-Action
   `saveProgress({blockIndex, answers, score, done})`. Upsert in
   `student_progress` (Key `student_code_id + module_id`).
5. **Letzter Block + „Fertig":** `done=true`, `completed_at=NOW()`,
   `router.push('/s/modul/[id]/done')`.

### 4.3 Punkte-Beispiel (nach Sprint R)

MC, 15s gebraucht, richtig, vorheriger Streak 2 → neuer Streak 3:

```
base   = round(1000 × (1 - 0.5 × 15/30)) = 750
streak = (newStreak 3 ≥ 3)              → +100
gesamt = 850 Punkte für diese Frage (nur lokal)
```

### 4.4 State

**Client (`useModuleRunner`):** `index`, `answers`, `checked`. Nach Sprint R
zusätzlich `timeStartedAt`, `streak`, `pointsPerBlock`.

**DB-Writes (`saveProgress`):** Upsert in `student_progress`:
`current_block_index`, `answers` (jsonb), `score`, `max_score`, `completed_at`
(nur bei `done=true`), `last_activity_at`.

**Solo-Punkte landen NICHT in der DB** — bewusste Architektur-Entscheidung
(siehe §3.5).

### 4.5 Endseite (nach Sprint R)

- **Score-Hero** „X von Y richtig" + Prozent + Solo-Punkte-Summe mit
  Streak-Info
- **Antwort-Übersicht** pro Block mit ✅/❌-Indikator + korrekter Lösung
- **„Falsche Fragen wiederholen"-Button** → `/s/modul/[id]?wrongOnly=1`,
  filtert auf falsch beantwortete Blocks. **Wrong-Only zählt NICHT zur
  Score-Aktualisierung** in der DB (reiner Übungsmodus).

### 4.6 Lehrer:innen-Sicht

Fortschritts-Matrix unter `/lehrer/klassen/[id]` (Zelle „N/M richtig") +
Detailseite. Quelle: `student_progress.score`, `max_score`, `completed_at`.
**Solo-Punkte tauchen nirgends im Lehrer-Backend auf.**

### 4.7 Edge Cases

- **Dasselbe Quiz 2×:** Upsert überschreibt. Keine History.
- **Bereits abgegeben + nochmal:** `saveProgress` hat keinen
  `isAlreadySubmitted`-Guard (anders als `submitWorksheet`).
- **Tab schließen vor „Weiter":** Aktuelle Antwort weg, Vorherige persistiert.
- **Konflikt mit Live-Präsentation:** Solo **läuft jederzeit**, auch parallel
  zu Live-Präsentation/Live-Quiz (kein Beamer, keine Synchronisation).

## 5. Live-Klassen-Quiz (Kahoot-Stil)

### 5.1 Vorbedingungen

- Lehrer:in eingeloggt mit eigener Klasse (≥1 aktive Mitgliedschaft)
- Modul mit ≥1 live-tauglichem Block (MC, T/F, ggf. Lückentext);
  `match`-Blocks werden gefiltert
- Schüler:innen via jose-Cookie eingeloggt + Klassen-Mitglieder
- Keine andere `quiz_sessions` mit `status IN ('lobby','active','between_questions')`
  für dieselbe Klasse (`unique_active_session_per_class`, partial index)
- Keine konkurrierende `live_sessions` aktiv

### 5.2 Setup-Phase (Lehrer:in am Beamer)

Route: `/lehrer/klassen/[id]/quiz/[moduleId]`. Setup-Dialog:

| Option                     | Default | Wertebereich |
| -------------------------- | ------- | ------------ |
| `time_limit_seconds`       | 30      | 10–120       |
| `team_mode`                | false   | bool         |
| `show_leaderboard_between` | true    | bool         |
| `shuffle_questions`        | false   | bool         |
| `shuffle_answers`          | true    | bool         |

Klick „Quiz starten" → `createQuizSession`:

1. Pre-Check `assertNoActiveLiveSession(classId)` +
   `assertNoActiveQuizSession(classId)` → bei Konflikt 409 + Fehler-Toast
2. Filtere `match`-Blocks raus, Rest in `session.question_order JSONB`
3. INSERT `quiz_sessions` (Status `lobby`, `current_question_index=-1`,
   `heartbeat_at=NOW()`)
4. Redirect Beamer auf `/lehrer/klassen/[id]/quiz/[moduleId]/run?session=[sessionId]`

### 5.3 Lobby-Phase

**Schüler:innen-Banner** auf `/s`: „🎮 Live-Quiz „X" startet — Beitreten →"

Klick → `joinQuizSession(sessionId)`:

- INSERT `quiz_participants` mit `last_seen_at=NOW()`
- `ON CONFLICT (session_id, student_id) DO UPDATE SET last_seen_at=NOW()`
  → Idempotenz gegen Doppel-Tabs
- Codename wird aus `students.codename` kopiert (Snapshot — bleibt stabil
  bei späteren Codename-Änderungen)
- Redirect → `/s/quiz/[sessionId]`

**Beamer:** Polling alle **1s**, Teilnehmer:innen-Counter + Liste mit
Fade-in. Button „Quiz starten" disabled bis ≥1 Teilnehmer:in.

Klick „Quiz starten" → `startQuiz`: `status='active'`,
`current_question_index=0`, `current_question_started_at=NOW()`.

### 5.4 Frage-Phase (chronologisch, eine Frage)

**t=0** — `nextQuestion`-Action: setzt `current_question_started_at=NOW()`.

**Beamer** (`QuizQuestionBeamer`):

- Frage-Text groß (5xl), Antwort-Optionen mit Farbe+Symbol (Kahoot-Stil:
  🔴▲, 🔵◆, 🟡●, 🟢■)
- Countdown-Ring 30s (clientseitig animiert, server-authoritativ via
  `current_question_started_at`)
- „**0/18 haben geantwortet**" (Polling 1s auf `getQuizProgress`)

**Schüler:innen-Gerät** (`/s/quiz/[sessionId]`):

- Polling 1s auf `getQuizStateForStudent(sessionId)` → liefert Frage +
  Optionen (**ohne** `correct_answer`!)
- Antwort-Buttons in vollflächigen Farben
- Eigener Countdown (Drift-Korrektur via Server-Timestamp)

**t=5s** — Schüler:in A tippt Antwort B → `submitQuizAnswer`:

```ts
const session = await getSessionLocked(sessionId); // FOR UPDATE
if (session.status !== 'active') throw 'STALE_QUESTION';
if (session.current_question_index !== N) throw 'STALE_QUESTION';

const elapsedMs = Date.now() - session.current_question_started_at;
if (elapsedMs > session.time_limit_seconds * 1000) throw 'TOO_LATE';

const isCorrect = checkAnswer(question, 'B');
const elapsedRatio = elapsedMs / (session.time_limit_seconds * 1000);
const base = isCorrect ? Math.round(1000 * (1 - 0.5 * elapsedRatio)) : 0;
// elapsedMs=5000, timeLimit=30s → 1000 × (1 - 0.0833) = 917

const participant = await getParticipantLocked(sessionId, studentId);
const newStreak = isCorrect ? participant.current_streak + 1 : 0;
const streakBonus = isCorrect
  ? newStreak >= 7
    ? 500
    : newStreak >= 5
      ? 250
      : newStreak >= 3
        ? 100
        : 0
  : 0;
const points = base + streakBonus; // 917 + 100 = 1017

await db.transaction(async (tx) => {
  await tx.insert(quiz_answers).values({
    session_id,
    student_id,
    question_index: N,
    answer: 'B',
    is_correct: isCorrect,
    elapsed_ms: elapsedMs,
    points_awarded: points,
  }); // UNIQUE-Constraint schützt vor Race
  await tx.update(quiz_participants).set({
    total_points: sql`total_points + ${points}`,
    current_streak: newStreak,
    longest_streak: sql`GREATEST(longest_streak, ${newStreak})`,
    correct_count: sql`correct_count + ${isCorrect ? 1 : 0}`,
    last_seen_at: NOW(),
  });
});
```

Schüler:in-UI: „**Warte auf andere…**" + eigene Punkte (`+1017`) Fade-in.

**t=15s:** alle geantwortet → `getQuizProgress` liefert `{answered:18, total:18}`
→ Beamer triggert automatisch `revealQuestion`.

**Oder t=30s** (Timeout): Server-Lazy-Check beim Polling füllt fehlende
`quiz_answers`-Rows mit `{answer:null, is_correct:false, elapsed_ms:30000,
points_awarded:0}` für alle `quiz_participants` ohne Row für diese Frage.
`current_streak=0` reset.

### 5.5 Reveal-Phase

`revealQuestion`: `status='between_questions'`. Polling-Intervall switched
auf **3s**.

**Beamer** (`QuizRevealBeamer`):

- Balken-Diagramm: pro Antwort-Option Anzahl Klicks (`SELECT answer,
COUNT(*) FROM quiz_answers WHERE session_id=? AND question_index=? GROUP
BY answer`)
- Richtige Option grün, andere grau
- „**67% richtig**" als Stat

**Schüler:innen-Sicht:**

- ✅/❌ + „**+1017 Punkte**"
- Streak-Indikator: „🔥 3er-Streak!" wenn `newStreak ≥ 3`

Lehrer:in klickt **„Leaderboard"** oder **„Nächste Frage"**.

### 5.6 Leaderboard-Phase

`showLeaderboard`: rein clientseitiger State-Wechsel am Beamer (kein
DB-Statuswechsel, bleibt `between_questions`).

**Beamer:** Top-5 mit Slide-up-Animation, Codename + Total + Δ. **Letzter
Platz wird nicht gezeigt** (Schutz vor Bloßstellung).

**Schüler:innen-Sicht:** „🥉 Du bist auf **Platz 3 von 18** mit **1017
Punkten**" (Rang via `RANK() OVER (ORDER BY total_points DESC)`).

Klick „Nächste Frage" → `nextQuestion` → zurück zu §5.4.

### 5.7 Quiz-Ende

Bei letzter Frage zeigt der „Nächste"-Button **„Quiz beenden"**. Klick →
`endQuiz`:

- `UPDATE quiz_sessions SET status='ended', ended_at=NOW()`
- Pending `quiz_answers` für nicht-geantwortete Schüler:innen werden mit
  0 Punkten gefüllt

**Beamer-Endbildschirm:** 🥇🥈🥉-Podest mit Confetti.
**Schüler:innen-Sicht:** Eigener Rang + Total + `correct_count`/`question_count`

- schwierigste Frage.

**Heartbeat-Tod:** Lazy-Check beim Polling — `UPDATE quiz_sessions SET
status='ended', ended_at=NOW() WHERE status IN ('lobby','active','between_questions')
AND heartbeat_at < NOW() - 60s`. Beamer-Tab pingt `heartbeat_at` bei jeder
Action.

### 5.8 State-Maschine

```
        ┌─────────┐  startQuiz   ┌────────┐  reveal  ┌────────────────────┐
        │  lobby  │─────────────▶│ active │─────────▶│ between_questions  │
        └─────────┘              └────────┘          └────────────────────┘
             │                        ▲                       │
             │                        │  nextQuestion         │
             │                        └───────────────────────┘
             │                                                │
             │                            endQuiz             │
             └────────────────────┬───────────────────────────┘
                                  ▼
                              ┌───────┐
                              │ ended │
                              └───────┘
```

### 5.9 Disconnect/Reconnect

**Disconnect mitten in Frage 3:**

- 30s Karenz, `last_seen_at` bleibt alt
- Wenn Polling nicht zurückkehrt: Frage 3 wird mit 0 Punkten gewertet, sobald
  alle anderen geantwortet haben oder t=30s erreicht
- `current_streak` wird beim Default-Insert auf 0 zurückgesetzt

**Reconnect t=45s, mitten in Frage 4:**

- Polling-Call kehrt mit `{status:'active', current_question_index:4, ...}`
  zurück
- Server-Lazy-Check schreibt für vergangene Fragen 0-Punkte-Rows
- **Frage 3 ist nicht nachholbar** — Schüler:in sieht im Endbildschirm
  „verpasst"

### 5.10 Edge Cases

- **Modul mit `match`-Block:** Setup-Phase filtert raus, Banner „1 Frage
  übersprungen (nicht live-tauglich)". Falls 0 Fragen übrig: Setup-Action
  lehnt ab.
- **Spät-Beitritt nach Frage 2:** `joinQuizSession` erlaubt bis
  `status='ended'`. Server-Lazy-Check schreibt für vergangene Fragen
  0-Punkte-Rows beim ersten Polling.
- **Konkurrierende Live-Präsentation:** `createLiveSession` prüft
  `assertNoActiveQuizSession`. Umgekehrt blockiert `live_sessions` eine
  neue Quiz-Session.
- **Konkurrente `joinQuizSession` (zwei Tabs):** `ON CONFLICT … DO UPDATE`
  verhindert Duplikat.
- **Doppel-Submit:** Client disabled Buttons. Server: `UNIQUE`-Constraint
  fängt Race → zweite Action liefert `STALE_QUESTION`.
- **Stale Submit nach Reveal:** `submitQuizAnswer` prüft
  `session.status === 'active' && current_question_index === N`. Beides false
  → `STALE_QUESTION` Error.

## 6. Hausaufgaben-Modus

### 6.1 Vorbedingungen

- Lehrer:in eingeloggt
- Modul existiert mit ≥1 quiz-fähigem Block
- Klassen-Zuweisung muss existieren **oder** wird im Setup-Modal atomar
  mitangelegt (siehe §11 Decision-Points)

### 6.2 Setup-Phase

Auf `/lehrer/klassen/[id]` neben jedem zugewiesenen Modul: Button
**„📅 Als Hausaufgabe stellen"**. Modal:

- `due_date`-Picker (Datum + Uhrzeit, Default **morgen 18:00**, min jetzt+1h)
- Checkbox „Zeitlimit pro Frage erzwingen?" (Default aus → `time_limit_per_question_s=null`
  in DB, aber `scoring_time_limit_s=30` für die Punkte-Formel)
- Optionaler Hinweis-Text (max 200 Zeichen)

`createHomeworkQuiz`:

- Konfliktcheck pro `(classId, moduleId)` mit `status IN ('lobby','active')`
  und `mode='homework'`
- INSERT `quiz_sessions`: `mode='homework'`, `status='active'` (keine Lobby!),
  `due_date`, `scoring_time_limit_s=30`, `started_at=NOW()`

### 6.3 Schüler:innen-Dashboard

`/s` mit Sektion **„📅 Hausaufgaben"** über „Module zum Üben". Karte:

- Titel + Frist mit Live-Countdown („noch 2 Tage 3 Std")
- Status-Badge: „Noch nicht gestartet" / „Begonnen — 3 von 8 Fragen" /
  „✅ Erledigt"
- < 24h rot umrandet, < 6h pulsierend

Klick → `/s/quiz/homework/[sessionId]`.

### 6.4 Quiz-Durchlauf

- `joinHomeworkQuiz`: UPSERT (idempotent), **Frist-Check zuerst**
- Frage-Flow analog Solo, aber mit Punkten:
  - Client misst `elapsed_ms = performance.now() - questionStartedAt`
  - Server validiert: `0 ≤ elapsed_ms ≤ 300_000` (5min Cap), darüber
    `suspicious=true` in `quiz_answers`
- **Punkte-Formel** mit `scoring_time_limit_s=30`:
  - `elapsed_s = min(elapsed_ms/1000, 30)` (Cap auf Limit)
  - Beispiel: 8s richtig Streak 1 → `base=867, gesamt=867`
- **Sofortiges Reveal** pro Block (kein Diagramm, asynchron sinnlos)
- Tab schließen → Stand persistent, Reload springt zur ersten unbeantworteten
  Frage

### 6.5 Frist-Ablauf-Verhalten

**Lazy-Check** (kein Cron, Next-16 ohne Hintergrund-Worker): jeder Aufruf
prüft `due_date < NOW()`. Wenn abgelaufen UND `status='active'`:

- UPDATE `status='ended'`, `ended_at=due_date`
- Teilnehmer:innen ohne vollständige Antworten → `final_status='partial'`
  oder `'never_started'` (LEFT JOIN auf Klassen-Mitgliedschaft für
  Detektion)

### 6.6 Endseiten

**Schüler:in vor Frist:** „Du hast **4500 Punkte**. 🏆 Dein Rang wird **nach
Freitag 18 Uhr** sichtbar — sonst wären Spät-Spieler:innen im Nachteil."

**Schüler:in nach Frist:** Top-10-Codename-Leaderboard + eigener Rang +
Item-Übersicht.

**Lehrer:in:** Teilnehmer-Tabelle (Codename, Status, Total, Rang, Dauer),
Item-Analyse pro Frage, CSV-Export (Codename + Realname).

### 6.7 Edge Cases

- **Doppel-Abgabe:** `quiz_answers` UNIQUE schützt
- **Lehrer:in löscht Session:** Soft-Delete via `status='cancelled'`,
  Schüler:in sehen „Hausaufgabe zurückgezogen"
- **Disconnect:** kein 30s-Karenz wie Live — Timer läuft client-side weiter,
  automatischer Cap auf 30s in der Formel → faire 500 Punkte
- **Solo-Übung parallel erlaubt:** verschiedene Tabellen, keine Kollision

## 7. Team-Modus (1 Gerät pro Team)

### 7.1 Vorbedingungen

- Klasse mit ≥4 Schüler:innen (sinnvoll)
- Lehrer:in setzt `team_mode=true` beim Quiz-Setup
- Ein Tablet/Laptop pro Team (physische Voraussetzung, nicht prüfbar)
- Quiz-Blocks: MC, T/F, Lückentext (Match nur Solo)

### 7.2 Setup-Phase

Setup-Form mit Toggle „Team-Modus" + Empfehlung „2-6 Teams" (kein
Hard-Limit). Beamer-Vorschau: „Bildet 2-4er-Gruppen, ein Gerät pro Team,
ein:e Schüler:in als Team-Captain einloggen".

### 7.3 Lobby-Phase (Team-spezifisch)

- Banner auf `/s`: „Tritt deinem Team bei" → eigene Route
  `/s/quiz/[id]/team-join` (NICHT der Solo-Join)
- Team-Name-Form + Button „Team gründen" → `joinQuizSessionAsTeam`:
  - Validierungen: `team_mode=true`, `status='lobby'`, `team_name` nicht
    leer (max 40 Zeichen), DB-Unique `(session_id, team_name)`
  - INSERT `quiz_participants` mit `team_name`, `student_code_id = Captain`
- Weitere Team-Mitglieder loggen sich **nicht** ein — schauen am
  Captain-Gerät zu
- Beamer zeigt Liste der **Teamnamen** (statt Codenames)

### 7.4 Frage-Phase

- Beamer: „2/4 Teams haben geantwortet" (keine Auflösung welches Team)
- Captain-Gerät: Header „Team Codeknacker" + Countdown + Antwort-Buttons
  (touch-tauglich, Team diskutiert vorm Tap)
- Submit nur einmal pro Team (Button disabled nach Klick)
- Streak-Bonus auf Captain-Ebene

### 7.5 Reveal-Phase

- Beamer: Verteilung mit **Teamnamen-Chips**:
  - „Team Codeknacker → B (richtig)"
  - „Team Tigers → A"
- Captain-Gerät: „Richtig! +1017 Punkte" + „Team Codeknacker — Platz 2"

### 7.6 Team-Leaderboard (MVP)

Da **1 Captain pro Team**: Aggregation trivial.

```sql
SELECT team_name, total_points FROM quiz_participants
WHERE session_id = ? ORDER BY total_points DESC
```

Falls später mehrere `student_code_id`s pro `team_name` erlaubt:
`SUM(total_points) GROUP BY team_name`.

### 7.7 Quiz-Ende

- Beamer: Top-3-Teams auf Podest + Confetti
- Captain-Gerät: „Team Codeknacker — 2. Platz von 4 — 3120 Punkte"
- Lehrer:in-Backend: Auswertung pro Team **und** pro Captain-Realname (nur
  dort sichtbar)

### 7.8 Edge Cases

- **Doppelter Teamname:** Inline-Fehler
- **Captain disconnected mitten im Quiz:** 30s Karenz, Team verliert Runde
- **Captain-Wechsel:** **MVP nicht supported** (Captain stabilstes Gerät
  wählen). Spätere Phase: Token-basierter Handover.
- **1-Personen-Team:** tech erlaubt, sozial regulieren
- **Realname-Schutz:** Beamer-Route `/lehrer/klassen/[id]/quiz/[id]/host`
  zeigt **nie** Realnamen, nur `/lehrer/klassen/[id]/quiz/[id]/results`.

## 8. Punkte-Formel (verbindlich)

```ts
// lib/blocks/points.ts (Sprint R, R1.2)
const STREAK_TIERS = [
  { min: 7, bonus: 500 },
  { min: 5, bonus: 250 },
  { min: 3, bonus: 100 },
] as const;

export function calculatePoints(
  correct: boolean,
  elapsedMs: number,
  timeLimitSeconds: number,
  newStreak: number
): number {
  if (!correct) return 0;
  const elapsedRatio = Math.min(elapsedMs / (timeLimitSeconds * 1000), 1);
  const base = Math.round(1000 * (1 - 0.5 * elapsedRatio));
  const tier = STREAK_TIERS.find((t) => newStreak >= t.min);
  return base + (tier?.bonus ?? 0);
}
```

**Eigenschaften:**

- `correct=false` → 0 Punkte (immer)
- `elapsedMs=0` → max. base 1000
- `elapsedMs >= timeLimit*1000` → min. base 500 (Cap durch `Math.min`)
- Streak-Bonus ist der **höchste passende** Tier (nicht kumulativ)
- Pure Funktion — voll testbar isoliert

## 9. Tippfehlertoleranz (Lückentext, R1.5)

- Levenshtein-Distanz ≤ 1 für Wörter mit Länge ≥ 4
- Opt-out via Block-Flag `strict: true` in `lib/schemas/blocks.ts`
- Pure JS-Funktion (~30 Zeilen), keine Dependency
- Begründung: Quizlet-Standard, fair für DaZ/Legasthenie

## 10. Migration 0020 (für Phase S)

```sql
-- Enums
CREATE TYPE quiz_session_status AS ENUM (
  'lobby', 'active', 'between_questions', 'ended'
);
CREATE TYPE quiz_mode AS ENUM (
  'solo', 'live_class', 'homework', 'team'
);

-- Haupt-Session-Tabelle
CREATE TABLE quiz_sessions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id                    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  module_id                   UUID NOT NULL REFERENCES modules(id),
  mode                        quiz_mode NOT NULL,
  status                      quiz_session_status NOT NULL DEFAULT 'lobby',
  current_question_index      INT NOT NULL DEFAULT 0,
  current_question_started_at TIMESTAMPTZ,
  time_limit_seconds          INT NOT NULL DEFAULT 30,
  scoring_time_limit_s        INT NOT NULL DEFAULT 30,
  team_mode                   BOOLEAN NOT NULL DEFAULT FALSE,
  question_order              JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_date                    TIMESTAMPTZ,
  started_by                  UUID NOT NULL REFERENCES teachers(id),
  started_at                  TIMESTAMPTZ,
  ended_at                    TIMESTAMPTZ,
  heartbeat_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Genau eine aktive Quiz-Session pro Klasse
CREATE UNIQUE INDEX quiz_sessions_active_per_class
  ON quiz_sessions(class_id)
  WHERE status IN ('lobby', 'active', 'between_questions');

-- Teilnehmer:innen-Tabelle
CREATE TABLE quiz_participants (
  session_id      UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  student_code_id UUID NOT NULL REFERENCES student_codes(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  team_name       TEXT,
  total_points    INT NOT NULL DEFAULT 0,
  current_streak  INT NOT NULL DEFAULT 0,
  longest_streak  INT NOT NULL DEFAULT 0,
  correct_count   INT NOT NULL DEFAULT 0,
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, student_code_id)
);

CREATE INDEX quiz_participants_leaderboard
  ON quiz_participants(session_id, total_points DESC);

-- Team-Modus: pro Session jeder Teamname nur einmal
CREATE UNIQUE INDEX quiz_participants_unique_team
  ON quiz_participants(session_id, team_name)
  WHERE team_name IS NOT NULL;

-- Antworten-Tabelle
CREATE TABLE quiz_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  student_code_id UUID NOT NULL REFERENCES student_codes(id) ON DELETE CASCADE,
  question_index  INT NOT NULL,
  block_id        TEXT NOT NULL,
  answer          JSONB,
  is_correct      BOOLEAN NOT NULL,
  elapsed_ms      INT NOT NULL,
  points_awarded  INT NOT NULL,
  suspicious      BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, student_code_id, question_index)
);

CREATE INDEX quiz_answers_session_q
  ON quiz_answers(session_id, question_index);

-- RLS
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY quiz_sessions_select_own_class
  ON quiz_sessions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY quiz_participants_select_own_class
  ON quiz_participants FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions qs JOIN classes c ON c.id = qs.class_id
      WHERE qs.id = session_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY quiz_answers_select_own_class
  ON quiz_answers FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions qs JOIN classes c ON c.id = qs.class_id
      WHERE qs.id = session_id AND c.teacher_id = auth.uid()
    )
  );

-- Schreibpfad: Service-Role (Schüler:innen haben kein auth.uid())
```

## 11. Offene Detail-Entscheidungen

| #   | Frage                                   | Empfehlung                                                                 |
| --- | --------------------------------------- | -------------------------------------------------------------------------- |
| 1   | Hausaufgabe ↔ `class_modules`-Zuweisung | Setup-Modal mit „Modul zuweisen"-Checkbox (Default an), atomar             |
| 2   | Solo-Punkte persistieren?               | **Nein** — Solo ist Übung, kein Wettbewerb                                 |
| 3   | Team-Captain-Wechsel                    | MVP nicht supported. „Captain übergeben" als Mini-Phase später             |
| 4   | 1-Personen-Team erlauben?               | Kein Hard-Check, Soft-Hint im Lobby                                        |
| 5   | Solo ↔ Live Konflikt                    | Parallel erlauben                                                          |
| 6   | Hausaufgabe ohne Frist?                 | Pflicht halten                                                             |
| 7   | Frist-Ablauf: Lazy vs Cron              | Lazy-Check + täglicher Lehrer-Dashboard-Sweep                              |
| 8   | Reveal mit Teamnamen-Chips?             | Ja — macht sozialer                                                        |
| 9   | `match`-Block-Behandlung                | Filtern + Warn-Banner                                                      |
| 10  | Heartbeat-Cleanup                       | Karenz auf **120s** erhöhen, Beamer pingt alle 30s aktiv                   |
| 11  | Punkte-Formel-Konstanten                | `scoring_time_limit_s` konfigurierbar (Default 30), Streak-Tiers hardcoded |
| 12  | `revealQuestion` Trigger                | Beamer triggert beim Erreichen „N/N geantwortet" (Latenz ≤1s)              |

## 12. Implementierungs-Reihenfolge

**Sprint R (Solo-Quiz-Polish, keine Migration):**

- R1.2 Punkte-Formel (`lib/blocks/points.ts` + Tests) — pure Helper
- R1.5 Tippfehlertoleranz (`lib/blocks/evaluate.ts`)
- R1.3 ModuleRunner: Zeit + Streak messen
- R1.1 Quiz-Endseite mit Score-Hero
- R1.4 Wrong-Only-Retry
- R1.6 Gate + Commit + Smoke

**Phase S (Live-Klassen-Quiz, 1 Migration):**

- S0 Migration 0020 (STOP-Punkt)
- S1 Beamer-Lobby + Beitritt
- S2 Live-Frage-Flow (Kern)
- S3 Leaderboard
- S4 Quiz-Ende
- S5 Hausaufgaben-Modus
- S6 Lehrer-Auswertung + Item-Analyse
