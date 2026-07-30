"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import type { KpiAssignment } from "@/types";
import { StatusBadge } from "@/components/shared/display";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Send } from "lucide-react";
import axios from "axios";

export default function MyKpiDetailPage() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = Number(params.assignmentId);
  const router = useRouter();

  const [assignment, setAssignment] = useState<KpiAssignment | null>(null);
  // const [scores, setScores] = useState<Record<number, string>>({});
  const [evaluationStatus, setEvaluationStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scores, setScores] = useState<Record<number, string>>({});
  const [comments, setComments] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!assignmentId) return;
    (async () => {
      try {
        const kpiRes = await apiClient.getKpiById(assignmentId);
        setAssignment(kpiRes.data);

        try {
          const evalRes = await apiClient.getSelfEvaluationByAssignment(assignmentId);
          if (evalRes.data) {
            setEvaluationStatus(evalRes.data.status);
            const initialScores: Record<number, string> = {};
            const initialComments: Record<number, string> = {};
            evalRes.data.details?.forEach((d) => {
              initialScores[d.kpiAssignmentDetailId] = String(d.employeeMarks);
              if (d.comments) initialComments[d.kpiAssignmentDetailId] = d.comments;
            });
            setScores(initialScores);
            setComments(initialComments);
          }
        } catch {
          // no self-evaluation yet — that's fine, start blank
        }
      } catch {
        toast.error("Could not load this KPI.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [assignmentId]);

  const isLocked = evaluationStatus === "Submitted";

  function handleScoreChange(detailId: number, value: string) {
    setScores((prev) => ({ ...prev, [detailId]: value }));
  }

  function buildDetails() {
    if (!assignment) return [];
    return assignment.details.map((d) => ({
      kpiAssignmentDetailId: d.detailId,
      employeeMarks: Number(scores[d.detailId] ?? 0),
      comments: comments[d.detailId] ?? "",
    }));
  }

  async function handleSave(submit: boolean) {
    if (!assignment) return;
    const details = buildDetails();
    if (
      details.some(
        (d) =>
          Number.isNaN(d.employeeMarks) ||
          d.employeeMarks < 0 ||
          d.employeeMarks > 100,
      )
    ) {
      toast.error("Enter a score between 0 and 100 for every KPI.");
      return;
    }
    const payload = { assignmentId: assignment.assignmentId, details };
    submit ? setIsSubmitting(true) : setIsSaving(true);
    try {
      if (submit) {
        await apiClient.submitSelfEvaluation(payload);
        setEvaluationStatus("Submitted");
        toast.success("Self evaluation submitted.");
      } else {
        await apiClient.saveSelfEvaluationDraft(payload);
        setEvaluationStatus("Draft");
        toast.success("Marks saved as draft.");
      }
    } catch (err) {
      let message = "Could not save your marks.";
      if (axios.isAxiosError(err))
        message = err.response?.data?.message || message;
      toast.error(message);
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  }

  function handleCommentChange(detailId: number, value: string) {
    setComments((prev) => ({ ...prev, [detailId]: value }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!assignment) {
    return <p className="text-sm text-muted-foreground">KPI not found.</p>;
  }

  return (
    <div>
      <Link
        href="/my-kpis"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My KPIs
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {assignment.periodName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assigned by {assignment.createdByName ?? "your manager"} ·{" "}
            {assignment.totalWeight}% total weight
          </p>
        </div>
        <StatusBadge status={evaluationStatus ?? assignment.status} />
      </div>

      <div className="space-y-4">
        {assignment.details.map((d) => (
          <Card key={d.detailId}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{d.kpiName}</CardTitle>
                  <CardDescription className="mt-1">
                    {d.description}
                  </CardDescription>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-2 py-1 font-mono-data text-xs font-semibold">
                  {d.weightPercentage}%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <div className="space-y-1.5">
                  <Label htmlFor={`score-${d.detailId}`}>
                    Your score (0–100)
                  </Label>
                  <Input
                    id={`score-${d.detailId}`}
                    type="number"
                    min={0}
                    max={100}
                    disabled={isLocked}
                    value={scores[d.detailId] ?? ""}
                    onChange={(e) =>
                      handleScoreChange(d.detailId, e.target.value)
                    }
                    placeholder="e.g. 85"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`comment-${d.detailId}`}>
                    Comments (optional)
                  </Label>
                  <Input
                    id={`comment-${d.detailId}`}
                    disabled={isLocked}
                    value={comments[d.detailId] ?? ""}
                    onChange={(e) =>
                      handleCommentChange(d.detailId, e.target.value)
                    }
                    placeholder="Add a note about this KPI"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLocked && (
        <div className="sticky bottom-20 mt-6 flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-lg sm:flex-row sm:justify-end md:bottom-4">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving || isSubmitting}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit evaluation
          </Button>
        </div>
      )}
      {isLocked && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          This evaluation has been submitted and can no longer be edited.
        </p>
      )}
    </div>
  );
}
