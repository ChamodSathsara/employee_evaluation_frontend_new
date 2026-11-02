"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { ROLE } from "@/types";
import type {
  AdminUser,
  Company,
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
import { BulkImportDialog } from "@/components/admin/bulk-import-dialog";
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
const ALL = "all";

type UserFormState = {
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number;
  companyId: number | null;
  departmentId: number | null;
  designationId: number | null;
  reportedSupervisorId: number | null;
  reportedHodId: number | null;
};

const emptyForm: UserFormState = {
  employeeNo: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  roleId: 6,
  companyId: null,
  departmentId: null,
  designationId: null,
  reportedSupervisorId: null,
  reportedHodId: null,
};

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [managers, setManagers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);
  const [companyFilter, setCompanyFilter] = useState(ALL);
  const [departmentFilter, setDepartmentFilter] = useState(ALL);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [designationDialogOpen, setDesignationDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentDescription, setNewDepartmentDescription] = useState("");
  const [newDesignationName, setNewDesignationName] = useState("");
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [isCreatingDesignation, setIsCreatingDesignation] = useState(false);

  function loadUsers(companyId: string, departmentId: string) {
    apiClient
      .getUsers({
        companyId: companyId === ALL ? undefined : Number(companyId),
        departmentId: departmentId === ALL ? undefined : Number(departmentId),
        pageNumber: 1,
        pageSize: 100,
      })
      .then((res) => setUsers(res.data.items))
      .catch(() => setUsers([]));
  }

  function loadManagers() {
    apiClient
      .getManagementUsers()
      .then((res) => setManagers(res.data))
      .catch(() => {});
  }

  function loadDepartments() {
    return apiClient.getDepartments().then((res) => {
      setDepartments(res.data);
      return res.data;
    });
  }

  function loadCompanies() {
    return apiClient.getCompanies().then((res) => {
      setCompanies(res.data);
      return res.data;
    });
  }

  function loadDesignations() {
    return apiClient.getDesignations().then((res) => {
      setDesignations(res.data);
      return res.data;
    });
  }

  useEffect(() => {
    loadUsers(ALL, ALL);
    loadManagers();
    loadCompanies().catch(() => {});
    loadDepartments().catch(() => {});
    loadDesignations().catch(() => {});
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
    const reportingManager = managers.find(
      (manager) => manager.userId === u.reportsTo,
    );

    setEditingUser(u);
    setForm({
      employeeNo: u.employeeNo,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: "",
      roleId: u.roleId,
      companyId: u.companyId,
      departmentId: u.departmentId,
      designationId: u.designationId,
      reportedSupervisorId:
        reportingManager?.roleId === ROLE.SUPERVISOR ? u.reportsTo : null,
      reportedHodId:
        reportingManager?.roleId === ROLE.HOD ? u.reportsTo : null,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.companyId) {
      toast.error("Company is required.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        const payload: UpdateUserInput = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          roleId: form.roleId,
          companyId: form.companyId,
          departmentId: form.departmentId,
          designationId: form.designationId,
          reportedSupervisorId:
            form.roleId === ROLE.EMPLOYEE ? form.reportedSupervisorId : null,
          reportedHodId:
            form.roleId === ROLE.EMPLOYEE ? form.reportedHodId : null,
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
          companyId: form.companyId,
          departmentId: form.departmentId,
          designationId: form.designationId,
          reportedSupervisorId: form.reportedSupervisorId,
          reportedHodId: form.reportedHodId,
        };
        await apiClient.createUser(payload);
        toast.success("User created.");
      }
      setDialogOpen(false);
      loadUsers(companyFilter, departmentFilter);
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
      loadUsers(companyFilter, departmentFilter);
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
      loadUsers(companyFilter, departmentFilter);
    } catch {
      toast.error("Could not update status.");
    } finally {
      setPendingStatusId(null);
    }
  }

  async function handleCreateDepartment() {
    const departmentName = newDepartmentName.trim();
    if (!departmentName) {
      toast.error("Department name is required.");
      return;
    }

    setIsCreatingDepartment(true);
    try {
      const response = await apiClient.createDepartment({
        departmentName,
        description: newDepartmentDescription.trim(),
      });
      const created = response.data;
      setDepartments((current) => [...current, created]);
      setForm((current) => ({ ...current, departmentId: created.departmentId }));
      setDepartmentDialogOpen(false);
      setNewDepartmentName("");
      setNewDepartmentDescription("");
      toast.success("Department created and selected.");
    } catch {
      toast.error("Could not create department.");
    } finally {
      setIsCreatingDepartment(false);
    }
  }

  function openCreateCompany() {
    setEditingCompany(null);
    setNewCompanyName("");
    setCompanyDialogOpen(true);
  }

  function openEditCompany(company: Company) {
    setEditingCompany(company);
    setNewCompanyName(company.companyName);
    setCompanyDialogOpen(true);
  }

  function handleCompanyDialogChange(open: boolean) {
    if (isSavingCompany) return;
    setCompanyDialogOpen(open);
    if (!open) {
      setEditingCompany(null);
      setNewCompanyName("");
    }
  }

  async function handleSaveCompany() {
    const companyName = newCompanyName.trim();
    if (!companyName) {
      toast.error("Company name is required.");
      return;
    }

    setIsSavingCompany(true);
    try {
      if (editingCompany) {
        const response = await apiClient.updateCompany(editingCompany.companyId, {
          companyName,
        });
        const updated = response.data;
        setCompanies((current) =>
          current.map((company) =>
            company.companyId === updated.companyId ? updated : company,
          ),
        );
        setUsers((current) =>
          current?.map((user) =>
            user.companyId === updated.companyId
              ? { ...user, companyName: updated.companyName }
              : user,
          ) ?? null,
        );
        toast.success("Company updated.");
      } else {
        const response = await apiClient.createCompany({ companyName });
        const created = response.data;
        setCompanies((current) => [...current, created]);
        setForm((current) => ({ ...current, companyId: created.companyId }));
        toast.success("Company created and selected.");
      }
      setCompanyDialogOpen(false);
      setEditingCompany(null);
      setNewCompanyName("");
    } catch {
      toast.error(editingCompany ? "Could not update company." : "Could not create company.");
    } finally {
      setIsSavingCompany(false);
    }
  }

  async function handleCreateDesignation() {
    const designationName = newDesignationName.trim();
    if (!designationName) {
      toast.error("Designation name is required.");
      return;
    }

    setIsCreatingDesignation(true);
    try {
      const response = await apiClient.createDesignation({ designationName });
      const created = response.data;
      setDesignations((current) => [...current, created]);
      setForm((current) => ({ ...current, designationId: created.designationId }));
      setDesignationDialogOpen(false);
      setNewDesignationName("");
      toast.success("Designation created and selected.");
    } catch {
      toast.error("Could not create designation.");
    } finally {
      setIsCreatingDesignation(false);
    }
  }

  const supervisorOptions = managers.filter(
    (manager) =>
      manager.roleId === ROLE.SUPERVISOR &&
      (!form.companyId || manager.companyId === form.companyId),
  );
  const hodOptions = managers.filter(
    (manager) =>
      manager.roleId === ROLE.HOD &&
      (!form.companyId || manager.companyId === form.companyId),
  );
  const filteredCompany = companies.find(
    (company) => String(company.companyId) === companyFilter,
  );
  const formCompany = companies.find(
    (company) => company.companyId === form.companyId,
  );

  return (
    <div>
      <PageHeader
        title="Users"
        description="Create and manage employee accounts, roles, and departments."
        action={
          <div className="flex flex-wrap gap-2">
            <BulkImportDialog
              onImported={() => {
                loadUsers(companyFilter, departmentFilter);
                loadManagers();
                loadCompanies().catch(() => {});
                loadDepartments().catch(() => {});
                loadDesignations().catch(() => {});
              }}
            />
            <Button variant="outline" onClick={openCreateCompany}>
              <Building2 className="h-4 w-4" /> Add company
            </Button>
            <Button onClick={openCreate}>
              <PlusCircle className="h-4 w-4" /> Add user
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid max-w-3xl gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company-filter">Filter by company</Label>
          <div className="flex gap-2">
            <Select
              value={companyFilter}
              onValueChange={(value) => {
                setCompanyFilter(value);
                loadUsers(value, departmentFilter);
              }}
            >
              <SelectTrigger id="company-filter" className="flex-1">
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.companyId} value={String(company.companyId)}>
                    {company.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredCompany && (
              <Button variant="outline" onClick={() => openEditCompany(filteredCompany)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="department-filter">Filter by department</Label>
          <Select
            value={departmentFilter}
            onValueChange={(value) => {
              setDepartmentFilter(value);
              loadUsers(companyFilter, value);
            }}
          >
            <SelectTrigger id="department-filter">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All departments</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.departmentId} value={String(department.departmentId)}>
                  {department.departmentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                  <span className="truncate">{u.companyName}</span>
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
              <div className="flex items-center justify-between gap-2">
                <Label>Company</Label>
                <div className="flex items-center gap-1">
                  {formCompany && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto px-2 py-1 text-xs"
                      onClick={() => openEditCompany(formCompany)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs"
                    onClick={openCreateCompany}
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Create
                  </Button>
                </div>
              </div>
              <Select
                value={form.companyId ? String(form.companyId) : undefined}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    companyId: Number(value),
                    reportedSupervisorId: null,
                    reportedHodId: null,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.companyId} value={String(company.companyId)}>
                      {company.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.roleId === ROLE.EMPLOYEE && (
              <>
                <div className="space-y-1.5">
                  <Label>Reported Supervisor</Label>
                  <Select
                    value={
                      form.reportedSupervisorId
                        ? String(form.reportedSupervisorId)
                        : NONE
                    }
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        reportedSupervisorId:
                          value === NONE ? null : Number(value),
                        reportedHodId:
                          value === NONE ? current.reportedHodId : null,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {supervisorOptions.map((supervisor) => (
                        <SelectItem
                          key={supervisor.userId}
                          value={String(supervisor.userId)}
                        >
                          {supervisor.firstName} {supervisor.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Reported HOD</Label>
                  <Select
                    value={form.reportedHodId ? String(form.reportedHodId) : NONE}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        reportedHodId: value === NONE ? null : Number(value),
                        reportedSupervisorId:
                          value === NONE ? current.reportedSupervisorId : null,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {hodOptions.map((hod) => (
                        <SelectItem key={hod.userId} value={String(hod.userId)}>
                          {hod.firstName} {hod.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label>Department</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={() => setDepartmentDialogOpen(true)}
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Create
                </Button>
              </div>
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
              <div className="flex items-center justify-between gap-2">
                <Label>Designation</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={() => setDesignationDialogOpen(true)}
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Create
                </Button>
              </div>
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

      <Dialog open={companyDialogOpen} onOpenChange={handleCompanyDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompany ? "Edit company" : "Create company"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="quick-company-name">Company name</Label>
            <Input
              id="quick-company-name"
              value={newCompanyName}
              onChange={(event) => setNewCompanyName(event.target.value)}
              placeholder="Gestetner of Ceylon PLC"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCompanyDialogChange(false)} disabled={isSavingCompany}>
              Cancel
            </Button>
            <Button onClick={handleSaveCompany} disabled={isSavingCompany}>
              {isSavingCompany && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingCompany ? "Save changes" : "Create company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="quick-department-name">Department name</Label>
              <Input
                id="quick-department-name"
                value={newDepartmentName}
                onChange={(event) => setNewDepartmentName(event.target.value)}
                placeholder="Information Technology"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quick-department-description">Description</Label>
              <Input
                id="quick-department-description"
                value={newDepartmentDescription}
                onChange={(event) => setNewDepartmentDescription(event.target.value)}
                placeholder="Handles company technology operations"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepartmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDepartment} disabled={isCreatingDepartment}>
              {isCreatingDepartment && <Loader2 className="h-4 w-4 animate-spin" />}
              Create department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={designationDialogOpen} onOpenChange={setDesignationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create designation</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="quick-designation-name">Designation name</Label>
            <Input
              id="quick-designation-name"
              value={newDesignationName}
              onChange={(event) => setNewDesignationName(event.target.value)}
              placeholder="Software Engineer"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesignationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDesignation} disabled={isCreatingDesignation}>
              {isCreatingDesignation && <Loader2 className="h-4 w-4 animate-spin" />}
              Create designation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
