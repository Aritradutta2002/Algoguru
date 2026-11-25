import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
