'use client';

import { useState, useTransition } from 'react';
import type { StudentCode } from '@/lib/schemas/entities';
import { generateCodes, type GeneratedCode } from '@/lib/db/student-code-actions';
import { GenerateCodesForm } from '@/components/teacher/GenerateCodesForm';
import { GeneratedPinsNotice } from '@/components/teacher/GeneratedPinsNotice';
import { StudentCodeRow } from '@/components/teacher/StudentCodeRow';

type Props = { classId: string; className: string; codes: StudentCode[] };

export function StudentCodesPanel({ classId, className, codes }: Props) {
  const [count, setCount] = useState(25);
  const [fresh, setFresh] = useState<GeneratedCode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateCodes(classId, count, className);
      if (result.error) {
        setError(result.error);
      } else {
        setFresh(result.codes);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <GenerateCodesForm
        count={count}
        onCountChange={setCount}
        onGenerate={handleGenerate}
        pending={pending}
        error={error}
      />

      <GeneratedPinsNotice codes={fresh} className={className} />

      {codes.length > 0 && (
        <ul className="rounded-md border px-4">
          {codes.map((code) => (
            <StudentCodeRow key={code.id} code={code} />
          ))}
        </ul>
      )}
    </div>
  );
}
