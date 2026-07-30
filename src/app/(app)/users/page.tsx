"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import type {
  AdminUser,
  Department,
  Designation,
  Role,
  CreateUserInput,
  UpdateUserInput,
} from "@/types";
import { PageHeader, EmptyState } from "@/components/shared/display";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Loader2,
  PlusCircle,
  Pencil,
  Trash2,
  MoreVertical,
  Power,
  Mail,
  Building2,
  UserCircle2,
} from "lucide-react";

const NONE = "none";

type UserFormState = {
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number;
  departmentId: number | null;
  designationId: number | null;
  reportsTo: number | null;
};

const emptyForm: UserFormState = {
  employeeNo: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  roleId: 6,
  departmentId: null,
  designationId: null,
  reportsTo: null,
};

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [managers, setManagers] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);

  function loadUsers() {
    apiClient
      .getUsers({ pageSize: 100 })
      .then((res) => setUsers(res.data.items))
      .catch(() => setUsers([]));
  }

  function loadManagers() {
    apiClient
      .getManagementUsers()
      .then((res) => setManagers(res.data))
      .catch(() => {});
  }

  useEffect(() => {
    loadUsers();
    loadManagers();
    apiClient
      .getDepartments()
      .then((res) => setDepartments(res.data))
      .catch(() => {});
    apiClient
      .getDesignations()
      .then((res) => setDesignations(res.data))
      .catch(() => {});
    apiClient
      .getRoles()
      .then((res) => setRoles(res.data))
      .catch(() => {});
  }, []);

  function openCreate() {
    setEditingUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(u: AdminUser) {
    setEditingUser(u);
    setForm({
      employeeNo: u.employeeNo,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: "",
      roleId: u.roleId,
      departmentId: u.departmentId,
      designationId: u.designationId,
      reportsTo: u.reportsTo,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      if (editingUser) {
        const payload: UpdateUserInput = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          roleId: form.roleId,
          departmentId: form.departmentId,
          designationId: form.designationId,
          reportsTo: form.reportsTo,
        };
        await apiClient.updateUser(editingUser.userId, payload);
        toast.success("User updated.");
      } else {
        const payload: CreateUserInput = {
          employeeNo: form.employeeNo,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          roleId: form.roleId,
          departmentId: form.departmentId,
          designationId: form.designationId,
          reportsTo: form.reportsTo,
        };
        await apiClient.createUser(payload);
        toast.success("User created.");
      }
      setDialogOpen(false);
      loadUsers();
      loadManagers();
    } catch {
      toast.error("Could not save user.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(userId: number) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await apiClient.deleteUser(userId);
      toast.success("User deleted.");
      loadUsers();
      loadManagers();
    } catch {
      toast.error("Could not delete user.");
    }
  }

  async function handleToggleActive(u: AdminUser) {
    const action = u.isActive ? "Deactivate" : "Activate";
    if (!confirm(`${action} ${u.firstName} ${u.lastName}?`)) return;
    setPendingStatusId(u.userId);
    try {
      await apiClient.updateUserStatus(u.userId, !u.isActive);
      toast.success(u.isActive ? "User deactivated." : "User activated.");
      loadUsers();
    } catch {
      toast.error("Could not update status.");
    } finally {
      setPendingStatusId(null);
    }
  }

  const reportsToOptions = managers.filter(
    (m) => !editingUser || m.userId !== editingUser.userId,
  );

  return (
    <div>
      <PageHeader
        title="Users"
        description="Create and manage employee accounts, roles, and departments."
        action={
          <Button onClick={openCreate}>
            <PlusCircle className="h-4 w-4" /> Add user
          </Button>
        }
      />

      {!users && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading users…
        </div>
      )}
      {users && users.length === 0 && <EmptyState title="No users found" />}

      {users && users.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {users.map((u) => (
            <Card key={u.userId} className="relative">
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {initials(u.firstName, u.lastName)}
                  </div>
                  <div>
                    <p className="font-medium capitalize leading-tight">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {u.employeeNo}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(u)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleActive(u)}
                      disabled={pendingStatusId === u.userId}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {u.isActive ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(u.userId)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="space-y-2 pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{u.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {u.departmentName ?? "No department"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {u.managerName ?? "No manager"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Badge variant="secondary">{u.roleName}</Badge>
                  {u.designationName && (
                    <Badge variant="outline">{u.designationName}</Badge>
                  )}
                  <Badge variant={u.isActive ? "success" : "outline"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit user" : "Add user"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Employee No.</Label>
              <Input
                value={form.employeeNo}
                disabled={!!editingUser}
                onChange={(e) =>
                  setForm((f) => ({ ...f, employeeNo: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={String(form.roleId)}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, roleId: Number(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.roleId} value={String(r.roleId)}>
                      {r.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reports To</Label>
              <Select
                value={form.reportsTo ? String(form.reportsTo) : NONE}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    reportsTo: v === NONE ? null : Number(v),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {reportsToOptions.map((m) => (
                    <SelectItem key={m.userId} value={String(m.userId)}>
                      {m.firstName} {m.lastName} ({m.roleName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={form.departmentId ? String(form.departmentId) : NONE}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    departmentId: v === NONE ? null : Number(v),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {departments.map((d) => (
                    <SelectItem
                      key={d.departmentId}
                      value={String(d.departmentId)}
                    >
                      {d.departmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Select
                value={form.designationId ? String(form.designationId) : NONE}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    designationId: v === NONE ? null : Number(v),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {designations.map((d) => (
                    <SelectItem
                      key={d.designationId}
                      value={String(d.designationId)}
                    >
                      {d.designationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingUser && (
              <div className="space-y-1.5">
                <Label>Temporary password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  minLength={8}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingUser ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
