"use client";

import { useState } from "react";
import type { Achievement, AchievementType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, Trash2, Upload } from "lucide-react";

/**
 * Special Achievements. Fields match CreateEmployeeAchievementDto /
 * UpdateEmployeeAchievementDto exactly (achievementTypeId, title, marks, remarks) —
 * there is no "achieved date" field on the backend EmployeeAchievement entity.
 * The backend caps the running total of marks across all achievements on one HOD
 * evaluation at 10 (AchievementService.MaxTotalAchievementMarks); marks entered here
 * are validated server-side and a 400 is returned if the cap would be exceeded.
 */
export function AchievementsForm({
  achievements,
  types,
  onAdd,
  onDelete,
  onUpload,
}: {
  achievements: Achievement[];
  types: AchievementType[];
  onAdd: (input: {
    achievementTypeId: number;
    title: string;
    marks: number;
    remarks?: string;
  }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpload?: (achievementId: number, file: File) => Promise<void>;
}) {
  const [achievementTypeId, setAchievementTypeId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [remarks, setRemarks] = useState("");
  const [marks, setMarks] = useState("1");
  const [isSaving, setIsSaving] = useState(false);

  const totalMarks = achievements.reduce((sum, a) => sum + a.marks, 0);
  const remainingMarks = Math.max(0, 10 - totalMarks);

  async function handleAdd() {
    if (!achievementTypeId || !title) return;
    setIsSaving(true);
    try {
      await onAdd({
        achievementTypeId: Number(achievementTypeId),
        title,
        marks: Number(marks),
        remarks: remarks || undefined,
      });
      setTitle("");
      setRemarks("");
      setMarks("1");
      setAchievementTypeId("");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Special achievements</CardTitle>
        <CardDescription>
          Degrees, certificates, awards, or training earned this period. Marks contribute up
          to 10 points total ({remainingMarks} remaining).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {achievements.length > 0 && (
          <ul className="space-y-2">
            {achievements.map((a) => (
              <li
                key={a.achievementId}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.achievementTypeName}
                    {a.remarks ? ` · ${a.remarks}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="accent">+{a.marks}</Badge>
                  {onUpload && (
                    <label className="cursor-pointer text-muted-foreground hover:text-foreground">
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onUpload(a.achievementId, file);
                        }}
                      />
                    </label>
                  )}
                  <button
                    onClick={() => onDelete(a.achievementId)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete achievement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={achievementTypeId} onValueChange={setAchievementTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.achievementTypeId} value={String(t.achievementTypeId)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Marks (0–{Math.min(10, remainingMarks + Number(marks) || 10)})</Label>
            <Input type="number" min={0} max={10} step="0.5" value={marks} onChange={(e) => setMarks(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master's Degree in Information Technology"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Remarks (optional)</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional detail about this achievement"
            />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={isSaving || !achievementTypeId || !title}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          Add achievement
        </Button>
      </CardContent>
    </Card>
  );
}
