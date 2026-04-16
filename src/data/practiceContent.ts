import { ContentSection } from "./recursionContent";
import { arraysEasy, arraysMedium, arraysHard } from "./practice/arraysProblems";
import { stringsEasy, stringsMedium, stringsHard } from "./practice/stringsProblems";
import { recursionPracticeEasy, recursionPracticeMedium, recursionPracticeHard } from "./practice/recursionProblems";
import { dpPracticeEasy, dpPracticeMedium, dpPracticeHard } from "./practice/dpProblems";
import { graphsEasy, graphsMedium, graphsHard } from "./practice/graphsProblems";
import { treesEasy, treesMedium, treesHard } from "./practice/treesProblems";
import { greedyEasy, greedyMedium, greedyHard } from "./practice/greedyProblems";
import { stackQueueEasy, stackQueueMedium, stackQueueHard } from "./practice/stackQueueProblems";
import { mathEasy, mathMedium, mathHard } from "./practice/mathProblems";

// Re-export for backwards compatibility
export { arraysEasy, arraysMedium, arraysHard };
export { stringsEasy, stringsMedium, stringsHard };
export { recursionPracticeEasy, recursionPracticeMedium, recursionPracticeHard };
export { dpPracticeEasy, dpPracticeMedium, dpPracticeHard };
export { graphsEasy, graphsMedium, graphsHard };
export { treesEasy, treesMedium, treesHard };
export { greedyEasy, greedyMedium, greedyHard };
export { stackQueueEasy, stackQueueMedium, stackQueueHard };
export { mathEasy, mathMedium, mathHard };

// ═══════════════════════════════════════════════════════
// HELPER: Create a difficulty group header section
// ═══════════════════════════════════════════════════════

function groupHeader(id: string, title: string, difficulty: string): ContentSection {
  return {
    id,
    title,
    difficulty: difficulty as "Easy" | "Medium" | "Hard",
    timeComplexity: "",
    spaceComplexity: "",
    theory: [],
    code: [],
  };
}

// ═══════════════════════════════════════════════════════
// CONTENT MAP
// ═══════════════════════════════════════════════════════

export const practiceContentMap: Record<string, ContentSection[]> = {
  "practice-arrays": [
    groupHeader("arrays-easy", "Easy Problems", "Easy"), ...arraysEasy,
    groupHeader("arrays-medium", "Medium Problems", "Medium"), ...arraysMedium,
    groupHeader("arrays-hard", "Hard Problems", "Hard"), ...arraysHard,
  ],
  "practice-strings": [
    groupHeader("strings-easy", "Easy Problems", "Easy"), ...stringsEasy,
    groupHeader("strings-medium", "Medium Problems", "Medium"), ...stringsMedium,
    groupHeader("strings-hard", "Hard Problems", "Hard"), ...stringsHard,
  ],
  "practice-recursion": [
    groupHeader("recursion-easy", "Easy Problems", "Easy"), ...recursionPracticeEasy,
    groupHeader("recursion-medium", "Medium Problems", "Medium"), ...recursionPracticeMedium,
    groupHeader("recursion-hard", "Hard Problems", "Hard"), ...recursionPracticeHard,
  ],
  "practice-dp": [
    groupHeader("dp-easy", "Easy Problems", "Easy"), ...dpPracticeEasy,
    groupHeader("dp-medium", "Medium Problems", "Medium"), ...dpPracticeMedium,
    groupHeader("dp-hard", "Hard Problems", "Hard"), ...dpPracticeHard,
  ],
  "practice-graphs": [
    groupHeader("graphs-easy", "Easy Problems", "Easy"), ...graphsEasy,
    groupHeader("graphs-medium", "Medium Problems", "Medium"), ...graphsMedium,
    groupHeader("graphs-hard", "Hard Problems", "Hard"), ...graphsHard,
  ],
  "practice-trees": [
    groupHeader("trees-easy", "Easy Problems", "Easy"), ...treesEasy,
    groupHeader("trees-medium", "Medium Problems", "Medium"), ...treesMedium,
    groupHeader("trees-hard", "Hard Problems", "Hard"), ...treesHard,
  ],
  "practice-greedy": [
    groupHeader("greedy-easy", "Easy Problems", "Easy"), ...greedyEasy,
    groupHeader("greedy-medium", "Medium Problems", "Medium"), ...greedyMedium,
    groupHeader("greedy-hard", "Hard Problems", "Hard"), ...greedyHard,
  ],
  "practice-stack-queue": [
    groupHeader("stackq-easy", "Easy Problems", "Easy"), ...stackQueueEasy,
    groupHeader("stackq-medium", "Medium Problems", "Medium"), ...stackQueueMedium,
    groupHeader("stackq-hard", "Hard Problems", "Hard"), ...stackQueueHard,
  ],
  "practice-math": [
    groupHeader("math-easy", "Easy Problems", "Easy"), ...mathEasy,
    groupHeader("math-medium", "Medium Problems", "Medium"), ...mathMedium,
    groupHeader("math-hard", "Hard Problems", "Hard"), ...mathHard,
  ],
};
