'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createClass, type CreateClassState } from '@/lib/db/class-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';

const initialState: CreateClassState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Wird angelegt …' : 'Klasse anlegen'}
    </Button>
  );
}

export function NewClassForm() {
  const [state, formAction] = useActionState(createClass, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="name">Name der Klasse</FieldLabel>
        <Input id="name" name="name" placeholder="z. B. 5A 2026/27" required />
      </Field>
      <Field>
        <FieldLabel htmlFor="schulstufe">Schulstufe (optional)</FieldLabel>
        <select
          id="schulstufe"
          name="schulstufe"
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          defaultValue=""
        >
          <option value="">— keine —</option>
          <option value="5">5. Schulstufe</option>
          <option value="6">6. Schulstufe</option>
          <option value="7">7. Schulstufe</option>
          <option value="8">8. Schulstufe</option>
        </select>
      </Field>
      {state.error && (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
