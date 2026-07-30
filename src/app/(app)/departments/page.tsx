"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import type { DepartmentProgress, EvaluationPeriod } from "@/types";
import { PageHeader, EmptyState } from "@/components/shared/display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Users, ChevronRight } from "lucide-react";

export default function DepartmentsPage() {
  const [period, setPeriod] = useState<EvaluationPeriod | null>(null);
  const [departments, setDepartments] = useState<DepartmentProgress[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const periodsRes = await apiClient.getEvaluationPeriods();
        const activePeriod = periodsRes.data.find((p) => p.status === "Active") ?? periodsRes.data[0] ?? null;
        setPeriod(activePeriod);

        if (activePeriod) {
          const progressRes = await apiClient.getAllDepartmentsProgress(activePeriod.periodId);
          setDepartments(progressRes.data);
        } else {
          setDepartments([]);
        }
      } catch {
        setDepartments([]);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Departments"
        description={
          period
            ? `Grade and attendance completion for ${period.name}.`
            : "Grade and attendance completion across departments."
        }
      />

      {!departments && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading departments…
        </div>
      )}

      {departments && !period && (
        <EmptyState title="No evaluation period found" description="Create an evaluation period first." />
      )}

      {departments && period && departments.length === 0 && <EmptyState title="No departments found" />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments?.map((d) => (
          <Link key={d.departmentId} href={`/departments/${d.departmentId}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{d.departmentName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {d.employeeCount} employees
                  {d.hodNames.length > 0 && <> · HOD {d.hodNames.join(", ")}</>}
                  {d.supervisorNames.length > 0 && <> · Supervisor {d.supervisorNames.join(", ")}</>}
                </p>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Grades generated</span>
                    <span className="font-mono-data font-medium">{d.gradeCompletionPercentage}%</span>
                  </div>
                  <Progress value={d.gradeCompletionPercentage} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Attendance submitted</span>
                    <span className="font-mono-data font-medium">{d.attendanceCompletionPercentage}%</span>
                  </div>
                  <Progress value={d.attendanceCompletionPercentage} indicatorClassName="bg-accent" />
                </div>
                <div className="flex items-center justify-end text-sm font-medium text-primary">
                  View employees <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
