export interface ProblemSource {
  label: string;
  url?: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  link: string;
  leetcodeLink: string;
  gfgLink: string;
  solutionLink: string;
  companies: string[];
  source: ProblemSource;
}

export interface SubTopic {
  id: string;
  title: string;
  description: string;
  problems: Problem[];
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  subtopics: SubTopic[];
}

const GFG_SOURCE: ProblemSource = {
  label: "GeeksForGeeks",
  url: "https://www.geeksforgeeks.org/",
};

const LEETCODE_SOURCE: ProblemSource = {
  label: "LeetCode",
  url: "https://leetcode.com/problemset/",
};

type BuildProblemInput = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  companies: string[];
  slug?: string;
  leetcodeLink?: string;
  gfgLink?: string;
  solutionLink?: string;
  source?: ProblemSource;
};

function buildProblem(input: BuildProblemInput): Problem {
  const leetcodeLink =
    input.leetcodeLink ??
    (input.slug
      ? `https://leetcode.com/problems/${input.slug}/`
      : `https://leetcode.com/problemset/?search=${encodeURIComponent(input.title)}`);

  const gfgLink = input.gfgLink ?? `https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(input.title)}`;

  const solutionLink =
    input.solutionLink ??
    (input.slug
      ? `https://leetcode.com/problems/${input.slug}/solutions/`
      : `https://www.geeksforgeeks.org/?s=${encodeURIComponent(`${input.title} solution`)}`);

  return {
    id: input.id,
    title: input.title,
    difficulty: input.difficulty,
    companies: input.companies,
    link: leetcodeLink,
    leetcodeLink,
    gfgLink,
    solutionLink,
    source: input.source ?? LEETCODE_SOURCE,
  };
}

function gfgProblem(input: Omit<BuildProblemInput, "source">): Problem {
  return buildProblem({ ...input, source: GFG_SOURCE });
}

function lcProblem(input: Omit<BuildProblemInput, "source">): Problem {
  return buildProblem({ ...input, source: LEETCODE_SOURCE });
}

