import { redirect } from 'next/navigation';

// Aktivitäts-Route „Arbeitsblätter" (Phase E). Lebt heute technisch noch unter
// /admin/material — wir leiten um, statt zu duplizieren. Sobald der Material-
// Workflow ebenfalls umbenannt wird (zukünftige Phase), können diese Wrapper
// die echten Pages werden.

export default function ArbeitsblaetterListPage() {
  redirect('/admin/material');
}
