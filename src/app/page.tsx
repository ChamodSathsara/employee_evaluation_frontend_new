"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getHomeForRole } from "@/lib/nav-config";

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace(getHomeForRole(user.roleId));
    } else {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  return null;
}
