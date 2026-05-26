import type { TextBlock as TextBlockType } from '@/lib/schemas/blocks';

export function TextBlock({ block }: { block: TextBlockType }) {
  return (
    <div className="space-y-4">
      <p className="text-lg leading-relaxed whitespace-pre-line">{block.content}</p>
      {block.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- Modul-Bilder aus Storage, kein next/image nötig
        <img src={block.imageUrl} alt="" className="mx-auto max-h-64 rounded-md" />
      )}
    </div>
  );
}
