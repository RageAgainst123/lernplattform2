'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

const loginSchema = z.object({
  email: z.email('Bitte eine gültige E-Mail-Adresse eingeben.'),
});

type LoginValues = z.infer<typeof loginSchema>;

// Fordert den Magic Link an. true bei Erfolg, false bei Fehler.
async function requestMagicLink(email: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
  });
  return !error;
}

function LinkSentMessage() {
  return (
    <p className="text-muted-foreground text-sm" role="status">
      Wir haben Ihnen einen Anmelde-Link geschickt. Bitte prüfen Sie Ihr E-Mail-Postfach (eventuell
      auch den Spam-Ordner) und klicken Sie auf den Link.
    </p>
  );
}

export function LoginForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit({ email }: LoginValues) {
    setServerError(null);
    if (await requestMagicLink(email)) {
      setSent(true);
    } else {
      setServerError('Der Link konnte nicht gesendet werden. Bitte später erneut versuchen.');
    }
  }

  if (sent) {
    return <LinkSentMessage />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field>
        <FieldLabel htmlFor="email">E-Mail-Adresse</FieldLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@schule.at"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && <FieldError>{errors.email.message}</FieldError>}
      </Field>
      {serverError && (
        <p className="text-destructive text-sm" role="alert">
          {serverError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Wird gesendet …' : 'Anmelde-Link anfordern'}
      </Button>
    </form>
  );
}
