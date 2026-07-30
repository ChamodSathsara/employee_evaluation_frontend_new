"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import type { KpiAssignment } from "@/types";
import { PageHeader, EmptyState, StatusBadge } from "@/components/shared/display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronRight } from "lucide-react";

export default function ResultsPage() {
  const [assignments, setAssignments] = useState<KpiAssignment[] | null>(null);

  useEffect(() => {
    apiClient
      .getMyKpis()
      .then((res) => setAssignments(res.data))
      .catch(() => setAssignments([]));
  }, []);

  return (
    <div>
      <PageHeader title="Results" description="Final marks and grade for each evaluation period." />

      {!assignments && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading results…
        </div>
      )}

      {assignments && assignments.length === 0 && (
        <EmptyState title="No results yet" description="Results appear once a period has KPIs assigned." />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assignments?.map((a) => (
          <Link key={a.assignmentId} href={`/results/${a.assignmentId}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{a.periodName}</CardTitle>
                  <StatusBadge status={a.status} />
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{a.details.length} KPIs evaluated</span>
                <span className="flex items-center gap-1 font-medium text-primary">
                  View result <ChevronRight className="h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
