'use client';

import { useState } from 'react';
import type { TeacherSubmission } from '@/lib/db/teacher-submission';
import { TeacherSubmissionBlocks } from '@/components/teacher/TeacherSubmissionBlocks';
import { FeedbackForm } from '@/components/teacher/FeedbackForm';

// Client-Wrapper der Abgabe-Detailseite: hält den gemeinsamen manualMarks-State
// (Reflexions-Häkchen), damit die Häkchen aus TeacherSubmissionBlocks beim
// Zurückgeben über die FeedbackForm mitgespeichert werden.

type Props = {
  classId: string;
  submission: TeacherSubmission;
};

export function SubmissionReview({ classId, submission }: Props) {
  const [manualMarks, setManualMarks] = useState<Record<string, boolean>>(submission.manualMarks);

  function toggleMark(blockId: string, accepted: boolean) {
    setManualMarks((prev) => ({ ...prev, [blockId]: accepted }));
  }

  return (
    <div className="space-y-6">
      <TeacherSubmissionBlocks
        blocks={submission.content.blocks}
        answers={submission.answers}
        manualMarks={manualMarks}
        onToggleMark={toggleMark}
      />
      <FeedbackForm
        classId={classId}
        studentCodeId={submission.studentCodeId}
        moduleId={submission.moduleId}
        initialFeedback={submission.teacherFeedback}
        returnedAt={submission.returnedAt}
        manualMarks={manualMarks}
      />
    </div>
  );
}
