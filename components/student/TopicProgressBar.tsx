// Reine Server-Komponente: zeigt einen Fortschrittsbalken + Text wie
// „3 von 5 erledigt". Verwendet weder Hooks noch Client-State.

type Props = {
  done: number;
  total: number;
};

export function TopicProgressBar({ done, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div>
      <div
        className="bg-muted h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${done} von ${total} Bausteinen erledigt`}
      >
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-muted-foreground mt-1 text-xs tabular-nums">
        {done} von {total} erledigt
      </p>
    </div>
  );
}
