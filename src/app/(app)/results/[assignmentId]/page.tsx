"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import type { EvaluationDetail } from "@/types";
import { GradeBadge } from "@/components/shared/display";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ResultDetailPage() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = Number(params.assignmentId);
  const [detail, setDetail] = useState<EvaluationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) return;
    apiClient
      .getEvaluationDetail(assignmentId)
      .then((res) => setDetail(res.data))
      .catch(() => setDetail(null))
      .finally(() => setIsLoading(false));
  }, [assignmentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading result…
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/results"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Results
      </Link>

      {!detail ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <GradeBadge grade={null} />
            <p className="mt-2 font-display font-semibold">Result not available</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              This KPI assignment could not be found, or you do not have access to it.
            </p>
          </CardContent>
        </Card>
      ) : !detail.isProcessed ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <GradeBadge grade={null} />
            <p className="mt-2 font-display font-semibold">Grade not yet processed</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your grade will appear here once your supervisor and HOD have completed their
              evaluations and the HOD has processed the final result.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">{detail.periodName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{detail.employeeName}</p>
            </div>
            <GradeBadge grade={detail.grade} />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <ScoreCard label="KPI score" value={detail.kpiScore} suffix="/ 80" />
            <ScoreCard label="Competency score" value={detail.competencyScore} suffix="/ 10" />
            <ScoreCard label="Achievement score" value={detail.achievementScore} suffix="/ 10" />
            <ScoreCard label="Attendance penalty" value={detail.attendancePenalty} negative />
          </div>

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
                  {detail.kpiLines.map((d) => (
                    <TableRow key={d.kpiAssignmentDetailId}>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate font-medium">{d.kpiName}</p>
                      </TableCell>
                      <TableCell className="font-mono-data text-xs">{d.weightPercentage}%</TableCell>
                      <TableCell className="font-mono-data">{d.employeeMarks ?? "—"}</TableCell>
                      <TableCell className="font-mono-data">{d.supervisorMarks ?? "—"}</TableCell>
                      <TableCell className="font-mono-data">{d.hodMarks ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation of competencies</CardTitle>
                <CardDescription>10% of final grade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {detail.competencies.length ? (
                  detail.competencies.map((c) => (
                    <div key={c.competencyId} className="flex items-center justify-between text-sm">
                      <span>{c.competencyName}</span>
                      <Badge>{c.score ?? "—"} / 5</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Not yet scored.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Special achievements</CardTitle>
                <CardDescription>10% of final grade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {detail.achievements.length ? (
                  detail.achievements.map((a) => (
                    <div key={a.achievementId} className="flex items-center justify-between text-sm">
                      <span className="truncate">{a.title}</span>
                      <Badge variant="accent">+{a.marks}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">None recorded.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {(detail.recommendationTypes.length > 0 || detail.managerComments) && (
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {detail.recommendationTypes.length > 0 && (
                  <p className="font-medium">{detail.recommendationTypes.join(", ")}</p>
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
        </div>
      )}
    </div>
  );
}

function ScoreCard({
  label,
  value,
  suffix,
  negative,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  negative?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono-data text-xl font-semibold">
          {negative && value ? "−" : ""}
          {value ?? "—"}
          {suffix && <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>}
        </p>
      </CardContent>
    </Card>
  );
}
