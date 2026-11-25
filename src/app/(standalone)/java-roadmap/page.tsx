import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function JavaRoadmapRedirectPage() {
  redirect("/roadmap/java");
}
