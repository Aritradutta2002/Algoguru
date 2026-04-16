import { ContentSection } from "../recursionContent";

export const greedyEasy: ContentSection[] = [
  { id: "greedy-easy-1", title: "Best Time to Buy and Sell Stock", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Given daily prices, find the maximum profit from one buy and one sell.", "**Example:** `Input: prices = [7, 1, 5, 3, 6, 4]` → `Output: 5`.", "**Approach:** Track minimum price seen so far. At each day, compute `profit = price - minPrice`."],
    keyPoints: ["Single pass greedy — track min price and max profit simultaneously"],
    code: [{ title: "Best Time to Buy & Sell Stock", language: "java", content: `public class BuySellStock {
    public static int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE, maxProfit = 0;
        for (int price : prices) { minPrice = Math.min(minPrice, price); maxProfit = Math.max(maxProfit, price - minPrice); }
        return maxProfit;
    }
    public static void main(String[] args) { System.out.println(maxProfit(new int[]{7,1,5,3,6,4})); } // 5
}` }],
  },
  { id: "greedy-easy-2", title: "Sort Colors (Dutch National Flag)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Sort an array of 0s, 1s, and 2s in-place in one pass.", "**Example:** `Input: nums = [2, 0, 2, 1, 1, 0]` → `Output: [0, 0, 1, 1, 2, 2]`.", "**Approach:** Three pointers: lo, mid, hi."],
    keyPoints: ["Three-pointer partitioning solves it in a single pass"],
    code: [{ title: "Sort Colors — Dutch National Flag", language: "java", content: `public class SortColors {
    public static void sortColors(int[] nums) {
        int lo = 0, mid = 0, hi = nums.length - 1;
        while (mid <= hi) {
            if (nums[mid] == 0) swap(nums, lo++, mid++);
            else if (nums[mid] == 1) mid++;
            else swap(nums, mid, hi--);
        }
    }
    static void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }
    public static void main(String[] args) {
        int[] nums = {2, 0, 2, 1, 1, 0}; sortColors(nums);
        System.out.println(java.util.Arrays.toString(nums)); // [0, 0, 1, 1, 2, 2]
    }
}` }],
  },
  { id: "greedy-easy-3", title: "Assign Cookies (LC 455)", difficulty: "Easy", timeComplexity: "O(n log n)", spaceComplexity: "O(1)",
    theory: ["Each child has a greed factor, each cookie has a size. A child is content if cookie size ≥ greed factor. Maximize content children.", "**Example:** `Input: g = [1,2,3], s = [1,1]` → `Output: 1`.", "**Approach:** Sort both arrays. Greedily assign the smallest sufficient cookie to each child."],
    keyPoints: ["Sort + greedy two-pointer — classic assignment problem"],
    code: [{ title: "Assign Cookies — Greedy", language: "java", content: `import java.util.*;

public class AssignCookies {
    public static int findContentChildren(int[] g, int[] s) {
        Arrays.sort(g); Arrays.sort(s);
        int child = 0, cookie = 0;
        while (child < g.length && cookie < s.length) {
            if (s[cookie] >= g[child]) child++;
            cookie++;
        }
        return child;
    }

    public static void main(String[] args) {
        System.out.println(findContentChildren(new int[]{1,2,3}, new int[]{1,1})); // 1
        System.out.println(findContentChildren(new int[]{1,2}, new int[]{1,2,3})); // 2
    }
}` }],
  },
  { id: "greedy-easy-4", title: "Lemonade Change (LC 860)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Customers pay $5, $10, or $20 for lemonade costing $5. Can you give correct change to everyone?", "**Example:** `Input: bills = [5,5,5,10,20]` → `Output: true`.", "**Approach:** Track counts of $5 and $10 bills. Greedily give larger bills as change first."],
    keyPoints: ["For $20 change: prefer $10+$5 over $5+$5+$5 to preserve flexibility"],
    code: [{ title: "Lemonade Change — Greedy", language: "java", content: `public class LemonadeChange {
    public static boolean lemonadeChange(int[] bills) {
        int fives = 0, tens = 0;
        for (int bill : bills) {
            if (bill == 5) fives++;
            else if (bill == 10) { if (fives == 0) return false; fives--; tens++; }
            else { // $20
                if (tens > 0 && fives > 0) { tens--; fives--; }
                else if (fives >= 3) fives -= 3;
                else return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(lemonadeChange(new int[]{5,5,5,10,20})); // true
        System.out.println(lemonadeChange(new int[]{5,5,10,10,20})); // false
    }
}` }],
  },
  { id: "greedy-easy-5", title: "Maximum Units on a Truck (LC 1710)", difficulty: "Easy", timeComplexity: "O(n log n)", spaceComplexity: "O(1)",
    theory: ["Given box types `[numberOfBoxes, unitsPerBox]` and truck size, maximize units loaded.", "**Example:** `Input: boxTypes = [[1,3],[2,2],[3,1]], truckSize = 4` → `Output: 8` — 1×3 + 2×2 + 1×1.", "**Approach:** Sort by units per box descending. Greedily take boxes with most units first."],
    keyPoints: ["Classic fractional knapsack pattern — sort by value density"],
    code: [{ title: "Maximum Units on Truck — Greedy", language: "java", content: `import java.util.*;

public class MaxUnits {
    public static int maximumUnits(int[][] boxTypes, int truckSize) {
        Arrays.sort(boxTypes, (a, b) -> b[1] - a[1]);
        int total = 0;
        for (int[] box : boxTypes) {
            int take = Math.min(box[0], truckSize);
            total += take * box[1];
            truckSize -= take;
            if (truckSize == 0) break;
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(maximumUnits(new int[][]{{1,3},{2,2},{3,1}}, 4)); // 8
    }
}` }],
  },
  { id: "greedy-easy-6", title: "Partition Labels (LC 763)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Partition string into maximum parts such that each letter appears in at most one part. Return sizes.", "**Example:** `Input: s = \"ababcbacadefegdehijhklij\"` → `Output: [9,7,8]`.", "**Approach:** First pass: record last occurrence of each character. Second pass: extend partition until current index = max last occurrence in partition."],
    keyPoints: ["Two-pass: last occurrence map + greedy partition extension"],
    code: [{ title: "Partition Labels — Greedy", language: "java", content: `import java.util.*;

public class PartitionLabels {
    public static List<Integer> partitionLabels(String s) {
        int[] last = new int[26];
        for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;
        List<Integer> result = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']);
            if (i == end) { result.add(end - start + 1); start = end + 1; }
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(partitionLabels("ababcbacadefegdehijhklij")); // [9, 7, 8]
    }
}` }],
  },
  { id: "greedy-easy-7", title: "Non-overlapping Intervals (LC 435)", difficulty: "Easy", timeComplexity: "O(n log n)", spaceComplexity: "O(1)",
    theory: ["Given intervals, find the minimum number of intervals to remove to make the rest non-overlapping.", "**Example:** `Input: intervals = [[1,2],[2,3],[3,4],[1,3]]` → `Output: 1` — Remove [1,3].", "**Approach:** Sort by end time. Greedily keep intervals that don't overlap with the previous kept one."],
    keyPoints: ["Equivalent to: find maximum non-overlapping intervals, then subtract from total"],
    code: [{ title: "Non-overlapping Intervals — Greedy", language: "java", content: `import java.util.*;

public class NonOverlapping {
    public static int eraseOverlapIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[1] - b[1]);
        int kept = 1, end = intervals[0][1];
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] >= end) { kept++; end = intervals[i][1]; }
        }
        return intervals.length - kept;
    }

    public static void main(String[] args) {
        System.out.println(eraseOverlapIntervals(new int[][]{{1,2},{2,3},{3,4},{1,3}})); // 1
    }
}` }],
  },
  { id: "greedy-easy-8", title: "Gas Station (LC 134)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Given `gas[i]` and `cost[i]` for circular stations, find the starting station to complete the circuit, or -1.", "**Example:** `Input: gas = [1,2,3,4,5], cost = [3,4,5,1,2]` → `Output: 3`.", "**Approach:** If total gas ≥ total cost, a solution exists. Track tank; if it goes negative, restart from next station."],
    keyPoints: ["If total surplus ≥ 0, a unique solution exists — greedy restart finds it"],
    code: [{ title: "Gas Station — Greedy", language: "java", content: `public class GasStation {
    public static int canCompleteCircuit(int[] gas, int[] cost) {
        int totalSurplus = 0, tank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            int surplus = gas[i] - cost[i];
            totalSurplus += surplus;
            tank += surplus;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return totalSurplus >= 0 ? start : -1;
    }

    public static void main(String[] args) {
        System.out.println(canCompleteCircuit(new int[]{1,2,3,4,5}, new int[]{3,4,5,1,2})); // 3
    }
}` }],
  },
];

