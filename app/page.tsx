import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lernplattform für Digitale Grundbildung</CardTitle>
          <CardDescription>
            Interaktive Module und Materialbibliothek für die österreichische Sekundarstufe I.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Das Projekt-Gerüst und die UI-Basis stehen. Die Plattform wird Schritt für Schritt
          aufgebaut.
        </CardContent>
        <CardFooter>
          <Link href="/login" className={buttonVariants()}>
            Als Lehrkraft anmelden
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
