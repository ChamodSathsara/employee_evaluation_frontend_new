"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { Designation } from "@/types";
import { PageHeader, EmptyState } from "@/components/shared/display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BriefcaseBusiness, Loader2, Pencil, PlusCircle, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export function DesignationManagement() {
  const [designations, setDesignations] = useState<Designation[] | null>(null);
  const [editing, setEditing] = useState<Designation | null>(null);
  const [designationName, setDesignationName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDesignations = useCallback(() => {
    apiClient
      .getDesignations()
      .then((response) => setDesignations(response.data))
      .catch(() => {
        setDesignations([]);
        toast.error("Could not load designations.");
      });
  }, []);

  useEffect(() => loadDesignations(), [loadDesignations]);

  function openCreate() {
    setEditing(null);
    setDesignationName("");
    setDialogOpen(true);
  }

  function openEdit(designation: Designation) {
    setEditing(designation);
    setDesignationName(designation.designationName);
    setDialogOpen(true);
  }

  async function handleSave() {
    const name = designationName.trim();
    if (!name) {
      toast.error("Designation name is required.");
      return;
    }
    setIsSaving(true);
    try {
      if (editing) {
        await apiClient.updateDesignation(editing.designationId, { designationName: name });
        toast.success("Designation updated.");
      } else {
        await apiClient.createDesignation({ designationName: name });
        toast.success("Designation created.");
      }
      setDialogOpen(false);
      loadDesignations();
    } catch {
      toast.error(`Could not ${editing ? "update" : "create"} designation.`);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(designation: Designation) {
    if (!confirm(`Delete ${designation.designationName}? This cannot be undone.`)) return;
    setDeletingId(designation.designationId);
    try {
      await apiClient.deleteDesignation(designation.designationId);
      toast.success("Designation deleted.");
      loadDesignations();
    } catch {
      toast.error("Could not delete designation. It may still have assigned users.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Designations"
        description="Create and manage the job titles available when assigning users."
        action={
          <Button onClick={openCreate}>
            <PlusCircle className="h-4 w-4" /> Add designation
          </Button>
        }
      />

      {!designations && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading designations…
        </div>
      )}
      {designations?.length === 0 && (
        <EmptyState
          title="No designations found"
          description="Create your first designation to assign it to users."
          action={<Button onClick={openCreate}>Add designation</Button>}
        />
      )}
      {!!designations?.length && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designations.map((designation) => (
            <Card key={designation.designationId}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display font-semibold">{designation.designationName}</h2>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> {designation.userCount} users
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(designation)} aria-label={`Edit ${designation.designationName}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  disabled={deletingId === designation.designationId}
                  onClick={() => handleDelete(designation)}
                  aria-label={`Delete ${designation.designationName}`}
                >
                  {deletingId === designation.designationId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit designation" : "Add designation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="designation-name">Designation name</Label>
            <Input
              id="designation-name"
              value={designationName}
              onChange={(event) => setDesignationName(event.target.value)}
              placeholder="Software Engineer"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create designation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
