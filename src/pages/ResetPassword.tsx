import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-obsidian-void">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Reset password</h1>
          <p className="text-sm mt-1 text-muted-foreground">Enter your new password</p>
        </div>
        <div className="p-6 rounded-[0.875rem] bg-obsidian-pane border border-obsidian-border">
          {success ? (
            <div className="text-center text-sm py-4 text-emerald-400">Password updated! Redirecting…</div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldError(""); }}
                    required
                    minLength={8}
                    className={`w-full h-10 pl-9 pr-3 rounded-lg bg-obsidian-elevated text-sm outline-none border transition-colors text-foreground placeholder:text-muted-foreground/60 ${fieldError ? "border-destructive/60" : "border-obsidian-border focus:border-foreground/40"}`}
                  />
                </div>
                {fieldError && <p className="text-xs mt-1.5 px-1 text-destructive">{fieldError}</p>}
                <p className="text-xs mt-1.5 px-1 text-muted-foreground">
                  Min 8 chars, uppercase, lowercase, and a number
                </p>
              </div>
              {error && <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</div>}
              <button type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/85 disabled:opacity-60 transition-colors">
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
