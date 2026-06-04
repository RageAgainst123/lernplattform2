# ADR-0016: Hybrid-Realtime-Broadcast für Quiz und Live-Präsentation

**Status:** proposed
**Datum:** 2026-06-04
**Supersedes (teilweise):** [ADR-0013](0013-live-praesentation-polling.md)

## Kontext

Die App nutzt seit ADR-0013 (Mai 2026) HTTP-Polling für Live-Sync der
Schüler:innen-Geräte. Inzwischen sind dazugekommen:

- **Sprint S (Live-Quiz, S1–S4):** Kahoot-Style-Quizmodus mit 1-Sek-Polling für
  drei Endpoints (`/api/quiz/question`, `/api/quiz/beamer`, `/api/quiz/lobby`).
  Bei 25 Schüler:innen × 5 Min Quiz = ~7.500 HTTP-Anfragen pro Klasse pro Quiz.
- **Latenz-Beschwerde im Test:** Lehrer:in klickt „Auflösen", Schüler:innen
  sehen das nach 0,5–2,5 Sek. Kahoot liefert <200 ms. Im Klassenzimmer
  spürbar zäh.
- **Geos Vision:** SEO-Launch ab September 2026 mit Aussicht auf 50–500+
  Schulen. Polling-Pattern skaliert kostenmäßig schlecht: 500 Schulen × 3
  Quizzes/Tag = ~11 Mio Anfragen/Tag → sprengt Vercel-Hobby + Free-Supabase.

**Was sich seit ADR-0013 geändert hat:**

1. **Supabase Realtime hat einen Broadcast-Modus (kein RLS nötig).** ADR-0013
   verwarf Realtime, weil Schüler:innen kein `auth.uid()` haben und Postgres-
   Changes/Presence RLS erfordern. **Broadcast** dagegen ist ein einfaches
   Push-System auf benannte Channels — RLS ist optional, nicht zwingend.
2. **Empirische Erfahrung:** Polling funktioniert robust, aber „immer schon
   1–2 Sek hinterher" frustriert Geo's eigene Test-Sessions.
3. **Polling-Last in Zahlen:** Aktuell 30 Req/s pro 25-Schüler-Klasse während
   eines Quiz. Vercel-Hobby (100k Function-Calls/Tag) ist bei 10 parallelen
   Klassen für ~1 Stunde am Limit.

**Drei realistische Architektur-Optionen ausgewertet:**

| Option                      | Latenz    | Kosten 500 Schulen     | Komplexität | Risiko                            |
| --------------------------- | --------- | ---------------------- | ----------- | --------------------------------- |
| Heute (Polling)             | 0,5–2,5 s | Vercel Pro ~$80–200/Mo | niedrig     | bewährt                           |
| WebRTC P2P                  | <100 ms   | $0/Mo                  | hoch        | AP-Isolation in Schul-WLAN        |
| **Hybrid Realtime+Polling** | <300 ms   | $25/Mo (Supabase Pro)  | mittel      | bewährt                           |
| Komplett-Realtime           | <300 ms   | $25/Mo                 | hoch        | kein Polling-Fallback bei Ausfall |
| Eigener WS-Server (Hetzner) | <300 ms   | €5–10/Mo + Wartung     | sehr hoch   | DSGVO, Server-Betreuung           |

## Entschieden

**Hybrid-Modell: Supabase Realtime Broadcast als Push-Layer, Polling bleibt
als Sicherheitsnetz.** Realtime triggert **nur** einen sofortigen Refetch
über den bestehenden Polling-Endpoint; die authoritative Quelle bleibt
Postgres. Fällt Realtime aus, übernimmt der Polling-Tick (5 s statt 1 s
heute) — Latenz steigt im Fallback-Fall, App läuft weiter.

### Architektur-Konkretisierung

- **Channel-Namens-Schema** (Public, keine RLS):
  - `quiz_session:{sessionId}` — Events: `question_started`, `answer_received`,
    `question_revealed`, `next_question`, `quiz_ended`, `participant_joined`
  - `live_session:{classId}` — Events: `block_changed`, `block_revealed`,
    `block_locked`, `presentation_ended`
  - `class_progress:{classId}` — Events: `module_submitted`, `worksheet_returned`,
    `heft_entry_saved`
