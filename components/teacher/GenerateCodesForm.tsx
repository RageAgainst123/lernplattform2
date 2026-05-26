'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  count: number;
  onCountChange: (value: number) => void;
  onGenerate: () => void;
  pending: boolean;
  error: string | null;
};

export function GenerateCodesForm({ count, onCountChange, onGenerate, pending, error }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Anzahl
          <Input
            type="number"
            min={1}
            max={35}
            value={count}
            onChange={(e) => onCountChange(Number(e.target.value))}
            className="w-24"
          />
        </label>
        <Button type="button" onClick={onGenerate} disabled={pending}>
          {pending ? 'Wird erstellt …' : 'Codes generieren'}
        </Button>
      </div>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
