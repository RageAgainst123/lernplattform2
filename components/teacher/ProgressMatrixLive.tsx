'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { channels, events } from '@/lib/realtime/channels';

// Phase T6 (ADR-0016): wrapper um die Fortschrittsmatrix der lehrer:innen-
// sicht. subscribed auf class_progress:{classId} und triggert bei jedem
// progress-event einen router.refresh() — die server-component-matrix wird
// neu gerendert ohne F5.
//
// pattern bewusst minimal: kein eigener state, kein polling. wenn realtime
// ausfaellt, sieht lehrer:in alte daten und muss reloaden — akzeptabel,
// weil es keine kritische zeit-information ist (vs. quiz/live).
//
// events:
//   module_submitted, worksheet_returned, heft_entry_saved

const PROGRESS_EVENTS = [
  events.classProgress.moduleSubmitted,
  events.classProgress.worksheetReturned,
  events.classProgress.heftEntrySaved,
] as const;

export function ProgressMatrixLive({
  classId,
  children,
}: {
  classId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channelName = channels.classProgress(classId);
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });
    for (const eventName of PROGRESS_EVENTS) {
      channel.on('broadcast', { event: eventName }, () => {
        router.refresh();
      });
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [classId, router]);

  return <>{children}</>;
}
