"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Check, Loader2, Lock } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[0-9]/, "Must include a number"),
});

export function ResetPasswordView() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
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
      if (session || hasRecoveryHash || window.location.hash.includes("type=recovery")) {
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
    setFieldError("");

    const result = resetPasswordSchema.safeParse({ password });
    if (!result.success) {
      setFieldError(result.error.errors[0].message);
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
    <main className="min-h-screen flex items-center justify-center px-4 bg-obsidian-void text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
            Reset password
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">Enter your new password</p>
        </div>

        <Card className="rounded-[0.875rem] border-obsidian-border bg-obsidian-pane shadow-none">
          <CardContent className="p-6">
            {checking || !authorized ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 size={15} className="animate-spin" />
                <span>Verifying recovery session…</span>
              </div>
            ) : success ? (
              <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 [&>svg]:text-emerald-400">
                <Check className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Password updated! Redirecting…
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Label
                    htmlFor="reset-new-password"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    New password
                  </Label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="reset-new-password"
                      type="password"
                      placeholder="New password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldError("");
                      }}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      aria-invalid={Boolean(fieldError)}
                      className={cn(
                        "h-10 rounded-lg bg-obsidian-elevated pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 md:text-sm",
                        fieldError
                          ? "border-destructive/60 focus-visible:border-destructive"
                          : "border-obsidian-border hover:border-obsidian-border focus-visible:border-foreground/40",
                      )}
                    />
                  </div>
                  {fieldError && (
                    <p className="text-xs mt-1.5 px-1 text-destructive">{fieldError}</p>
                  )}
                  <p className="text-xs mt-1.5 px-1 text-muted-foreground">
                    Min 8 chars, uppercase, lowercase, and a number
                  </p>
                </div>

                {error && (
                  <Alert
                    variant="destructive"
                    className="rounded-lg border-destructive/30 bg-destructive/10 px-3 py-2 text-xs"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={loading} className="w-full h-10 rounded-lg">
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Updating…" : "Update password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
