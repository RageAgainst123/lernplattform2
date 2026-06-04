'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Client-Komponente für den Realtime-Spike-Test (T0, ADR-0016).
//
// Subscribe-Pfad: öffnet Channel 'spike-test' und hört auf 'tick'-events.
// Send-Pfad: sendet 'tick'-event mit aktueller Wall-Clock-Time als Payload.
// Empfangs-Pfad misst Differenz zwischen sendTime und Empfangstime → Latenz.

type LogEntry = {
  ts: string;
  kind: 'sub' | 'send' | 'recv' | 'err';
  message: string;
};

type SpikeState = {
  logs: LogEntry[];
  subscribed: boolean;
  counter: number;
};

export function SpikeRunner() {
  const { state, handleSubscribe, handleSend } = useSpikeChannel();
  return (
    <div className="space-y-4">
      <SpikeControls
        subscribed={state.subscribed}
        onSubscribe={handleSubscribe}
        onSend={() => void handleSend()}
      />
      <SpikeLog logs={state.logs} />
      <SpikeInstructions />
    </div>
  );
}

type ChannelRef = React.MutableRefObject<ReturnType<
  ReturnType<typeof createClient>['channel']
> | null>;
type SetState = React.Dispatch<React.SetStateAction<SpikeState>>;
type LogFn = (kind: LogEntry['kind'], message: string) => void;

function useSpikeChannel() {
  const [state, setState] = useState<SpikeState>({
    logs: [],
    subscribed: false,
    counter: 0,
  });
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const appendLog: LogFn = (kind, message) =>
    setState((prev) => ({
      ...prev,
      logs: [
        ...prev.logs.slice(-19),
        { ts: new Date().toISOString().slice(11, 23), kind, message },
      ],
    }));

  useEffect(() => () => cleanupChannel(channelRef), []);

  const handleSubscribe = () => doSubscribe(state, setState, channelRef, appendLog);
  const handleSend = () => doSend(state, setState, appendLog);

  return { state, handleSubscribe, handleSend };
}

function cleanupChannel(channelRef: ChannelRef) {
  if (channelRef.current) {
    const supabase = createClient();
    void supabase.removeChannel(channelRef.current);
  }
}

function doSubscribe(
  state: SpikeState,
  setState: SetState,
  channelRef: ChannelRef,
  appendLog: LogFn
) {
  if (state.subscribed) {
    appendLog('err', 'bereits subscribed');
    return;
  }
  const supabase = createClient();
  const channel = supabase
    .channel('spike-test', { config: { broadcast: { self: true } } })
    .on('broadcast', { event: 'tick' }, (payload) => {
      const data = payload.payload as { sendTime: number; n: number };
      const latencyMs = Date.now() - data.sendTime;
      appendLog('recv', `tick #${data.n} latenz=${latencyMs}ms`);
    })
    .subscribe((status) => {
      appendLog('sub', `status=${status}`);
      if (status === 'SUBSCRIBED') {
        setState((prev) => ({ ...prev, subscribed: true }));
      }
    });
  channelRef.current = channel;
}

async function doSend(state: SpikeState, setState: SetState, appendLog: LogFn) {
  const supabase = createClient();
  const tempChannel = supabase.channel('spike-test', {
    config: { broadcast: { self: false } },
  });
  await tempChannel.subscribe();
  const next = state.counter + 1;
  setState((prev) => ({ ...prev, counter: next }));
  const res = await tempChannel.send({
    type: 'broadcast',
    event: 'tick',
    payload: { sendTime: Date.now(), n: next },
  });
  appendLog('send', `tick #${next} result=${res}`);
  await supabase.removeChannel(tempChannel);
}

function SpikeControls({
  subscribed,
  onSubscribe,
  onSend,
}: {
  subscribed: boolean;
  onSubscribe: () => void;
  onSend: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onSubscribe}
        disabled={subscribed}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {subscribed ? '✓ Subscribed' : 'Subscribe'}
      </button>
      <button
        type="button"
        onClick={onSend}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Send Broadcast
      </button>
    </div>
  );
}

function SpikeLog({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <h2 className="mb-2 text-sm font-semibold">Event-Log</h2>
      <ul className="space-y-1 font-mono text-xs">
        {logs.length === 0 && <li className="text-slate-500">noch keine events</li>}
        {logs.map((entry, i) => (
          <li key={i} className={logColor(entry.kind)}>
            {entry.ts} [{entry.kind}] {entry.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function logColor(kind: LogEntry['kind']): string {
  if (kind === 'recv') return 'text-emerald-700';
  if (kind === 'send') return 'text-blue-700';
  if (kind === 'err') return 'text-rose-700';
  return 'text-slate-700';
}

function SpikeInstructions() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <p className="font-semibold">Test-Anleitung:</p>
      <ol className="mt-1 list-inside list-decimal space-y-1">
        <li>Zwei Browser-Tabs öffnen auf dieser URL</li>
        <li>Tab A: &bdquo;Subscribe&ldquo; klicken &rarr; Status sollte SUBSCRIBED zeigen</li>
        <li>Tab B: &bdquo;Send Broadcast&ldquo; klicken</li>
        <li>Tab A sollte tick-Event empfangen mit Latenz-Angabe</li>
        <li>Erwartung: Latenz &lt;100ms lokal, &lt;500ms gegen Supabase-Cloud</li>
        <li>
          WLAN-Test: WLAN aus &rarr; kurz warten &rarr; WLAN an. Send nochmal. Empfang sollte
          automatisch wieder klappen.
        </li>
      </ol>
    </div>
  );
}
