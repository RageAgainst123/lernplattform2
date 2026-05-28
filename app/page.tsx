import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-8 px-6 py-20 text-center sm:py-28">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">Digitale Grundbildung</h1>
        <p className="text-muted-foreground text-lg">
          Materialien und interaktive Module für die österreichische Sekundarstufe I — frei
          zugänglich, nach Schulstufe und Kompetenzbereich geordnet.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/dgb" className={cn(buttonVariants({ size: 'lg' }), 'text-base')}>
          Materialien &amp; Module entdecken
        </Link>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'text-base')}
        >
          Als Lehrkraft anmelden
        </Link>
      </div>
    </div>
  );
}