- **Auth: Public Channels mit UUID-Namen.** Schüler:innen-Client erhält den
  Channel-Namen vom Server beim Mount der Page (Server-Component liest die
  UUID aus jose-Session-classId oder URL-sessionId). Channel-Name = 128-Bit
  UUID = nicht ratbar. Broadcast-Payload enthält **keine** sensiblen Daten
  (kein `correct`-Flag, keine fremden Punkte).
- **Server publisht via Service-Role-Client.** Jede Mutation in
  `quiz-session-actions.ts`, `quiz-answer-actions.ts`, `live-session-actions.ts`
  triggert nach erfolgreichem DB-Write einen Fire-and-Forget-Broadcast.
  Fehler im Broadcast lassen die Action nicht failen.
- **Client subscribed via Anon-Key-Client.** Pro Page genau eine Subscription.
  Hook `useRealtimeWithFallback` kapselt das + Polling.
- **Polling-Fallback bleibt zwingend aktiv** — Tick auf 5 s erhöht (statt 1 s
  heute), weil Realtime den schnellen Pfad liefert. Bei Verlust der WebSocket-
  Verbindung springt der 5-s-Tick automatisch ein.
- **Hot-Path-Auswahl** (nur diese werden migriert):
  - Quiz-Frage-Flow (Schüler + Beamer)
  - Quiz-Lobby für Lehrer:in (Teilnehmer:innen-Liste live)
  - Live-Präsentation Folien-Wechsel + Reveal/Lock
  - Lehrer:innen-Klassen-Fortschrittsmatrix Auto-Refresh
- **Nicht migriert:** Lobby für Schüler:innen-Banner (5 s reicht), Schüler-
  Leaderboard zwischen Fragen (3 s reicht), Heartbeat (20 s), Heft-Auto-Save
  (Debounce), Status-Page, Schüler-Dashboard, Lernpfad.

### Authentifizierungs-Pattern

Da Schüler:innen weiterhin jose-JWT (kein `auth.uid()`) nutzen:

- Subscribe auf Public-Channel-Namen geht **ohne** Supabase-Auth — supabase-js
  erlaubt das mit dem öffentlichen Anon-Key.
- Channel-Namen werden **nicht** vom Client geraten, sondern vom Server in
  der Initial-Server-Component-Render-Phase übergeben (über Props).
- Schreib-Pfade (Antwort abgeben, Quiz starten etc.) laufen **weiterhin**
  über Server-Actions mit jose-Auth — Realtime ist nur Lese-/Benachrichtigungs-
  Layer, keine Schreibe.

### Skalierungs-Kosten

Bei Supabase-Free-Tier:

- **200 gleichzeitige Realtime-Verbindungen** = ~8 parallel laufende
  25-Schüler-Quizzes — reicht für 1–10 Schulen
- **2 Mio Realtime-Messages/Monat** = ~6.500 Quiz-Stunden/Monat — realistisch
  unbegrenzt für 1–20 Schulen

Bei Supabase-Pro ($25/Monat):

- **500 gleichzeitige Connections** = ~20 parallele Quizzes
- **5 Mio Messages/Monat** = ~16.000 Quiz-Stunden/Monat
- Connection-Overage $10 pro 1.000 zusätzliche

Geschätzte Übergänge:

- 0–10 Schulen: Free-Tier reicht
- 10–50 Schulen: Pro $25
- 50–200 Schulen: Pro + ~$10 Connection-Overage
- 200–500 Schulen: ~$50–80/Monat (Hauptkostentreiber: DB-Storage + Bandbreite,
  nicht Realtime)

## Verworfen

- **Komplett-Realtime ohne Polling-Fallback.** Risiko bei Realtime-Service-
  Downtime: App komplett tot. Resilienz > Eleganz. Polling-Fallback bleibt zwingend.
- **WebRTC P2P.** AP-Isolation in Schul-WLANs blockt P2P zwischen Schüler:innen-
  Geräten. TURN-Server (Fallback) kosten Geld + Wartung. Lehrer-Browser-Tab-Crash
  würde laufendes Quiz killen. Nicht für Klassenzimmer geeignet.
