export type GuruSelectionAction =
  | "explain"
  | "fix"
  | "optimize"
  | "complexity"
  | "tests"
  | "refactor"
  | "comments";

export const GURU_SELECTION_ACTIONS: {
  id: GuruSelectionAction;
  label: string;
  wantsCode: boolean;
}[] = [
  { id: "explain", label: "Explain", wantsCode: false },
  { id: "fix", label: "Fix", wantsCode: true },
  { id: "optimize", label: "Optimize", wantsCode: true },
  { id: "complexity", label: "Complexity", wantsCode: false },
  { id: "tests", label: "Generate Tests", wantsCode: true },
  { id: "refactor", label: "Refactor", wantsCode: true },
  { id: "comments", label: "Add Comments", wantsCode: true },
];

export function buildGuruSelectionPrompt(
  action: GuruSelectionAction,
  selectedCode: string,
  language: string,
): string {
  const lang = language === "c++" ? "cpp" : language;
  const block = `\`\`\`${lang}\n${selectedCode}\n\`\`\``;

  switch (action) {
    case "explain":
      return `Explain this ${language} code step by step. Do not rewrite it unless a tiny snippet is needed for clarity.\n\n${block}`;
    case "fix":
      return `Find bugs in this ${language} selection and propose a corrected version. Put the full proposed replacement in a single fenced code block. Do not apply it for me — I will review a diff.\n\n${block}`;
    case "optimize":
      return `Propose a more efficient version of this ${language} selection if one exists. Put the full proposed replacement in a single fenced code block. I will review a diff before applying it.\n\n${block}`;
    case "complexity":
      return `Analyze time and space complexity of this ${language} selection. Be concise. Do not rewrite the code.\n\n${block}`;
    case "tests":
      return `Generate focused tests or a small main/demo that exercises this ${language} selection. Put the proposed code in a single fenced block. I will review a diff before applying it.\n\n${block}`;
    case "refactor":
      return `Refactor this ${language} selection for clarity without changing behavior. Put the full proposed replacement in a single fenced code block. I will review a diff before applying it.\n\n${block}`;
    case "comments":
      return `Add concise comments to this ${language} selection. Put the full commented replacement in a single fenced code block. I will review a diff before applying it.\n\n${block}`;
  }
}
