import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <Badge variant="outline">Not started</Badge>;
  const s = status.toLowerCase();
  if (s === "draft") return <Badge variant="secondary">Draft</Badge>;
  if (s === "published") return <Badge variant="default">Published</Badge>;
  if (s === "submitted") return <Badge className="bg-chart-4 text-white border-transparent">Submitted</Badge>;
  if (s === "completed") return <Badge variant="success">Completed</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function GradeBadge({ grade }: { grade: string | null | undefined }) {
  if (!grade) {
    return <Badge variant="outline">Not yet processed</Badge>;
  }
  const first = grade.trim()[0]?.toUpperCase();
  const tone =
    first === "A"
      ? "bg-success text-success-foreground"
      : first === "B"
      ? "bg-primary text-primary-foreground"
      : first === "C"
      ? "bg-warning text-warning-foreground"
      : "bg-destructive text-destructive-foreground";
  return (
    <span
      className={cn(
        "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-display text-base font-bold",
        tone
      )}
    >
      {grade}
    </span>
  );
}

/** Segmented bar visualizing KPI weight allocation — a structural encoding of the 100% weight rule, not decoration. */
export function WeightBar({
  segments,
}: {
  segments: { label: string; weight: number; color?: string }[];
}) {
  const palette = ["bg-primary", "bg-accent", "bg-success", "bg-chart-4", "bg-destructive"];
  return (
    <div className="space-y-1.5">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={cn(seg.color ?? palette[i % palette.length])}
            style={{ width: `${seg.weight}%` }}
            title={`${seg.label}: ${seg.weight}%`}
          />
        ))}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
