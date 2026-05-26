'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { studentLogin, type StudentLoginState } from '@/lib/db/student-login-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: StudentLoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-12 w-full text-lg">
      {pending ? 'Anmelden …' : 'Anmelden'}
    </Button>
  );
}

function PinField() {
  return (
    <label className="flex flex-col gap-2 text-lg">
      Deine PIN
      <Input
        name="pin"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        required
        placeholder="••••"
        className="h-12 text-center text-2xl tracking-[0.5em]"
      />
    </label>
  );
}

export function StudentLoginForm({
  joinCode,
  codenames,
}: {
  joinCode: string;
  codenames: string[];
}) {
  const [state, formAction] = useActionState(studentLogin, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="joinCode" value={joinCode} />
      <label className="flex flex-col gap-2 text-lg">
        Dein Name
        <select
          name="codename"
          required
          defaultValue=""
          className="border-input bg-background h-12 rounded-md border px-3 text-lg"
        >
          <option value="" disabled>
            Wähle deinen Namen
          </option>
          {codenames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <PinField />
      {state.error && (
        <p className="text-destructive text-base" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
