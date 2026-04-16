import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[0-9]/, "Must include a number"),
});

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

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
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setSuccess(true);
      setTimeout(() => navigate("/", { replace: true }), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "hsl(var(--background))" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Reset Password</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Enter your new password</p>
        </div>
        <div className="p-6 rounded-2xl" style={{ background: "var(--gradient-card)", border: "1px solid hsl(var(--border))" }}>
          {success ? (
            <div className="text-center text-sm py-4" style={{ color: "hsl(var(--success))" }}>Password updated! Redirecting...</div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <input type="password" placeholder="New password" value={password} onChange={(e) => { setPassword(e.target.value); setFieldError(""); }} required minLength={8}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none" style={{ background: "hsl(var(--muted)/0.4)", border: `1px solid hsl(var(--${fieldError ? "destructive" : "border"}))`, color: "hsl(var(--foreground))" }} />
                </div>
                {fieldError && <p className="text-xs mt-1.5 px-1" style={{ color: "hsl(var(--destructive))" }}>{fieldError}</p>}
                <p className="text-[10px] mt-1.5 px-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Min 8 chars, uppercase, lowercase, and a number
                </p>
              </div>
              {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "hsl(var(--destructive)/0.1)", color: "hsl(var(--destructive))" }}>{error}</div>}
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold" style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
