"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import type { KpiAssignment } from "@/types";
import { PageHeader, StatusBadge, WeightBar, EmptyState } from "@/components/shared/display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronRight, CalendarClock } from "lucide-react";

export default function MyKpisPage() {
  const [assignments, setAssignments] = useState<KpiAssignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getMyKpis()
      .then((res) => setAssignments(res.data))
      .catch(() => setError("Could not load your KPIs. Pull to refresh or try again shortly."));
  }, []);

  return (
    <div>
      <PageHeader title="My KPIs" description="Your assigned KPIs for each evaluation period." />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!assignments && !error && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your KPIs…
        </div>
      )}

      {assignments && assignments.length === 0 && (
        <EmptyState
          title="No KPIs assigned yet"
          description="Once your supervisor or HOD creates KPIs for this period, they'll show up here."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assignments?.map((a) => (
          <Link key={a.assignmentId} href={`/my-kpis/${a.assignmentId}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{a.periodName}</CardTitle>
                  <StatusBadge status={a.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {a.details.length} KPI{a.details.length === 1 ? "" : "s"} · {a.totalWeight}% total weight
                </div>
                <WeightBar
                  segments={a.details.map((d) => ({ label: d.kpiName, weight: d.weightPercentage }))}
                />
                <ul className="space-y-1 text-sm">
                  {a.details.slice(0, 3).map((d) => (
                    <li key={d.detailId} className="flex justify-between gap-2">
                      <span className="truncate text-foreground/80">{d.kpiName}</span>
                      <span className="shrink-0 font-mono-data text-xs text-muted-foreground">
                        {d.weightPercentage}%
                      </span>
                    </li>
                  ))}
                  {a.details.length > 3 && (
                    <li className="text-xs text-muted-foreground">+{a.details.length - 3} more</li>
                  )}
                </ul>
                <div className="flex items-center justify-end text-sm font-medium text-primary">
                  View & add marks <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
