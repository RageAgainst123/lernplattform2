import type { Metadata } from 'next';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoginForm } from '@/components/teacher/LoginForm';

export const metadata: Metadata = {
  title: 'Anmelden — Lernplattform',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Anmeldung für Lehrkräfte</CardTitle>
          <CardDescription>
            Geben Sie Ihre E-Mail-Adresse ein. Sie erhalten einen Anmelde-Link — ohne Passwort.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
