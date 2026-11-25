import type { Metadata } from "next";
import { ProfileView } from "@/features/profile/ProfileView";

export const metadata: Metadata = {
  title: "Profile — AlgoGuru",
  description:
    "View your coding consistency heatmap, DSA progress, and connected LeetCode and CodeChef profiles on AlgoGuru.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
