"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import type {
  EvaluationPeriod,
  TeamMember,
  CreateKpiDetailInput,
  KpiAssignment,
} from "@/types";
import { PageHeader, StatusBadge } from "@/components/shared/display";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  PlusCircle,
  Trash2,
  Send,
  Pencil,
  Upload,
  RotateCcw,
} from "lucide-react";

function CreateKpiInner() {
  const searchParams = useSearchParams();
  const preselectedEmployeeId = searchParams.get("employeeId");

  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [employeeId, setEmployeeId] = useState<string>(
    preselectedEmployeeId ?? "",
  );
  const [periodId, setPeriodId] = useState<string>("");
  const [rows, setRows] = useState<CreateKpiDetailInput[]>([
    { kpiName: "", description: "", weightPercentage: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [recentKpis, setRecentKpis] = useState<KpiAssignment[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [deletingRecentId, setDeletingRecentId] = useState<number | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<KpiAssignment | null>(null);

  // ---- details / edit dialog state ----
  const [selectedKpi, setSelectedKpi] = useState<KpiAssignment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editRows, setEditRows] = useState<CreateKpiDetailInput[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    apiClient
      .getEvaluationPeriods()
      .then((res) => setPeriods(res.data))
      .catch(() => {});
    // The backend requires the KPI target to be the creator's direct report,
    // regardless of role (CEO->Manager, Manager->HOD, HOD->Supervisor|Employee,
    // Supervisor->Employee — see KpiAssignmentService.ValidateDirectReport). There is no
    // department-wide picker on the backend, so every role uses the same "my team" source.
    apiClient.getMyTeam().then((res) => setTeam(res.data));
  }, []);

  function loadRecentKpis() {
    setIsLoadingRecent(true);
    apiClient
      .getMyTeamKpis()
      .then((res) => setRecentKpis(res.data))
      .catch(() => setRecentKpis([]))
      .finally(() => setIsLoadingRecent(false));
  }

  useEffect(() => {
    apiClient
      .getMyTeamKpis()
      .then((res) => setRecentKpis(res.data))
      .catch(() => setRecentKpis([]))
      .finally(() => setIsLoadingRecent(false));
  }, []);

  const totalWeight = rows.reduce(
    (sum, r) => sum + (Number(r.weightPercentage) || 0),
    0,
  );

  function updateRow(index: number, patch: Partial<CreateKpiDetailInput>) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { kpiName: "", description: "", weightPercentage: 0 },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!employeeId || !periodId) {
      toast.error("Select an employee and an evaluation period.");
      return;
    }
    if (rows.some((r) => !r.kpiName || !r.weightPercentage)) {
      toast.error("Fill in a name and weight for every KPI.");
      return;
    }
    if (totalWeight !== 100) {
      toast.error(`Total weight must equal 100%. Currently ${totalWeight}%.`);
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.createKpi({
        employeeId: Number(employeeId),
        periodId: Number(periodId),
        details: rows,
      });
      toast.success("KPI assignment created as Draft.");
      setRows([{ kpiName: "", description: "", weightPercentage: 0 }]);
      loadRecentKpis();
    } catch {
      toast.error("Could not create KPI assignment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---- details dialog handlers ----

  function openDetails(kpi: KpiAssignment) {
    setSelectedKpi(kpi);
    setEditMode(false);
    setEditRows(
      kpi.details.map((d) => ({
        kpiName: d.kpiName,
        description: d.description,
        weightPercentage: d.weightPercentage,
      })),
    );
    setDetailsOpen(true);
  }

  function updateEditRow(index: number, patch: Partial<CreateKpiDetailInput>) {
    setEditRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function addEditRow() {
    setEditRows((prev) => [
      ...prev,
      { kpiName: "", description: "", weightPercentage: 0 },
    ]);
  }

  function removeEditRow(index: number) {
    setEditRows((prev) => prev.filter((_, i) => i !== index));
  }

  const editTotalWeight = editRows.reduce(
    (sum, r) => sum + (Number(r.weightPercentage) || 0),
    0,
  );

  async function handleSaveEdit() {
    if (!selectedKpi) return;
    if (editRows.some((r) => !r.kpiName || !r.weightPercentage)) {
      toast.error("Fill in a name and weight for every KPI.");
      return;
    }
    if (editTotalWeight !== 100) {
      toast.error(
        `Total weight must equal 100%. Currently ${editTotalWeight}%.`,
      );
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await apiClient.updateKpi(selectedKpi.assignmentId, {
        details: editRows,
      });
      toast.success("KPI assignment updated.");
      setSelectedKpi(res.data);
      setEditMode(false);
      loadRecentKpis();
    } catch {
      toast.error("Could not update KPI assignment.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handlePublish() {
    if (!selectedKpi) return;
    setIsChangingStatus(true);
    try {
      const res = await apiClient.publishKpi(selectedKpi.assignmentId);
      toast.success("KPI assignment published.");
      setSelectedKpi(res.data);
      loadRecentKpis();
    } catch {
      toast.error("Could not publish KPI assignment.");
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function handleRevertToDraft() {
    if (!selectedKpi) return;
    setIsChangingStatus(true);
    try {
      const res = await apiClient.revertKpiToDraft(selectedKpi.assignmentId);
      toast.success("KPI assignment reverted to Draft.");
      setSelectedKpi(res.data);
      loadRecentKpis();
    } catch {
      toast.error("Could not revert KPI assignment to Draft.");
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function confirmDeleteKpi() {
    if (!deleteCandidate) return;
    const assignmentId = deleteCandidate.assignmentId;
    setIsDeleting(true);
    setDeletingRecentId(assignmentId);
    try {
      await apiClient.deleteKpi(assignmentId);
      toast.success("KPI assignment deleted.");
      setRecentKpis((current) =>
        current.filter((item) => item.assignmentId !== assignmentId),
      );
      if (selectedKpi?.assignmentId === assignmentId) {
        setDetailsOpen(false);
        setSelectedKpi(null);
      }
      setDeleteCandidate(null);
    } catch {
      toast.error("Could not delete KPI assignment.");
    } finally {
      setIsDeleting(false);
      setDeletingRecentId(null);
    }
  }

  const isDraft = selectedKpi?.status === "Draft";

  return (
    <div>
      <PageHeader
        title="Create KPI"
        description="Assign weighted KPIs to an employee for an evaluation period."
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>New KPI assignment</CardTitle>
            <CardDescription>
              Weights across all KPIs must add up to 100%.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Employee</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {team.map((m, key) => (
                      <SelectItem key={key} value={String(m.userId)}>
                        {m.firstName} {m.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Evaluation period</Label>
                <Select value={periodId} onValueChange={setPeriodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((p, index) => (
                      <SelectItem key={index} value={String(p.periodId)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {rows.map((row, i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      KPI {i + 1}
                    </span>
                    {rows.length > 1 && (
                      <button
                        onClick={() => removeRow(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Input
                      placeholder="KPI name"
                      value={row.kpiName}
                      onChange={(e) =>
                        updateRow(i, { kpiName: e.target.value })
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Weight %"
                      className="sm:w-28"
                      value={row.weightPercentage || ""}
                      onChange={(e) =>
                        updateRow(i, {
                          weightPercentage: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <Textarea
                    className="mt-3"
                    placeholder="Description"
                    value={row.description ?? ""}
                    onChange={(e) =>
                      updateRow(i, { description: e.target.value })
                    }
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addRow}>
                <PlusCircle className="h-4 w-4" /> Add another KPI
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted px-4 py-2.5 text-sm">
              <span>Total weight</span>
              <span
                className={`font-mono-data font-semibold ${totalWeight === 100 ? "text-success" : "text-destructive"}`}
              >
                {totalWeight}%
              </span>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Create KPI assignment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently created</CardTitle>
            <CardDescription>
              KPI assignments created for your team. Click one to view or edit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingRecent && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </div>
            )}
            {!isLoadingRecent && recentKpis.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing created yet.
              </p>
            )}
            {!isLoadingRecent &&
              recentKpis.map((a) => (
                <div
                  key={a.assignmentId}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetails(a)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openDetails(a);
                    }
                  }}
                  className="w-full cursor-pointer rounded-md border border-border p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{a.employeeName}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={a.status} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingRecentId === a.assignmentId}
                        aria-label={`Delete KPI assignment for ${a.employeeName}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteCandidate(a);
                        }}
                      >
                        {deletingRecentId === a.assignmentId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.periodName} · {a.details.length} KPIs · {a.totalWeight}%
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* ---- Details / Edit dialog ---- */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedKpi(null);
            setEditMode(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedKpi && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle>{selectedKpi.employeeName}</DialogTitle>
                  <StatusBadge status={selectedKpi.status} />
                </div>
                <DialogDescription>
                  {selectedKpi.periodName} · {selectedKpi.totalWeight}% total
                  weight
                </DialogDescription>
              </DialogHeader>

              {!editMode ? (
                <div className="space-y-3">
                  {selectedKpi.details.map((d) => (
                    <div
                      key={d.detailId}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{d.kpiName}</p>
                        <span className="font-mono-data text-sm text-muted-foreground">
                          {d.weightPercentage}%
                        </span>
                      </div>
                      {d.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {d.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {editRows.map((row, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          KPI {i + 1}
                        </span>
                        {editRows.length > 1 && (
                          <button
                            onClick={() => removeEditRow(i)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <Input
                          placeholder="KPI name"
                          value={row.kpiName}
                          onChange={(e) =>
                            updateEditRow(i, { kpiName: e.target.value })
                          }
                        />
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Weight %"
                          className="sm:w-28"
                          value={row.weightPercentage || ""}
                          onChange={(e) =>
                            updateEditRow(i, {
                              weightPercentage: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <Textarea
                        className="mt-3"
                        placeholder="Description"
                        value={row.description ?? ""}
                        onChange={(e) =>
                          updateEditRow(i, { description: e.target.value })
                        }
                      />
                    </div>
                  ))}
                  <Button variant="outline" onClick={addEditRow}>
                    <PlusCircle className="h-4 w-4" /> Add another KPI
                  </Button>
                  <div className="flex items-center justify-between rounded-md bg-muted px-4 py-2.5 text-sm">
                    <span>Total weight</span>
                    <span
                      className={`font-mono-data font-semibold ${editTotalWeight === 100 ? "text-success" : "text-destructive"}`}
                    >
                      {editTotalWeight}%
                    </span>
                  </div>
                </div>
              )}

              <DialogFooter className="flex-wrap gap-2 sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {isDraft && !editMode && (
                    <Button variant="outline" onClick={() => setEditMode(true)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                  )}
                  {!editMode && (
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteCandidate(selectedKpi)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  )}
                  {isDraft ? (
                    <Button onClick={handlePublish} disabled={isChangingStatus}>
                      {isChangingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Publish
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRevertToDraft}
                      disabled={isChangingStatus}
                    >
                      {isChangingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Revert to Draft
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                        {isSavingEdit && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Save changes
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setDetailsOpen(false)}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteCandidate}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteCandidate(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle>Delete KPI assignment?</DialogTitle>
            <DialogDescription>
              {deleteCandidate && (
                <>
                  The KPI assignment for {deleteCandidate.employeeName} in{" "}
                  {deleteCandidate.periodName} will be permanently deleted.
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCandidate(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteKpi}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CreateKpiPage() {
  return (
    <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin" />}>
      <CreateKpiInner />
    </Suspense>
  );
}
