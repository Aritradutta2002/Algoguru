-- =============================================================================
-- Java coding contest: problems, sessions and per-problem drafts.
--
-- SECURITY MODEL (read before touching grants)
-- -----------------------------------------------------------------------------
-- `coding_problems` holds the HIDDEN TEST CASES and the REFERENCE SOLUTIONS for
-- every contest problem. Those two columns must never reach a browser, so this
-- table deliberately differs from every other table in this schema:
--
--   * RLS is enabled, and there is NO `SELECT` policy for `anon`/`authenticated`.
--   * Table privileges are granted to `service_role` ONLY. Note the absence of
--     the usual `GRANT ... TO anon, authenticated` line.
--
-- With no grant and no policy, PostgREST and the publishable anon key cannot
-- read this table at all. The only reader is the service-role client inside the
-- `contest-coding` edge function, which projects every response through
-- `toPublicProblem` before serialising.
--
-- If you ever add a client grant or a SELECT policy here, the exam becomes
-- trivially cheatable. Treat this as a security boundary, not a style choice.
-- =============================================================================

-- ── coding_problems ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coding_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topics TEXT[] NOT NULL DEFAULT '{}',
  constraints TEXT[] NOT NULL DEFAULT '{}',
  input_format TEXT NOT NULL,
  output_format TEXT NOT NULL,
  examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  starter_code TEXT NOT NULL,
  function_signature TEXT NOT NULL,
  visible_test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Server-only. Never exposed to the browser.
  hidden_test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Server-only. Never exposed to the browser.
  reference_solution TEXT,
  time_limit_ms INTEGER NOT NULL DEFAULT 2000,
  memory_limit_mb INTEGER NOT NULL DEFAULT 256,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coding_problems_published
  ON public.coding_problems (is_published);

ALTER TABLE public.coding_problems ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.coding_problems FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_problems TO service_role;

-- No policies by design. See the header.

-- ── contest_coding_sessions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contest_coding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'java',
  problem_ids UUID[] NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 1800,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'processing', 'finalized', 'cancelled')),
  warning_count INTEGER NOT NULL DEFAULT 0 CHECK (warning_count >= 0),
  submitted_at TIMESTAMPTZ,
  finalization_reason TEXT
    CHECK (finalization_reason IN ('manual', 'expired', 'warning_limit', 'administrator', 'system')),
  total_score INTEGER,
  problems_solved INTEGER,
  tests_passed INTEGER,
  tests_total INTEGER,
  -- Aggregate outcome only. Must never contain hidden test inputs or outputs.
  evaluation JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "One active contest per user" as a DATABASE invariant rather than a code
-- convention: a concurrent double-create hits 23505 and the edge function then
-- returns the existing session instead of starting a parallel one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_contest_coding_sessions_one_active
  ON public.contest_coding_sessions (user_id)
  WHERE status IN ('active', 'processing');

CREATE INDEX IF NOT EXISTS idx_contest_coding_sessions_user
  ON public.contest_coding_sessions (user_id);

ALTER TABLE public.contest_coding_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_coding_sessions TO authenticated;

DROP POLICY IF EXISTS contest_coding_sessions_select ON public.contest_coding_sessions;
CREATE POLICY contest_coding_sessions_select
  ON public.contest_coding_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS contest_coding_sessions_update ON public.contest_coding_sessions;
CREATE POLICY contest_coding_sessions_update
  ON public.contest_coding_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Intentionally no INSERT/DELETE policy: sessions are created only by the
-- service-role client inside the edge function, which also owns the deadline.

DROP TRIGGER IF EXISTS contest_coding_sessions_updated_at ON public.contest_coding_sessions;
CREATE TRIGGER contest_coding_sessions_updated_at
  BEFORE UPDATE ON public.contest_coding_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── contest_problem_drafts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contest_problem_drafts (
  session_id UUID NOT NULL REFERENCES public.contest_coding_sessions(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, problem_id)
);

ALTER TABLE public.contest_problem_drafts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_problem_drafts TO authenticated;

DROP POLICY IF EXISTS contest_problem_drafts_select ON public.contest_problem_drafts;
CREATE POLICY contest_problem_drafts_select
  ON public.contest_problem_drafts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS contest_problem_drafts_insert ON public.contest_problem_drafts;
CREATE POLICY contest_problem_drafts_insert
  ON public.contest_problem_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS contest_problem_drafts_update ON public.contest_problem_drafts;
CREATE POLICY contest_problem_drafts_update
  ON public.contest_problem_drafts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS contest_problem_drafts_updated_at ON public.contest_problem_drafts;
