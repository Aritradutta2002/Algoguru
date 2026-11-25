"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BrainCircuit,
  Check,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getAuthRedirectUrl, sanitizeRedirectPath } from "@/lib/authUrl";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppTooltip } from "@/components/ui/tooltip";
import { AlgoGuruLockup } from "@/components/brand/AlgoGuruLockup";

type AuthMode = "login" | "signup" | "forgot";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.string().trim().email("Please enter a valid email address").max(255),
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

const forgotSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
});

const PASSWORD_RULES = [
  { label: "8+ chars", test: (value: string) => value.length >= 8 },
  { label: "Uppercase", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Lowercase", test: (value: string) => /[a-z]/.test(value) },
  { label: "Number", test: (value: string) => /[0-9]/.test(value) },
] as const;

const DSA_SHEETS = [
  { name: "Arrays & Hashing", progress: "42 / 50", pct: 84, tag: "Core" },
  { name: "Sliding Window", progress: "18 / 24", pct: 75, tag: "Pattern" },
  { name: "System Design Paths", progress: "14 / 20", pct: 70, tag: "Arch" },
] as const;

const SHOWCASE_PILLARS = [
  {
    icon: Layers,
    title: "Interactive DSA sheets",
    body: "Pattern-indexed tracks with difficulty coverage and instant test execution.",
  },
  {
    icon: BrainCircuit,
    title: "Guru AI tutor",
    body: "Step-by-step reasoning hints that sharpen intuition without spoiling the solve.",
  },
  {
    icon: Trophy,
    title: "Timed coding contests",
    body: "Exam-grade 45-minute problem sets with latency and accuracy telemetry.",
  },
] as const;

/* ── Field ─────────────────────────────────────────────────────── */
function Field({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  rightSlot,
  labelRightSlot,
  autoComplete,
  disabled,
}: {
  id?: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rightSlot?: React.ReactNode;
  labelRightSlot?: React.ReactNode;
  autoComplete?: string;
  disabled?: boolean;
}) {
  const inputId = id ?? `auth-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label
          htmlFor={inputId}
          className="text-xs font-medium text-foreground/85"
        >
          {label}
        </Label>
        {labelRightSlot}
      </div>
      <div className="relative">
        <Input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-10 rounded-lg border-obsidian-border bg-obsidian-elevated px-3.5 text-sm text-foreground shadow-[inset_0_1px_0_hsl(var(--obsidian-specular))] transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/60 hover:border-foreground/20 focus-visible:border-primary focus-visible:bg-obsidian-pane focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 md:text-sm",
            rightSlot && "pr-10",
            error &&
              "border-destructive/80 hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25",
          )}
        />
        {rightSlot && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            {rightSlot}
          </span>
        )}
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive"
        >
          <AlertCircle size={12} className="shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/* ── Google mark ───────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09A6.7 6.7 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ── AuthView ──────────────────────────────────────────────────── */
export function AuthView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const redirectTarget = sanitizeRedirectPath(
    searchParams.get("redirect") ?? searchParams.get("next"),
    "/",
  );
  const callbackPath =
    redirectTarget !== "/"
      ? `/auth/callback?next=${encodeURIComponent(redirectTarget)}`
      : "/auth/callback";

  const initialCallbackError =
    searchParams.get("error") === "auth_callback_failed"
      ? "Authentication could not be completed. Please try signing in again."
      : "";

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialCallbackError);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cooldown, setCooldown] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectedRef = useRef(false);

  const { session } = useAuth();
  const { theme, toggleTheme } = useSettings();

  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  useEffect(() => {
    if (session && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(redirectTarget);
      router.refresh();
    }
  }, [session, router, redirectTarget]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  const triggerCooldown = () => {
    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    setCooldown(true);
    cooldownRef.current = setTimeout(() => setCooldown(false), 3000);
  };

  const resetForm = (preserveEmail = false) => {
    setError("");
    setMessage("");
    setFieldErrors({});
    setName("");
    if (!preserveEmail) setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (nextMode: AuthMode, preserveEmail = false) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    resetForm(preserveEmail);
  };

  const handleFieldChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (error) setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setError("");
    setMessage("");

    if (isForgot) {
      const result = forgotSchema.safeParse({ email });
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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: getAuthRedirectUrl("/reset-password"),
        },
      );
      if (resetError) {
        setError(resetError.message);
        triggerCooldown();
      } else {
        setMessage("Check your email for a password reset link.");
      }
      setLoading(false);
      return;
    }

    const schema = isLogin ? loginSchema : signupSchema;
    const data = isLogin
      ? { email, password }
      : { name, email, password, confirmPassword };
    const result = schema.safeParse(data);
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
    if (isLogin) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        triggerCooldown();
      } else if (!redirectedRef.current) {
        redirectedRef.current = true;
        router.replace(redirectTarget);
        router.refresh();
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: getAuthRedirectUrl(callbackPath),
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        triggerCooldown();
      } else {
        setMessage("Check your email for a confirmation link.");
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthRedirectUrl(callbackPath) },
    });
    if (oauthError) setError(oauthError.message);
    setLoading(false);
  };

  const isDisabled = loading || cooldown;

  const headingTitle = isForgot
    ? "Reset your password"
    : isLogin
      ? "Sign in to AlgoGuru"
      : "Create your account";

  const headingDescription = isForgot
    ? "Enter your account email and we will send a secure recovery link."
    : isLogin
      ? "Resume your DSA sheets, Guru AI sessions, and contest streaks."
      : "Start tracking structured DSA tracks, system design paths, and timed contests.";

  const submitLabel = loading
    ? isForgot
      ? "Sending reset link…"
      : isLogin
        ? "Signing in…"
        : "Creating account…"
    : cooldown
      ? "Try again shortly…"
      : isForgot
        ? "Send reset link"
        : isLogin
          ? "Sign in"
          : "Create account";

  return (
    <main className="grid min-h-[100dvh] w-full bg-obsidian-void text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(0,1.06fr)]">
      {/* ── Left Column: Authentication Workspace ─────────────────── */}
      <section
        aria-label="Authentication"
        className="relative flex min-h-[100dvh] flex-col justify-between px-5 py-6 sm:px-10 md:px-14 lg:px-16"
      >
        {/* Top chrome bar */}
        <header className="mx-auto flex w-full max-w-[420px] items-center justify-between gap-3">
          <Link
            href="/"
            aria-label="AlgoGuru home"
            className="inline-flex items-center rounded-lg py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AlgoGuruLockup size={28} title={null} />
            <span className="sr-only">AlgoGuru</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-obsidian-border bg-obsidian-pane px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              <span>Back to home</span>
            </Link>
            <AppTooltip
              content={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                className="h-8 w-8 rounded-lg border-obsidian-border bg-obsidian-pane text-muted-foreground hover:text-foreground"
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </Button>
            </AppTooltip>
          </div>
        </header>

        {/* Centered form block */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto my-auto w-full max-w-[420px] py-10"
        >
          <div className="mb-6">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-obsidian-border bg-obsidian-pane px-2.5 py-1 text-[11px] font-medium text-primary">
              {isForgot ? (
                <KeyRound size={12} aria-hidden="true" />
              ) : (
                <ShieldCheck size={12} aria-hidden="true" />
              )}
              <span>
                {isForgot
                  ? "Account recovery"
                  : isLogin
                    ? "Workspace access"
                    : "Start free workspace"}
              </span>
            </p>
            <h1 className="mt-3.5 text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[1.75rem]">
              {headingTitle}
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-6 text-muted-foreground">
              {headingDescription}
            </p>
          </div>

          {!isForgot && (
            <>
              {/* Segmented Sign In / Create Account switch */}
              <Tabs
                value={isLogin ? "login" : "signup"}
                onValueChange={(value) =>
                  switchMode(value === "login" ? "login" : "signup")
                }
                className="mb-5"
              >
                <TabsList className="grid h-10 w-full grid-cols-2 rounded-lg border border-obsidian-border bg-obsidian-elevated p-1">
                  <TabsTrigger
                    value="login"
                    className="rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-all data-[state=active]:border data-[state=active]:border-obsidian-border data-[state=active]:bg-obsidian-pane data-[state=active]:text-foreground data-[state=active]:shadow-soft"
                  >
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-all data-[state=active]:border data-[state=active]:border-obsidian-border data-[state=active]:bg-obsidian-pane data-[state=active]:text-foreground data-[state=active]:shadow-soft"
                  >
                    Create account
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Google SSO */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isDisabled}
                className="h-10 w-full gap-2.5 rounded-lg border-obsidian-border bg-obsidian-pane text-[13px] font-medium text-foreground shadow-soft hover:border-foreground/20 hover:bg-obsidian-elevated"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </Button>

              <div className="my-5 flex items-center gap-3" aria-hidden="true">
                <div className="h-px flex-1 bg-obsidian-border" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                  or with email
                </span>
                <div className="h-px flex-1 bg-obsidian-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {isSignup && (
              <Field
                id="auth-name"
                label="Full name"
                type="text"
                placeholder="Ada Lovelace"
                value={name}
                disabled={loading}
                onChange={(v) => handleFieldChange("name", v, setName)}
                error={fieldErrors.name}
                autoComplete="name"
              />
            )}

            <Field
              id="auth-email"
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={email}
              disabled={loading}
              onChange={(v) => handleFieldChange("email", v, setEmail)}
              error={fieldErrors.email}
              autoComplete="email"
            />

            {!isForgot && (
              <div>
                <Field
                  id="auth-password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    isLogin
                      ? "Enter your password"
                      : "8+ chars, upper, lower, number"
                  }
                  value={password}
                  disabled={loading}
                  onChange={(v) =>
                    handleFieldChange("password", v, setPassword)
                  }
                  error={fieldErrors.password}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  labelRightSlot={
                    isLogin ? (
                      <Button
                        variant="bare"
                        size="bare"
                        type="button"
                        onClick={() => switchMode("forgot", true)}
                        className="rounded text-xs font-medium text-primary transition-colors hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Forgot password?
                      </Button>
                    ) : undefined
                  }
                  rightSlot={
                    <Button
                      variant="bare"
                      size="bare"
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {showPassword ? (
                        <EyeOff size={15} aria-hidden="true" />
                      ) : (
                        <Eye size={15} aria-hidden="true" />
                      )}
                    </Button>
                  }
                />

                {isSignup && (
                  <div
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
                              : "border-obsidian-border bg-obsidian-pane text-muted-foreground",
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
                )}
              </div>
            )}

            {isSignup && (
              <Field
                id="auth-confirm-password"
                label="Confirm password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                disabled={loading}
                onChange={(v) =>
                  handleFieldChange("confirmPassword", v, setConfirmPassword)
                }
                error={fieldErrors.confirmPassword}
                autoComplete="new-password"
                rightSlot={
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
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={15} aria-hidden="true" />
                    ) : (
                      <Eye size={15} aria-hidden="true" />
                    )}
                  </Button>
                }
              />
            )}

            {error && (
              <Alert
                variant="destructive"
                className="rounded-lg border-destructive/35 bg-destructive/10 px-3.5 py-2.5 text-xs leading-5"
              >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <AlertDescription className="text-xs leading-5">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert
                role="status"
                aria-live="polite"
                className="rounded-lg border-emerald-500/35 bg-emerald-500/10 px-3.5 py-2.5 text-xs leading-5 text-emerald-700 dark:text-emerald-400 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <AlertDescription className="text-xs leading-5">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              variant="accent"
              disabled={isDisabled}
              className="mt-1 h-10 w-full rounded-lg text-sm font-medium shadow-soft"
            >
              {loading && (
                <Loader2
                  size={15}
                  className="animate-spin"
                  aria-hidden="true"
                />
              )}
              <span>{submitLabel}</span>
            </Button>
          </form>

          {isForgot ? (
            <div className="mt-5 text-center">
              <Button
                variant="bare"
                size="bare"
                type="button"
                onClick={() => switchMode("login", true)}
                className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowLeft size={12} aria-hidden="true" />
                <span>Back to sign in</span>
              </Button>
            </div>
          ) : (
            <p className="mt-5 text-center text-xs text-muted-foreground">
              {isLogin ? "New to AlgoGuru? " : "Already have an account? "}
              <Button
                variant="bare"
                size="bare"
                type="button"
                onClick={() => switchMode(isLogin ? "signup" : "login")}
                className="rounded font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isLogin ? "Create an account" : "Sign in"}
              </Button>
            </p>
          )}
        </motion.div>

        {/* Security / session trust footer */}
        <footer className="mx-auto flex w-full max-w-[420px] flex-wrap items-center justify-between gap-2 border-t border-obsidian-border pt-4 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Lock size={11} className="text-primary/80" aria-hidden="true" />
            <span>PKCE &amp; TLS encrypted session</span>
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/roadmap"
              className="transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Roadmap
            </Link>
            <Link
              href="/support"
              className="transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Support
            </Link>
          </div>
        </footer>
      </section>

      {/* ── Right Column: Editorial Dark Product Showcase (lg+) ───── */}
      <aside
        aria-label="AlgoGuru workspace highlights"
        className="relative hidden overflow-hidden border-l border-obsidian-border bg-[#080A0F] px-10 py-12 text-slate-100 lg:flex lg:flex-col lg:justify-between xl:px-14"
      >
        {/* Subtle atmospheric grid & top cobalt radiance */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 75% 50% at 50% 0%, rgba(59, 130, 246, 0.16), transparent 70%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "100% 100%, 48px 48px, 48px 48px",
          }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[540px] flex-1 flex-col justify-center">
          <div className="mb-7">
            <p className="inline-flex items-center gap-2 text-xs font-medium text-blue-400">
              <Sparkles size={13} aria-hidden="true" />
              <span>Engineering Prep Workspace</span>
            </p>
            <h2 className="mt-3 text-[1.85rem] font-semibold leading-[1.15] tracking-[-0.03em] text-white xl:text-[2.1rem]">
              Structured mastery, built for real technical interviews.
            </h2>
            <p className="mt-3 max-w-md text-[13.5px] leading-6 text-slate-400">
              Your DSA sheet progress, Guru AI hints, and timed coding contest
              history stay synchronized across every session.
            </p>
          </div>

          {/* Product Preview Window */}
          <div className="overflow-hidden rounded-xl border border-white/[0.1] bg-[#0D1017] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.85)]">
            {/* Window chrome */}
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#121620] px-4 py-2.5">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <span className="truncate font-mono text-[11px] text-slate-400">
                workspace / dsa-sheets · guru-ai
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Synced
              </span>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {/* Interactive DSA Sheets Progress */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Interactive DSA Sheets
                  </span>
                  <span className="font-mono text-[11px] text-blue-400">
                    74 / 94 solved
                  </span>
                </div>
                <div className="space-y-2.5">
                  {DSA_SHEETS.map((sheet) => (
                    <div
                      key={sheet.name}
                      className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-100">
                            {sheet.name}
                          </span>
                          <span className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                            {sheet.tag}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] tabular-nums text-slate-300">
                          {sheet.progress}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                          style={{ width: `${sheet.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guru AI Tutor snippet + Timed Contest telemetry */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-violet-400/20 bg-violet-500/[0.07] p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-violet-300">
                    <BrainCircuit size={13} aria-hidden="true" />
                    <span>Guru AI Hint</span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-300">
                    &ldquo;Track seen complements in a single HashMap pass to
                    drop lookup from{" "}
                    <code className="rounded bg-white/[0.08] px-1 py-0.5 font-mono text-[10.5px] text-violet-200">
                      O(n²)
                    </code>{" "}
                    to{" "}
                    <code className="rounded bg-white/[0.08] px-1 py-0.5 font-mono text-[10.5px] text-violet-200">
                      O(n)
                    </code>
                    .&rdquo;
                  </p>
                </div>

                <div className="flex flex-col justify-between rounded-lg border border-white/[0.08] bg-white/[0.025] p-3">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={12} className="text-amber-400" aria-hidden="true" />
                      Timed Contest
                    </span>
                    <span className="font-mono text-emerald-400">12 / 12 pass</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Runtime
                      </p>
                      <p className="font-mono text-sm font-semibold text-white">
                        0.2 ms
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Streak
                      </p>
                      <p className="font-mono text-sm font-semibold text-white">
                        14 days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3-pillar summary */}
          <ul className="mt-7 space-y-3.5">
            {SHOWCASE_PILLARS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.04] text-blue-400">
                  <Icon size={14} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-medium text-slate-100">{title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-400">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