- **Eigener WebSocket-Server auf Hetzner.** Aktuell zu früh. Bei realer
  Skalierung über Supabase-Pro-Decke (Stufe 4 in `docs/SCALE-PLAN.md`) wieder
  prüfen.
- **Custom-JWT-Auth für Realtime (Variante B aus T0-Diskussion).** Token-
  Refresh-Komplexität nicht gerechtfertigt. Public Channels mit UUID-Namen
  sind ausreichend sicher (keine sensiblen Daten im Broadcast).
- **Postgres-Changes-Subscription (Supabase Realtime „Changes").** Würde RLS
  auf den Backing-Tabellen brauchen → Schüler:innen-Auth-Problem zurück.
  Broadcast ist authfrei und genau das was wir brauchen.
- **Presence-API.** Verlockend für Teilnehmer:innen-Listen, aber schwieriger zu
  debuggen + zusätzlicher Komplexitäts-Layer. Reicht: bei jedem Beitritt sendet
  Server ein `participant_joined`-Broadcast-Event, Client refetcht DB-Liste.

## Konsequenzen

### Positiv

- **Latenz im Hot-Path 0,5–2,5 s → <300 ms.** Klassenzimmer-Tempo wie
  Kahoot/Mentimeter.
- **Vercel-Function-Last −70 % im Hot-Path.** Polling-Intervall steigt von
  1 s auf 5 s (Fallback), Mehrheit der Updates kommt über WebSocket.
- **Kosten skalieren linear statt quadratisch.** Realtime ist pro-Connection,
  nicht pro-Request. 500 Schulen kosten ~$50/Monat statt $200+.
- **Lehrer-Live-Experience.** Fortschritts-Matrix aktualisiert sich automatisch,
  Lobby-Beitritt erscheint sofort.
- **Polling-Code bleibt unverändert.** Bestehende Endpoints, Hooks, Auto-Advance-
  Logik — alles weiter aktiv. Geringes Risiko.

### Negativ

- **Mehr Komplexität.** Zwei Sync-Mechanismen statt einer. Client-Hook muss
  beide Pfade handhaben.
- **WebSocket-Connection pro Schüler-Tab.** Bei mobiler Tab-Suspend bricht
  die Connection — Library reconnected automatisch, aber Edge-Case.
- **Channel-Namens-Leak möglich (DevTools).** Schüler:in könnte mitlesen.
  Mitigation: kein sensibles Payload, Schreib-Pfade bleiben auth-protected.
- **Realtime-Service-Downtime betrifft Hot-Path.** Mitigation: 5-s-Polling-
  Fallback bleibt aktiv, App läuft langsamer aber weiter.
- **Supabase-Pro ($25) wird wahrscheinlicher früher nötig.** Free-Tier reicht
  für ~8 parallele Quizzes, nicht für 50 Schulen.

### Folge-Entscheidungen

- ADR-0013 wird teilweise superseded (Begründung gegen Realtime gilt nicht mehr
  für Broadcast-Modus). Polling-Pattern bleibt aber **erhalten** als Fallback.
- Neue Plan-Datei `docs/PHASE-T-PLAN.md` definiert die Sub-Phasen T0–T8.
- Neue Tests-Suite für `lib/realtime/*.test.ts` und Hook-Tests.
- Soft-Limit aus C4 (`QUIZ_DAILY_LIMIT_PER_CLASS`) wird wichtiger: schützt
  gegen virales Sprengen des 200-Connection-Free-Tier-Limits.
- `docs/SCALE-PLAN.md`: Phase T = Stufe-1-Upgrade, wenn Vercel/Supabase-Free-
  Limits gerissen werden.

## Verifikation

Nach Phase T komplett:

- Browser-Smoke: 2-Tab-Test, Lehrer-Klick → Schüler-Update <300 ms
- WLAN-Abriss-Test: Realtime-Connection bricht, 5-s-Polling übernimmt
- k6-Lasttest: 200 simulierte Schüler:innen × 10 Quizzes, p95 <300 ms
- Supabase-Dashboard: Realtime-Messages-Counter <500 pro Quiz-Stunde
- Gate-Lauf: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check` grün

Bei Erfolgs-Kriterien-Miss: Rollback per `git reset --hard pre-phase-t-savepoint`.