CREATE TRIGGER contest_problem_drafts_updated_at
  BEFORE UPDATE ON public.contest_problem_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- Seed the published problem bank.
--
-- `slug` is the join key with the frontend bank
-- (`src/lib/codingContest/javaProblemBank.ts`). The public fields must stay in
-- sync with that file; the hidden cases and reference solutions exist ONLY here.
--
-- The 24 rows below are the public half. Hidden cases are added alongside the
-- `contest-execute` service in a follow-up migration, together with
-- `is_published = TRUE`, so that no problem is ever served as an exam question
-- before its hidden test set exists.
-- =============================================================================

INSERT INTO public.coding_problems (
  slug, title, description, difficulty, topics, constraints,
  input_format, output_format, examples, starter_code, function_signature,
  visible_test_cases, time_limit_ms, memory_limit_mb, is_published
) VALUES
(
  'two-sum-indices',
  'Return the indices of the pair that sums to the target',
  'Given an array of integers and a target, return the 0-based indices of the two values that add up to the target. Return them in ascending order. Each input has exactly one solution, and you may not reuse the same element twice.',
  'easy',
  ARRAY['Arrays', 'HashMap'],
  ARRAY['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Exactly one valid answer exists'],
  'Line 1: n' || chr(10) || 'Line 2: n space-separated integers' || chr(10) || 'Line 3: target',
  'Two space-separated 0-based indices, smaller index first.',
  '[{"input":"4\n2 7 11 15\n9","output":"0 1","explanation":"nums[0] + nums[1] === 2 + 7 === 9."},{"input":"2\n3 2 4\n6","output":"1 2","explanation":"2 + 4 === 6, at indices 1 and 2."}]'::jsonb,
  E'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your solution here.\n        return new int[0];\n    }\n}',
  'public int[] twoSum(int[] nums, int target)',
  '[{"id":"visible-1","input":"4\n2 7 11 15\n9","expectedOutput":"0 1"},{"id":"visible-2","input":"2\n3 2 4\n6","expectedOutput":"1 2"},{"id":"visible-3","input":"5\n1 5 9 2 8\n10","expectedOutput":"2 3"}]'::jsonb,
  2000, 256, FALSE
),
(
  'maximum-subarray-sum',
  'Maximum sum of a contiguous subarray',
  'Given an integer array, return the largest sum obtainable from any contiguous, non-empty subarray.',
  'medium',
  ARRAY['Arrays', 'Dynamic Programming'],
  ARRAY['1 <= nums.length <= 100_000', '-10^4 <= nums[i] <= 10^4'],
  'Line 1: n' || chr(10) || 'Line 2: n space-separated integers',
  'A single integer: the maximum subarray sum.',
  '[{"input":"9\n-2 1 -3 4 -1 2 1 -5 4","output":"6","explanation":"The subarray [4, -1, 2, 1] sums to 6."},{"input":"1\n-5","output":"-5","explanation":"A single negative element is the best non-empty choice."}]'::jsonb,
  E'class Solution {\n    public int maxSubArray(int[] nums) {\n        // Your solution here.\n        return 0;\n    }\n}',
  'public int maxSubArray(int[] nums)',
  '[{"id":"visible-1","input":"9\n-2 1 -3 4 -1 2 1 -5 4","expectedOutput":"6"},{"id":"visible-2","input":"1\n-5","expectedOutput":"-5"},{"id":"visible-3","input":"5\n1 2 3 4 5","expectedOutput":"15"}]'::jsonb,
  2000, 256, FALSE
),
(
  'merge-intervals',
  'Merge overlapping intervals',
  'Given closed intervals [start, end], merge every pair of overlapping intervals and return the non-overlapping intervals that cover all of the input.',
  'medium',
  ARRAY['Sorting & Searching', 'Collections'],
  ARRAY['1 <= intervals.length <= 10^4', '0 <= start <= end <= 10^4', 'Intervals are not given in sorted order'],
  'Line 1: m (number of intervals)' || chr(10) || 'Then m lines, each: start end',
  'One line per merged interval: start end, ordered by start.',
  '[{"input":"5\n1 3\n2 6\n8 10\n15 18\n8 9","output":"1 6\n8 10\n15 18","explanation":"[1,3] and [2,6] overlap; [8,10] and [8,9] overlap."},{"input":"1\n4 7","output":"4 7","explanation":"A single interval is already merged."}]'::jsonb,
  E'class Solution {\n    public List<List<Integer>> merge(List<List<Integer>> intervals) {\n        // Your solution here.\n        return new ArrayList<>();\n    }\n}',
  'public List<List<Integer>> merge(List<List<Integer>> intervals)',
  '[{"id":"visible-1","input":"5\n1 3\n2 6\n8 10\n15 18\n8 9","expectedOutput":"1 6\n8 10\n15 18"},{"id":"visible-2","input":"1\n4 7","expectedOutput":"4 7"},{"id":"visible-3","input":"3\n1 4\n4 5\n2 3","expectedOutput":"1 5"}]'::jsonb,
  2000, 256, FALSE
),
(
  'first-position-of-target',
  'First position of a target in a sorted array (recursive)',
  'The array is sorted in ascending order. Using recursion rather than the standard library search, return the index of the first occurrence of target, or -1 when it is absent. When duplicates exist, the first occurrence must be returned.',
  'easy',
  ARRAY['Sorting & Searching', 'Recursion'],
  ARRAY['0 <= nums.length <= 10^5', 'nums is sorted in non-decreasing order'],
  'Line 1: n' || chr(10) || 'Line 2: n space-separated integers' || chr(10) || 'Line 3: target',
  'A single integer: the first index of target, or -1.',
  '[{"input":"7\n1 2 2 2 3 4 5\n2","output":"2","explanation":"2 first appears at index 2, not at 1 or 3."},{"input":"4\n1 3 5 7\n4","output":"-1","explanation":"4 is not present."}]'::jsonb,
  E'class Solution {\n    public int search(int[] nums, int target) {\n        // Your solution here (use a private recursive helper if you like).\n        return -1;\n    }\n}',
  'public int search(int[] nums, int target)',
  '[{"id":"visible-1","input":"7\n1 2 2 2 3 4 5\n2","expectedOutput":"2"},{"id":"visible-2","input":"4\n1 3 5 7\n4","expectedOutput":"-1"},{"id":"visible-3","input":"0\n\n9","expectedOutput":"-1"}]'::jsonb,
  2000, 256, FALSE
),
(
  'group-anagrams',
  'Group anagrams together',
  'Given an array of strings, group the anagrams together and return the groups. The relative order of the groups follows the first appearance of any member.',
  'medium',
  ARRAY['HashMap', 'Strings', 'Sorting & Searching'],
  ARRAY['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100', 'strs[i] contains lowercase English letters only'],
  'Line 1: k (number of strings)' || chr(10) || 'Then k lines, one string per line',
  'One group per line; members separated by a single space.',
  '[{"input":"6\neat\ntea\ntan\nate\nnat\nbat","output":"eat tea ate\ntan nat\nbat","explanation":"eat/tea/ate share a key; tan/nat share one; bat is alone."},{"input":"1\na","output":"a","explanation":"A single string forms its own group."}]'::jsonb,
  E'class Solution {\n    public List<List<String>> groupAnagrams(List<String> strs) {\n        // Your solution here.\n        return new ArrayList<>();\n    }\n}',
  'public List<List<String>> groupAnagrams(List<String> strs)',
  '[{"id":"visible-1","input":"6\neat\ntea\ntan\nate\nnat\nbat","expectedOutput":"eat tea ate\ntan nat\nbat"},{"id":"visible-2","input":"1\na","expectedOutput":"a"},{"id":"visible-3","input":"3\nab\nba\nabc","expectedOutput":"ab ba\nabc"}]'::jsonb,
  2000, 256, FALSE
),
(
  'longest-substring-without-repeating',
  'Longest substring without repeating characters',
  'Return the length of the longest contiguous substring that contains no repeated character.',
  'medium',
  ARRAY['Strings', 'Collections'],
  ARRAY['0 <= s.length <= 10^5', 's contains printable ASCII characters only'],
  'Line 1: the string s (may be empty)',
  'A single integer: the length of the longest such substring.',
  '[{"input":"abcabcbb","output":"3","explanation":"abc repeats nowhere; the answer is 3."},{"input":"bbbbb","output":"1","explanation":"Only a single character can be kept."}]'::jsonb,
  E'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Your solution here.\n        return 0;\n    }\n}',
  'public int lengthOfLongestSubstring(String s)',
  '[{"id":"visible-1","input":"abcabcbb","expectedOutput":"3"},{"id":"visible-2","input":"bbbbb","expectedOutput":"1"},{"id":"visible-3","input":"pwwkew","expectedOutput":"3"}]'::jsonb,
  2000, 256, FALSE
),
(
  'valid-parentheses',
  'Valid parentheses',
  'Given a string containing only the characters ( ) [ ] {, decide whether the brackets are balanced: every opening bracket is closed by the same type of bracket in the correct order.',
  'easy',
  ARRAY['Stacks & Queues', 'Strings'],
  ARRAY['0 <= s.length <= 10^4', 's consists only of the characters ( ) [ ] { }'],
  'Line 1: the string s (may be empty)',
  'true when balanced, otherwise false.',
  '[{"input":"({[]})","output":"true","explanation":"Every bracket is closed in order."},{"input":"([)]","output":"false","explanation":"The [ is closed by the wrong type."}]'::jsonb,
  E'class Solution {\n    public boolean isValid(String s) {\n        // Your solution here.\n        return false;\n    }\n}',
  'public boolean isValid(String s)',
  '[{"id":"visible-1","input":"({[]})","expectedOutput":"true"},{"id":"visible-2","input":"([)]","expectedOutput":"false"},{"id":"visible-3","input":"","expectedOutput":"true"}]'::jsonb,
  2000, 256, FALSE
),
(
  'min-stack',
  'Design a stack that reports its minimum',
  'Design a stack that supports push, pop, top and retrieving the minimum element in constant time. The API is fixed; you are expected to design the class rather than call a ready-made structure.',
  'medium',
  ARRAY['Stacks & Queues', 'OOP'],
  ARRAY['Operations must each take O(1) time', '-10^9 <= values <= 10^9', 'pop and top are only called on a non-empty stack'],
  'Line 1: q (number of operations)' || chr(10) || 'Then q lines, each either push <v> or pop',
  'One line per pop or getMin operation: the value or current minimum.',
  '[{"input":"5\npush 3\npush 1\npop\npush 2\npop","output":"3\n1","explanation":"Each pop emits the removed value: 3 then 1."}]'::jsonb,
  E'class MinStack {\n    private final Deque<Integer> values = new ArrayDeque<>();\n    public void push(int value) { }\n    public void pop() { }\n    public int top() { return 0; }\n    public int getMin() { return 0; }\n}',
  'public void push(int value), public void pop(), public int top(), public int getMin()',
  '[{"id":"visible-1","input":"5\npush 3\npush 1\npop\npush 2\npop","expectedOutput":"3\n1"},{"id":"visible-2","input":"3\npush 5\npush 7\npush 2","expectedOutput":""},{"id":"visible-3","input":"4\npush 4\npush 4\npop\npop","expectedOutput":"4\n4"}]'::jsonb,
  2000, 256, FALSE
),
(
  'reverse-linked-list-recursive',
  'Reverse a singly linked list (recursive)',
  'Given the head of a singly linked list, reverse the list in place and return the new head. Implement the reversal recursively rather than iteratively.',
  'easy',
  ARRAY['Linked Lists', 'Recursion'],
  ARRAY['0 <= list.length <= 10^4'],
  'Line 1: n' || chr(10) || 'Line 2: n space-separated values in list order',
  'The values of the reversed list, space separated.',
  '[{"input":"5\n1 2 3 4 5","output":"5 4 3 2 1","explanation":"The order is fully reversed."},{"input":"0\n","output":"","explanation":"An empty list stays empty."}]'::jsonb,
  E'class Solution {\n    public ListNode reverse(ListNode head) {\n        // Your solution here.\n        return head;\n    }\n}',
  'public ListNode reverse(ListNode head)',
  '[{"id":"visible-1","input":"5\n1 2 3 4 5","expectedOutput":"5 4 3 2 1"},{"id":"visible-2","input":"0\n","expectedOutput":""},{"id":"visible-3","input":"2\n9 1","expectedOutput":"1 9"}]'::jsonb,
  2000, 256, FALSE
),
(
  'remove-nth-from-end',
  'Remove the n-th node from the end of a list',
  'Given the head of a linked list, remove the n-th node from the end of the list and return the head. One pass, no extra storage beyond a fixed number of pointers.',
  'medium',
  ARRAY['Linked Lists', 'Collections', 'Java Streams'],
  ARRAY['1 <= n <= list.length <= 10^4', 'n is always valid'],
  'Line 1: n' || chr(10) || 'Line 2: list length m, then m values in list order',
  'The remaining values, space separated.',
  '[{"input":"2\n5\n1 2 3 4 5","output":"1 2 3 5","explanation":"The 2nd from the end is 4, which is removed."},{"input":"1\n1\n7","output":"","explanation":"Removing the only node leaves an empty list."}]'::jsonb,
  E'class Solution {\n    public ListNode removeNthFromEnd(ListNode head, int n) {\n        // Your solution here.\n        return head;\n    }\n}',
  'public ListNode removeNthFromEnd(ListNode head, int n)',
  '[{"id":"visible-1","input":"2\n5\n1 2 3 4 5","expectedOutput":"1 2 3 5"},{"id":"visible-2","input":"1\n1\n7","expectedOutput":""},{"id":"visible-3","input":"3\n4\n1 2 3 4","expectedOutput":"1 2 4"}]'::jsonb,
  2000, 256, FALSE
),
(
  'top-k-frequent-words',
  'Top k frequent words',
  'Return the k most frequent words in the input. Order ties by ascending word, and return exactly k words whenever at least k distinct words exist.',
  'medium',
  ARRAY['Java Streams', 'HashMap', 'Sorting & Searching'],
  ARRAY['1 <= words.length <= 10^5', '1 <= k <= words.length', 'words contain lowercase English letters only'],
  'Line 1: k' || chr(10) || 'Line 2: w (number of words)' || chr(10) || 'Line 3: w space-separated words',
  'The k words, separated by a single space.',
  '[{"input":"2\n5\na b a c b a","output":"a b","explanation":"a appears 3 times and b twice, so a then b."},{"input":"1\n3\nx y z","output":"x","explanation":"All counts are 1, so ascending word order picks x."}]'::jsonb,
  E'class Solution {\n    public List<String> topKFrequent(List<String> words, int k) {\n        // Your solution here.\n        return List.of();\n    }\n}',
  'public List<String> topKFrequent(List<String> words, int k)',
  '[{"id":"visible-1","input":"2\n5\na b a c b a","expectedOutput":"a b"},{"id":"visible-2","input":"1\n3\nx y z","expectedOutput":"x"},{"id":"visible-3","input":"3\n6\nb a c a b c a","expectedOutput":"a b c"}]'::jsonb,
  3000, 256, FALSE
),
(
  'climbing-stairs',
  'Ways to climb a staircase',
  'You can climb either 1 or 2 steps at a time. How many distinct sequences reach the top of a staircase of n steps?',
  'easy',
  ARRAY['Dynamic Programming', 'Recursion'],
  ARRAY['1 <= n <= 45'],
  'Line 1: n',
  'A single integer: the number of distinct ways.',
  '[{"input":"2","output":"2","explanation":"1+1 or 2."},{"input":"3","output":"3","explanation":"1+1+1, 1+2, 2+1."}]'::jsonb,
  E'class Solution {\n    public int climbStairs(int n) {\n        // Your solution here.\n        return 0;\n    }\n}',
  'public int climbStairs(int n)',
  '[{"id":"visible-1","input":"2","expectedOutput":"2"},{"id":"visible-2","input":"3","expectedOutput":"3"},{"id":"visible-3","input":"5","expectedOutput":"8"}]'::jsonb,
  2000, 256, FALSE
),
-- ── Interview expansion (12 more, same conventions) ────────────────────────
(
  'best-time-to-buy-and-sell-stock',
  'Best time to buy and sell a stock',
  'Given an array where the i-th element is the price of a stock on day i, return the maximum profit achievable from a single buy followed by a single later sell. If no profitable trade exists, return 0.',
  'easy',
  ARRAY['Arrays', 'Greedy'],
  ARRAY['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
  'Line 1: n' || chr(10) || 'Line 2: n space-separated prices',
  'A single integer: the maximum profit, or 0 when no trade is profitable.',
  '[{"input":"6\n7 1 5 3 6 4","output":"5","explanation":"Buy on day 2 at price 1 and sell on day 5 at price 6."},{"input":"5\n7 6 4 3 1","output":"0","explanation":"Prices only fall, so the best move is to never trade."}]'::jsonb,
  E'class Solution {\n    public int maxProfit(int[] prices) {\n        // Your solution here.\n        return 0;\n    }\n}',
  'public int maxProfit(int[] prices)',
  '[{"id":"visible-1","input":"6\n7 1 5 3 6 4","expectedOutput":"5"},{"id":"visible-2","input":"5\n7 6 4 3 1","expectedOutput":"0"},{"id":"visible-3","input":"1\n5","expectedOutput":"0"}]'::jsonb,
  2000, 256, FALSE
),
(
  'contains-duplicate',
  'Detect a duplicate value in an array',
  'Given an integer array, return true when any value appears at least twice; return false when every element is distinct. A linear scan with a hash set is the expected interview answer.',
  'easy',
  ARRAY['Arrays', 'HashMap'],
  ARRAY['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
  'Line 1: n' || chr(10) || 'Line 2: n space-separated integers',
  'true when a duplicate exists, otherwise false.',
  '[{"input":"4\n1 2 3 1","output":"true","explanation":"The value 1 appears twice."},{"input":"4\n1 2 3 4","output":"false","explanation":"All four values are distinct."}]'::jsonb,
  E'class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Your solution here.\n        return false;\n    }\n}',
  'public boolean containsDuplicate(int[] nums)',
  '[{"id":"visible-1","input":"4\n1 2 3 1","expectedOutput":"true"},{"id":"visible-2","input":"4\n1 2 3 4","expectedOutput":"false"},{"id":"visible-3","input":"1\n42","expectedOutput":"false"}]'::jsonb,
  2000, 256, FALSE
),
(
  'valid-anagram',
  'Check whether two strings are anagrams',
  'Given two strings s and t, return true when t is an anagram of s, meaning the letters of t can be rearranged to spell s exactly. Both strings use lowercase English letters only.',
  'easy',
  ARRAY['Strings', 'HashMap'],
  ARRAY['0 <= s.length, t.length <= 5 * 10^4', 's and t contain lowercase English letters only'],
  'Line 1: the string s' || chr(10) || 'Line 2: the string t',
  'true when t is an anagram of s, otherwise false.',
  '[{"input":"anagram\nnagaram","output":"true","explanation":"Both strings contain a, n and g with identical multiplicities."},{"input":"rat\ncar","output":"false","explanation":"The letter sets differ: r, a, t versus c, a, r."}]'::jsonb,
  E'class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Your solution here.\n        return false;\n    }\n}',
  'public boolean isAnagram(String s, String t)',
  '[{"id":"visible-1","input":"anagram\nnagaram","expectedOutput":"true"},{"id":"visible-2","input":"rat\ncar","expectedOutput":"false"},{"id":"visible-3","input":"aabb\nabab","expectedOutput":"true"}]'::jsonb,
  2000, 256, FALSE
),
(
  'roman-to-integer',
  'Convert a Roman numeral to an integer',
  'Given a Roman numeral, convert it to its integer value. The six subtractive pairs IV, IX, XL, XC, CD and CM must be handled; every other symbol is added.',
  'easy',
  ARRAY['Strings', 'HashMap'],
  ARRAY['1 <= s.length <= 15', 's is a valid Roman numeral in the range 1 to 3999'],
  'Line 1: the Roman numeral s',
  'A single integer: the value of the numeral.',
  '[{"input":"MCMXCIV","output":"1994","explanation":"M = 1000, CM = 900, XC = 90 and IV = 4."},{"input":"LVIII","output":"58","explanation":"L = 50, V = 5 and III = 3."}]'::jsonb,
  E'class Solution {\n    public int romanToInt(String s) {\n        // Your solution here.\n        return 0;\n    }\n}',
  'public int romanToInt(String s)',
  '[{"id":"visible-1","input":"MCMXCIV","expectedOutput":"1994"},{"id":"visible-2","input":"LVIII","expectedOutput":"58"},{"id":"visible-3","input":"III","expectedOutput":"3"}]'::jsonb,
  2000, 256, FALSE
),
(
  'longest-common-prefix',
  'Longest common prefix of a word list',
  'Given an array of strings, return the longest prefix shared by every string. When the strings share nothing, return the empty string.',
  'easy',
  ARRAY['Strings', 'Sorting & Searching'],
  ARRAY['1 <= strs.length <= 200', '0 <= strs[i].length <= 200', 'strs[i] contains lowercase English letters only'],
  'Line 1: k (number of strings)' || chr(10) || 'Then k lines, one string per line',
  'The longest common prefix, possibly an empty line.',
  '[{"input":"3\nflower\nflow\nflight","output":"flow","explanation":"All three strings begin with flow."},{"input":"3\ndog\nracecar\ncar","output":"","explanation":"The first characters already differ, so the prefix is empty."}]'::jsonb,
  E'class Solution {\n    public String longestCommonPrefix(String[] strs) {\n        // Your solution here.\n        return "";\n    }\n}',
  'public String longestCommonPrefix(String[] strs)',
  '[{"id":"visible-1","input":"3\nflower\nflow\nflight","expectedOutput":"flow"},{"id":"visible-2","input":"3\ndog\nracecar\ncar","expectedOutput":""},{"id":"visible-3","input":"2\ninterspecies\ninterstellar","expectedOutput":"inters"}]'::jsonb,
  2000, 256, FALSE
),
(
  'majority-element',
  'Find the majority element',
  'Given an integer array, return the element that appears strictly more than half the time. Such an element is guaranteed to exist, so the answer is always unique.',
  'easy',
  ARRAY['Arrays', 'HashMap'],
  ARRAY['1 <= nums.length <= 5 * 10^4', '-10^9 <= nums[i] <= 10^9', 'A majority element always exists'],
  'Line 1: n' || chr(10) || 'Line 2: n space-separated integers',
  'A single integer: the majority element.',
  '[{"input":"3\n3 2 3","output":"3","explanation":"3 appears twice out of 3 elements."},{"input":"7\n2 2 1 1 1 2 2","output":"2","explanation":"2 appears four times out of 7 elements."}]'::jsonb,
  E'class Solution {\n    public int majorityElement(int[] nums) {\n        // Your solution here.\n        return 0;\n    }\n}',
  'public int majorityElement(int[] nums)',
  '[{"id":"visible-1","input":"3\n3 2 3","expectedOutput":"3"},{"id":"visible-2","input":"7\n2 2 1 1 1 2 2","expectedOutput":"2"},{"id":"visible-3","input":"1\n8","expectedOutput":"8"}]'::jsonb,
  2000, 256, FALSE
),
(
  'move-zeroes',
  'Move all zeroes to the end',
  'Given an integer array, move every 0 to the end of the array while keeping the relative order of the non-zero elements. The result must be returned as a new array; a stable in-place partition is the interview follow-up.',
  'easy',
  ARRAY['Arrays'],
  ARRAY['1 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
  'Line 1: n' || chr(10) || 'Line 2: n space-separated integers',
  'n space-separated integers: the non-zero values in their original order followed by all zeroes.',
  '[{"input":"5\n0 1 0 3 12","output":"1 3 12 0 0","explanation":"The non-zero values keep their order; the two zeroes move to the end."},{"input":"3\n4 0 5","output":"4 5 0","explanation":"A single zero shifts right by one position."}]'::jsonb,
  E'class Solution {\n    public int[] moveZeroes(int[] nums) {\n        // Your solution here.\n        return nums;\n    }\n}',
  'public int[] moveZeroes(int[] nums)',
  '[{"id":"visible-1","input":"5\n0 1 0 3 12","expectedOutput":"1 3 12 0 0"},{"id":"visible-2","input":"3\n4 0 5","expectedOutput":"4 5 0"},{"id":"visible-3","input":"4\n0 0 0 0","expectedOutput":"0 0 0 0"}]'::jsonb,
  2000, 256, FALSE
),
(
  'house-robber',
  'Maximum loot without robbing adjacent houses',
  'A row of houses each holds some loot. You cannot rob two adjacent houses. Return the maximum amount you can rob without triggering the alarm.',
  'medium',
  ARRAY['Dynamic Programming'],
  ARRAY['1 <= nums.length <= 100', '0 <= nums[i] <= 400'],
  'Line 1: n' || chr(10) || 'Line 2: n space-separated loot amounts',
  'A single integer: the maximum loot.',
  '[{"input":"5\n2 7 9 3 1","output":"12","explanation":"Rob houses 1, 3 and 5: 2 + 9 + 1 = 12."},{"input":"4\n1 2 3 1","output":"4","explanation":"Rob houses 1 and 3: 1 + 3 = 4."}]'::jsonb,
  E'class Solution {\n    public int rob(int[] nums) {\n        // Your solution here.\n        return 0;\n    }\n}',
  'public int rob(int[] nums)',
  '[{"id":"visible-1","input":"5\n2 7 9 3 1","expectedOutput":"12"},{"id":"visible-2","input":"4\n1 2 3 1","expectedOutput":"4"},{"id":"visible-3","input":"1\n10","expectedOutput":"10"}]'::jsonb,
  2000, 256, FALSE
),
(
  'coin-change',
  'Fewest coins to make an amount',
  'Given coin denominations and a target amount, return the fewest number of coins that sum to the amount. Each denomination may be used unlimited times. Return -1 when the amount cannot be formed, and 0 for amount 0.',
  'medium',
  ARRAY['Dynamic Programming', 'Recursion'],
  ARRAY['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
  'Line 1: c (number of denominations)' || chr(10) || 'Line 2: c space-separated coin values' || chr(10) || 'Line 3: the target amount',
  'A single integer: the fewest coins needed, or -1 when the amount is unreachable.',
  '[{"input":"3\n1 2 5\n11","output":"3","explanation":"5 + 5 + 1 makes 11 with three coins."},{"input":"2\n2\n3","output":"-1","explanation":"An odd amount is impossible using only 2-valued coins."}]'::jsonb,
  E'class Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Your solution here.\n        return -1;\n    }\n}',
  'public int coinChange(int[] coins, int amount)',
  '[{"id":"visible-1","input":"3\n1 2 5\n11","expectedOutput":"3"},{"id":"visible-2","input":"2\n2\n3","expectedOutput":"-1"},{"id":"visible-3","input":"1\n1\n0","expectedOutput":"0"}]'::jsonb,
  2000, 256, FALSE
),
(
  'unique-paths',
  'Count unique grid paths',
  'A robot starts at the top-left corner of an m by n grid and moves only right or down. Return the number of distinct paths that reach the bottom-right corner.',
  'medium',
  ARRAY['Dynamic Programming', 'Recursion'],
  ARRAY['1 <= m, n <= 100', 'The answer fits in a 32-bit integer'],
  'Line 1: m' || chr(10) || 'Line 2: n',
  'A single integer: the number of unique paths.',
  '[{"input":"3\n7","output":"28","explanation":"A 3 by 7 grid has 28 monotone lattice paths."},{"input":"3\n2","output":"3","explanation":"Down-down-right, down-right-down and right-down-down."}]'::jsonb,
  E'class Solution {\n    public int uniquePaths(int m, int n) {\n        // Your solution here.\n        return 0;\n    }\n}',
  'public int uniquePaths(int m, int n)',
  '[{"id":"visible-1","input":"3\n7","expectedOutput":"28"},{"id":"visible-2","input":"3\n2","expectedOutput":"3"},{"id":"visible-3","input":"1\n1","expectedOutput":"1"}]'::jsonb,
  2000, 256, FALSE
),
(
  'kth-largest-element',
  'Find the k-th largest element',
  'Given an integer array and an integer k, return the k-th largest element in sorted order, counting duplicates. Note that this is the k-th largest, not the k-th distinct value.',
  'medium',
  ARRAY['Arrays', 'Sorting & Searching', 'Java Streams'],
  ARRAY['1 <= k <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
  'Line 1: k' || chr(10) || 'Line 2: n (number of elements)' || chr(10) || 'Line 3: n space-separated integers',
  'A single integer: the k-th largest element.',
  '[{"input":"2\n6\n3 2 1 5 6 4","output":"5","explanation":"Sorted descending the array is 6 5 4 3 2 1, so the 2nd largest is 5."},{"input":"4\n9\n3 2 3 1 2 4 5 5 6","output":"4","explanation":"Sorted descending the array is 6 5 5 4 3 3 2 2 1, so the 4th largest is 4."}]'::jsonb,
  E'class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        // Your solution here.\n        return 0;\n    }\n}',
  'public int findKthLargest(int[] nums, int k)',
  '[{"id":"visible-1","input":"2\n6\n3 2 1 5 6 4","expectedOutput":"5"},{"id":"visible-2","input":"4\n9\n3 2 3 1 2 4 5 5 6","expectedOutput":"4"},{"id":"visible-3","input":"1\n1\n7","expectedOutput":"7"}]'::jsonb,
  3000, 256, FALSE
),
(
  'trapping-rain-water',
  'Trapping rain water',
  'Given an elevation map whose bar widths are all 1, return the total units of water it can trap after raining. This is a classic hard interview question solvable with two pointers, prefix maxima or a monotonic stack.',
  'hard',
  ARRAY['Arrays', 'Dynamic Programming', 'Stacks & Queues'],
  ARRAY['1 <= height.length <= 2 * 10^4', '0 <= height[i] <= 10^5'],
  'Line 1: n' || chr(10) || 'Line 2: n space-separated elevations',
  'A single integer: the total units of trapped water.',
  '[{"input":"12\n0 1 0 2 1 0 1 3 2 1 2 1","output":"6","explanation":"The classic elevation profile traps 6 units."},{"input":"5\n3 0 2 0 4","output":"7","explanation":"3 + 1 + 3 units sit above the two valleys."}]'::jsonb,
  E'class Solution {\n    public int trap(int[] height) {\n        // Your solution here.\n        return 0;\n    }\n}',
  'public int trap(int[] height)',
  '[{"id":"visible-1","input":"12\n0 1 0 2 1 0 1 3 2 1 2 1","expectedOutput":"6"},{"id":"visible-2","input":"5\n3 0 2 0 4","expectedOutput":"7"},{"id":"visible-3","input":"4\n1 2 3 4","expectedOutput":"0"}]'::jsonb,
  2000, 256, FALSE
)
ON CONFLICT (slug) DO NOTHING;
