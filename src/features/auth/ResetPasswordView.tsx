"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AuthIllustration, AuthSurfaceHeader } from "./AuthSurface";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[0-9]/, "Must include a number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const PASSWORD_RULES = [
  { label: "8+ chars", test: (value: string) => value.length >= 8 },
  { label: "Uppercase", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Lowercase", test: (value: string) => /[a-z]/.test(value) },
  { label: "Number", test: (value: string) => /[0-9]/.test(value) },
] as const;

export function ResetPasswordView() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    const hasRecoveryHash = window.location.hash.includes("type=recovery");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setAuthorized(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (
        session ||
        hasRecoveryHash ||
        window.location.hash.includes("type=recovery")
      ) {
        setAuthorized(true);
        setChecking(false);
      } else {
        setChecking(false);
        router.replace("/auth");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [router]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (!errors[key]) errors[key] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      redirectTimerRef.current = setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <main className="ag-auth__layout">
      <section className="ag-auth__main" aria-label="Password recovery">
        <AuthSurfaceHeader returnHref="/auth" returnLabel="Back to sign in" />
        <div className="ag-auth__form">
          <div className="mb-6">
            <h1 className="ag-auth__title">
              Choose a new password
            </h1>
            <p className="ag-auth__description">
              Set a strong password to restore access to your AlgoGuru workspace.
            </p>
          </div>

          <Card className="rounded-xl border-obsidian-border bg-obsidian-pane shadow-soft">
            <CardContent className="p-6">
              {checking || !authorized ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center justify-center gap-2.5 py-8 text-sm text-muted-foreground"
                >
                  <Loader2
                    size={16}
                    className="text-primary motion-safe:animate-spin"
                    aria-hidden="true"
                  />
                  <span>Verifying recovery session…</span>
                </div>
              ) : success ? (
                <Alert
                  role="status"
                  aria-live="polite"
                  className="rounded-lg border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription className="text-sm font-medium">
                    Password updated! Redirecting you to your workspace…
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleReset} noValidate className="space-y-4" aria-busy={loading}>
                  <div>
                    <Label
                      htmlFor="reset-new-password"
                      className="mb-1.5 block text-xs font-medium text-foreground/85"
                    >
                      New password
                    </Label>
                    <div className="relative">
                      <Lock
                        size={14}
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        id="reset-new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter a strong password"
                        value={password}
                        disabled={loading}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.password;
                            return next;
                          });
                        }}
                        autoComplete="new-password"
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={
                          fieldErrors.password
                            ? "reset-new-password-error"
                            : "reset-password-rules"
                        }
                        className={cn(
                          "ag-auth__input pl-9 pr-12",
                          fieldErrors.password &&
                            "border-destructive/80 hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25",
                        )}
                      />
                      <Button
                        variant="bare"
                        size="bare"
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {showPassword ? (
                          <EyeOff size={15} aria-hidden="true" />
                        ) : (
                          <Eye size={15} aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                    {fieldErrors.password && (
                      <p
                        id="reset-new-password-error"
                        role="alert"
                        className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive"
                      >
                        <AlertCircle
                          size={12}
                          className="shrink-0"
                          aria-hidden="true"
                        />
                        <span>{fieldErrors.password}</span>
                      </p>
                    )}

                    <div
                      id="reset-password-rules"
                      className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4"
                      aria-label="Password requirements"
                    >
                      {PASSWORD_RULES.map((rule) => {
                        const met = rule.test(password);
                        return (
                          <span
                            key={rule.label}
                            className={cn(
                              "inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                              met
                                ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border-obsidian-border bg-obsidian-elevated text-muted-foreground",
                            )}
                          >
                            <Check
                              size={10}
                              strokeWidth={2.5}
                              className={cn(
                                "shrink-0",
                                met ? "opacity-100" : "opacity-35",
                              )}
                              aria-hidden="true"
                            />
                            <span className="whitespace-nowrap">{rule.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="reset-confirm-password"
                      className="mb-1.5 block text-xs font-medium text-foreground/85"
                    >
                      Confirm new password
                    </Label>
                    <div className="relative">
                      <Lock
                        size={14}
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        id="reset-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        disabled={loading}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.confirmPassword;
                            return next;
                          });
                        }}
                        autoComplete="new-password"
                        aria-invalid={Boolean(fieldErrors.confirmPassword)}
                        aria-describedby={
                          fieldErrors.confirmPassword
                            ? "reset-confirm-password-error"
                            : undefined
                        }
                        className={cn(
                          "ag-auth__input pl-9 pr-12",
                          fieldErrors.confirmPassword &&
                            "border-destructive/80 hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25",
                        )}
                      />
                      <Button
                        variant="bare"
                        size="bare"
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        aria-pressed={showConfirmPassword}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={15} aria-hidden="true" />
                        ) : (
                          <Eye size={15} aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p
                        id="reset-confirm-password-error"
                        role="alert"
                        className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive"
                      >
                        <AlertCircle
                          size={12}
                          className="shrink-0"
                          aria-hidden="true"
                        />
                        <span>{fieldErrors.confirmPassword}</span>
                      </p>
                    )}
                  </div>

                  {error && (
                    <Alert
                      variant="destructive"
                      className="rounded-lg border-destructive/35 bg-destructive/10 px-3.5 py-2.5 text-xs"
                    >
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      <AlertDescription className="text-xs">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="bare"
                    size="bare"
                    disabled={loading}
                    className="ag-button ag-button--primary w-full"
                  >
                    {loading && (
                      <Loader2
                        size={15}
                        className="motion-safe:animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    <span>{loading ? "Updating password…" : "Update password"}</span>
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="ag-auth__footer">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-primary/80" aria-hidden="true" />
            <span>Password recovery</span>
          </span>
          <Link
            href="/support"
            className="transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Support
          </Link>
        </footer>
      </section>
      <AuthIllustration />
    </main>
  );
}
