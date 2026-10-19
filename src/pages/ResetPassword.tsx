import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field as UiField, Surface } from "@/components/layout/PagePrimitives";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.09),transparent_55%)]"
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <Surface padding="lg">
          <p className="ui-kicker">Account recovery</p>
          <h1 className="ui-h3 mt-3">Reset password</h1>
          <p className="ui-lede mt-2 text-sm">
            Choose a new password for your AlgoGuru account.
          </p>

          {success ? (
            <div className="mt-6 rounded-[var(--radius-control)] border border-success/30 bg-success/10 px-3.5 py-3 text-sm text-success">
              Password updated. Redirecting…
            </div>
          ) : (
            <form onSubmit={handleReset} className="mt-6 space-y-4">
              <UiField
                label="New password"
                htmlFor="reset-password"
                hint="Min 8 characters, with an uppercase letter, a lowercase letter and a number."
                error={fieldError || undefined}
              >
                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="reset-password"
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldError("");
                    }}
                    required
                    minLength={8}
                    aria-invalid={fieldError ? true : undefined}
                    className="ui-input h-11 pl-10"
                  />
                </div>
              </UiField>
              {error && (
                <div
                  role="alert"
                  className="rounded-[var(--radius-control)] border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
                >
                  {error}
                </div>
              )}
              <Button
                type="submit"
                size="cta"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </Surface>
      </motion.div>
    </div>
  );
}
