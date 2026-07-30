"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import type { TeamMember } from "@/types";
import { PageHeader, EmptyState } from "@/components/shared/display";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";

export default function DepartmentEmployeesPage() {
  const params = useParams<{ departmentId: string }>();
  const departmentId = Number(params.departmentId);
  const [employees, setEmployees] = useState<TeamMember[] | null>(null);

  useEffect(() => {
    if (!departmentId) return;
    apiClient
      .getDepartmentEmployees(departmentId)
      .then((res) => setEmployees(res.data))
      .catch(() => setEmployees([]));
  }, [departmentId]);

  return (
    <div>
      <Link
        href="/departments"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Departments
      </Link>
      <PageHeader title="Employees" description="Select an employee to view their evaluation." />

      {!employees && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading employees…
        </div>
      )}
      {employees && employees.length === 0 && <EmptyState title="No employees in this department" />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {employees?.map((e) => {
          const initials = `${e.firstName?.[0] ?? ""}${e.lastName?.[0] ?? ""}`.toUpperCase();
          return (
            <Link key={e.userId} href={`/departments/${departmentId}/${e.userId}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 pt-5">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium capitalize">
                      {e.firstName} {e.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{e.designationName}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
