import type { InfoboxBlock as InfoboxBlockType } from '@/lib/schemas/blocks';

export function InfoboxBlock({ block }: { block: InfoboxBlockType }) {
  return (
    <div className="border-primary/40 bg-primary/5 rounded-lg border-l-4 p-4">
      {block.title && <p className="mb-1 font-semibold">{block.title}</p>}
      <p className="text-lg leading-relaxed whitespace-pre-line">{block.content}</p>
    </div>
  );
}
