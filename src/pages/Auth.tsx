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
        className="mb-1.5 block text-xs font-medium text-muted-foreground"
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
            "h-10 w-full rounded-lg border border-obsidian-border bg-obsidian-elevated px-3 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus-visible:ring-2 focus-visible:ring-ring/60",
            error && "border-destructive focus:border-destructive",
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
    <main className="relative flex min-h-[100dvh] items-center justify-center bg-obsidian-void p-4 text-foreground md:p-8">
      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 md:p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
        <AppTooltip content={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-obsidian-border bg-obsidian-pane text-muted-foreground transition-colors hover:bg-obsidian-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </AppTooltip>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative z-10 mt-12 grid w-full max-w-5xl overflow-hidden rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane md:mt-0 md:grid-cols-[1.08fr_0.92fr]"
      >
        {/* ── Form ── */}
        <div className="relative flex flex-col justify-center p-6 sm:p-9 md:p-12">
          <Link
            to="/"
            className="mb-8 inline-flex w-fit items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="AlgoGuru home"
          >
            <AlgoGuruMark size={32} />
            <span className="text-[15px] font-semibold tracking-tight">
              AlgoGuru
            </span>
          </Link>

          <div className="mb-6">
            <p className="lp-kicker mb-2">
              <ShieldCheck size={12} className="inline mr-1" />
              {isLogin ? "Secure sign in" : "Start free"}
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground md:text-3xl">
              {isLogin ? "Welcome back" : "Build your edge"}
            </h1>
            <p className="mt-2 max-w-sm text-[13.5px] leading-6 text-muted-foreground">
              {isLogin
                ? "Sign in to continue your coding journey."
                : "Create an account and pick up exactly where you left off."}
            </p>
          </div>

          {/* mode switch */}
          <div className="mb-6 flex rounded-lg border border-obsidian-border bg-obsidian-elevated p-1">
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
                  "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                  isLogin === mode.value
                    ? "bg-obsidian-pane text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{mode.label}</span>
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
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive"
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            {message && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs leading-5 text-emerald-500"
              >
                <Check size={14} className="mt-0.5 shrink-0" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isDisabled}
              className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
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
            <div className="h-px flex-1 bg-obsidian-border" />
            <span className="text-[11px] text-muted-foreground">
              or
            </span>
            <div className="h-px flex-1 bg-obsidian-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isDisabled}
            className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-obsidian-border bg-obsidian-pane text-[13px] font-medium text-foreground transition-colors hover:bg-obsidian-elevated disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {isLogin ? "New to AlgoGuru? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(!isLogin)}
              className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>

        {/* ── Value panel ── */}
        <aside className="relative hidden border-l border-obsidian-border bg-obsidian-void p-10 md:flex md:flex-col md:justify-center">
          <div>
            <p className="lp-kicker mb-3">Why AlgoGuru</p>
            <h2 className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-foreground">
              Learn deliberately.
              <br />
              Interview confidently.
            </h2>
            <p className="mt-3 max-w-sm text-[13.5px] leading-6 text-muted-foreground">
              A focused workspace built around deliberate practice — not another
              endless tutorial feed.
            </p>

            <ul className="mt-8 space-y-4">
              {VALUE_POINTS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-obsidian-border bg-obsidian-pane text-foreground/80">
                    <Icon size={15} />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 overflow-hidden rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane">
              <div className="flex items-center justify-between border-b border-obsidian-border px-4 py-2.5">
                <span className="font-mono text-[11px] text-muted-foreground">
                  Today's session
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  On track
                </span>
              </div>
              <div className="space-y-2.5 px-4 py-3.5">
                {[
                  { label: "Warm up · Two Sum", done: true },
                  { label: "Pattern · Sliding Window", done: false },
                  { label: "Mock · 25 min timed set", done: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]",
                        item.done
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                          : "border-obsidian-border bg-obsidian-elevated text-muted-foreground",
                      )}
                    >
                      {item.done ? (
                        <Check size={9} strokeWidth={3} />
                      ) : (
                        <span className="h-1 w-1 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        item.done ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-1 bg-obsidian-elevated">
                <div className="h-full w-1/3 rounded-r-full bg-primary" />
              </div>
            </div>
          </div>
        </aside>
      </motion.div>
    </main>
  );
}
