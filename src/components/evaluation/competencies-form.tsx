"use client";

import { useState } from "react";
import type { Competency } from "@/types";
import { COMPETENCY_SCALE } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export function CompetenciesForm({
  competencies,
  evaluatorRole,
  onSave,
}: {
  competencies: Competency[];
  evaluatorRole: string;
  onSave: (ratings: { competencyId: number; score: number }[]) => Promise<void>;
}) {
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(
        competencies.map((c) => ({ competencyId: c.competencyId, score: ratings[c.competencyId] ?? 0 }))
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation of competencies</CardTitle>
        <CardDescription>Rate each competency from 1 (need improvement) to 5 (consistently exceeds).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {competencies.map((c) => (
          <div key={c.competencyId}>
            <p className="mb-2 text-sm font-medium">{c.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {COMPETENCY_SCALE.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  title={s.label}
                  onClick={() => setRatings((p) => ({ ...p, [c.competencyId]: s.value }))}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition-colors",
                    ratings[c.competencyId] === s.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-muted"
                  )}
                >
                  {s.value}
                </button>
              ))}
              <span className="ml-2 self-center text-xs text-muted-foreground">
                {ratings[c.competencyId] ? COMPETENCY_SCALE[ratings[c.competencyId] - 1].label : "Not rated"}
              </span>
            </div>
          </div>
        ))}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save competency ratings
        </Button>
      </CardContent>
    </Card>
  );
}
