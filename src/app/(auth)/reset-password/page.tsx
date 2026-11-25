import type { Metadata } from "next";
import { ResetPasswordView } from "@/features/auth/ResetPasswordView";

export const metadata: Metadata = {
  title: "Reset password — AlgoGuru",
  description: "Choose a new password for your AlgoGuru account.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
