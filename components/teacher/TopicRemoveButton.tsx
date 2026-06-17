'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { unassignTopicFromClass } from '@/lib/db/class-topic-actions';
import { Button } from '@/components/ui/button';

// Kleiner Client-Bereich in der ansonsten server-gerenderten TopicCard:
// nimmt das ganze Thema (= alle zugehörigen Modul-Zuweisungen) aus der
// Klasse. Fortschritts-Daten bleiben erhalten — Re-Assign zeigt alte Werte.

type Props = {
  classId: string;
  topicId: string;
  topicLabel: string;
};

export function TopicRemoveButton({ classId, topicId, topicLabel }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function handle() {
    const ok = window.confirm(
      `Das Thema „${topicLabel}" aus dieser Klasse entfernen?\nDie Fortschritte der Kinder bleiben erhalten.`
    );
    if (!ok) return;
    startTransition(async () => {
      const result = await unassignTopicFromClass(classId, topicId);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={handle}>
      {pending ? 'Entferne…' : 'Thema entfernen'}
    </Button>
  );
}