export const greedyMedium: ContentSection[] = [
  { id: "greedy-medium-1", title: "Jump Game", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Given an array where each element represents max jump length, determine if you can reach the last index.", "**Example:** `Input: nums = [2, 3, 1, 1, 4]` → `Output: true`.", "**Approach:** Track farthest reachable index."],
    keyPoints: ["If `i > farthest` at any point → unreachable"],
    code: [{ title: "Jump Game — Greedy", language: "java", content: `public class JumpGame {
    public static boolean canJump(int[] nums) {
        int farthest = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > farthest) return false;
            farthest = Math.max(farthest, i + nums[i]);
        }
        return true;
    }
    public static void main(String[] args) { System.out.println(canJump(new int[]{2,3,1,1,4})); } // true
}` }],
  },
  { id: "greedy-medium-2", title: "Meeting Rooms II", difficulty: "Medium", timeComplexity: "O(n log n)", spaceComplexity: "O(n)",
    theory: ["Given meeting time intervals, find the minimum number of conference rooms required.", "**Example:** `Input: intervals = [[0,30],[5,10],[15,20]]` → `Output: 2`.", "**Approach:** Sort start and end times separately. Two-pointer comparison."],
    keyPoints: ["Sorting starts and ends separately simplifies the two-pointer approach"],
    code: [{ title: "Meeting Rooms II — Two Pointer", language: "java", content: `import java.util.*;

public class MeetingRooms {
    public static int minMeetingRooms(int[][] intervals) {
        int n = intervals.length;
        int[] starts = new int[n], ends = new int[n];
        for (int i = 0; i < n; i++) { starts[i] = intervals[i][0]; ends[i] = intervals[i][1]; }
        Arrays.sort(starts); Arrays.sort(ends);
        int rooms = 0, endPtr = 0;
        for (int start : starts) { if (start < ends[endPtr]) rooms++; else endPtr++; }
        return rooms;
    }
    public static void main(String[] args) {
        System.out.println(minMeetingRooms(new int[][]{{0,30},{5,10},{15,20}})); // 2
    }
}` }],
  },
  { id: "greedy-medium-3", title: "Task Scheduler", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Given tasks with a cooldown period `n`, find minimum time to execute all tasks.", "**Example:** `Input: tasks = [\"A\",\"A\",\"A\",\"B\",\"B\",\"B\"], n = 2` → `Output: 8`.", "**Approach:** The most frequent task determines the frame."],
    keyPoints: ["Formula: `(maxFreq - 1) * (n + 1) + maxCount`"],
    code: [{ title: "Task Scheduler", language: "java", content: `public class TaskScheduler {
    public static int leastInterval(char[] tasks, int n) {
        int[] freq = new int[26];
        for (char t : tasks) freq[t - 'A']++;
        int maxFreq = 0, maxCount = 0;
        for (int f : freq) maxFreq = Math.max(maxFreq, f);
        for (int f : freq) if (f == maxFreq) maxCount++;
        int result = (maxFreq - 1) * (n + 1) + maxCount;
        return Math.max(tasks.length, result);
    }
    public static void main(String[] args) {
        System.out.println(leastInterval(new char[]{'A','A','A','B','B','B'}, 2)); // 8
    }
}` }],
  },
  { id: "greedy-medium-4", title: "Reorganize String (LC 767)", difficulty: "Medium", timeComplexity: "O(n log n)", spaceComplexity: "O(n)",
    theory: ["Given a string `s`, rearrange so no two adjacent characters are the same. Return empty if impossible.", "**Example:** `Input: s = \"aab\"` → `Output: \"aba\"`.", "**Approach:** Max-heap by frequency. Always place the most frequent character, then swap with the next most frequent."],
    keyPoints: ["If maxFreq > (n+1)/2, impossible. Otherwise, heap-based interleaving works"],
    code: [{ title: "Reorganize String — Max Heap", language: "java", content: `import java.util.*;

public class ReorganizeString {
    public static String reorganizeString(String s) {
        int[] freq = new int[26];
        for (char c : s.toCharArray()) freq[c - 'a']++;
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> b[1] - a[1]);
        for (int i = 0; i < 26; i++)
            if (freq[i] > 0) pq.offer(new int[]{i, freq[i]});
        StringBuilder sb = new StringBuilder();
        while (pq.size() >= 2) {
            int[] first = pq.poll(), second = pq.poll();
            sb.append((char)('a' + first[0]));
            sb.append((char)('a' + second[0]));
            if (--first[1] > 0) pq.offer(first);
            if (--second[1] > 0) pq.offer(second);
        }
        if (!pq.isEmpty()) {
            int[] last = pq.poll();
            if (last[1] > 1) return "";
            sb.append((char)('a' + last[0]));
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(reorganizeString("aab"));  // "aba"
        System.out.println(reorganizeString("aaab")); // ""
    }
}` }],
  },
  { id: "greedy-medium-5", title: "Movie Festival (CSES)", difficulty: "Medium", timeComplexity: "O(n log n)", spaceComplexity: "O(1)",
    theory: ["Given n movies with start and end times, find the maximum number of movies you can watch (no overlaps).", "**Example:** Classic activity selection / interval scheduling problem.", "**Approach:** Sort by end time. Greedily select movies whose start time ≥ end time of last selected."],
    keyPoints: ["Interval scheduling maximization — sort by end time"],
    code: [{ title: "Movie Festival — CSES", language: "java", content: `import java.util.*;

public class MovieFestival {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] movies = new int[n][2];
        for (int i = 0; i < n; i++) { movies[i][0] = sc.nextInt(); movies[i][1] = sc.nextInt(); }
        Arrays.sort(movies, (a, b) -> a[1] - b[1]);
        int count = 0, lastEnd = 0;
        for (int[] movie : movies) {
            if (movie[0] >= lastEnd) { count++; lastEnd = movie[1]; }
        }
        System.out.println(count);
    }
}` }],
  },
  { id: "greedy-medium-6", title: "Jump Game II (LC 45)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Given an array where each element is the max jump length, find minimum jumps to reach the last index.", "**Example:** `Input: nums = [2,3,1,1,4]` → `Output: 2` — Jump 1→2 (index 0→1), then 3 steps to end.", "**Approach:** BFS-like greedy. Track the farthest reachable and the current jump boundary."],
    keyPoints: ["When reaching the boundary, increment jumps and extend boundary to farthest"],
    code: [{ title: "Jump Game II — Greedy BFS", language: "java", content: `public class JumpGameII {
    public static int jump(int[] nums) {
        int jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            if (i == curEnd) { jumps++; curEnd = farthest; }
        }
        return jumps;
    }

    public static void main(String[] args) {
        System.out.println(jump(new int[]{2,3,1,1,4})); // 2
    }
}` }],
  },
  { id: "greedy-medium-7", title: "Minimum Platforms (LC/GFG)", difficulty: "Medium", timeComplexity: "O(n log n)", spaceComplexity: "O(1)",
    theory: ["Given arrival and departure times of trains, find minimum platforms needed so no train waits.", "**Example:** `Input: arr=[900,940,950,1100,1500,1800], dep=[910,1200,1120,1130,1900,2000]` → `Output: 3`.", "**Approach:** Sort arrivals and departures. Two-pointer: if next event is arrival, add platform; if departure, remove."],
    keyPoints: ["Same as Meeting Rooms II — count maximum overlaps"],
    code: [{ title: "Minimum Platforms", language: "java", content: `import java.util.*;

public class MinPlatforms {
    public static int findPlatform(int[] arr, int[] dep) {
        Arrays.sort(arr); Arrays.sort(dep);
        int platforms = 0, maxPlatforms = 0, i = 0, j = 0;
        while (i < arr.length) {
            if (arr[i] <= dep[j]) { platforms++; maxPlatforms = Math.max(maxPlatforms, platforms); i++; }
            else { platforms--; j++; }
        }
        return maxPlatforms;
    }

    public static void main(String[] args) {
        System.out.println(findPlatform(
            new int[]{900,940,950,1100,1500,1800},
            new int[]{910,1200,1120,1130,1900,2000})); // 3
    }
}` }],
  },
  { id: "greedy-medium-8", title: "Boats to Save People (LC 881)", difficulty: "Medium", timeComplexity: "O(n log n)", spaceComplexity: "O(1)",
    theory: ["Each boat carries at most 2 people with weight limit. Find minimum boats.", "**Example:** `Input: people = [3,5,3,4], limit = 5` → `Output: 4`.", "**Approach:** Sort. Two pointers: try to pair heaviest with lightest. If they fit, move both pointers; otherwise, heaviest person gets a boat alone."],
    keyPoints: ["Greedy two-pointer pairing minimizes boats"],
    code: [{ title: "Boats to Save People — Greedy", language: "java", content: `import java.util.*;

public class BoatsToSave {
    public static int numRescueBoats(int[] people, int limit) {
        Arrays.sort(people);
        int boats = 0, lo = 0, hi = people.length - 1;
        while (lo <= hi) {
            if (people[lo] + people[hi] <= limit) lo++;
            hi--;
            boats++;
        }
        return boats;
    }

    public static void main(String[] args) {
        System.out.println(numRescueBoats(new int[]{3,5,3,4}, 5)); // 4
        System.out.println(numRescueBoats(new int[]{1,2}, 3));     // 1
    }
}` }],
  },
];

