import { practiceData, Problem, SubTopic, Topic } from "@/data/practiceData";
import { practiceContentMap } from "@/data/practiceContent";
import { ContentSection } from "@/data/recursionContent";

export type SolutionComplexity = {
  worst: string;
  average: string;
  optimal: string;
  space: string;
};

export type PracticeSolutionDetail = {
  problem: Problem;
  topic: Topic;
  subtopic: SubTopic;
  description: string;
  approach: string[];
  complexity: SolutionComplexity;
  javaCode: string;
  cppCode: string;
  pythonCode: string;
  hasCuratedMatch: boolean;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "in",
  "on",
  "of",
  "for",
  "to",
  "and",
  "or",
  "with",
  "by",
  "ii",
  "iii",
  "iv",
  "v",
  "lc",
  "gfg",
]);

const allProblems = practiceData.flatMap((topic) =>
  topic.subtopics.flatMap((subtopic) =>
    subtopic.problems.map((problem) => ({ problem, topic, subtopic })),
  ),
);

const allContentSections = Object.values(practiceContentMap)
  .flat()
  .filter((section) => section.theory.length > 0);

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTokenSet(text: string): Set<string> {
  return new Set(
    normalizeTitle(text)
      .split(" ")
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

function scoreTitleMatch(problemTitle: string, sectionTitle: string): number {
  const problemNorm = normalizeTitle(problemTitle);
  const sectionNorm = normalizeTitle(sectionTitle);

  if (problemNorm === sectionNorm) return 100;
  if (problemNorm.includes(sectionNorm) || sectionNorm.includes(problemNorm)) return 85;

  const pTokens = toTokenSet(problemTitle);
  const sTokens = toTokenSet(sectionTitle);
  if (pTokens.size === 0 || sTokens.size === 0) return 0;

  let common = 0;
  for (const token of pTokens) {
    if (sTokens.has(token)) common += 1;
  }

  const overlap = common / Math.max(pTokens.size, sTokens.size);
  return overlap * 100;
}

function findBestContentSection(problemTitle: string): ContentSection | null {
  let best: ContentSection | null = null;
  let bestScore = -1;

  for (const section of allContentSections) {
    const score = scoreTitleMatch(problemTitle, section.title);
    if (score > bestScore) {
      best = section;
      bestScore = score;
    }
  }

  return bestScore >= 45 ? best : null;
}

function extractDescription(section: ContentSection | null, problemTitle: string): string {
  if (!section) {
    return `Solve ${problemTitle} using a clear, optimized approach and validate correctness with edge cases.`;
  }

  const description = section.theory.find((line) => !line.toLowerCase().includes("approach:"));
  return description ? stripMarkdown(description) : `Solve ${problemTitle}.`;
}

function extractApproach(section: ContentSection | null): string[] {
  if (!section) {
    return [
      "Start with a brute-force idea and identify repeated work.",
      "Refactor to the standard pattern for this problem type (two pointers, sliding window, DP, graph traversal, etc.).",
      "Validate with edge cases and then optimize time/space complexity.",
    ];
  }

  const approachFromTheory = section.theory
    .map((line) => stripMarkdown(line))
    .filter((line) => line.length > 0)
    .map((line) => {
      const lower = line.toLowerCase();
      if (lower.startsWith("approach:")) {
        return line.slice("approach:".length).trim();
      }
      return line;
    })
    .filter((line) => !line.toLowerCase().startsWith("example:"));

  const shortlist = approachFromTheory.slice(0, 4);
  if (shortlist.length > 0) return shortlist;

  return section.keyPoints?.map((point) => stripMarkdown(point)).slice(0, 4) ?? [];
}

function extractJavaCode(section: ContentSection | null, problemTitle: string): string {
  const java = section?.code?.find((snippet) => snippet.language.toLowerCase().includes("java"));
  if (java?.content?.trim()) return java.content;

  return `public class Solution {
    public static void main(String[] args) {
        // TODO: implement ${problemTitle}
    }
}`;
}

function buildCppCode(problemTitle: string, approach: string[], javaCode: string): string {
  const steps = approach.map((step) => `// - ${step}`).join("\n");
  return `// ${problemTitle}\n// C++ reference template\n${steps}\n\n#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    // TODO: Add exact function signature for the platform.\n    void solve() {\n        // TODO: Implement using the same logic as Java solution.\n    }\n};\n\n/* Java reference\n${javaCode}\n*/`;
}

function buildPythonCode(problemTitle: string, approach: string[], javaCode: string): string {
  const steps = approach.map((step) => `# - ${step}`).join("\n");
  return `# ${problemTitle}\n# Python reference template\n${steps}\n\nclass Solution:\n    # TODO: Add exact function signature for the platform.\n    def solve(self):\n        # TODO: Implement using the same logic as Java solution.\n        pass\n\n# Java reference\n\"\"\"\n${javaCode}\n\"\"\"`;
}

export function getPracticeSolutionDetail(problemId: string): PracticeSolutionDetail | null {
  const match = allProblems.find((entry) => entry.problem.id === problemId);
  if (!match) return null;

  const section = findBestContentSection(match.problem.title);
  const description = extractDescription(section, match.problem.title);
  const approach = extractApproach(section);
  const javaCode = extractJavaCode(section, match.problem.title);

  const time = section?.timeComplexity ?? "Not specified";
  const space = section?.spaceComplexity ?? "Not specified";

  return {
    ...match,
    description,
    approach,
    complexity: {
      worst: time,
      average: time,
      optimal: time,
      space,
    },
    javaCode,
    cppCode: buildCppCode(match.problem.title, approach, javaCode),
    pythonCode: buildPythonCode(match.problem.title, approach, javaCode),
    hasCuratedMatch: Boolean(section),
  };
}
