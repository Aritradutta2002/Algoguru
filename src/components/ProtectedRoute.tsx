import { Navigate } from "react-router-dom";
import { AlgoGuruLogo } from "@/components/AlgoGuruLogo";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Gate for every authenticated route.
 *
 * Lives in its own module (re-exported from `App.tsx` for existing imports)
 * because the Contest route table also needs it — importing it back from
 * `App.tsx` would create an `App` -> `ContestRoutes` -> `App` cycle.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background"
    >
      <div className="z-10">
        <AlgoGuruLogo size={180} showText={true} className="text-foreground" />
      </div>

      <div className="w-32 h-[2px] mt-6 rounded-full overflow-hidden z-10 bg-muted">
        <div className="h-full rounded-full animate-pulse bg-primary" />
      </div>
      <p className="text-xs text-muted-foreground mt-4 z-10">
        Loading…
      </p>
    </div>
  );
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default ProtectedRoute;
