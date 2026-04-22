import React, { memo } from "react";
import { ContentSection } from "@/data/recursionContent";
import { CodeBlock } from "@/components/CodeBlock";
import { DiagramRenderer } from "@/components/DiagramRenderer";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play, Lightbulb, FlaskConical, BookOpen } from "lucide-react";

/* ── Superscript rendering (2^n → 2<sup>n</sup>) ── */
function renderSuperscript(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /([A-Za-z0-9]+)\^(\([^)]+\)|[A-Za-z0-9]+)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    const sup = m[2].startsWith("(") ? m[2].slice(1, -1) : m[2];
    parts.push(<span key={k++}>{m[1]}<sup className="text-[0.75em] ml-[1px]">{sup}</sup></span>);
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length > 1 ? parts : parts.length === 1 ? parts[0] : text;
}

/* ── Markdown (bold + code) with superscript ── */
function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderSuperscript(text.slice(lastIndex, match.index)));
    }
    if (match[2]) {
      parts.push(
        <strong key={key++} className="cr-bold">{renderSuperscript(match[2])}</strong>
      );
    } else if (match[4]) {
      parts.push(
        <code key={key++} className="cr-code">{renderSuperscript(match[4])}</code>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(renderSuperscript(text.slice(lastIndex)));
  }
  return parts.length > 0 ? parts : text;
}

/* ── Classify theory lines into groups ── */
type LineType = "theory" | "example" | "approach";

interface ClassifiedLines {
  theory: string[];
  examples: string[];
  approach: string[];
}

function classifyTheoryLines(lines: string[]): ClassifiedLines {
  const result: ClassifiedLines = { theory: [], examples: [], approach: [] };

  for (const line of lines) {
    const stripped = line.replace(/\*\*/g, "").trim().toLowerCase();

    if (
      stripped.startsWith("example:") ||
      stripped.startsWith("example ") ||
      stripped.match(/^input\s*:/) ||
      stripped.match(/^output\s*:/) ||
      stripped.match(/^explanation\s*:/) ||
      // Also catch inline examples like "**Example:** `Input: ...` → `Output: ...`"
      (stripped.includes("input:") && stripped.includes("output:")) ||
      (stripped.includes("example") && (stripped.includes("input") || stripped.includes("output")))
    ) {
      result.examples.push(line);
    } else if (
      stripped.startsWith("approach:") ||
      stripped.startsWith("approach ") ||
      stripped.startsWith("algorithm:") ||
      stripped.startsWith("strategy:")
    ) {
      result.approach.push(line);
    } else {
      result.theory.push(line);
    }
  }

  return result;
}

