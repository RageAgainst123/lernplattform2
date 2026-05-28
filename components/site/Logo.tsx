import Link from 'next/link';
import { BRAND } from '@/lib/brand';

// Plattform-Logo: stilisiertes offenes Buch mit drei Pixel-Punkten oben
// links — symbolisiert „Buch (Lernen) + Digital (Pixel)". `currentColor`
// als Fill, damit das Symbol die Textfarbe annimmt (Header: dunkel auf weiß;
// Footer-klein: dunkel auf hellem Grau; Favicon: weiß auf Primary-Blau).

type Props = {
  // Nur das Icon ohne Wortmarke rendern (z.B. für Favicon-Generator).
  iconOnly?: boolean;
  // Wenn true, KEIN umschließender Link — z.B. wenn Logo schon in einem Link liegt.
  asLink?: boolean;
  // CSS-Größen-Klasse für das Icon. Default: size-7 (28px).
  iconClassName?: string;
  // CSS-Klasse für den Wortmarken-Text.
  textClassName?: string;
};

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Drei Pixel-Punkte oben links (Digital-Signal) */}
      <rect x="2" y="2" width="2" height="2" rx="0.4" fill="currentColor" />
      <rect x="5.5" y="2" width="2" height="2" rx="0.4" fill="currentColor" />
      <rect x="2" y="5.5" width="2" height="2" rx="0.4" fill="currentColor" />
      {/* Offenes Buch unten */}
      <path d="M3 10c2.5-1 5-1 8 0v10c-3-1-5.5-1-8 0V10Z" fill="currentColor" opacity="0.85" />
      <path d="M21 10c-2.5-1-5-1-8 0v10c3-1 5.5-1 8 0V10Z" fill="currentColor" />
      {/* Mittelfalz */}
      <line x1="11" y1="10.5" x2="11" y2="20" stroke="white" strokeWidth="0.6" />
      <line x1="13" y1="10.5" x2="13" y2="20" stroke="white" strokeWidth="0.6" />
    </svg>
  );
}

export function Logo({
  iconOnly = false,
  asLink = true,
  iconClassName = 'size-7',
  textClassName = 'text-base font-semibold tracking-tight',
}: Props) {
  const content = (
    <span className="text-foreground inline-flex items-center gap-2">
      <LogoIcon className={iconClassName} />
      {!iconOnly && <span className={textClassName}>{BRAND.name}</span>}
    </span>
  );
  if (!asLink) return content;
  return (
    <Link href="/" aria-label={`${BRAND.name} — Startseite`} className="inline-flex">
      {content}
    </Link>
  );
}
