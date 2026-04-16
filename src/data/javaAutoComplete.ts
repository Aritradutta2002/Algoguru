// Comprehensive Java Standard Library autocomplete data for Monaco Editor
// Covers commonly used classes in competitive programming and general Java development

export interface JavaMethodCompletion {
  label: string;
  insertText: string;
  detail: string;
  documentation: string;
  kind: "method" | "field" | "constructor";
}

export interface JavaClassCompletions {
  className: string;
  staticMembers: JavaMethodCompletion[];
  instanceMembers: JavaMethodCompletion[];
}

// ═══════════════════════════════════════════════════════
// Integer
// ═══════════════════════════════════════════════════════
const INTEGER_STATIC: JavaMethodCompletion[] = [
  { label: "parseInt", insertText: "parseInt(${1:s})", detail: "int parseInt(String s)", documentation: "Parses the string as a signed decimal integer.", kind: "method" },
  { label: "parseInt", insertText: "parseInt(${1:s}, ${2:radix})", detail: "int parseInt(String s, int radix)", documentation: "Parses the string as a signed integer in the given radix.", kind: "method" },
  { label: "valueOf", insertText: "valueOf(${1:i})", detail: "Integer valueOf(int i)", documentation: "Returns an Integer instance for the specified int value.", kind: "method" },
  { label: "toString", insertText: "toString(${1:i})", detail: "String toString(int i)", documentation: "Returns a String object representing the specified integer.", kind: "method" },
  { label: "toString", insertText: "toString(${1:i}, ${2:radix})", detail: "String toString(int i, int radix)", documentation: "Returns a string representation in the specified radix.", kind: "method" },
  { label: "toBinaryString", insertText: "toBinaryString(${1:i})", detail: "String toBinaryString(int i)", documentation: "Returns a binary string representation of the integer.", kind: "method" },
  { label: "toHexString", insertText: "toHexString(${1:i})", detail: "String toHexString(int i)", documentation: "Returns a hex string representation of the integer.", kind: "method" },
  { label: "toOctalString", insertText: "toOctalString(${1:i})", detail: "String toOctalString(int i)", documentation: "Returns an octal string representation of the integer.", kind: "method" },
  { label: "bitCount", insertText: "bitCount(${1:i})", detail: "int bitCount(int i)", documentation: "Returns the number of one-bits in the two's complement binary representation.", kind: "method" },
  { label: "highestOneBit", insertText: "highestOneBit(${1:i})", detail: "int highestOneBit(int i)", documentation: "Returns an int with at most a single one-bit, in the position of the highest-order one-bit.", kind: "method" },
  { label: "lowestOneBit", insertText: "lowestOneBit(${1:i})", detail: "int lowestOneBit(int i)", documentation: "Returns an int with at most a single one-bit, in the position of the lowest-order one-bit.", kind: "method" },
  { label: "numberOfLeadingZeros", insertText: "numberOfLeadingZeros(${1:i})", detail: "int numberOfLeadingZeros(int i)", documentation: "Returns the number of zero bits preceding the highest-order one-bit.", kind: "method" },
  { label: "numberOfTrailingZeros", insertText: "numberOfTrailingZeros(${1:i})", detail: "int numberOfTrailingZeros(int i)", documentation: "Returns the number of zero bits following the lowest-order one-bit.", kind: "method" },
  { label: "reverse", insertText: "reverse(${1:i})", detail: "int reverse(int i)", documentation: "Returns the value obtained by reversing the order of the bits.", kind: "method" },
  { label: "reverseBytes", insertText: "reverseBytes(${1:i})", detail: "int reverseBytes(int i)", documentation: "Returns the value obtained by reversing the order of the bytes.", kind: "method" },
  { label: "rotateLeft", insertText: "rotateLeft(${1:i}, ${2:distance})", detail: "int rotateLeft(int i, int distance)", documentation: "Returns the value obtained by rotating the bits to the left.", kind: "method" },
  { label: "rotateRight", insertText: "rotateRight(${1:i}, ${2:distance})", detail: "int rotateRight(int i, int distance)", documentation: "Returns the value obtained by rotating the bits to the right.", kind: "method" },
  { label: "signum", insertText: "signum(${1:i})", detail: "int signum(int i)", documentation: "Returns the signum function: -1, 0, or 1.", kind: "method" },
  { label: "max", insertText: "max(${1:a}, ${2:b})", detail: "int max(int a, int b)", documentation: "Returns the greater of two int values.", kind: "method" },
  { label: "min", insertText: "min(${1:a}, ${2:b})", detail: "int min(int a, int b)", documentation: "Returns the smaller of two int values.", kind: "method" },
  { label: "sum", insertText: "sum(${1:a}, ${2:b})", detail: "int sum(int a, int b)", documentation: "Adds two integers together.", kind: "method" },
  { label: "compare", insertText: "compare(${1:x}, ${2:y})", detail: "int compare(int x, int y)", documentation: "Compares two int values numerically.", kind: "method" },
  { label: "compareUnsigned", insertText: "compareUnsigned(${1:x}, ${2:y})", detail: "int compareUnsigned(int x, int y)", documentation: "Compares two int values treating them as unsigned.", kind: "method" },
  { label: "MAX_VALUE", insertText: "MAX_VALUE", detail: "int MAX_VALUE = 2147483647", documentation: "Maximum value an int can have: 2^31 - 1.", kind: "field" },
  { label: "MIN_VALUE", insertText: "MIN_VALUE", detail: "int MIN_VALUE = -2147483648", documentation: "Minimum value an int can have: -2^31.", kind: "field" },
];

// ═══════════════════════════════════════════════════════
// Long
// ═══════════════════════════════════════════════════════
const LONG_STATIC: JavaMethodCompletion[] = [
  { label: "parseLong", insertText: "parseLong(${1:s})", detail: "long parseLong(String s)", documentation: "Parses the string as a signed decimal long.", kind: "method" },
  { label: "parseLong", insertText: "parseLong(${1:s}, ${2:radix})", detail: "long parseLong(String s, int radix)", documentation: "Parses the string as a signed long in the given radix.", kind: "method" },
  { label: "valueOf", insertText: "valueOf(${1:l})", detail: "Long valueOf(long l)", documentation: "Returns a Long instance.", kind: "method" },
  { label: "toString", insertText: "toString(${1:l})", detail: "String toString(long l)", documentation: "Returns a String representation.", kind: "method" },
  { label: "toBinaryString", insertText: "toBinaryString(${1:l})", detail: "String toBinaryString(long l)", documentation: "Returns a binary string representation.", kind: "method" },
  { label: "bitCount", insertText: "bitCount(${1:l})", detail: "int bitCount(long l)", documentation: "Returns the number of one-bits.", kind: "method" },
  { label: "highestOneBit", insertText: "highestOneBit(${1:l})", detail: "long highestOneBit(long l)", documentation: "Returns long with single one-bit at highest position.", kind: "method" },
  { label: "lowestOneBit", insertText: "lowestOneBit(${1:l})", detail: "long lowestOneBit(long l)", documentation: "Returns long with single one-bit at lowest position.", kind: "method" },
  { label: "numberOfLeadingZeros", insertText: "numberOfLeadingZeros(${1:l})", detail: "int numberOfLeadingZeros(long l)", documentation: "Returns leading zero count.", kind: "method" },
  { label: "numberOfTrailingZeros", insertText: "numberOfTrailingZeros(${1:l})", detail: "int numberOfTrailingZeros(long l)", documentation: "Returns trailing zero count.", kind: "method" },
  { label: "reverse", insertText: "reverse(${1:l})", detail: "long reverse(long l)", documentation: "Returns the value with reversed bits.", kind: "method" },
  { label: "max", insertText: "max(${1:a}, ${2:b})", detail: "long max(long a, long b)", documentation: "Returns the greater of two long values.", kind: "method" },
  { label: "min", insertText: "min(${1:a}, ${2:b})", detail: "long min(long a, long b)", documentation: "Returns the smaller of two long values.", kind: "method" },
  { label: "compare", insertText: "compare(${1:x}, ${2:y})", detail: "int compare(long x, long y)", documentation: "Compares two long values numerically.", kind: "method" },
  { label: "MAX_VALUE", insertText: "MAX_VALUE", detail: "long MAX_VALUE = 9223372036854775807L", documentation: "Maximum value a long can have: 2^63 - 1.", kind: "field" },
  { label: "MIN_VALUE", insertText: "MIN_VALUE", detail: "long MIN_VALUE = -9223372036854775808L", documentation: "Minimum value a long can have: -2^63.", kind: "field" },
];

// ═══════════════════════════════════════════════════════
// Double
// ═══════════════════════════════════════════════════════
const DOUBLE_STATIC: JavaMethodCompletion[] = [
  { label: "parseDouble", insertText: "parseDouble(${1:s})", detail: "double parseDouble(String s)", documentation: "Parses the string as a double.", kind: "method" },
  { label: "valueOf", insertText: "valueOf(${1:d})", detail: "Double valueOf(double d)", documentation: "Returns a Double instance.", kind: "method" },
  { label: "isNaN", insertText: "isNaN(${1:v})", detail: "boolean isNaN(double v)", documentation: "Returns true if the value is Not-a-Number.", kind: "method" },
  { label: "isInfinite", insertText: "isInfinite(${1:v})", detail: "boolean isInfinite(double v)", documentation: "Returns true if the value is infinitely large.", kind: "method" },
  { label: "compare", insertText: "compare(${1:d1}, ${2:d2})", detail: "int compare(double d1, double d2)", documentation: "Compares two double values.", kind: "method" },
  { label: "max", insertText: "max(${1:a}, ${2:b})", detail: "double max(double a, double b)", documentation: "Returns the greater of two double values.", kind: "method" },
  { label: "min", insertText: "min(${1:a}, ${2:b})", detail: "double min(double a, double b)", documentation: "Returns the smaller of two double values.", kind: "method" },
  { label: "MAX_VALUE", insertText: "MAX_VALUE", detail: "double MAX_VALUE", documentation: "Largest positive finite value of type double.", kind: "field" },
  { label: "MIN_VALUE", insertText: "MIN_VALUE", detail: "double MIN_VALUE", documentation: "Smallest positive nonzero value of type double.", kind: "field" },
  { label: "POSITIVE_INFINITY", insertText: "POSITIVE_INFINITY", detail: "double POSITIVE_INFINITY", documentation: "Positive infinity.", kind: "field" },
  { label: "NEGATIVE_INFINITY", insertText: "NEGATIVE_INFINITY", detail: "double NEGATIVE_INFINITY", documentation: "Negative infinity.", kind: "field" },
  { label: "NaN", insertText: "NaN", detail: "double NaN", documentation: "Not-a-Number value.", kind: "field" },
];

