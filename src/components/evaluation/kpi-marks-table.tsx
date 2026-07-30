"use client";

import { useState } from "react";
import type { EvaluationKpiLine } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

export interface KpiMarkInput {
  kpiAssignmentDetailId: number;
  marks: number;
  comments?: string;
}

/**
 * Renders one row per KPI line from the combined evaluation-detail view
 * (GET /api/evaluation-detail/{assignmentId}), showing the Employee's self-mark
 * alongside an editable field for the caller's own role (Supervisor or HOD). Emits
 * {kpiAssignmentDetailId, marks, comments}[] — the exact shape
 * CreateSupervisorEvaluationDto.details / CreateHodEvaluationDto.details expect.
 */
export function KpiMarksTable({
  lines,
  role,
  onSave,
}: {
  lines: EvaluationKpiLine[];
  role: "Supervisor" | "HOD";
  onSave: (marks: KpiMarkInput[]) => Promise<void>;
}) {
  const [scores, setScores] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    lines.forEach((l) => {
      const existing = role === "Supervisor" ? l.supervisorMarks : l.hodMarks;
      if (existing !== null && existing !== undefined) initial[l.kpiAssignmentDetailId] = String(existing);
    });
    return initial;
  });
  const [comments, setComments] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    lines.forEach((l) => {
      const existing = role === "Supervisor" ? l.supervisorComments : l.hodComments;
      if (existing) initial[l.kpiAssignmentDetailId] = existing;
    });
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(
        lines.map((l) => ({
          kpiAssignmentDetailId: l.kpiAssignmentDetailId,
          marks: Number(scores[l.kpiAssignmentDetailId] ?? 0),
          comments: comments[l.kpiAssignmentDetailId] || undefined,
        }))
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee response — KPI marks</CardTitle>
        <CardDescription>Enter your {role} score (0–100) for each KPI.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>KPI</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Self score</TableHead>
              {role === "HOD" && <TableHead>Supervisor score</TableHead>}
              <TableHead>Your score</TableHead>
              <TableHead>Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((l) => (
              <TableRow key={l.kpiAssignmentDetailId}>
                <TableCell className="max-w-[220px]">
                  <p className="truncate font-medium">{l.kpiName}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.description}</p>
                </TableCell>
                <TableCell className="font-mono-data text-xs">{l.weightPercentage}%</TableCell>
                <TableCell className="font-mono-data">{l.employeeMarks ?? "—"}</TableCell>
                {role === "HOD" && (
                  <TableCell className="font-mono-data">{l.supervisorMarks ?? "—"}</TableCell>
                )}
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="w-24"
                    value={scores[l.kpiAssignmentDetailId] ?? ""}
                    onChange={(e) =>
                      setScores((p) => ({ ...p, [l.kpiAssignmentDetailId]: e.target.value }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="w-40"
                    value={comments[l.kpiAssignmentDetailId] ?? ""}
                    onChange={(e) =>
                      setComments((p) => ({ ...p, [l.kpiAssignmentDetailId]: e.target.value }))
                    }
                    placeholder="Optional"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button className="mt-4" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save {role} marks
        </Button>
      </CardContent>
    </Card>
  );
}
