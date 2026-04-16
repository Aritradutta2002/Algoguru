import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[0-9]/, "Must include a number"),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    // Validate
    const schema = isLogin ? loginSchema : signupSchema;
    const data = isLogin ? { email, password } : { name, email, password };
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
        // Cooldown after failed login
        setCooldown(true);
        cooldownRef.current = setTimeout(() => setCooldown(false), 3000);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: window.location.origin,
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
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const isDisabled = loading || cooldown;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="hero-glow w-[500px] h-[500px] -top-48 left-1/2 -translate-x-1/2 opacity-[0.06]" style={{ background: "hsl(var(--primary))" }} />
      <div className="hero-glow w-64 h-64 bottom-10 -right-10 opacity-[0.04]" style={{ background: "hsl(var(--accent))" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl font-bold text-lg font-mono mb-4"
            style={{
              background: "var(--gradient-primary)",
              color: "hsl(var(--primary-foreground))",
              boxShadow: "0 4px 20px hsl(var(--primary)/0.3)",
            }}
          >
            AG
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm font-light mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {isLogin ? "Sign in to continue learning" : "Start your learning journey"}
          </p>
        </div>

        {/* Card */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: "var(--gradient-card)",
            border: "1px solid hsl(var(--border))",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isDisabled}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:brightness-110 disabled:opacity-50 mb-5"
            style={{
              background: "hsl(var(--muted)/0.5)",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
            <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                    style={{
                      background: "hsl(var(--muted)/0.4)",
                      border: fieldErrors.name ? "1px solid hsl(var(--destructive))" : "1px solid hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </div>
                {fieldErrors.name && <p className="text-[11px] mt-1 ml-1" style={{ color: "hsl(var(--destructive))" }}>{fieldErrors.name}</p>}
              </div>
            )}
            <div>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                  style={{
                    background: "hsl(var(--muted)/0.4)",
                    border: fieldErrors.email ? "1px solid hsl(var(--destructive))" : "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                />
              </div>
              {fieldErrors.email && <p className="text-[11px] mt-1 ml-1" style={{ color: "hsl(var(--destructive))" }}>{fieldErrors.email}</p>}
            </div>
            <div>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                  style={{
                    background: "hsl(var(--muted)/0.4)",
                    border: fieldErrors.password ? "1px solid hsl(var(--destructive))" : "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-[11px] mt-1 ml-1" style={{ color: "hsl(var(--destructive))" }}>{fieldErrors.password}</p>}
            </div>

            {error && (
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "hsl(var(--destructive)/0.1)", color: "hsl(var(--destructive))" }}>
                {error}
              </div>
            )}
            {message && (
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "hsl(var(--success)/0.1)", color: "hsl(var(--success))" }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isDisabled}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 hover:brightness-110"
              style={{
                background: "var(--gradient-primary)",
                color: "hsl(var(--primary-foreground))",
                boxShadow: "0 4px 16px hsl(var(--primary)/0.3)",
              }}
            >
              {loading ? "Please wait..." : cooldown ? "Try again shortly..." : isLogin ? "Sign In" : "Create Account"}
              {!isDisabled && <ArrowRight size={14} />}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); setFieldErrors({}); }}
              className="text-xs font-medium transition-colors"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span style={{ color: "hsl(var(--primary))" }} className="font-semibold">
                {isLogin ? "Sign up" : "Sign in"}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