// ═══════════════════════════════════════════════════════
// Character
// ═══════════════════════════════════════════════════════
const CHARACTER_STATIC: JavaMethodCompletion[] = [
  { label: "isDigit", insertText: "isDigit(${1:ch})", detail: "boolean isDigit(char ch)", documentation: "Determines if the character is a digit.", kind: "method" },
  { label: "isLetter", insertText: "isLetter(${1:ch})", detail: "boolean isLetter(char ch)", documentation: "Determines if the character is a letter.", kind: "method" },
  { label: "isLetterOrDigit", insertText: "isLetterOrDigit(${1:ch})", detail: "boolean isLetterOrDigit(char ch)", documentation: "Determines if the character is a letter or digit.", kind: "method" },
  { label: "isUpperCase", insertText: "isUpperCase(${1:ch})", detail: "boolean isUpperCase(char ch)", documentation: "Determines if the character is an uppercase letter.", kind: "method" },
  { label: "isLowerCase", insertText: "isLowerCase(${1:ch})", detail: "boolean isLowerCase(char ch)", documentation: "Determines if the character is a lowercase letter.", kind: "method" },
  { label: "isWhitespace", insertText: "isWhitespace(${1:ch})", detail: "boolean isWhitespace(char ch)", documentation: "Determines if the character is whitespace.", kind: "method" },
  { label: "toUpperCase", insertText: "toUpperCase(${1:ch})", detail: "char toUpperCase(char ch)", documentation: "Converts to uppercase.", kind: "method" },
  { label: "toLowerCase", insertText: "toLowerCase(${1:ch})", detail: "char toLowerCase(char ch)", documentation: "Converts to lowercase.", kind: "method" },
  { label: "getNumericValue", insertText: "getNumericValue(${1:ch})", detail: "int getNumericValue(char ch)", documentation: "Returns the numeric value of the character.", kind: "method" },
  { label: "compare", insertText: "compare(${1:x}, ${2:y})", detail: "int compare(char x, char y)", documentation: "Compares two char values numerically.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Boolean
// ═══════════════════════════════════════════════════════
const BOOLEAN_STATIC: JavaMethodCompletion[] = [
  { label: "parseBoolean", insertText: "parseBoolean(${1:s})", detail: "boolean parseBoolean(String s)", documentation: "Parses the string as a boolean.", kind: "method" },
  { label: "valueOf", insertText: "valueOf(${1:b})", detail: "Boolean valueOf(boolean b)", documentation: "Returns a Boolean instance.", kind: "method" },
  { label: "compare", insertText: "compare(${1:x}, ${2:y})", detail: "int compare(boolean x, boolean y)", documentation: "Compares two boolean values.", kind: "method" },
  { label: "TRUE", insertText: "TRUE", detail: "Boolean TRUE", documentation: "The Boolean object for true.", kind: "field" },
  { label: "FALSE", insertText: "FALSE", detail: "Boolean FALSE", documentation: "The Boolean object for false.", kind: "field" },
];

// ═══════════════════════════════════════════════════════
// Math
// ═══════════════════════════════════════════════════════
const MATH_STATIC: JavaMethodCompletion[] = [
  { label: "abs", insertText: "abs(${1:a})", detail: "int/long/float/double abs(a)", documentation: "Returns the absolute value.", kind: "method" },
  { label: "max", insertText: "max(${1:a}, ${2:b})", detail: "int/long/float/double max(a, b)", documentation: "Returns the greater of two values.", kind: "method" },
  { label: "min", insertText: "min(${1:a}, ${2:b})", detail: "int/long/float/double min(a, b)", documentation: "Returns the smaller of two values.", kind: "method" },
  { label: "pow", insertText: "pow(${1:a}, ${2:b})", detail: "double pow(double a, double b)", documentation: "Returns the value of a raised to the power of b.", kind: "method" },
  { label: "sqrt", insertText: "sqrt(${1:a})", detail: "double sqrt(double a)", documentation: "Returns the correctly rounded positive square root.", kind: "method" },
  { label: "cbrt", insertText: "cbrt(${1:a})", detail: "double cbrt(double a)", documentation: "Returns the cube root.", kind: "method" },
  { label: "ceil", insertText: "ceil(${1:a})", detail: "double ceil(double a)", documentation: "Returns the smallest double value >= argument that is an integer.", kind: "method" },
  { label: "floor", insertText: "floor(${1:a})", detail: "double floor(double a)", documentation: "Returns the largest double value <= argument that is an integer.", kind: "method" },
  { label: "round", insertText: "round(${1:a})", detail: "long round(double a)", documentation: "Returns the closest long to the argument.", kind: "method" },
  { label: "log", insertText: "log(${1:a})", detail: "double log(double a)", documentation: "Returns the natural logarithm (base e).", kind: "method" },
  { label: "log10", insertText: "log10(${1:a})", detail: "double log10(double a)", documentation: "Returns the base 10 logarithm.", kind: "method" },
  { label: "log1p", insertText: "log1p(${1:x})", detail: "double log1p(double x)", documentation: "Returns ln(1 + x) accurately for small x.", kind: "method" },
  { label: "exp", insertText: "exp(${1:a})", detail: "double exp(double a)", documentation: "Returns Euler's number e raised to the power.", kind: "method" },
  { label: "sin", insertText: "sin(${1:a})", detail: "double sin(double a)", documentation: "Returns the trigonometric sine.", kind: "method" },
  { label: "cos", insertText: "cos(${1:a})", detail: "double cos(double a)", documentation: "Returns the trigonometric cosine.", kind: "method" },
  { label: "tan", insertText: "tan(${1:a})", detail: "double tan(double a)", documentation: "Returns the trigonometric tangent.", kind: "method" },
  { label: "asin", insertText: "asin(${1:a})", detail: "double asin(double a)", documentation: "Returns the arc sine.", kind: "method" },
  { label: "acos", insertText: "acos(${1:a})", detail: "double acos(double a)", documentation: "Returns the arc cosine.", kind: "method" },
  { label: "atan", insertText: "atan(${1:a})", detail: "double atan(double a)", documentation: "Returns the arc tangent.", kind: "method" },
  { label: "atan2", insertText: "atan2(${1:y}, ${2:x})", detail: "double atan2(double y, double x)", documentation: "Returns the angle theta from the conversion of rectangular to polar coordinates.", kind: "method" },
  { label: "random", insertText: "random()", detail: "double random()", documentation: "Returns a random double value between 0.0 and 1.0.", kind: "method" },
  { label: "floorMod", insertText: "floorMod(${1:x}, ${2:y})", detail: "int floorMod(int x, int y)", documentation: "Returns the floor modulus (always non-negative for positive y).", kind: "method" },
  { label: "floorDiv", insertText: "floorDiv(${1:x}, ${2:y})", detail: "int floorDiv(int x, int y)", documentation: "Returns the floor division.", kind: "method" },
  { label: "addExact", insertText: "addExact(${1:x}, ${2:y})", detail: "int addExact(int x, int y)", documentation: "Returns the sum, throwing ArithmeticException on overflow.", kind: "method" },
  { label: "subtractExact", insertText: "subtractExact(${1:x}, ${2:y})", detail: "int subtractExact(int x, int y)", documentation: "Returns the difference, throwing on overflow.", kind: "method" },
  { label: "multiplyExact", insertText: "multiplyExact(${1:x}, ${2:y})", detail: "int multiplyExact(int x, int y)", documentation: "Returns the product, throwing on overflow.", kind: "method" },
  { label: "toRadians", insertText: "toRadians(${1:angdeg})", detail: "double toRadians(double angdeg)", documentation: "Converts degrees to radians.", kind: "method" },
  { label: "toDegrees", insertText: "toDegrees(${1:angrad})", detail: "double toDegrees(double angrad)", documentation: "Converts radians to degrees.", kind: "method" },
  { label: "hypot", insertText: "hypot(${1:x}, ${2:y})", detail: "double hypot(double x, double y)", documentation: "Returns sqrt(x² + y²) without intermediate overflow.", kind: "method" },
  { label: "signum", insertText: "signum(${1:d})", detail: "double signum(double d)", documentation: "Returns the signum function: -1.0, 0.0, or 1.0.", kind: "method" },
  { label: "PI", insertText: "PI", detail: "double PI = 3.14159265358979...", documentation: "The double value of π.", kind: "field" },
  { label: "E", insertText: "E", detail: "double E = 2.71828182845904...", documentation: "The double value of e.", kind: "field" },
];

// ═══════════════════════════════════════════════════════
// Arrays (java.util.Arrays)
// ═══════════════════════════════════════════════════════
const ARRAYS_STATIC: JavaMethodCompletion[] = [
  { label: "sort", insertText: "sort(${1:a})", detail: "void sort(int[] a)", documentation: "Sorts the array in ascending order.", kind: "method" },
  { label: "sort", insertText: "sort(${1:a}, ${2:fromIndex}, ${3:toIndex})", detail: "void sort(int[] a, int from, int to)", documentation: "Sorts the specified range in ascending order.", kind: "method" },
  { label: "sort", insertText: "sort(${1:a}, ${2:comparator})", detail: "void sort(T[] a, Comparator c)", documentation: "Sorts the object array using the specified comparator.", kind: "method" },
  { label: "binarySearch", insertText: "binarySearch(${1:a}, ${2:key})", detail: "int binarySearch(int[] a, int key)", documentation: "Searches for the specified value using binary search. Array must be sorted.", kind: "method" },
  { label: "fill", insertText: "fill(${1:a}, ${2:val})", detail: "void fill(int[] a, int val)", documentation: "Fills the array with the specified value.", kind: "method" },
  { label: "fill", insertText: "fill(${1:a}, ${2:fromIndex}, ${3:toIndex}, ${4:val})", detail: "void fill(int[] a, int from, int to, int val)", documentation: "Fills the specified range with the value.", kind: "method" },
  { label: "copyOf", insertText: "copyOf(${1:original}, ${2:newLength})", detail: "int[] copyOf(int[] original, int newLength)", documentation: "Copies the array, truncating or padding with zeros.", kind: "method" },
  { label: "copyOfRange", insertText: "copyOfRange(${1:original}, ${2:from}, ${3:to})", detail: "int[] copyOfRange(int[] original, int from, int to)", documentation: "Copies the specified range of the array.", kind: "method" },
  { label: "equals", insertText: "equals(${1:a}, ${2:a2})", detail: "boolean equals(int[] a, int[] a2)", documentation: "Returns true if the two arrays are equal.", kind: "method" },
  { label: "deepEquals", insertText: "deepEquals(${1:a1}, ${2:a2})", detail: "boolean deepEquals(Object[] a1, Object[] a2)", documentation: "Returns true if the two arrays are deeply equal.", kind: "method" },
  { label: "toString", insertText: "toString(${1:a})", detail: "String toString(int[] a)", documentation: "Returns a string representation of the array.", kind: "method" },
  { label: "deepToString", insertText: "deepToString(${1:a})", detail: "String deepToString(Object[] a)", documentation: "Returns a string representation of the deep contents.", kind: "method" },
  { label: "asList", insertText: "asList(${1:a})", detail: "List<T> asList(T... a)", documentation: "Returns a fixed-size list backed by the specified array.", kind: "method" },
  { label: "stream", insertText: "stream(${1:array})", detail: "IntStream stream(int[] array)", documentation: "Returns a sequential IntStream with the array as its source.", kind: "method" },
  { label: "parallelSort", insertText: "parallelSort(${1:a})", detail: "void parallelSort(int[] a)", documentation: "Sorts the array in parallel.", kind: "method" },
  { label: "setAll", insertText: "setAll(${1:array}, ${2:generator})", detail: "void setAll(int[] array, IntUnaryOperator gen)", documentation: "Sets all elements using a generator function.", kind: "method" },
  { label: "mismatch", insertText: "mismatch(${1:a}, ${2:b})", detail: "int mismatch(int[] a, int[] b)", documentation: "Returns the index of the first mismatch, or -1 if equal.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Collections (java.util.Collections)
// ═══════════════════════════════════════════════════════
const COLLECTIONS_STATIC: JavaMethodCompletion[] = [
  { label: "sort", insertText: "sort(${1:list})", detail: "void sort(List<T> list)", documentation: "Sorts the list in natural order.", kind: "method" },
  { label: "sort", insertText: "sort(${1:list}, ${2:c})", detail: "void sort(List<T> list, Comparator c)", documentation: "Sorts the list with comparator.", kind: "method" },
  { label: "reverse", insertText: "reverse(${1:list})", detail: "void reverse(List<?> list)", documentation: "Reverses the order of elements.", kind: "method" },
  { label: "shuffle", insertText: "shuffle(${1:list})", detail: "void shuffle(List<?> list)", documentation: "Randomly permutes the list.", kind: "method" },
  { label: "swap", insertText: "swap(${1:list}, ${2:i}, ${3:j})", detail: "void swap(List<?> list, int i, int j)", documentation: "Swaps elements at positions i and j.", kind: "method" },
  { label: "binarySearch", insertText: "binarySearch(${1:list}, ${2:key})", detail: "int binarySearch(List<T> list, T key)", documentation: "Binary search on sorted list.", kind: "method" },
  { label: "max", insertText: "max(${1:coll})", detail: "T max(Collection<T> coll)", documentation: "Returns the maximum element.", kind: "method" },
  { label: "min", insertText: "min(${1:coll})", detail: "T min(Collection<T> coll)", documentation: "Returns the minimum element.", kind: "method" },
  { label: "frequency", insertText: "frequency(${1:c}, ${2:o})", detail: "int frequency(Collection<?> c, Object o)", documentation: "Returns the number of occurrences.", kind: "method" },
  { label: "disjoint", insertText: "disjoint(${1:c1}, ${2:c2})", detail: "boolean disjoint(Collection<?> c1, Collection<?> c2)", documentation: "Returns true if two collections have no common elements.", kind: "method" },
  { label: "nCopies", insertText: "nCopies(${1:n}, ${2:o})", detail: "List<T> nCopies(int n, T o)", documentation: "Returns an immutable list of n copies of object.", kind: "method" },
  { label: "singletonList", insertText: "singletonList(${1:o})", detail: "List<T> singletonList(T o)", documentation: "Returns an immutable list containing only the specified object.", kind: "method" },
  { label: "emptyList", insertText: "emptyList()", detail: "List<T> emptyList()", documentation: "Returns an empty immutable list.", kind: "method" },
  { label: "emptySet", insertText: "emptySet()", detail: "Set<T> emptySet()", documentation: "Returns an empty immutable set.", kind: "method" },
  { label: "emptyMap", insertText: "emptyMap()", detail: "Map<K,V> emptyMap()", documentation: "Returns an empty immutable map.", kind: "method" },
  { label: "unmodifiableList", insertText: "unmodifiableList(${1:list})", detail: "List<T> unmodifiableList(List<T>)", documentation: "Returns an unmodifiable view of the list.", kind: "method" },
  { label: "unmodifiableSet", insertText: "unmodifiableSet(${1:s})", detail: "Set<T> unmodifiableSet(Set<T>)", documentation: "Returns an unmodifiable view of the set.", kind: "method" },
  { label: "unmodifiableMap", insertText: "unmodifiableMap(${1:m})", detail: "Map<K,V> unmodifiableMap(Map<K,V>)", documentation: "Returns an unmodifiable view of the map.", kind: "method" },
  { label: "synchronizedList", insertText: "synchronizedList(${1:list})", detail: "List<T> synchronizedList(List<T>)", documentation: "Returns a synchronized (thread-safe) list.", kind: "method" },
  { label: "rotate", insertText: "rotate(${1:list}, ${2:distance})", detail: "void rotate(List<?> list, int distance)", documentation: "Rotates the elements by the specified distance.", kind: "method" },
  { label: "replaceAll", insertText: "replaceAll(${1:list}, ${2:oldVal}, ${3:newVal})", detail: "boolean replaceAll(List<T>, T old, T new)", documentation: "Replaces all occurrences of one value with another.", kind: "method" },
  { label: "addAll", insertText: "addAll(${1:c}, ${2:elements})", detail: "boolean addAll(Collection<T> c, T... elements)", documentation: "Adds all specified elements to the collection.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// String (instance methods)
// ═══════════════════════════════════════════════════════
const STRING_INSTANCE: JavaMethodCompletion[] = [
  { label: "length", insertText: "length()", detail: "int length()", documentation: "Returns the length of this string.", kind: "method" },
  { label: "charAt", insertText: "charAt(${1:index})", detail: "char charAt(int index)", documentation: "Returns the char at the specified index.", kind: "method" },
  { label: "substring", insertText: "substring(${1:beginIndex})", detail: "String substring(int begin)", documentation: "Returns substring from begin to end.", kind: "method" },
  { label: "substring", insertText: "substring(${1:beginIndex}, ${2:endIndex})", detail: "String substring(int begin, int end)", documentation: "Returns substring from begin to end (exclusive).", kind: "method" },
  { label: "indexOf", insertText: "indexOf(${1:str})", detail: "int indexOf(String str)", documentation: "Returns the index of the first occurrence.", kind: "method" },
  { label: "lastIndexOf", insertText: "lastIndexOf(${1:str})", detail: "int lastIndexOf(String str)", documentation: "Returns the index of the last occurrence.", kind: "method" },
  { label: "contains", insertText: "contains(${1:s})", detail: "boolean contains(CharSequence s)", documentation: "Returns true if this string contains the sequence.", kind: "method" },
  { label: "startsWith", insertText: "startsWith(${1:prefix})", detail: "boolean startsWith(String prefix)", documentation: "Tests if this string starts with the prefix.", kind: "method" },
  { label: "endsWith", insertText: "endsWith(${1:suffix})", detail: "boolean endsWith(String suffix)", documentation: "Tests if this string ends with the suffix.", kind: "method" },
  { label: "equals", insertText: "equals(${1:anObject})", detail: "boolean equals(Object obj)", documentation: "Compares this string to the specified object.", kind: "method" },
  { label: "equalsIgnoreCase", insertText: "equalsIgnoreCase(${1:anotherString})", detail: "boolean equalsIgnoreCase(String)", documentation: "Case-insensitive comparison.", kind: "method" },
  { label: "compareTo", insertText: "compareTo(${1:anotherString})", detail: "int compareTo(String)", documentation: "Compares lexicographically.", kind: "method" },
  { label: "compareToIgnoreCase", insertText: "compareToIgnoreCase(${1:str})", detail: "int compareToIgnoreCase(String)", documentation: "Case-insensitive lexicographic comparison.", kind: "method" },
  { label: "isEmpty", insertText: "isEmpty()", detail: "boolean isEmpty()", documentation: "Returns true if length() is 0.", kind: "method" },
  { label: "isBlank", insertText: "isBlank()", detail: "boolean isBlank()", documentation: "Returns true if string is empty or contains only whitespace.", kind: "method" },
  { label: "trim", insertText: "trim()", detail: "String trim()", documentation: "Returns a string with leading/trailing whitespace removed.", kind: "method" },
  { label: "strip", insertText: "strip()", detail: "String strip()", documentation: "Returns a string with leading/trailing whitespace removed (Unicode-aware).", kind: "method" },
  { label: "toLowerCase", insertText: "toLowerCase()", detail: "String toLowerCase()", documentation: "Converts to lowercase.", kind: "method" },
  { label: "toUpperCase", insertText: "toUpperCase()", detail: "String toUpperCase()", documentation: "Converts to uppercase.", kind: "method" },
  { label: "toCharArray", insertText: "toCharArray()", detail: "char[] toCharArray()", documentation: "Converts this string to a char array.", kind: "method" },
  { label: "replace", insertText: "replace(${1:oldChar}, ${2:newChar})", detail: "String replace(char old, char new)", documentation: "Replaces all occurrences of a char.", kind: "method" },
  { label: "replaceAll", insertText: "replaceAll(${1:regex}, ${2:replacement})", detail: "String replaceAll(String regex, String repl)", documentation: "Replaces all substrings matching the regex.", kind: "method" },
  { label: "replaceFirst", insertText: "replaceFirst(${1:regex}, ${2:replacement})", detail: "String replaceFirst(String regex, String repl)", documentation: "Replaces the first substring matching the regex.", kind: "method" },
  { label: "split", insertText: "split(${1:regex})", detail: "String[] split(String regex)", documentation: "Splits the string around matches of the regex.", kind: "method" },
  { label: "split", insertText: "split(${1:regex}, ${2:limit})", detail: "String[] split(String regex, int limit)", documentation: "Splits with a limit on the number of parts.", kind: "method" },
  { label: "matches", insertText: "matches(${1:regex})", detail: "boolean matches(String regex)", documentation: "Tells whether this string matches the regex.", kind: "method" },
  { label: "chars", insertText: "chars()", detail: "IntStream chars()", documentation: "Returns an IntStream of char values.", kind: "method" },
  { label: "codePoints", insertText: "codePoints()", detail: "IntStream codePoints()", documentation: "Returns an IntStream of Unicode code points.", kind: "method" },
  { label: "repeat", insertText: "repeat(${1:count})", detail: "String repeat(int count)", documentation: "Returns a string repeated count times.", kind: "method" },
  { label: "intern", insertText: "intern()", detail: "String intern()", documentation: "Returns a canonical representation.", kind: "method" },
  { label: "hashCode", insertText: "hashCode()", detail: "int hashCode()", documentation: "Returns a hash code for this string.", kind: "method" },
];

const STRING_STATIC: JavaMethodCompletion[] = [
  { label: "valueOf", insertText: "valueOf(${1:obj})", detail: "String valueOf(Object obj)", documentation: "Returns the string representation.", kind: "method" },
  { label: "format", insertText: "format(${1:format}, ${2:args})", detail: "String format(String fmt, Object... args)", documentation: "Returns a formatted string.", kind: "method" },
  { label: "join", insertText: "join(${1:delimiter}, ${2:elements})", detail: "String join(CharSequence delim, CharSequence... elements)", documentation: "Returns a new string joined with the delimiter.", kind: "method" },
  { label: "copyValueOf", insertText: "copyValueOf(${1:data})", detail: "String copyValueOf(char[] data)", documentation: "Returns a String from the char array.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// StringBuilder (instance methods)
// ═══════════════════════════════════════════════════════
const STRINGBUILDER_INSTANCE: JavaMethodCompletion[] = [
  { label: "append", insertText: "append(${1:s})", detail: "StringBuilder append(String s)", documentation: "Appends the string representation.", kind: "method" },
  { label: "insert", insertText: "insert(${1:offset}, ${2:str})", detail: "StringBuilder insert(int offset, String str)", documentation: "Inserts the string at the specified offset.", kind: "method" },
  { label: "delete", insertText: "delete(${1:start}, ${2:end})", detail: "StringBuilder delete(int start, int end)", documentation: "Removes the characters in a substring.", kind: "method" },
  { label: "deleteCharAt", insertText: "deleteCharAt(${1:index})", detail: "StringBuilder deleteCharAt(int index)", documentation: "Removes the char at the specified index.", kind: "method" },
  { label: "replace", insertText: "replace(${1:start}, ${2:end}, ${3:str})", detail: "StringBuilder replace(int start, int end, String str)", documentation: "Replaces characters in a substring.", kind: "method" },
  { label: "reverse", insertText: "reverse()", detail: "StringBuilder reverse()", documentation: "Reverses the character sequence.", kind: "method" },
  { label: "length", insertText: "length()", detail: "int length()", documentation: "Returns the length (character count).", kind: "method" },
  { label: "charAt", insertText: "charAt(${1:index})", detail: "char charAt(int index)", documentation: "Returns the char at the specified index.", kind: "method" },
  { label: "setCharAt", insertText: "setCharAt(${1:index}, ${2:ch})", detail: "void setCharAt(int index, char ch)", documentation: "Sets the char at the specified index.", kind: "method" },
  { label: "substring", insertText: "substring(${1:start})", detail: "String substring(int start)", documentation: "Returns a new String from start to end.", kind: "method" },
  { label: "substring", insertText: "substring(${1:start}, ${2:end})", detail: "String substring(int start, int end)", documentation: "Returns a substring.", kind: "method" },
  { label: "indexOf", insertText: "indexOf(${1:str})", detail: "int indexOf(String str)", documentation: "Returns index of first occurrence.", kind: "method" },
  { label: "lastIndexOf", insertText: "lastIndexOf(${1:str})", detail: "int lastIndexOf(String str)", documentation: "Returns index of last occurrence.", kind: "method" },
  { label: "toString", insertText: "toString()", detail: "String toString()", documentation: "Returns a string representing the data.", kind: "method" },
  { label: "capacity", insertText: "capacity()", detail: "int capacity()", documentation: "Returns the current capacity.", kind: "method" },
  { label: "ensureCapacity", insertText: "ensureCapacity(${1:minimumCapacity})", detail: "void ensureCapacity(int min)", documentation: "Ensures that the capacity is at least equal to the specified minimum.", kind: "method" },
  { label: "trimToSize", insertText: "trimToSize()", detail: "void trimToSize()", documentation: "Attempts to reduce storage used for the character sequence.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// List (instance methods — ArrayList, LinkedList, etc.)
// ═══════════════════════════════════════════════════════
const LIST_INSTANCE: JavaMethodCompletion[] = [
  { label: "add", insertText: "add(${1:e})", detail: "boolean add(E e)", documentation: "Appends the specified element.", kind: "method" },
  { label: "add", insertText: "add(${1:index}, ${2:element})", detail: "void add(int index, E element)", documentation: "Inserts at the specified position.", kind: "method" },
  { label: "addAll", insertText: "addAll(${1:c})", detail: "boolean addAll(Collection<? extends E> c)", documentation: "Appends all elements from the collection.", kind: "method" },
  { label: "get", insertText: "get(${1:index})", detail: "E get(int index)", documentation: "Returns the element at the specified position.", kind: "method" },
  { label: "set", insertText: "set(${1:index}, ${2:element})", detail: "E set(int index, E element)", documentation: "Replaces the element at the specified position.", kind: "method" },
  { label: "remove", insertText: "remove(${1:index})", detail: "E remove(int index)", documentation: "Removes the element at the specified position.", kind: "method" },
  { label: "size", insertText: "size()", detail: "int size()", documentation: "Returns the number of elements.", kind: "method" },
  { label: "isEmpty", insertText: "isEmpty()", detail: "boolean isEmpty()", documentation: "Returns true if this list contains no elements.", kind: "method" },
  { label: "contains", insertText: "contains(${1:o})", detail: "boolean contains(Object o)", documentation: "Returns true if this list contains the element.", kind: "method" },
  { label: "indexOf", insertText: "indexOf(${1:o})", detail: "int indexOf(Object o)", documentation: "Returns the index of the first occurrence.", kind: "method" },
  { label: "lastIndexOf", insertText: "lastIndexOf(${1:o})", detail: "int lastIndexOf(Object o)", documentation: "Returns the index of the last occurrence.", kind: "method" },
  { label: "clear", insertText: "clear()", detail: "void clear()", documentation: "Removes all elements.", kind: "method" },
  { label: "toArray", insertText: "toArray()", detail: "Object[] toArray()", documentation: "Returns an array containing all elements.", kind: "method" },
  { label: "subList", insertText: "subList(${1:fromIndex}, ${2:toIndex})", detail: "List<E> subList(int from, int to)", documentation: "Returns a view of the portion of this list.", kind: "method" },
  { label: "sort", insertText: "sort(${1:c})", detail: "void sort(Comparator<? super E> c)", documentation: "Sorts this list with the comparator.", kind: "method" },
  { label: "iterator", insertText: "iterator()", detail: "Iterator<E> iterator()", documentation: "Returns an iterator.", kind: "method" },
  { label: "listIterator", insertText: "listIterator()", detail: "ListIterator<E> listIterator()", documentation: "Returns a list iterator.", kind: "method" },
  { label: "stream", insertText: "stream()", detail: "Stream<E> stream()", documentation: "Returns a sequential Stream.", kind: "method" },
  { label: "forEach", insertText: "forEach(${1:action})", detail: "void forEach(Consumer<? super E> action)", documentation: "Performs the given action for each element.", kind: "method" },
  { label: "removeIf", insertText: "removeIf(${1:filter})", detail: "boolean removeIf(Predicate<? super E> filter)", documentation: "Removes all elements matching the predicate.", kind: "method" },
  { label: "containsAll", insertText: "containsAll(${1:c})", detail: "boolean containsAll(Collection<?> c)", documentation: "Returns true if this list contains all elements of the collection.", kind: "method" },
  { label: "retainAll", insertText: "retainAll(${1:c})", detail: "boolean retainAll(Collection<?> c)", documentation: "Retains only elements in the specified collection.", kind: "method" },
  { label: "removeAll", insertText: "removeAll(${1:c})", detail: "boolean removeAll(Collection<?> c)", documentation: "Removes all elements in the specified collection.", kind: "method" },
  { label: "of", insertText: "of(${1:elements})", detail: "List<E> of(E... elements)", documentation: "Returns an unmodifiable list containing the elements.", kind: "method" },
  { label: "copyOf", insertText: "copyOf(${1:coll})", detail: "List<E> copyOf(Collection<E>)", documentation: "Returns an unmodifiable list copy.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Map (instance methods — HashMap, TreeMap, LinkedHashMap)
// ═══════════════════════════════════════════════════════
const MAP_INSTANCE: JavaMethodCompletion[] = [
  { label: "put", insertText: "put(${1:key}, ${2:value})", detail: "V put(K key, V value)", documentation: "Associates the value with the key.", kind: "method" },
  { label: "get", insertText: "get(${1:key})", detail: "V get(Object key)", documentation: "Returns the value mapped to the key, or null.", kind: "method" },
  { label: "getOrDefault", insertText: "getOrDefault(${1:key}, ${2:defaultValue})", detail: "V getOrDefault(Object key, V defaultValue)", documentation: "Returns value or defaultValue if not present.", kind: "method" },
  { label: "containsKey", insertText: "containsKey(${1:key})", detail: "boolean containsKey(Object key)", documentation: "Returns true if this map contains the key.", kind: "method" },
  { label: "containsValue", insertText: "containsValue(${1:value})", detail: "boolean containsValue(Object value)", documentation: "Returns true if this map maps to the value.", kind: "method" },
  { label: "remove", insertText: "remove(${1:key})", detail: "V remove(Object key)", documentation: "Removes the mapping for the key.", kind: "method" },
  { label: "putIfAbsent", insertText: "putIfAbsent(${1:key}, ${2:value})", detail: "V putIfAbsent(K key, V value)", documentation: "If the key is not already associated, associates it.", kind: "method" },
  { label: "merge", insertText: "merge(${1:key}, ${2:value}, ${3:remappingFunction})", detail: "V merge(K key, V value, BiFunction)", documentation: "If key is absent, associates with value; else applies the remapping function.", kind: "method" },
  { label: "compute", insertText: "compute(${1:key}, ${2:remappingFunction})", detail: "V compute(K key, BiFunction)", documentation: "Computes a mapping for the specified key.", kind: "method" },
  { label: "computeIfAbsent", insertText: "computeIfAbsent(${1:key}, ${2:mappingFunction})", detail: "V computeIfAbsent(K key, Function)", documentation: "If absent, computes the value using the function.", kind: "method" },
  { label: "computeIfPresent", insertText: "computeIfPresent(${1:key}, ${2:remappingFunction})", detail: "V computeIfPresent(K key, BiFunction)", documentation: "If present, computes a new mapping.", kind: "method" },
  { label: "replace", insertText: "replace(${1:key}, ${2:value})", detail: "V replace(K key, V value)", documentation: "Replaces the entry for the specified key.", kind: "method" },
  { label: "size", insertText: "size()", detail: "int size()", documentation: "Returns the number of key-value mappings.", kind: "method" },
  { label: "isEmpty", insertText: "isEmpty()", detail: "boolean isEmpty()", documentation: "Returns true if this map contains no mappings.", kind: "method" },
  { label: "clear", insertText: "clear()", detail: "void clear()", documentation: "Removes all mappings.", kind: "method" },
  { label: "keySet", insertText: "keySet()", detail: "Set<K> keySet()", documentation: "Returns a Set view of the keys.", kind: "method" },
  { label: "values", insertText: "values()", detail: "Collection<V> values()", documentation: "Returns a Collection view of the values.", kind: "method" },
  { label: "entrySet", insertText: "entrySet()", detail: "Set<Map.Entry<K,V>> entrySet()", documentation: "Returns a Set view of the mappings.", kind: "method" },
  { label: "forEach", insertText: "forEach(${1:(k, v) -> {}})", detail: "void forEach(BiConsumer)", documentation: "Performs the action for each entry.", kind: "method" },
  { label: "replaceAll", insertText: "replaceAll(${1:(k, v) -> v})", detail: "void replaceAll(BiFunction)", documentation: "Replaces each value with the result of the function.", kind: "method" },
  { label: "putAll", insertText: "putAll(${1:m})", detail: "void putAll(Map<K,V> m)", documentation: "Copies all mappings from the specified map.", kind: "method" },
  { label: "of", insertText: "of(${1:k1}, ${2:v1})", detail: "Map<K,V> of(K k, V v, ...)", documentation: "Returns an unmodifiable map with the given entries.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Set (instance methods — HashSet, TreeSet, LinkedHashSet)
// ═══════════════════════════════════════════════════════
const SET_INSTANCE: JavaMethodCompletion[] = [
  { label: "add", insertText: "add(${1:e})", detail: "boolean add(E e)", documentation: "Adds the specified element.", kind: "method" },
  { label: "remove", insertText: "remove(${1:o})", detail: "boolean remove(Object o)", documentation: "Removes the specified element.", kind: "method" },
  { label: "contains", insertText: "contains(${1:o})", detail: "boolean contains(Object o)", documentation: "Returns true if this set contains the element.", kind: "method" },
  { label: "size", insertText: "size()", detail: "int size()", documentation: "Returns the number of elements.", kind: "method" },
  { label: "isEmpty", insertText: "isEmpty()", detail: "boolean isEmpty()", documentation: "Returns true if this set contains no elements.", kind: "method" },
  { label: "clear", insertText: "clear()", detail: "void clear()", documentation: "Removes all elements.", kind: "method" },
  { label: "iterator", insertText: "iterator()", detail: "Iterator<E> iterator()", documentation: "Returns an iterator.", kind: "method" },
  { label: "toArray", insertText: "toArray()", detail: "Object[] toArray()", documentation: "Returns an array containing all elements.", kind: "method" },
  { label: "addAll", insertText: "addAll(${1:c})", detail: "boolean addAll(Collection<? extends E> c)", documentation: "Adds all elements from the collection.", kind: "method" },
  { label: "retainAll", insertText: "retainAll(${1:c})", detail: "boolean retainAll(Collection<?> c)", documentation: "Retains only elements in the specified collection (intersection).", kind: "method" },
  { label: "removeAll", insertText: "removeAll(${1:c})", detail: "boolean removeAll(Collection<?> c)", documentation: "Removes all elements in the specified collection (difference).", kind: "method" },
  { label: "containsAll", insertText: "containsAll(${1:c})", detail: "boolean containsAll(Collection<?> c)", documentation: "Returns true if this set contains all elements of the collection.", kind: "method" },
  { label: "stream", insertText: "stream()", detail: "Stream<E> stream()", documentation: "Returns a sequential Stream.", kind: "method" },
  { label: "forEach", insertText: "forEach(${1:action})", detail: "void forEach(Consumer<? super E> action)", documentation: "Performs the given action for each element.", kind: "method" },
  { label: "removeIf", insertText: "removeIf(${1:filter})", detail: "boolean removeIf(Predicate<? super E> filter)", documentation: "Removes all elements matching the predicate.", kind: "method" },
  { label: "of", insertText: "of(${1:elements})", detail: "Set<E> of(E... elements)", documentation: "Returns an unmodifiable set.", kind: "method" },
  { label: "copyOf", insertText: "copyOf(${1:coll})", detail: "Set<E> copyOf(Collection<E>)", documentation: "Returns an unmodifiable set copy.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// TreeMap additional (NavigableMap methods)
// ═══════════════════════════════════════════════════════
const TREEMAP_EXTRA: JavaMethodCompletion[] = [
  { label: "firstKey", insertText: "firstKey()", detail: "K firstKey()", documentation: "Returns the first (lowest) key.", kind: "method" },
  { label: "lastKey", insertText: "lastKey()", detail: "K lastKey()", documentation: "Returns the last (highest) key.", kind: "method" },
  { label: "firstEntry", insertText: "firstEntry()", detail: "Map.Entry<K,V> firstEntry()", documentation: "Returns the entry with the least key.", kind: "method" },
  { label: "lastEntry", insertText: "lastEntry()", detail: "Map.Entry<K,V> lastEntry()", documentation: "Returns the entry with the greatest key.", kind: "method" },
  { label: "pollFirstEntry", insertText: "pollFirstEntry()", detail: "Map.Entry<K,V> pollFirstEntry()", documentation: "Removes and returns the entry with the least key.", kind: "method" },
  { label: "pollLastEntry", insertText: "pollLastEntry()", detail: "Map.Entry<K,V> pollLastEntry()", documentation: "Removes and returns the entry with the greatest key.", kind: "method" },
  { label: "ceilingKey", insertText: "ceilingKey(${1:key})", detail: "K ceilingKey(K key)", documentation: "Returns the least key >= given key, or null.", kind: "method" },
  { label: "floorKey", insertText: "floorKey(${1:key})", detail: "K floorKey(K key)", documentation: "Returns the greatest key <= given key, or null.", kind: "method" },
  { label: "higherKey", insertText: "higherKey(${1:key})", detail: "K higherKey(K key)", documentation: "Returns the least key strictly > given key, or null.", kind: "method" },
  { label: "lowerKey", insertText: "lowerKey(${1:key})", detail: "K lowerKey(K key)", documentation: "Returns the greatest key strictly < given key, or null.", kind: "method" },
  { label: "ceilingEntry", insertText: "ceilingEntry(${1:key})", detail: "Map.Entry<K,V> ceilingEntry(K key)", documentation: "Returns entry with least key >= given key.", kind: "method" },
  { label: "floorEntry", insertText: "floorEntry(${1:key})", detail: "Map.Entry<K,V> floorEntry(K key)", documentation: "Returns entry with greatest key <= given key.", kind: "method" },
  { label: "higherEntry", insertText: "higherEntry(${1:key})", detail: "Map.Entry<K,V> higherEntry(K key)", documentation: "Returns entry with least key strictly > given key.", kind: "method" },
  { label: "lowerEntry", insertText: "lowerEntry(${1:key})", detail: "Map.Entry<K,V> lowerEntry(K key)", documentation: "Returns entry with greatest key strictly < given key.", kind: "method" },
  { label: "headMap", insertText: "headMap(${1:toKey})", detail: "SortedMap<K,V> headMap(K toKey)", documentation: "Returns a view of the map whose keys are strictly less than toKey.", kind: "method" },
  { label: "tailMap", insertText: "tailMap(${1:fromKey})", detail: "SortedMap<K,V> tailMap(K fromKey)", documentation: "Returns a view of the map whose keys are >= fromKey.", kind: "method" },
  { label: "subMap", insertText: "subMap(${1:fromKey}, ${2:toKey})", detail: "SortedMap<K,V> subMap(K from, K to)", documentation: "Returns a view of the map whose keys range from fromKey to toKey.", kind: "method" },
  { label: "descendingMap", insertText: "descendingMap()", detail: "NavigableMap<K,V> descendingMap()", documentation: "Returns a reverse order view.", kind: "method" },
  { label: "navigableKeySet", insertText: "navigableKeySet()", detail: "NavigableSet<K> navigableKeySet()", documentation: "Returns a NavigableSet view of the keys.", kind: "method" },
  { label: "descendingKeySet", insertText: "descendingKeySet()", detail: "NavigableSet<K> descendingKeySet()", documentation: "Returns a reverse order NavigableSet view of the keys.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// TreeSet additional (NavigableSet methods)
// ═══════════════════════════════════════════════════════
const TREESET_EXTRA: JavaMethodCompletion[] = [
  { label: "first", insertText: "first()", detail: "E first()", documentation: "Returns the first (lowest) element.", kind: "method" },
  { label: "last", insertText: "last()", detail: "E last()", documentation: "Returns the last (highest) element.", kind: "method" },
  { label: "pollFirst", insertText: "pollFirst()", detail: "E pollFirst()", documentation: "Retrieves and removes the first element, or null.", kind: "method" },
  { label: "pollLast", insertText: "pollLast()", detail: "E pollLast()", documentation: "Retrieves and removes the last element, or null.", kind: "method" },
  { label: "ceiling", insertText: "ceiling(${1:e})", detail: "E ceiling(E e)", documentation: "Returns the least element >= e, or null.", kind: "method" },
  { label: "floor", insertText: "floor(${1:e})", detail: "E floor(E e)", documentation: "Returns the greatest element <= e, or null.", kind: "method" },
  { label: "higher", insertText: "higher(${1:e})", detail: "E higher(E e)", documentation: "Returns the least element strictly > e, or null.", kind: "method" },
  { label: "lower", insertText: "lower(${1:e})", detail: "E lower(E e)", documentation: "Returns the greatest element strictly < e, or null.", kind: "method" },
  { label: "headSet", insertText: "headSet(${1:toElement})", detail: "SortedSet<E> headSet(E toElement)", documentation: "Returns elements strictly less than toElement.", kind: "method" },
  { label: "tailSet", insertText: "tailSet(${1:fromElement})", detail: "SortedSet<E> tailSet(E fromElement)", documentation: "Returns elements >= fromElement.", kind: "method" },
  { label: "subSet", insertText: "subSet(${1:fromElement}, ${2:toElement})", detail: "SortedSet<E> subSet(E from, E to)", documentation: "Returns elements from from (inclusive) to to (exclusive).", kind: "method" },
  { label: "descendingSet", insertText: "descendingSet()", detail: "NavigableSet<E> descendingSet()", documentation: "Returns a reverse order view.", kind: "method" },
  { label: "descendingIterator", insertText: "descendingIterator()", detail: "Iterator<E> descendingIterator()", documentation: "Returns an iterator in descending order.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Queue / Deque / PriorityQueue (instance methods)
// ═══════════════════════════════════════════════════════
const QUEUE_INSTANCE: JavaMethodCompletion[] = [
  { label: "offer", insertText: "offer(${1:e})", detail: "boolean offer(E e)", documentation: "Inserts the element if possible.", kind: "method" },
  { label: "poll", insertText: "poll()", detail: "E poll()", documentation: "Retrieves and removes the head, or null.", kind: "method" },
  { label: "peek", insertText: "peek()", detail: "E peek()", documentation: "Retrieves but does not remove the head, or null.", kind: "method" },
  { label: "add", insertText: "add(${1:e})", detail: "boolean add(E e)", documentation: "Inserts the element (throws if full).", kind: "method" },
  { label: "remove", insertText: "remove()", detail: "E remove()", documentation: "Retrieves and removes the head (throws if empty).", kind: "method" },
  { label: "element", insertText: "element()", detail: "E element()", documentation: "Retrieves but does not remove the head (throws if empty).", kind: "method" },
  { label: "size", insertText: "size()", detail: "int size()", documentation: "Returns the number of elements.", kind: "method" },
  { label: "isEmpty", insertText: "isEmpty()", detail: "boolean isEmpty()", documentation: "Returns true if empty.", kind: "method" },
  { label: "contains", insertText: "contains(${1:o})", detail: "boolean contains(Object o)", documentation: "Returns true if contains the element.", kind: "method" },
  { label: "clear", insertText: "clear()", detail: "void clear()", documentation: "Removes all elements.", kind: "method" },
  { label: "toArray", insertText: "toArray()", detail: "Object[] toArray()", documentation: "Returns an array containing all elements.", kind: "method" },
  { label: "iterator", insertText: "iterator()", detail: "Iterator<E> iterator()", documentation: "Returns an iterator.", kind: "method" },
  { label: "stream", insertText: "stream()", detail: "Stream<E> stream()", documentation: "Returns a sequential Stream.", kind: "method" },
  { label: "forEach", insertText: "forEach(${1:action})", detail: "void forEach(Consumer action)", documentation: "Performs action for each element.", kind: "method" },
];

const DEQUE_EXTRA: JavaMethodCompletion[] = [
  { label: "offerFirst", insertText: "offerFirst(${1:e})", detail: "boolean offerFirst(E e)", documentation: "Inserts at front.", kind: "method" },
  { label: "offerLast", insertText: "offerLast(${1:e})", detail: "boolean offerLast(E e)", documentation: "Inserts at end.", kind: "method" },
  { label: "pollFirst", insertText: "pollFirst()", detail: "E pollFirst()", documentation: "Retrieves and removes the first element, or null.", kind: "method" },
  { label: "pollLast", insertText: "pollLast()", detail: "E pollLast()", documentation: "Retrieves and removes the last element, or null.", kind: "method" },
  { label: "peekFirst", insertText: "peekFirst()", detail: "E peekFirst()", documentation: "Retrieves but does not remove the first element, or null.", kind: "method" },
  { label: "peekLast", insertText: "peekLast()", detail: "E peekLast()", documentation: "Retrieves but does not remove the last element, or null.", kind: "method" },
  { label: "addFirst", insertText: "addFirst(${1:e})", detail: "void addFirst(E e)", documentation: "Inserts at front (throws if full).", kind: "method" },
  { label: "addLast", insertText: "addLast(${1:e})", detail: "void addLast(E e)", documentation: "Inserts at end (throws if full).", kind: "method" },
  { label: "removeFirst", insertText: "removeFirst()", detail: "E removeFirst()", documentation: "Retrieves and removes the first element (throws if empty).", kind: "method" },
  { label: "removeLast", insertText: "removeLast()", detail: "E removeLast()", documentation: "Retrieves and removes the last element (throws if empty).", kind: "method" },
  { label: "getFirst", insertText: "getFirst()", detail: "E getFirst()", documentation: "Retrieves but does not remove the first element (throws if empty).", kind: "method" },
  { label: "getLast", insertText: "getLast()", detail: "E getLast()", documentation: "Retrieves but does not remove the last element (throws if empty).", kind: "method" },
  { label: "push", insertText: "push(${1:e})", detail: "void push(E e)", documentation: "Pushes an element onto the stack (front).", kind: "method" },
  { label: "pop", insertText: "pop()", detail: "E pop()", documentation: "Pops an element from the stack (front).", kind: "method" },
  { label: "descendingIterator", insertText: "descendingIterator()", detail: "Iterator<E> descendingIterator()", documentation: "Returns an iterator in reverse order.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Stack (instance methods — legacy but still used in CP)
// ═══════════════════════════════════════════════════════
const STACK_INSTANCE: JavaMethodCompletion[] = [
  { label: "push", insertText: "push(${1:item})", detail: "E push(E item)", documentation: "Pushes an item onto the stack.", kind: "method" },
  { label: "pop", insertText: "pop()", detail: "E pop()", documentation: "Removes and returns the top element.", kind: "method" },
  { label: "peek", insertText: "peek()", detail: "E peek()", documentation: "Looks at the top element without removing.", kind: "method" },
  { label: "empty", insertText: "empty()", detail: "boolean empty()", documentation: "Tests if this stack is empty.", kind: "method" },
  { label: "search", insertText: "search(${1:o})", detail: "int search(Object o)", documentation: "Returns the 1-based position from the top.", kind: "method" },
  { label: "size", insertText: "size()", detail: "int size()", documentation: "Returns the number of elements.", kind: "method" },
  { label: "isEmpty", insertText: "isEmpty()", detail: "boolean isEmpty()", documentation: "Returns true if empty.", kind: "method" },
  { label: "contains", insertText: "contains(${1:o})", detail: "boolean contains(Object o)", documentation: "Returns true if contains the element.", kind: "method" },
  { label: "clear", insertText: "clear()", detail: "void clear()", documentation: "Removes all elements.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// BigInteger (java.math.BigInteger)
// ═══════════════════════════════════════════════════════
const BIGINTEGER_STATIC: JavaMethodCompletion[] = [
  { label: "valueOf", insertText: "valueOf(${1:val})", detail: "BigInteger valueOf(long val)", documentation: "Returns a BigInteger whose value is the specified long.", kind: "method" },
  { label: "ZERO", insertText: "ZERO", detail: "BigInteger ZERO", documentation: "The BigInteger constant 0.", kind: "field" },
  { label: "ONE", insertText: "ONE", detail: "BigInteger ONE", documentation: "The BigInteger constant 1.", kind: "field" },
  { label: "TWO", insertText: "TWO", detail: "BigInteger TWO", documentation: "The BigInteger constant 2.", kind: "field" },
  { label: "TEN", insertText: "TEN", detail: "BigInteger TEN", documentation: "The BigInteger constant 10.", kind: "field" },
  { label: "probablePrime", insertText: "probablePrime(${1:bitLength}, ${2:rnd})", detail: "BigInteger probablePrime(int bitLength, Random rnd)", documentation: "Returns a probable prime of the specified bit length.", kind: "method" },
];

const BIGINTEGER_INSTANCE: JavaMethodCompletion[] = [
  { label: "add", insertText: "add(${1:val})", detail: "BigInteger add(BigInteger val)", documentation: "Returns (this + val).", kind: "method" },
  { label: "subtract", insertText: "subtract(${1:val})", detail: "BigInteger subtract(BigInteger val)", documentation: "Returns (this - val).", kind: "method" },
  { label: "multiply", insertText: "multiply(${1:val})", detail: "BigInteger multiply(BigInteger val)", documentation: "Returns (this * val).", kind: "method" },
  { label: "divide", insertText: "divide(${1:val})", detail: "BigInteger divide(BigInteger val)", documentation: "Returns (this / val).", kind: "method" },
  { label: "mod", insertText: "mod(${1:m})", detail: "BigInteger mod(BigInteger m)", documentation: "Returns (this mod m).", kind: "method" },
  { label: "remainder", insertText: "remainder(${1:val})", detail: "BigInteger remainder(BigInteger val)", documentation: "Returns (this % val).", kind: "method" },
  { label: "pow", insertText: "pow(${1:exponent})", detail: "BigInteger pow(int exponent)", documentation: "Returns this^exponent.", kind: "method" },
  { label: "modPow", insertText: "modPow(${1:exponent}, ${2:m})", detail: "BigInteger modPow(BigInteger exp, BigInteger m)", documentation: "Returns (this^exp mod m).", kind: "method" },
  { label: "modInverse", insertText: "modInverse(${1:m})", detail: "BigInteger modInverse(BigInteger m)", documentation: "Returns modular multiplicative inverse.", kind: "method" },
  { label: "gcd", insertText: "gcd(${1:val})", detail: "BigInteger gcd(BigInteger val)", documentation: "Returns gcd(this, val).", kind: "method" },
  { label: "abs", insertText: "abs()", detail: "BigInteger abs()", documentation: "Returns absolute value.", kind: "method" },
  { label: "negate", insertText: "negate()", detail: "BigInteger negate()", documentation: "Returns -this.", kind: "method" },
  { label: "signum", insertText: "signum()", detail: "int signum()", documentation: "Returns signum: -1, 0, or 1.", kind: "method" },
  { label: "compareTo", insertText: "compareTo(${1:val})", detail: "int compareTo(BigInteger val)", documentation: "Compares this with val.", kind: "method" },
  { label: "equals", insertText: "equals(${1:x})", detail: "boolean equals(Object x)", documentation: "Checks equality.", kind: "method" },
  { label: "min", insertText: "min(${1:val})", detail: "BigInteger min(BigInteger val)", documentation: "Returns the minimum.", kind: "method" },
  { label: "max", insertText: "max(${1:val})", detail: "BigInteger max(BigInteger val)", documentation: "Returns the maximum.", kind: "method" },
  { label: "intValue", insertText: "intValue()", detail: "int intValue()", documentation: "Converts to int.", kind: "method" },
  { label: "longValue", insertText: "longValue()", detail: "long longValue()", documentation: "Converts to long.", kind: "method" },
  { label: "toString", insertText: "toString()", detail: "String toString()", documentation: "Returns decimal string representation.", kind: "method" },
  { label: "toString", insertText: "toString(${1:radix})", detail: "String toString(int radix)", documentation: "Returns string in specified radix.", kind: "method" },
  { label: "bitCount", insertText: "bitCount()", detail: "int bitCount()", documentation: "Returns number of bits in two's complement that differ from sign bit.", kind: "method" },
  { label: "bitLength", insertText: "bitLength()", detail: "int bitLength()", documentation: "Returns number of bits in the minimal representation.", kind: "method" },
  { label: "testBit", insertText: "testBit(${1:n})", detail: "boolean testBit(int n)", documentation: "Returns true if the designated bit is set.", kind: "method" },
  { label: "setBit", insertText: "setBit(${1:n})", detail: "BigInteger setBit(int n)", documentation: "Returns a BigInteger with the designated bit set.", kind: "method" },
  { label: "clearBit", insertText: "clearBit(${1:n})", detail: "BigInteger clearBit(int n)", documentation: "Returns a BigInteger with the designated bit cleared.", kind: "method" },
  { label: "flipBit", insertText: "flipBit(${1:n})", detail: "BigInteger flipBit(int n)", documentation: "Returns a BigInteger with the designated bit flipped.", kind: "method" },
  { label: "shiftLeft", insertText: "shiftLeft(${1:n})", detail: "BigInteger shiftLeft(int n)", documentation: "Returns (this << n).", kind: "method" },
  { label: "shiftRight", insertText: "shiftRight(${1:n})", detail: "BigInteger shiftRight(int n)", documentation: "Returns (this >> n).", kind: "method" },
  { label: "and", insertText: "and(${1:val})", detail: "BigInteger and(BigInteger val)", documentation: "Returns (this & val).", kind: "method" },
  { label: "or", insertText: "or(${1:val})", detail: "BigInteger or(BigInteger val)", documentation: "Returns (this | val).", kind: "method" },
  { label: "xor", insertText: "xor(${1:val})", detail: "BigInteger xor(BigInteger val)", documentation: "Returns (this ^ val).", kind: "method" },
  { label: "not", insertText: "not()", detail: "BigInteger not()", documentation: "Returns (~this).", kind: "method" },
  { label: "isProbablePrime", insertText: "isProbablePrime(${1:certainty})", detail: "boolean isProbablePrime(int certainty)", documentation: "Returns true if this is probably prime.", kind: "method" },
  { label: "toByteArray", insertText: "toByteArray()", detail: "byte[] toByteArray()", documentation: "Returns a byte array.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// System
// ═══════════════════════════════════════════════════════
const SYSTEM_STATIC: JavaMethodCompletion[] = [
  { label: "out", insertText: "out", detail: "PrintStream out", documentation: "The standard output stream.", kind: "field" },
  { label: "err", insertText: "err", detail: "PrintStream err", documentation: "The standard error stream.", kind: "field" },
  { label: "in", insertText: "in", detail: "InputStream in", documentation: "The standard input stream.", kind: "field" },
  { label: "currentTimeMillis", insertText: "currentTimeMillis()", detail: "long currentTimeMillis()", documentation: "Returns the current time in milliseconds.", kind: "method" },
  { label: "nanoTime", insertText: "nanoTime()", detail: "long nanoTime()", documentation: "Returns the current value of the high-resolution time source.", kind: "method" },
  { label: "arraycopy", insertText: "arraycopy(${1:src}, ${2:srcPos}, ${3:dest}, ${4:destPos}, ${5:length})", detail: "void arraycopy(Object src, int srcPos, Object dest, int destPos, int length)", documentation: "Copies an array from the specified source to destination.", kind: "method" },
  { label: "exit", insertText: "exit(${1:status})", detail: "void exit(int status)", documentation: "Terminates the currently running JVM.", kind: "method" },
  { label: "gc", insertText: "gc()", detail: "void gc()", documentation: "Runs the garbage collector.", kind: "method" },
  { label: "lineSeparator", insertText: "lineSeparator()", detail: "String lineSeparator()", documentation: "Returns the system line separator.", kind: "method" },
  { label: "getenv", insertText: "getenv(${1:name})", detail: "String getenv(String name)", documentation: "Gets the value of the specified environment variable.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Objects (java.util.Objects)
// ═══════════════════════════════════════════════════════
const OBJECTS_STATIC: JavaMethodCompletion[] = [
  { label: "equals", insertText: "equals(${1:a}, ${2:b})", detail: "boolean equals(Object a, Object b)", documentation: "Null-safe equals.", kind: "method" },
  { label: "hash", insertText: "hash(${1:values})", detail: "int hash(Object... values)", documentation: "Generates a hash code for a sequence.", kind: "method" },
  { label: "hashCode", insertText: "hashCode(${1:o})", detail: "int hashCode(Object o)", documentation: "Returns hash code, 0 for null.", kind: "method" },
  { label: "toString", insertText: "toString(${1:o})", detail: "String toString(Object o)", documentation: "Returns string representation, \"null\" for null.", kind: "method" },
  { label: "requireNonNull", insertText: "requireNonNull(${1:obj})", detail: "T requireNonNull(T obj)", documentation: "Checks that the object is not null.", kind: "method" },
  { label: "requireNonNull", insertText: "requireNonNull(${1:obj}, ${2:message})", detail: "T requireNonNull(T obj, String msg)", documentation: "Checks not null with custom message.", kind: "method" },
  { label: "isNull", insertText: "isNull(${1:obj})", detail: "boolean isNull(Object obj)", documentation: "Returns true if null.", kind: "method" },
  { label: "nonNull", insertText: "nonNull(${1:obj})", detail: "boolean nonNull(Object obj)", documentation: "Returns true if not null.", kind: "method" },
  { label: "compare", insertText: "compare(${1:a}, ${2:b}, ${3:c})", detail: "int compare(T a, T b, Comparator<T> c)", documentation: "Compares with null-safety.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Stream common operations (for chaining after .stream())
// ═══════════════════════════════════════════════════════
const STREAM_INSTANCE: JavaMethodCompletion[] = [
  { label: "filter", insertText: "filter(${1:predicate})", detail: "Stream<T> filter(Predicate<T>)", documentation: "Returns a stream of elements matching the predicate.", kind: "method" },
  { label: "map", insertText: "map(${1:function})", detail: "Stream<R> map(Function<T,R>)", documentation: "Returns a stream of results of applying the function.", kind: "method" },
  { label: "mapToInt", insertText: "mapToInt(${1:function})", detail: "IntStream mapToInt(ToIntFunction<T>)", documentation: "Returns an IntStream of mapped values.", kind: "method" },
  { label: "mapToLong", insertText: "mapToLong(${1:function})", detail: "LongStream mapToLong(ToLongFunction<T>)", documentation: "Returns a LongStream of mapped values.", kind: "method" },
  { label: "flatMap", insertText: "flatMap(${1:function})", detail: "Stream<R> flatMap(Function<T,Stream<R>>)", documentation: "Flattens mapped streams into one.", kind: "method" },
  { label: "distinct", insertText: "distinct()", detail: "Stream<T> distinct()", documentation: "Returns a stream with distinct elements.", kind: "method" },
  { label: "sorted", insertText: "sorted()", detail: "Stream<T> sorted()", documentation: "Returns a stream sorted in natural order.", kind: "method" },
  { label: "sorted", insertText: "sorted(${1:comparator})", detail: "Stream<T> sorted(Comparator<T>)", documentation: "Returns a stream sorted with the comparator.", kind: "method" },
  { label: "peek", insertText: "peek(${1:action})", detail: "Stream<T> peek(Consumer<T>)", documentation: "Performs action on each element as consumed.", kind: "method" },
  { label: "limit", insertText: "limit(${1:maxSize})", detail: "Stream<T> limit(long maxSize)", documentation: "Truncates the stream to maxSize elements.", kind: "method" },
  { label: "skip", insertText: "skip(${1:n})", detail: "Stream<T> skip(long n)", documentation: "Skips the first n elements.", kind: "method" },
  { label: "forEach", insertText: "forEach(${1:action})", detail: "void forEach(Consumer<T>)", documentation: "Performs action for each element.", kind: "method" },
  { label: "collect", insertText: "collect(Collectors.${1:toList()})", detail: "R collect(Collector<T,A,R>)", documentation: "Performs a mutable reduction using a Collector.", kind: "method" },
  { label: "toArray", insertText: "toArray()", detail: "Object[] toArray()", documentation: "Returns an array containing the elements.", kind: "method" },
  { label: "reduce", insertText: "reduce(${1:identity}, ${2:accumulator})", detail: "T reduce(T identity, BinaryOperator<T>)", documentation: "Performs a reduction using the identity and accumulator.", kind: "method" },
  { label: "count", insertText: "count()", detail: "long count()", documentation: "Returns the count of elements.", kind: "method" },
  { label: "min", insertText: "min(${1:comparator})", detail: "Optional<T> min(Comparator<T>)", documentation: "Returns the minimum element.", kind: "method" },
  { label: "max", insertText: "max(${1:comparator})", detail: "Optional<T> max(Comparator<T>)", documentation: "Returns the maximum element.", kind: "method" },
  { label: "anyMatch", insertText: "anyMatch(${1:predicate})", detail: "boolean anyMatch(Predicate<T>)", documentation: "Returns true if any element matches.", kind: "method" },
  { label: "allMatch", insertText: "allMatch(${1:predicate})", detail: "boolean allMatch(Predicate<T>)", documentation: "Returns true if all elements match.", kind: "method" },
  { label: "noneMatch", insertText: "noneMatch(${1:predicate})", detail: "boolean noneMatch(Predicate<T>)", documentation: "Returns true if no elements match.", kind: "method" },
  { label: "findFirst", insertText: "findFirst()", detail: "Optional<T> findFirst()", documentation: "Returns the first element.", kind: "method" },
  { label: "findAny", insertText: "findAny()", detail: "Optional<T> findAny()", documentation: "Returns any element (non-deterministic).", kind: "method" },
  { label: "toList", insertText: "toList()", detail: "List<T> toList()", documentation: "Collects into an unmodifiable list (Java 16+).", kind: "method" },
  { label: "sum", insertText: "sum()", detail: "int/long sum()", documentation: "Returns the sum of elements (IntStream/LongStream).", kind: "method" },
  { label: "average", insertText: "average()", detail: "OptionalDouble average()", documentation: "Returns the arithmetic mean.", kind: "method" },
  { label: "summaryStatistics", insertText: "summaryStatistics()", detail: "IntSummaryStatistics summaryStatistics()", documentation: "Returns statistics (count, sum, min, avg, max).", kind: "method" },
  { label: "boxed", insertText: "boxed()", detail: "Stream<Integer> boxed()", documentation: "Returns a Stream of boxed values.", kind: "method" },
  { label: "asLongStream", insertText: "asLongStream()", detail: "LongStream asLongStream()", documentation: "Converts IntStream to LongStream.", kind: "method" },
  { label: "asDoubleStream", insertText: "asDoubleStream()", detail: "DoubleStream asDoubleStream()", documentation: "Converts to DoubleStream.", kind: "method" },
  { label: "range", insertText: "range(${1:startInclusive}, ${2:endExclusive})", detail: "IntStream range(int start, int end)", documentation: "Returns a sequential ordered IntStream from start to end-1.", kind: "method" },
  { label: "rangeClosed", insertText: "rangeClosed(${1:startInclusive}, ${2:endInclusive})", detail: "IntStream rangeClosed(int start, int end)", documentation: "Returns a sequential ordered IntStream from start to end.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Collectors (java.util.stream.Collectors)
// ═══════════════════════════════════════════════════════
const COLLECTORS_STATIC: JavaMethodCompletion[] = [
  { label: "toList", insertText: "toList()", detail: "Collector<T,?,List<T>> toList()", documentation: "Collects to ArrayList.", kind: "method" },
  { label: "toSet", insertText: "toSet()", detail: "Collector<T,?,Set<T>> toSet()", documentation: "Collects to HashSet.", kind: "method" },
  { label: "toMap", insertText: "toMap(${1:keyMapper}, ${2:valueMapper})", detail: "Collector<T,?,Map<K,V>> toMap(...)", documentation: "Collects to Map with key and value mappers.", kind: "method" },
  { label: "toUnmodifiableList", insertText: "toUnmodifiableList()", detail: "Collector<T,?,List<T>> toUnmodifiableList()", documentation: "Collects to unmodifiable list.", kind: "method" },
  { label: "toUnmodifiableSet", insertText: "toUnmodifiableSet()", detail: "Collector<T,?,Set<T>> toUnmodifiableSet()", documentation: "Collects to unmodifiable set.", kind: "method" },
  { label: "joining", insertText: "joining(${1:delimiter})", detail: "Collector<CharSequence,?,String> joining()", documentation: "Concatenates elements into a String.", kind: "method" },
  { label: "counting", insertText: "counting()", detail: "Collector<T,?,Long> counting()", documentation: "Counts elements.", kind: "method" },
  { label: "summingInt", insertText: "summingInt(${1:function})", detail: "Collector<T,?,Integer> summingInt(...)", documentation: "Sums an int-valued function.", kind: "method" },
  { label: "summingLong", insertText: "summingLong(${1:function})", detail: "Collector<T,?,Long> summingLong(...)", documentation: "Sums a long-valued function.", kind: "method" },
  { label: "averagingInt", insertText: "averagingInt(${1:function})", detail: "Collector<T,?,Double> averagingInt(...)", documentation: "Computes average of int-valued function.", kind: "method" },
  { label: "groupingBy", insertText: "groupingBy(${1:classifier})", detail: "Collector<T,?,Map<K,List<T>>> groupingBy(...)", documentation: "Groups elements by classifier.", kind: "method" },
  { label: "partitioningBy", insertText: "partitioningBy(${1:predicate})", detail: "Collector<T,?,Map<Boolean,List<T>>> partitioningBy(...)", documentation: "Partitions by predicate.", kind: "method" },
  { label: "maxBy", insertText: "maxBy(${1:comparator})", detail: "Collector<T,?,Optional<T>> maxBy(...)", documentation: "Finds maximum.", kind: "method" },
  { label: "minBy", insertText: "minBy(${1:comparator})", detail: "Collector<T,?,Optional<T>> minBy(...)", documentation: "Finds minimum.", kind: "method" },
  { label: "reducing", insertText: "reducing(${1:identity}, ${2:op})", detail: "Collector<T,?,T> reducing(T id, BinaryOperator<T>)", documentation: "Performs a reduction.", kind: "method" },
  { label: "mapping", insertText: "mapping(${1:mapper}, ${2:downstream})", detail: "Collector<T,?,R> mapping(Function, Collector)", documentation: "Applies mapping before collecting.", kind: "method" },
  { label: "collectingAndThen", insertText: "collectingAndThen(${1:downstream}, ${2:finisher})", detail: "Collector<T,A,RR> collectingAndThen(...)", documentation: "Adapts a collector to perform a final transformation.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Comparator static methods
// ═══════════════════════════════════════════════════════
const COMPARATOR_STATIC: JavaMethodCompletion[] = [
  { label: "naturalOrder", insertText: "naturalOrder()", detail: "Comparator<T> naturalOrder()", documentation: "Returns a comparator that compares in natural order.", kind: "method" },
  { label: "reverseOrder", insertText: "reverseOrder()", detail: "Comparator<T> reverseOrder()", documentation: "Returns a comparator that imposes the reverse of natural order.", kind: "method" },
  { label: "comparing", insertText: "comparing(${1:keyExtractor})", detail: "Comparator<T> comparing(Function<T,U>)", documentation: "Creates a comparator using the key extractor.", kind: "method" },
  { label: "comparingInt", insertText: "comparingInt(${1:keyExtractor})", detail: "Comparator<T> comparingInt(ToIntFunction<T>)", documentation: "Creates a comparator using an int key extractor.", kind: "method" },
  { label: "comparingLong", insertText: "comparingLong(${1:keyExtractor})", detail: "Comparator<T> comparingLong(ToLongFunction<T>)", documentation: "Creates a comparator using a long key extractor.", kind: "method" },
  { label: "comparingDouble", insertText: "comparingDouble(${1:keyExtractor})", detail: "Comparator<T> comparingDouble(ToDoubleFunction<T>)", documentation: "Creates a comparator using a double key extractor.", kind: "method" },
  { label: "nullsFirst", insertText: "nullsFirst(${1:comparator})", detail: "Comparator<T> nullsFirst(Comparator<T>)", documentation: "Null-friendly comparator with nulls first.", kind: "method" },
  { label: "nullsLast", insertText: "nullsLast(${1:comparator})", detail: "Comparator<T> nullsLast(Comparator<T>)", documentation: "Null-friendly comparator with nulls last.", kind: "method" },
];

const COMPARATOR_INSTANCE: JavaMethodCompletion[] = [
  { label: "reversed", insertText: "reversed()", detail: "Comparator<T> reversed()", documentation: "Returns a comparator that imposes the reverse ordering.", kind: "method" },
  { label: "thenComparing", insertText: "thenComparing(${1:other})", detail: "Comparator<T> thenComparing(Comparator<T>)", documentation: "Returns a lexicographic-order comparator with another comparator.", kind: "method" },
  { label: "thenComparingInt", insertText: "thenComparingInt(${1:keyExtractor})", detail: "Comparator<T> thenComparingInt(ToIntFunction<T>)", documentation: "Returns a comparator with an int key extractor for tie-breaking.", kind: "method" },
  { label: "thenComparingLong", insertText: "thenComparingLong(${1:keyExtractor})", detail: "Comparator<T> thenComparingLong(ToLongFunction<T>)", documentation: "Returns a comparator with a long key extractor for tie-breaking.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Optional (java.util.Optional)
// ═══════════════════════════════════════════════════════
const OPTIONAL_STATIC: JavaMethodCompletion[] = [
  { label: "of", insertText: "of(${1:value})", detail: "Optional<T> of(T value)", documentation: "Returns an Optional with the value (throws if null).", kind: "method" },
  { label: "ofNullable", insertText: "ofNullable(${1:value})", detail: "Optional<T> ofNullable(T value)", documentation: "Returns an Optional, or empty if null.", kind: "method" },
  { label: "empty", insertText: "empty()", detail: "Optional<T> empty()", documentation: "Returns an empty Optional.", kind: "method" },
];

const OPTIONAL_INSTANCE: JavaMethodCompletion[] = [
  { label: "isPresent", insertText: "isPresent()", detail: "boolean isPresent()", documentation: "Returns true if there is a value.", kind: "method" },
  { label: "isEmpty", insertText: "isEmpty()", detail: "boolean isEmpty()", documentation: "Returns true if there is no value.", kind: "method" },
  { label: "get", insertText: "get()", detail: "T get()", documentation: "Returns the value (throws if empty).", kind: "method" },
  { label: "orElse", insertText: "orElse(${1:other})", detail: "T orElse(T other)", documentation: "Returns value if present, otherwise other.", kind: "method" },
  { label: "orElseGet", insertText: "orElseGet(${1:supplier})", detail: "T orElseGet(Supplier<T>)", documentation: "Returns value if present, otherwise invokes supplier.", kind: "method" },
  { label: "orElseThrow", insertText: "orElseThrow()", detail: "T orElseThrow()", documentation: "Returns value if present, otherwise throws NoSuchElementException.", kind: "method" },
  { label: "ifPresent", insertText: "ifPresent(${1:action})", detail: "void ifPresent(Consumer<T>)", documentation: "Performs action if a value is present.", kind: "method" },
  { label: "ifPresentOrElse", insertText: "ifPresentOrElse(${1:action}, ${2:emptyAction})", detail: "void ifPresentOrElse(Consumer, Runnable)", documentation: "Performs action if present, otherwise runs emptyAction.", kind: "method" },
  { label: "map", insertText: "map(${1:mapper})", detail: "Optional<U> map(Function<T,U>)", documentation: "Maps the value if present.", kind: "method" },
  { label: "flatMap", insertText: "flatMap(${1:mapper})", detail: "Optional<U> flatMap(Function<T,Optional<U>>)", documentation: "FlatMaps the value if present.", kind: "method" },
  { label: "filter", insertText: "filter(${1:predicate})", detail: "Optional<T> filter(Predicate<T>)", documentation: "Returns this Optional if value matches, otherwise empty.", kind: "method" },
  { label: "or", insertText: "or(${1:supplier})", detail: "Optional<T> or(Supplier<Optional<T>>)", documentation: "Returns this Optional if present, otherwise the supplied Optional.", kind: "method" },
  { label: "stream", insertText: "stream()", detail: "Stream<T> stream()", documentation: "Returns a stream of the value, or empty stream.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Map.Entry instance methods
// ═══════════════════════════════════════════════════════
const MAP_ENTRY_INSTANCE: JavaMethodCompletion[] = [
  { label: "getKey", insertText: "getKey()", detail: "K getKey()", documentation: "Returns the key corresponding to this entry.", kind: "method" },
  { label: "getValue", insertText: "getValue()", detail: "V getValue()", documentation: "Returns the value corresponding to this entry.", kind: "method" },
  { label: "setValue", insertText: "setValue(${1:value})", detail: "V setValue(V value)", documentation: "Replaces the value corresponding to this entry.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Scanner (java.util.Scanner)
// ═══════════════════════════════════════════════════════
const SCANNER_INSTANCE: JavaMethodCompletion[] = [
  { label: "nextInt", insertText: "nextInt()", detail: "int nextInt()", documentation: "Scans the next token as int.", kind: "method" },
  { label: "nextLong", insertText: "nextLong()", detail: "long nextLong()", documentation: "Scans the next token as long.", kind: "method" },
  { label: "nextDouble", insertText: "nextDouble()", detail: "double nextDouble()", documentation: "Scans the next token as double.", kind: "method" },
  { label: "next", insertText: "next()", detail: "String next()", documentation: "Finds and returns the next complete token.", kind: "method" },
  { label: "nextLine", insertText: "nextLine()", detail: "String nextLine()", documentation: "Advances scanner past the current line.", kind: "method" },
  { label: "hasNext", insertText: "hasNext()", detail: "boolean hasNext()", documentation: "Returns true if there is another token.", kind: "method" },
  { label: "hasNextInt", insertText: "hasNextInt()", detail: "boolean hasNextInt()", documentation: "Returns true if the next token can be interpreted as int.", kind: "method" },
  { label: "hasNextLine", insertText: "hasNextLine()", detail: "boolean hasNextLine()", documentation: "Returns true if there is another line.", kind: "method" },
  { label: "close", insertText: "close()", detail: "void close()", documentation: "Closes this scanner.", kind: "method" },
  { label: "useDelimiter", insertText: "useDelimiter(${1:pattern})", detail: "Scanner useDelimiter(String pattern)", documentation: "Sets the delimiter pattern.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// PrintWriter / PrintStream instance methods
// ═══════════════════════════════════════════════════════
const PRINTWRITER_INSTANCE: JavaMethodCompletion[] = [
  { label: "print", insertText: "print(${1:s})", detail: "void print(Object s)", documentation: "Prints without a newline.", kind: "method" },
  { label: "println", insertText: "println(${1:s})", detail: "void println(Object s)", documentation: "Prints with a newline.", kind: "method" },
  { label: "println", insertText: "println()", detail: "void println()", documentation: "Prints a newline.", kind: "method" },
  { label: "printf", insertText: "printf(${1:format}, ${2:args})", detail: "PrintWriter printf(String format, Object... args)", documentation: "Formatted print.", kind: "method" },
  { label: "flush", insertText: "flush()", detail: "void flush()", documentation: "Flushes the stream.", kind: "method" },
  { label: "close", insertText: "close()", detail: "void close()", documentation: "Closes the stream.", kind: "method" },
  { label: "write", insertText: "write(${1:s})", detail: "void write(String s)", documentation: "Writes a string.", kind: "method" },
  { label: "format", insertText: "format(${1:format}, ${2:args})", detail: "PrintWriter format(String format, Object... args)", documentation: "Writes a formatted string.", kind: "method" },
  { label: "append", insertText: "append(${1:csq})", detail: "PrintWriter append(CharSequence csq)", documentation: "Appends a character sequence.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// BufferedReader instance methods
// ═══════════════════════════════════════════════════════
const BUFFEREDREADER_INSTANCE: JavaMethodCompletion[] = [
  { label: "readLine", insertText: "readLine()", detail: "String readLine()", documentation: "Reads a line of text. Returns null at end of stream.", kind: "method" },
  { label: "read", insertText: "read()", detail: "int read()", documentation: "Reads a single character. Returns -1 at end of stream.", kind: "method" },
  { label: "ready", insertText: "ready()", detail: "boolean ready()", documentation: "Tells whether the stream is ready to be read.", kind: "method" },
  { label: "close", insertText: "close()", detail: "void close()", documentation: "Closes the stream.", kind: "method" },
  { label: "lines", insertText: "lines()", detail: "Stream<String> lines()", documentation: "Returns a Stream of lines from the reader.", kind: "method" },
  { label: "mark", insertText: "mark(${1:readAheadLimit})", detail: "void mark(int readAheadLimit)", documentation: "Marks the present position in the stream.", kind: "method" },
  { label: "reset", insertText: "reset()", detail: "void reset()", documentation: "Resets the stream to the most recent mark.", kind: "method" },
  { label: "skip", insertText: "skip(${1:n})", detail: "long skip(long n)", documentation: "Skips characters.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// StringTokenizer instance methods
// ═══════════════════════════════════════════════════════
const STRINGTOKENIZER_INSTANCE: JavaMethodCompletion[] = [
  { label: "nextToken", insertText: "nextToken()", detail: "String nextToken()", documentation: "Returns the next token.", kind: "method" },
  { label: "hasMoreTokens", insertText: "hasMoreTokens()", detail: "boolean hasMoreTokens()", documentation: "Tests if there are more tokens.", kind: "method" },
  { label: "countTokens", insertText: "countTokens()", detail: "int countTokens()", documentation: "Returns the number of remaining tokens.", kind: "method" },
  { label: "nextToken", insertText: "nextToken(${1:delim})", detail: "String nextToken(String delim)", documentation: "Returns the next token with new delimiter.", kind: "method" },
  { label: "hasMoreElements", insertText: "hasMoreElements()", detail: "boolean hasMoreElements()", documentation: "Returns same as hasMoreTokens.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Random (java.util.Random)
// ═══════════════════════════════════════════════════════
const RANDOM_INSTANCE: JavaMethodCompletion[] = [
  { label: "nextInt", insertText: "nextInt()", detail: "int nextInt()", documentation: "Returns the next pseudorandom int.", kind: "method" },
  { label: "nextInt", insertText: "nextInt(${1:bound})", detail: "int nextInt(int bound)", documentation: "Returns a pseudorandom int between 0 (inclusive) and bound (exclusive).", kind: "method" },
  { label: "nextLong", insertText: "nextLong()", detail: "long nextLong()", documentation: "Returns the next pseudorandom long.", kind: "method" },
  { label: "nextDouble", insertText: "nextDouble()", detail: "double nextDouble()", documentation: "Returns the next pseudorandom double between 0.0 and 1.0.", kind: "method" },
  { label: "nextBoolean", insertText: "nextBoolean()", detail: "boolean nextBoolean()", documentation: "Returns the next pseudorandom boolean.", kind: "method" },
  { label: "nextGaussian", insertText: "nextGaussian()", detail: "double nextGaussian()", documentation: "Returns the next pseudorandom Gaussian double.", kind: "method" },
  { label: "setSeed", insertText: "setSeed(${1:seed})", detail: "void setSeed(long seed)", documentation: "Sets the seed of this random number generator.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Iterator instance methods
// ═══════════════════════════════════════════════════════
const ITERATOR_INSTANCE: JavaMethodCompletion[] = [
  { label: "hasNext", insertText: "hasNext()", detail: "boolean hasNext()", documentation: "Returns true if the iteration has more elements.", kind: "method" },
  { label: "next", insertText: "next()", detail: "E next()", documentation: "Returns the next element.", kind: "method" },
  { label: "remove", insertText: "remove()", detail: "void remove()", documentation: "Removes the last element returned by this iterator.", kind: "method" },
  { label: "forEachRemaining", insertText: "forEachRemaining(${1:action})", detail: "void forEachRemaining(Consumer<? super E>)", documentation: "Performs the action for each remaining element.", kind: "method" },
];

// ═══════════════════════════════════════════════════════
// Combine into class map
// ═══════════════════════════════════════════════════════
export const JAVA_CLASS_COMPLETIONS: JavaClassCompletions[] = [
  { className: "Integer", staticMembers: INTEGER_STATIC, instanceMembers: [] },
  { className: "Long", staticMembers: LONG_STATIC, instanceMembers: [] },
  { className: "Double", staticMembers: DOUBLE_STATIC, instanceMembers: [] },
  { className: "Character", staticMembers: CHARACTER_STATIC, instanceMembers: [] },
  { className: "Boolean", staticMembers: BOOLEAN_STATIC, instanceMembers: [] },
  { className: "Math", staticMembers: MATH_STATIC, instanceMembers: [] },
  { className: "Arrays", staticMembers: ARRAYS_STATIC, instanceMembers: [] },
  { className: "Collections", staticMembers: COLLECTIONS_STATIC, instanceMembers: [] },
  { className: "String", staticMembers: STRING_STATIC, instanceMembers: STRING_INSTANCE },
  { className: "StringBuilder", staticMembers: [], instanceMembers: STRINGBUILDER_INSTANCE },
  { className: "StringBuffer", staticMembers: [], instanceMembers: STRINGBUILDER_INSTANCE },
  { className: "System", staticMembers: SYSTEM_STATIC, instanceMembers: [] },
  { className: "Objects", staticMembers: OBJECTS_STATIC, instanceMembers: [] },
  { className: "BigInteger", staticMembers: BIGINTEGER_STATIC, instanceMembers: BIGINTEGER_INSTANCE },
  { className: "Comparator", staticMembers: COMPARATOR_STATIC, instanceMembers: COMPARATOR_INSTANCE },
  { className: "Optional", staticMembers: OPTIONAL_STATIC, instanceMembers: OPTIONAL_INSTANCE },
  { className: "Collectors", staticMembers: COLLECTORS_STATIC, instanceMembers: [] },
  { className: "IntStream", staticMembers: [
    { label: "range", insertText: "range(${1:start}, ${2:end})", detail: "IntStream range(int start, int end)", documentation: "Returns sequential ordered IntStream.", kind: "method" },
    { label: "rangeClosed", insertText: "rangeClosed(${1:start}, ${2:end})", detail: "IntStream rangeClosed(int start, int end)", documentation: "Returns sequential ordered IntStream (inclusive).", kind: "method" },
    { label: "of", insertText: "of(${1:values})", detail: "IntStream of(int... values)", documentation: "Returns a sequential stream.", kind: "method" },
  ], instanceMembers: STREAM_INSTANCE },
  { className: "Stream", staticMembers: [
    { label: "of", insertText: "of(${1:values})", detail: "Stream<T> of(T... values)", documentation: "Returns a sequential stream.", kind: "method" },
    { label: "empty", insertText: "empty()", detail: "Stream<T> empty()", documentation: "Returns an empty stream.", kind: "method" },
    { label: "concat", insertText: "concat(${1:a}, ${2:b})", detail: "Stream<T> concat(Stream a, Stream b)", documentation: "Creates a lazily concatenated stream.", kind: "method" },
    { label: "generate", insertText: "generate(${1:supplier})", detail: "Stream<T> generate(Supplier<T>)", documentation: "Returns an infinite unordered stream.", kind: "method" },
    { label: "iterate", insertText: "iterate(${1:seed}, ${2:f})", detail: "Stream<T> iterate(T seed, UnaryOperator<T> f)", documentation: "Returns an infinite sequential ordered stream.", kind: "method" },
  ], instanceMembers: STREAM_INSTANCE },
  // Instance-only classes (accessed after variable.)
  { className: "List", staticMembers: [], instanceMembers: LIST_INSTANCE },
  { className: "ArrayList", staticMembers: [], instanceMembers: LIST_INSTANCE },
  { className: "LinkedList", staticMembers: [], instanceMembers: [...LIST_INSTANCE, ...DEQUE_EXTRA] },
  { className: "Map", staticMembers: [], instanceMembers: MAP_INSTANCE },
  { className: "HashMap", staticMembers: [], instanceMembers: MAP_INSTANCE },
  { className: "LinkedHashMap", staticMembers: [], instanceMembers: MAP_INSTANCE },
  { className: "TreeMap", staticMembers: [], instanceMembers: [...MAP_INSTANCE, ...TREEMAP_EXTRA] },
  { className: "Set", staticMembers: [], instanceMembers: SET_INSTANCE },
  { className: "HashSet", staticMembers: [], instanceMembers: SET_INSTANCE },
  { className: "LinkedHashSet", staticMembers: [], instanceMembers: SET_INSTANCE },
  { className: "TreeSet", staticMembers: [], instanceMembers: [...SET_INSTANCE, ...TREESET_EXTRA] },
  { className: "Queue", staticMembers: [], instanceMembers: QUEUE_INSTANCE },
  { className: "PriorityQueue", staticMembers: [], instanceMembers: QUEUE_INSTANCE },
  { className: "Deque", staticMembers: [], instanceMembers: [...QUEUE_INSTANCE, ...DEQUE_EXTRA] },
  { className: "ArrayDeque", staticMembers: [], instanceMembers: [...QUEUE_INSTANCE, ...DEQUE_EXTRA] },
  { className: "Stack", staticMembers: [], instanceMembers: STACK_INSTANCE },
  { className: "Scanner", staticMembers: [], instanceMembers: SCANNER_INSTANCE },
  { className: "PrintWriter", staticMembers: [], instanceMembers: PRINTWRITER_INSTANCE },
  { className: "PrintStream", staticMembers: [], instanceMembers: PRINTWRITER_INSTANCE },
  { className: "BufferedReader", staticMembers: [], instanceMembers: BUFFEREDREADER_INSTANCE },
  { className: "StringTokenizer", staticMembers: [], instanceMembers: STRINGTOKENIZER_INSTANCE },
  { className: "Random", staticMembers: [], instanceMembers: RANDOM_INSTANCE },
  { className: "Iterator", staticMembers: [], instanceMembers: ITERATOR_INSTANCE },
  { className: "Entry", staticMembers: [], instanceMembers: MAP_ENTRY_INSTANCE },
];

// Build lookup maps for fast access
export const STATIC_COMPLETIONS_MAP = new Map<string, JavaMethodCompletion[]>();
export const INSTANCE_COMPLETIONS_MAP = new Map<string, JavaMethodCompletion[]>();

for (const cls of JAVA_CLASS_COMPLETIONS) {
  if (cls.staticMembers.length > 0) {
    STATIC_COMPLETIONS_MAP.set(cls.className, cls.staticMembers);
  }
  if (cls.instanceMembers.length > 0) {
    INSTANCE_COMPLETIONS_MAP.set(cls.className, cls.instanceMembers);
  }
}

// All instance methods combined (for when we can't determine the type)
export const ALL_INSTANCE_METHODS: JavaMethodCompletion[] = [];
const seen = new Set<string>();
for (const cls of JAVA_CLASS_COMPLETIONS) {
  for (const m of cls.instanceMembers) {
    const key = `${m.label}:${m.detail}`;
    if (!seen.has(key)) {
      seen.add(key);
      ALL_INSTANCE_METHODS.push(m);
    }
  }
}

// Java keywords for basic completion
export const JAVA_KEYWORDS = [
  "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
  "class", "const", "continue", "default", "do", "double", "else", "enum",
  "extends", "final", "finally", "float", "for", "goto", "if", "implements",
  "import", "instanceof", "int", "interface", "long", "native", "new",
  "package", "private", "protected", "public", "return", "short", "static",
  "strictfp", "super", "switch", "synchronized", "this", "throw", "throws",
  "transient", "try", "void", "volatile", "while", "var", "yield", "record",
  "sealed", "permits", "non-sealed",
];

// Common Java types for type completions
export const JAVA_TYPES = [
  "int", "long", "double", "float", "char", "byte", "short", "boolean", "void",
  "String", "Integer", "Long", "Double", "Float", "Character", "Byte", "Short", "Boolean",
  "Object", "Number", "Comparable", "Iterable", "Cloneable", "Serializable",
  "List", "ArrayList", "LinkedList", "Map", "HashMap", "TreeMap", "LinkedHashMap",
  "Set", "HashSet", "TreeSet", "LinkedHashSet", "Queue", "PriorityQueue",
  "Deque", "ArrayDeque", "Stack", "Vector",
  "StringBuilder", "StringBuffer", "StringTokenizer",
  "Scanner", "BufferedReader", "PrintWriter", "PrintStream",
  "BigInteger", "BigDecimal",
  "Random", "Arrays", "Collections", "Objects", "Math", "System",
  "Stream", "IntStream", "LongStream", "DoubleStream", "Collectors", "Optional",
  "Comparator", "Iterator", "ListIterator",
  "IOException", "RuntimeException", "Exception", "Error",
  "NullPointerException", "IllegalArgumentException", "IndexOutOfBoundsException",
  "ArithmeticException", "NumberFormatException", "ClassCastException",
  "UnsupportedOperationException", "ConcurrentModificationException",
  "NoSuchElementException", "StackOverflowError", "OutOfMemoryError",
  "Pair", "Entry",
  "Pattern", "Matcher",
  "BitSet",
  "File", "Path", "Paths", "Files",
];
