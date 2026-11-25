import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySession, verifyUserRole } from "@/lib/dal";
import { AdminView } from "@/features/admin/AdminView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Console — AlgoGuru",
  description: "Manage user accounts, platform roles, and analytics on AlgoGuru.",
};

export default async function AdminPage() {
  // Server-side role verification when an SSR cookie session exists;
  // falls back smoothly to AdminView's client `useIsAdmin` check when unconfigured
  // or when only client session storage is populated.
  const session = await verifySession();
  if (session.isAuth) {
    const isAdmin = await verifyUserRole("admin");
    if (!isAdmin) {
      redirect("/");
    }
  }

  return <AdminView />;
}
