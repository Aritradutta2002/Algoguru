import { redirect } from "next/navigation";
import { buildQuizRedirectHref } from "@/components/contest/ContestRoutes";

export default async function QuizLegacyRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  redirect(buildQuizRedirectHref(resolved));
}
