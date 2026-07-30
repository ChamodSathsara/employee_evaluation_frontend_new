"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getHomeForRole } from "@/lib/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ClipboardCheck, Eye, EyeOff } from "lucide-react";
import axios from "axios";

const WEIGHTS = [
  { label: "KPI Delivery", value: 80, color: "bg-primary" },
  { label: "Competencies", value: 15, color: "bg-accent" },
  { label: "Achievements", value: 5, color: "bg-success" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email, password);
      const stored = JSON.parse(localStorage.getItem("kpi_user") || "null");
      toast.success("Welcome back.");
      router.replace(getHomeForRole(stored?.roleId));
    } catch (err) {
      let message = "Login failed. Check your email and password.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Signature panel — visualizes the real grading formula from the spec */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground md:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/15">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">KPI Evaluate</span>
        </div>

        <div className="max-w-sm">
          <p className="font-display text-3xl font-bold leading-tight tracking-tight">
            One evaluation cycle.
            <br />
            Three inputs. One grade.
          </p>
          <p className="mt-3 text-sm text-primary-foreground/70">
            Every final grade is built from the same formula, applied consistently across every
            department.
          </p>

          <div className="mt-8 space-y-4">
            {WEIGHTS.map((w) => (
              <div key={w.label}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-sm text-primary-foreground/80">{w.label}</span>
                  <span className="font-mono-data text-sm font-semibold">{w.value}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/15">
                  <div className={`h-full rounded-full ${w.color}`} style={{ width: `${w.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-primary-foreground/50">
          Admin · CEO · Manager · HOD · Supervisor · Employee
        </p>
      </div>

      {/* Login form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight">KPI Evaluate</span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your work email and password to continue.
          </p>

          <Card className="mt-6 border-none shadow-none md:border md:shadow-sm">
            <CardContent className="p-0 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
