import { ROLE } from "@/types";
import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  Settings,
  Users,
  FilePlus2,
  Building2,
  CalendarRange,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

export const NAV_BY_ROLE: Record<number, NavItem[]> = {
  [ROLE.ADMIN]: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/users", icon: Users },
    { label: "Periods", href: "/evaluation-periods", icon: CalendarRange },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  [ROLE.CEO]: [
    { label: "Departments", href: "/departments", icon: Building2 },
    { label: "Create KPI", href: "/create-kpi", icon: FilePlus2 },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  [ROLE.MANAGER]: [
    { label: "Departments", href: "/departments", icon: Building2 },
    { label: "My KPIs", href: "/my-kpis", icon: ListChecks },
    { label: "Results", href: "/results", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  [ROLE.HOD]: [
    { label: "Employees", href: "/employees", icon: Users },
    { label: "Create KPI", href: "/create-kpi", icon: FilePlus2 },
    { label: "My KPIs", href: "/my-kpis", icon: ListChecks },
    { label: "Results", href: "/results", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  [ROLE.SUPERVISOR]: [
    { label: "Employees", href: "/employees", icon: Users },
    { label: "Create KPI", href: "/create-kpi", icon: FilePlus2 },
    { label: "My KPIs", href: "/my-kpis", icon: ListChecks },
    { label: "Results", href: "/results", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  [ROLE.EMPLOYEE]: [
    { label: "My KPIs", href: "/my-kpis", icon: ListChecks },
    { label: "Results", href: "/results", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
};

/** Mobile bottom-nav can only fit ~5 items comfortably; role lists here are already within that limit. */
export function getNavForRole(roleId?: number): NavItem[] {
  if (!roleId) return [];
  return NAV_BY_ROLE[roleId] ?? [];
}

export function getHomeForRole(roleId?: number): string {
  const nav = getNavForRole(roleId);
  return nav[0]?.href ?? "/login";
}