/* ── Parse an inline example line into structured parts ── */
function parseExampleLine(line: string): { input?: string; output?: string; explanation?: string; raw?: string } {
  // Try to extract Input/Output/Explanation from inline format
  const inputMatch = line.match(/Input:\s*([^`→]+|`[^`]+`)/i);
  const outputMatch = line.match(/Output:\s*([^`→—]+|`[^`]+`)/i);
  const explanationMatch = line.match(/(?:Explanation|because)\s*:?\s*(.+?)(?:\.|$)/i);
  
  if (inputMatch || outputMatch) {
    return {
      input: inputMatch ? inputMatch[1].replace(/`/g, "").replace(/→.*/, "").trim() : undefined,
      output: outputMatch ? outputMatch[1].replace(/`/g, "").replace(/[—→].*/,"").trim() : undefined,
      explanation: explanationMatch ? explanationMatch[1].replace(/`/g, "").trim() : undefined,
    };
  }
  return { raw: line };
}

/* ── Render example box content ── */
function renderExampleContent(lines: string[]) {
  const parts: { input?: string; output?: string; explanation?: string; raw?: string }[] = [];
  
  for (const line of lines) {
    parts.push(parseExampleLine(line));
  }

  // Merge all parsed parts
  const merged = { input: "", output: "", explanation: "", raws: [] as string[] };
  for (const p of parts) {
    if (p.input) merged.input = p.input;
    if (p.output) merged.output = p.output;
    if (p.explanation) merged.explanation = p.explanation;
    if (p.raw) merged.raws.push(p.raw);
  }

  return (
    <div className="cr-example-content">
      {merged.input && (
        <div className="cr-io-line">
          <span className="cr-io-label">Input:</span>
          <span className="cr-io-value font-mono">{merged.input}</span>
        </div>
      )}
      {merged.output && (
        <div className="cr-io-line">
          <span className="cr-io-label">Output:</span>
          <span className="cr-io-value font-mono">{merged.output}</span>
        </div>
      )}
      {merged.explanation && (
        <div className="cr-io-line mt-1">
          <span className="cr-io-label">Explanation:</span>
          <span className="cr-io-value">{merged.explanation}</span>
        </div>
      )}
      {merged.raws.map((r, i) => (
        <div key={i} className="cr-io-line">
          <span className="cr-io-value">{renderMarkdown(r)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Render an I/O line with label highlighting ── */
function renderIOLine(line: string, idx: number) {
  // Detect Input:/Output:/Explanation: labels
  const labelMatch = line.match(/^(\*\*)?(\s*)(Input|Output|Explanation)\s*:\s*/i);
  if (labelMatch) {
    const label = labelMatch[3];
    const rest = line.slice(labelMatch[0].length);
    return (
      <div key={idx} className="cr-io-line">
        <span className="cr-io-label">{label}:</span>
        <span className="cr-io-value">{renderMarkdown(rest)}</span>
      </div>
    );
  }
  // Example: header line
  const exampleHeader = line.replace(/\*\*/g, "").trim();
  if (exampleHeader.toLowerCase().startsWith("example")) {
    return null; // We already have a label on the box
  }
  return (
    <div key={idx} className="cr-io-line">
      <span className="cr-io-value">{renderMarkdown(line)}</span>
    </div>
  );
}

const difficultyClass: Record<string, string> = {
  Easy: "cr-diff-easy",
  Medium: "cr-diff-medium",
  Hard: "cr-diff-hard",
  Expert: "cr-diff-expert",
};

interface ContentRendererProps {
  section: ContentSection;
  isPractice?: boolean;
}

export const ContentRenderer = memo(function ContentRenderer({ section, isPractice }: ContentRendererProps) {
  const navigate = useNavigate();
  const classified = classifyTheoryLines(section.theory);

  // Group header (no theory, no code) — render as a styled divider
  const isGroupHeader = section.theory.length === 0 && (!section.code || section.code.length === 0);
  if (isGroupHeader) {
    return (
      <div id={section.id} className="cr-group-header scroll-mt-24">
        <span className={`cr-diff-badge ${difficultyClass[section.difficulty || ""] || ""}`}>
          {section.title}
        </span>
      </div>
    );
  }

  const openInPlayground = () => {
    const problemData = {
      id: section.id,
      title: section.title,
      difficulty: section.difficulty,
      timeComplexity: section.timeComplexity,
      spaceComplexity: section.spaceComplexity,
      theory: section.theory,
      keyPoints: section.keyPoints,
      code: section.code,
    };
    localStorage.setItem("playground-practice-problem", JSON.stringify(problemData));
    navigate("/playground?practice=" + section.id);
  };

  return (
    <motion.div
      id={section.id}
      className="cr-problem-card"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px", amount: 0.1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ willChange: "transform, opacity" }}
    >
      {/* ═══ Header: Title + Difficulty + Complexity ═══ */}
      <div className="cr-header">
        <div className="cr-header-top">
          <h2 className="cr-title">{section.title}</h2>
          {section.difficulty && (
            <span className={`cr-diff-badge ${difficultyClass[section.difficulty] || ""}`}>
              {section.difficulty}
            </span>
          )}
        </div>
        {(section.timeComplexity || section.spaceComplexity) && (
          <div className="cr-complexity-row">
            {section.timeComplexity && (
              <span className="cr-complexity-pill">
                Time: {renderSuperscript(section.timeComplexity)}
              </span>
            )}
            {section.spaceComplexity && (
              <span className="cr-complexity-pill">
                Space: {renderSuperscript(section.spaceComplexity)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ═══ Theory / Problem Description ═══ */}
      {classified.theory.length > 0 && (
        <div className="cr-block">
          <div className="cr-block-label">
            <BookOpen size={13} />
            Description
          </div>
          <ul className="cr-theory-list">
            {classified.theory.map((para, i) => (
              <li key={i}>{renderMarkdown(para)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ═══ Example ═══ */}
      {classified.examples.length > 0 && (
        <div className="cr-example-box">
          <div className="cr-example-label">
            <FlaskConical size={13} />
            Example
          </div>
          {renderExampleContent(classified.examples)}
        </div>
      )}

      {/* ═══ Approach ═══ */}
      {classified.approach.length > 0 && (
        <div className="cr-approach-box">
          <div className="cr-approach-label">
            <Lightbulb size={13} />
            Approach
          </div>
          <div className="cr-approach-content">
            {classified.approach.map((line, i) => (
              <p key={i} className="cr-approach-text">{renderMarkdown(line)}</p>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Diagram ═══ */}
      {section.diagram && <DiagramRenderer diagram={section.diagram} />}

      {/* ═══ Key Points ═══ */}
      {section.keyPoints && (
        <div className="cr-block">
          <div className="cr-block-label cr-block-label--accent">
            <Lightbulb size={13} />
            Key Points
          </div>
          <ul className="cr-theory-list cr-keypoint-list">
            {section.keyPoints.map((point, i) => (
              <li key={i}>{renderMarkdown(point)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ═══ Note / Tip / Warning ═══ */}
      {section.note && (
        <div className="cr-block">
          <h3 className="cr-subtitle">Note:</h3>
          <p className="cr-para">{renderMarkdown(section.note)}</p>
        </div>
      )}
      {section.tip && (
        <div className="cr-block">
          <h3 className="cr-subtitle">💡 Pro Tip:</h3>
          <p className="cr-para">{renderMarkdown(section.tip)}</p>
        </div>
      )}
      {section.warning && (
        <div className="cr-block">
          <h3 className="cr-subtitle">⚠ Warning:</h3>
          <p className="cr-para">{renderMarkdown(section.warning)}</p>
        </div>
      )}

      {/* ═══ Table ═══ */}
      {section.table && (
        <div className="cr-table-wrap">
          <table className="table-premium">
            <thead>
              <tr>
                {section.table.headers.map((h) => (
                  <th key={h}>{renderMarkdown(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{renderMarkdown(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ Code Blocks ═══ */}
      {section.code?.map((block, i) => (
        <CodeBlock key={i} title={block.title} language={block.language} code={block.content} />
      ))}

      {/* ═══ Practice in Playground ═══ */}
      {isPractice && section.code && section.code.length > 0 && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openInPlayground}
          className="cr-playground-btn"
        >
          <Play size={15} />
          Practice in Playground
        </motion.button>
      )}
    </motion.div>
  );
});
