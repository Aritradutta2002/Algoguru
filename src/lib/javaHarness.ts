// Java harness generation for LeetCode-style execution via Wandbox.
// Parses Solution method signature from codeSnippets and builds a Main.java driver
// that feeds exampleTestcases inputs into the method.

export interface ParsedMethod {
  methodName: string;
  returnType: string;
  params: { type: string; name: string }[];
  isStatic: boolean;
}

export function parseSolutionSignature(javaCode: string): ParsedMethod | null {
  // Find class Solution body
  // Look for public methods that are not main
  // Regex: modifiers + returnType + methodName + (params)
  const methodRegex =
    /(?:public\s+)?(?:static\s+)?(?:final\s+)?([\w<>\[\],\s\?]+?)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+[\w,\s]+)?\s*\{/g;
  let match: RegExpExecArray | null;
  let best: ParsedMethod | null = null;
  while ((match = methodRegex.exec(javaCode)) !== null) {
    let rawType = match[1].trim().replace(/\s+/g, " ");
    // Strip leading visibility / modifier keywords that were captured due to preceding space
    rawType = rawType.replace(/^(?:public|private|protected|static|final|abstract|synchronized)\s+/g, "").trim();
    rawType = rawType.replace(/^(?:public|private|protected|static|final|abstract|synchronized)\s+/g, "").trim();
    const name = match[2].trim();
    const rawParams = match[3].trim();
    if (name === "main") continue;
    // Filter out constructors (return type == class name) or common noise
    if (["if", "for", "while", "switch", "catch"].includes(name)) continue;
    // Return type should look like a type, not a modifier leftover
    if (rawType === "class" || rawType === "interface" || rawType === "") continue;

    // Parse params
    const params: { type: string; name: string }[] = [];
    if (rawParams.length > 0) {
      const parts = splitParams(rawParams);
      for (const p of parts) {
        const trimmed = p.trim();
        if (!trimmed) continue;
        // Extract last word as name, rest as type
        const lastSpace = trimmed.lastIndexOf(" ");
        if (lastSpace === -1) continue;
        let type = trimmed.slice(0, lastSpace).trim().replace(/\s+/g, " ");
        const paramName = trimmed.slice(lastSpace + 1).trim();
        // Remove annotations/final
        type = type.replace(/\bfinal\b/g, "").trim().replace(/\s+/g, " ");
        if (!type || !paramName) continue;
        params.push({ type, name: paramName });
      }
    }

    // Prefer method inside class Solution with at least plausible return
    // If multiple, prefer one with params or larger signature
    const isStatic = match[0].includes("static");
    const candidate: ParsedMethod = {
      methodName: name,
      returnType: rawType,
      params,
      isStatic,
    };
    // Heuristic: prefer non-trivial method (has params or non-void return)
    if (!best) best = candidate;
    else if (candidate.params.length > best.params.length) best = candidate;
    else if (best.params.length === 0 && candidate.params.length === 0 && candidate.returnType !== "void") {
      // keep best
    }
  }
  return best;
}

function splitParams(raw: string): string[] {
  const res: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "<") depth++;
    else if (ch === ">") depth--;
    else if (ch === "," && depth === 0) {
      res.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur) res.push(cur);
  return res;
}

