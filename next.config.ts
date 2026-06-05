import type { NextConfig } from 'next';

// Pre-Launch-Audit MED-8 (2026-06-04): Security-Header für alle Routen.
//
// X-Frame-Options DENY verhindert Clickjacking (Lehrer-Pages dürften nicht
// in fremde iframes geladen werden — Risiko: Lehrer:in klickt auf einem
// trojanischen iframe versehentlich „Klasse löschen", weil der echte Klick
// auf der Lernplattform passiert).
//
// X-Content-Type-Options nosniff verhindert MIME-Sniffing-XSS.
//
// Referrer-Policy strict-origin-when-cross-origin: Browser-Default seit
// Chrome 85, aber explizit setzen für ältere Browser + Klarheit.
//
// CSP bewusst NICHT als „Content-Security-Policy" (enforcing) sondern als
// "Content-Security-Policy-Report-Only" wäre möglich; wir lassen das
// vorerst weg, weil Next.js mit Inline-Styles für Tailwind, Supabase-
// Realtime-WebSocket (wss://) und Tiptap-Editor zickig ist. CSP wird in
// einer eigenen Phase mit Browser-Smoke nachgezogen.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permissions-Policy: deaktiviert sensitive Browser-Features die wir nicht
  // brauchen. Camera/Microphone/Geolocation/Payment kein Use-Case.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
];

const nextConfig: NextConfig = {
  // Workspace-Root explizit fixieren — sonst rät Next.js wegen einer
  // package-lock.json im User-Home die falsche Root (Turbopack-Warnung).
  turbopack: {
    root: import.meta.dirname,
  },
  async headers() {
    return [
      {
        // Globale Headers für alle Routen.
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
