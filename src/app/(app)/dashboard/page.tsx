"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { AdminDashboard } from "@/types";
import { PageHeader } from "@/components/shared/display";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, UserCheck, Building2, CalendarCheck2 } from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    apiClient
      .getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading dashboard…
      </div>
    );
  }

  const stats = [
    { label: "Total users", value: data.totalUsers, icon: Users },
    { label: "Active users", value: data.activeUsers, icon: UserCheck },
    { label: "Departments", value: data.totalDepartments, icon: Building2 },
    {
      label: "Active period",
      value: data.activeEvaluationPeriod?.name ?? "None",
      icon: CalendarCheck2,
    },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Organization-wide overview." />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <p className="mt-2 font-mono-data text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.activeEvaluationPeriod && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{data.activeEvaluationPeriod.name}</CardTitle>
            <CardDescription>
              {data.activeEvaluationPeriod.startDate} – {data.activeEvaluationPeriod.endDate}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest actions across the system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recentAuditLogs.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          )}
          {data.recentAuditLogs.map((log) => (
            <div key={log.auditId} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p>
                  <span className="font-medium">{log.userName}</span>{" "}
                  <Badge variant="outline" className="ml-1">
                    {log.action}
                  </Badge>{" "}
                  <span className="text-muted-foreground">{log.tableName}</span>
                  {log.recordId != null && (
                    <span className="text-muted-foreground"> #{log.recordId}</span>
                  )}
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
                {new Date(log.createdDate).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