// Determine Java expression to parse a raw LeetCode testcase line into the expected type
function javaParseExpr(rawVar: string, type: string): string {
  const t = type.trim();
  // Normalize
  const normalized = t.replace(/\s+/g, " ");

  // Primitive / boxed
  if (/^(int|Integer)$/.test(normalized)) return `Integer.parseInt(${rawVar}.trim())`;
  if (/^(long|Long)$/.test(normalized)) return `Long.parseLong(${rawVar}.trim())`;
  if (/^(boolean|Boolean)$/.test(normalized)) return `Boolean.parseBoolean(${rawVar}.trim())`;
  if (/^String$/.test(normalized)) return `parseString(${rawVar})`;
  if (/^char$/.test(normalized) || /^Character$/.test(normalized)) return `parseChar(${rawVar})`;
  if (/^(double|Double)$/.test(normalized)) return `Double.parseDouble(${rawVar}.trim())`;
  if (/^(float|Float)$/.test(normalized)) return `Float.parseFloat(${rawVar}.trim())`;

  // Arrays
  if (/^int\[\]$/.test(normalized)) return `parseIntArray(${rawVar})`;
  if (/^long\[\]$/.test(normalized)) return `parseLongArray(${rawVar})`;
  if (/^String\[\]$/.test(normalized)) return `parseStringArray(${rawVar})`;
  if (/^char\[\]$/.test(normalized)) return `parseCharArray(${rawVar})`;
  if (/^boolean\[\]$/.test(normalized)) return `parseBooleanArray(${rawVar})`;
  if (/^double\[\]$/.test(normalized)) return `parseDoubleArray(${rawVar})`;

  if (/^int\[\]\[\]$/.test(normalized)) return `parseInt2DArray(${rawVar})`;
  if (/^char\[\]\[\]$/.test(normalized)) return `parseChar2DArray(${rawVar})`;
  if (/^String\[\]\[\]$/.test(normalized)) return `parseString2DArray(${rawVar})`;

  // Custom structures
  if (/^ListNode$/.test(normalized)) return `parseListNode(${rawVar})`;
  if (/^TreeNode$/.test(normalized)) return `parseTreeNode(${rawVar})`;

  // List variants (LeetCode often uses List<Integer> etc.)
  if (/^List<Integer>/.test(normalized)) return `parseIntArrayToList(parseIntArray(${rawVar}))`;
  if (/^List<String>/.test(normalized)) return `Arrays.asList(parseStringArray(${rawVar}))`;
  if (/^List<List<Integer>>/.test(normalized)) return `parseInt2DList(${rawVar})`;
  if (/^List<List<String>>/.test(normalized)) return `new ArrayList<>(Arrays.asList(parseString2DArray(${rawVar})))`;

  // Fallback: treat as String
  return `${rawVar}.trim()`;
}

function javaPrintExpr(resultVar: string, returnType: string): string {
  const t = returnType.trim();
  if (t === "boolean" || t === "Boolean") return resultVar;
  if (t === "int" || t === "Integer" || t === "long" || t === "Long" || t === "double" || t === "Double" || t === "float" || t === "Float" || t === "char" || t === "Character" || t === "String") {
    return resultVar;
  }
  if (t === "ListNode") return `listNodeToString(${resultVar})`;
  if (t === "TreeNode") return `treeNodeToString(${resultVar})`;
  if (/\[.*\]$/.test(t)) return `Arrays.deepToString(${resultVar})`;
  if (t.startsWith("List")) return resultVar;
  // generic
  return `String.valueOf(${resultVar})`;
}

function needsHelper(type: string): string[] {
  const helpers: string[] = [];
  if (type === "String") helpers.push("parseString");
  if (type === "char" || type === "Character") helpers.push("parseChar");
  if (type === "int[]") helpers.push("parseIntArray");
  if (type === "long[]") helpers.push("parseLongArray");
  if (type === "String[]") helpers.push("parseStringArray");
  if (type === "char[]") helpers.push("parseCharArray");
  if (type === "boolean[]") helpers.push("parseBooleanArray");
  if (type === "double[]") helpers.push("parseDoubleArray");
  if (type === "int[][]") helpers.push("parseInt2DArray");
  if (type === "char[][]") helpers.push("parseChar2DArray");
  if (type === "String[][]") helpers.push("parseString2DArray");
  if (type === "ListNode") helpers.push("parseIntArray", "parseListNode");
  if (type === "TreeNode") helpers.push("parseTreeNode");
  if (/^List/.test(type)) helpers.push("parseIntArray", "parseInt2DList");
  return helpers;
}

