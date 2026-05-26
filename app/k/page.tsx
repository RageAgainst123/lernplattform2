import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { normalizeJoinCode } from '@/lib/db/join-code';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const metadata: Metadata = {
  title: 'Klassencode eingeben',
};

async function goToClass(formData: FormData) {
  'use server';
  const code = normalizeJoinCode(String(formData.get('code') ?? ''));
  if (code) {
    redirect(`/k/${code}`);
  }
}

export default function JoinCodePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Klassencode</CardTitle>
          <CardDescription className="text-base">
            Gib den Code ein, den du von deiner Lehrkraft bekommen hast.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={goToClass} className="flex flex-col gap-4">
            <Input
              name="code"
              required
              autoCapitalize="characters"
              placeholder="z. B. K7M2X9"
              className="h-12 text-center text-xl tracking-widest uppercase"
            />
            <Button type="submit" className="h-12 w-full text-lg">
              Weiter
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
