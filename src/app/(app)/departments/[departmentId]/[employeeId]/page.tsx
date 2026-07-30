"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import type { KpiAssignment, EvaluationDetail } from "@/types";
import { PageHeader, GradeBadge, StatusBadge } from "@/components/shared/display";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AttendanceForm, ReportButtons } from "@/components/evaluation/grade-and-actions";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ManagerEmployeeDetailPage() {
  const params = useParams<{ departmentId: string; employeeId: string }>();
  const employeeId = Number(params.employeeId);

  const [assignment, setAssignment] = useState<KpiAssignment | null>(null);
  const [detail, setDetail] = useState<EvaluationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const kpiRes = await apiClient.getKpisByEmployee(employeeId);
      const latest = kpiRes.data[0] ?? null;
      setAssignment(latest);
      if (latest) {
        const res = await apiClient.getEvaluationDetail(latest.assignmentId);
        setDetail(res.data);
      }
    } catch {
      toast.error("Could not load employee evaluation.");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) load();
  }, [employeeId, load]);

  async function handleSaveAttendance(input: {
    annualLeave: number;
    casualLeave: number;
    medicalLeave: number;
    noPayLeave: number;
    lateAttendance: number;
  }) {
    if (!assignment) return;
    try {
      await apiClient.upsertAttendance({
        employeeId: assignment.employeeId,
        periodId: assignment.periodId,
        ...input,
      });
      toast.success("Attendance saved.");
      load();
    } catch {
      toast.error("Could not save attendance.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/departments/${params.departmentId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Employees
      </Link>

      {!assignment ? (
        <p className="text-sm text-muted-foreground">No KPI assignment found for this employee yet.</p>
      ) : (
        <div className="space-y-6">
          <PageHeader
            title={assignment.employeeName || "Employee"}
            description={assignment.periodName}
            action={
              <div className="flex items-center gap-2">
                <StatusBadge status={detail?.selfEvaluationStatus ?? assignment.status} />
                <GradeBadge grade={detail?.grade ?? null} />
              </div>
            }
          />

          <Card>
            <CardHeader>
              <CardTitle>KPI marks</CardTitle>
              <CardDescription>80% of final grade</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Self</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>HOD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(detail?.kpiLines ?? []).map((l) => (
                    <TableRow key={l.kpiAssignmentDetailId}>
                      <TableCell className="max-w-[220px] truncate font-medium">{l.kpiName}</TableCell>
                      <TableCell className="font-mono-data text-xs">{l.weightPercentage}%</TableCell>
                      <TableCell className="font-mono-data">{l.employeeMarks ?? "—"}</TableCell>
                      <TableCell className="font-mono-data">{l.supervisorMarks ?? "—"}</TableCell>
                      <TableCell className="font-mono-data">{l.hodMarks ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {detail && detail.competencies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evaluation of competencies</CardTitle>
                <CardDescription>10% of final grade</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competency</TableHead>
                      <TableHead>Score (1–5)</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.competencies.map((c) => (
                      <TableRow key={c.competencyId}>
                        <TableCell className="font-medium">{c.competencyName}</TableCell>
                        <TableCell className="font-mono-data">{c.score ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.remarks ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {detail && detail.achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Special achievements</CardTitle>
                <CardDescription>10% of final grade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {detail.achievements.map((a) => (
                  <div
                    key={a.achievementId}
                    className="flex items-center justify-between rounded-md border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.achievementTypeName}</p>
                    </div>
                    <Badge variant="accent">+{a.marks}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {detail && (detail.recommendationTypes.length > 0 || detail.managerComments) && (
            <Card>
              <CardHeader>
                <CardTitle>HOD recommendation & Manager decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {detail.recommendationTypes.length > 0 && (
                  <p>
                    <span className="font-medium">Recommendation: </span>
                    {detail.recommendationTypes.join(", ")}
                  </p>
                )}
                {detail.recommendationNote && (
                  <p className="text-muted-foreground">{detail.recommendationNote}</p>
                )}
                {detail.managerDecision && (
                  <p>
                    <span className="font-medium">Manager decision: </span>
                    {detail.managerDecision}
                  </p>
                )}
                {detail.managerComments && (
                  <p className="text-muted-foreground">{detail.managerComments}</p>
                )}
              </CardContent>
            </Card>
          )}

          <AttendanceForm
            calculatedPenalty={detail?.attendancePenalty ?? null}
            onSave={handleSaveAttendance}
          />

          {detail?.resultId && <ReportButtons resultId={detail.resultId} />}
        </div>
      )}
    </div>
  );
}
