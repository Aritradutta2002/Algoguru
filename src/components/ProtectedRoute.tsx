import { Navigate } from "react-router-dom";
import { AppLoadingScreen } from "@/components/layout/RouteFallback";
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
  if (loading) return <AppLoadingScreen label="Restoring your session" />;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default ProtectedRoute;