export const greedyHard: ContentSection[] = [
  { id: "greedy-hard-1", title: "Candy", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Give minimum candies: each child ≥1, higher rating than neighbor → more candies.", "**Example:** `Input: ratings = [1, 0, 2]` → `Output: 5`.", "**Approach:** Two passes: left-to-right and right-to-left."],
    keyPoints: ["Two-pass greedy ensures both neighbor constraints are satisfied"],
    code: [{ title: "Candy — Two-Pass Greedy", language: "java", content: `public class Candy {
    public static int candy(int[] ratings) {
        int n = ratings.length; int[] candies = new int[n];
        java.util.Arrays.fill(candies, 1);
        for (int i = 1; i < n; i++) if (ratings[i] > ratings[i-1]) candies[i] = candies[i-1] + 1;
        for (int i = n - 2; i >= 0; i--) if (ratings[i] > ratings[i+1]) candies[i] = Math.max(candies[i], candies[i+1] + 1);
        int total = 0; for (int c : candies) total += c; return total;
    }
    public static void main(String[] args) { System.out.println(candy(new int[]{1, 0, 2})); } // 5
}` }],
  },
  { id: "greedy-hard-2", title: "IPO (Initial Public Offering)", difficulty: "Hard", timeComplexity: "O(n log n)", spaceComplexity: "O(n)",
    theory: ["Maximize capital after completing k projects.", "**Example:** `Input: k=2, w=0, profits=[1,2,3], capital=[0,1,1]` → `Output: 4`.", "**Approach:** Two heaps: min-heap for capital, max-heap for profits."],
    keyPoints: ["Two-heap pattern: min-heap to unlock, max-heap to select"],
    code: [{ title: "IPO — Two Heaps Greedy", language: "java", content: `import java.util.*;

public class IPO {
    public static int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {
        int n = profits.length;
        PriorityQueue<int[]> minCap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        for (int i = 0; i < n; i++) minCap.offer(new int[]{capital[i], profits[i]});
        PriorityQueue<Integer> maxProfit = new PriorityQueue<>(Collections.reverseOrder());
        for (int i = 0; i < k; i++) {
            while (!minCap.isEmpty() && minCap.peek()[0] <= w) maxProfit.offer(minCap.poll()[1]);
            if (maxProfit.isEmpty()) break;
            w += maxProfit.poll();
        }
        return w;
    }
    public static void main(String[] args) {
        System.out.println(findMaximizedCapital(2, 0, new int[]{1,2,3}, new int[]{0,1,1})); // 4
    }
}` }],
  },
  { id: "greedy-hard-3", title: "Job Scheduling (LC 1235)", difficulty: "Hard", timeComplexity: "O(n log n)", spaceComplexity: "O(n)",
    theory: ["Given jobs with start, end times and profits, find maximum profit without overlapping jobs.", "**Example:** `Input: start=[1,2,3,3], end=[3,4,5,6], profit=[50,10,40,70]` → `Output: 120` — Jobs 1 and 4.", "**Approach:** Sort by end time. DP + binary search. For each job, either skip it or take it + best non-overlapping previous."],
    keyPoints: ["Binary search to find the latest non-overlapping job — O(n log n)"],
    code: [{ title: "Job Scheduling — DP + Binary Search", language: "java", content: `import java.util.*;

public class JobScheduling {
    public static int jobScheduling(int[] startTime, int[] endTime, int[] profit) {
        int n = startTime.length;
        int[][] jobs = new int[n][3];
        for (int i = 0; i < n; i++) jobs[i] = new int[]{startTime[i], endTime[i], profit[i]};
        Arrays.sort(jobs, (a, b) -> a[1] - b[1]);
        int[] dp = new int[n];
        dp[0] = jobs[0][2];
        for (int i = 1; i < n; i++) {
            int include = jobs[i][2];
            int lo = 0, hi = i - 1, last = -1;
            while (lo <= hi) {
                int mid = (lo + hi) / 2;
                if (jobs[mid][1] <= jobs[i][0]) { last = mid; lo = mid + 1; }
                else hi = mid - 1;
            }
            if (last != -1) include += dp[last];
            dp[i] = Math.max(dp[i - 1], include);
        }
        return dp[n - 1];
    }

    public static void main(String[] args) {
        System.out.println(jobScheduling(new int[]{1,2,3,3}, new int[]{3,4,5,6}, new int[]{50,10,40,70})); // 120
    }
}` }],
  },
  { id: "greedy-hard-4", title: "Course Schedule III (LC 630)", difficulty: "Hard", timeComplexity: "O(n log n)", spaceComplexity: "O(n)",
    theory: ["Given courses with durations and deadlines, find maximum number of courses you can take.", "**Example:** `Input: courses = [[100,200],[200,1300],[1000,1250],[2000,3200]]` → `Output: 3`.", "**Approach:** Sort by deadline. Greedily take courses. If total time exceeds deadline, drop the longest course (max-heap)."],
    keyPoints: ["Max-heap to drop the longest course when deadline is violated"],
    code: [{ title: "Course Schedule III — Greedy + Heap", language: "java", content: `import java.util.*;

public class CourseScheduleIII {
    public static int scheduleCourse(int[][] courses) {
        Arrays.sort(courses, (a, b) -> a[1] - b[1]);
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        int totalTime = 0;
        for (int[] course : courses) {
            totalTime += course[0];
            maxHeap.offer(course[0]);
            if (totalTime > course[1]) totalTime -= maxHeap.poll();
        }
        return maxHeap.size();
    }

    public static void main(String[] args) {
        System.out.println(scheduleCourse(new int[][]{{100,200},{200,1300},{1000,1250},{2000,3200}})); // 3
    }
}` }],
  },
  { id: "greedy-hard-5", title: "Minimum Cost to Hire K Workers (LC 857)", difficulty: "Hard", timeComplexity: "O(n log n)", spaceComplexity: "O(n)",
    theory: ["Hire exactly `k` workers. Each worker has quality and minimum wage expectation. Pay proportional to quality within a group. Minimize total cost.", "**Example:** `Input: quality = [10,20,5], wage = [70,50,30], k = 2` → `Output: 105.0`.", "**Approach:** Sort by wage/quality ratio. For each worker as the rate-setter, use a max-heap to keep k smallest qualities."],
    keyPoints: ["Sort by wage-to-quality ratio — the highest ratio worker sets the pay rate for the group"],
    code: [{ title: "Minimum Cost to Hire K Workers", language: "java", content: `import java.util.*;

public class HireWorkers {
    public static double mincostToHireWorkers(int[] quality, int[] wage, int k) {
        int n = quality.length;
        int[][] workers = new int[n][2];
        for (int i = 0; i < n; i++) workers[i] = new int[]{quality[i], wage[i]};
        Arrays.sort(workers, (a, b) -> Double.compare((double)a[1]/a[0], (double)b[1]/b[0]));
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        double minCost = Double.MAX_VALUE;
        int qualitySum = 0;
        for (int[] w : workers) {
            maxHeap.offer(w[0]);
            qualitySum += w[0];
            if (maxHeap.size() > k) qualitySum -= maxHeap.poll();
            if (maxHeap.size() == k)
                minCost = Math.min(minCost, qualitySum * (double) w[1] / w[0]);
        }
        return minCost;
    }

    public static void main(String[] args) {
        System.out.println(mincostToHireWorkers(new int[]{10,20,5}, new int[]{70,50,30}, 2)); // 105.0
    }
}` }],
  },
  { id: "greedy-hard-6", title: "Movie Festival II (CSES)", difficulty: "Hard", timeComplexity: "O(n log n)", spaceComplexity: "O(n)",
    theory: ["Given n movies and k club members, each movie has start and end time. Find max total movies watched by all members.", "**Example:** With k members, greedily assign movies to members with multiset tracking.", "**Approach:** Sort by end time. Use a TreeMap/multiset to track when each member becomes free. For each movie, assign to a free member."],
    keyPoints: ["Multiset of 'free times' + greedy assignment — classic extension of interval scheduling"],
    code: [{ title: "Movie Festival II — CSES", language: "java", content: `import java.util.*;

public class MovieFestivalII {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), k = sc.nextInt();
        int[][] movies = new int[n][2];
        for (int i = 0; i < n; i++) { movies[i][0] = sc.nextInt(); movies[i][1] = sc.nextInt(); }
        Arrays.sort(movies, (a, b) -> a[1] != b[1] ? a[1] - b[1] : a[0] - b[0]);

        TreeMap<Integer, Integer> free = new TreeMap<>();
        free.put(0, k); // all k members free at time 0
        int count = 0;

        for (int[] movie : movies) {
            Integer key = free.floorKey(movie[0]);
            if (key != null) {
                count++;
                // Remove one member from 'free at time key'
                if (free.get(key) == 1) free.remove(key);
                else free.merge(key, -1, Integer::sum);
                // Add member back as 'free at movie end time'
                free.merge(movie[1], 1, Integer::sum);
            }
        }
        System.out.println(count);
    }
}` }],
  },
  { id: "greedy-hard-7", title: "Minimum Number of Refueling Stops (LC 871)", difficulty: "Hard", timeComplexity: "O(n log n)", spaceComplexity: "O(n)",
    theory: ["A car starts with `startFuel` and can refuel at gas stations. Find minimum stops to reach target, or -1.", "**Example:** `Input: target=100, startFuel=10, stations=[[10,60],[20,30],[30,30],[60,40]]` → `Output: 2`.", "**Approach:** Max-heap. Drive as far as possible. When stuck, refuel from the station with the most fuel (already passed)."],
    keyPoints: ["Lazy refueling: don't decide until you run out, then pick the best past station"],
    code: [{ title: "Min Refueling Stops — Max Heap", language: "java", content: `import java.util.*;

public class MinRefuelStops {
    public static int minRefuelStops(int target, int startFuel, int[][] stations) {
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        int fuel = startFuel, stops = 0, prev = 0;
        for (int[] station : stations) {
            fuel -= (station[0] - prev);
            while (fuel < 0 && !maxHeap.isEmpty()) { fuel += maxHeap.poll(); stops++; }
            if (fuel < 0) return -1;
            maxHeap.offer(station[1]);
            prev = station[0];
        }
        fuel -= (target - prev);
        while (fuel < 0 && !maxHeap.isEmpty()) { fuel += maxHeap.poll(); stops++; }
        return fuel < 0 ? -1 : stops;
    }

    public static void main(String[] args) {
        System.out.println(minRefuelStops(100, 10, new int[][]{{10,60},{20,30},{30,30},{60,40}})); // 2
    }
}` }],
  },
  { id: "greedy-hard-8", title: "Smallest Range Covering K Lists (LC 632)", difficulty: "Hard", timeComplexity: "O(n log k)", spaceComplexity: "O(k)",
    theory: ["Given k sorted lists, find the smallest range that includes at least one number from each list.", "**Example:** `Input: nums = [[4,10,15,24,26],[0,9,12,20],[5,18,22,30]]` → `Output: [20,24]`.", "**Approach:** Min-heap with one element from each list. Track global max. Pop min, update range if smaller, push next from same list."],
    keyPoints: ["Min-heap + tracking max gives the current range at each step"],
    code: [{ title: "Smallest Range — Min Heap", language: "java", content: `import java.util.*;

public class SmallestRange {
    public static int[] smallestRange(List<List<Integer>> nums) {
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]); // val, listIdx, elemIdx
        int curMax = Integer.MIN_VALUE;
        for (int i = 0; i < nums.size(); i++) {
            pq.offer(new int[]{nums.get(i).get(0), i, 0});
            curMax = Math.max(curMax, nums.get(i).get(0));
        }
        int[] best = {pq.peek()[0], curMax};
        while (true) {
            int[] min = pq.poll();
            if (curMax - min[0] < best[1] - best[0]) best = new int[]{min[0], curMax};
            if (min[2] + 1 == nums.get(min[1]).size()) break;
            int nextVal = nums.get(min[1]).get(min[2] + 1);
            curMax = Math.max(curMax, nextVal);
            pq.offer(new int[]{nextVal, min[1], min[2] + 1});
        }
        return best;
    }

    public static void main(String[] args) {
        List<List<Integer>> nums = List.of(List.of(4,10,15,24,26), List.of(0,9,12,20), List.of(5,18,22,30));
        System.out.println(Arrays.toString(smallestRange(nums))); // [20, 24]
    }
}` }],
  },
];
