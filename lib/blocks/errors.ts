// Fehlertypen rund um die Modul-/Block-Auswertung. Eigene Datei (KEIN
// 'use server'), damit der Fehler-Typ von Server-Actions exportiert/geworfen
// werden darf — 'use server'-Module dürfen nur async Functions exportieren,
// also keine Klassen.

// Wird geworfen, wenn der Modul-Inhalt nicht (mehr) zum Schema passt — z. B.
// weil das Modul-JSON in der DB korrupt ist oder die Block-Struktur geändert
// wurde, während eine Schüler:in daran arbeitet. WICHTIG: nicht still 0
// zurückgeben, sonst würde eine echte Abgabe als „0 Punkte abgegeben" verewigt
// (Datenverlust). Stattdessen werfen → der Speichervorgang bricht ab, der
// Client zeigt den Fehler, die Schüler:in behält ihren Stand.
export class ModuleContentError extends Error {
  constructor() {
    super('Modulinhalt ist fehlerhaft oder inkompatibel. Bitte später erneut versuchen.');
    this.name = 'ModuleContentError';
  }
}