export function chunkTestCases(exampleTestcases: string, paramCount: number): string[][] {
  if (!exampleTestcases) return [];
  const normalized = exampleTestcases.replace(/\\n/g, "\n");
  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (paramCount <= 1) {
    return lines.map((l) => [l]);
  }
  // Group paramCount lines per test case
  const chunks: string[][] = [];
  for (let i = 0; i < lines.length; i += paramCount) {
    const chunk = lines.slice(i, i + paramCount);
    if (chunk.length === paramCount) chunks.push(chunk);
    else if (chunk.length > 0) chunks.push(chunk); // partial
  }
  return chunks;
}

// Generates a Main.java source that drives the Solution.
// Returns null only if signature cannot be parsed; complex types (ListNode/TreeNode) are handled via shims.
export function generateHarnessMain(
  solutionCode: string,
  exampleTestcases: string,
): string | null {
  const sig = parseSolutionSignature(solutionCode);
  if (!sig) return null;

  const complexTypes = ["TreeNode", "ListNode", "Node"];
  const hasComplexParam = sig.params.some((p) => complexTypes.some((ct) => p.type.includes(ct)));
  const hasComplexReturn = complexTypes.some((ct) => sig.returnType.includes(ct));
  // we no longer bail — we inject shims and helpers

  const paramCount = sig.params.length;
  const cases = chunkTestCases(exampleTestcases, Math.max(paramCount, 1));
  if (cases.length === 0) return null;

  // Build Java source for Main
  const paramDeclarations = sig.params
    .map((p, idx) => {
      const rawVar = `raw[${idx}]`;
      const expr = javaParseExpr(rawVar, p.type);
      return `            ${p.type} ${p.name} = ${expr};`;
    })
    .join("\n");

  const callArgs = sig.params.map((p) => p.name).join(", ");
  const callLine = sig.isStatic
    ? `            ${sig.returnType} result = Solution.${sig.methodName}(${callArgs});`
    : `            ${sig.returnType} result = sol.${sig.methodName}(${callArgs});`;

  // Handle void return — LeetCode void problems mutate the first param (e.g., sortColors, reverseString)
  const isVoid = sig.returnType === "void";
  let printLine: string;
  if (isVoid) {
    if (sig.params.length > 0) {
      const first = sig.params[0];
      const expr = javaPrintExpr(first.name, first.type);
      // For ListNode/char[] etc we already have helper
      printLine = `            System.out.println(${expr});`;
    } else {
      printLine = `            System.out.println("void");`;
    }
  } else {
    printLine = `            System.out.println(${javaPrintExpr("result", sig.returnType)});`;
  }

  // Collect needed helpers + return-type helpers
  const helperSet = new Set<string>();
  sig.params.forEach((p) => needsHelper(p.type).forEach((h) => helperSet.add(h)));
  needsHelper(sig.returnType).forEach((h) => helperSet.add(h));
  if (sig.returnType === "ListNode" || sig.returnType === "TreeNode") {
    helperSet.add(sig.returnType === "ListNode" ? "parseListNode" : "parseTreeNode");
    helperSet.add("listNodeToString");
    helperSet.add("treeNodeToString");
  }
  if (sig.params.some((p) => p.type === "ListNode") || sig.returnType === "ListNode") helperSet.add("listNodeToString");
  if (sig.params.some((p) => p.type === "TreeNode") || sig.returnType === "TreeNode") helperSet.add("treeNodeToString");
  // Also ensure parseIntArray present for list helpers
  if (helperSet.has("parseListNode") || helperSet.has("parseTreeNode")) helperSet.add("parseIntArray");

  const needsShimListNode = sig.params.some((p) => p.type === "ListNode") || sig.returnType === "ListNode";
  const needsShimTreeNode = sig.params.some((p) => p.type === "TreeNode") || sig.returnType === "TreeNode";

  const helpersCode = buildHelpers(helperSet);
  const shimsCode = `${needsShimListNode ? LISTNODE_SHIM : ""}${needsShimTreeNode ? TREENODE_SHIM : ""}`;

  const casesLiteral = cases
    .map((c) => `            new String[]{${c.map((s) => JSON.stringify(s)).join(", ")}}`)
    .join(",\n");

  return `class Main {
    public static void main(String[] args) throws Exception {
        Solution sol = new Solution();
        String[][] allCases = new String[][]{
${casesLiteral}
        };
        for (int ci = 0; ci < allCases.length; ci++) {
            String[] raw = allCases[ci];
            try {
${paramDeclarations}
${isVoid ? `            sol.${sig.methodName}(${callArgs});\n${printLine}` : callLine + "\n" + printLine}
            } catch (Exception e) {
                System.out.println("Runtime Error on Case " + (ci+1) + ": " + e.getMessage());
                e.printStackTrace(System.out);
            }
        }
    }
 ${helpersCode}
}
${shimsCode}
`;
}