export const practiceData: Topic[] = [
  {
    id: "array",
    title: "Array",
    description: "Fundamental collection of elements stored at contiguous memory locations.",
    subtopics: [
      {
        id: "array-two-pointer",
        title: "Two-Pointer",
        description: "Use two indices that move towards or away from each other to reduce redundant comparisons.",
        problems: [
          gfgProblem({ id: "arr-tp-1", title: "Move Zeroes", difficulty: "Easy", slug: "move-zeroes", companies: ["Amazon", "Google", "Swiggy"] }),
          gfgProblem({ id: "arr-tp-2", title: "Two Sum II", difficulty: "Medium", slug: "two-sum-ii-input-array-is-sorted", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "arr-tp-3", title: "3Sum", difficulty: "Medium", slug: "3sum", companies: ["Facebook", "Microsoft", "Morgan Stanley"] }),
          gfgProblem({ id: "arr-tp-4", title: "Sort Colors", difficulty: "Medium", slug: "sort-colors", companies: ["Microsoft", "Flipkart", "Adobe"] }),
          gfgProblem({ id: "arr-tp-5", title: "Container With Most Water", difficulty: "Medium", slug: "container-with-most-water", companies: ["Amazon", "Apple", "DE Shaw"] }),
          gfgProblem({ id: "arr-tp-6", title: "Trapping Rain Water", difficulty: "Hard", slug: "trapping-rain-water", companies: ["Google", "Goldman Sachs", "Sumo Logic"] }),
        ],
      },
      {
        id: "array-sliding-window",
        title: "Sliding Window",
        description: "Maintain a window of fixed size or expand/shrink it to satisfy a condition.",
        problems: [
          gfgProblem({ id: "arr-sw-1", title: "Maximum Sum Subarray of Size K", difficulty: "Easy", companies: ["Amazon", "Microsoft"] }),
          gfgProblem({ id: "arr-sw-2", title: "Max Consecutive Ones", difficulty: "Easy", slug: "max-consecutive-ones", companies: ["Amazon", "Google", "Paytm"] }),
          gfgProblem({ id: "arr-sw-3", title: "Max Consecutive Ones III", difficulty: "Medium", slug: "max-consecutive-ones-iii", companies: ["Amazon", "Google", "Microsoft"] }),
          gfgProblem({ id: "arr-sw-4", title: "Subarray Product Less Than K", difficulty: "Medium", slug: "subarray-product-less-than-k", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "arr-sw-5", title: "Fruits Into Baskets", difficulty: "Medium", slug: "fruit-into-baskets", companies: ["Amazon", "Flipkart", "PhonePe"] }),
          gfgProblem({ id: "arr-sw-6", title: "Minimum Size Subarray Sum", difficulty: "Medium", slug: "minimum-size-subarray-sum", companies: ["Amazon", "Morgan Stanley", "Adobe"] }),
          gfgProblem({ id: "arr-sw-7", title: "Sliding Window Maximum", difficulty: "Hard", slug: "sliding-window-maximum", companies: ["Amazon", "Google", "DE Shaw"] }),
          gfgProblem({ id: "arr-sw-8", title: "Subarray with K Distinct Integers", difficulty: "Hard", slug: "subarrays-with-k-different-integers", companies: ["Amazon", "Google", "Goldman Sachs"] }),
        ],
      },
      {
        id: "array-prefix-sum",
        title: "Prefix Sum",
        description: "Precompute cumulative sums so any subarray or range sum can be answered in O(1).",
        problems: [
          gfgProblem({ id: "arr-ps-1", title: "Find Pivot Index", difficulty: "Easy", slug: "find-pivot-index", companies: ["Amazon", "Paytm", "Morgan Stanley"] }),
          gfgProblem({ id: "arr-ps-2", title: "Subarray Sum Equals K", difficulty: "Medium", slug: "subarray-sum-equals-k", companies: ["Facebook", "Amazon", "Goldman Sachs"] }),
          gfgProblem({ id: "arr-ps-3", title: "Matrix Block Sum (Running Sum of 2D Array)", difficulty: "Medium", slug: "matrix-block-sum", companies: ["Amazon", "Google", "Flipkart"] }),
          gfgProblem({ id: "arr-ps-4", title: "Product of Array Except Self", difficulty: "Medium", slug: "product-of-array-except-self", companies: ["Amazon", "Facebook", "Flipkart"] }),
          gfgProblem({ id: "arr-ps-5", title: "Continuous Subarray Sum", difficulty: "Medium", slug: "continuous-subarray-sum", companies: ["Facebook", "DE Shaw", "Sumo Logic"] }),
          gfgProblem({ id: "arr-ps-6", title: "Subarray Sum Divisible by K", difficulty: "Medium", slug: "subarray-sums-divisible-by-k", companies: ["Goldman Sachs", "Microsoft", "PayPal"] }),
        ],
      },
      {
        id: "array-kadane",
        title: "Kadane's Algorithm",
        description: "Track the best subarray sum ending at each index and update the global maximum.",
        problems: [
          gfgProblem({ id: "arr-kd-1", title: "Maximum Subarray", difficulty: "Medium", slug: "maximum-subarray", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "arr-kd-2", title: "Maximum Product Subarray", difficulty: "Medium", slug: "maximum-product-subarray", companies: ["Google", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "arr-kd-3", title: "Maximum Sum Circular Subarray", difficulty: "Medium", slug: "maximum-sum-circular-subarray", companies: ["Amazon", "Google", "DE Shaw"] }),
          lcProblem({ id: "arr-kd-4", title: "Maximum Absolute Sum of Any Subarray", difficulty: "Medium", slug: "maximum-absolute-sum-of-any-subarray", companies: ["Microsoft", "Apple", "Adobe"] }),
          gfgProblem({ id: "arr-kd-5", title: "Largest Sum Contiguous Subarray", difficulty: "Medium", companies: ["Amazon", "Flipkart", "Zomato"] }),
        ],
      },
    ],
  },
  {
    id: "strings",
    title: "Strings",
    description: "Sequence of characters and common string manipulation patterns.",
    subtopics: [
      {
        id: "strings-two-pointer-palindrome",
        title: "Two-Pointer (Palindrome)",
        description: "Compare characters from both ends and move inward until the condition fails.",
        problems: [
          gfgProblem({ id: "str-tp-1", title: "Reverse a String", difficulty: "Easy", slug: "reverse-string", companies: ["Amazon", "Microsoft"] }),
          gfgProblem({ id: "str-tp-2", title: "Valid Palindrome", difficulty: "Easy", slug: "valid-palindrome", companies: ["Amazon", "Goldman Sachs", "PayPal"] }),
          gfgProblem({ id: "str-tp-3", title: "Valid Palindrome II", difficulty: "Easy", slug: "valid-palindrome-ii", companies: ["Microsoft", "Morgan Stanley", "PhonePe"] }),
          gfgProblem({ id: "str-tp-4", title: "Longest Palindromic Substring", difficulty: "Medium", slug: "longest-palindromic-substring", companies: ["Google", "Sumo Logic", "DE Shaw"] }),
          gfgProblem({ id: "str-tp-5", title: "Palindromic Substrings", difficulty: "Medium", slug: "palindromic-substrings", companies: ["Amazon", "Adobe", "Flipkart"] }),
        ],
      },
      {
        id: "strings-sliding-window",
        title: "Sliding Window (String)",
        description: "Maintain a moving window and adjust its size to satisfy character constraints.",
        problems: [
          gfgProblem({ id: "str-sw-1", title: "Find All Anagrams in a String", difficulty: "Medium", slug: "find-all-anagrams-in-a-string", companies: ["Facebook", "PhonePe", "Swiggy"] }),
          gfgProblem({ id: "str-sw-2", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", slug: "longest-substring-without-repeating-characters", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "str-sw-3", title: "Longest Substring with K Uniques", difficulty: "Medium", companies: ["Amazon", "Paytm", "Morgan Stanley"] }),
          gfgProblem({ id: "str-sw-4", title: "Permutation in String", difficulty: "Medium", slug: "permutation-in-string", companies: ["Google", "PhonePe", "Adobe"] }),
          gfgProblem({ id: "str-sw-5", title: "Minimum Window Substring", difficulty: "Hard", slug: "minimum-window-substring", companies: ["Microsoft", "Flipkart", "PhonePe"] }),
          lcProblem({ id: "str-sw-6", title: "Substring with Concatenation of All Words", difficulty: "Hard", slug: "substring-with-concatenation-of-all-words", companies: ["Google", "Amazon", "Microsoft"] }),
        ],
      },
    ],
  },
  {
    id: "binary-search",
    title: "Binary Search",
    description: "Efficient search algorithm that divides the search interval in half.",
    subtopics: [
      {
        id: "bs-classic",
        title: "Classic Binary Search",
        description: "Divide-and-conquer -> narrow search space in sorted array.",
        problems: [
          gfgProblem({ id: "bs-c-1", title: "Binary Search", difficulty: "Easy", slug: "binary-search", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "bs-c-2", title: "Sqrt(x)", difficulty: "Easy", slug: "sqrtx", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "bs-c-3", title: "Search Insert Position", difficulty: "Easy", slug: "search-insert-position", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "bs-c-4", title: "Search in Rotated Sorted Array", difficulty: "Medium", slug: "search-in-rotated-sorted-array", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "bs-c-5", title: "Find Minimum in Rotated Sorted Array", difficulty: "Medium", slug: "find-minimum-in-rotated-sorted-array", companies: ["Microsoft", "Apple", "Goldman Sachs"] }),
          gfgProblem({ id: "bs-c-6", title: "Find Peak Element", difficulty: "Medium", slug: "find-peak-element", companies: ["Amazon", "Google", "Zomato"] }),
        ],
      },
      {
        id: "bs-lower-upper",
        title: "Lower / Upper Bound",
        description: "Find first/last occurrence or smallest/largest index satisfying a condition.",
        problems: [
          gfgProblem({ id: "bs-lu-1", title: "Find kth rotation", difficulty: "Easy", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "bs-lu-2", title: "Count Occurrences", difficulty: "Easy", companies: ["Amazon", "Google"] }),
          gfgProblem({ id: "bs-lu-3", title: "Ceiling in a Sorted Array", difficulty: "Easy", companies: ["Microsoft", "Apple", "Goldman Sachs"] }),
          gfgProblem({ id: "bs-lu-4", title: "Floor in a Sorted Array", difficulty: "Easy", companies: ["Amazon", "Google", "Zomato"] }),
          gfgProblem({ id: "bs-lu-5", title: "Find First and Last Position of Element", difficulty: "Medium", slug: "find-first-and-last-position-of-element-in-sorted-array", companies: ["Amazon", "Google", "Goldman Sachs"] }),
        ],
      },
      {
        id: "bs-on-answers",
        title: "Binary Search on Answers",
        description: "Treat answer space as sorted -> binary search to find minimum/maximum feasible value.",
        problems: [
          gfgProblem({ id: "bs-ans-1", title: "Koko Eating Bananas", difficulty: "Medium", slug: "koko-eating-bananas", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "bs-ans-2", title: "Capacity To Ship Packages Within D Days", difficulty: "Medium", slug: "capacity-to-ship-packages-within-d-days", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          lcProblem({ id: "bs-ans-3", title: "Min Speed to Arrive on Time", difficulty: "Medium", slug: "minimum-speed-to-arrive-on-time", companies: ["Microsoft", "Apple", "Goldman Sachs"] }),
          gfgProblem({ id: "bs-ans-4", title: "Aggressive cows", difficulty: "Medium", companies: ["Flipkart", "PhonePe", "Amazon"] }),
          gfgProblem({ id: "bs-ans-5", title: "Min number of days to make m bouquets", difficulty: "Medium", slug: "minimum-number-of-days-to-make-m-bouquets", companies: ["Flipkart", "PhonePe", "Paytm"] }),
          lcProblem({ id: "bs-ans-6", title: "Magnetic Force Between Two Balls", difficulty: "Medium", slug: "magnetic-force-between-two-balls", companies: ["Flipkart", "PhonePe", "Paytm"] }),
          gfgProblem({ id: "bs-ans-7", title: "Allocate Minimum Number of Pages", difficulty: "Medium", companies: ["Flipkart", "PhonePe", "Paytm"] }),
          gfgProblem({ id: "bs-ans-8", title: "Split Array Largest Sum", difficulty: "Hard", slug: "split-array-largest-sum", companies: ["Amazon", "Google", "Goldman Sachs"] }),
        ],
      },
      {
        id: "bs-2d-matrix",
        title: "Search in 2D Matrix",
        description: "Apply binary search row-wise / column-wise or flattened array.",
        problems: [
          gfgProblem({ id: "bs-2d-1", title: "Search a 2D Matrix", difficulty: "Medium", slug: "search-a-2d-matrix", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "bs-2d-2", title: "Search a 2D Matrix II", difficulty: "Medium", slug: "search-a-2d-matrix-ii", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "bs-2d-3", title: "Kth Smallest Element in Sorted Matrix", difficulty: "Medium", slug: "kth-smallest-element-in-a-sorted-matrix", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "bs-2d-4", title: "Matrix Median", difficulty: "Hard", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
        ],
      },
    ],
  },
  {
    id: "stack",
    title: "Stack",
    description: "LIFO (Last In First Out) data structure patterns.",
    subtopics: [
      {
        id: "stack-monotonic",
        title: "Monotonic Stack",
        description: "Maintain a monotonic increasing/decreasing stack to find next/prev greater/smaller, histogram ranges, or collisions.",
        problems: [
          gfgProblem({ id: "st-mo-1", title: "Next Greater Element I", difficulty: "Easy", slug: "next-greater-element-i", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          lcProblem({ id: "st-mo-2", title: "Next Greater Element II", difficulty: "Medium", slug: "next-greater-element-ii", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          lcProblem({ id: "st-mo-3", title: "Daily Temperatures", difficulty: "Medium", slug: "daily-temperatures", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "st-mo-4", title: "Online Stock Span", difficulty: "Medium", slug: "online-stock-span", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "st-mo-5", title: "Asteroid Collision", difficulty: "Medium", slug: "asteroid-collision", companies: ["Flipkart", "PhonePe", "Morgan Stanley"] }),
          gfgProblem({ id: "st-mo-6", title: "Largest Rectangle in Histogram", difficulty: "Hard", slug: "largest-rectangle-in-histogram", companies: ["Google", "PayPal", "DE Shaw"] }),
          gfgProblem({ id: "st-mo-7", title: "Maximal Rectangle", difficulty: "Hard", slug: "maximal-rectangle", companies: ["Amazon", "Goldman Sachs", "Zomato"] }),
        ],
      },
      {
        id: "stack-expression-evaluation",
        title: "Expression Evaluation",
        description: "Use two stacks or postfix evaluation to handle numbers and operators efficiently.",
        problems: [
          gfgProblem({ id: "st-ex-1", title: "Basic Calculator II", difficulty: "Medium", slug: "basic-calculator-ii", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "st-ex-2", title: "Evaluate Reverse Polish Notation", difficulty: "Medium", slug: "evaluate-reverse-polish-notation", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "st-ex-3", title: "Decode String", difficulty: "Medium", slug: "decode-string", companies: ["Google", "PayPal", "Zomato"] }),
          gfgProblem({ id: "st-ex-4", title: "infix to prefix", difficulty: "Medium", companies: ["Microsoft", "Morgan Stanley", "Goldman Sachs"] }),
          gfgProblem({ id: "st-ex-5", title: "infix to postfix", difficulty: "Medium", companies: ["Microsoft", "Morgan Stanley", "Goldman Sachs"] }),
          gfgProblem({ id: "st-ex-6", title: "postfix to prefix", difficulty: "Medium", companies: ["Microsoft", "Morgan Stanley", "Goldman Sachs"] }),
          gfgProblem({ id: "st-ex-7", title: "postfix to infix", difficulty: "Medium", companies: ["Microsoft", "Morgan Stanley", "Goldman Sachs"] }),
          gfgProblem({ id: "st-ex-8", title: "prefix to infix", difficulty: "Medium", companies: ["Microsoft", "Morgan Stanley", "Goldman Sachs"] }),
          gfgProblem({ id: "st-ex-9", title: "prefix to postfix", difficulty: "Medium", companies: ["Microsoft", "Morgan Stanley", "Goldman Sachs"] }),
          gfgProblem({ id: "st-ex-10", title: "Basic Calculator I", difficulty: "Hard", slug: "basic-calculator", companies: ["Amazon", "Google", "Goldman Sachs"] }),
        ],
      },
      {
        id: "stack-simulation",
        title: "Stack Simulation / Undo Operation",
        description: "Simulate operations using a stack -> pop on undo, remove adjacent duplicates, collapse characters.",
        problems: [
          gfgProblem({ id: "st-si-1", title: "Backspace String Compare", difficulty: "Easy", slug: "backspace-string-compare", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "st-si-2", title: "Remove All Adjacent Duplicates", difficulty: "Easy", slug: "remove-all-adjacent-duplicates-in-string", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "st-si-3", title: "Make the String Great", difficulty: "Easy", slug: "make-the-string-great", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          lcProblem({ id: "st-si-4", title: "Minimum String Length After Removing Substrings", difficulty: "Medium", slug: "minimum-string-length-after-removing-substrings", companies: ["Google", "PayPal", "Zomato"] }),
        ],
      },
      {
        id: "stack-parenthesis-scoring",
        title: "Parenthesis & Scoring",
        description: "Push opening symbols and validate closing ones; sometimes track count or score.",
        problems: [
          gfgProblem({ id: "st-pa-1", title: "Valid Parentheses", difficulty: "Easy", slug: "valid-parentheses", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "st-pa-2", title: "Minimum Add to Make Parentheses Valid", difficulty: "Medium", slug: "minimum-add-to-make-parentheses-valid", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "st-pa-3", title: "Score of Parentheses", difficulty: "Medium", slug: "score-of-parentheses", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "st-pa-4", title: "Longest Valid Parentheses", difficulty: "Hard", slug: "longest-valid-parentheses", companies: ["Flipkart", "Paytm", "PhonePe"] }),
        ],
      },
      {
        id: "stack-based-design",
        title: "Stack-Based Design",
        description: "Use two stacks to implement another data structure or maintain extra info.",
        problems: [
          gfgProblem({ id: "st-de-1", title: "Implement Queue using Stacks", difficulty: "Easy", slug: "implement-queue-using-stacks", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "st-de-2", title: "Implement Stack using Queues", difficulty: "Easy", slug: "implement-stack-using-queues", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "st-de-3", title: "Min Stack", difficulty: "Medium", slug: "min-stack", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "st-de-4", title: "Max Stack", difficulty: "Medium", slug: "max-stack", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "st-de-5", title: "Design Stack with Increment Operation", difficulty: "Medium", slug: "design-a-stack-with-increment-operation", companies: ["Microsoft", "Morgan Stanley", "Goldman Sachs"] }),
        ],
      },
      {
        id: "stack-recursive",
        title: "Recursive Stack",
        description: "Handle top/head element recursively -> recurse on remaining stack/list -> combine/insert results.",
        problems: [
          gfgProblem({ id: "st-re-1", title: "Delete Middle Element of Stack", difficulty: "Easy", companies: ["Amazon", "Microsoft"] }),
          gfgProblem({ id: "st-re-2", title: "Reverse a Stack (Recursive)", difficulty: "Medium", companies: ["Amazon", "Samsung"] }),
          gfgProblem({ id: "st-re-3", title: "Insert at Bottom of Stack", difficulty: "Medium", companies: ["Google", "Microsoft"] }),
        ],
      },
    ],
  },
  {
    id: "linked-list",
    title: "Linked List",
    description: "Linear data structure where elements are not stored at contiguous memory locations.",
    subtopics: [
      {
        id: "ll-basic-operations",
        title: "Basic Operations",
        description: "Directly manipulate pointers to insert, delete, traverse, and get length.",
        problems: [
          gfgProblem({ id: "ll-ba-1", title: "Search in Linked List", difficulty: "Easy", companies: ["Facebook", "DE Shaw", "Zomato"] }),
          gfgProblem({ id: "ll-ba-2", title: "Insert at Head / Tail / Nth Position", difficulty: "Easy", companies: ["Amazon", "Paytm", "PayPal"] }),
          gfgProblem({ id: "ll-ba-3", title: "Delete Head / Tail / Nth Node", difficulty: "Easy", companies: ["Google", "Adobe", "Morgan Stanley"] }),
          gfgProblem({ id: "ll-ba-4", title: "Design Linked List", difficulty: "Medium", slug: "design-linked-list", companies: ["Amazon", "Facebook", "Goldman Sachs"] }),
          gfgProblem({ id: "ll-ba-5", title: "Odd-Even Linked List", difficulty: "Medium", slug: "odd-even-linked-list", companies: ["Google", "PayPal", "Zomato"] }),
        ],
      },
      {
        id: "ll-fast-slow-pointers",
        title: "Fast and Slow Pointers",
        description: "Use two pointers at different speeds to detect cycles, middle node, or duplicates.",
        problems: [
          gfgProblem({ id: "ll-fs-1", title: "Middle of the Linked List", difficulty: "Easy", slug: "middle-of-the-linked-list", companies: ["DE Shaw", "Flipkart", "Paytm"] }),
          gfgProblem({ id: "ll-fs-2", title: "Linked List Cycle", difficulty: "Easy", slug: "linked-list-cycle", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "ll-fs-3", title: "Linked List Cycle II", difficulty: "Medium", slug: "linked-list-cycle-ii", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "ll-fs-4", title: "Remove Nth Node From End", difficulty: "Medium", slug: "remove-nth-node-from-end-of-list", companies: ["Google", "PayPal", "Swiggy"] }),
        ],
      },
      {
        id: "ll-reversal-pattern",
        title: "Reversal Pattern",
        description: "Reverse entire list, partial list, or groups to reorder nodes.",
        problems: [
          gfgProblem({ id: "ll-rv-1", title: "Reverse a Linked List", difficulty: "Easy", slug: "reverse-linked-list", companies: ["Amazon", "Microsoft", "Goldman Sachs"] }),
          gfgProblem({ id: "ll-rv-2", title: "Palindrome Linked List", difficulty: "Easy", slug: "palindrome-linked-list", companies: ["Amazon", "PhonePe", "Adobe"] }),
          gfgProblem({ id: "ll-rv-3", title: "Reverse Linked List II (between m & n)", difficulty: "Medium", slug: "reverse-linked-list-ii", companies: ["DE Shaw", "Flipkart", "Paytm"] }),
          gfgProblem({ id: "ll-rv-4", title: "Swap Nodes in Pairs", difficulty: "Medium", slug: "swap-nodes-in-pairs", companies: ["Amazon", "PhonePe", "Adobe"] }),
          gfgProblem({ id: "ll-rv-5", title: "Rotate List", difficulty: "Medium", slug: "rotate-list", companies: ["Amazon", "Microsoft", "Sumo Logic"] }),
          gfgProblem({ id: "ll-rv-6", title: "Reverse Nodes in k-Group", difficulty: "Hard", slug: "reverse-nodes-in-k-group", companies: ["Google", "Facebook", "Morgan Stanley"] }),
        ],
      },
      {
        id: "ll-merge-sort",
        title: "Merge / Sort",
        description: "Merge sorted lists, sort list using merge sort, or reorder using middle + reverse + merge.",
        problems: [
          gfgProblem({ id: "ll-ms-1", title: "Merge Two Sorted Lists", difficulty: "Easy", slug: "merge-two-sorted-lists", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "ll-ms-2", title: "Remove Duplicates from Sorted List", difficulty: "Easy", slug: "remove-duplicates-from-sorted-list", companies: ["Google", "PhonePe", "Sumo Logic"] }),
          gfgProblem({ id: "ll-ms-3", title: "Sort List", difficulty: "Medium", slug: "sort-list", companies: ["Flipkart", "Paytm", "Adobe"] }),
          gfgProblem({ id: "ll-ms-4", title: "Reorder List", difficulty: "Medium", slug: "reorder-list", companies: ["Amazon", "PayPal", "Morgan Stanley"] }),
          gfgProblem({ id: "ll-ms-5", title: "Merge K Sorted Lists", difficulty: "Hard", slug: "merge-k-sorted-lists", companies: ["Microsoft", "Facebook", "DE Shaw"] }),
        ],
      },
      {
        id: "ll-stack-combo",
        title: "Linked List + Stack",
        description: "Use a stack to handle backward traversal, carry logic, or next greater node.",
        problems: [
          gfgProblem({ id: "ll-st-1", title: "Add Two Numbers", difficulty: "Medium", slug: "add-two-numbers", companies: ["Amazon", "Microsoft", "Goldman Sachs"] }),
          gfgProblem({ id: "ll-st-2", title: "Add Two Numbers II", difficulty: "Medium", slug: "add-two-numbers-ii", companies: ["Google", "Facebook", "DE Shaw"] }),
          lcProblem({ id: "ll-st-3", title: "Next Greater Node in Linked List", difficulty: "Medium", slug: "next-greater-node-in-linked-list", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "ll-st-4", title: "Remove Nodes From Linked List", difficulty: "Medium", slug: "remove-nodes-from-linked-list", companies: ["Amazon", "Adobe", "Morgan Stanley"] }),
        ],
      },
    ],
  },
  {
    id: "double-linked-list",
    title: "Double Linked List",
    description: "Linked List with navigation in both forward and backward directions.",
    subtopics: [
      {
        id: "dll-basic-operations",
        title: "Basic DLL Operations",
        description: "Maintain prev and next pointers carefully for insert, delete, traversal; use DLL + HashMap for O(1) cache operations.",
        problems: [
          gfgProblem({ id: "dll-ba-1", title: "Implement Doubly Linked List", difficulty: "Easy", companies: ["Amazon", "Microsoft", "Goldman Sachs"] }),
          gfgProblem({ id: "dll-ba-2", title: "Insert a node in a doubly Linkedlist", difficulty: "Easy", companies: ["Amazon", "Microsoft", "Goldman Sachs"] }),
          gfgProblem({ id: "dll-ba-3", title: "Delete a node from a doubly Linkedlist", difficulty: "Easy", companies: ["Amazon", "Microsoft", "Goldman Sachs"] }),
          gfgProblem({ id: "dll-ba-4", title: "Reverse Doubly Linked List", difficulty: "Easy", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "dll-ba-5", title: "LRU Cache", difficulty: "Medium", slug: "lru-cache", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "dll-ba-6", title: "LFU Cache", difficulty: "Hard", slug: "lfu-cache", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
        ],
      },
      {
        id: "dll-merge-sort-reorder",
        title: "Merge / Sort / Reorder",
        description: "Use DLL properties (prev/next) to efficiently merge, sort, reorder, flatten, or perform pointer-based checks.",
        problems: [
          gfgProblem({ id: "dll-ms-1", title: "Merge Two Sorted DLLs", difficulty: "Medium", companies: ["Google", "Facebook", "Morgan Stanley"] }),
          lcProblem({ id: "dll-ms-2", title: "Flatten Multilevel DLL", difficulty: "Medium", slug: "flatten-a-multilevel-doubly-linked-list", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "dll-ms-3", title: "Convert DLL to Binary Tree", difficulty: "Medium", companies: ["Amazon", "Google", "Goldman Sachs"] }),
        ],
      },
    ],
  },
  {
    id: "hashmap",
    title: "HashMap",
    description: "Key-value pair data structure for O(1) average time complexity lookups.",
    subtopics: [
      {
        id: "hashmap-frequency-counting",
        title: "Frequency Map / Counting",
        description: "Count elements to find majority, top-k frequent, or sort by frequency.",
        problems: [
          gfgProblem({ id: "hm-fr-1", title: "Majority Element", difficulty: "Easy", slug: "majority-element", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "hm-fr-2", title: "Top K Frequent Elements", difficulty: "Medium", slug: "top-k-frequent-elements", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "hm-fr-3", title: "Sort Characters By Frequency", difficulty: "Medium", slug: "sort-characters-by-frequency", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "hm-fr-4", title: "Task Scheduler (frequency-based greedy)", difficulty: "Medium", slug: "task-scheduler", companies: ["Amazon", "Microsoft", "PhonePe"] }),
        ],
      },
      {
        id: "hashmap-prefix-sum",
        title: "Prefix-Sum with Map",
        description: "Track cumulative sums; map stores first occurrence -> solve subarray sum problems.",
        problems: [
          gfgProblem({ id: "hm-ps-1", title: "Subarray Sum Equals K", difficulty: "Medium", slug: "subarray-sum-equals-k", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "hm-ps-2", title: "Continuous Subarray Sum", difficulty: "Medium", slug: "continuous-subarray-sum", companies: ["Google", "Zomato", "Morgan Stanley"] }),
          gfgProblem({ id: "hm-ps-3", title: "Subarray Sums Divisible by K", difficulty: "Medium", slug: "subarray-sums-divisible-by-k", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "hm-ps-4", title: "Count Subarrays with Sum K", difficulty: "Medium", companies: ["Amazon", "Microsoft", "Goldman Sachs"] }),
        ],
      },
      {
        id: "hashmap-sliding-window",
        title: "Sliding Window + HashMap",
        description: "Maintain counts in a moving window -> expand/shrink -> track longest/shortest satisfying condition.",
        problems: [
          gfgProblem({ id: "hm-sw-1", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", slug: "longest-substring-without-repeating-characters", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "hm-sw-2", title: "Find All Anagrams in a String", difficulty: "Medium", slug: "find-all-anagrams-in-a-string", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "hm-sw-3", title: "Fruit Into Baskets", difficulty: "Medium", slug: "fruit-into-baskets", companies: ["Amazon", "Microsoft", "PhonePe"] }),
          gfgProblem({ id: "hm-sw-4", title: "Longest Substring with At Most K Distinct Characters", difficulty: "Medium", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "hm-sw-5", title: "Minimum Window Substring", difficulty: "Hard", slug: "minimum-window-substring", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
        ],
      },
    ],
  },
  {
    id: "heap",
    title: "Heap",
    description: "Priority Queue data structure for efficient retrieval of highest/lowest priority elements.",
    subtopics: [
      {
        id: "heap-top-k-elements",
        title: "Top-K Elements",
        description: "Use min-heap for top-k largest, max-heap for top-k smallest -> maintain heap of size k.",
        problems: [
          gfgProblem({ id: "hp-tk-1", title: "K Frequent Words", difficulty: "Medium", slug: "top-k-frequent-words", companies: ["Google", "PayPal", "Zomato"] }),
          gfgProblem({ id: "hp-tk-2", title: "Sort characters by frequency", difficulty: "Medium", slug: "sort-characters-by-frequency", companies: ["Google", "PayPal", "Zomato"] }),
          gfgProblem({ id: "hp-tk-3", title: "Kth Largest Element in an Array", difficulty: "Medium", slug: "kth-largest-element-in-an-array", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "hp-tk-4", title: "Top K Frequent Elements", difficulty: "Medium", slug: "top-k-frequent-elements", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "hp-tk-5", title: "Minimum Cost to Connect Ropes", difficulty: "Medium", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "hp-tk-6", title: "Find Median from Data Stream", difficulty: "Hard", slug: "find-median-from-data-stream", companies: ["Flipkart", "Paytm", "PhonePe"] }),
        ],
      },
      {
        id: "heap-merge-k-sorted",
        title: "Merge K Sorted",
        description: "Use min-heap to merge multiple sorted arrays/lists efficiently.",
        problems: [
          gfgProblem({ id: "hp-mk-1", title: "Find K Pairs with Smallest Sums", difficulty: "Medium", slug: "find-k-pairs-with-smallest-sums", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "hp-mk-2", title: "Merge K Sorted Lists", difficulty: "Hard", slug: "merge-k-sorted-lists", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "hp-mk-3", title: "Smallest Range Covering Elements from K Lists", difficulty: "Hard", slug: "smallest-range-covering-elements-from-k-lists", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
        ],
      },
      {
        id: "heap-sliding-window",
        title: "Heap with Sliding Window",
        description: "Maintain a heap of elements in the window -> pop outdated elements -> track maximum.",
        problems: [
          gfgProblem({ id: "hp-sw-1", title: "Task Scheduler", difficulty: "Medium", slug: "task-scheduler", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "hp-sw-2", title: "Sliding Window Maximum", difficulty: "Hard", slug: "sliding-window-maximum", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "hp-sw-3", title: "Sliding Window Median", difficulty: "Hard", slug: "sliding-window-median", companies: ["Google", "Apple", "Zomato"] }),
        ],
      },
      {
        id: "heap-implementation",
        title: "Implementation of Heap",
        description: "Design heap.",
        problems: [
          gfgProblem({ id: "hp-im-1", title: "Implement priority queue", difficulty: "Easy", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "hp-im-2", title: "Implement min heap", difficulty: "Medium", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "hp-im-3", title: "Implement max heap", difficulty: "Medium", companies: ["Myntra", "Apple", "Zomato"] }),
        ],
      },
      {
        id: "heap-huffman-pattern",
        title: "Huffman pattern",
        description: "Repeatedly combine the two smallest elements to minimize the total cost.",
        problems: [
          lcProblem({ id: "hp-hf-1", title: "Minimum Cost to Connect Sticks", difficulty: "Easy", slug: "minimum-cost-to-connect-sticks", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "hp-hf-2", title: "Minimum Cost of Ropes", difficulty: "Medium", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "hp-hf-3", title: "Merge Files with Minimum Cost", difficulty: "Medium", companies: ["Myntra", "Apple", "Zomato"] }),
          lcProblem({ id: "hp-hf-4", title: "Combine Cards / Numbers with Minimum Cost", difficulty: "Medium", companies: ["Myntra", "Apple", "Zomato"] }),
          gfgProblem({ id: "hp-hf-5", title: "Reorganize String", difficulty: "Medium", slug: "reorganize-string", companies: ["Myntra", "Apple", "Zomato"] }),
        ],
      },
    ],
  },
  {
    id: "recursion",
    title: "Recursion",
    description: "Solving problems by breaking them down into smaller, self-similar subproblems.",
    subtopics: [
      {
        id: "rec-linear-recursion",
        title: "Linear Recursion",
        description: "Solve problem by reducing to size n-1 -> combine results linearly.",
        problems: [
          gfgProblem({ id: "rc-li-1", title: "Factorial of a Number", difficulty: "Easy", companies: ["Microsoft"] }),
          gfgProblem({ id: "rc-li-2", title: "Fibonacci Number", difficulty: "Easy", slug: "fibonacci-number", companies: ["Amazon", "Adobe"] }),
          gfgProblem({ id: "rc-li-3", title: "Reverse String", difficulty: "Easy", slug: "reverse-string", companies: ["Google", "Apple"] }),
          gfgProblem({ id: "rc-li-4", title: "Power of X", difficulty: "Medium", slug: "powx-n", companies: ["Facebook", "LinkedIn"] }),
        ],
      },
      {
        id: "rec-divide-conquer",
        title: "Divide & Conquer",
        description: "Break problem into independent subproblems -> solve recursively -> combine results.",
        problems: [
          gfgProblem({ id: "rc-dc-1", title: "Binary Search", difficulty: "Easy", slug: "binary-search", companies: ["Amazon", "Google"] }),
          gfgProblem({ id: "rc-dc-2", title: "Merge Sort", difficulty: "Medium", companies: ["Microsoft", "Goldman Sachs"] }),
          gfgProblem({ id: "rc-dc-3", title: "Maximum Subarray", difficulty: "Medium", slug: "maximum-subarray", companies: ["Amazon", "Apple"] }),
          gfgProblem({ id: "rc-dc-4", title: "Search in Rotated Sorted Array", difficulty: "Medium", slug: "search-in-rotated-sorted-array", companies: ["Facebook", "Google"] }),
        ],
      },
      {
        id: "rec-string-processing",
        title: "Recursive String Processing",
        description: "Recursively process substrings or characters -> combine results.",
        problems: [
          gfgProblem({ id: "rc-sp-1", title: "Reverse String", difficulty: "Easy", slug: "reverse-string", companies: ["Amazon", "Microsoft"] }),
          gfgProblem({ id: "rc-sp-2", title: "Palindrome Check", difficulty: "Easy", companies: ["Google"] }),
          gfgProblem({ id: "rc-sp-3", title: "Decode String", difficulty: "Medium", slug: "decode-string", companies: ["Google", "Cisco"] }),
          gfgProblem({ id: "rc-sp-4", title: "Different Ways to Add Parentheses", difficulty: "Medium", slug: "different-ways-to-add-parentheses", companies: ["Amazon", "Kart"] }),
        ],
      },
      {
        id: "rec-stack-linked-list",
        title: "Recursive Stack / Linked List",
        description: "Handle top/head element recursively -> recurse on remaining stack/list -> combine/insert results.",
        problems: [
          gfgProblem({ id: "rc-sl-1", title: "Reverse a Linked List", difficulty: "Easy", slug: "reverse-linked-list", companies: ["Amazon", "Microsoft"] }),
          gfgProblem({ id: "rc-sl-2", title: "Merge Two Sorted Lists", difficulty: "Easy", slug: "merge-two-sorted-lists", companies: ["Amazon", "Apple"] }),
          gfgProblem({ id: "rc-sl-3", title: "Insert at Bottom of Stack", difficulty: "Medium", companies: ["Google", "Microsoft"] }),
        ],
      },
    ],
  },
  {
    id: "tree",
    title: "Tree",
    description: "Hierarchical data structure with a root value and subtrees of children.",
    subtopics: [
      {
        id: "tree-dfs-traversals",
        title: "DFS Traversals",
        description: "Standard DFS -> used for max depth, path sums, subtree calculations.",
        problems: [
          gfgProblem({ id: "tr-df-1", title: "Inorder Traversal", difficulty: "Easy", slug: "binary-tree-inorder-traversal", companies: ["Amazon", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "tr-df-2", title: "Preorder Traversal", difficulty: "Easy", slug: "binary-tree-preorder-traversal", companies: ["Flipkart", "Paytm", "Zomato"] }),
          gfgProblem({ id: "tr-df-3", title: "Postorder Traversal", difficulty: "Easy", slug: "binary-tree-postorder-traversal", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "tr-df-4", title: "Same Tree Check (DFS variant)", difficulty: "Easy", slug: "same-tree", companies: ["Amazon", "Microsoft"] }),
          gfgProblem({ id: "tr-df-5", title: "Diameter of Binary Tree", difficulty: "Easy", slug: "diameter-of-binary-tree", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "tr-df-6", title: "Maximum Depth of Binary Tree", difficulty: "Easy", slug: "maximum-depth-of-binary-tree", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "tr-df-7", title: "Path Sum", difficulty: "Easy", slug: "path-sum", companies: ["Flipkart", "PhonePe"] }),
          gfgProblem({ id: "tr-df-8", title: "Minimum Height of a Binary Tree", difficulty: "Easy", companies: ["Microsoft", "Flipkart"] }),
          gfgProblem({ id: "tr-df-9", title: "Check if Nodes are Cousins", difficulty: "Medium", slug: "cousins-in-binary-tree", companies: ["Amazon", "Google"] }),
          gfgProblem({ id: "tr-df-10", title: "Print All Nodes at Distance K", difficulty: "Medium", slug: "all-nodes-distance-k-in-binary-tree", companies: ["Amazon", "Google"] }),
          gfgProblem({ id: "tr-df-11", title: "Boundary Traversal of a Binary Tree", difficulty: "Medium", companies: ["Microsoft", "Amazon"] }),
          gfgProblem({ id: "tr-df-12", title: "Vertical Order Traversal", difficulty: "Medium", slug: "vertical-order-traversal-of-a-binary-tree", companies: ["Google", "Microsoft"] }),
          gfgProblem({ id: "tr-df-13", title: "Top View of a Binary Tree", difficulty: "Medium", companies: ["Microsoft", "Amazon"] }),
          gfgProblem({ id: "tr-df-14", title: "Binary Tree Maximum Path Sum", difficulty: "Hard", slug: "binary-tree-maximum-path-sum", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          lcProblem({ id: "tr-df-15", title: "Binary Tree Cameras", difficulty: "Hard", slug: "binary-tree-cameras", companies: ["Google", "Facebook"] }),
        ],
      },
      {
        id: "tree-bfs-level-order",
        title: "BFS / Level-Order",
        description: "Use queue -> traverse level by level -> calculate sums, averages, or side views.",
        problems: [
          gfgProblem({ id: "tr-bf-1", title: "Minimum Depth of Binary Tree", difficulty: "Easy", slug: "minimum-depth-of-binary-tree", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          lcProblem({ id: "tr-bf-2", title: "Average of Levels in Binary Tree", difficulty: "Easy", slug: "average-of-levels-in-binary-tree", companies: ["Amazon", "Microsoft", "PhonePe"] }),
          gfgProblem({ id: "tr-bf-3", title: "Binary Tree Level Order Traversal", difficulty: "Medium", slug: "binary-tree-level-order-traversal", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "tr-bf-4", title: "Binary Tree Zigzag Level Order Traversal", difficulty: "Medium", slug: "binary-tree-zigzag-level-order-traversal", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "tr-bf-5", title: "Binary Tree Right Side View", difficulty: "Medium", slug: "binary-tree-right-side-view", companies: ["Google", "Apple", "Zomato"] }),
        ],
      },
      {
        id: "tree-lca",
        title: "Lowest Common Ancestor",
        description: "DFS recursion or parent-pointer mapping -> find common ancestor efficiently.",
        problems: [
          gfgProblem({ id: "tr-lc-1", title: "Lowest Common Ancestor of Binary Tree", difficulty: "Medium", slug: "lowest-common-ancestor-of-a-binary-tree", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "tr-lc-2", title: "Find Distance Between Nodes", difficulty: "Medium", companies: ["Google", "Apple", "Zomato"] }),
          gfgProblem({ id: "tr-lc-3", title: "Distance Between Two Nodes in a Tree", difficulty: "Medium", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
        ],
      },
      {
        id: "tree-serialization-construction",
        title: "Serialization / Construction",
        description: "Preorder / level-order encode-decode -> reconstruct tree or flatten.",
        problems: [
          gfgProblem({ id: "tr-sc-1", title: "Invert Binary Tree", difficulty: "Easy", slug: "invert-binary-tree", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "tr-sc-2", title: "Flatten Binary Tree to Linked List", difficulty: "Medium", slug: "flatten-binary-tree-to-linked-list", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "tr-sc-3", title: "Populating Next Right Pointers", difficulty: "Medium", slug: "populating-next-right-pointers-in-each-node", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "tr-sc-4", title: "Construct Binary Tree from Preorder & Inorder", difficulty: "Medium", slug: "construct-binary-tree-from-preorder-and-inorder-traversal", companies: ["Amazon", "Microsoft", "Google"] }),
          gfgProblem({ id: "tr-sc-5", title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", slug: "serialize-and-deserialize-binary-tree", companies: ["Amazon", "Google", "Goldman Sachs"] }),
        ],
      },
    ],
  },
  {
    id: "binary-search-tree",
    title: "Binary Search Tree",
    description: "Tree data structure where left child < root < right child.",
    subtopics: [
      {
        id: "bst-operations",
        title: "BST Operations",
        description: "Leverage BST property (left < root < right) for search, insertion, deletion, and range queries.",
        problems: [
          gfgProblem({ id: "bs-op-1", title: "Convert Sorted Array to BST", difficulty: "Easy", slug: "convert-sorted-array-to-binary-search-tree", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "bs-op-2", title: "Search in a BST", difficulty: "Easy", slug: "search-in-a-binary-search-tree", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "bs-op-3", title: "Insert into a BST", difficulty: "Medium", slug: "insert-into-a-binary-search-tree", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "bs-op-4", title: "Validate Binary Search Tree", difficulty: "Medium", slug: "validate-binary-search-tree", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "bs-op-5", title: "Delete Node in a BST", difficulty: "Medium", slug: "delete-node-in-a-bst", companies: ["Google", "Apple", "Zomato"] }),
          gfgProblem({ id: "bs-op-6", title: "Recover BST", difficulty: "Medium", slug: "recover-binary-search-tree", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "bs-op-7", title: "Merge 2 BST", difficulty: "Medium", companies: ["Microsoft", "Facebook", "Amazon"] }),
          lcProblem({ id: "bs-op-8", title: "Maximum sum BST in binary Tree", difficulty: "Medium", slug: "maximum-sum-bst-in-binary-tree", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
        ],
      },
      {
        id: "bst-lca-range",
        title: "LCA & Range Queries",
        description: "Use BST property -> traverse from root to find split point -> LCA.",
        problems: [
          gfgProblem({ id: "bs-lr-1", title: "Closest Binary Search Tree Value", difficulty: "Easy", slug: "closest-binary-search-tree-value", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "bs-lr-2", title: "Lowest Common Ancestor of BST", difficulty: "Medium", slug: "lowest-common-ancestor-of-a-binary-search-tree", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "bs-lr-3", title: "Distance Between Two Nodes in BST", difficulty: "Medium", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "bs-lr-4", title: "Closest Leaf in BST", difficulty: "Medium", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
        ],
      },
    ],
  },
  {
    id: "graph",
    title: "Graph",
    description: "Non-linear data structure consisting of nodes and edges.",
    subtopics: [
      {
        id: "graph-bfs-unweighted",
        title: "BFS (Unweighted Path)",
        description: "Standard BFS -> track distance/levels -> queue-based traversal -> multi-source if needed.",
        problems: [
          gfgProblem({ id: "gr-bf-1", title: "01 Matrix", difficulty: "Medium", slug: "01-matrix", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "gr-bf-2", title: "Clone Graph", difficulty: "Medium", slug: "clone-graph", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "gr-bf-3", title: "Rotting Oranges", difficulty: "Medium", slug: "rotting-oranges", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "gr-bf-4", title: "Shortest Path in Binary Matrix", difficulty: "Medium", slug: "shortest-path-in-binary-matrix", companies: ["Google", "Apple", "Zomato"] }),
          gfgProblem({ id: "gr-bf-5", title: "Walls and Gates", difficulty: "Medium", companies: ["Amazon", "Microsoft", "PhonePe"] }),
          gfgProblem({ id: "gr-bf-6", title: "Word Ladder", difficulty: "Hard", slug: "word-ladder", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
        ],
      },
      {
        id: "graph-dfs-connectivity",
        title: "DFS (Connectivity)",
        description: "DFS recursion or stack -> track visited -> identify connected components or detect cycles.",
        problems: [
          gfgProblem({ id: "gr-df-1", title: "Flood Fill", difficulty: "Easy", slug: "flood-fill", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "gr-df-2", title: "Number of Islands", difficulty: "Medium", slug: "number-of-islands", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "gr-df-3", title: "All paths from source to target", difficulty: "Medium", slug: "all-paths-from-source-to-target", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "gr-df-4", title: "Find Eventual Safe States", difficulty: "Medium", slug: "find-eventual-safe-states", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "gr-df-5", title: "Count Components in Graph", difficulty: "Medium", companies: ["Google", "Apple", "Zomato"] }),
          gfgProblem({ id: "gr-df-6", title: "Surrounded Regions", difficulty: "Medium", slug: "surrounded-regions", companies: ["Amazon", "Microsoft", "PhonePe"] }),
          gfgProblem({ id: "gr-df-7", title: "Is Graph Bipartite", difficulty: "Medium", slug: "is-graph-bipartite", companies: ["Amazon", "Google", "Adobe"] }),
          gfgProblem({ id: "gr-df-8", title: "Directed Cycle Detection", difficulty: "Medium", companies: ["Amazon", "Microsoft", "Paytm"] }),
          gfgProblem({ id: "gr-df-9", title: "Undirected Cycle Detection", difficulty: "Medium", companies: ["Google", "Flipkart", "Ola"] }),
          gfgProblem({ id: "gr-df-10", title: "Longest Cycle in a Graph", difficulty: "Hard", slug: "longest-cycle-in-a-graph", companies: ["Amazon", "Microsoft"] }),
          gfgProblem({ id: "gr-df-11", title: "Articulation Points", difficulty: "Hard", companies: ["Amazon", "Google"] }),
          gfgProblem({ id: "gr-df-12", title: "Bridges in Graph / Critical Connections", difficulty: "Hard", slug: "critical-connections-in-a-network", companies: ["Amazon", "Facebook", "Google"] }),
        ],
      },
      {
        id: "graph-topological-sort",
        title: "Topological Sort",
        description: "DFS postorder or BFS (Kahn's algorithm) -> order nodes respecting dependencies.",
        problems: [
          gfgProblem({ id: "gr-to-1", title: "Task Scheduling with Dependencies", difficulty: "Medium", companies: ["Amazon", "Microsoft", "PhonePe"] }),
          gfgProblem({ id: "gr-to-2", title: "Course Schedule", difficulty: "Medium", slug: "course-schedule", companies: ["Amazon", "Google", "Facebook"] }),
          gfgProblem({ id: "gr-to-3", title: "Course Schedule II", difficulty: "Medium", slug: "course-schedule-ii", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "gr-to-4", title: "Find Eventual Safe States", difficulty: "Medium", slug: "find-eventual-safe-states", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "gr-to-5", title: "Cycle Detection in Directed Graph", difficulty: "Medium", companies: ["Amazon", "Microsoft", "Paytm"] }),
          gfgProblem({ id: "gr-to-6", title: "Alien Dictionary", difficulty: "Hard", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "gr-to-7", title: "Reconstruct Itinerary", difficulty: "Hard", slug: "reconstruct-itinerary", companies: ["Google", "Apple", "Zomato"] }),
        ],
      },
      {
        id: "graph-mst-union-find",
        title: "MST / Union-Find",
        description: "Use Kruskal's / Prim's algorithm or Union-Find -> find MST, minimum cost connections, or detect cycles.",
        problems: [
          gfgProblem({ id: "gr-mu-1", title: "Minimum spanning Tree", difficulty: "Medium", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "gr-mu-2", title: "Kruskal's algorithm", difficulty: "Medium", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "gr-mu-3", title: "Lexicographically Smallest Equivalent String", difficulty: "Medium", slug: "lexicographically-smallest-equivalent-string", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "gr-mu-4", title: "Number of Connected Components in Graph", difficulty: "Medium", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "gr-mu-5", title: "Redundant Connection", difficulty: "Medium", slug: "redundant-connection", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "gr-mu-6", title: "Connecting Cities With Minimum Cost", difficulty: "Medium", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "gr-mu-7", title: "Accounts Merge", difficulty: "Medium", slug: "accounts-merge", companies: ["Amazon", "Microsoft", "PhonePe"] }),
        ],
      },
      {
        id: "graph-dijkstra-weighted",
        title: "Dijkstra (Weighted)",
        description: "Use priority queue -> relax edges -> track shortest distances.",
        problems: [
          gfgProblem({ id: "gr-di-1", title: "Dijkstra Implementation", difficulty: "Medium", companies: ["Google", "Apple", "Zomato"] }),
          gfgProblem({ id: "gr-di-2", title: "Shortest Path in Weighted Graph", difficulty: "Medium", companies: ["Amazon", "Microsoft", "PhonePe"] }),
          gfgProblem({ id: "gr-di-3", title: "Minimum Cost Path in Grid", difficulty: "Medium", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "gr-di-4", title: "Network Delay Time", difficulty: "Medium", slug: "network-delay-time", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "gr-di-5", title: "Cheapest Flights Within K Stops", difficulty: "Medium", slug: "cheapest-flights-within-k-stops", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          lcProblem({ id: "gr-di-6", title: "Swim in Rising Water", difficulty: "Medium", slug: "swim-in-rising-water", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "gr-di-7", title: "Path With Minimum Effort", difficulty: "Medium", slug: "path-with-minimum-effort", companies: ["Flipkart", "Paytm", "PhonePe"] }),
        ],
      },
      {
        id: "graph-bellman-ford",
        title: "Bellman-Ford",
        description: "Relax all edges V-1 times -> detect negative cycles.",
        problems: [
          gfgProblem({ id: "gr-be-1", title: "Negative Weight Cycle Detection", difficulty: "Medium", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "gr-be-2", title: "Cheapest Flights Within K Stops (Bellman-Ford variant)", difficulty: "Medium", slug: "cheapest-flights-within-k-stops", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          lcProblem({ id: "gr-be-3", title: "Find the City With the Smallest Number of Neighbors at a Threshold Distance", difficulty: "Medium", slug: "find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
        ],
      },
      {
        id: "graph-floyd-warshall",
        title: "Floyd-Warshall",
        description: "DP over adjacency matrix -> shortest paths between all pairs of nodes.",
        problems: [
          gfgProblem({ id: "gr-fl-1", title: "Transitive Closure", difficulty: "Medium", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "gr-fl-2", title: "All-Pairs Shortest Path", difficulty: "Medium", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "gr-fl-3", title: "Detect Negative Cycle Using Floyd-Warshall", difficulty: "Medium", companies: ["Amazon", "Microsoft", "PhonePe"] }),
        ],
      },
    ],
  },
  {
    id: "backtracking",
    title: "Backtracking",
    description: "Algorithmic technique for solving problems recursively by trying to build a solution incrementally.",
    subtopics: [
      {
        id: "bk-choice-based",
        title: "Choice-Based Backtracking",
        description: "It is commonly used in problems that ask to generate all possible combinations, subsets, or permutations.",
        problems: [
          gfgProblem({ id: "bk-ch-1", title: "Subsets", difficulty: "Medium", slug: "subsets", companies: ["Google", "Amazon", "Microsoft"] }),
          gfgProblem({ id: "bk-ch-2", title: "Subsets II", difficulty: "Medium", slug: "subsets-ii", companies: ["Amazon", "Adobe"] }),
          gfgProblem({ id: "bk-ch-3", title: "Combination Sum", difficulty: "Medium", slug: "combination-sum", companies: ["Google", "Amazon", "Facebook"] }),
          gfgProblem({ id: "bk-ch-4", title: "Combination Sum II", difficulty: "Medium", slug: "combination-sum-ii", companies: ["Amazon", "Microsoft"] }),
          gfgProblem({ id: "bk-ch-5", title: "Permutations", difficulty: "Medium", slug: "permutations", companies: ["Google", "Uber"] }),
          gfgProblem({ id: "bk-ch-6", title: "Permutations II", difficulty: "Medium", slug: "permutations-ii", companies: ["Amazon", "Adobe"] }),
          gfgProblem({ id: "bk-ch-7", title: "Next Permutation", difficulty: "Medium", slug: "next-permutation", companies: ["Google", "Facebook"] }),
          gfgProblem({ id: "bk-ch-8", title: "Generate Parentheses", difficulty: "Medium", slug: "generate-parentheses", companies: ["Google", "Amazon", "Microsoft"] }),
          gfgProblem({ id: "bk-ch-9", title: "Palindrome Partitioning", difficulty: "Medium", slug: "palindrome-partitioning", companies: ["Google", "Apple"] }),
          gfgProblem({ id: "bk-ch-10", title: "Restore IP Addresses", difficulty: "Medium", slug: "restore-ip-addresses", companies: ["Amazon", "Microsoft"] }),
        ],
      },
      {
        id: "bk-constraint-based",
        title: "Constraint-Based Backtracking",
        description: "At each step, choose whether to include an element -> explore all subsets/choices recursively.",
        problems: [
          gfgProblem({ id: "bk-co-1", title: "Graph Coloring (M-Coloring Problem)", difficulty: "Medium", companies: ["Google", "Microsoft"] }),
          gfgProblem({ id: "bk-co-2", title: "Knight's Tour", difficulty: "Medium", companies: ["Amazon", "Microsoft"] }),
          gfgProblem({ id: "bk-co-3", title: "Partition to K Equal Sum Subsets", difficulty: "Medium", slug: "partition-to-k-equal-sum-subsets", companies: ["LinkedIn", "Google"] }),
          gfgProblem({ id: "bk-co-4", title: "N-Queens", difficulty: "Hard", slug: "n-queens", companies: ["Google", "Amazon", "Microsoft"] }),
          lcProblem({ id: "bk-co-5", title: "N-Queens II", difficulty: "Hard", slug: "n-queens-ii", companies: ["Google", "Amazon"] }),
        ],
      },
      {
        id: "bk-grid-path",
        title: "Grid / Path Backtracking",
        description: "Move in grid recursively -> explore all valid paths -> backtrack after each move.",
        problems: [
          gfgProblem({ id: "bk-gr-1", title: "Rat in a Maze", difficulty: "Medium", companies: ["Amazon", "Microsoft"] }),
          gfgProblem({ id: "bk-gr-2", title: "Path with Maximum Gold", difficulty: "Medium", slug: "path-with-maximum-gold", companies: ["Amazon", "Google"] }),
          gfgProblem({ id: "bk-gr-3", title: "Sudoku Solver", difficulty: "Hard", slug: "sudoku-solver", companies: ["Uber", "Google"] }),
          gfgProblem({ id: "bk-gr-4", title: "Word Search II", difficulty: "Hard", slug: "word-search-ii", companies: ["Microsoft", "Amazon"] }),
          lcProblem({ id: "bk-gr-5", title: "Unique Paths III", difficulty: "Hard", slug: "unique-paths-iii", companies: ["Google", "Apple"] }),
        ],
      },
      {
        id: "bk-decision-tree",
        title: "Decision Tree / Sequence Generation",
        description: "Generate sequences or strings recursively by making a choice at each step.",
        problems: [
          gfgProblem({ id: "bk-dt-1", title: "Letter Combinations of a Phone Number", difficulty: "Medium", slug: "letter-combinations-of-a-phone-number", companies: ["Google", "Amazon"] }),
          gfgProblem({ id: "bk-dt-2", title: "All possible Full binary Trees", difficulty: "Medium", slug: "all-possible-full-binary-trees", companies: ["Google", "Facebook", "Amazon"] }),
          gfgProblem({ id: "bk-dt-3", title: "Expression Add Operators", difficulty: "Hard", slug: "expression-add-operators", companies: ["Google", "Facebook"] }),
          gfgProblem({ id: "bk-dt-4", title: "Word Break 2", difficulty: "Hard", slug: "word-break-ii", companies: ["Google", "Facebook", "Amazon"] }),
        ],
      },
    ],
  },
  {
    id: "greedy",
    title: "Greedy",
    description: "Algorithm paradigm that follows the problem solving heuristic of making the locally optimal choice.",
    subtopics: [
      {
        id: "greedy-intervals-reach",
        title: "Intervals & Reach",
        description: "Sort intervals or extend reach as far as possible from current position -> maximize tasks done / minimize steps.",
        problems: [
          gfgProblem({ id: "gd-ir-1", title: "Activity Selection Problem", difficulty: "Easy", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "gd-ir-2", title: "Merge Intervals", difficulty: "Medium", slug: "merge-intervals", companies: ["Amazon", "PhonePe", "Goldman Sachs"] }),
          gfgProblem({ id: "gd-ir-3", title: "Insert Interval", difficulty: "Medium", slug: "insert-interval", companies: ["Amazon", "Adobe", "Goldman Sachs"] }),
          gfgProblem({ id: "gd-ir-4", title: "Non-overlapping Intervals", difficulty: "Medium", slug: "non-overlapping-intervals", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "gd-ir-5", title: "Meeting Rooms II", difficulty: "Medium", slug: "meeting-rooms-ii", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "gd-ir-6", title: "Minimum Number of Arrows to Burst Balloons", difficulty: "Medium", slug: "minimum-number-of-arrows-to-burst-balloons", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "gd-ir-7", title: "Jump Game", difficulty: "Medium", slug: "jump-game", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "gd-ir-8", title: "Jump Game II", difficulty: "Medium", slug: "jump-game-ii", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          lcProblem({ id: "gd-ir-9", title: "Car Pooling / Capacity to Transport", difficulty: "Medium", slug: "car-pooling", companies: ["Amazon", "Microsoft", "PhonePe"] }),
          gfgProblem({ id: "gd-ir-10", title: "Minimum Number of Taps to Open to Water Garden", difficulty: "Hard", slug: "minimum-number-of-taps-to-open-to-water-a-garden", companies: ["Google", "Apple", "Zomato"] }),
        ],
      },
      {
        id: "greedy-sorting-local-choice",
        title: "Sorting / Local Choice",
        description: "Sort array or select elements -> make locally optimal choice -> achieve global optimum.",
        problems: [
          lcProblem({ id: "gd-sl-1", title: "Maximum Units on a Truck", difficulty: "Easy", slug: "maximum-units-on-a-truck", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "gd-sl-2", title: "Largest Number", difficulty: "Medium", slug: "largest-number", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "gd-sl-3", title: "Fractional Knapsack", difficulty: "Medium", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "gd-sl-4", title: "Partition Labels", difficulty: "Medium", slug: "partition-labels", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "gd-sl-5", title: "Minimum Cost to Connect Sticks", difficulty: "Medium", slug: "minimum-cost-to-connect-sticks", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "gd-sl-6", title: "Task Scheduler (frequency-based greedy)", difficulty: "Medium", slug: "task-scheduler", companies: ["Amazon", "Microsoft", "PhonePe"] }),
          gfgProblem({ id: "gd-sl-7", title: "Minimum Platforms / Resource Allocation", difficulty: "Medium", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "gd-sl-8", title: "Candy Distribution", difficulty: "Hard", slug: "candy", companies: ["Google", "Apple", "Zomato"] }),
        ],
      },
    ],
  },
  {
    id: "dynamic-programming",
    title: "Dynamic Programming",
    description: "Optimization method involving breaking down problems into simpler subproblems and storing their solutions.",
    subtopics: [
      {
        id: "dp-1d-linear",
        title: "1D / Linear DP",
        description: "Track optimal solution using a 1D array -> sequences, sums, or counts.",
        problems: [
          gfgProblem({ id: "dp-1d-1", title: "Climbing Stairs", difficulty: "Easy", slug: "climbing-stairs", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "dp-1d-2", title: "House Robber", difficulty: "Medium", slug: "house-robber", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "dp-1d-3", title: "Maximum Subarray", difficulty: "Medium", slug: "maximum-subarray", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "dp-1d-4", title: "Maximum Product Subarray", difficulty: "Medium", slug: "maximum-product-subarray", companies: ["Google", "Apple", "Zomato"] }),
          gfgProblem({ id: "dp-1d-5", title: "Decode Ways", difficulty: "Medium", slug: "decode-ways", companies: ["Amazon", "Microsoft", "PhonePe"] }),
        ],
      },
      {
        id: "dp-2d-grid",
        title: "2D / Grid DP",
        description: "Use 2D array -> track states for row/column -> movement or path constraints.",
        problems: [
          gfgProblem({ id: "dp-2d-1", title: "Running Sum 2D Array", difficulty: "Easy", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "dp-2d-2", title: "Unique Paths", difficulty: "Medium", slug: "unique-paths", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "dp-2d-3", title: "Unique Paths 2", difficulty: "Medium", slug: "unique-paths-ii", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "dp-2d-4", title: "Minimum Path Sum", difficulty: "Medium", slug: "minimum-path-sum", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "dp-2d-5", title: "Maximum Path Sum in Grid", difficulty: "Medium", companies: ["Google", "Apple", "Zomato"] }),
          gfgProblem({ id: "dp-2d-6", title: "Minimum Falling Path Sum", difficulty: "Medium", slug: "minimum-falling-path-sum", companies: ["Amazon", "Microsoft", "PhonePe"] }),
          gfgProblem({ id: "dp-2d-7", title: "Dungeon Game", difficulty: "Hard", slug: "dungeon-game", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "dp-2d-8", title: "Cherry Pickup", difficulty: "Hard", slug: "cherry-pickup", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
        ],
      },
      {
        id: "dp-strings",
        title: "DP on Strings",
        description: "Use 2D DP -> index i,j represent substrings/subsequences -> solve LCS, palindrome, or edit distance.",
        problems: [
          gfgProblem({ id: "dp-st-1", title: "Longest Common Subsequence", difficulty: "Medium", slug: "longest-common-subsequence", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "dp-st-2", title: "Longest Palindromic Subsequence", difficulty: "Medium", slug: "longest-palindromic-subsequence", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "dp-st-3", title: "Minimum Insertions to Make String Palindrome", difficulty: "Medium", slug: "minimum-insertion-steps-to-make-a-string-palindrome", companies: ["Amazon", "Microsoft", "Google"] }),
          gfgProblem({ id: "dp-st-4", title: "Minimum Number of Insertions and Deletions", difficulty: "Medium", companies: ["Amazon", "Adobe", "Flipkart"] }),
          gfgProblem({ id: "dp-st-5", title: "Edit Distance", difficulty: "Medium", slug: "edit-distance", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "dp-st-6", title: "Shortest Common Supersequence", difficulty: "Medium", slug: "shortest-common-supersequence", companies: ["Google", "Facebook", "Microsoft"] }),
          gfgProblem({ id: "dp-st-7", title: "Regular Expression Matching", difficulty: "Hard", slug: "regular-expression-matching", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "dp-st-8", title: "Distinct Subsequences", difficulty: "Hard", slug: "distinct-subsequences", companies: ["Google", "Apple", "Zomato"] }),
          gfgProblem({ id: "dp-st-9", title: "Palindrome Partitioning II", difficulty: "Hard", slug: "palindrome-partitioning-ii", companies: ["Amazon", "Microsoft", "PhonePe"] }),
          gfgProblem({ id: "dp-st-10", title: "Scramble String", difficulty: "Hard", slug: "scramble-string", companies: ["Amazon", "Google", "Microsoft"] }),
        ],
      },
      {
        id: "dp-intervals",
        title: "DP on Intervals",
        description: "Track optimal solutions for subarrays/intervals -> matrix chain, merging, or balloon burst patterns.",
        problems: [
          gfgProblem({ id: "dp-in-1", title: "Matrix Chain Multiplication (MCM)", difficulty: "Medium", companies: ["Microsoft", "Amazon", "Goldman Sachs"] }),
          gfgProblem({ id: "dp-in-2", title: "Merge Intervals with Cost", difficulty: "Medium", companies: ["Amazon", "Microsoft", "PhonePe"] }),
          gfgProblem({ id: "dp-in-3", title: "Burst Balloons", difficulty: "Hard", slug: "burst-balloons", companies: ["Google", "Flipkart", "PhonePe"] }),
          gfgProblem({ id: "dp-in-4", title: "Minimum Cost to Merge Stones", difficulty: "Hard", slug: "minimum-cost-to-merge-stones", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "dp-in-5", title: "Min cost to cut a stick", difficulty: "Hard", slug: "minimum-cost-to-cut-a-stick", companies: ["Google", "Apple", "Zomato"] }),
          gfgProblem({ id: "dp-in-6", title: "Evaluate Expression to True (Boolean Parenthesization)", difficulty: "Hard", companies: ["Flipkart", "Paytm", "PhonePe"] }),
        ],
      },
      {
        id: "dp-trees-dags",
        title: "DP on Trees / DAGs",
        description: "Recursion + memoization -> track states along tree paths -> post-order traversal.",
        problems: [
          gfgProblem({ id: "dp-td-1", title: "Diameter of Binary Tree", difficulty: "Medium", slug: "diameter-of-binary-tree", companies: ["Google", "Apple", "Zomato"] }),
          gfgProblem({ id: "dp-td-2", title: "House Robber III", difficulty: "Medium", slug: "house-robber-iii", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "dp-td-3", title: "Path Sum III", difficulty: "Medium", slug: "path-sum-iii", companies: ["Amazon", "Microsoft", "PhonePe"] }),
          gfgProblem({ id: "dp-td-4", title: "Binary Tree Maximum Path Sum", difficulty: "Hard", slug: "binary-tree-maximum-path-sum", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "dp-td-5", title: "Maximum Sum BST in Binary Tree", difficulty: "Hard", slug: "maximum-sum-bst-in-binary-tree", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "dp-td-6", title: "Binary Tree Cameras", difficulty: "Hard", slug: "binary-tree-cameras", companies: ["Google", "Amazon", "Microsoft"] }),
        ],
      },
      {
        id: "dp-knapsack-subset",
        title: "Knapsack / Subset Sum",
        description: "Track states based on weight/value -> classic 0-1 / bounded / unbounded variants.",
        problems: [
          gfgProblem({ id: "dp-kn-1", title: "0-1 Knapsack", difficulty: "Medium", companies: ["Amazon", "Google", "Goldman Sachs"] }),
          gfgProblem({ id: "dp-kn-2", title: "Partition Equal Subset Sum", difficulty: "Medium", slug: "partition-equal-subset-sum", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "dp-kn-3", title: "Partition with given difference", difficulty: "Medium", companies: ["Microsoft", "Facebook", "Morgan Stanley"] }),
          gfgProblem({ id: "dp-kn-4", title: "Coin Change", difficulty: "Medium", slug: "coin-change", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "dp-kn-5", title: "Coin Change II", difficulty: "Medium", slug: "coin-change-ii", companies: ["Flipkart", "Paytm", "PhonePe"] }),
          gfgProblem({ id: "dp-kn-6", title: "Target Sum", difficulty: "Medium", slug: "target-sum", companies: ["Amazon", "Adobe", "Sumo Logic"] }),
          gfgProblem({ id: "dp-kn-7", title: "Subset Sum", difficulty: "Medium", companies: ["Google", "Apple", "Zomato"] }),
          gfgProblem({ id: "dp-kn-8", title: "Combination Sum IV", difficulty: "Medium", slug: "combination-sum-iv", companies: ["Amazon", "Microsoft", "PhonePe"] }),
        ],
      },
    ],
  },
  {
    id: "trie",
    title: "Trie",
    description: "Tree-based data structure used for efficiently storing and retrieving keys in a dataset of strings.",
    subtopics: [
      {
        id: "trie-basic-operations",
        title: "Basic Trie Operations",
        description: "Build Trie -> insert words -> search full word or prefix efficiently -> collect suggestions in lexicographic order.",
        problems: [
          gfgProblem({ id: "tr-bo-1", title: "Implement Trie (Prefix Tree)", difficulty: "Medium", slug: "implement-trie-prefix-tree", companies: ["Amazon", "Google", "Microsoft"] }),
          gfgProblem({ id: "tr-bo-2", title: "Add and Search Word", difficulty: "Medium", slug: "design-add-and-search-words-data-structure", companies: ["Flipkart", "PhonePe", "Zomato"] }),
          gfgProblem({ id: "tr-bo-3", title: "Longest common prefix", difficulty: "Medium", slug: "longest-common-prefix", companies: ["Flipkart", "PhonePe", "Zomato"] }),
          gfgProblem({ id: "tr-bo-4", title: "Longest word in dictionary", difficulty: "Medium", slug: "longest-word-in-dictionary", companies: ["Flipkart", "PhonePe", "Zomato"] }),
          gfgProblem({ id: "tr-bo-5", title: "Search Suggestions System", difficulty: "Medium", slug: "search-suggestions-system", companies: ["Amazon", "Microsoft", "Google"] }),
        ],
      },
      {
        id: "trie-word-break-segmentation",
        title: "Word Break / Segmentation",
        description: "Use Trie for fast lookup -> combine with DP or backtracking for word segmentation and concatenation.",
        problems: [
          gfgProblem({ id: "tr-wb-1", title: "Word Break", difficulty: "Medium", slug: "word-break", companies: ["Amazon", "Google", "Microsoft"] }),
          gfgProblem({ id: "tr-wb-2", title: "Replace Words", difficulty: "Medium", slug: "replace-words", companies: ["Goldman Sachs", "Apple", "Adobe"] }),
          gfgProblem({ id: "tr-wb-3", title: "Word Break 2", difficulty: "Hard", slug: "word-break-ii", companies: ["Amazon", "Google", "Microsoft"] }),
          gfgProblem({ id: "tr-wb-4", title: "Concatenated Words", difficulty: "Hard", slug: "concatenated-words", companies: ["Flipkart", "PhonePe", "Zomato"] }),
        ],
      },
      {
        id: "trie-bitwise-xor",
        title: "Bitwise Trie / XOR",
        description: "Use Trie for binary representation of numbers -> efficiently find maximum/minimum XOR or subset XOR.",
        problems: [
          gfgProblem({ id: "tr-xr-1", title: "Maximum XOR of Two Numbers in Array", difficulty: "Medium", slug: "maximum-xor-of-two-numbers-in-an-array", companies: ["Google", "Amazon", "Microsoft"] }),
          gfgProblem({ id: "tr-xr-2", title: "Bit Manipulation / Subset XOR Problems", difficulty: "Medium", companies: ["Amazon", "Apple", "Zomato"] }),
          gfgProblem({ id: "tr-xr-3", title: "Maximum XOR With an Element From Array", difficulty: "Hard", slug: "maximum-xor-with-an-element-from-array", companies: ["Flipkart", "PhonePe", "Paytm"] }),
        ],
      },
    ],
  },
  {
    id: "bit-manipulation",
    title: "Bit Manipulation",
    description: "Techniques that perform operations on data at the bit level.",
    subtopics: [
      {
        id: "bit-basic-operations",
        title: "Basic Bit Operations",
        description: "Use XOR / AND / OR / shift operations -> detect single/missing numbers or count bits efficiently.",
        problems: [
          gfgProblem({ id: "bt-ba-1", title: "Missing Number", difficulty: "Easy", slug: "missing-number", companies: ["Goldman Sachs", "Apple", "Adobe"] }),
          gfgProblem({ id: "bt-ba-2", title: "Number of 1 Bits / Hamming Weight", difficulty: "Easy", slug: "number-of-1-bits", companies: ["Amazon", "Sumo Logic", "Paytm"] }),
          gfgProblem({ id: "bt-ba-3", title: "Alternating Bits", difficulty: "Easy", slug: "binary-number-with-alternating-bits", companies: ["Amazon", "PayPal", "Paytm"] }),
          gfgProblem({ id: "bt-ba-4", title: "Check kth bit is set or not", difficulty: "Easy", companies: ["Amazon", "Google", "Microsoft"] }),
          gfgProblem({ id: "bt-ba-5", title: "Power of Two", difficulty: "Easy", slug: "power-of-two", companies: ["Amazon", "Google", "Microsoft"] }),
          gfgProblem({ id: "bt-ba-6", title: "Single Number", difficulty: "Easy", slug: "single-number", companies: ["Amazon", "Google", "Microsoft"] }),
          gfgProblem({ id: "bt-ba-7", title: "Unique Numbers 2", difficulty: "Medium", companies: ["Amazon", "Google", "Microsoft"] }),
          lcProblem({ id: "bt-ba-8", title: "Single Number II", difficulty: "Medium", slug: "single-number-ii", companies: ["Flipkart", "PhonePe", "Zomato"] }),
          lcProblem({ id: "bt-ba-9", title: "Single Number III", difficulty: "Medium", slug: "single-number-iii", companies: ["Amazon", "Google", "Microsoft"] }),
        ],
      },
      {
        id: "bit-subsets-bitmask",
        title: "Subsets / Bitmask",
        description: "Iterate through all subsets using bits -> solve combinatorial or DP counting problems.",
        problems: [
          gfgProblem({ id: "bt-sb-1", title: "Subsets", difficulty: "Medium", slug: "subsets", companies: ["Amazon", "Google", "Microsoft"] }),
          gfgProblem({ id: "bt-sb-2", title: "Subsets II", difficulty: "Medium", slug: "subsets-ii", companies: ["Flipkart", "PhonePe", "Zomato"] }),
          gfgProblem({ id: "bt-sb-3", title: "Partition to K Equal Sum Subsets", difficulty: "Medium", slug: "partition-to-k-equal-sum-subsets", companies: ["Goldman Sachs", "Adobe", "Apple"] }),
        ],
      },
      {
        id: "bit-advanced-xor",
        title: "Advanced XOR",
        description: "Use XOR properties -> maximize/minimize XOR over array/subarray or ranges.",
        problems: [
          gfgProblem({ id: "bt-ax-1", title: "Sum of Subset XOR Totals", difficulty: "Easy", slug: "sum-of-all-subset-xor-totals", companies: ["Facebook", "Apple", "Adobe"] }),
          gfgProblem({ id: "bt-ax-2", title: "Maximum XOR of Two Numbers in Array", difficulty: "Medium", slug: "maximum-xor-of-two-numbers-in-an-array", companies: ["Google", "Amazon", "Microsoft"] }),
          gfgProblem({ id: "bt-ax-3", title: "Subarray XOR Queries / K-th XOR", difficulty: "Medium", companies: ["Amazon", "Google", "Microsoft"] }),
          gfgProblem({ id: "bt-ax-4", title: "Maximum XOR With an Element From Array", difficulty: "Hard", slug: "maximum-xor-with-an-element-from-array", companies: ["Flipkart", "PhonePe", "Paytm"] }),
        ],
      },
    ],
  },
];