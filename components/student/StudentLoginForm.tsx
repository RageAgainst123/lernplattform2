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
    <div className="flex flex-col gap-2 text-lg">
      <label htmlFor="student-pin">Deine PIN</label>
      <Input
        id="student-pin"
        name="pin"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        required
        placeholder="••••"
        className="h-12 text-center text-2xl tracking-[0.5em]"
      />
    </div>
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
      <div className="flex flex-col gap-2 text-lg">
        <label htmlFor="student-codename">Dein Name</label>
        <select
          id="student-codename"
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
      </div>
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
