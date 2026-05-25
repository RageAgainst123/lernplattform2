'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Meldet die Lehrer:in ab und leitet zur Login-Seite.
// revalidatePath vor dem Redirect, damit kein gecachter eingeloggter Zustand bleibt.
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
