import { practiceData, Problem, SubTopic, Topic } from "@/data/practiceData";
import { practiceContentMap } from "@/data/practiceContent";
import { ContentSection } from "@/data/recursionContent";
import { getSolutionByProblemId, ProblemSolution } from "@/data/practiceSolutions";

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

function toCamelCase(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join("");
}

function toPascalCase(title: string): string {
  const camel = toCamelCase(title);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function extractJavaCode(section: ContentSection | null, problemTitle: string): string {
  const java = section?.code?.find((snippet) => snippet.language.toLowerCase().includes("java"));
  if (java?.content?.trim()) return java.content;

  const method = toCamelCase(problemTitle);
  return `// Problem: ${problemTitle}
// Approach:
// 1. Clarify input bounds and edge cases (empty, single element, duplicates).
// 2. Choose optimal pattern (hashing / two-pointers / sliding window / DP as applicable).
// 3. Implement core loop with early exits and handle boundaries.
// 4. Verify with dry-run and optimize time/space.

import java.util.*;

class Solution {
    // Clean, interview-ready implementation for "${problemTitle}"
    public int ${method}(int[] nums) {
        // Step-by-step (see approach):
        // - Use efficient data structure / pointer technique
        // - Iterate once, maintain invariant
        // - Return result with edge-case handling
        if (nums == null || nums.length == 0) return 0;
        // Example scaffold - replace with exact logic for this problem
        int ans = 0;
        for (int x : nums) ans += x; // placeholder to show structure
        return ans;
    }

    // Alternative: adapt signature to match platform (List, String, etc.)
    // Add helper methods as needed for modular, testable code
}`;
}

function buildCppCode(problemTitle: string, approach: string[], javaCode: string): string {
  const method = toCamelCase(problemTitle);
  const steps = approach.map((s) => `// - ${s}`).join("\n");
  return `// ${problemTitle} - C++ solution (LeetCode style)
// Approach:
${steps}

#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int ${method}(vector<int>& nums) {
        if (nums.empty()) return 0;
        // Follow the same steps as Java solution - translated to C++ STL
        int ans = 0;
        for (int x : nums) ans += x; // placeholder - replace with exact logic
        return ans;
    }
};
// Complexity: see Java solution notes
`;
}

function buildPythonCode(problemTitle: string, approach: string[], javaCode: string): string {
  const method = toCamelCase(problemTitle);
  const steps = approach.map((s) => `# - ${s}`).join("\n");
  return `# ${problemTitle} - Python solution (LeetCode style)
# Approach:
${steps}

from typing import List

class Solution:
    def ${method}(self, nums: List[int]) -> int:
        if not nums:
            return 0
        # Implement the same steps as Java/C++ - pythonic version
        ans = 0
        for x in nums:
            ans += x  # placeholder - replace with exact logic
        return ans
`;
}

export function getPracticeSolutionDetail(problemId: string): PracticeSolutionDetail | null {
  const match = allProblems.find((entry) => entry.problem.id === problemId);
  if (!match) return null;

  // Check for curated solution first
  const curatedSolution = getSolutionByProblemId(problemId);
  
  const section = findBestContentSection(match.problem.title);
  const description = curatedSolution?.description ?? extractDescription(section, match.problem.title);
  const approach = curatedSolution?.approach ?? extractApproach(section);
  const javaCode = curatedSolution?.solutions.java ?? extractJavaCode(section, match.problem.title);

  const time = curatedSolution?.timeComplexity ?? section?.timeComplexity ?? "Not specified";
  const space = curatedSolution?.spaceComplexity ?? section?.spaceComplexity ?? "Not specified";

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
    cppCode: curatedSolution?.solutions.cpp ?? buildCppCode(match.problem.title, approach, javaCode),
    pythonCode: curatedSolution?.solutions.python ?? buildPythonCode(match.problem.title, approach, javaCode),
    hasCuratedMatch: Boolean(curatedSolution),
  };
}



