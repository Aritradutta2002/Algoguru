/**
 * Slash commands for the Guru composer.
 *
 * These are prompt templates, not tool calls: they keep the user in the same
 * conversation while giving the model a precise instruction. In coaching mode
 * they mirror the Socratic rules the edge function already enforces.
 */

export interface GuruCommand {
  id: string;
  /** What the user types after the slash. */
  name: string;
  label: string;
  hint: string;
  prompt: string;
}

export const GURU_COMMANDS: GuruCommand[] = [
  {
    id: "hint",
    name: "hint",
    label: "Hint only",
    hint: "One nudge, no full solution",
    prompt: "Give me one focused hint for this — don't show the full solution yet.",
  },
  {
    id: "explain",
    name: "explain",
    label: "Explain",
    hint: "Intuition first, then the approach",
    prompt: "Explain the key idea in plain language first, then walk through the approach with a small example.",
  },
  {
    id: "complexity",
    name: "complexity",
    label: "Complexity",
    hint: "Time/space analysis of my code",
    prompt: "Analyse the time and space complexity of my current approach, and point out where the bottleneck is.",
  },
  {
    id: "tests",
    name: "tests",
    label: "Edge cases",
    hint: "What to test and why",
    prompt: "What edge cases and test inputs should I check here? Explain why each one matters.",
  },
  {
    id: "debug",
    name: "debug",
    label: "Debug with me",
    hint: "Step-by-step investigation",
    prompt: "Walk me through debugging this step by step — where should I look first, and what should I print or inspect?",
  },
  {
    id: "solution",
    name: "solution",
    label: "Full solution",
    hint: "Complete code + what was wrong",
    prompt:
      "Show me the complete corrected solution, explain what was wrong in my version, and give the time and space complexity.",
  },
];

/** Commands matching a composer value that starts with `/`. */
export function matchCommands(input: string): GuruCommand[] {
  const value = input.trimStart();
  if (!value.startsWith("/")) return [];
  const query = value.slice(1).split(/\s/)[0].toLowerCase();
  if (value.slice(1).includes(" ")) return [];
  return GURU_COMMANDS.filter((command) => command.name.startsWith(query));
}

/**
 * Resolve a submitted composer value into the text actually sent.
 * An unknown slash command is sent verbatim — never silently dropped.
 */
export function resolvePrompt(input: string): string {
  const value = input.trim();
  if (!value.startsWith("/")) return value;

  const [token, ...rest] = value.split(/\s+/);
  const command = GURU_COMMANDS.find((item) => `/${item.name}` === token.toLowerCase());
  if (!command) return value;

  const suffix = rest.join(" ").trim();
  return suffix ? `${command.prompt}\n\n${suffix}` : command.prompt;
}
