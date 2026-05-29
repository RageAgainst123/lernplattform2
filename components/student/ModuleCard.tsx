import Link from 'next/link';
import { CheckIcon, PencilIcon } from 'lucide-react';
import type { AssignedModule } from '@/lib/db/student-modules';
import type { ModuleStatus } from '@/lib/db/student-modules-status';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Zeigt ein Schüler:innen-Dashboard-Modul mit Status-Badge. 'open' rendert
// kein Badge (sauberer Default), 'in_progress' = gelb-tönt „In Bearbeitung",
// 'done' = primary-tönt „Erledigt".

function StatusBadge({ status }: { status: ModuleStatus }) {
  if (status === 'done') {
    return (
      <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
        <CheckIcon className="size-3.5" aria-hidden />
        Erledigt
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-800">
        <PencilIcon className="size-3.5" aria-hidden />
        In Bearbeitung
      </span>
    );
  }
  return null;
}

export function ModuleCard({ module }: { module: AssignedModule }) {
  return (
    <Link href={`/s/modul/${module.id}`} className="block">
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-xl">
            <span>{module.title}</span>
            <StatusBadge status={module.status} />
          </CardTitle>
          {module.description && <CardDescription>{module.description}</CardDescription>}
        </CardHeader>
      </Card>
    </Link>
  );
}
