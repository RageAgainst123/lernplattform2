import { redirect } from 'next/navigation';

// Phase E: alte „Neues Modul"-Route umgeleitet auf Lernmodul-Erstellung.
// Wer eine Präsentation anlegen will, sieht „+ Neue Präsentation" im
// Admin-Dashboard oder unter /admin/praesentationen.

export default function NewModuleRedirect() {
  redirect('/admin/lernmodule/neu');
}
