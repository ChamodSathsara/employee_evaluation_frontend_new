"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";
import type {
  KpiAssignment,
  Competency,
  AchievementType,
  EvaluationDetail,
  RecommendationType,
} from "@/types";
import { ROLE } from "@/types";
import { PageHeader, EmptyState, StatusBadge } from "@/components/shared/display";
import { KpiMarksTable, type KpiMarkInput } from "@/components/evaluation/kpi-marks-table";
import { CompetenciesForm } from "@/components/evaluation/competencies-form";
import { AchievementsForm } from "@/components/evaluation/achievements-form";
import { GradeCard, RecommendationForm, ReportButtons } from "@/components/evaluation/grade-and-actions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Loader2, PlusCircle, Send } from "lucide-react";

export default function EmployeeDetailPage() {
  const params = useParams<{ employeeId: string }>();
  const employeeId = Number(params.employeeId);
  const { user } = useAuth();
  const router = useRouter();

  const [selected, setSelected] = useState<KpiAssignment | null>(null);
  const [detail, setDetail] = useState<EvaluationDetail | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [achievementTypes, setAchievementTypes] = useState<AchievementType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // The backend ties competency scoring, achievements, grade processing, and
  // recommendations to HODEvaluation ownership — only the HOD can use those tabs.
  // A Supervisor's role in the workflow is limited to entering KPI marks and submitting
  // their review; the HOD reviews after (see CompetencyEvaluationService /
  // AchievementService / GradeCalculationService ownership checks).
  const isHod = user?.roleId === ROLE.HOD || user?.roleId === ROLE.ADMIN;
  const evaluatorRole: "Supervisor" | "HOD" = isHod ? "HOD" : "Supervisor";

  const loadDetail = useCallback(async (assignmentId: number) => {
    try {
      const res = await apiClient.getEvaluationDetail(assignmentId);
      setDetail(res.data);
    } catch {
      setDetail(null);
    }
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    (async () => {
      setIsLoading(true);
      try {
        const [kpiRes, compRes, typeRes] = await Promise.all([
          apiClient.getKpisByEmployee(employeeId),
          apiClient.getCompetencies().catch(() => ({ data: [] as Competency[] })),
          apiClient.getAchievementTypes().catch(() => ({ data: [] as AchievementType[] })),
        ]);
        setCompetencies(compRes.data);
        setAchievementTypes(typeRes.data);
        const latest = kpiRes.data[0] ?? null;
        setSelected(latest);
        if (latest) await loadDetail(latest.assignmentId);
      } catch {
        toast.error("Could not load this employee's KPIs.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [employeeId, loadDetail]);

  // ---------- KPI marks (Supervisor or HOD) ----------
  async function handleSaveMarks(marks: KpiMarkInput[]) {
    if (!selected || !detail?.selfEvaluationId) {
      toast.error("The employee has not submitted their self-evaluation yet.");
      return;
    }
    try {
      if (evaluatorRole === "Supervisor") {
        if (detail.supervisorEvaluationId) {
          await apiClient.updateSupervisorEvaluation(detail.supervisorEvaluationId, { details: marks });
        } else {
          await apiClient.createSupervisorEvaluation({
            selfEvaluationId: detail.selfEvaluationId,
            details: marks,
          });
        }
      } else {
        if (detail.hodEvaluationId) {
          await apiClient.updateHodEvaluation(detail.hodEvaluationId, { details: marks });
        } else {
          await apiClient.createHodEvaluation({
            selfEvaluationId: detail.selfEvaluationId,
            details: marks,
          });
        }
      }
      toast.success(`${evaluatorRole} marks saved as Draft.`);
      await loadDetail(selected.assignmentId);
    } catch {
      toast.error("Could not save marks.");
    }
  }

  async function handleSubmitReview() {
    if (!selected || !detail) return;
    setIsSubmittingReview(true);
    try {
      if (evaluatorRole === "Supervisor" && detail.supervisorEvaluationId) {
        await apiClient.submitSupervisorEvaluation(detail.supervisorEvaluationId);
      } else if (evaluatorRole === "HOD" && detail.hodEvaluationId) {
        await apiClient.submitHodEvaluation(detail.hodEvaluationId);
      } else {
        toast.error("Save marks as Draft before submitting.");
        return;
      }
      toast.success(`${evaluatorRole} review submitted.`);
      await loadDetail(selected.assignmentId);
    } catch {
      toast.error("Could not submit the review.");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  // ---------- Competencies (HOD only) ----------
  async function handleSaveCompetencies(ratings: { competencyId: number; score: number }[]) {
    if (!detail?.hodEvaluationId) {
      toast.error("Start your HOD evaluation (save KPI marks) before scoring competencies.");
      return;
    }
    try {
      await Promise.all(
        ratings.map((r) =>
          apiClient.submitCompetencyEvaluation(detail.hodEvaluationId as number, {
            competencyId: r.competencyId,
            score: r.score,
          })
        )
      );
      toast.success("Competency ratings saved.");
      if (selected) await loadDetail(selected.assignmentId);
    } catch {
      toast.error("Could not save competency ratings.");
    }
  }

  // ---------- Achievements (HOD only) ----------
  async function handleAddAchievement(input: {
    achievementTypeId: number;
    title: string;
    marks: number;
    remarks?: string;
  }) {
    if (!detail?.hodEvaluationId) {
      toast.error("Start your HOD evaluation (save KPI marks) before adding achievements.");
      return;
    }
    try {
      await apiClient.addAchievement({ hodEvaluationId: detail.hodEvaluationId, ...input });
      toast.success("Achievement added.");
      if (selected) await loadDetail(selected.assignmentId);
    } catch {
      toast.error("Could not add achievement. The 10-mark cap may have been reached.");
    }
  }

  async function handleDeleteAchievement(id: number) {
    try {
      await apiClient.deleteAchievement(id);
      toast.success("Achievement removed.");
      if (selected) await loadDetail(selected.assignmentId);
    } catch {
      toast.error("Could not remove achievement.");
    }
  }

  async function handleUploadAchievementFile(achievementId: number, file: File) {
    try {
      await apiClient.uploadAchievementFile(achievementId, file);
      toast.success("Attachment uploaded.");
      if (selected) await loadDetail(selected.assignmentId);
    } catch {
      toast.error("Could not upload the attachment.");
    }
  }

  // ---------- Grade (HOD only) ----------
  async function handleGenerateGrade() {
    if (!detail?.hodEvaluationId) {
      toast.error("Submit your HOD evaluation before processing the grade.");
      return;
    }
    try {
      await apiClient.processGrade(detail.hodEvaluationId);
      toast.success("Grade generated.");
      if (selected) await loadDetail(selected.assignmentId);
    } catch {
      toast.error(
        "Could not generate the grade. Make sure the HOD review is submitted, all 10 competencies are scored, and attendance has been recorded."
      );
    }
  }

  // ---------- Recommendation (HOD only) ----------
  async function handleSaveRecommendation(recommendationType: RecommendationType, note: string) {
    if (!detail?.resultId) {
      toast.error("Generate the grade before adding a recommendation.");
      return;
    }
    try {
      await apiClient.addRecommendation(detail.resultId, {
        recommendationType,
        recommendationNote: note || undefined,
      });
      toast.success("Recommendation saved.");
      if (selected) await loadDetail(selected.assignmentId);
    } catch {
      toast.error("Could not save the recommendation.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading employee…
      </div>
    );
  }

  const selfNotReady = detail && detail.selfEvaluationStatus !== "Submitted";
  const myReviewId = evaluatorRole === "Supervisor" ? detail?.supervisorEvaluationId : detail?.hodEvaluationId;
  const myReviewStatus = evaluatorRole === "Supervisor" ? detail?.supervisorEvaluationStatus : detail?.hodEvaluationStatus;

  return (
    <div>
      <Link
        href="/employees"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Employees
      </Link>

      {!selected ? (
        <EmptyState
          title="No KPIs created for this employee yet"
          description="Create KPIs for this evaluation period to begin the review cycle."
          action={
            <Button onClick={() => router.push(`/create-kpi?employeeId=${employeeId}`)}>
              <PlusCircle className="h-4 w-4" /> Create KPIs
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <PageHeader
            title={selected.employeeName || "Employee"}
            description={selected.periodName}
            action={<StatusBadge status={detail?.selfEvaluationStatus ?? selected.status} />}
          />

          {selfNotReady ? (
            <EmptyState
              title="Waiting for the employee"
              description="This employee has not submitted their self-evaluation yet. Marks, competencies, and achievements can only be entered once the self-evaluation is Submitted."
            />
          ) : (
            <Tabs defaultValue="marks">
              <TabsList className="flex-wrap">
                <TabsTrigger value="marks">KPI marks</TabsTrigger>
                {isHod && <TabsTrigger value="competencies">Competencies</TabsTrigger>}
                {isHod && <TabsTrigger value="achievements">Achievements</TabsTrigger>}
                {isHod && <TabsTrigger value="grade">Grade & recommendation</TabsTrigger>}
              </TabsList>

              <TabsContent value="marks" className="space-y-4">
                {detail && (
                  <KpiMarksTable lines={detail.kpiLines} role={evaluatorRole} onSave={handleSaveMarks} />
                )}
                {myReviewId && myReviewStatus === "Draft" && (
                  <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>
                    {isSubmittingReview ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit {evaluatorRole} review
                  </Button>
                )}
                {myReviewStatus === "Submitted" && <StatusBadge status="Submitted" />}
              </TabsContent>

              {isHod && (
                <TabsContent value="competencies">
                  <CompetenciesForm
                    competencies={competencies}
                    evaluatorRole={evaluatorRole}
                    onSave={handleSaveCompetencies}
                  />
                </TabsContent>
              )}

              {isHod && (
                <TabsContent value="achievements">
                  <AchievementsForm
                    achievements={detail?.achievements.map((a) => ({
                      achievementId: a.achievementId,
                      hodEvaluationId: detail.hodEvaluationId ?? 0,
                      achievementTypeId: 0,
                      achievementTypeName: a.achievementTypeName,
                      title: a.title,
                      marks: a.marks,
                      attachment: a.attachment,
                      remarks: a.remarks,
                    })) ?? []}
                    types={achievementTypes}
                    onAdd={handleAddAchievement}
                    onDelete={handleDeleteAchievement}
                    onUpload={handleUploadAchievementFile}
                  />
                </TabsContent>
              )}

              {isHod && (
                <TabsContent value="grade" className="space-y-6">
                  <GradeCard grade={detail?.grade ?? null} onGenerate={handleGenerateGrade} />
                  <RecommendationForm
                    initialType={detail?.recommendationTypes[0]}
                    initialNote={detail?.recommendationNote ?? undefined}
                    onSave={handleSaveRecommendation}
                  />
                  {detail?.resultId && <ReportButtons resultId={detail.resultId} />}
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
}
