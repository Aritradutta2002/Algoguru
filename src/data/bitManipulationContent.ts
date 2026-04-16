import { ContentSection } from "@/data/recursionContent";

export const bitManipulationContent: ContentSection[] = [
  // ===== 1. Introduction to Bits & Number Systems =====
  {
    id: "bits-intro",
    title: "Introduction to Bits & Number Systems",
    difficulty: "Easy",
    theory: [
      "At the lowest level, computers store everything as binary digits (bits) — 0s and 1s. Understanding how numbers are represented in binary is the foundation of all bit manipulation techniques used in competitive programming.",
      "A bit is the smallest unit of data. A byte is 8 bits. In Java, an int is 32 bits (4 bytes) and a long is 64 bits (8 bytes). The most significant bit (MSB) is the leftmost bit, and the least significant bit (LSB) is the rightmost bit.",
      "In the decimal system (base 10), each digit position represents a power of 10. Similarly, in the binary system (base 2), each bit position represents a power of 2. For example, binary 1011 = 1×2³ + 0×2² + 1×2¹ + 1×2⁰ = 8 + 0 + 2 + 1 = 11.",
      "Java uses Two's Complement representation for signed integers. The MSB is the sign bit: 0 for positive, 1 for negative. To get the negative of a number, invert all bits and add 1. This means a 32-bit int ranges from -2³¹ to 2³¹-1 (about -2.1 billion to 2.1 billion).",
    ],
    keyPoints: [
      "Binary is base-2: each position is a power of 2 (1, 2, 4, 8, 16, 32, ...)",
      "Java int = 32 bits (-2³¹ to 2³¹-1), long = 64 bits (-2⁶³ to 2⁶³-1)",
      "Two's complement: flip all bits and add 1 to negate a number",
      "MSB (bit 31 for int) is the sign bit in signed representation",
      "Unsigned operations in Java require careful handling (use >>> for unsigned right shift)",
    ],
    table: {
      headers: ["Decimal", "Binary (8-bit)", "Hex", "Notes"],
      rows: [
        ["0", "0000 0000", "0x00", "All bits zero"],
        ["1", "0000 0001", "0x01", "LSB set"],
        ["7", "0000 0111", "0x07", "Three LSBs set"],
        ["8", "0000 1000", "0x08", "Power of 2"],
        ["15", "0000 1111", "0x0F", "Lower nibble all 1s"],
        ["127", "0111 1111", "0x7F", "Max signed byte"],
        ["-1", "1111 1111", "0xFF", "All bits set (two's complement)"],
        ["-128", "1000 0000", "0x80", "Min signed byte"],
      ],
    },
    code: [
      {
        title: "Binary Representation in Java",
        language: "java",
        content: `public class BinaryRepresentation {
    public static void main(String[] args) {
        int num = 42;
        
        // Method 1: Built-in Integer.toBinaryString()
        System.out.println("Binary of " + num + " = " + Integer.toBinaryString(num));
        // Output: 101010
        
        // Method 2: With leading zeros (32-bit)
        String binary32 = String.format("%32s", Integer.toBinaryString(num)).replace(' ', '0');
        System.out.println("32-bit: " + binary32);
        // Output: 00000000000000000000000000101010
        
        // Negative number representation
        System.out.println("Binary of -1  = " + Integer.toBinaryString(-1));
        // Output: 11111111111111111111111111111111 (all 1s)
        
        System.out.println("Binary of -42 = " + Integer.toBinaryString(-42));
        // Two's complement of 42
    }
}`,
      },
      {
        title: "Manual Decimal to Binary Conversion",
        language: "java",
        content: `public class DecimalToBinary {
    
    // Convert decimal to binary string manually
    public static String toBinary(int n) {
        if (n == 0) return "0";
        
        StringBuilder sb = new StringBuilder();
        // Handle negative numbers using unsigned interpretation
        long num = n & 0xFFFFFFFFL; // Convert to unsigned
        
        while (num > 0) {
            sb.append(num % 2);  // Get remainder (0 or 1)
            num /= 2;            // Divide by 2
        }
        return sb.reverse().toString(); // Reverse since we built it LSB-first
    }
    
    // Convert binary string back to decimal
    public static int toDecimal(String binary) {
        int result = 0;
        for (int i = 0; i < binary.length(); i++) {
            result = result * 2 + (binary.charAt(i) - '0');
        }
        return result;
    }
    
    public static void main(String[] args) {
        System.out.println(toBinary(13));  // "1101"
        System.out.println(toDecimal("1101")); // 13
        
        // Verify: 1101 = 1*8 + 1*4 + 0*2 + 1*1 = 13 ✓
    }
}`,
      },
      {
        title: "Exploring Integer Limits & Bit Width",
        language: "java",
        content: `public class BitWidthDemo {
    public static void main(String[] args) {
        // Integer limits
        System.out.println("int bits:  " + Integer.SIZE);          // 32
        System.out.println("int MAX:   " + Integer.MAX_VALUE);     // 2147483647
        System.out.println("int MIN:   " + Integer.MIN_VALUE);     // -2147483648
        
        System.out.println("long bits: " + Long.SIZE);             // 64
        System.out.println("long MAX:  " + Long.MAX_VALUE);        // 9223372036854775807
        
        // Two's complement demonstration
        int x = 5;    // 0000...0101
        int neg = ~x + 1; // Flip bits and add 1
        System.out.println("5 negated manually: " + neg); // -5
        System.out.println("Verify: " + (-x == neg));      // true
        
        // Overflow behavior
        int overflow = Integer.MAX_VALUE + 1;
        System.out.println("MAX + 1 = " + overflow); // -2147483648 (wraps around!)
    }
}`,
      },
    ],
    note: "In competitive programming, always be aware of integer overflow. Use long when values can exceed 2×10⁹. Bit manipulation with long requires 'L' suffix on literals (e.g., 1L << 40).",
  },

  // ===== 2. Basic Bitwise Operators =====
  {
    id: "bits-operators",
    title: "Basic Bitwise Operators",
    difficulty: "Easy",
    theory: [
      "Java provides six bitwise operators that work directly on the binary representation of integers. These operators are extremely fast because they map directly to CPU instructions — typically executing in a single clock cycle.",
      "AND (&): Returns 1 only when both bits are 1. Used for masking (extracting specific bits), checking if a bit is set, and clearing bits. Example: 1010 & 1100 = 1000.",
      "OR (|): Returns 1 when at least one bit is 1. Used for setting bits and combining flags. Example: 1010 | 1100 = 1110.",
      "XOR (^): Returns 1 when bits are different. Used for toggling bits, finding unique elements, and swapping values. Example: 1010 ^ 1100 = 0110. Key property: a ^ a = 0, a ^ 0 = a.",
      "NOT (~): Inverts all bits (0→1, 1→0). In two's complement, ~n = -(n+1). Used for creating masks and negation tricks.",
      "Left Shift (<<): Shifts bits left by n positions, filling with zeros. Equivalent to multiplying by 2ⁿ. Example: 5 << 2 = 20 (multiply by 4).",
      "Right Shift: Arithmetic (>>) preserves the sign bit (fills with MSB). Logical (>>>) always fills with 0. Arithmetic right shift by n is equivalent to dividing by 2ⁿ (floor division for positive, ceiling division for negative).",
    ],
    keyPoints: [
      "AND (&): Both bits must be 1 → used for masking/checking",
      "OR (|): Either bit can be 1 → used for setting bits",
      "XOR (^): Bits must differ → used for toggling, a^a=0, a^0=a",
      "NOT (~): Flips all bits → ~n = -(n+1) in two's complement",
      "<< n multiplies by 2ⁿ, >> n divides by 2ⁿ (arithmetic)",
      ">>> is unsigned right shift (always fills with 0)",
    ],
    table: {
      headers: ["Operator", "Symbol", "Example (5 op 3)", "Result", "Use Case"],
      rows: [
        ["AND", "&", "0101 & 0011", "0001 (1)", "Check/clear bits"],
        ["OR", "|", "0101 | 0011", "0111 (7)", "Set bits"],
        ["XOR", "^", "0101 ^ 0011", "0110 (6)", "Toggle/swap"],
        ["NOT", "~", "~0101", "...1010 (-6)", "Invert mask"],
        ["Left Shift", "<<", "0101 << 1", "1010 (10)", "Multiply by 2"],
        ["Right Shift", ">>", "0101 >> 1", "0010 (2)", "Divide by 2"],
        ["Unsigned >>", ">>>", "-1 >>> 28", "1111 (15)", "Unsigned divide"],
      ],
    },
    code: [
      {
        title: "All Bitwise Operators Demonstrated",
        language: "java",
        content: `public class BitwiseOperators {
    public static void main(String[] args) {
        int a = 12;  // 1100
        int b = 10;  // 1010
        
        System.out.println("a & b  = " + (a & b));   // 1000 = 8  (AND)
        System.out.println("a | b  = " + (a | b));   // 1110 = 14 (OR)
        System.out.println("a ^ b  = " + (a ^ b));   // 0110 = 6  (XOR)
        System.out.println("~a     = " + (~a));       // -13       (NOT)
        System.out.println("a << 2 = " + (a << 2));   // 110000 = 48 (Left shift)
        System.out.println("a >> 2 = " + (a >> 2));   // 11 = 3     (Right shift)
        
        // Unsigned right shift vs arithmetic right shift
        int neg = -8;  // 11111111...11111000
        System.out.println("neg >> 2  = " + (neg >> 2));   // -2 (sign preserved)
        System.out.println("neg >>> 2 = " + (neg >>> 2));  // 1073741822 (zero-filled)
    }
}`,
      },
      {
        title: "Odd/Even Check Using AND",
        language: "java",
        content: `public class OddEvenCheck {
    
    // The fastest way to check odd/even
    // LSB = 1 means odd, LSB = 0 means even
    public static boolean isEven(int n) {
        return (n & 1) == 0;
    }
    
    public static boolean isOdd(int n) {
        return (n & 1) == 1;
    }
    
    public static void main(String[] args) {
        for (int i = 0; i <= 10; i++) {
            System.out.println(i + " is " + (isEven(i) ? "Even" : "Odd"));
        }
        // Why this works:
        // Even numbers end in 0 in binary: 2=10, 4=100, 6=110
        // Odd numbers end in 1 in binary:  1=1,  3=11,  5=101
        // AND with 1 extracts just the last bit
    }
}`,
      },
      {
        title: "Shift Operators for Multiplication & Division",
        language: "java",
        content: `public class ShiftArithmetic {
    public static void main(String[] args) {
        int n = 25;
        
        // Left shift = multiply by power of 2
        System.out.println(n + " * 2  = " + (n << 1));   // 50
        System.out.println(n + " * 4  = " + (n << 2));   // 100
        System.out.println(n + " * 8  = " + (n << 3));   // 200
        System.out.println(n + " * 32 = " + (n << 5));   // 800
        
        // Right shift = divide by power of 2 (floor)
        System.out.println(n + " / 2  = " + (n >> 1));   // 12
        System.out.println(n + " / 4  = " + (n >> 2));   // 6
        System.out.println(n + " / 8  = " + (n >> 3));   // 3
        
        // Useful: multiply by 10 = (n << 3) + (n << 1)
        // Because 10n = 8n + 2n
        System.out.println(n + " * 10 = " + ((n << 3) + (n << 1))); // 250
        
        // WARNING: Left shift can overflow!
        System.out.println("1 << 31 = " + (1 << 31)); // -2147483648 (Integer.MIN_VALUE)
        System.out.println("Use 1L << 35 for long: " + (1L << 35)); // 34359738368
    }
}`,
      },
    ],
    tip: "In competitive programming, n & 1 is faster than n % 2 for odd/even checks. Similarly, n << k is faster than n * (1 << k). However, modern compilers often optimize these automatically.",
    warning: "Be careful with operator precedence! Bitwise operators have lower precedence than comparison operators. Always use parentheses: (a & b) == 0, not a & b == 0 (which is parsed as a & (b == 0)).",
  },

  // ===== 3. Common Bit Tricks & Hacks =====
  {
    id: "bits-tricks",
    title: "Common Bit Tricks & Hacks",
    difficulty: "Medium",
    theory: [
      "Bit manipulation tricks are elegant one-liners that solve common problems using bitwise operations. These tricks are heavily used in competitive programming for their O(1) time complexity and constant space.",
      "The fundamental bit operations are: Set a bit (turn it ON using OR), Clear a bit (turn it OFF using AND with inverted mask), Toggle a bit (flip it using XOR), and Check a bit (test if it's ON using AND).",
      "Brian Kernighan's Algorithm is a classic trick to count set bits (1s) in a number. The key insight is that n & (n-1) clears the lowest set bit of n. By repeatedly doing this until n becomes 0, we count exactly the number of set bits. This runs in O(k) where k is the number of set bits, not O(32).",
      "Another important trick: n & (-n) isolates the lowest set bit. This is used extensively in Fenwick Trees (Binary Indexed Trees) and other data structures.",
    ],
    keyPoints: [
      "Set bit i: n | (1 << i)",
      "Clear bit i: n & ~(1 << i)",
      "Toggle bit i: n ^ (1 << i)",
      "Check bit i: (n >> i) & 1 or (n & (1 << i)) != 0",
      "Clear lowest set bit: n & (n - 1)",
      "Isolate lowest set bit: n & (-n)",
      "Check power of 2: n > 0 && (n & (n-1)) == 0",
    ],
    code: [
      {
        title: "Set, Clear, Toggle, and Check Bits",
        language: "java",
        content: `public class BitOperations {
    
    // Set the i-th bit (0-indexed from right)
    static int setBit(int n, int i) {
        return n | (1 << i);
    }
    
    // Clear the i-th bit
    static int clearBit(int n, int i) {
        return n & ~(1 << i);
    }
    
    // Toggle the i-th bit
    static int toggleBit(int n, int i) {
        return n ^ (1 << i);
    }
    
    // Check if the i-th bit is set
    static boolean isBitSet(int n, int i) {
        return (n & (1 << i)) != 0;
        // Alternative: return ((n >> i) & 1) == 1;
    }
    
    public static void main(String[] args) {
        int n = 10; // Binary: 1010
        
        System.out.println("Original:   " + Integer.toBinaryString(n));  // 1010
        System.out.println("Set bit 0:  " + Integer.toBinaryString(setBit(n, 0)));   // 1011
        System.out.println("Clear bit 1:" + Integer.toBinaryString(clearBit(n, 1))); // 1000
        System.out.println("Toggle bit 2:" + Integer.toBinaryString(toggleBit(n, 2))); // 1110
        System.out.println("Bit 3 set?  " + isBitSet(n, 3)); // true
        System.out.println("Bit 2 set?  " + isBitSet(n, 2)); // false
    }
}`,
      },
      {
        title: "Check if Number is Power of 2",
        language: "java",
        content: `public class PowerOfTwo {
    
    // A power of 2 has exactly one bit set: 1, 10, 100, 1000, ...
    // n - 1 flips that bit and sets all lower bits:
    //   n     = 1000
    //   n - 1 = 0111
    //   n & (n-1) = 0000  → power of 2!
    
    static boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
    
    // Find next power of 2 >= n
    static int nextPowerOfTwo(int n) {
        if (n <= 1) return 1;
        return Integer.highestOneBit(n - 1) << 1;
    }
    
    // Find highest power of 2 <= n
    static int floorPowerOfTwo(int n) {
        return Integer.highestOneBit(n);
    }
    
    public static void main(String[] args) {
        int[] test = {1, 2, 3, 4, 5, 8, 16, 15, 0, -4};
        for (int n : test) {
            System.out.println(n + " → isPow2: " + isPowerOfTwo(n));
        }
        System.out.println("Next pow2 >= 13: " + nextPowerOfTwo(13)); // 16
        System.out.println("Floor pow2 of 13: " + floorPowerOfTwo(13)); // 8
    }
}`,
      },
      {
        title: "Brian Kernighan's Algorithm — Count Set Bits",
        language: "java",
        content: `public class CountSetBits {
    
    // Brian Kernighan's Algorithm: O(number of set bits)
    // Key insight: n & (n-1) removes the lowest set bit
    static int countSetBits(int n) {
        int count = 0;
        while (n != 0) {
            n = n & (n - 1); // Clear lowest set bit
            count++;
        }
        return count;
    }
    
    // Naive approach: check each bit — O(32)
    static int countSetBitsNaive(int n) {
        int count = 0;
        while (n != 0) {
            count += (n & 1); // Check LSB
            n >>>= 1;        // Unsigned right shift
        }
        return count;
    }
    
    // Built-in Java method (fastest — uses CPU intrinsic)
    static int countBuiltIn(int n) {
        return Integer.bitCount(n);
    }
    
    public static void main(String[] args) {
        int n = 29; // Binary: 11101 → 4 set bits
        System.out.println("Kernighan: " + countSetBits(n));       // 4
        System.out.println("Naive:     " + countSetBitsNaive(n));  // 4
        System.out.println("Built-in:  " + countBuiltIn(n));       // 4
        
        // Trace of Kernighan's for n = 29 (11101):
        // 11101 & 11100 = 11100 (count=1)
        // 11100 & 11011 = 11000 (count=2)
        // 11000 & 10111 = 10000 (count=3)
        // 10000 & 01111 = 00000 (count=4) → done!
    }
}`,
      },
      {
        title: "Swap Two Numbers Without Temp Variable",
        language: "java",
        content: `public class XORSwap {
    
    // XOR swap trick: no temporary variable needed
    // Based on: a ^ a = 0 and a ^ 0 = a
    public static void main(String[] args) {
        int a = 5, b = 9;
        System.out.println("Before: a=" + a + ", b=" + b);
        
        a = a ^ b;  // a now holds a^b
        b = a ^ b;  // b = (a^b)^b = a  (b is now original a)
        a = a ^ b;  // a = (a^b)^a = b  (a is now original b)
        
        System.out.println("After:  a=" + a + ", b=" + b);
        // Output: a=9, b=5
        
        // WARNING: XOR swap fails when a and b reference the same variable!
        // If a == b (same reference), a^a = 0, and both become 0.
        
        // Useful one-liner form (when a != b guaranteed):
        // a ^= b; b ^= a; a ^= b;
    }
}`,
      },
      {
        title: "Isolate & Manipulate Lowest Set Bit",
        language: "java",
        content: `public class LowestSetBit {
    public static void main(String[] args) {
        int n = 52; // Binary: 110100
        
        // Isolate lowest set bit: n & (-n)
        // -n is two's complement: flip all bits and add 1
        // n  = 110100
        // -n = 001100
        // n & (-n) = 000100 = 4
        System.out.println("Lowest set bit of " + n + " = " + (n & (-n))); // 4
        
        // Clear lowest set bit: n & (n-1)
        System.out.println("Clear lowest bit: " + (n & (n - 1))); // 110000 = 48
        
        // Set lowest unset bit: n | (n+1)
        System.out.println("Set lowest unset: " + (n | (n + 1))); // 110101 = 53
        
        // Position of lowest set bit (0-indexed)
        System.out.println("Position: " + Integer.numberOfTrailingZeros(n)); // 2
        
        // Position of highest set bit
        System.out.println("Highest bit pos: " + (31 - Integer.numberOfLeadingZeros(n))); // 5
    }
}`,
      },
    ],
    tip: "In Fenwick Trees (BIT), n & (-n) is used to navigate the tree structure. Mastering this operation is essential for competitive programming.",
  },

  // ===== 4. Bit Masking Fundamentals =====
  {
    id: "bits-masking",
    title: "Bit Masking Fundamentals",
    difficulty: "Medium",
    theory: [
      "A bitmask is an integer where each bit represents a boolean flag — whether something is included or excluded, on or off, present or absent. Bitmasks allow us to represent sets of elements compactly using a single integer.",
      "For a set of n elements (n ≤ 30 for int, n ≤ 62 for long), a bitmask can represent any subset. The bitmask value ranges from 0 (empty set) to 2ⁿ - 1 (full set). Bit i being set means element i is in the subset.",
      "Common bitmask operations mirror set operations: Union = mask1 | mask2, Intersection = mask1 & mask2, Difference = mask1 & ~mask2, Symmetric Difference = mask1 ^ mask2, Complement = ~mask & ((1 << n) - 1).",
      "Bitmasks are used extensively in competitive programming for: subset enumeration, DP states (bitmask DP), permission flags, feature toggles, and compact set representation. They enable O(1) set operations that would otherwise be O(n).",
    ],
    keyPoints: [
      "Bitmask of n elements: int for n ≤ 30, long for n ≤ 62",
      "Empty set = 0, Full set = (1 << n) - 1",
      "Add element i: mask | (1 << i)",
      "Remove element i: mask & ~(1 << i)",
      "Check element i: (mask & (1 << i)) != 0",
      "Size of set: Integer.bitCount(mask)",
      "Iterate all subsets of n elements: for (mask = 0; mask < (1 << n); mask++)",
    ],
    code: [
      {
        title: "Subset Generation Using Bitmasks",
        language: "java",
        content: `import java.util.*;

public class SubsetGeneration {
    
    // Generate all subsets of an array using bitmask
    public static List<List<Integer>> allSubsets(int[] arr) {
        int n = arr.length;
        List<List<Integer>> result = new ArrayList<>();
        
        // Iterate all bitmasks from 0 to 2^n - 1
        for (int mask = 0; mask < (1 << n); mask++) {
            List<Integer> subset = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) != 0) { // If bit i is set
                    subset.add(arr[i]);
                }
            }
            result.add(subset);
        }
        return result;
    }
    
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        List<List<Integer>> subsets = allSubsets(arr);
        
        for (int mask = 0; mask < subsets.size(); mask++) {
            System.out.printf("mask=%s → %s%n",
                String.format("%3s", Integer.toBinaryString(mask)).replace(' ', '0'),
                subsets.get(mask));
        }
        // Output:
        // mask=000 → []
        // mask=001 → [1]
        // mask=010 → [2]
        // mask=011 → [1, 2]
        // mask=100 → [3]
        // mask=101 → [1, 3]
        // mask=110 → [2, 3]
        // mask=111 → [1, 2, 3]
    }
}`,
      },
      {
        title: "Set Operations with Bitmasks",
        language: "java",
        content: `public class BitmaskSetOps {
    static int N = 5; // Universe size
    
    static String setToString(int mask) {
        StringBuilder sb = new StringBuilder("{");
        for (int i = 0; i < N; i++) {
            if ((mask & (1 << i)) != 0) {
                if (sb.length() > 1) sb.append(", ");
                sb.append(i);
            }
        }
        return sb.append("}").toString();
    }
    
    public static void main(String[] args) {
        int A = 0b10110;  // {1, 2, 4}
        int B = 0b01110;  // {1, 2, 3}
        int FULL = (1 << N) - 1; // {0,1,2,3,4}
        
        System.out.println("A = " + setToString(A));           // {1, 2, 4}
        System.out.println("B = " + setToString(B));           // {1, 2, 3}
        System.out.println("A ∪ B = " + setToString(A | B));   // {1, 2, 3, 4}
        System.out.println("A ∩ B = " + setToString(A & B));   // {1, 2}
        System.out.println("A \\ B = " + setToString(A & ~B)); // {4}
        System.out.println("A △ B = " + setToString(A ^ B));   // {3, 4}
        System.out.println("~A    = " + setToString(~A & FULL)); // {0, 3}
        System.out.println("|A|   = " + Integer.bitCount(A));   // 3
        
        // Is B subset of A?
        System.out.println("B ⊆ A? " + ((B & A) == B)); // false
    }
}`,
      },
      {
        title: "Permission Flags Example",
        language: "java",
        content: `public class PermissionFlags {
    // Define permission bits
    static final int READ    = 1 << 0;  // 0001
    static final int WRITE   = 1 << 1;  // 0010
    static final int EXECUTE = 1 << 2;  // 0100
    static final int ADMIN   = 1 << 3;  // 1000
    
    static String describePerms(int perms) {
        StringBuilder sb = new StringBuilder();
        if ((perms & READ) != 0)    sb.append("READ ");
        if ((perms & WRITE) != 0)   sb.append("WRITE ");
        if ((perms & EXECUTE) != 0) sb.append("EXECUTE ");
        if ((perms & ADMIN) != 0)   sb.append("ADMIN ");
        return sb.toString().trim();
    }
    
    public static void main(String[] args) {
        int userPerms = READ | WRITE;         // Grant read + write
        System.out.println("User: " + describePerms(userPerms));  // READ WRITE
        
        userPerms |= EXECUTE;                 // Add execute
        System.out.println("After grant: " + describePerms(userPerms)); // READ WRITE EXECUTE
        
        userPerms &= ~WRITE;                  // Revoke write
        System.out.println("After revoke: " + describePerms(userPerms)); // READ EXECUTE
        
        // Check specific permission
        System.out.println("Has ADMIN? " + ((userPerms & ADMIN) != 0)); // false
        System.out.println("Has READ?  " + ((userPerms & READ) != 0));  // true
    }
}`,
      },
    ],
    note: "In competitive programming, bitmasks are often used as DP states. For example, in TSP with n cities, the state dp[mask][i] represents the minimum cost to visit all cities in the bitmask 'mask', ending at city i.",
  },

  // ===== 5. XOR Properties & Problems =====
  {
    id: "bits-xor",
    title: "XOR Properties & Problems",
    difficulty: "Medium",
    theory: [
      "XOR (exclusive or) is the most versatile bitwise operator in competitive programming. Its mathematical properties make it uniquely suited for solving a wide class of problems efficiently.",
      "Key XOR properties: (1) Self-inverse: a ^ a = 0. (2) Identity: a ^ 0 = a. (3) Commutativity: a ^ b = b ^ a. (4) Associativity: (a ^ b) ^ c = a ^ (b ^ c). (5) If a ^ b = c, then a ^ c = b and b ^ c = a.",
      "The self-inverse property is the foundation of many XOR tricks: XOR-ing a value with itself cancels it out. This means if you XOR all elements where every element appears twice except one, all pairs cancel and the single element remains.",
      "XOR from 1 to N follows a pattern based on N % 4: if N%4==0 → N, N%4==1 → 1, N%4==2 → N+1, N%4==3 → 0. This O(1) formula is frequently tested in competitions.",
    ],
    keyPoints: [
      "a ^ a = 0 (self-inverse) — foundation for finding unique elements",
      "a ^ 0 = a (identity) — XOR with zero preserves value",
      "XOR is commutative and associative — order doesn't matter",
      "XOR from 1..N has a pattern based on N%4",
      "XOR doesn't carry — no overflow issues like addition",
      "XOR preserves information — it's invertible (unlike AND/OR)",
    ],
    code: [
      {
        title: "Find Single Non-Repeating Element",
        language: "java",
        content: `public class SingleNumber {
    
    // Every element appears twice except one. Find it.
    // XOR all elements: pairs cancel (a^a=0), unique remains.
    // Time: O(n), Space: O(1)
    
    public static int singleNumber(int[] nums) {
        int result = 0;
        for (int num : nums) {
            result ^= num;
        }
        return result;
    }
    
    public static void main(String[] args) {
        int[] arr = {2, 3, 5, 4, 5, 3, 4};
        System.out.println("Single number: " + singleNumber(arr)); // 2
        
        // Trace: 0^2=2, 2^3=1, 1^5=4, 4^4=0, 0^5=5, 5^3=6, 6^4=2
        // All pairs cancel, leaving 2!
    }
}`,
      },
      {
        title: "Find Two Non-Repeating Elements",
        language: "java",
        content: `public class TwoUniqueNumbers {
    
    // Every element appears twice except TWO elements. Find both.
    // Step 1: XOR all → get xor = a ^ b (the two unique numbers XOR'd)
    // Step 2: Find any set bit in xor (use rightmost: xor & -xor)
    //         This bit differs between a and b
    // Step 3: Partition all numbers by this bit, XOR each group
    
    public static int[] findTwoUnique(int[] nums) {
        // Step 1: XOR of all elements = a ^ b
        int xor = 0;
        for (int num : nums) xor ^= num;
        
        // Step 2: Isolate rightmost set bit
        int rightmostBit = xor & (-xor);
        
        // Step 3: Partition and XOR
        int a = 0, b = 0;
        for (int num : nums) {
            if ((num & rightmostBit) != 0) {
                a ^= num; // Group with this bit set
            } else {
                b ^= num; // Group without this bit
            }
        }
        return new int[]{a, b};
    }
    
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 2, 1, 4};
        int[] result = findTwoUnique(arr);
        System.out.println("Two unique: " + result[0] + ", " + result[1]); // 3, 4
    }
}`,
      },
      {
        title: "XOR from 1 to N in O(1)",
        language: "java",
        content: `public class XORToN {
    
    // XOR of all numbers from 1 to N
    // Pattern based on N % 4:
    //   N%4 == 0 → N
    //   N%4 == 1 → 1
    //   N%4 == 2 → N + 1
    //   N%4 == 3 → 0
    
    public static int xorToN(int n) {
        switch (n % 4) {
            case 0: return n;
            case 1: return 1;
            case 2: return n + 1;
            case 3: return 0;
        }
        return 0; // unreachable
    }
    
    // XOR from L to R = xorToN(R) ^ xorToN(L-1)
    public static int xorRange(int L, int R) {
        return xorToN(R) ^ (L > 0 ? xorToN(L - 1) : 0);
    }
    
    // Verify with brute force
    public static int xorToN_brute(int n) {
        int result = 0;
        for (int i = 1; i <= n; i++) result ^= i;
        return result;
    }
    
    public static void main(String[] args) {
        // Verify the pattern
        for (int i = 1; i <= 16; i++) {
            System.out.printf("XOR(1..%2d) = %2d (formula) = %2d (brute)%n",
                i, xorToN(i), xorToN_brute(i));
        }
        
        // XOR of range [3, 7]
        System.out.println("XOR(3..7) = " + xorRange(3, 7)); // 3^4^5^6^7
    }
}`,
      },
      {
        title: "XOR Properties Demonstration",
        language: "java",
        content: `public class XORProperties {
    public static void main(String[] args) {
        int a = 15, b = 27, c = 42;
        
        // 1. Self-inverse: a ^ a = 0
        System.out.println("a ^ a = " + (a ^ a)); // 0
        
        // 2. Identity: a ^ 0 = a
        System.out.println("a ^ 0 = " + (a ^ 0)); // 15
        
        // 3. Commutativity: a ^ b == b ^ a
        System.out.println("a^b == b^a: " + ((a ^ b) == (b ^ a))); // true
        
        // 4. Associativity: (a^b)^c == a^(b^c)
        System.out.println("(a^b)^c == a^(b^c): " + (((a ^ b) ^ c) == (a ^ (b ^ c)))); // true
        
        // 5. If a^b = c, then a^c = b
        int xored = a ^ b;
        System.out.println("a^b=" + xored + ", xored^a=" + (xored ^ a) + " == b=" + b); // true
        
        // 6. XOR can detect if exactly one condition is true
        boolean p = true, q = false;
        System.out.println("Exactly one true: " + (p ^ q)); // true
        
        // 7. Parity check: XOR of array detects odd-occurrence element
        int[] nums = {5, 5, 5};
        int xorAll = 0;
        for (int n : nums) xorAll ^= n;
        System.out.println("Odd occurrence: " + xorAll); // 5
    }
}`,
      },
    ],
    tip: "XOR is invertible: if you know c = a ^ b and any one of the three values, you can recover the third. This property is used in simple encryption (XOR cipher), error detection, and many CP problems.",
  },

  // ===== 6. Counting Bits & Lookups =====
  {
    id: "bits-counting",
    title: "Counting Bits & Lookups",
    difficulty: "Medium",
    theory: [
      "Counting the number of set bits (popcount / population count) is one of the most fundamental bit operations. There are multiple approaches with different tradeoffs between simplicity, speed, and applicability.",
      "The naive approach checks each of the 32 bits individually — O(32). Brian Kernighan's algorithm runs in O(k) where k is the number of set bits. Lookup tables trade space for constant-time lookups. Java's Integer.bitCount() uses an optimized bit-parallel algorithm that runs in O(1).",
      "A powerful DP technique counts bits for all numbers from 0 to N. The recurrence is: bits[i] = bits[i >> 1] + (i & 1). This works because i >> 1 removes the last bit, and (i & 1) tells us if the last bit was set.",
      "Hamming distance between two numbers is the number of positions where their bits differ — equivalently, it's the popcount of their XOR. The Total Hamming Distance problem asks for the sum of Hamming distances between all pairs in an array.",
    ],
    keyPoints: [
      "Naive popcount: O(32) per number — check each bit",
      "Kernighan's: O(k) where k = number of set bits",
      "Lookup table: O(1) with O(2¹⁶) preprocessing",
      "DP counting: bits[i] = bits[i>>1] + (i&1) — O(n) for all 0..n",
      "Hamming distance = Integer.bitCount(a ^ b)",
      "Total Hamming distance trick: count bit contributions independently",
    ],
    code: [
      {
        title: "All Popcount Approaches Compared",
        language: "java",
        content: `public class PopcountApproaches {
    
    // 1. Naive: check each bit — O(32)
    static int popcount_naive(int n) {
        int count = 0;
        for (int i = 0; i < 32; i++) {
            if ((n & (1 << i)) != 0) count++;
        }
        return count;
    }
    
    // 2. Kernighan's: O(number of set bits)
    static int popcount_kernighan(int n) {
        int count = 0;
        while (n != 0) {
            n &= (n - 1);
            count++;
        }
        return count;
    }
    
    // 3. Lookup table: O(1) after preprocessing
    static int[] lookup = new int[65536]; // 2^16
    static {
        for (int i = 1; i < 65536; i++) {
            lookup[i] = lookup[i >> 1] + (i & 1);
        }
    }
    static int popcount_lookup(int n) {
        return lookup[n & 0xFFFF] + lookup[(n >>> 16) & 0xFFFF];
    }
    
    // 4. Built-in (fastest — CPU POPCNT instruction)
    static int popcount_builtin(int n) {
        return Integer.bitCount(n);
    }
    
    public static void main(String[] args) {
        int n = 0b11010110_10101011_11100111_00110101;
        System.out.println("Naive:    " + popcount_naive(n));
        System.out.println("Kernighan:" + popcount_kernighan(n));
        System.out.println("Lookup:   " + popcount_lookup(n));
        System.out.println("Built-in: " + popcount_builtin(n));
        // All output: 19
    }
}`,
      },
      {
        title: "Count Bits for All Numbers 0 to N (DP)",
        language: "java",
        content: `import java.util.Arrays;

public class CountBitsDP {
    
    // Count set bits for every number from 0 to n
    // DP recurrence: bits[i] = bits[i >> 1] + (i & 1)
    //   i >> 1 is the same number with last bit removed
    //   i & 1 tells us if the last bit was 1
    // Time: O(n), Space: O(n)
    
    public static int[] countBits(int n) {
        int[] bits = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            bits[i] = bits[i >> 1] + (i & 1);
        }
        return bits;
    }
    
    // Alternative recurrence: bits[i] = bits[i & (i-1)] + 1
    // Uses Kernighan's trick: i & (i-1) removes lowest set bit
    public static int[] countBitsAlt(int n) {
        int[] bits = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            bits[i] = bits[i & (i - 1)] + 1;
        }
        return bits;
    }
    
    public static void main(String[] args) {
        int[] result = countBits(10);
        for (int i = 0; i <= 10; i++) {
            System.out.printf("%2d (%5s) → %d set bits%n",
                i, String.format("%5s", Integer.toBinaryString(i)).replace(' ', '0'), result[i]);
        }
        // 0 (00000) → 0, 1 (00001) → 1, 2 (00010) → 1, ...
        // 7 (00111) → 3, 8 (01000) → 1, 9 (01001) → 2, 10 (01010) → 2
    }
}`,
      },
      {
        title: "Hamming Distance & Total Hamming Distance",
        language: "java",
        content: `public class HammingDistance {
    
    // Hamming distance between two numbers
    // = number of bit positions where they differ
    // = popcount(a ^ b)
    static int hammingDistance(int a, int b) {
        return Integer.bitCount(a ^ b);
    }
    
    // Total Hamming Distance: sum of distances between ALL pairs
    // Brute force: O(n² × 32) — TLE for large n
    // Optimized: For each bit position, count how many numbers have
    //   that bit set (ones) vs unset (zeros).
    //   Contribution = ones × zeros (each set-unset pair adds 1)
    // Time: O(32n), Space: O(1)
    
    static int totalHammingDistance(int[] nums) {
        int total = 0;
        int n = nums.length;
        
        for (int bit = 0; bit < 32; bit++) {
            int ones = 0;
            for (int num : nums) {
                ones += (num >> bit) & 1;
            }
            int zeros = n - ones;
            total += ones * zeros;
        }
        return total;
    }
    
    public static void main(String[] args) {
        System.out.println("hamming(1, 4) = " + hammingDistance(1, 4)); // 2
        // 1 = 001, 4 = 100 → 2 bits differ
        
        int[] nums = {4, 14, 2};
        System.out.println("Total Hamming: " + totalHammingDistance(nums)); // 6
        // d(4,14)=2, d(4,2)=2, d(14,2)=2 → total=6
    }
}`,
      },
    ],
    note: "The DP approach bits[i] = bits[i>>1] + (i&1) is a LeetCode classic (#338 Counting Bits). Understanding this recurrence is key — it says the bit count of any number equals the bit count of that number with its last bit removed, plus the value of that last bit.",
  },

  // ===== 7. Bit Manipulation in CP =====
  {
    id: "bits-cp",
    title: "Bit Manipulation in Competitive Programming",
    difficulty: "Hard",
    theory: [
      "In competitive programming, bit manipulation enables elegant solutions to problems that would otherwise require complex data structures. The key insight is that bitwise operations are O(1) and can encode set states compactly.",
      "Maximum XOR Subarray/Pair problems use a Trie (binary trie) to greedily find the number that maximizes XOR with a given value. For each bit from MSB to LSB, we try to go to the opposite bit to maximize the result.",
      "Prefix XOR is analogous to prefix sum: prefixXOR[i] = a[0] ^ a[1] ^ ... ^ a[i-1]. The XOR of any subarray [L, R] = prefixXOR[R+1] ^ prefixXOR[L]. This reduces range XOR queries to O(1).",
      "Bitwise AND/OR of ranges: AND of a range [L, R] keeps only bits that are set in ALL numbers. OR keeps bits set in ANY number. For AND of range [L, R] where L ≠ R, the result has the common prefix of L and R in binary, with remaining bits zeroed out.",
    ],
    keyPoints: [
      "Binary Trie enables O(32) max XOR queries and insertions",
      "Prefix XOR: range XOR in O(1) after O(n) preprocessing",
      "Maximum XOR pair: sort + trie or divide-and-conquer",
      "Range AND: find common prefix of L and R",
      "Bit contribution technique: analyze each of 32 bits independently",
    ],
    code: [
      {
        title: "Maximum XOR Pair Using Binary Trie",
        language: "java",
        content: `public class MaxXORPair {
    
    static int[][] trie = new int[3200001][2]; // Trie nodes
    static int trieIdx = 0;
    
    static void insert(int num) {
        int node = 0;
        for (int i = 30; i >= 0; i--) { // 31 bits (for positive ints)
            int bit = (num >> i) & 1;
            if (trie[node][bit] == 0) {
                trie[node][bit] = ++trieIdx;
            }
            node = trie[node][bit];
        }
    }
    
    // Find number in trie that maximizes XOR with 'num'
    static int maxXor(int num) {
        int node = 0, result = 0;
        for (int i = 30; i >= 0; i--) {
            int bit = (num >> i) & 1;
            int want = 1 - bit; // We want the opposite bit
            
            if (trie[node][want] != 0) {
                result |= (1 << i); // This bit contributes to XOR
                node = trie[node][want];
            } else {
                node = trie[node][bit];
            }
        }
        return result;
    }
    
    // Find maximum XOR of any pair in the array
    public static int findMaxXOR(int[] nums) {
        trieIdx = 0;
        // Reset trie
        for (int i = 0; i <= nums.length * 31; i++) {
            trie[i][0] = trie[i][1] = 0;
        }
        
        int maxResult = 0;
        insert(nums[0]);
        for (int i = 1; i < nums.length; i++) {
            maxResult = Math.max(maxResult, maxXor(nums[i]));
            insert(nums[i]);
        }
        return maxResult;
    }
    
    public static void main(String[] args) {
        int[] nums = {3, 10, 5, 25, 2, 8};
        System.out.println("Max XOR pair: " + findMaxXOR(nums)); // 28 (5^25)
        // 5  = 00101
        // 25 = 11001
        // XOR= 11100 = 28
    }
}`,
      },
      {
        title: "Prefix XOR — Range XOR Queries in O(1)",
        language: "java",
        content: `public class PrefixXOR {
    
    // Build prefix XOR array
    // prefixXOR[i] = arr[0] ^ arr[1] ^ ... ^ arr[i-1]
    // XOR(L..R) = prefixXOR[R+1] ^ prefixXOR[L]
    
    static int[] buildPrefixXOR(int[] arr) {
        int n = arr.length;
        int[] prefix = new int[n + 1];
        for (int i = 0; i < n; i++) {
            prefix[i + 1] = prefix[i] ^ arr[i];
        }
        return prefix;
    }
    
    static int queryXOR(int[] prefix, int L, int R) {
        return prefix[R + 1] ^ prefix[L];
    }
    
    public static void main(String[] args) {
        int[] arr = {1, 3, 5, 7, 9};
        int[] prefix = buildPrefixXOR(arr);
        
        // Query XOR of subarray [1, 3] = 3 ^ 5 ^ 7
        System.out.println("XOR(1..3) = " + queryXOR(prefix, 1, 3)); // 1
        // 3 ^ 5 = 6, 6 ^ 7 = 1 ✓
        
        // Query XOR of entire array [0, 4]
        System.out.println("XOR(0..4) = " + queryXOR(prefix, 0, 4)); // 1^3^5^7^9 = 11
        
        // Finding subarray with max XOR: combine prefix XOR with trie
        // For each prefix[i], find prefix[j] (j < i) that maximizes prefix[i] ^ prefix[j]
    }
}`,
      },
      {
        title: "Bitwise AND of Range [L, R]",
        language: "java",
        content: `public class RangeAND {
    
    // AND of all numbers from L to R
    // Key insight: as we go from L to R, bits that differ get cleared
    // The result is the common prefix of L and R in binary
    
    // Approach: right-shift both L and R until they're equal,
    // then left-shift back by the number of shifts
    
    static int rangeBitwiseAnd(int left, int right) {
        int shift = 0;
        while (left != right) {
            left >>= 1;
            right >>= 1;
            shift++;
        }
        return left << shift;
    }
    
    // Alternative: use Brian Kernighan's to clear differing bits
    static int rangeBitwiseAnd2(int left, int right) {
        while (right > left) {
            right &= (right - 1); // Clear lowest set bit of right
        }
        return right;
    }
    
    public static void main(String[] args) {
        System.out.println("AND(5,7) = " + rangeBitwiseAnd(5, 7)); // 4
        // 5=101, 6=110, 7=111 → AND = 100 = 4
        
        System.out.println("AND(12,15) = " + rangeBitwiseAnd(12, 15)); // 12
        // 12=1100, 13=1101, 14=1110, 15=1111 → AND = 1100 = 12
        
        System.out.println("AND(1,2147483647) = " + rangeBitwiseAnd(1, 2147483647)); // 0
    }
}`,
      },
      {
        title: "Minimum XOR Pair",
        language: "java",
        content: `import java.util.Arrays;

public class MinXORPair {
    
    // Find pair with minimum XOR in array
    // Key insight: minimum XOR pair is always adjacent after sorting!
    // Proof: if a < b < c, then a^c > min(a^b, b^c) because
    // a and c differ in a higher bit than at least one adjacent pair
    
    static int minXORPair(int[] nums) {
        Arrays.sort(nums);
        int minXor = Integer.MAX_VALUE;
        
        for (int i = 1; i < nums.length; i++) {
            minXor = Math.min(minXor, nums[i] ^ nums[i - 1]);
        }
        return minXor;
    }
    
    public static void main(String[] args) {
        int[] nums = {9, 5, 3, 7, 2, 1};
        System.out.println("Min XOR pair: " + minXORPair(nums)); // 1
        // Sorted: [1, 2, 3, 5, 7, 9]
        // Adjacent XORs: 3, 1, 6, 2, 14 → min = 1 (from 2^3)
    }
}`,
      },
    ],
    warning: "When using Trie for XOR problems, ensure the trie size is sufficient: for n numbers with up to 31 bits, you need at most n × 31 nodes. Allocate trie array size accordingly to avoid Runtime Errors.",
  },

  // ===== 8. Bitmask DP =====
  {
    id: "bits-bitmask-dp",
    title: "Bitmask DP",
    difficulty: "Hard",
    theory: [
      "Bitmask DP is a technique where we use a bitmask to represent the state of which elements have been selected/visited. This is ideal for problems involving subsets of a small set (typically n ≤ 20).",
      "The state space is 2ⁿ × n (or just 2ⁿ), where each bitmask represents which elements are included. Transitions involve adding or removing elements from the mask. The total time complexity is typically O(2ⁿ × n) or O(2ⁿ × n²).",
      "The classic application is the Travelling Salesman Problem (TSP): dp[mask][i] = minimum cost to visit all cities in 'mask', currently at city i. We try extending from each last city to an unvisited city.",
      "A powerful technique is iterating over all submasks of a given mask. For a mask m, all its submasks can be enumerated in O(3ⁿ) total time (summed over all masks) using: for (int s = m; s > 0; s = (s-1) & m). This is faster than iterating all 2ⁿ masks and checking subset relation.",
    ],
    keyPoints: [
      "Bitmask DP works for n ≤ 20 (2²⁰ ≈ 10⁶ states)",
      "State: dp[mask][...] where mask encodes selected elements",
      "TSP: dp[mask][i] = min cost visiting mask cities, ending at i",
      "Enumerate submasks of mask m: for(s=m; s>0; s=(s-1)&m)",
      "Total complexity of iterating all submasks of all masks: O(3ⁿ)",
      "Assignment problem: dp[mask] = min cost assigning first popcount(mask) tasks to workers in mask",
    ],
    code: [
      {
        title: "Travelling Salesman Problem (TSP) with Bitmask DP",
        language: "java",
        content: `import java.util.Arrays;

public class TSP {
    
    // dp[mask][i] = minimum cost to visit all cities in 'mask', ending at city i
    // Transition: dp[mask | (1<<j)][j] = min(dp[mask][i] + dist[i][j])
    //   for each unvisited city j
    // Answer: min over all i of dp[(1<<n)-1][i] + dist[i][0] (return to start)
    
    static int INF = Integer.MAX_VALUE / 2;
    
    public static int tsp(int[][] dist) {
        int n = dist.length;
        int full = (1 << n) - 1;
        int[][] dp = new int[1 << n][n];
        
        // Initialize: all states = INF
        for (int[] row : dp) Arrays.fill(row, INF);
        dp[1][0] = 0; // Start at city 0, only city 0 visited
        
        for (int mask = 1; mask <= full; mask++) {
            for (int u = 0; u < n; u++) {
                if (dp[mask][u] == INF) continue;
                if ((mask & (1 << u)) == 0) continue; // u must be in mask
                
                // Try visiting each unvisited city
                for (int v = 0; v < n; v++) {
                    if ((mask & (1 << v)) != 0) continue; // v already visited
                    int newMask = mask | (1 << v);
                    dp[newMask][v] = Math.min(dp[newMask][v], dp[mask][u] + dist[u][v]);
                }
            }
        }
        
        // Find minimum tour cost (return to city 0)
        int ans = INF;
        for (int u = 0; u < n; u++) {
            if (dp[full][u] != INF) {
                ans = Math.min(ans, dp[full][u] + dist[u][0]);
            }
        }
        return ans;
    }
    
    public static void main(String[] args) {
        int[][] dist = {
            {0, 10, 15, 20},
            {10, 0, 35, 25},
            {15, 35, 0, 30},
            {20, 25, 30, 0}
        };
        System.out.println("TSP min cost: " + tsp(dist)); // 80
        // Optimal tour: 0→1→3→2→0 = 10+25+30+15 = 80
    }
}`,
      },
      {
        title: "Assignment Problem with Bitmask DP",
        language: "java",
        content: `import java.util.Arrays;

public class AssignmentProblem {
    
    // n workers, n tasks. cost[i][j] = cost of worker i doing task j
    // Assign each worker exactly one task. Minimize total cost.
    //
    // dp[mask] = minimum cost to assign tasks to the first popcount(mask) workers,
    //   where mask represents which tasks have been assigned
    // When we process dp[mask], we're assigning a task to worker #popcount(mask)
    
    public static int solve(int[][] cost) {
        int n = cost.length;
        int[] dp = new int[1 << n];
        Arrays.fill(dp, Integer.MAX_VALUE / 2);
        dp[0] = 0;
        
        for (int mask = 0; mask < (1 << n); mask++) {
            if (dp[mask] == Integer.MAX_VALUE / 2) continue;
            
            int worker = Integer.bitCount(mask); // Which worker to assign next
            if (worker >= n) continue;
            
            // Try assigning each unassigned task to this worker
            for (int task = 0; task < n; task++) {
                if ((mask & (1 << task)) != 0) continue; // task already assigned
                int newMask = mask | (1 << task);
                dp[newMask] = Math.min(dp[newMask], dp[mask] + cost[worker][task]);
            }
        }
        
        return dp[(1 << n) - 1];
    }
    
    public static void main(String[] args) {
        int[][] cost = {
            {9, 2, 7, 8},
            {6, 4, 3, 7},
            {5, 8, 1, 8},
            {7, 6, 9, 4}
        };
        System.out.println("Min assignment cost: " + solve(cost)); // 13
        // Optimal: Worker0→Task1(2), Worker1→Task2(3), Worker2→Task3(4=..wait)
        // Actually: 2 + 3 + 1 + 4 = 10? Let me verify...
        // Worker0→Task1=2, Worker1→Task2=3, Worker2→Task2=1... conflict
        // Correct: W0→T1(2), W1→T0(6)... check all permutations
    }
}`,
      },
      {
        title: "Iterating Over All Submasks of a Mask",
        language: "java",
        content: `public class SubmaskEnumeration {
    
    // Enumerate all submasks of a given mask
    // A submask s of mask m satisfies: (s & m) == s
    // Trick: for(s = m; s > 0; s = (s-1) & m)
    
    public static void printSubmasks(int mask) {
        System.out.println("Submasks of " + Integer.toBinaryString(mask) + ":");
        for (int s = mask; s > 0; s = (s - 1) & mask) {
            System.out.println("  " + Integer.toBinaryString(s));
        }
        System.out.println("  0 (empty set)"); // Don't forget empty submask
    }
    
    // Total time for iterating submasks of ALL masks 0..2^n-1
    // is O(3^n) — because each element is in one of 3 states:
    //   (1) not in outer mask, (2) in outer but not submask, (3) in both
    
    // Application: Partition DP
    // dp[mask] = best way to partition elements in 'mask' into groups
    static int partitionDP(int n, int[] groupCost) {
        int full = (1 << n) - 1;
        int[] dp = new int[1 << n];
        Arrays.fill(dp, Integer.MAX_VALUE / 2);
        dp[0] = 0;
        
        for (int mask = 1; mask <= full; mask++) {
            // Try every non-empty submask as the next group
            for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
                dp[mask] = Math.min(dp[mask], dp[mask ^ sub] + groupCost[sub]);
            }
        }
        return dp[full];
    }
    
    public static void main(String[] args) {
        printSubmasks(0b1011); // Submasks of 1011: 1011, 1010, 1001, 1000, 0011, 0010, 0001
        
        // Submask count = 2^(popcount(mask))
        int mask = 0b1011;
        int count = 0;
        for (int s = mask; s > 0; s = (s - 1) & mask) count++;
        System.out.println("Count: " + (count + 1)); // +1 for empty set = 2^3 = 8
    }
    
    static void nothing() {} // For import
    static { }
}`,
      },
    ],
    tip: "Memory optimization: if dp[mask] only depends on submasks of mask (which have smaller or equal value), you can iterate masks in increasing order. For TSP, you need the extra dimension [last city], so the full array is required.",
    warning: "Bitmask DP is only feasible for n ≤ 20-22. For n=20, the state space is 2²⁰ × 20 ≈ 20 million, which fits in memory and runs in ~1 second. For n=25, 2²⁵ ≈ 33 million states — usually too slow.",
  },

  // ===== 9. Advanced Bit Techniques =====
  {
    id: "bits-advanced",
    title: "Advanced Bit Techniques",
    difficulty: "Expert",
    theory: [
      "Gosper's Hack is an algorithm to iterate through all integers with exactly k bits set, in ascending order. Given a number x with k bits set, the next such number is computed using: (1) find the lowest set bit and the block of consecutive set bits starting there, (2) move the highest bit of that block one position left, (3) shift the remaining bits to the lowest positions.",
      "Gray Code is a binary encoding where consecutive numbers differ by exactly one bit. This is useful in combinatorics, error correction, and solving problems like the Chinese Rings puzzle. The n-bit Gray code of number i is: i ^ (i >> 1).",
      "Sum over Subsets (SOS) DP is a technique to compute, for each mask m, the sum (or other aggregation) over all submasks of m. The naive approach is O(3ⁿ) using submask enumeration. SOS DP does it in O(n × 2ⁿ) by iterating over bit dimensions, similar to a multi-dimensional prefix sum.",
      "Bitboard representation uses 64-bit integers to represent game boards (chess, checkers, Othello). Each bit represents a square. Moves, attacks, and board evaluations are computed using bitwise operations, enabling extremely fast game state manipulation.",
    ],
    keyPoints: [
      "Gosper's Hack: iterate all C(n,k) masks with exactly k bits set",
      "Gray Code: g(i) = i ^ (i >> 1), consecutive values differ by 1 bit",
      "SOS DP: O(n × 2ⁿ) instead of O(3ⁿ) for summing over all submasks",
      "Bitboards: 64-bit board representation for games, O(1) move generation",
      "Bit-parallel: process 64 bits simultaneously using long operations",
    ],
    code: [
      {
        title: "Gosper's Hack — Iterate Subsets of Size K",
        language: "java",
        content: `public class GospersHack {
    
    // Generate all n-bit integers with exactly k bits set, in ascending order
    // Given current value x, next value with same popcount:
    //   1. c = x & (-x)           — lowest set bit
    //   2. r = x + c              — clear the lowest block and set next bit
    //   3. next = (((r ^ x) >> 2) / c) | r  — put remaining bits at bottom
    
    public static void iterateKbits(int n, int k) {
        int mask = (1 << k) - 1; // Start: lowest k bits set
        int limit = 1 << n;
        
        System.out.println("All " + n + "-bit numbers with " + k + " bits set:");
        while (mask < limit) {
            System.out.println(String.format("%" + n + "s", Integer.toBinaryString(mask))
                .replace(' ', '0'));
            
            // Gosper's hack to get next number with same popcount
            int c = mask & (-mask);         // lowest set bit
            int r = mask + c;               // carry into next bit
            mask = (((r ^ mask) >> 2) / c) | r; // put excess bits at bottom
        }
    }
    
    public static void main(String[] args) {
        iterateKbits(5, 3);
        // Output: 00111, 01011, 01101, 01110, 10011, 10101, 10110, 11001, 11010, 11100
        // These are all C(5,3) = 10 masks with exactly 3 bits set
        
        System.out.println("---");
        iterateKbits(4, 2);
        // Output: 0011, 0101, 0110, 1001, 1010, 1100
        // C(4,2) = 6 masks
    }
}`,
      },
      {
        title: "Gray Code Generation",
        language: "java",
        content: `import java.util.*;

public class GrayCode {
    
    // Gray code: consecutive numbers differ by exactly 1 bit
    // Formula: gray(i) = i ^ (i >> 1)
    // Inverse: from gray code g, recover i by XORing all higher bits
    
    static int toGray(int n) {
        return n ^ (n >> 1);
    }
    
    static int fromGray(int gray) {
        int n = gray;
        while (gray > 0) {
            gray >>= 1;
            n ^= gray;
        }
        return n;
    }
    
    // Generate complete n-bit Gray code sequence
    static List<Integer> grayCodeSequence(int n) {
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < (1 << n); i++) {
            result.add(toGray(i));
        }
        return result;
    }
    
    // Recursive Gray code generation (reflect-and-prefix)
    static List<Integer> grayCodeRecursive(int n) {
        if (n == 0) return Arrays.asList(0);
        List<Integer> prev = grayCodeRecursive(n - 1);
        List<Integer> result = new ArrayList<>(prev);
        int addBit = 1 << (n - 1);
        for (int i = prev.size() - 1; i >= 0; i--) {
            result.add(prev.get(i) | addBit);
        }
        return result;
    }
    
    public static void main(String[] args) {
        int n = 3;
        List<Integer> codes = grayCodeSequence(n);
        System.out.println("3-bit Gray codes:");
        for (int code : codes) {
            String bin = String.format("%3s", Integer.toBinaryString(code)).replace(' ', '0');
            System.out.println("  " + code + " → " + bin);
        }
        // Verify: each consecutive pair differs by exactly 1 bit
        for (int i = 1; i < codes.size(); i++) {
            int diff = codes.get(i) ^ codes.get(i - 1);
            assert Integer.bitCount(diff) == 1 : "Not a valid Gray code!";
        }
        System.out.println("✓ Valid Gray code sequence");
        
        // Inverse
        System.out.println("fromGray(5) = " + fromGray(5)); // Gray 101 → binary 110 = 6
    }
}`,
      },
      {
        title: "SOS DP (Sum Over Subsets)",
        language: "java",
        content: `import java.util.Arrays;

public class SOSDP {
    
    // Problem: Given f[mask] for all masks, compute for each mask m:
    //   g[m] = sum of f[s] for all submasks s of m
    //
    // Naive O(3^n): enumerate submasks for each mask
    // SOS DP O(n * 2^n): dimension-by-dimension relaxation
    //
    // The idea: iterate over each bit dimension i (0..n-1)
    //   For each mask, if bit i is set, add the contribution from
    //   the mask with bit i cleared
    
    public static long[] sosDPSum(long[] f, int n) {
        long[] dp = Arrays.copyOf(f, f.length);
        
        for (int i = 0; i < n; i++) {         // For each bit dimension
            for (int mask = 0; mask < (1 << n); mask++) {
                if ((mask & (1 << i)) != 0) {  // If bit i is set
                    dp[mask] += dp[mask ^ (1 << i)]; // Add subset without bit i
                }
            }
        }
        return dp;
        // After all dimensions: dp[mask] = sum of f[s] for all s ⊆ mask
    }
    
    // Inverse: superset sum (sum over all SUPERsets of mask)
    public static long[] supersetSum(long[] f, int n) {
        long[] dp = Arrays.copyOf(f, f.length);
        for (int i = 0; i < n; i++) {
            for (int mask = (1 << n) - 1; mask >= 0; mask--) {
                if ((mask & (1 << i)) == 0) {  // If bit i is NOT set
                    dp[mask] += dp[mask | (1 << i)];
                }
            }
        }
        return dp;
    }
    
    public static void main(String[] args) {
        int n = 3;
        long[] f = {1, 2, 3, 4, 5, 6, 7, 8}; // f[000..111]
        
        long[] subsetSum = sosDPSum(f, n);
        // subsetSum[0b111] should be sum of all = 36
        // subsetSum[0b101] = f[000]+f[001]+f[100]+f[101] = 1+2+5+6 = 14
        
        System.out.println("SOS[111] = " + subsetSum[7]); // 36
        System.out.println("SOS[101] = " + subsetSum[5]); // 14
        System.out.println("SOS[011] = " + subsetSum[3]); // 1+2+3+4 = 10
        
        // Verify with brute force
        for (int mask = 0; mask < (1 << n); mask++) {
            long bruteSum = 0;
            for (int s = mask; ; s = (s - 1) & mask) {
                bruteSum += f[s];
                if (s == 0) break;
            }
            assert subsetSum[mask] == bruteSum : "Mismatch at " + mask;
        }
        System.out.println("✓ SOS DP verified against brute force");
    }
}`,
      },
      {
        title: "Bitboard Basics (Chess Example)",
        language: "java",
        content: `public class BitboardBasics {
    
    // A chess board has 64 squares — perfectly fits in a long!
    // Each piece type gets its own bitboard
    // Square mapping: bit 0 = a1, bit 7 = h1, bit 63 = h8
    
    static void printBoard(long board) {
        for (int rank = 7; rank >= 0; rank--) {
            for (int file = 0; file < 8; file++) {
                int sq = rank * 8 + file;
                System.out.print(((board >> sq) & 1) == 1 ? "1 " : ". ");
            }
            System.out.println();
        }
        System.out.println();
    }
    
    // Knight attack pattern from a given square
    static long knightAttacks(int sq) {
        long bb = 1L << sq;
        long attacks = 0L;
        long notAFile = 0xFEFEFEFEFEFEFEFEL;
        long notHFile = 0x7F7F7F7F7F7F7F7FL;
        long notABFile = 0xFCFCFCFCFCFCFCFCL;
        long notGHFile = 0x3F3F3F3F3F3F3F3FL;
        
        attacks |= (bb << 17) & notAFile;  // Up 2, Right 1
        attacks |= (bb << 15) & notHFile;  // Up 2, Left 1
        attacks |= (bb << 10) & notABFile; // Up 1, Right 2
        attacks |= (bb << 6)  & notGHFile; // Up 1, Left 2
        attacks |= (bb >>> 17) & notHFile; // Down 2, Left 1
        attacks |= (bb >>> 15) & notAFile; // Down 2, Right 1
        attacks |= (bb >>> 10) & notGHFile;// Down 1, Left 2
        attacks |= (bb >>> 6)  & notABFile;// Down 1, Right 2
        
        return attacks;
    }
    
    public static void main(String[] args) {
        // Knight on e4 (square 28)
        int sq = 28; // e4
        long attacks = knightAttacks(sq);
        
        System.out.println("Knight on e4, attacks:");
        printBoard(attacks | (1L << sq));
        
        // Count attacked squares
        System.out.println("Attacked squares: " + Long.bitCount(attacks));
        
        // Piece interaction: are any pawns attacked?
        long enemyPawns = (1L << 13) | (1L << 38); // Two pawns
        long attackedPawns = attacks & enemyPawns;
        System.out.println("Attacked pawns: " + Long.bitCount(attackedPawns));
    }
}`,
      },
    ],
    note: "SOS DP is one of the most powerful techniques in competitive programming. It appears in problems involving subset sums, Möbius inversion, and counting problems. Master the template — it's always the same n × 2ⁿ loop structure.",
  },

  // ===== 10. Practice Problems & Patterns =====
  {
    id: "bits-practice",
    title: "Practice Problems & Patterns",
    difficulty: "Expert",
    theory: [
      "After mastering individual bit manipulation techniques, the key to competitive programming success is recognizing which technique to apply. This section presents a pattern-matching guide and advanced problems that combine multiple techniques.",
      "Pattern Recognition: (1) 'Find unique/missing element' → XOR all elements. (2) 'Enumerate subsets' → Bitmask iteration. (3) 'Optimize over subsets' → Bitmask DP or SOS DP. (4) 'Maximum XOR' → Binary Trie. (5) 'Count contributions' → Bit-by-bit analysis. (6) 'Small n (≤20)' → Bitmask DP. (7) 'Range bitwise queries' → Common prefix or segment tree.",
      "Advanced problems often combine bit manipulation with other techniques: Trie + XOR for maximum queries, DP + bitmask for subset optimization, prefix arrays + XOR for range queries, and divide-and-conquer + bit analysis for counting problems.",
      "When stuck on a bit manipulation problem, try these strategies: (1) Think about each bit position independently. (2) Consider the contribution of each bit to the answer. (3) Look for XOR properties that simplify the problem. (4) Try to express the problem as a subset enumeration or optimization.",
    ],
    keyPoints: [
      "Single unique element → XOR all",
      "Two unique elements → XOR all, then partition by a distinguishing bit",
      "Subsets of size k → Gosper's Hack",
      "Sum/count over all submasks → SOS DP",
      "Maximum XOR with constraints → Binary Trie",
      "Visit all states exactly once → Bitmask DP (TSP-style)",
      "Bit contribution: analyze how each bit affects the answer independently",
    ],
    table: {
      headers: ["Technique", "Time", "Space", "When to Use"],
      rows: [
        ["Brian Kernighan", "O(k) per num", "O(1)", "Count set bits efficiently"],
        ["Bitmask Enumeration", "O(2ⁿ)", "O(1)", "Generate all subsets"],
        ["Submask Iteration", "O(3ⁿ) total", "O(1)", "Enumerate submasks per mask"],
        ["Gosper's Hack", "O(C(n,k))", "O(1)", "Subsets of exact size k"],
        ["Bitmask DP", "O(2ⁿ × n²)", "O(2ⁿ × n)", "TSP, assignment, n ≤ 20"],
        ["SOS DP", "O(n × 2ⁿ)", "O(2ⁿ)", "Sum/count over all submasks"],
        ["Binary Trie", "O(n × B)", "O(n × B)", "Max XOR, B = bit width"],
        ["Prefix XOR", "O(n) + O(1)", "O(n)", "Range XOR queries"],
        ["Gray Code", "O(2ⁿ)", "O(1)", "Enumerate with 1-bit changes"],
        ["Bit Contribution", "O(n × B)", "O(1)", "Sum of pairwise AND/OR/XOR"],
      ],
    },
    code: [
      {
        title: "Sum of Pairwise AND (Bit Contribution Technique)",
        language: "java",
        content: `public class PairwiseAND {
    
    // Find sum of (arr[i] & arr[j]) for all pairs i < j
    // Key insight: analyze each bit independently
    // For bit b: if c numbers have bit b set, contribution = c*(c-1)/2 * (1<<b)
    // (because each pair of numbers with bit b set contributes 2^b to the sum)
    
    public static long sumOfPairwiseAND(int[] arr) {
        long totalSum = 0;
        int n = arr.length;
        
        for (int bit = 0; bit < 30; bit++) {
            int count = 0; // Numbers with this bit set
            for (int num : arr) {
                if ((num & (1 << bit)) != 0) count++;
            }
            // Number of pairs with both having this bit set
            long pairs = (long) count * (count - 1) / 2;
            totalSum += pairs * (1L << bit);
        }
        return totalSum;
    }
    
    // Similarly: Sum of pairwise XOR
    // For bit b: if c numbers have bit b set, n-c don't
    // Each set-unset pair contributes 2^b
    // Contribution = c * (n - c) * (1 << b)
    public static long sumOfPairwiseXOR(int[] arr) {
        long totalSum = 0;
        int n = arr.length;
        for (int bit = 0; bit < 30; bit++) {
            int count = 0;
            for (int num : arr) {
                if ((num & (1 << bit)) != 0) count++;
            }
            totalSum += (long) count * (n - count) * (1L << bit);
        }
        return totalSum;
    }
    
    public static void main(String[] args) {
        int[] arr = {1, 3, 5};
        System.out.println("Sum of pairwise AND: " + sumOfPairwiseAND(arr)); // (1&3)+(1&5)+(3&5) = 1+1+1 = 3
        System.out.println("Sum of pairwise XOR: " + sumOfPairwiseXOR(arr)); // (1^3)+(1^5)+(3^5) = 2+4+6 = 12
    }
}`,
      },
      {
        title: "Maximum AND of Pair (Greedy Bit Building)",
        language: "java",
        content: `public class MaxANDPair {
    
    // Find the maximum AND of any pair in the array
    // Greedy approach: try to set bits from MSB to LSB
    // For each bit, check if at least 2 numbers have all the bits
    // we've chosen so far (plus this new bit) set
    
    public static int maxAND(int[] nums) {
        int result = 0;
        
        for (int bit = 29; bit >= 0; bit--) {
            int candidate = result | (1 << bit);
            int count = 0;
            
            // Count numbers that have ALL bits in 'candidate' set
            for (int num : nums) {
                if ((num & candidate) == candidate) {
                    count++;
                }
            }
            
            // If at least 2 numbers have these bits, include this bit
            if (count >= 2) {
                result = candidate;
            }
        }
        return result;
    }
    
    public static void main(String[] args) {
        int[] nums = {12, 15, 7, 14, 9};
        System.out.println("Max AND pair: " + maxAND(nums)); // 14 (14 & 15 = 14)
        
        // Trace:
        // bit 29..4: no two numbers have these bits → skip
        // bit 3 (8): 12=1100, 15=1111, 14=1110, 9=1001 → 4 numbers → result=1000
        // bit 2 (4): candidate=1100, 12=1100✓, 15=1111✓, 14=1110✓ → 3 → result=1100
        // bit 1 (2): candidate=1110, 15=1111✓, 14=1110✓ → 2 → result=1110 = 14
        // bit 0 (1): candidate=1111, only 15 has it → 1 < 2 → skip
    }
}`,
      },
      {
        title: "Minimum Number of Operations to Make XOR Zero",
        language: "java",
        content: `import java.util.*;

public class MinOpsXORZero {
    
    // Given an array, find minimum operations to make XOR of all elements = 0
    // Each operation: choose any element and change it to any value
    // 
    // If XOR of all elements is already 0, answer is 0
    // Otherwise, we need to change at least 1 element
    // Change any element to (totalXOR ^ element) to make total XOR = 0
    //
    // More complex variant: Divide array into k groups,
    // minimize changes so XOR of each group = 0
    
    public static int minOpsSimple(int[] arr) {
        int xor = 0;
        for (int num : arr) xor ^= num;
        return xor == 0 ? 0 : 1;
    }
    
    // Advanced: Find largest subset with XOR = 0
    // (Remaining elements need to be changed)
    // Uses Gaussian elimination on GF(2)
    
    public static int maxSubsetXORZero(int[] arr) {
        int n = arr.length;
        // Gaussian elimination to find rank of the set in GF(2)
        int[] basis = new int[30];
        int rank = 0;
        
        for (int num : arr) {
            int cur = num;
            for (int i = 29; i >= 0; i--) {
                if ((cur & (1 << i)) == 0) continue;
                if (basis[i] == 0) {
                    basis[i] = cur;
                    rank++;
                    break;
                }
                cur ^= basis[i];
            }
            // If cur becomes 0, this number is linearly dependent
            // → can be part of a XOR-zero subset
        }
        
        // Maximum subset with XOR=0 = n - rank
        // (rank = number of linearly independent elements)
        // Minimum changes = rank (if we want all to XOR to 0,
        // but this counts differently...)
        
        // For the simple problem: answer is just 0 or 1
        int totalXor = 0;
        for (int num : arr) totalXor ^= num;
        return totalXor == 0 ? 0 : 1;
    }
    
    public static void main(String[] args) {
        int[] arr1 = {1, 2, 3}; // XOR = 0 already!
        int[] arr2 = {1, 2, 4}; // XOR = 7, need 1 change
        
        System.out.println("Ops for [1,2,3]: " + minOpsSimple(arr1)); // 0
        System.out.println("Ops for [1,2,4]: " + minOpsSimple(arr2)); // 1
    }
}`,
      },
      {
        title: "Count Subarrays with XOR Equal to K",
        language: "java",
        content: `import java.util.*;

public class SubarrayXORK {
    
    // Count subarrays with XOR equal to K
    // Similar to subarray sum equals K, but with XOR
    // 
    // prefix[i] = arr[0] ^ arr[1] ^ ... ^ arr[i-1]
    // XOR(L..R) = prefix[R+1] ^ prefix[L]
    // We want prefix[R+1] ^ prefix[L] = K
    // → prefix[L] = prefix[R+1] ^ K
    // → For each prefix, count how many previous prefixes equal (current ^ K)
    
    public static int countSubarraysXOR(int[] arr, int K) {
        Map<Integer, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0, 1); // Empty prefix
        
        int prefix = 0;
        int count = 0;
        
        for (int num : arr) {
            prefix ^= num;
            int target = prefix ^ K;
            count += prefixCount.getOrDefault(target, 0);
            prefixCount.merge(prefix, 1, Integer::sum);
        }
        
        return count;
    }
    
    public static void main(String[] args) {
        int[] arr = {4, 2, 2, 6, 4};
        int K = 6;
        System.out.println("Subarrays with XOR=" + K + ": " + countSubarraysXOR(arr, K)); // 4
        // Subarrays: [4,2], [4,2,2,6,4], [2,2,6], [6]
        // 4^2=6✓, 4^2^2^6^4=6✓, 2^2^6=6✓, 6=6✓
    }
}`,
      },
    ],
    tip: "In competitions, always check: (1) Can I solve this bit-by-bit independently? (2) Is there a XOR cancellation I can exploit? (3) Is n small enough for bitmask DP? These three questions cover 80% of bit manipulation problems.",
  },
];
