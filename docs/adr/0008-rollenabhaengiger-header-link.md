# ADR-0008: Rollenabhängiger Header-Nav-Link

**Status:** accepted
**Datum:** 2026-05-29

## Kontext

Beim ersten Smoke-Test mit dem Header aus Phase 10 zeigte sich ein
Verwirrungs-Bug: die statische Navigation enthielt einen festen Link
„Schüler:innen-Login" → `/k`, der auch für **eingeloggte Schüler:innen**
sichtbar war. Geo testete als 5A-01, sah den Link und vermutete, ausgeloggt
zu sein.

Das ist ein konzeptionelles Problem: der Link ist Werbung für die Login-
Seite — aber wer schon eingeloggt ist, braucht keine Login-Werbung, sondern
einen Weg zurück in seinen eigenen Bereich. Analog für Lehrer:innen:
„Lehrer:innen-Login" ist für eingeloggte Lehrer:innen redundant.

## Entschieden

Eine **`roleNavLink(info: AuthSlotInfo)`**-Funktion in `SiteHeader.tsx`
liefert je nach Auth-Zustand einen einzigen kontextabhängigen Nav-Link:

| Rolle              | Nav-Link                     |
| ------------------ | ---------------------------- |
| Schüler:in         | „Mein Bereich" → `/s`        |
| Lehrer:in (+Admin) | „Mein Dashboard" → `/lehrer` |
| Ausgeloggt         | „Schüler:innen-Login" → `/k` |

Der bestehende **„Materialien"-Link** (`/dgb`) bleibt für alle Rollen
sichtbar — als Klammer, die nie verschwindet.

Der rechte Header-Slot (`HeaderAuthDesktop`) zeigt parallel:

- Bei eingeloggten Nutzer:innen: „Angemeldet als …" + Abmelden-Form
  (+ optional „Admin"-Link für Admins).
- Bei Ausgeloggten: einen Button „Lehrer:innen-Login" → `/login`.

Auth-Info kommt aus `fetchAuthSlot()` (Server, paralleler `getUser` +
`getStudentSession`, ein Roundtrip). Dieselbe Info geht auch an das
`MobileMenu` für die mobile Variante.

## Verworfen

- **Zwei Links statt eines** („Schüler:innen-Login" UND „Mein Bereich")
  für eingeloggte Schüler:innen — Header wird voller, der erste Link
  bleibt verwirrend.
- **Link ganz weglassen wenn eingeloggt** (nur „Materialien" + Auth-Slot
  rechts) — weniger entdeckbar; Schüler:innen sollten ihren eigenen
  Bereich leicht finden, auch wenn sie woanders gelandet sind.
- **„Schüler:innen-Login" immer zeigen, ausgegraut wenn eingeloggt** —
  visueller Lärm, hilft niemandem.
- **Client-side Dropdown** mit „Mein Bereich / Mein Profil / …" — zu
  schwer für die aktuelle Funktionalität (es gibt kein Profil); kann
  später kommen wenn echte Optionen entstehen.

## Konsequenzen

- `SiteHeader.tsx` muss **async Server-Component** sein (war es schon seit
  Phase 13 für `fetchAuthSlot`). Tests müssen sie als
  `const ui = await SiteHeader(); render(ui);` aufrufen.
- `MobileMenu` (Client) bekommt die Auth-Info als Props
  durchgereicht — keine zweite Datenabfrage.
- **Kein zusätzlicher DB-Roundtrip:** `fetchAuthSlot()` läuft ohnehin
  einmal pro Request (für den rechten Slot), `roleNavLink` nutzt dasselbe
  Info-Objekt synchron.
- **Tests:** 5 für SiteHeader (anonym, Schüler:in, Lehrer:in,
  Admin-Lehrer:in, Mobile-Toggle). Der Auth-Slot wird via `vi.hoisted` +
  `vi.mock('./HeaderAuth')` ausgetauscht.
- **Doku-Folgekosten:** `docs/ROLES.md` bekommt eine eigene Sektion §3a
  „Header-Verhalten je Rolle".

## Querverweise

- [`components/site/SiteHeader.tsx`](../../components/site/SiteHeader.tsx)
- [`components/site/HeaderAuth.tsx`](../../components/site/HeaderAuth.tsx)
- [`components/site/MobileMenu.tsx`](../../components/site/MobileMenu.tsx)
- [`docs/ROLES.md`](../ROLES.md) §3a
