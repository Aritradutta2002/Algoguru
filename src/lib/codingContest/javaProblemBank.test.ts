import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";

/**
 * The migration seeds the authoritative problem rows; `javaProblemBank.ts` is
 * the public copy bundled into the browser. They are joined by `slug`, and they
 * must agree on everything the runner consumes: if they drift, a learner can be
 * shown one input format while the server grades another.
 *
 * Only the fields that decide how code is fed to the JVM are compared here —
 * prose and starter code may legitimately differ between the two copies.
 */

const SEED_PATH =
  "../../../supabase/migrations/20260915000000_add_coding_contest.sql";

const SEED = readFileSync(new URL(SEED_PATH, import.meta.url), "utf8");

interface SeedRow {
  slug: string;
  inputFormat: string;
  functionSignature: string;
  visibleTestCases: unknown;
}

const ROW_START = /\n\(\n {2}'([a-z0-9-]+)',/g;

function parseSeed(sql: string): SeedRow[] {
  const starts = [...sql.matchAll(ROW_START)].map((match) => ({
    slug: match[1],
    at: match.index ?? 0,
  }));

  return starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1].at : sql.length;
    const row = sql.slice(start.at, end);

    // `input_format` is a `'line' || chr(10) || 'line'` concatenation, and a
    // line may itself contain a SQL-escaped quote ('').
    const PIECE = String.raw`'(?:[^']|'')*'`;
    const formats = row.match(
      new RegExp(
        String.raw`'Line 1:(?:[^']|'')*'(?:\s*\|\|\s*chr\(10\)\s*\|\|\s*${PIECE})*`,
      ),
    );
    const inputFormat = formats
      ? formats[0]
          .split(/\s*\|\|\s*chr\(10\)\s*\|\|\s*/)
          .map((part) => part.replace(/^'|'$/g, "").replace(/''/g, "'"))
          .join("\n")
      : "";

    const signature = row.match(
      /'(public (?:void|int|boolean|String|List)[^']*)'/s,
    );
    const cases = row.match(/'(\[\{"id":"visible-.*?\}\])'::jsonb/s);

    return {
      slug: start.slug,
      inputFormat,
      functionSignature: signature ? signature[1] : "",
      visibleTestCases: cases ? JSON.parse(cases[1]) : [],
    };
  });
}

const seedRows = parseSeed(SEED);
const seedBySlug = new Map(seedRows.map((row) => [row.slug, row]));

describe("java problem bank vs. the migration seed", () => {
  it("parses one seed row per problem", () => {
    expect(seedRows).toHaveLength(PUBLIC_JAVA_PROBLEMS.length);
  });

  it("seeds the same problems in the same order", () => {
    expect(seedRows.map((row) => row.slug)).toEqual(
      PUBLIC_JAVA_PROBLEMS.map((problem) => problem.slug),
    );
  });

  it("agrees on the visible cases the practice runner executes", () => {
    const drift: string[] = [];
    for (const problem of PUBLIC_JAVA_PROBLEMS) {
      const seed = seedBySlug.get(problem.slug);
      if (!seed) {
        drift.push(`${problem.slug}: missing from the seed`);
        continue;
      }
      if (
        JSON.stringify(seed.visibleTestCases) !==
        JSON.stringify(problem.visibleTestCases)
      ) {
        drift.push(
          `${problem.slug}: visible cases differ\n  seed: ${JSON.stringify(seed.visibleTestCases)}\n  bank: ${JSON.stringify(problem.visibleTestCases)}`,
        );
      }
    }
    expect(drift.join("\n\n")).toBe("");
  });

  it("agrees on the input format and signature the driver is generated from", () => {
    const drift: string[] = [];
    for (const problem of PUBLIC_JAVA_PROBLEMS) {
      const seed = seedBySlug.get(problem.slug);
      if (!seed) continue;
      if (seed.inputFormat !== problem.inputFormat) {
        drift.push(
          `${problem.slug}: input format differs\n  seed: ${JSON.stringify(seed.inputFormat)}\n  bank: ${JSON.stringify(problem.inputFormat)}`,
        );
      }
      if (seed.functionSignature !== problem.functionSignature) {
        drift.push(
          `${problem.slug}: signature differs\n  seed: ${JSON.stringify(seed.functionSignature)}\n  bank: ${JSON.stringify(problem.functionSignature)}`,
        );
      }
    }
    expect(drift.join("\n\n")).toBe("");
  });
});
