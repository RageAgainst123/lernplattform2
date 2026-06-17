// Pure Drag-Helfer für den Hotspot-Editor (Rechteck-Aufziehen). Ausgelagert aus
// hotspot-editor.tsx, damit die Komponenten-Datei unter der Zeilen-Grenze bleibt.

export const DEFAULT_R = 0.08;
export const DEFAULT_RECT = { width: 0.2, height: 0.12 };
// Kleiner als das wird als „nur geklickt" (kein echtes Aufziehen) gewertet.
export const MIN_DRAG = 0.03;

// Relative Klickposition (0–1) im Bild-Container, auf 3 Nachkommastellen.
export function relPos(e: { clientX: number; clientY: number }, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
  return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
}

// Live-Vorschau eines Rechtecks während des Aufziehens.
export type DragState = { x0: number; y0: number; x1: number; y1: number };

// Mittelpunkt + Breite/Höhe (jeweils 0–1) aus den beiden Drag-Eckpunkten.
export function dragRect(d: DragState) {
  return {
    x: (d.x0 + d.x1) / 2,
    y: (d.y0 + d.y1) / 2,
    width: Math.abs(d.x1 - d.x0),
    height: Math.abs(d.y1 - d.y0),
  };
}