const LISTNODE_SHIM = `
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
`;

const TREENODE_SHIM = `
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}
`;

function buildHelpers(set: Set<string>): string {
  let code = "";
  if (set.has("parseListNode")) {
    code += `
    private static ListNode parseListNode(String s) {
        s = s.trim();
        if (s.equals("[]") || s.isEmpty() || s.equals("null")) return null;
        int[] arr = parseIntArray(s);
        if (arr.length == 0) return null;
        ListNode dummy = new ListNode(0);
        ListNode cur = dummy;
        for (int v : arr) { cur.next = new ListNode(v); cur = cur.next; }
        return dummy.next;
    }
    private static String listNodeToString(ListNode head) {
        if (head == null) return "[]";
        StringBuilder sb = new StringBuilder("[");
        ListNode cur = head;
        while (cur != null) {
            sb.append(cur.val);
            if (cur.next != null) sb.append(",");
            cur = cur.next;
        }
        sb.append("]");
        return sb.toString();
    }
`;
  }
  if (set.has("parseTreeNode")) {
    code += `
    private static TreeNode parseTreeNode(String s) {
        s = s.trim();
        if (s.equals("[]") || s.equals("null") || s.isEmpty()) return null;
        s = s.replaceAll("^\\\\[|\\\\]$", "");
        if (s.trim().isEmpty()) return null;
        String[] parts = s.split(",");
        List<String> vals = new ArrayList<>();
        for (String p : parts) vals.add(p.trim());
        if (vals.isEmpty() || vals.get(0).equals("null")) return null;
        TreeNode root = new TreeNode(Integer.parseInt(vals.get(0)));
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < vals.size()) {
            TreeNode cur = q.poll();
            if (i < vals.size()) {
                String v = vals.get(i++);
                if (!v.equals("null")) { cur.left = new TreeNode(Integer.parseInt(v)); q.add(cur.left); }
            }
            if (i < vals.size()) {
                String v = vals.get(i++);
                if (!v.equals("null")) { cur.right = new TreeNode(Integer.parseInt(v)); q.add(cur.right); }
            }
        }
        return root;
    }
    private static String treeNodeToString(TreeNode root) {
        if (root == null) return "[]";
        List<String> out = new ArrayList<>();
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) {
            TreeNode n = q.poll();
            if (n == null) out.add("null");
            else {
                out.add(String.valueOf(n.val));
                q.add(n.left);
                q.add(n.right);
            }
        }
        while (!out.isEmpty() && out.get(out.size()-1).equals("null")) out.remove(out.size()-1);
        return "[" + String.join(",", out) + "]";
    }
 `;
  }
  // Ensure listNodeToString / treeNodeToString available when only return type needs it
  if (set.has("listNodeToString") && !code.includes("listNodeToString")) {
    code += `
    private static String listNodeToString(ListNode head) {
        if (head == null) return "[]";
        StringBuilder sb = new StringBuilder("[");
        ListNode cur = head;
        while (cur != null) { sb.append(cur.val); if (cur.next != null) sb.append(","); cur = cur.next; }
        sb.append("]"); return sb.toString();
    }
`;
  }
  if (set.has("treeNodeToString") && !code.includes("treeNodeToString")) {
    code += `
    private static String treeNodeToString(TreeNode root) {
        if (root == null) return "[]";
        List<String> out = new ArrayList<>();
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) { TreeNode n = q.poll(); if (n == null) out.add("null"); else { out.add(String.valueOf(n.val)); q.add(n.left); q.add(n.right);} }
        while (!out.isEmpty() && out.get(out.size()-1).equals("null")) out.remove(out.size()-1);
        return "[" + String.join(",", out) + "]";
    }
`;
  }
  if (set.has("parseString")) {
    code += `
    private static String parseString(String s) {
        s = s.trim();
        if (s.startsWith("\\"") && s.endsWith("\\"") && s.length() >= 2) {
            // Unescape simple escapes
            s = s.substring(1, s.length()-1).replace("\\\\\\"", "\\"").replace("\\\\n", "\\n");
        }
        return s;
    }
`;
  }
  if (set.has("parseChar")) {
    code += `
    private static char parseChar(String s) {
        s = s.trim();
        if (s.startsWith("\\"") || s.startsWith("'")) s = s.replaceAll("^['\\"]|['\\"]$", "");
        return s.isEmpty() ? '\\0' : s.charAt(0);
    }
`;
  }
  if (set.has("parseIntArray")) {
    code += `
    private static int[] parseIntArray(String s) {
        s = s.trim();
        if (s.equals("[]") || s.isEmpty()) return new int[0];
        s = s.replaceAll("^\\\\[|\\\\]$", "");
        if (s.trim().isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] res = new int[parts.length];
        for (int i=0;i<parts.length;i++) res[i]=Integer.parseInt(parts[i].trim());
        return res;
    }
    private static List<Integer> parseIntArrayToList(int[] arr) {
        List<Integer> list = new ArrayList<>();
        for (int v: arr) list.add(v);
        return list;
    }
`;
  }
  if (set.has("parseLongArray")) {
    code += `
    private static long[] parseLongArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new long[0];
        s = s.replaceAll("^\\\\[|\\\\]$", "");
        if (s.trim().isEmpty()) return new long[0];
        String[] parts = s.split(",");
        long[] res = new long[parts.length];
        for (int i=0;i<parts.length;i++) res[i]=Long.parseLong(parts[i].trim());
        return res;
    }
`;
  }
  if (set.has("parseStringArray")) {
    code += `
    private static String[] parseStringArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new String[0];
        // naive split respecting quotes
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuote = false;
        char q = '"';
        for (int i=1;i<s.length()-1;i++) {
            char c = s.charAt(i);
            if ((c=='"' || c=='\'') && (i==0 || s.charAt(i-1)!='\\\\')) { inQuote = !inQuote; q=c; }
            if (c==',' && !inQuote) { out.add(parseString(cur.toString())); cur.setLength(0); }
            else cur.append(c);
        }
        if (cur.length()>0) out.add(parseString(cur.toString()));
        if (out.size()==1 && s.length()<=2) return new String[0];
        return out.toArray(new String[0]);
    }
`;
  }
  if (set.has("parseCharArray")) {
    code += `
    private static char[] parseCharArray(String s) {
        s=s.trim();
        if (s.equals("[]")) return new char[0];
        s=s.replaceAll("^\\\\[|\\\\]$","");
        if (s.trim().isEmpty()) return new char[0];
        String[] parts=s.split(",");
        char[] res=new char[parts.length];
        for(int i=0;i<parts.length;i++){ String p=parts[i].trim().replaceAll("^['\\"]|['\\"]$",""); res[i]=p.isEmpty()?0:p.charAt(0);}
        return res;
    }
`;
  }
  if (set.has("parseBooleanArray")) {
    code += `
    private static boolean[] parseBooleanArray(String s){
        s=s.trim();
        if(s.equals("[]")) return new boolean[0];
        s=s.replaceAll("^\\\\[|\\\\]$","");
        if(s.trim().isEmpty()) return new boolean[0];
        String[] parts=s.split(",");
        boolean[] res=new boolean[parts.length];
        for(int i=0;i<parts.length;i++) res[i]=Boolean.parseBoolean(parts[i].trim());
        return res;
    }
`;
  }
  if (set.has("parseDoubleArray")) {
    code += `
    private static double[] parseDoubleArray(String s){
        s=s.trim();
        if(s.equals("[]")) return new double[0];
        s=s.replaceAll("^\\\\[|\\\\]$","");
        if(s.trim().isEmpty()) return new double[0];
        String[] parts=s.split(",");
        double[] res=new double[parts.length];
        for(int i=0;i<parts.length;i++) res[i]=Double.parseDouble(parts[i].trim());
        return res;
    }
`;
  }
  if (set.has("parseInt2DArray")) {
    code += `
    private static int[][] parseInt2DArray(String s){
        s=s.trim();
        if(s.equals("[]")||s.equals("[[]]")) return new int[0][0];
        // Count rows by "],[" 
        List<int[]> rows=new ArrayList<>();
        // naive: split by "],"
        s=s.substring(1,s.length()-1); // remove outer []
        List<String> rowStrs=new ArrayList<>();
        int depth=0; StringBuilder cur=new StringBuilder();
        for(char c: s.toCharArray()){
            if(c=='[') depth++; else if(c==']') depth--;
            cur.append(c);
            if(depth==0 && cur.length()>0){ rowStrs.add(cur.toString().trim()); cur.setLength(0); }
        }
        for(String r: rowStrs){
            if(r.startsWith(",")) r=r.substring(1).trim();
            if(r.isEmpty()||r.equals(",")) continue;
            rows.add(parseIntArray(r));
        }
        return rows.toArray(new int[0][]);
    }
    private static List<List<Integer>> parseInt2DList(String s){
        int[][] arr=parseInt2DArray(s);
        List<List<Integer>> res=new ArrayList<>();
        for(int[] row: arr){ List<Integer> l=new ArrayList<>(); for(int v:row) l.add(v); res.add(l);}
        return res;
    }
`;
  }
  if (set.has("parseChar2DArray")) {
    code += `
    private static char[][] parseChar2DArray(String s){
        s=s.trim();
        if(s.equals("[]")) return new char[0][0];
        s=s.substring(1,s.length()-1);
        List<char[]> rows=new ArrayList<>();
        int depth=0; StringBuilder cur=new StringBuilder();
        for(char c: s.toCharArray()){
            if(c=='[') depth++; else if(c==']') depth--;
            cur.append(c);
            if(depth==0 && cur.length()>0){ rows.add(parseCharArray(cur.toString().trim().replaceAll("^,",""))); cur.setLength(0);}
        }
        return rows.toArray(new char[0][]);
    }
`;
  }
  if (set.has("parseString2DArray")) {
    code += `
    private static String[][] parseString2DArray(String s){
        s=s.trim();
        if(s.equals("[]")) return new String[0][0];
        s=s.substring(1,s.length()-1);
        List<String[]> rows=new ArrayList<>();
        int depth=0; StringBuilder cur=new StringBuilder();
        for(char c: s.toCharArray()){
            if(c=='[') depth++; else if(c==']') depth--;
            cur.append(c);
            if(depth==0 && cur.length()>0){ rows.add(parseStringArray(cur.toString().trim().replaceAll("^,",""))); cur.setLength(0);}
        }
        return rows.toArray(new String[0][]);
    }
`;
  }
  return code;
}
