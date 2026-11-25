import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSolutionByProblemId } from "@/data/practiceSolutions";
import { getPracticeSolutionDetail } from "@/lib/practiceSolutionUtils";
import PracticeSolutionView, {
  type PracticeSolutionViewData,
} from "@/features/practice/PracticeSolutionView";

type SolutionPageProps = {
  params: Promise<{ problemId: string; slug?: string[] }>;
};

export async function generateMetadata({
  params,
}: SolutionPageProps): Promise<Metadata> {
  const { problemId } = await params;
  const detail = getPracticeSolutionDetail(problemId);
  if (!detail) {
    return {
      title: "Practice Solution — AlgoGuru",
      description: "Step-by-step DSA solutions and complexity analysis.",
    };
  }
  return {
    title: `${detail.problem.title} Solution — AlgoGuru`,
    description: detail.description,
  };
}

export default async function PracticeSolutionPage({
  params,
}: SolutionPageProps) {
  const { problemId } = await params;
  if (!problemId) {
    redirect("/practice");
  }

  const detail = getPracticeSolutionDetail(problemId);
  if (!detail) {
    redirect("/practice");
  }

  const curated = getSolutionByProblemId(problemId);
  const solution: PracticeSolutionViewData = curated ?? {
    problemId: detail.problem.id,
    title: detail.problem.title,
    description: detail.description,
    approach: detail.approach,
    timeComplexity: detail.complexity.worst,
    spaceComplexity: detail.complexity.space,
    difficulty: detail.problem.difficulty,
    solutions: {
      java: detail.javaCode,
      cpp: detail.cppCode,
      python: detail.pythonCode,
    },
    leetcodeLink: detail.problem.leetcodeLink,
    gfgLink: detail.problem.gfgLink,
    companies: detail.problem.companies,
    tags: [],
  };

  return <PracticeSolutionView solution={solution} />;
}
