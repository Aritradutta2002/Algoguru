import { describe, it, expect } from "vitest";
import { extractExpectedOutputs } from "@/lib/extractExpectedOutputs";

// -----------------------------------------------------------------------------
// Fixtures — capture the THREE LeetCode HTML formats we see in production.
// -----------------------------------------------------------------------------

// Format 1: <div class="example-block"> + <span class="example-io">
//   Used by our hardcoded FALLBACK_PROBLEM in leetcodeDaily.ts.
const FORMAT_1 = `<p><strong class="example">Example 1:</strong></p>
<div class="example-block">
<p><strong>Input:</strong> <span class="example-io">s = "01"</span></p>
<p><strong>Output:</strong> <span class="example-io">1</span></p>
<p><strong>Explanation:</strong></p>
<p>Because there is no block of <code>'1'</code>s surrounded by <code>'0'</code>s, no valid trade is possible.</p>
</div>
<p><strong class="example">Example 2:</strong></p>
<div class="example-block">
<p><strong>Input:</strong> <span class="example-io">s = "0100"</span></p>
<p><strong>Output:</strong> <span class="example-io">4</span></p>
</div>`;

// Format 2: <pre> block with bare <strong>Output:</strong> VALUE
//   This is the REAL format returned by alfa-leetcode-api.onrender.com/daily.
//   Note the absence of any <span class="example-io"> wrapper.
const FORMAT_2 = `<p>You are given a <strong>0-indexed</strong> array of <strong>distinct</strong> integers.</p>
<p><strong class="example">Example 1:</strong></p>
<pre>
<strong>Input:</strong> nums = [2,10,7,5,4,1,8,6]
<strong>Output:</strong> 5
<strong>Explanation:</strong>
The minimum element in the array is nums[5], which is 1.
</pre>
<p><strong class="example">Example 2:</strong></p>
<pre>
<strong>Input:</strong> nums = [0,-4,19,1,8,-2,-3,5]
<strong>Output:</strong> 3
</pre>
<p><strong class="example">Example 3:</strong></p>
<pre>
<strong>Input:</strong> nums = [101]
<strong>Output:</strong> 1
</pre>`;

// Format 3: mixed bag — some outputs in <strong>, some in example-io
const FORMAT_3 = `<p><strong class="example">Example 1:</strong></p>
<p><strong>Input:</strong> s = "abc"</p>
<p><strong>Output:</strong> "cba"</p>
<p><strong class="example">Example 2:</strong></p>
<div class="example-block">
<p><strong>Input:</strong> <span class="example-io">s = "xyz"</span></p>
<p><strong>Output:</strong> <span class="example-io">"zyx"</span></p>
</div>`;

// Edge case: HTML with quotes / HTML entities inside Output.
const FORMAT_ENTITIES = `<p><strong class="example">Example 1:</strong></p>
<pre>
<strong>Input:</strong> s = &quot;a&amp;b&quot;
<strong>Output:</strong> &quot;b&amp;a&quot;
</pre>`;

// Real-world fixture — exact body of the daily challenge for 2026-08-30
// (from https://alfa-leetcode-api.onrender.com/daily). This is the actual
// content that previously caused the bug.
const REAL_DAILY_2026_08_30 = `<p>You are given a <strong>0-indexed</strong> array of <strong>distinct</strong> integers <code>nums</code>.</p>
<p><strong class="example">Example 1:</strong></p>
<pre>
<strong>Input:</strong> nums = [2,<u><strong>10</strong></u>,7,5,4,<u><strong>1</strong></u>,8,6]
<strong>Output:</strong> 5
<strong>Explanation:</strong>
The minimum element in the array is nums[5], which is 1.
</pre>
<p><strong class="example">Example 2:</strong></p>
<pre>
<strong>Input:</strong> nums = [0,<u><strong>-4</strong></u>,<u><strong>19</strong></u>,1,8,-2,-3,5]
<strong>Output:</strong> 3
</pre>
<p><strong class="example">Example 3:</strong></p>
<pre>
<strong>Input:</strong> nums = [<u><strong>101</strong></u>]
<strong>Output:</strong> 1
</pre>`;

describe("extractExpectedOutputs", () => {
  it("returns empty array for empty / missing HTML", () => {
    expect(extractExpectedOutputs("")).toEqual([]);
  });

  it("extracts outputs from format 1 (.example-block + .example-io)", () => {
    // This is what the FALLBACK_PROBLEM uses.
    expect(extractExpectedOutputs(FORMAT_1)).toEqual(["1", "4"]);
  });

  it("extracts outputs from format 2 (<pre> + <strong>Output:</strong>) — the real LeetCode format", () => {
    // THIS IS THE BUG WE'RE FIXING. Previously returned [].
    expect(extractExpectedOutputs(FORMAT_2)).toEqual(["5", "3", "1"]);
  });

  it("extracts outputs from format 3 (mixed)", () => {
    expect(extractExpectedOutputs(FORMAT_3)).toEqual(['"cba"', '"zyx"']);
  });

  it("decodes HTML entities in the output value", () => {
    expect(extractExpectedOutputs(FORMAT_ENTITIES)).toEqual(['"b&a"']);
  });

  it("extracts outputs from the actual 2026-08-30 daily challenge content", () => {
    // Exact upstream body from alfa-leetcode-api.onrender.com/daily.
    // Before the fix, this returned [] and every test case showed
    // "No expected — custom case".
    expect(extractExpectedOutputs(REAL_DAILY_2026_08_30)).toEqual(["5", "3", "1"]);
  });

  it("preserves document order — outputs match the order of example blocks", () => {
    const result = extractExpectedOutputs(REAL_DAILY_2026_08_30);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("5");
    expect(result[1]).toBe("3");
    expect(result[2]).toBe("1");
  });

  it("returns empty array when no Output tags are present", () => {
    const html = `<p>This problem has no examples yet.</p>
<p>Constraints: <code>n &gt;= 1</code></p>`;
    expect(extractExpectedOutputs(html)).toEqual([]);
  });
});
