import { Navigate } from "react-router-dom";
import { BrandLoader } from "@/components/brand/BrandLoader";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Gate for every authenticated route.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <BrandLoader size={56} label="Loading AlgoGuru…" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default ProtectedRoute;
