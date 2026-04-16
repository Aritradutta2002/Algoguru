import { ContentSection } from "./recursionContent";

export const backtrackingContent: ContentSection[] = [
  {
    id: "bt-intro",
    title: "Backtracking Fundamentals",
    difficulty: "Medium",
    theory: [
      "Backtracking is an algorithmic technique that considers searching every possible combination to solve a computational problem. It builds candidates incrementally and abandons a candidate ('backtracks') as soon as it determines the candidate cannot lead to a valid solution.",
      "Think of backtracking as a depth-first search on a decision tree. At each node, you make a choice. If the choice leads to a dead end, you undo it and try the next option.",
      "The three key operations: Choose (make a decision), Explore (recurse deeper), Unchoose (undo the decision — this is the 'backtrack'). This choose-explore-unchoose pattern is the template for ALL backtracking problems.",
      "Pruning is what separates backtracking from brute force: we actively cut off branches of the search tree that cannot possibly yield a valid solution, dramatically reducing the search space.",
      "Time complexity is typically exponential (O(n!), O(2^n)), but pruning makes backtracking practical for many constraint satisfaction problems.",
    ],
    keyPoints: [
      "The backtracking template: for each choice → make choice → recurse → undo choice",
      "Always define what makes a 'valid' partial solution (constraint checking)",
      "Pruning: check constraints BEFORE recursing, not after",
      "State restoration: whatever you change during 'choose', revert during 'unchoose'",
      "Backtracking = DFS + constraint checking + state restoration",
    ],
    code: [
      {
        title: "Universal Backtracking Template",
        language: "java",
        content: `import java.util.*;

public class BacktrackingTemplate {
    
    /**
     * UNIVERSAL BACKTRACKING TEMPLATE
     * 
     * void backtrack(State state, Parameters params) {
     *     if (isGoal(state)) {
     *         recordSolution(state);
     *         return;
     *     }
     *     
     *     for (Choice choice : getChoices(state)) {
     *         if (isValid(state, choice)) {    // PRUNE invalid choices early
     *             makeChoice(state, choice);    // CHOOSE
     *             backtrack(state, params);     // EXPLORE
     *             undoChoice(state, choice);    // UNCHOOSE (backtrack)
     *         }
     *     }
     * }
     */
    
    // EXAMPLE: Find all combinations that sum to target
    // Classic "combination sum" problem
    
    public static List<List<Integer>> combinationSum(int[] candidates, int target) {
        Arrays.sort(candidates); // Sort for efficient pruning
        List<List<Integer>> result = new ArrayList<>();
        backtrack(candidates, target, 0, new ArrayList<>(), result);
        return result;
    }
    
    private static void backtrack(int[] candidates, int remaining,
                                   int start, List<Integer> current,
                                   List<List<Integer>> result) {
        // GOAL: remaining sum = 0
        if (remaining == 0) {
            result.add(new ArrayList<>(current)); // Snapshot the solution
            return;
        }
        
        for (int i = start; i < candidates.length; i++) {
            // PRUNE: remaining candidates can only be >= current, so if
            // candidates[i] > remaining, no point continuing (array is sorted)
            if (candidates[i] > remaining) break;
            
            // CHOOSE: add candidates[i] to current combination
            current.add(candidates[i]);
            
            // EXPLORE: allow reuse of same element (i, not i+1)
            backtrack(candidates, remaining - candidates[i], i, current, result);
            
            // UNCHOOSE: remove last element (backtrack!)
            current.remove(current.size() - 1);
        }
    }
    
    public static void main(String[] args) {
        int[] candidates = {2, 3, 6, 7};
        int target = 7;
        List<List<Integer>> result = combinationSum(candidates, target);
        System.out.println("Combinations summing to " + target + ":");
        result.forEach(System.out::println);
        // Output: [2,2,3], [7]
    }
}`,
      },
    ],
    note: "The most common backtracking bug: forgetting to restore state after recursion. Always ensure the state is identical before and after each backtracking call.",
  },
  {
    id: "bt-nqueens",
    title: "N-Queens Problem",
    difficulty: "Hard",
    timeComplexity: "O(n!) — but pruning makes it much faster in practice",
    spaceComplexity: "O(n) for queen positions array",
    theory: [
      "Place N queens on an N×N chessboard such that no two queens attack each other. Queens attack in same row, same column, or same diagonal.",
      "Key insight: since no two queens can share a row, place exactly one queen per row. The decision at each row: which column to place the queen in?",
      "Three constraints to check: (1) No queen in same column, (2) No queen on same main diagonal (row-col is constant), (3) No queen on same anti-diagonal (row+col is constant).",
      "Using bit manipulation with bitmasks, we can check all three constraints in O(1) and find valid positions extremely fast.",
    ],
    code: [
      {
        title: "N-Queens — Multiple Implementations",
        language: "java",
        content: `import java.util.*;

public class NQueens {
    
    // ==================== SOLUTION 1: Basic with 2D board ====================
    
    public static List<List<String>> solveNQueens(int n) {
        List<List<String>> solutions = new ArrayList<>();
        char[][] board = new char[n][n];
        for (char[] row : board) Arrays.fill(row, '.');
        
        solveRow(board, 0, n, solutions);
        return solutions;
    }
    
    private static void solveRow(char[][] board, int row, int n,
                                  List<List<String>> solutions) {
        if (row == n) {
            // All queens placed — record solution
            List<String> solution = new ArrayList<>();
            for (char[] r : board) solution.add(new String(r));
            solutions.add(solution);
            return;
        }
        
        for (int col = 0; col < n; col++) {
            if (isSafe(board, row, col, n)) {
                board[row][col] = 'Q';           // CHOOSE: place queen
                solveRow(board, row + 1, n, solutions); // EXPLORE
                board[row][col] = '.';           // UNCHOOSE: remove queen
            }
        }
    }
    
    private static boolean isSafe(char[][] board, int row, int col, int n) {
        // Check column (rows above current)
        for (int r = 0; r < row; r++)
            if (board[r][col] == 'Q') return false;
        
        // Check upper-left diagonal
        for (int r = row-1, c = col-1; r >= 0 && c >= 0; r--, c--)
            if (board[r][c] == 'Q') return false;
        
        // Check upper-right diagonal
        for (int r = row-1, c = col+1; r >= 0 && c < n; r--, c++)
            if (board[r][c] == 'Q') return false;
        
        return true;
    }
    
    // ==================== SOLUTION 2: Optimized with Sets — O(1) checks ====================
    
    static Set<Integer> cols, diag1, diag2;  // diag1: row-col, diag2: row+col
    static int[] queens;  // queens[row] = col
    static int totalSolutions;
    
    public static int countQueens(int n) {
        cols = new HashSet<>();
        diag1 = new HashSet<>();
        diag2 = new HashSet<>();
        queens = new int[n];
        totalSolutions = 0;
        solveOptimized(0, n);
        return totalSolutions;
    }
    
    private static void solveOptimized(int row, int n) {
        if (row == n) { totalSolutions++; return; }
        
        for (int col = 0; col < n; col++) {
            if (cols.contains(col) || diag1.contains(row - col)
                    || diag2.contains(row + col)) continue; // Pruning
            
            // Choose
            cols.add(col);
            diag1.add(row - col);
            diag2.add(row + col);
            queens[row] = col;
            
            // Explore
            solveOptimized(row + 1, n);
            
            // Unchoose
            cols.remove(col);
            diag1.remove(row - col);
            diag2.remove(row + col);
        }
    }
    
    // ==================== SOLUTION 3: Bitmask — fastest ====================
    // Uses bit manipulation for O(1) constraint checking
    
    public static int nQueensBitmask(int n) {
        return solve(n, 0, 0, 0, 0);
    }
    
    private static int solve(int n, int row, int colMask, int diag1Mask, int diag2Mask) {
        if (row == n) return 1;
        
        int fullMask = (1 << n) - 1;  // n ones: all columns available
        // Available columns: not blocked by any constraint
        int available = fullMask & ~(colMask | diag1Mask | diag2Mask);
        
        int count = 0;
        while (available != 0) {
            int bit = available & (-available); // Lowest set bit (rightmost queen position)
            available &= available - 1;          // Clear that bit
            
            // Recurse: shift diagonals appropriately for next row
            count += solve(n, row + 1,
                colMask | bit,
                (diag1Mask | bit) >> 1,  // Left diagonal shifts right going down
                (diag2Mask | bit) << 1); // Right diagonal shifts left going down
        }
        return count;
    }
    
    public static void main(String[] args) {
        // Print solutions for n=4
        System.out.println("=== N=4 Solutions ===");
        List<List<String>> solutions = solveNQueens(4);
        for (List<String> sol : solutions) {
            sol.forEach(System.out::println);
            System.out.println();
        }
        
        System.out.println("=== Solution Counts ===");
        for (int n = 1; n <= 12; n++) {
            System.out.printf("N=%-2d → %d solutions (bitmask)%n", n, nQueensBitmask(n));
        }
        /* N=1→1, N=4→2, N=8→92, N=12→14200 */
    }
}`,
      },
    ],
  },
  {
    id: "bt-sudoku",
    title: "Sudoku Solver",
    difficulty: "Hard",
    timeComplexity: "O(9^(n*n)) worst case, but pruning makes it near-instant",
    spaceComplexity: "O(n²) for the board",
    theory: [
      "Fill a 9×9 Sudoku grid so that each row, column, and 3×3 box contains digits 1-9 exactly once.",
      "Strategy: find an empty cell, try placing digits 1-9, check validity (no conflict in row/col/box), recurse. If no digit works, backtrack.",
      "Optimization: use boolean arrays for rows, columns, and boxes to check validity in O(1) instead of scanning the board.",
      "Advanced: use 'Most Constrained Variable' heuristic — always solve the cell with the fewest possibilities first. This dramatically reduces backtracking.",
    ],
    code: [
      {
        title: "Sudoku Solver — Optimized Backtracking",
        language: "java",
        content: `public class SudokuSolver {
    
    // Track which numbers are used in each row, column, and 3×3 box
    private boolean[][] rowUsed = new boolean[9][10];  // rowUsed[row][num]
    private boolean[][] colUsed = new boolean[9][10];  // colUsed[col][num]
    private boolean[][] boxUsed = new boolean[9][10];  // boxUsed[boxId][num]
    
    public boolean solveSudoku(char[][] board) {
        // Initialize constraint arrays from existing numbers
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                if (board[r][c] != '.') {
                    int num = board[r][c] - '0';
                    int boxId = (r / 3) * 3 + (c / 3);
                    rowUsed[r][num] = true;
                    colUsed[c][num] = true;
                    boxUsed[boxId][num] = true;
                }
            }
        }
        return backtrack(board, 0, 0);
    }
    
    private boolean backtrack(char[][] board, int row, int col) {
        // Move to next row if current row is done
        if (col == 9) { row++; col = 0; }
        // All rows done — solution found!
        if (row == 9) return true;
        
        // Skip cells that already have a number
        if (board[row][col] != '.') {
            return backtrack(board, row, col + 1);
        }
        
        int boxId = (row / 3) * 3 + (col / 3);
        
        // Try placing digits 1-9
        for (int num = 1; num <= 9; num++) {
            // Check if num is valid in current cell (O(1) lookup!)
            if (rowUsed[row][num] || colUsed[col][num] || boxUsed[boxId][num])
                continue;
            
            // CHOOSE: place num
            board[row][col] = (char) ('0' + num);
            rowUsed[row][num] = true;
            colUsed[col][num] = true;
            boxUsed[boxId][num] = true;
            
            // EXPLORE: try to solve next cell
            if (backtrack(board, row, col + 1)) return true;
            
            // UNCHOOSE: backtrack
            board[row][col] = '.';
            rowUsed[row][num] = false;
            colUsed[col][num] = false;
            boxUsed[boxId][num] = false;
        }
        
        return false; // No valid digit found — need to backtrack further
    }
    
    // ==================== ADVANCED: Naked Singles + Backtracking ====================
    // Find cell with minimum possibilities — reduces search space dramatically
    
    public int[] findMostConstrained(char[][] board) {
        int[] best = {-1, -1, 10}; // {row, col, numPossibilities}
        
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                if (board[r][c] != '.') continue;
                
                int boxId = (r / 3) * 3 + (c / 3);
                int count = 0;
                for (int num = 1; num <= 9; num++) {
                    if (!rowUsed[r][num] && !colUsed[c][num] && !boxUsed[boxId][num])
                        count++;
                }
                if (count < best[2]) {
                    best[0] = r; best[1] = c; best[2] = count;
                }
                if (count == 1) return best; // Can't do better than 1
            }
        }
        return best;
    }
    
    // Helper: print board
    public static void printBoard(char[][] board) {
        for (int r = 0; r < 9; r++) {
            if (r % 3 == 0 && r != 0) System.out.println("------+-------+------");
            for (int c = 0; c < 9; c++) {
                if (c % 3 == 0 && c != 0) System.out.print(" | ");
                System.out.print(board[r][c] + " ");
            }
            System.out.println();
        }
    }
    
    public static void main(String[] args) {
        char[][] board = {
            {'5','3','.','.','7','.','.','.','.'},
            {'6','.','.','1','9','5','.','.','.'},
            {'.','9','8','.','.','.','.','6','.'},
            {'8','.','.','.','6','.','.','.','3'},
            {'4','.','.','8','.','3','.','.','1'},
            {'7','.','.','.','2','.','.','.','6'},
            {'.','6','.','.','.','.','2','8','.'},
            {'.','.','.','4','1','9','.','.','5'},
            {'.','.','.','.','8','.','.','7','9'}
        };
        
        System.out.println("=== Unsolved Sudoku ===");
        printBoard(board);
        
        SudokuSolver solver = new SudokuSolver();
        solver.solveSudoku(board);
        
        System.out.println("\\n=== Solved Sudoku ===");
        printBoard(board);
    }
}`,
      },
    ],
  },
  {
    id: "bt-subsets",
    title: "Subsets & Permutations",
    difficulty: "Medium",
    timeComplexity: "Subsets: O(2^n × n) | Permutations: O(n! × n)",
    spaceComplexity: "O(n) recursion depth",
    theory: [
      "Subsets (Power Set): For each element, decide include or exclude. This binary choice gives 2^n subsets total for n elements.",
      "Permutations: Arrange all n elements in every possible order. There are n! permutations. Build one position at a time, choosing from remaining unused elements.",
      "Combinations: Choose r elements from n without regard to order. C(n,r) = n!/(r!×(n-r)!) combinations.",
      "Handling duplicates: Sort the array first. During iteration, skip elements that are equal to the previous one at the same recursion level (when prev was not used).",
    ],
    code: [
      {
        title: "Complete Subsets, Permutations & Combinations",
        language: "java",
        content: `import java.util.*;

public class SubsetsPerms {
    
    // ==================== SUBSETS ====================
    
    // Method 1: Recursive backtracking
    public static List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        result.add(new ArrayList<>()); // Empty set is always a subset
        
        for (int num : nums) {
            int size = result.size();
            for (int i = 0; i < size; i++) {
                List<Integer> newSubset = new ArrayList<>(result.get(i));
                newSubset.add(num);
                result.add(newSubset);
            }
        }
        return result;
    }
    
    // Method 2: Bitmask — elegant for small n (n <= 20)
    public static List<List<Integer>> subsetsBitmask(int[] nums) {
        int n = nums.length;
        List<List<Integer>> result = new ArrayList<>();
        
        for (int mask = 0; mask < (1 << n); mask++) {
            List<Integer> subset = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                if ((mask >> i & 1) == 1) subset.add(nums[i]);
            }
            result.add(subset);
        }
        return result;
    }
    
    // Subsets with DUPLICATES — sort + skip duplicates
    public static List<List<Integer>> subsetsWithDup(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        backtrackSubsets(nums, 0, new ArrayList<>(), result);
        return result;
    }
    
    private static void backtrackSubsets(int[] nums, int start,
                                          List<Integer> curr, List<List<Integer>> result) {
        result.add(new ArrayList<>(curr));
        for (int i = start; i < nums.length; i++) {
            // Skip duplicate elements at same level
            if (i > start && nums[i] == nums[i-1]) continue;
            curr.add(nums[i]);
            backtrackSubsets(nums, i + 1, curr, result);
            curr.remove(curr.size() - 1);
        }
    }
    
    // ==================== PERMUTATIONS ====================
    
    // Unique elements
    public static List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrackPerms(nums, new boolean[nums.length], new ArrayList<>(), result);
        return result;
    }
    
    private static void backtrackPerms(int[] nums, boolean[] used,
                                        List<Integer> curr, List<List<Integer>> result) {
        if (curr.size() == nums.length) {
            result.add(new ArrayList<>(curr));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            curr.add(nums[i]);
            backtrackPerms(nums, used, curr, result);
            curr.remove(curr.size() - 1);
            used[i] = false;
        }
    }
    
    // Permutations with DUPLICATES
    public static List<List<Integer>> permuteUnique(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        backtrackPermsUnique(nums, new boolean[nums.length], new ArrayList<>(), result);
        return result;
    }
    
    private static void backtrackPermsUnique(int[] nums, boolean[] used,
                                              List<Integer> curr, List<List<Integer>> result) {
        if (curr.size() == nums.length) {
            result.add(new ArrayList<>(curr));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            // Skip: same value AND previous identical was NOT used in current perm
            // This ensures we pick the "first" copy of a duplicate first
            if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue;
            
            used[i] = true;
            curr.add(nums[i]);
            backtrackPermsUnique(nums, used, curr, result);
            curr.remove(curr.size() - 1);
            used[i] = false;
        }
    }
    
    // ==================== COMBINATIONS ====================
    
    // Choose r elements from 1..n
    public static List<List<Integer>> combine(int n, int r) {
        List<List<Integer>> result = new ArrayList<>();
        backtrackCombine(n, r, 1, new ArrayList<>(), result);
        return result;
    }
    
    private static void backtrackCombine(int n, int r, int start,
                                          List<Integer> curr, List<List<Integer>> result) {
        if (curr.size() == r) {
            result.add(new ArrayList<>(curr));
            return;
        }
        // Pruning: need (r - curr.size()) more elements, max available = n - start + 1
        // So start can go at most up to: n - (r - curr.size()) + 1
        int upperBound = n - (r - curr.size()) + 1;
        for (int i = start; i <= upperBound; i++) {
            curr.add(i);
            backtrackCombine(n, r, i + 1, curr, result);
            curr.remove(curr.size() - 1);
        }
    }
    
    public static void main(String[] args) {
        System.out.println("Subsets of {1,2,3}: " + subsets(new int[]{1,2,3}));
        System.out.println("Perms of {1,2,3}:   " + permute(new int[]{1,2,3}));
        System.out.println("C(4,2) combinations: " + combine(4, 2));
        System.out.println("Subsets with dup {1,2,2}: " + subsetsWithDup(new int[]{1,2,2}));
    }
}`,
      },
    ],
  },
  {
    id: "bt-maze",
    title: "Rat in a Maze",
    difficulty: "Medium",
    theory: [
      "A rat starts at (0,0) of an N×N maze and needs to reach (N-1, N-1). Cells with value 1 are passable, 0 are blocked.",
      "At each step, the rat can move in allowed directions (usually Down, Left, Right, Up). The backtracking explores all paths, backtracking when stuck.",
      "The 'visited' array prevents revisiting cells, which is crucial to avoid infinite loops in cycle-containing mazes.",
    ],
    code: [
      {
        title: "Rat in a Maze — All Paths",
        language: "java",
        content: `import java.util.*;

public class RatInMaze {
    
    static int[] dr = {1, 0, 0, -1}; // Down, Left, Right, Up
    static int[] dc = {0, -1, 1, 0};
    static char[] dir = {'D', 'L', 'R', 'U'};
    
    public static List<String> findPaths(int[][] maze) {
        int n = maze.length;
        if (maze[0][0] == 0 || maze[n-1][n-1] == 0) return new ArrayList<>();
        
        List<String> result = new ArrayList<>();
        boolean[][] visited = new boolean[n][n];
        
        dfs(maze, 0, 0, n, visited, new StringBuilder(), result);
        Collections.sort(result); // Alphabetical order
        return result;
    }
    
    private static void dfs(int[][] maze, int row, int col, int n,
                             boolean[][] visited, StringBuilder path,
                             List<String> result) {
        // Goal reached
        if (row == n-1 && col == n-1) {
            result.add(path.toString());
            return;
        }
        
        // Mark current cell as visited
        visited[row][col] = true;
        
        // Try all 4 directions (in alphabetical order: D, L, R, U)
        for (int d = 0; d < 4; d++) {
            int nr = row + dr[d];
            int nc = col + dc[d];
            
            if (nr >= 0 && nr < n && nc >= 0 && nc < n
                    && maze[nr][nc] == 1 && !visited[nr][nc]) {
                path.append(dir[d]);               // CHOOSE direction
                dfs(maze, nr, nc, n, visited, path, result); // EXPLORE
                path.deleteCharAt(path.length() - 1); // UNCHOOSE
            }
        }
        
        // Unmark (backtrack)
        visited[row][col] = false;
    }
    
    // Count unique paths using DP (for comparison)
    public static int countPaths(int[][] maze) {
        int n = maze.length;
        int[][] dp = new int[n][n];
        dp[0][0] = 1;
        
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (maze[i][j] == 0) { dp[i][j] = 0; continue; }
                if (i > 0) dp[i][j] += dp[i-1][j];
                if (j > 0) dp[i][j] += dp[i][j-1];
            }
        }
        return dp[n-1][n-1];
    }
    
    public static void main(String[] args) {
        int[][] maze = {
            {1, 0, 0, 0},
            {1, 1, 0, 1},
            {1, 1, 0, 0},
            {0, 1, 1, 1}
        };
        
        System.out.println("All paths: " + findPaths(maze));
        System.out.println("Total paths (DP): " + countPaths(maze));
    }
}`,
      },
    ],
  },
  {
    id: "bt-coloring",
    title: "Graph Coloring & Hamiltonian Path",
    difficulty: "Hard",
    theory: [
      "Graph Coloring: Color vertices of a graph using at most m colors such that no two adjacent vertices share the same color. The minimum m for which this is possible is the chromatic number.",
      "Hamiltonian Path: Find a path that visits every vertex exactly once. Hamiltonian Circuit returns to the starting vertex.",
      "Both problems are NP-hard in general, making backtracking the standard approach. Pruning is essential for performance.",
    ],
    code: [
      {
        title: "Graph Coloring & Hamiltonian Cycle",
        language: "java",
        content: `import java.util.*;

public class GraphColoringHamiltonian {
    
    // ==================== GRAPH COLORING ====================
    
    public static boolean graphColoring(int[][] graph, int m) {
        int n = graph.length;
        int[] colors = new int[n]; // colors[i] = color assigned to vertex i (0 = unassigned)
        return colorVertex(graph, colors, m, 0);
    }
    
    private static boolean colorVertex(int[][] graph, int[] colors, int m, int vertex) {
        if (vertex == graph.length) return true; // All vertices colored
        
        for (int color = 1; color <= m; color++) {
            if (isSafeColor(graph, colors, vertex, color)) {
                colors[vertex] = color;                         // CHOOSE
                if (colorVertex(graph, colors, m, vertex + 1)) // EXPLORE
                    return true;
                colors[vertex] = 0;                            // UNCHOOSE
            }
        }
        return false; // No valid color found
    }
    
    private static boolean isSafeColor(int[][] graph, int[] colors, int vertex, int color) {
        for (int adj = 0; adj < graph.length; adj++) {
            if (graph[vertex][adj] == 1 && colors[adj] == color) return false;
        }
        return true;
    }
    
    // Find minimum colors needed (chromatic number)
    public static int chromaticNumber(int[][] graph) {
        for (int m = 1; m <= graph.length; m++) {
            if (graphColoring(graph, m)) return m;
        }
        return graph.length;
    }
    
    // ==================== HAMILTONIAN CYCLE ====================
    
    public static boolean hamiltonianCycle(int[][] graph) {
        int n = graph.length;
        int[] path = new int[n];
        Arrays.fill(path, -1);
        path[0] = 0; // Start from vertex 0
        
        if (findHamCycle(graph, path, 1, n)) {
            System.out.print("Hamiltonian Cycle: ");
            for (int v : path) System.out.print(v + " ");
            System.out.println(path[0]); // Return to start
            return true;
        }
        System.out.println("No Hamiltonian Cycle exists");
        return false;
    }
    
    private static boolean findHamCycle(int[][] graph, int[] path, int pos, int n) {
        if (pos == n) {
            // Check if last vertex connects back to first
            return graph[path[pos-1]][path[0]] == 1;
        }
        
        for (int vertex = 1; vertex < n; vertex++) {
            if (isSafeHam(graph, path, vertex, pos)) {
                path[pos] = vertex;                           // CHOOSE
                if (findHamCycle(graph, path, pos + 1, n)) return true;
                path[pos] = -1;                               // UNCHOOSE
            }
        }
        return false;
    }
    
    private static boolean isSafeHam(int[][] graph, int[] path, int vertex, int pos) {
        // Check edge from previous vertex to this one
        if (graph[path[pos-1]][vertex] == 0) return false;
        // Check if already visited
        for (int i = 0; i < pos; i++) if (path[i] == vertex) return false;
        return true;
    }
    
    public static void main(String[] args) {
        // Graph coloring example (Petersen graph-like)
        int[][] graph = {
            {0,1,0,1,0},
            {1,0,1,0,0},
            {0,1,0,1,0},
            {1,0,1,0,1},
            {0,0,0,1,0}
        };
        System.out.println("Can color with 3 colors? " + graphColoring(graph, 3));
        System.out.println("Chromatic number: " + chromaticNumber(graph));
        System.out.println();
        
        // Hamiltonian cycle
        int[][] graphH = {
            {0,1,0,1,0},
            {1,0,1,0,1},
            {0,1,0,1,0},
            {1,0,1,0,1},
            {0,1,0,1,0}
        };
        hamiltonianCycle(graphH);
    }
}`,
      },
    ],
  },
  {
    id: "bt-wordsearch",
    title: "Word Search (2D Grid)",
    difficulty: "Medium",
    timeComplexity: "O(M × N × 4^L) where L = word length",
    spaceComplexity: "O(L) recursion depth",
    theory: [
      "Given an M×N grid of characters and a target word, determine if the word exists in the grid by following adjacent cells (horizontal/vertical). Each cell may be used at most once per path.",
      "Classic backtracking on a 2D grid: start from every cell that matches the first character, then explore all 4 directions for the next character.",
      "Key optimization: mark cells as visited in-place by temporarily changing the character (e.g., to '#'), avoiding an extra visited array. Restore it during backtracking.",
      "Word Search II (Hard variant): Given a list of words, find all words present in the grid. Use a Trie to prune — if no word in the dictionary starts with the current prefix, stop exploring that branch.",
    ],
    keyPoints: [
      "Start DFS from every cell matching word[0]",
      "In-place marking avoids extra O(M×N) space",
      "For Word Search II, Trie-based pruning reduces from O(K × M×N × 4^L) to near-linear in practice",
    ],
    code: [
      {
        title: "Word Search I — Single Word",
        language: "java",
        content: `public class WordSearch {
    
    public boolean exist(char[][] board, String word) {
        int m = board.length, n = board[0].length;
        
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (board[i][j] == word.charAt(0) && dfs(board, word, i, j, 0))
                    return true;
            }
        }
        return false;
    }
    
    private boolean dfs(char[][] board, String word, int r, int c, int idx) {
        if (idx == word.length()) return true;
        
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length
                || board[r][c] != word.charAt(idx))
            return false;
        
        char original = board[r][c];
        board[r][c] = '#';
        
        int[] dr = {0, 0, 1, -1};
        int[] dc = {1, -1, 0, 0};
        for (int d = 0; d < 4; d++) {
            if (dfs(board, word, r + dr[d], c + dc[d], idx + 1))
                return true;
        }
        
        board[r][c] = original;
        return false;
    }
    
    public static void main(String[] args) {
        WordSearch ws = new WordSearch();
        char[][] board = {
            {'A','B','C','E'},
            {'S','F','C','S'},
            {'A','D','E','E'}
        };
        System.out.println("ABCCED: " + ws.exist(board, "ABCCED")); // true
        System.out.println("SEE:    " + ws.exist(board, "SEE"));    // true
        System.out.println("ABCB:   " + ws.exist(board, "ABCB"));  // false
    }
}`,
      },
      {
        title: "Word Search II — Multiple Words with Trie Pruning",
        language: "java",
        content: `import java.util.*;

public class WordSearchII {
    
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        String word = null;
    }
    
    public List<String> findWords(char[][] board, String[] words) {
        TrieNode root = new TrieNode();
        for (String w : words) {
            TrieNode node = root;
            for (char c : w.toCharArray()) {
                int idx = c - 'a';
                if (node.children[idx] == null)
                    node.children[idx] = new TrieNode();
                node = node.children[idx];
            }
            node.word = w;
        }
        
        List<String> result = new ArrayList<>();
        int m = board.length, n = board[0].length;
        
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                dfs(board, i, j, root, result);
        return result;
    }
    
    private void dfs(char[][] board, int r, int c, TrieNode node, List<String> result) {
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return;
        
        char ch = board[r][c];
        if (ch == '#' || node.children[ch - 'a'] == null) return;
        
        node = node.children[ch - 'a'];
        if (node.word != null) {
            result.add(node.word);
            node.word = null;
        }
        
        board[r][c] = '#';
        dfs(board, r + 1, c, node, result);
        dfs(board, r - 1, c, node, result);
        dfs(board, r, c + 1, node, result);
        dfs(board, r, c - 1, node, result);
        board[r][c] = ch;
    }
    
    public static void main(String[] args) {
        WordSearchII ws = new WordSearchII();
        char[][] board = {
            {'o','a','a','n'},
            {'e','t','a','e'},
            {'i','h','k','r'},
            {'i','f','l','v'}
        };
        String[] words = {"oath","pea","eat","rain"};
        System.out.println("Found: " + ws.findWords(board, words));
        // Output: [oath, eat]
    }
}`,
      },
    ],
  },
  {
    id: "bt-knights-tour",
    title: "Knight's Tour",
    difficulty: "Hard",
    timeComplexity: "O(8^(N²)) worst case — Warnsdorff's heuristic makes it near-linear",
    spaceComplexity: "O(N²) for the board",
    theory: [
      "A Knight's Tour is a sequence of moves on an N×N chessboard where the knight visits every square exactly once. The knight moves in an L-shape: 2 squares in one direction and 1 in the perpendicular.",
      "Brute-force backtracking tries all 8 possible knight moves from each cell. For an 8×8 board, the search space is enormous without heuristics.",
      "Warnsdorff's Rule (greedy heuristic): always move to the square with the fewest onward moves. This almost always finds a solution without backtracking, reducing complexity to near O(N²).",
      "A closed tour returns to the starting square — it forms a Hamiltonian circuit on the knight's graph.",
    ],
    code: [
      {
        title: "Knight's Tour — Backtracking + Warnsdorff's Heuristic",
        language: "java",
        content: `import java.util.*;

public class KnightsTour {
    
    static int[] dx = {2, 1, -1, -2, -2, -1, 1, 2};
    static int[] dy = {1, 2, 2, 1, -1, -2, -2, -1};
    
    public static boolean solveBasic(int n) {
        int[][] board = new int[n][n];
        for (int[] row : board) Arrays.fill(row, -1);
        board[0][0] = 0;
        if (solve(board, 0, 0, 1, n)) {
            printBoard(board, n);
            return true;
        }
        return false;
    }
    
    private static boolean solve(int[][] board, int x, int y, int moveNum, int n) {
        if (moveNum == n * n) return true;
        for (int i = 0; i < 8; i++) {
            int nx = x + dx[i], ny = y + dy[i];
            if (nx >= 0 && nx < n && ny >= 0 && ny < n && board[nx][ny] == -1) {
                board[nx][ny] = moveNum;
                if (solve(board, nx, ny, moveNum + 1, n)) return true;
                board[nx][ny] = -1;
            }
        }
        return false;
    }
    
    // Warnsdorff's: always jump to cell with fewest onward moves
    public static boolean solveWarnsdorff(int n) {
        int[][] board = new int[n][n];
        for (int[] row : board) Arrays.fill(row, -1);
        board[0][0] = 0;
        int x = 0, y = 0;
        
        for (int move = 1; move < n * n; move++) {
            int minDeg = Integer.MAX_VALUE;
            int bestX = -1, bestY = -1;
            for (int i = 0; i < 8; i++) {
                int nx = x + dx[i], ny = y + dy[i];
                if (nx >= 0 && nx < n && ny >= 0 && ny < n && board[nx][ny] == -1) {
                    int deg = 0;
                    for (int j = 0; j < 8; j++) {
                        int nnx = nx + dx[j], nny = ny + dy[j];
                        if (nnx >= 0 && nnx < n && nny >= 0 && nny < n && board[nnx][nny] == -1)
                            deg++;
                    }
                    if (deg < minDeg) { minDeg = deg; bestX = nx; bestY = ny; }
                }
            }
            if (bestX == -1) return false;
            x = bestX; y = bestY;
            board[x][y] = move;
        }
        printBoard(board, n);
        return true;
    }
    
    private static void printBoard(int[][] board, int n) {
        for (int[] row : board) {
            for (int cell : row) System.out.printf("%3d", cell);
            System.out.println();
        }
    }
    
    public static void main(String[] args) {
        System.out.println("=== 8x8 Knight's Tour (Warnsdorff) ===");
        solveWarnsdorff(8);
    }
}`,
      },
    ],
  },
  {
    id: "bt-phone-letter",
    title: "Letter Combinations of a Phone Number",
    difficulty: "Medium",
    timeComplexity: "O(4^N × N) where N = number of digits",
    spaceComplexity: "O(N) recursion depth",
    theory: [
      "Given a string of digits 2-9, return all possible letter combinations the number could represent (like old phone keypads).",
      "Each digit maps to 3-4 letters (e.g., 2→abc, 3→def, ..., 9→wxyz). For each digit, we branch into all its mapped letters.",
      "This is a classic backtracking problem where the decision tree has branching factor 3-4 at each level, with depth = number of digits.",
      "Iterative BFS approach is also possible: maintain a queue, and for each digit, expand every existing combination with each mapped letter.",
    ],
    code: [
      {
        title: "Phone Letter Combinations — Backtracking + Iterative",
        language: "java",
        content: `import java.util.*;

public class PhoneLetterCombinations {
    
    static String[] mapping = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
    
    public static List<String> letterCombinations(String digits) {
        List<String> result = new ArrayList<>();
        if (digits == null || digits.isEmpty()) return result;
        backtrack(digits, 0, new StringBuilder(), result);
        return result;
    }
    
    private static void backtrack(String digits, int idx, StringBuilder sb, List<String> result) {
        if (idx == digits.length()) {
            result.add(sb.toString());
            return;
        }
        String letters = mapping[digits.charAt(idx) - '0'];
        for (char c : letters.toCharArray()) {
            sb.append(c);
            backtrack(digits, idx + 1, sb, result);
            sb.deleteCharAt(sb.length() - 1);
        }
    }
    
    // Iterative BFS approach
    public static List<String> letterCombinationsIterative(String digits) {
        LinkedList<String> queue = new LinkedList<>();
        if (digits == null || digits.isEmpty()) return queue;
        queue.add("");
        for (int i = 0; i < digits.length(); i++) {
            String letters = mapping[digits.charAt(i) - '0'];
            int size = queue.size();
            for (int j = 0; j < size; j++) {
                String curr = queue.poll();
                for (char c : letters.toCharArray()) queue.add(curr + c);
            }
        }
        return queue;
    }
    
    public static void main(String[] args) {
        System.out.println("23 → " + letterCombinations("23"));
        // [ad, ae, af, bd, be, bf, cd, ce, cf]
    }
}`,
      },
    ],
  },
  {
    id: "bt-palindrome-partition",
    title: "Palindrome Partitioning",
    difficulty: "Medium",
    timeComplexity: "O(N × 2^N)",
    spaceComplexity: "O(N) recursion depth",
    theory: [
      "Given a string s, partition it such that every substring in the partition is a palindrome. Return all possible palindrome partitionings.",
      "At each position, try every possible prefix that is a palindrome. If it is, add it to the current partition and recurse on the remaining suffix.",
      "Optimization: precompute a DP table isPalin[i][j] to check if s[i..j] is a palindrome in O(1) instead of O(N) per check.",
      "This problem is frequently asked at Google, Amazon, and Meta interviews. It combines string manipulation with backtracking elegantly.",
    ],
    code: [
      {
        title: "Palindrome Partitioning — With DP Optimization",
        language: "java",
        content: `import java.util.*;

public class PalindromePartition {
    
    public List<List<String>> partition(String s) {
        int n = s.length();
        boolean[][] isPalin = new boolean[n][n];
        for (int len = 1; len <= n; len++) {
            for (int i = 0; i <= n - len; i++) {
                int j = i + len - 1;
                if (s.charAt(i) == s.charAt(j) && (len <= 2 || isPalin[i+1][j-1]))
                    isPalin[i][j] = true;
            }
        }
        
        List<List<String>> result = new ArrayList<>();
        backtrack(s, 0, isPalin, new ArrayList<>(), result);
        return result;
    }
    
    private void backtrack(String s, int start, boolean[][] isPalin,
                           List<String> current, List<List<String>> result) {
        if (start == s.length()) {
            result.add(new ArrayList<>(current));
            return;
        }
        for (int end = start; end < s.length(); end++) {
            if (isPalin[start][end]) {
                current.add(s.substring(start, end + 1));
                backtrack(s, end + 1, isPalin, current, result);
                current.remove(current.size() - 1);
            }
        }
    }
    
    public static void main(String[] args) {
        PalindromePartition pp = new PalindromePartition();
        System.out.println("aab → " + pp.partition("aab"));
        // [[a, a, b], [aa, b]]
    }
}`,
      },
    ],
  },
  {
    id: "bt-generate-parens",
    title: "Generate Parentheses",
    difficulty: "Medium",
    timeComplexity: "O(4^N / √N) — Catalan number",
    spaceComplexity: "O(N) recursion depth",
    theory: [
      "Given n pairs of parentheses, generate all combinations of well-formed (valid) parentheses.",
      "At each position, we have two choices: place '(' or ')'. The constraints are: (1) we can place '(' if open count < n, (2) we can place ')' only if close count < open count.",
      "The number of valid combinations is the Nth Catalan number: C(n) = (2n)! / ((n+1)! × n!).",
      "This is one of the most elegant backtracking problems — the pruning conditions themselves define the structure of valid parentheses.",
    ],
    code: [
      {
        title: "Generate Valid Parentheses",
        language: "java",
        content: `import java.util.*;

public class GenerateParentheses {
    
    public static List<String> generateParenthesis(int n) {
        List<String> result = new ArrayList<>();
        backtrack(result, new StringBuilder(), 0, 0, n);
        return result;
    }
    
    private static void backtrack(List<String> result, StringBuilder sb,
                                   int open, int close, int n) {
        if (sb.length() == 2 * n) {
            result.add(sb.toString());
            return;
        }
        if (open < n) {
            sb.append('(');
            backtrack(result, sb, open + 1, close, n);
            sb.deleteCharAt(sb.length() - 1);
        }
        if (close < open) {
            sb.append(')');
            backtrack(result, sb, open, close + 1, n);
            sb.deleteCharAt(sb.length() - 1);
        }
    }
    
    public static void main(String[] args) {
        System.out.println("n=3 → " + generateParenthesis(3));
        // [((())), (()()), (())(), ()(()), ()()()]
        System.out.println("Count n=4: " + generateParenthesis(4).size()); // 14
    }
}`,
      },
    ],
  },
  {
    id: "bt-word-break",
    title: "Word Break II (Sentence Construction)",
    difficulty: "Hard",
    timeComplexity: "O(2^N × N) worst case — memoization helps",
    spaceComplexity: "O(2^N × N) for storing all results",
    theory: [
      "Given a string s and a dictionary of words, add spaces to s to construct sentences where each word is in the dictionary. Return all possible sentences.",
      "This combines backtracking with memoization: at each position, try every dictionary word that matches the prefix, then recurse on the remaining string.",
      "Word Break I (can we segment?) is solvable with DP in O(N²). Word Break II (list all segmentations) requires backtracking since we need to enumerate all valid splits.",
      "A HashSet for the dictionary gives O(1) lookups. Memoize results for each starting index to avoid recomputing overlapping subproblems.",
    ],
    code: [
      {
        title: "Word Break II — Backtracking with Memoization",
        language: "java",
        content: `import java.util.*;

public class WordBreakII {
    
    public List<String> wordBreak(String s, List<String> wordDict) {
        Set<String> dict = new HashSet<>(wordDict);
        Map<Integer, List<String>> memo = new HashMap<>();
        return backtrack(s, 0, dict, memo);
    }
    
    private List<String> backtrack(String s, int start, Set<String> dict,
                                    Map<Integer, List<String>> memo) {
        if (memo.containsKey(start)) return memo.get(start);
        List<String> result = new ArrayList<>();
        if (start == s.length()) { result.add(""); return result; }
        
        for (int end = start + 1; end <= s.length(); end++) {
            String word = s.substring(start, end);
            if (dict.contains(word)) {
                List<String> suffixes = backtrack(s, end, dict, memo);
                for (String suffix : suffixes)
                    result.add(word + (suffix.isEmpty() ? "" : " " + suffix));
            }
        }
        memo.put(start, result);
        return result;
    }
    
    public static void main(String[] args) {
        WordBreakII wb = new WordBreakII();
        String s1 = "catsanddog";
        List<String> dict1 = Arrays.asList("cat","cats","and","sand","dog");
        System.out.println(s1 + " → " + wb.wordBreak(s1, dict1));
        // [cats and dog, cat sand dog]
    }
}`,
      },
    ],
  },
];
