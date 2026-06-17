// Globale Feature-Flags via Env-Vars (Pre-Launch-C3, COST-CONTROLS.md L1.6).
//
// Zweck: Notbremse für Geo. Wenn ein Feature explodiert (z.B. Quiz-Bug
// in Production, viraler Ansturm sprengt Vercel-Functions), kann Geo
// in 30 Sek per Vercel-Dashboard die Env-Var setzen und das Feature ist
// offline — ohne Deploy, ohne Code-Änderung.
//
// Werte: 'true' = deaktiviert. Alles andere (insb. nicht gesetzt) =
// aktiviert. Default-an verhindert dass eine fehlende Env-Var die App
// versehentlich offline nimmt.
//
// WICHTIG: in jeder Server-Action und API-Route die das Feature
// betrifft, am Anfang prüfen. UI-Buttons sollen ebenfalls die Flags
// lesen (per Server-Component oder per einer separaten Public-Env-Var
// falls Client-Side nötig).

function isDisabled(envVar: string | undefined): boolean {
  return envVar === 'true';
}

export const featureFlags = {
  isQuizEnabled: (): boolean => !isDisabled(process.env.QUIZ_DISABLED),
  isLiveEnabled: (): boolean => !isDisabled(process.env.LIVE_DISABLED),
  isStudentLoginEnabled: (): boolean => !isDisabled(process.env.STUDENT_LOGIN_DISABLED),
};

// Public-Variante für Client-Komponenten (Buttons ausgrauen vor Aktion).
// Next.js public env-vars müssen mit NEXT_PUBLIC_ präfixiert sein —
// wir spiegeln nur die drei oben.
export const publicFeatureFlags = {
  isQuizEnabled: (): boolean => !isDisabled(process.env.NEXT_PUBLIC_QUIZ_DISABLED),
  isLiveEnabled: (): boolean => !isDisabled(process.env.NEXT_PUBLIC_LIVE_DISABLED),
  isStudentLoginEnabled: (): boolean => !isDisabled(process.env.NEXT_PUBLIC_STUDENT_LOGIN_DISABLED),
};

// Standard-Nachrichten für Maintenance-Banner. Lehrer:innen sehen den
// vollen Hinweis, Schüler:innen die kindgerechte Variante.
export const maintenanceMessages = {
  quiz: {
    teacher: 'Live-Quiz ist gerade in Wartung. Wir arbeiten daran.',
    student: 'Quiz ist gerade nicht verfügbar. Probiere es später nochmal.',
  },
  live: {
    teacher: 'Live-Präsentation ist gerade in Wartung. Wir arbeiten daran.',
    student: 'Live-Modus ist gerade nicht verfügbar.',
  },
  studentLogin: {
    teacher: 'Schüler:innen-Login ist gerade in Wartung.',
    student: 'Anmelden klappt gerade nicht. Probiere es später nochmal.',
  },
} as const;
