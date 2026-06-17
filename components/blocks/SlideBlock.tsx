import type { SlideBlock as SlideBlockType } from '@/lib/schemas/blocks';

// Präsentationsfolie für den geführten Stundeneinstieg (display_mode
// 'presentation'). Große, Beamer-taugliche Typografie: Titel groß, optionaler
// Fließtext, optionales Bild. Wird vom PresentationRunner einzeln gezeigt.
export function SlideBlock({ block }: { block: SlideBlockType }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{block.title}</h2>
      {block.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.imageUrl}
          alt=""
          className="max-h-[50vh] w-auto rounded-lg object-contain"
        />
      )}
      {block.body && (
        <p className="max-w-3xl text-2xl leading-relaxed whitespace-pre-line sm:text-3xl">
          {block.body}
        </p>
      )}
    </div>
  );
}
