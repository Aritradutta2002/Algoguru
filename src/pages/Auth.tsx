import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BrainCircuit,
  Check,
  Code2,
  Eye,
  EyeOff,
  Loader2,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getAuthRedirectUrl } from "@/lib/authUrl";
import { cn } from "@/lib/utils";
import { AppTooltip } from "@/components/ui/tooltip";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";

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
        className="mb-1.5 block text-[12px] font-semibold text-foreground/80"
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
            "h-11 w-full rounded-xl border bg-background/50 px-3.5 pr-11 text-sm shadow-[inset_0_1px_0_hsl(var(--foreground)/0.025)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground/60 focus:bg-background",
            error
              ? "border-destructive/60 focus:border-destructive focus:ring-2 focus:ring-destructive/15"
              : "border-border hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-ring/15",
          )}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 flex items-center gap-1 text-[11.5px] text-destructive"
        >
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Google mark ───────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
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
    icon: Target,
    title: "A path, not a pile of links",
    body: "Structured DSA, Java and system-design tracks that tell you what to do next.",
  },
  {
    icon: Code2,
    title: "Solve without setup",
    body: "A full in-browser editor with tests, so the only thing between you and practice is a click.",
  },
  {
    icon: BrainCircuit,
    title: "Guru AI when you're stuck",
    body: "Hints and explanations that help you reason through the problem — not just copy an answer.",
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
    if (session) navigate("/", { replace: true });
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
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background p-4 text-foreground md:p-8">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,hsl(var(--primary)/0.13),transparent_42%),radial-gradient(circle_at_85%_100%,hsl(var(--accent)/0.08),transparent_38%)]" />
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="aurora-blob left-[12%] top-[16%] h-64 w-64 bg-primary/10" />
        <div
          className="aurora-blob bottom-[6%] right-[10%] h-64 w-64 bg-sky-400/10"
          style={{ animationDelay: "-8s" }}
        />
        <div className="bg-noise absolute inset-0" />
      </div>

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 md:p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
        <AppTooltip content={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/70 text-muted-foreground shadow-soft backdrop-blur-sm transition-all duration-200 hover:bg-card hover:text-foreground active:scale-[0.94]"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </AppTooltip>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mt-12 grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border/80 bg-card/90 shadow-overlay backdrop-blur-xl md:mt-0 md:grid-cols-[1.06fr_.94fr]"
      >
        {/* ── Form ── */}
        <div className="relative flex flex-col justify-center p-6 sm:p-9 md:p-12">
          <Link
            to="/"
            className="mb-8 inline-flex w-fit items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="AlgoGuru home"
          >
            <AlgoGuruMark size={34} />
            <span className="font-display text-[16px] font-bold tracking-tight">
              Algo<span className="text-primary">Guru</span>
            </span>
          </Link>

          <div className="mb-7">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[10.5px] font-semibold text-muted-foreground">
              <ShieldCheck size={11} className="text-primary" />
              {isLogin ? "Secure sign in" : "Start free"}
            </span>
            <h1 className="mt-4 font-display text-[2rem] font-bold leading-[1.08] tracking-[-0.045em] md:text-[2.35rem]">
              {isLogin ? (
                <>
                  Welcome <span className="text-gradient-brand">back.</span>
                </>
              ) : (
                <>
                  Build your <span className="text-gradient-brand">edge.</span>
                </>
              )}
            </h1>
            <p className="mt-2.5 max-w-sm text-[13.5px] leading-6 text-muted-foreground">
              {isLogin
                ? "Sign in to continue your coding journey."
                : "Create an account and pick up exactly where you left off."}
            </p>
          </div>

          {/* mode switch */}
          <div className="mb-6 flex rounded-xl border border-border/70 bg-muted/40 p-1">
            {[
              { label: "Sign in", value: true },
              { label: "Create account", value: false },
            ].map((mode) => (
              <button
                key={mode.label}
                type="button"
                onClick={() => switchMode(mode.value)}
                aria-pressed={isLogin === mode.value}
                className={cn(
                  "relative flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors duration-200",
                  isLogin === mode.value
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isLogin === mode.value && (
                  <motion.span
                    layoutId="auth-mode-pill"
                    className="absolute inset-0 rounded-lg border border-border/80 bg-card shadow-soft"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{mode.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder={isLogin ? "Your password" : "8+ chars, upper, lower, number"}
              value={password}
              onChange={setPassword}
              error={fieldErrors.password}
              autoComplete={isLogin ? "current-password" : "new-password"}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-[12px] leading-5 text-destructive"
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            {message && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-[12px] leading-5 text-success"
              >
                <Check size={14} className="mt-0.5 shrink-0" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isDisabled}
              className="button-shine mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--gradient-cta)] text-sm font-semibold text-white shadow-accent transition-all duration-200 ease-premium hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading
                ? "Please wait…"
                : cooldown
                  ? "Try again shortly…"
                  : isLogin
                    ? "Sign in"
                    : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/70" />
            <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
              or
            </span>
            <div className="h-px flex-1 bg-border/70" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isDisabled}
            className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background/50 text-[13px] font-semibold text-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.025)] transition-all duration-200 hover:border-primary/30 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-[12px] text-muted-foreground">
            {isLogin ? "New to AlgoGuru? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(!isLogin)}
              className="font-semibold text-foreground underline decoration-primary/30 decoration-2 underline-offset-4 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>

        {/* ── Value panel ── */}
        <aside className="relative hidden overflow-hidden border-l border-border/70 bg-[linear-gradient(160deg,hsl(var(--primary)/0.13),hsl(var(--card))_42%,hsl(var(--accent)/0.08))] p-10 md:flex md:flex-col md:justify-center">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-35" aria-hidden="true" />
          <div
            className="aurora-blob -right-10 top-10 h-56 w-56 bg-primary/20"
            aria-hidden="true"
          />
          <div
            className="aurora-blob -bottom-12 left-0 h-52 w-52 bg-accent/10"
            style={{ animationDelay: "-7s" }}
            aria-hidden="true"
          />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary">
              <Sparkles size={11} />
              Why AlgoGuru
            </span>
            <h2 className="mt-5 font-display text-[2rem] font-bold leading-[1.1] tracking-[-0.04em]">
              Learn deliberately.
              <br />
              <span className="text-gradient-brand">Interview confidently.</span>
            </h2>
            <p className="mt-3 max-w-sm text-[13px] leading-6 text-muted-foreground">
              A focused workspace built around deliberate practice — not another
              endless tutorial feed.
            </p>

            <ul className="mt-8 space-y-5">
              {VALUE_POINTS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-card/70 text-primary shadow-soft">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-9 overflow-hidden rounded-2xl border border-border/70 bg-card/70 shadow-card backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Today's session
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  On track
                </span>
              </div>
              <div className="space-y-3 px-4 py-4">
                {[
                  { label: "Warm up · Two Sum", done: true },
                  { label: "Pattern · Sliding Window", done: false },
                  { label: "Mock · 25 min timed set", done: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        item.done
                          ? "border-primary/30 bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {item.done ? (
                        <Check size={10} strokeWidth={3} />
                      ) : (
                        <span className="h-1 w-1 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-[11.5px]",
                        item.done ? "text-foreground/80" : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-1.5 bg-muted">
                <div className="h-full w-1/3 rounded-r-full bg-gradient-to-r from-primary to-sky-400" />
              </div>
            </div>
          </div>
        </aside>
      </motion.div>
    </main>
  );
}
