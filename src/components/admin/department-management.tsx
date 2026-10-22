"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { Department } from "@/types";
import { PageHeader, EmptyState } from "@/components/shared/display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Loader2, Pencil, PlusCircle, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

const emptyForm = { departmentName: "", description: "" };

export function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDepartments = useCallback(() => {
    apiClient
      .getDepartments()
      .then((response) => setDepartments(response.data))
      .catch(() => {
        setDepartments([]);
        toast.error("Could not load departments.");
      });
  }, []);

  useEffect(() => loadDepartments(), [loadDepartments]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(department: Department) {
    setEditing(department);
    setForm({
      departmentName: department.departmentName,
      description: department.description ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    const departmentName = form.departmentName.trim();
    if (!departmentName) {
      toast.error("Department name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = { departmentName, description: form.description.trim() };
      if (editing) {
        await apiClient.updateDepartment(editing.departmentId, payload);
        toast.success("Department updated.");
      } else {
        await apiClient.createDepartment(payload);
        toast.success("Department created.");
      }
      setDialogOpen(false);
      loadDepartments();
    } catch {
      toast.error(`Could not ${editing ? "update" : "create"} department.`);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(department: Department) {
    if (!confirm(`Delete ${department.departmentName}? This cannot be undone.`)) return;
    setDeletingId(department.departmentId);
    try {
      await apiClient.deleteDepartment(department.departmentId);
      toast.success("Department deleted.");
      loadDepartments();
    } catch {
      toast.error("Could not delete department. It may still have assigned users.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Create and manage the departments available when assigning users."
        action={
          <Button onClick={openCreate}>
            <PlusCircle className="h-4 w-4" /> Add department
          </Button>
        }
      />

      {!departments && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading departments…
        </div>
      )}

      {departments?.length === 0 && (
        <EmptyState
          title="No departments found"
          description="Create your first department to assign it to users."
          action={<Button onClick={openCreate}>Add department</Button>}
        />
      )}

      {!!departments?.length && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <Card key={department.departmentId}>
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-display font-semibold">{department.departmentName}</h2>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" /> {department.userCount} users
                      </p>
                    </div>
                  </div>
                </div>
                <p className="min-h-10 text-sm text-muted-foreground">
                  {department.description || "No description provided."}
                </p>
                <div className="mt-auto flex justify-end gap-2 border-t pt-4">
                  <Button variant="outline" size="sm" onClick={() => openEdit(department)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === department.departmentId}
                    onClick={() => handleDelete(department)}
                  >
                    {deletingId === department.departmentId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit department" : "Add department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="department-name">Department name</Label>
              <Input
                id="department-name"
                value={form.departmentName}
                onChange={(event) => setForm((current) => ({ ...current, departmentName: event.target.value }))}
                placeholder="Information Technology"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="department-description">Description</Label>
              <Textarea
                id="department-description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Handles company technology operations"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
