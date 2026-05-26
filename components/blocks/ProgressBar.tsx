export function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <div className="bg-muted h-2 overflow-hidden rounded-full">
      <div className="bg-primary h-full transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}
