import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { AppTooltip } from "@/components/ui/tooltip";
import { getAuthRedirectUrl } from "@/lib/authUrl";
import { Surface, Field as UiField } from "@/components/layout/PagePrimitives";
import { Button } from "@/components/ui/button";

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
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/* ── Field Component ─────────────────────────────────────── */
function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  rightSlot,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rightSlot?: React.ReactNode;
}) {
  const inputId = `auth-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <UiField label={label} htmlFor={inputId} error={error} className="w-full">
      <div className="relative">
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          aria-invalid={error ? true : undefined}
          className={cn("ui-input h-11 bg-card", rightSlot && "pr-11")}
        />
        {rightSlot && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightSlot}
          </span>
        )}
      </div>
    </UiField>
  );
}

/* ── Main Auth Component ─────────────────────────────────── */
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError("");
    setMessage("");

    const schema = isLogin ? loginSchema : signupSchema;
    const data = isLogin
      ? { email, password }
      : { name, email, password, confirmPassword };
    const result = schema.safeParse(data);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (!errs[key]) errs[key] = err.message;
      });
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(error.message);
        setCooldown(true);
        cooldownRef.current = setTimeout(() => setCooldown(false), 3000);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });
      if (error) {
        setError(error.message);
        setCooldown(true);
        cooldownRef.current = setTimeout(() => setCooldown(false), 3000);
      } else {
        setMessage("Check your email for a confirmation link!");
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthRedirectUrl() },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const isDisabled = loading || cooldown;

  // Reset all fields when switching between login/signup
  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError("");
    setMessage("");
    setFieldErrors({});
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="ui-auth relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground md:px-8 md:py-14">
      {/* Theme Toggle Button */}
      <AppTooltip
        content={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        <button
          onClick={toggleTheme}
          className="ui-btn ui-btn--reset ui-btn--line ui-btn--icon absolute right-4 top-4 z-50 md:right-6 md:top-6"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </AppTooltip>

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.09),transparent_55%)]"
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-5xl"
      >
        <Surface
          padded={false}
          className="grid overflow-hidden md:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)]"
        >
          {/* ── LEFT PANEL (Form) ── */}
          <div className="order-2 flex min-w-0 flex-col justify-center px-6 py-10 md:order-1 md:px-10 md:py-12">
            <div className="mb-7">
              <p className="ui-kicker">
                {isLogin ? "Secure login" : "Join AlgoGuru"}
              </p>
              <h1 className="ui-h2 mt-3">
                {isLogin ? "Welcome back" : "Create your account"}
              </h1>
              <p className="ui-lede mt-3">
                {isLogin
                  ? "Sign in to continue your coding journey."
                  : "Let's get you set up with a new account in just a few steps."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <Field
                  label="Username"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={setName}
                  error={fieldErrors.name}
                />
              )}
              <Field
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={setEmail}
                error={fieldErrors.email}
              />
              <Field
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
                error={fieldErrors.password}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="text-muted-foreground/70 transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />

              {/* Confirm Password — signup only */}
              {!isLogin && (
                <Field
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={fieldErrors.confirmPassword}
                  rightSlot={
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="text-muted-foreground/70 transition-colors hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  }
                />
              )}

              {error && (
                <div
                  role="alert"
                  className="rounded-[var(--radius-control)] border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
                >
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-[var(--radius-control)] border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
                  {message}
                </div>
              )}

              <div className="pt-1">
                <Button
                  type="submit"
                  size="cta"
                  disabled={isDisabled}
                  className="w-full"
                >
                  {loading
                    ? "Please wait…"
                    : cooldown
                      ? "Try again shortly…"
                      : isLogin
                        ? "Sign in"
                        : "Sign up"}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="ui-meta">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Social Buttons */}
            <div className="flex items-center justify-center">
              <AppTooltip content="Sign in with Google">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isDisabled}
                  aria-label="Sign in with Google"
                  className="ui-btn ui-btn--reset ui-btn--line group flex h-11 items-center gap-2.5 px-4 text-sm"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="grayscale transition-all duration-300 group-hover:grayscale-0"
                    aria-hidden="true"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>
              </AppTooltip>
            </div>

            {/* Toggle */}
            <p className="mt-7 text-center text-sm text-muted-foreground">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                type="button"
                onClick={handleToggle}
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          {/* ── RIGHT PANEL (Value proposition) ── */}
          <div className="order-1 hidden flex-col justify-between gap-10 border-b border-border bg-muted/30 p-10 md:order-2 md:flex md:border-b-0 md:border-l">
            <div>
              <p className="ui-kicker">Why AlgoGuru</p>
              <h2 className="ui-h3 mt-3">Learn. Adapt. Grow.</h2>
              <p className="ui-lede mt-3 max-w-none text-sm">
                Master the craft with a workspace built around deliberate
                practice.
              </p>

              <ul className="mt-8 space-y-5">
                {[
                  {
                    title: "Structured learning paths",
                    body: "Interactive roadmaps for DSA, Java, and system design.",
                  },
                  {
                    title: "Interview-ready practice",
                    body: "Curated company questions with editorials in three languages.",
                  },
                  {
                    title: "Practice in the browser",
                    body: "A full editor with test cases, so you can solve without setup.",
                  },
                ].map((item, index) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="ui-meta mt-1 shrink-0">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <p className="ui-meta">DSA · Java · System design</p>
          </div>
        </Surface>
      </motion.div>
    </div>
  );
}
