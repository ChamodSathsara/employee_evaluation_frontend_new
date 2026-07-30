"use client";

import { useState } from "react";
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
import { GradeBadge } from "@/components/shared/display";
import { RECOMMENDATION_TYPES, type RecommendationType } from "@/types";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import {
  Loader2,
  FileDown,
  FileSpreadsheet,
  Sparkles,
  MessageSquarePlus,
  ClipboardList,
} from "lucide-react";

export function GradeCard({
  grade,
  onGenerate,
}: {
  grade: string | null;
  onGenerate: () => Promise<void>;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      await onGenerate();
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Final grade</CardTitle>
        <CardDescription>
          KPI marks 80% · Evaluation of competencies 10% · Special achievements 10% − attendance penalty
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <GradeBadge grade={grade} />
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {grade ? "Re-generate grade" : "Generate grade"}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * HOD recommendation. The backend only accepts recommendationType values from a fixed
 * list (RecommendationService.AllowedTypes) — Promotion, Salary Increment, Training,
 * Extend Probation, No Increment — any other string is rejected with 400. A free-text
 * "General comment" box alone (as the previous version had) does not match the backend
 * model, so a type selector is required here.
 */
export function RecommendationForm({
  initialType,
  initialNote,
  onSave,
}: {
  initialType?: string;
  initialNote?: string;
  onSave: (recommendationType: RecommendationType, recommendationNote: string) => Promise<void>;
}) {
  const [recommendationType, setRecommendationType] = useState<string>(initialType ?? "");
  const [note, setNote] = useState(initialNote ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!recommendationType) return;
    setIsSaving(true);
    try {
      await onSave(recommendationType as RecommendationType, note);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendation</CardTitle>
        <CardDescription>e.g. &ldquo;This employee is suitable for promotion.&rdquo;</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Recommendation type</Label>
          <Select value={recommendationType} onValueChange={setRecommendationType}>
            <SelectTrigger>
              <SelectValue placeholder="Select a recommendation" />
            </SelectTrigger>
            <SelectContent>
              {RECOMMENDATION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Note (optional)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add supporting detail for this recommendation"
            rows={4}
          />
        </div>
        <Button onClick={handleSave} disabled={isSaving || !recommendationType}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
          Save recommendation
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Attendance summary. Fields match UpsertAttendanceSummaryDto exactly (annualLeave,
 * casualLeave, medicalLeave, noPayLeave, lateAttendance). The penalty is calculated
 * server-side (No-Pay: 2-3d=-2, 4-5d=-5, >5d=-10; Late: 1-10d=-1, 11-20d=-3, >20d=-5) —
 * it is shown read-only here, never submitted by the client.
 */
export function AttendanceForm({
  onSave,
  initial,
  calculatedPenalty,
}: {
  initial?: {
    annualLeave: number;
    casualLeave: number;
    medicalLeave: number;
    noPayLeave: number;
    lateAttendance: number;
  };
  calculatedPenalty?: number | null;
  onSave: (input: {
    annualLeave: number;
    casualLeave: number;
    medicalLeave: number;
    noPayLeave: number;
    lateAttendance: number;
  }) => Promise<void>;
}) {
  const [annualLeave, setAnnualLeave] = useState(String(initial?.annualLeave ?? "0"));
  const [casualLeave, setCasualLeave] = useState(String(initial?.casualLeave ?? "0"));
  const [medicalLeave, setMedicalLeave] = useState(String(initial?.medicalLeave ?? "0"));
  const [noPayLeave, setNoPayLeave] = useState(String(initial?.noPayLeave ?? "0"));
  const [lateAttendance, setLateAttendance] = useState(String(initial?.lateAttendance ?? "0"));
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave({
        annualLeave: Number(annualLeave),
        casualLeave: Number(casualLeave),
        medicalLeave: Number(medicalLeave),
        noPayLeave: Number(noPayLeave),
        lateAttendance: Number(lateAttendance),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance summary</CardTitle>
        <CardDescription>
          Record leave and lateness for this period. The attendance penalty is calculated
          automatically{calculatedPenalty != null ? ` (currently −${calculatedPenalty})` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Annual leave</Label>
            <Input type="number" min={0} value={annualLeave} onChange={(e) => setAnnualLeave(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Casual leave</Label>
            <Input type="number" min={0} value={casualLeave} onChange={(e) => setCasualLeave(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Medical leave</Label>
            <Input type="number" min={0} value={medicalLeave} onChange={(e) => setMedicalLeave(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>No-pay leave</Label>
            <Input type="number" min={0} value={noPayLeave} onChange={(e) => setNoPayLeave(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Late attendance (days)</Label>
            <Input type="number" min={0} value={lateAttendance} onChange={(e) => setLateAttendance(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
          Save & re-submit
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Downloads the PDF/Excel report for a processed evaluation result. Must go through
 * apiClient.downloadReport (authenticated blob fetch) rather than a plain <a href> —
 * /api/reports/export/* requires a bearer token and a relative href would hit the
 * Next.js server, not the backend.
 */
export function ReportButtons({ resultId }: { resultId: number }) {
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);

  async function handleDownload(format: "pdf" | "excel") {
    setDownloading(format);
    try {
      await apiClient.downloadReport(
        resultId,
        format,
        `EvaluationReport_${resultId}.${format === "pdf" ? "pdf" : "xlsx"}`
      );
    } catch {
      toast.error(`Failed to download the ${format.toUpperCase()} report.`);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => handleDownload("pdf")} disabled={downloading !== null}>
        {downloading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        Download PDF
      </Button>
      <Button variant="outline" onClick={() => handleDownload("excel")} disabled={downloading !== null}>
        {downloading === "excel" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Download Excel
      </Button>
    </div>
  );
}
