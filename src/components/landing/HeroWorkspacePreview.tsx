"use client";

import { useState } from "react";
import { ArrowUpRight, Braces, Check, FileCode2, FileText, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodeLine, TWO_SUM_LINES } from "./codeSnippet";

const SAMPLE_CASES = [
  { numbers: [2, 7, 11, 15], target: 9 },
  { numbers: [3, 2, 4], target: 6 },
  { numbers: [3, 3], target: 6 },
] as const;

const SOLUTION_NOTES = [
  { title: "Complement HashMap", detail: "Store each seen value and its index. At each step, look for the value that completes the target sum." },
  { title: "O(n) time · O(n) space", detail: "A single pass replaces the nested loop, with at most one map entry per number." },
  { title: "Lookup before insert", detail: "Check the map before inserting the current value so an element can’t pair with itself." },
] as const;

// Execute the same lookup as the Java listing without running user-supplied code.
function runTwoSum(numbers: readonly number[], target: number): number[] {
  const seen = new Map<number, number>();

  for (const [index, value] of numbers.entries()) {
    const match = seen.get(target - value);
    if (match !== undefined) return [match, index];
    seen.set(value, index);
  }

  return [];
}

export function HeroWorkspacePreview({ onOpenRoadmap }: { onOpenRoadmap: () => void }) {
  const [file, setFile] = useState<"solution" | "notes">("solution");
  const [caseIndex, setCaseIndex] = useState(0);
  const [result, setResult] = useState<number[] | null>(null);
  const { numbers, target } = SAMPLE_CASES[caseIndex];

  return (
    <section id="workspace-preview" tabIndex={-1} aria-labelledby="workspace-preview-title" className="ag-preview">
      <header className="ag-preview__bar">
        <span className="ag-preview__icon"><Braces size={19} aria-hidden="true" /></span>
        <div>
          <h2 id="workspace-preview-title">Two Sum</h2>
          <p>Arrays &amp; Hashing</p>
        </div>
        <span className="ag-preview__label">Workspace preview</span>
      </header>

      <div className="ag-preview__tabs" role="group" aria-label="Preview files">
        <Button variant="bare" size="bare" type="button" aria-pressed={file === "solution"} onClick={() => setFile("solution")}>
          <FileCode2 size={15} aria-hidden="true" /> Solution.java
        </Button>
        <Button variant="bare" size="bare" type="button" aria-pressed={file === "notes"} onClick={() => setFile("notes")}>
          <FileText size={15} aria-hidden="true" /> Notes.md
        </Button>
        <span>Java 17</span>
      </div>

      {file === "solution" ? (
        <pre tabIndex={0} aria-label="Example Java solution for Two Sum" className="ag-preview__code">
          <code>
            {TWO_SUM_LINES.map((line, index) => (
              <CodeLine key={index} tokens={line} />
            ))}
          </code>
        </pre>
      ) : (
        <dl className="ag-preview__notes">
          {SOLUTION_NOTES.map(({ title, detail }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="ag-preview__runner">
        <div className="ag-preview__input">
          <label htmlFor="two-sum-input">Example input</label>
          <Select
            value={String(caseIndex)}
            onValueChange={(value) => {
              setCaseIndex(Number(value));
              setResult(null);
            }}
          >
            <SelectTrigger id="two-sum-input" className="ag-preview__select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="ag-preview-options">
              {SAMPLE_CASES.map(({ numbers, target }, index) => (
                <SelectItem key={index} value={String(index)}>[{numbers.join(", ")}] → {target}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="bare" size="bare" className="ag-button ag-button--run" onClick={() => setResult(runTwoSum(numbers, target))}>
          <Play size={15} aria-hidden="true" /> Run example
        </Button>
        <div className="ag-preview__output" aria-live="polite">
          {result ? (
            <>
              <Check size={15} aria-hidden="true" />
              <span>Returned indices</span>
              <code>[{result.join(", ")}]</code>
            </>
          ) : (
            <span className="ag-preview__instruction">Find two values that add up to the target.</span>
          )}
        </div>
      </div>
      <div className="ag-preview__foot">
        <span>Sample runs locally</span>
        <Button variant="bare" size="bare" type="button" onClick={onOpenRoadmap}>
          Browse full roadmap <ArrowUpRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
