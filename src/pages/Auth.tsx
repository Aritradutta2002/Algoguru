import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { z } from "zod";
import { cn } from "@/lib/utils";

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

/* ── Cartoon Mascot SVG ──────────────────────────────────── */
function MascotSVG() {
  return (
    <svg viewBox="0 0 320 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto drop-shadow-2xl">
      {/* Shadow */}
      <ellipse cx="160" cy="400" rx="85" ry="14" fill="currentColor" className="text-muted-foreground/20" />

      {/* LEFT ARM */}
      <rect x="48" y="160" width="28" height="80" rx="14" fill="#1a1a1a" stroke="#1a1a1a" strokeWidth="2"/>
      {/* Left glove */}
      <circle cx="58" cy="248" r="20" fill="#fff" stroke="#1a1a1a" strokeWidth="3"/>
      <circle cx="48" cy="240" r="10" fill="#fff" stroke="#1a1a1a" strokeWidth="2.5"/>
      <circle cx="70" cy="238" r="9" fill="#fff" stroke="#1a1a1a" strokeWidth="2.5"/>
      <circle cx="56" cy="260" r="9" fill="#fff" stroke="#1a1a1a" strokeWidth="2.5"/>

      {/* RIGHT ARM */}
      <rect x="244" y="160" width="28" height="80" rx="14" fill="#1a1a1a" stroke="#1a1a1a" strokeWidth="2"/>
      {/* Right glove */}
      <circle cx="262" cy="248" r="20" fill="#fff" stroke="#1a1a1a" strokeWidth="3"/>
      <circle cx="252" cy="240" r="10" fill="#fff" stroke="#1a1a1a" strokeWidth="2.5"/>
      <circle cx="274" cy="240" r="9" fill="#fff" stroke="#1a1a1a" strokeWidth="2.5"/>
      <circle cx="264" cy="260" r="9" fill="#fff" stroke="#1a1a1a" strokeWidth="2.5"/>

      {/* LAPTOP BODY */}
      <rect x="60" y="80" width="200" height="200" rx="18" fill="var(--color-primary, #4DA6FF)" stroke="#1a1a1a" strokeWidth="4" className="text-primary" style={{ fill: "currentColor" }} />

      {/* Screen bezel */}
      <rect x="75" y="95" width="170" height="150" rx="10" fill="#1a2a4a" stroke="#1a1a1a" strokeWidth="2.5"/>

      {/* Screen content - code lines */}
      <rect x="88" y="112" width="80" height="7" rx="3.5" fill="#FFD500" opacity="0.9"/>
      <rect x="88" y="126" width="120" height="7" rx="3.5" fill="#A3E635" opacity="0.7"/>
      <rect x="88" y="140" width="60" height="7" rx="3.5" fill="#FF3366" opacity="0.7"/>
      <rect x="88" y="154" width="100" height="7" rx="3.5" fill="#4DA6FF" opacity="0.9"/>
      <rect x="88" y="168" width="90" height="7" rx="3.5" fill="#FFD500" opacity="0.6"/>
      <rect x="88" y="182" width="70" height="7" rx="3.5" fill="#A3E635" opacity="0.8"/>
      <rect x="88" y="196" width="110" height="7" rx="3.5" fill="#FF3366" opacity="0.6"/>
      <rect x="88" y="210" width="50" height="7" rx="3.5" fill="#fff" opacity="0.4"/>

      {/* Cursor blink */}
      <rect x="144" y="210" width="4" height="9" rx="1" fill="#fff" opacity="0.9"/>

      {/* Side buttons */}
      <rect x="255" y="105" width="10" height="22" rx="5" fill="#FFD500" stroke="#1a1a1a" strokeWidth="2"/>
      <rect x="255" y="135" width="10" height="22" rx="5" fill="#FF3366" stroke="#1a1a1a" strokeWidth="2"/>
      <rect x="255" y="165" width="10" height="22" rx="5" fill="#A3E635" stroke="#1a1a1a" strokeWidth="2"/>

      {/* EYES on top of laptop */}
      {/* Left eye */}
      <circle cx="126" cy="76" r="24" fill="#fff" stroke="#1a1a1a" strokeWidth="3.5"/>
      <circle cx="124" cy="75" r="14" fill="#1a1a1a"/>
      <circle cx="120" cy="71" r="5" fill="#fff"/>
      {/* Right eye */}
      <circle cx="194" cy="76" r="24" fill="#fff" stroke="#1a1a1a" strokeWidth="3.5"/>
      <circle cx="196" cy="75" r="14" fill="#1a1a1a"/>
      <circle cx="192" cy="71" r="5" fill="#fff"/>

      {/* Eyebrows */}
      <path d="M108 55 Q126 46 144 55" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <path d="M176 55 Q194 46 212 55" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" fill="none"/>

      {/* Smile */}
      <path d="M118 275 Q160 305 202 275" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" fill="none"/>
      {/* Teeth */}
      <path d="M130 285 Q160 308 190 285" stroke="none" fill="#fff"/>
      <path d="M130 285 Q160 308 190 285 Q160 308 130 285Z" fill="#fff" stroke="#1a1a1a" strokeWidth="2"/>

      {/* Blush circles */}
      <circle cx="105" cy="285" r="14" fill="#FF8FA3" opacity="0.5"/>
      <circle cx="215" cy="285" r="14" fill="#FF8FA3" opacity="0.5"/>

      {/* LEFT LEG */}
      <rect x="108" y="275" width="32" height="80" rx="16" fill="#1a1a1a"/>
      {/* Left shoe */}
      <rect x="90" y="343" width="60" height="28" rx="14" fill="#FF3366" stroke="#1a1a1a" strokeWidth="3"/>
      <rect x="88" y="350" width="22" height="18" rx="9" fill="#f0f0f0" stroke="#1a1a1a" strokeWidth="2"/>

      {/* RIGHT LEG */}
      <rect x="180" y="275" width="32" height="70" rx="16" fill="#1a1a1a"/>
      {/* Right shoe */}
      <rect x="168" y="333" width="60" height="28" rx="14" fill="#FF3366" stroke="#1a1a1a" strokeWidth="3"/>
      <rect x="170" y="340" width="22" height="18" rx="9" fill="#f0f0f0" stroke="#1a1a1a" strokeWidth="2"/>

      {/* Star sparkles */}
      <g opacity="0.85">
        <path d="M42 80 L44 72 L46 80 L54 82 L46 84 L44 92 L42 84 L34 82Z" fill="#1a1a1a"/>
        <path d="M272 60 L274 52 L276 60 L284 62 L276 64 L274 72 L272 64 L264 62Z" fill="#1a1a1a"/>
        <path d="M60 340 L61.5 334 L63 340 L69 341.5 L63 343 L61.5 349 L60 343 L54 341.5Z" fill="#1a1a1a"/>
        <path d="M280 310 L281.5 304 L283 310 L289 311.5 L283 313 L281.5 319 L280 313 L274 311.5Z" fill="#1a1a1a"/>
        <circle cx="290" cy="100" r="5" fill="none" stroke="#1a1a1a" strokeWidth="2.5"/>
        <circle cx="38" cy="190" r="4" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <circle cx="298" cy="220" r="3.5" fill="#1a1a1a"/>
        <circle cx="50" cy="130" r="3" fill="#1a1a1a"/>
      </g>
    </svg>
  );
}

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
      <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
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
            "w-full px-4 py-3.5 rounded-xl border bg-card text-sm font-medium outline-none transition-all duration-200 placeholder:text-muted-foreground/40",
            error
              ? "border-destructive/60 focus:border-destructive focus:ring-4 focus:ring-destructive/10"
              : "border-border hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10",
            rightSlot && "pr-12"
          )}
        />
        {rightSlot && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
      {error && <p className="text-xs font-bold text-destructive mt-1.5">{error}</p>}
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
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 md:top-8 md:right-8 p-3 rounded-full border bg-card text-foreground hover:bg-muted transition-colors shadow-sm z-50"
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl flex flex-col md:flex-row bg-card border rounded-[32px] overflow-hidden shadow-2xl shadow-primary/5 relative z-10"
      >
        {/* ── LEFT PANEL (Form) ── */}
        <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-14 bg-card relative z-10 order-2 md:order-1">
          {/* Title */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-[10px] font-bold uppercase tracking-widest mb-6">
              <ShieldCheck size={12} className="text-primary" />
              <span className="text-muted-foreground">{isLogin ? "Secure Login" : "Join Platform"}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              {isLogin ? (
                <>Welcome <span className="text-primary">Back</span></>
              ) : (
                <>Create <span className="text-accent">Account</span></>
              )}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
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
              <div className="text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            {message && (
              <div className="text-xs font-bold text-success bg-success/10 border border-success/20 rounded-xl px-4 py-3">
                {message}
              </div>
            )}

            <div className="pt-2">
              <motion.button
                type="submit"
                disabled={isDisabled}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Please wait..." : cooldown ? "Try again shortly..." : isLogin ? "Sign In" : "Sign Up"}
              </motion.button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Or</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* Social Buttons */}
          <div className="flex items-center justify-center gap-3">
            {/* Google */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={isDisabled}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Sign in with Google"
              className="w-14 h-14 rounded-xl flex items-center justify-center border bg-muted/20 hover:bg-muted/50 disabled:opacity-60 transition-all group"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" className="grayscale group-hover:grayscale-0 transition-all duration-300">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </motion.button>
          </div>

          {/* Toggle */}
          <p className="text-center mt-8 text-sm font-medium text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={handleToggle}
              className="font-bold text-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        {/* ── RIGHT PANEL (Mascot / Art) ── */}
        <div className="hidden md:flex w-[45%] flex-col items-center justify-center p-8 relative overflow-hidden bg-muted/20 border-l order-1 md:order-2">
          {/* Subtle grid pattern background */}
          <div 
            className="absolute inset-0 opacity-[0.05] pointer-events-none" 
            style={{ 
              backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", 
              backgroundSize: "24px 24px" 
            }} 
            aria-hidden="true" 
          />

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-full max-w-[280px] drop-shadow-2xl relative z-10"
          >
            <MascotSVG />
          </motion.div>

          {/* Caption */}
          <div className="mt-12 text-center relative z-10">
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">
              Learn. <span className="text-primary">Adapt</span>. Grow.
            </h3>
            <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
              Master the Craft With Us
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}