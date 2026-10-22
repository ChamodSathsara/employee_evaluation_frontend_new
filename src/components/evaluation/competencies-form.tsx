"use client";

import { useState } from "react";
import type { Competency } from "@/types";
import { COMPETENCY_SCALE } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, PlusCircle, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const emptyCustomForm = {
  name: "",
  description: "",
  score: 0,
  remarks: "",
};

export function CompetenciesForm({
  competencies,
  evaluatorRole,
  onSave,
  onAddCustom,
  initialRatings = {},
}: {
  competencies: Competency[];
  evaluatorRole: string;
  onSave: (ratings: { competencyId: number; score: number }[]) => Promise<void>;
  onAddCustom: (input: {
    name: string;
    description: string;
    score: number;
    remarks?: string;
  }) => Promise<void>;
  initialRatings?: Record<number, number>;
}) {
  const [ratings, setRatings] = useState<Record<number, number>>(initialRatings);
  const [isSaving, setIsSaving] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customForm, setCustomForm] = useState(emptyCustomForm);
  const [isAddingCustom, setIsAddingCustom] = useState(false);

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

  async function handleAddCustom() {
    if (!customForm.name.trim() || !customForm.description.trim()) return;
    if (customForm.score < 1 || customForm.score > 5) return;

    setIsAddingCustom(true);
    try {
      await onAddCustom({
        name: customForm.name.trim(),
        description: customForm.description.trim(),
        score: customForm.score,
        remarks: customForm.remarks.trim() || undefined,
      });
      setCustomForm(emptyCustomForm);
      setCustomDialogOpen(false);
    } finally {
      setIsAddingCustom(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Evaluation of competencies</CardTitle>
            <CardDescription className="mt-1">
              Rate each competency from 1 (need improvement) to 5 (consistently exceeds).
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => setCustomDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" /> Add competency
          </Button>
        </div>
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

      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a custom competency</DialogTitle>
            <DialogDescription>
              Create the competency and add its score to this employee&apos;s {evaluatorRole} evaluation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="custom-competency-name">Name</Label>
              <Input
                id="custom-competency-name"
                value={customForm.name}
                onChange={(event) =>
                  setCustomForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Time Management"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-competency-description">Description</Label>
              <Textarea
                id="custom-competency-description"
                value={customForm.description}
                onChange={(event) =>
                  setCustomForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Ability to manage time effectively"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Score</Label>
              <div className="flex flex-wrap gap-2">
                {COMPETENCY_SCALE.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    title={item.label}
                    onClick={() =>
                      setCustomForm((current) => ({ ...current, score: item.value }))
                    }
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition-colors",
                      customForm.score === item.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-muted",
                    )}
                  >
                    {item.value}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {customForm.score
                  ? COMPETENCY_SCALE[customForm.score - 1].label
                  : "Select a score from 1 to 5."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-competency-remarks">Remarks</Label>
              <Textarea
                id="custom-competency-remarks"
                value={customForm.remarks}
                onChange={(event) =>
                  setCustomForm((current) => ({ ...current, remarks: event.target.value }))
                }
                placeholder="Completes assigned work on time"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomDialogOpen(false)}
              disabled={isAddingCustom}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCustom}
              disabled={
                isAddingCustom ||
                !customForm.name.trim() ||
                !customForm.description.trim() ||
                customForm.score < 1
              }
            >
              {isAddingCustom ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              Add competency
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
