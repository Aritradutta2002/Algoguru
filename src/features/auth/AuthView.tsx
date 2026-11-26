"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthRedirectUrl, sanitizeRedirectPath } from "@/lib/authUrl";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthIllustration, AuthSurfaceHeader } from "./AuthSurface";

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
            "ag-auth__input",
            rightSlot && "pr-12",
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
      ? "Pick up where you left off in your interview prep."
      : "Save your practice progress, study notes, and contest results in one place.";

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
    <main className="ag-auth__layout">
      <section aria-label="Authentication" className="ag-auth__main">
        <AuthSurfaceHeader returnHref="/" returnLabel="Back to home" />
        <div className="ag-auth__form">
          <div className="mb-6">
            <h1 className="ag-auth__title">
              {headingTitle}
            </h1>
            <p className="ag-auth__description">
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
                <TabsList aria-label="Account access" className="ag-auth__switch grid grid-cols-2">
                  <TabsTrigger
                    value="login"
                  >
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
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
                className="ag-auth__google"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </Button>

              <div className="my-5 flex items-center gap-3" aria-hidden="true">
                <div className="h-px flex-1 bg-obsidian-border" />
                <span className="text-xs font-medium text-muted-foreground">
                  or with email
                </span>
                <div className="h-px flex-1 bg-obsidian-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-busy={loading}>
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
              variant="bare"
              size="bare"
              disabled={isDisabled}
              className="ag-button ag-button--primary mt-1 w-full"
            >
              {loading && (
                <Loader2
                  size={15}
                  className="motion-safe:animate-spin"
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
        </div>

        {/* Security / session trust footer */}
        <footer className="ag-auth__footer">
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

      <AuthIllustration />
    </main>
  );
}
