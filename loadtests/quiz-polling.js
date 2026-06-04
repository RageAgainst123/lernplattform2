// k6 Lasttest: Quiz-Polling-Endpoint (Pre-Launch-C8, COST-CONTROLS.md).
//
// Simuliert eine virale Schüler:innen-Last auf den Polling-Hot-Path —
// 200 gleichzeitig pollende Schüler:innen-Geräte über 60 Sekunden. Misst:
//   • p50/p95/p99 Response-Zeit
//   • Fehler-Rate
//   • Throughput
//
// Lokale Ausführung (lokal aus preview):
//   1. App lokal starten: pnpm build && pnpm start (oder preview-server)
//   2. RATE_LIMIT_DISABLED=true setzen damit k6 nicht selbst rate-limited
//      wird (alle 200 VUs kommen sonst von 127.0.0.1 = derselben IP)
//   3. k6 installieren: https://k6.io/docs/get-started/installation/
//      Windows (Chocolatey): choco install k6
//      macOS:                brew install k6
//   4. Ausführen:
//      k6 run loadtests/quiz-polling.js -e BASE_URL=http://localhost:3000
//
// Production-Test (mit echter Vercel-URL):
//   k6 run loadtests/quiz-polling.js -e BASE_URL=https://deine.app
//
// Erwartung (Schwellenwerte):
//   • p95 < 800 ms (gut), < 1500 ms (akzeptabel), > 1500 ms (Fix nötig)
//   • Fehler-Rate < 1% (gut), < 5% (akzeptabel)
//   • RPS sollte 200 erreichen (= 1 Poll/Sek/VU)
//
// Achtung: Polling-Endpoint braucht eine eingeloggte jose-Schüler:in-
// Session. Für realistischen Test: vorher einen Schüler einloggen, dann
// das Browser-Cookie auslesen + als COOKIE-Env-Var setzen. Sonst gibt
// jede Anfrage nur den 'none'-Branch zurück (= weniger DB-Last als real).

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const COOKIE = __ENV.COOKIE || ''; // 'student_session=xxx; ...'
const ENDPOINT = __ENV.ENDPOINT || '/api/quiz/question';

export const options = {
  // 200 Schüler:innen pollen 60 Sek lang, 10s Ramp-Up + Ramp-Down.
  stages: [
    { duration: '10s', target: 50 }, // ramp-up
    { duration: '60s', target: 200 }, // sustained
    { duration: '10s', target: 0 }, // ramp-down
  ],
  thresholds: {
    // App ist gesund wenn diese Werte gehalten werden.
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    http_req_failed: ['rate<0.05'], // <5% Fehler-Rate
  },
};

export default function () {
  const headers = COOKIE ? { Cookie: COOKIE } : {};
  const res = http.get(`${BASE_URL}${ENDPOINT}`, { headers });
  check(res, {
    'status 200': (r) => r.status === 200,
    'response < 2s': (r) => r.timings.duration < 2000,
  });
  // Realistischer Polling-Takt: 1s aktiv, wie der Schüler:innen-Hook.
  sleep(1);
}
