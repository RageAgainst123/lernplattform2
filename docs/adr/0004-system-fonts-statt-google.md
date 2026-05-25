# ADR-0004: System-Fonts statt next/font/google

**Status:** accepted
**Datum:** 2026-05-25

## Kontext

Das create-next-app-Scaffold (und auch `shadcn init`) verdrahtet `next/font/google`
(Geist). Das lädt die Schrift zwar self-hosted aus, benötigt aber beim Build/Dev
einen Netzwerk-Abruf zu `fonts.gstatic.com`. In restriktiven/offline Umgebungen
(Schulnetz) schlägt das fehl und bricht den Dev-Server.

## Entschieden

Ein **System-Font-Stack** (`system-ui, -apple-system, 'Segoe UI', …`) in
`app/globals.css` (`--font-sans`), `layout.tsx` ohne Font-Import.

## Verworfen

- **next/font/google (Geist)** — externer Build-Abruf, fragil ohne Netz, und
  unnötige externe Abhängigkeit für eine offline-fähige, DSGVO-orientierte Plattform.
- **next/font/local mit .woff2** — möglich, aber kein Font-Branding nötig; späteres
  Nachrüsten bleibt offen.

## Konsequenzen

- Kein Netz-Abruf beim Build, robust in Schulnetzen, passt zu Offline-/DSGVO-Prinzip.
- `shadcn init` schreibt den Google-Font erneut in `layout.tsx` („Updating fonts")
  → danach wieder auf System-Font zurücksetzen.
- Kein eigenes Schrift-Branding (bewusst akzeptiert).
