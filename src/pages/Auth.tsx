import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Moon,
  Sun,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getAuthRedirectUrl } from "@/lib/authUrl";
import { cn } from "@/lib/utils";
import { AppTooltip } from "@/components/ui/tooltip";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";

/**
 * Authentication.
 *
 * The layout is the first honest look at the product: form on the left, a
 * quiet proof panel on the right built from the real workspace vocabulary
 * (lesson rows, a code line, a passing test). No decorative gradient mesh.
 */

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address")
      .max(255),
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

/* ── Field ─────────────────────────────────────────────────────── */
function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  rightSlot,
  autoComplete,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rightSlot?: React.ReactNode;
  autoComplete?: string;
}) {
  const id = `auth-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-10 w-full rounded-sm border bg-[hsl(var(--surface-panel))] px-3 pr-10 text-[13.5px] text-foreground outline-none transition-[border-color,box-shadow] duration-2 placeholder:text-muted-foreground/80",
            error
              ? "border-destructive/70 focus:border-destructive focus:ring-2 focus:ring-destructive/20"
              : "border-line hover:border-[hsl(var(--surface-line-strong))] focus:border-primary/70 focus:ring-2 focus:ring-ring/25",
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
          id={`${id}-error`}
          className="mt-1.5 flex items-center gap-1 text-[11.5px] text-destructive"
        >
          <AlertCircle size={11} aria-hidden="true" />
          {error}
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

const VALUE_POINTS = [
  {
    index: "01",
    title: "A prerequisite-ordered path",
    body: "184 lessons across 14 DSA tracks, plus Java theory and Spring Boot interview material.",
  },
  {
    index: "02",
    title: "Solve without leaving the window",
    body: "A Monaco editor with test runs sits beside the problem statement, not in another tab.",
  },
  {
    index: "03",
    title: "Your progress is stored",
    body: "Completion, bookmarks, notes and practice history are kept against your account.",
  },
] as const;

/* ── Auth ──────────────────────────────────────────────────────── */
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cooldown, setCooldown] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { theme, toggleTheme } = useSettings();

  useEffect(() => {
    if (session) navigate("/home", { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  const resetForm = () => {
    setError("");
    setMessage("");
    setFieldErrors({});
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (nextIsLogin: boolean) => {
    if (nextIsLogin === isLogin) return;
    setIsLogin(nextIsLogin);
    resetForm();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setError("");
    setMessage("");

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
        setCooldown(true);
        cooldownRef.current = setTimeout(() => setCooldown(false), 3000);
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setCooldown(true);
        cooldownRef.current = setTimeout(() => setCooldown(false), 3000);
      } else {
        setMessage("Check your email for a confirmation link.");
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthRedirectUrl() },
    });
    if (oauthError) setError(oauthError.message);
    setLoading(false);
  };

  const isDisabled = loading || cooldown;

  return (
    <main className="grid min-h-[100dvh] grid-cols-1 bg-[hsl(var(--surface-page))] text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]">
      <a href="#auth-form" className="skip-link">
        Skip to the form
      </a>

      {/* ── Form column ─────────────────────────────────────────── */}
      <div className="flex min-h-[100dvh] flex-col px-5 py-5 sm:px-10 lg:px-14">
        <header className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="AlgoGuru home"
          >
            <AlgoGuruMark size={26} />
            <span className="font-display text-[15px] font-semibold tracking-[-0.02em]">
              Algo<span className="text-primary">Guru</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className="hidden h-8 items-center gap-1.5 rounded-sm px-2 font-mono text-[10.5px] text-muted-foreground transition-colors duration-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
            >
              <ArrowLeft size={11} aria-hidden="true" />
              Home
            </Link>
            <AppTooltip
              content={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-1 hover:bg-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </AppTooltip>
          </div>
        </header>

        <div
          id="auth-form"
          className="mx-auto flex w-full max-w-[364px] flex-1 flex-col justify-center py-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="ws-eyebrow">
              {isLogin ? "Secure sign in" : "New account"}
            </p>
            <h1 className="mt-2.5 font-display text-[27px] font-semibold leading-[1.12] tracking-[-0.03em]">
              {isLogin ? "Sign in to your workspace" : "Create your workspace"}
            </h1>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
              {isLogin
                ? "Your lessons, notes and progress are exactly where you left them."
                : "One account keeps your progress, bookmarks and notes in sync."}
            </p>

            {/* mode switch */}
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line p-px"
            >
              {[
                { label: "Sign in", value: true },
                { label: "Create account", value: false },
              ].map((mode) => {
                const selected = isLogin === mode.value;
                return (
                  <button
                    key={mode.label}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => switchMode(mode.value)}
                    className={cn(
                      "h-8 text-[12px] font-medium transition-colors duration-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                      selected
                        ? "bg-raised text-foreground"
                        : "bg-[hsl(var(--surface-panel))] text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              {!isLogin && (
                <Field
                  label="Name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={setName}
                  error={fieldErrors.name}
                  autoComplete="name"
                />
              )}
              <Field
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                error={fieldErrors.email}
                autoComplete="email"
              />
              <Field
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder={
                  isLogin ? "Your password" : "8+ chars, upper, lower, number"
                }
                value={password}
                onChange={setPassword}
                error={fieldErrors.password}
                autoComplete={isLogin ? "current-password" : "new-password"}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="inline-flex h-7 w-7 items-center justify-center rounded-xs text-muted-foreground transition-colors duration-1 hover:bg-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              {!isLogin && (
                <Field
                  label="Confirm password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={fieldErrors.confirmPassword}
                  autoComplete="new-password"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="inline-flex h-7 w-7 items-center justify-center rounded-xs text-muted-foreground transition-colors duration-1 hover:bg-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </button>
                  }
                />
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] leading-5 text-destructive"
                >
                  <AlertCircle
                    size={13}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {error}
                </div>
              )}
              {message && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-sm border border-success/35 bg-success/10 px-3 py-2 text-[12px] leading-5 text-success"
                >
                  <Check
                    size={13}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isDisabled}
                className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-primary text-[13.5px] font-semibold text-primary-foreground transition-[background-color,transform] duration-1 hover:bg-primary/90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-page))]"
              >
                {loading && (
                  <Loader2
                    size={15}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                )}
                {loading
                  ? "Please wait…"
                  : cooldown
                    ? "Try again shortly…"
                    : isLogin
                      ? "Sign in"
                      : "Create account"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80">
                or
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isDisabled}
              className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-sm border border-line bg-[hsl(var(--surface-panel))] text-[13px] font-medium text-foreground transition-colors duration-1 hover:border-[hsl(var(--surface-line-strong))] hover:bg-raised disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="mt-6 text-[12px] text-muted-foreground">
              {isLogin ? "New to AlgoGuru? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchMode(!isLogin)}
                className="rounded-xs font-medium text-foreground underline decoration-primary/40 decoration-1 underline-offset-4 transition-colors duration-1 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isLogin ? "Create an account" : "Sign in"}
              </button>
            </p>
          </motion.div>
        </div>

        <p className="mx-auto w-full max-w-[364px] pb-2 font-mono text-[10px] leading-4 text-muted-foreground/80">
          Credentials are handled by Supabase Auth. AlgoGuru never stores your
          password.
        </p>
      </div>

      {/* ── Proof column ────────────────────────────────────────── */}
      <aside className="relative hidden flex-col justify-center border-l border-line bg-[hsl(var(--surface-chrome))] px-14 py-16 lg:flex">
        <div
          aria-hidden="true"
          className="ws-grid-texture pointer-events-none absolute inset-0 opacity-60"
        />
        <div className="relative max-w-[440px]">
          <p className="ws-eyebrow">The algorithm workspace</p>
          <h2 className="mt-3 font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.032em]">
            Read, solve, review —{" "}
            <span className="ws-editorial text-primary">one window.</span>
          </h2>

          <ul className="mt-8 divide-y divide-line">
            {VALUE_POINTS.map((point) => (
              <li key={point.index} className="flex gap-4 py-4 first:pt-0">
                <span className="mt-0.5 font-mono text-[10.5px] tabular-nums text-primary">
                  {point.index}
                </span>
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    {point.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                    {point.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 overflow-hidden rounded-md border border-line bg-[hsl(var(--surface-page))]">
            <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">
                arrays · two-sum
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                Java
              </span>
            </div>
            <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[11px] leading-[1.7]">
              <code>
                <span className="text-primary">for</span>
                <span className="text-muted-foreground"> (</span>
                <span className="text-accent">int</span>
                <span className="text-muted-foreground">
                  {" "}
                  i = 0; i &lt; nums.length; i++) {"{"}
                </span>
                {"\n  "}
                <span className="text-accent">int</span>
                <span className="text-muted-foreground">
                  {" "}
                  need = target - nums[i];
                </span>
                {"\n  "}
                <span className="text-primary">if</span>
                <span className="text-muted-foreground">
                  {" "}
                  (seen.containsKey(need)){" "}
                </span>
                <span className="text-primary">return</span>
                <span className="text-muted-foreground"> ...</span>
                {"\n}"}
              </code>
            </pre>
            <div className="flex items-center gap-1.5 border-t border-line px-3 py-1.5 font-mono text-[10.5px] text-success">
              <Check size={10} aria-hidden="true" />2 / 2 sample tests passed
            </div>
          </div>

          <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground/80">
            401 problems · 184 lessons · Java, Python &amp; C++ playground
          </p>
        </div>
      </aside>
    </main>
  );
}
