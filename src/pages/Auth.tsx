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

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[0-9]/, "Must include a number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/* ── Field Component ─────────────────────────────────────── */
function Field({
  label, type, placeholder, value, onChange, error, rightSlot,
}: {
  label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  error?: string; rightSlot?: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          className={cn(
            "w-full h-10 px-3.5 rounded-lg border bg-card text-sm outline-none transition-colors placeholder:text-muted-foreground/60",
            error
              ? "border-destructive/60 focus:border-destructive"
              : "border-border hover:border-primary/40 focus:border-primary",
            rightSlot && "pr-11"
          )}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
    </div>
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
    return () => { if (cooldownRef.current) clearTimeout(cooldownRef.current); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError("");
    setMessage("");

    const schema = isLogin ? loginSchema : signupSchema;
    const data = isLogin ? { email, password } : { name, email, password, confirmPassword };
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
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setError(error.message);
        setCooldown(true);
        cooldownRef.current = setTimeout(() => setCooldown(false), 3000);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() }, emailRedirectTo: import.meta.env.VITE_PUBLIC_BASE_URL || "https://algoguru.online" },
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
      options: { redirectTo: import.meta.env.VITE_PUBLIC_BASE_URL || "https://algoguru.online" },
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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Theme Toggle Button */}
      <AppTooltip content={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 md:top-6 md:right-6 p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors z-50"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </AppTooltip>

      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.10),transparent_50%)]" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl flex flex-col md:flex-row bg-card border border-border rounded-2xl overflow-hidden shadow-xl relative z-10"
      >
        {/* ── LEFT PANEL (Form) ── */}
        <div className="flex-1 flex flex-col justify-center px-6 py-10 md:px-12 md:py-14 bg-card relative z-10 order-2 md:order-1">
          {/* Title */}
          <div className="mb-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
              <ShieldCheck size={12} className="text-primary" />
              {isLogin ? "Secure login" : "Join platform"}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.035em] mb-2">
              {isLogin ? (
                <>Welcome <span className="text-primary">back</span></>
              ) : (
                <>Create <span className="text-primary">account</span></>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin
                ? "Sign in to continue your coding journey."
                : "Let's get you set up with a new account in just a few steps."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <Field
                label="Username"
                type="text"
                placeholder="Enter Your Name"
                value={name}
                onChange={setName}
                error={fieldErrors.name}
              />
            )}
            <Field
              label="Email"
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={setEmail}
              error={fieldErrors.email}
            />
            <Field
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter Your Password"
              value={password}
              onChange={setPassword}
              error={fieldErrors.password}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {/* Confirm Password — signup only */}
            {!isLogin && (
              <Field
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter Your Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                error={fieldErrors.confirmPassword}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3.5 py-2.5">
                {error}
              </div>
            )}
            {message && (
              <div className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3.5 py-2.5">
                {message}
              </div>
            )}

            <div className="pt-2">
              <motion.button
                type="submit"
                disabled={isDisabled}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-colors hover:brightness-95 disabled:opacity-60"
              >
                {loading ? "Please wait…" : cooldown ? "Try again shortly…" : isLogin ? "Sign in" : "Sign up"}
              </motion.button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground">Or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Buttons */}
          <div className="flex items-center justify-center gap-3">
            {/* Google */}
            <AppTooltip content="Sign in with Google">
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={isDisabled}
                aria-label="Sign in with Google"
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted disabled:opacity-60 group"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" className="grayscale group-hover:grayscale-0 transition-all duration-300">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </motion.button>
            </AppTooltip>
          </div>

          {/* Toggle */}
          <p className="text-center mt-7 text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={handleToggle}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {/* ── RIGHT PANEL (Value proposition) ── */}
        <div className="hidden w-[45%] flex-col justify-center border-l border-border bg-muted/30 p-10 md:flex order-1 md:order-2">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Why AlgoGuru
            </p>
            <h3 className="mt-3 text-2xl font-bold leading-snug tracking-[-0.03em] text-foreground">
              Learn. Adapt. Grow.
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Master the craft with a workspace built around deliberate practice.
            </p>

            <ul className="mt-8 space-y-4">
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
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-[11px] font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
