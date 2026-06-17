# ADR-0013: Live-Präsentation via Polling (kein Realtime)

**Status:** accepted (teilweise superseded durch [ADR-0016](0016-hybrid-realtime-fuer-quiz-und-praesentation.md) seit 2026-06-04 für Hot-Path-Push; Polling-Fallback bleibt zwingend aktiv)
**Datum:** 2026-05-30
**Hinweis:** Seit Phase T (ADR-0016) läuft der Hot-Path (Folie wechseln, Reveal, Lock) über Supabase Realtime Broadcast — das in diesem ADR verworfene Realtime hat Geo dann mit der **Broadcast-Variante ohne RLS-Pflicht** doch eingebaut. Das Polling aus diesem ADR bleibt als **Sicherheitsnetz** aktiv (5s-Fallback-Tick) — die Architektur ist jetzt hybrid, nicht ersetzt.

## Kontext

Die geführte Präsentation soll live werden: startet die Lehrer:in eine
Präsentation, sollen Schüler:innen-Geräte sich **verdunkeln** („Schau nach
vorne") und bei **Live-Poll-Folien** eine Abstimmung zeigen, deren Ergebnis am
Beamer wächst. Geräte müssen den Zustand der Lehrer:in-Folie kennen — also braucht
es eine Server↔Browser-Synchronisation.

Schüler:innen haben in diesem Projekt bewusst **kein `auth.uid()`** (Code+PIN →
jose-Cookie, alle DB-Zugriffe serverseitig über den Service-Role-Client; ADR-0001,
ROLES.md §3.3). Supabase Realtime/RLS verlangt aber authentifizierte
Browser-Verbindungen.

## Entschieden

**HTTP-Polling statt Realtime.** Das Schüler:innen-Gerät pollt `GET /api/live`
alle ~2,5 s; der Handler liest die jose-Session (classId) und liefert über den
Service-Role-Client den Zustand der aktiven Session.

- **Eine aktive Session pro Klasse** (`live_sessions`, partieller Unique-Index
  `WHERE status='active'`). Das Gerät leitet „seine" Session aus `session.classId`
  ab → keine geheime sessionId, kein IDOR.
- **Kein Phasen-Umbau:** `live_poll` ist ein additiver Block-Typ im flachen
  `blocks[]`-Array (wie `slide`), nicht auto-bewertet.
- **Stimmen** in eigener Tabelle `live_votes` (`unique(session_id, block_id,
student_code_id)`, Re-Vote per upsert) — nicht in `student_progress`.
- **Dimm-Overlay** im `/s`-Layout → greift auf allen Schüler:innen-Seiten; legt
  sich nur über die Seite (Modul-State bleibt erhalten), kein Wegklicken.

## Verworfen

- **Supabase Realtime (public channel):** Browser↔Supabase direkt; ohne
  auth.uid() müsste der Kanal öffentlich/ratbar sein — schwacher Sicherheits-Fit.
- **Supabase Anonymous Auth + RLS:** zweiter Auth-Pfad für Schüler:innen,
  widerspricht ROLES §5 (Single-Auth-Modell) — zu invasiv für 1–3 s Latenztoleranz.
- **SSE (Server-Sent Events):** langlebige Verbindungen vertragen sich schlecht
  mit Vercel-Function-Timeouts; Polling ist robuster und einfacher.

## Konsequenzen

- **Positiv:** identisches Muster wie der bestehende `saveProgress`-Pfad
  (Service-Role + jose), kein neuer Auth-Pfad, Vercel-freundlich (kurze Calls).
  Last unkritisch (~20 Geräte × 2,5 s ≈ 8 req/s/Klasse). `/api/live` ist aus dem
  proxy-matcher ausgenommen (kein Auth-Refresh pro Poll); Polling pausiert bei
  `document.hidden`.
- **Grenze (bewusst, dokumentiert):** Das Dimmen wirkt nur, solange die Seite
  beim Kind offen ist. Eine Website kann ein zugeklapptes/fremd-fokussiertes
  Gerät NICHT aufwecken — das kann kein Web-Tool. Mit der 1-Jahres-Session haben
  Kinder die Seite ohnehin offen.
- **Latenz:** 1–3 s statt <0,2 s bei Realtime — für Folien-Sync/Abstimmung
  irrelevant.

## Querverweise

- `app/api/live/route.ts`, `components/student/useLiveSync.ts`,
  `components/student/LiveOverlay.tsx`, `app/s/layout.tsx`
- `lib/db/live-sessions.ts`, `lib/db/live-session-actions.ts`,
  `lib/db/live-vote-actions.ts`, `lib/db/live-results-action.ts`
- `supabase/migrations/0009_live_sessions.sql`
- `docs/THEMA-WORKFLOW.md` §6
