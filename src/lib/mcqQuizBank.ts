import {
  shuffleQuestions,
  type QuizDifficulty,
  type QuizLanguage,
} from "@/lib/quizBank";

export interface McqQuestion {
  id: string;
  language: QuizLanguage;
  difficulty: QuizDifficulty;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

/** Curated questions target Java, C++17 or later, and Python 3 unless stated otherwise. */
export const MCQ_QUESTIONS: McqQuestion[] = [
  {
    id: "java:easy:string-equality",
    language: "java",
    difficulty: "easy",
    question:
      "Which expression compares the contents of two non-null Java strings a and b?",
    options: [
      "a == b",
      "a.equals(b)",
      "a.compareTo(b) == 1",
      "a.hashCode() == b.hashCode()",
    ],
    correctIndex: 1,
    explanation:
      "String.equals compares character contents. == compares references, and equal hash codes do not guarantee equal strings.",
    topic: "Strings",
  },
  {
    id: "java:easy:integer-division",
    language: "java",
    difficulty: "easy",
    question:
      "What is the value of the Java expression 7 / 2 when both operands are int literals?",
    options: ["3.5", "4", "3", "A compilation error"],
    correctIndex: 2,
    explanation:
      "Division of two int operands produces an int result, truncating the fractional part toward zero.",
    topic: "Operators",
  },
  {
    id: "java:easy:boolean-default",
    language: "java",
    difficulty: "easy",
    question:
      "What is the default value of a boolean instance field that has no explicit initializer?",
    options: ["false", "true", "null", "It has no default and cannot be read"],
    correctIndex: 0,
    explanation:
      "Instance and static boolean fields default to false. Local variables, unlike fields, must be definitely assigned before use.",
    topic: "Variables",
  },
  {
    id: "java:easy:array-length",
    language: "java",
    difficulty: "easy",
    question:
      "Given int[] values = {10, 20, 30};, how do you obtain the number of elements?",
    options: [
      "values.size()",
      "values.length()",
      "values.count",
      "values.length",
    ],
    correctIndex: 3,
    explanation:
      "Java arrays expose a final length field. String uses length(), while collections commonly use size().",
    topic: "Arrays",
  },
  {
    id: "java:easy:overloading",
    language: "java",
    difficulty: "easy",
    question:
      "Which change can define a valid overload of void print(int value) in the same Java class?",
    options: [
      "Change only its return type to int",
      "Change the parameter type to String",
      "Change only the parameter name",
      "Change only its access modifier",
    ],
    correctIndex: 1,
    explanation:
      "Overloaded methods have different parameter lists. Return type, parameter names, and access modifiers alone do not distinguish method signatures.",
    topic: "Methods",
  },
  {
    id: "java:medium:pass-by-value",
    language: "java",
    difficulty: "medium",
    question:
      "A Java method receives a reference to a mutable object. Which statement about its parameter is correct?",
    options: [
      "Reassigning the parameter changes the caller's variable",
      "The object is automatically deep-copied",
      "The reference is passed by value; object mutations can be visible to the caller",
      "All reference parameters are implicitly final",
    ],
    correctIndex: 2,
    explanation:
      "Java always passes values. For an object, the copied value is a reference: both references can reach the same object, but reassigning the parameter does not reassign the caller's variable.",
    topic: "References",
  },
  {
    id: "java:medium:hash-contract",
    language: "java",
    difficulty: "medium",
    question:
      "What must hold for two Java objects a and b if a.equals(b) is true and their equality-relevant state is unchanged?",
    options: [
      "a.hashCode() must equal b.hashCode()",
      "a and b must be the same reference",
      "Their hash codes must be different",
      "Neither object can be used as a HashMap key",
    ],
    correctIndex: 0,
    explanation:
      "The equals/hashCode contract requires equal objects to have equal hash codes. The converse is not required: unequal objects may have hash collisions.",
    topic: "Collections",
  },
  {
    id: "java:medium:checked-exceptions",
    language: "java",
    difficulty: "medium",
    question:
      "A Java method calls an operation declared to throw IOException. If the exception is not caught, what must the calling method do?",
    options: [
      "Nothing, because IOException is unchecked",
      "Declare only throws RuntimeException",
      "Return null to suppress the exception",
      "Declare IOException or a suitable superclass in its throws clause",
    ],
    correctIndex: 3,
    explanation:
      "IOException is a checked exception. A caller must catch it or declare it (or a suitable superclass such as Exception) in its throws clause.",
    topic: "Exceptions",
  },
  {
    id: "java:medium:generic-invariance",
    language: "java",
    difficulty: "medium",
    question:
      "Given List<Integer> integers, which declaration can reference that list without a cast?",
    options: [
      "List<Number> numbers = integers;",
      "List<? extends Number> numbers = integers;",
      "List<Object> numbers = integers;",
      "List<Double> numbers = integers;",
    ],
    correctIndex: 1,
    explanation:
      "Java generics are invariant, so List<Integer> is not a List<Number>. An upper-bounded wildcard accepts lists whose element type extends Number.",
    topic: "Generics",
  },
  {
    id: "java:medium:resource-order",
    language: "java",
    difficulty: "medium",
    question:
      "In try (Resource a = openA(); Resource b = openB()) { ... }, both resources are initialized successfully. In what order are they closed?",
    options: [
      "a, then b",
      "Only b is closed automatically",
      "b, then a",
      "Their closing order is unspecified",
    ],
    correctIndex: 2,
    explanation:
      "Try-with-resources closes successfully initialized resources in reverse declaration order, even when the body exits by throwing an exception.",
    topic: "Resource management",
  },
  {
    id: "java:hard:volatile-increment",
    language: "java",
    difficulty: "hard",
    question:
      "Multiple threads execute count++ on the same volatile int count without other synchronization. Which statement is correct?",
    options: [
      "Every increment is atomic because count is volatile",
      "Volatile prevents visibility of updates between threads",
      "The program cannot compile",
      "Updates can be lost because the read-modify-write operation is not atomic",
    ],
    correctIndex: 3,
    explanation:
      "Volatile provides visibility and ordering guarantees for reads and writes, but count++ combines a read, addition, and write. Use an atomic increment or locking to avoid lost updates.",
    topic: "Concurrency",
  },
  {
    id: "java:hard:suppressed-exception",
    language: "java",
    difficulty: "hard",
    question:
      "A try-with-resources body throws exception A, and closing its only resource throws exception B. No catch or finally changes the outcome. Which exception propagates?",
    options: [
      "A, with B recorded as a suppressed exception",
      "B, with A recorded as a suppressed exception",
      "Only B, and A is discarded",
      "Neither exception propagates",
    ],
    correctIndex: 0,
    explanation:
      "The body exception remains primary. The closing exception is attached to it as a suppressed exception and can be inspected with getSuppressed().",
    topic: "Exceptions",
  },
  {
    id: "java:hard:class-initialization",
    language: "java",
    difficulty: "hard",
    question:
      "Constants declares static final int LIMIT = 10, a compile-time constant. Does reading Constants.LIMIT by itself require initialization of Constants?",
    options: [
      "Yes, every static field access initializes its declaring class",
      "No, reading a compile-time constant does not itself trigger initialization",
      "Yes, but only when LIMIT is public",
      "No, because static fields can never trigger initialization",
    ],
    correctIndex: 1,
    explanation:
      "A reference to a static compile-time constant does not trigger class initialization. Access to a non-constant static field generally does initialize the class that declares it.",
    topic: "JVM initialization",
  },
  {
    id: "java:hard:wildcard-consumer",
    language: "java",
    difficulty: "hard",
    question:
      "Given List<? super Integer> values, which operation is guaranteed to be type-safe at compile time?",
    options: [
      "Assign values.get(0) directly to Integer",
      "Add a Double value",
      "Add an Integer value",
      "Assign the list directly to List<Number>",
    ],
    correctIndex: 2,
    explanation:
      "A lower-bounded wildcard can consume Integer values because its unknown element type is Integer or a supertype. Reads have only the guaranteed static type Object. Type safety does not guarantee that a particular list implementation supports add.",
    topic: "Generics",
  },
  {
    id: "java:hard:happens-before",
    language: "java",
    difficulty: "hard",
    question:
      "Thread A writes shared state and then unlocks monitor m. Thread B subsequently locks that same monitor before reading the state. What does the Java memory model guarantee?",
    options: [
      "Nothing unless every field is volatile",
      "Thread B receives a private copy of the state",
      "The two threads must execute on the same processor",
      "A's unlock happens-before B's subsequent lock, making the preceding writes visible",
    ],
    correctIndex: 3,
    explanation:
      "An unlock of a monitor happens-before every subsequent lock of that monitor. This orders the preceding writes before the later reads protected by the same monitor.",
    topic: "Memory model",
  },
  {
    id: "cpp:easy:integer-division",
    language: "cpp",
    difficulty: "easy",
    question:
      "In C++17, what is the value of the expression 7 / 2 when both operands are int literals?",
    options: ["3", "3.5", "4", "An unspecified value"],
    correctIndex: 0,
    explanation:
      "Integer division discards the fractional part, truncating toward zero. Both operands here have type int.",
    topic: "Operators",
  },
  {
    id: "cpp:easy:reference-parameter",
    language: "cpp",
    difficulty: "easy",
    question:
      "Which C++ parameter declaration lets a function modify the caller's int directly through a reference?",
    options: ["int value", "const int value", "int& value", "const int& value"],
    correctIndex: 2,
    explanation:
      "A non-const lvalue reference aliases the caller's int and permits modification. Passing by value copies it, and a const reference does not permit modification through that reference.",
    topic: "References",
  },
  {
    id: "cpp:easy:vector-size",
    language: "cpp",
    difficulty: "easy",
    question:
      "For std::vector<int> values{10, 20, 30}, which expression returns the number of elements?",
    options: [
      "values.length",
      "values.size()",
      "sizeof(values)",
      "values.capacity()",
    ],
    correctIndex: 1,
    explanation:
      "size() is the element count. capacity() is the allocated element capacity, while sizeof measures the vector object's size in bytes rather than its stored element count.",
    topic: "Containers",
  },
  {
    id: "cpp:easy:null-pointer",
    language: "cpp",
    difficulty: "easy",
    question: "Which C++11-and-later keyword denotes a null pointer literal?",
    options: ["nil", "undefined", "null", "nullptr"],
    correctIndex: 3,
    explanation:
      "nullptr is a literal of type std::nullptr_t that converts to pointer and pointer-to-member types. It is not an integer literal.",
    topic: "Pointers",
  },
  {
    id: "cpp:easy:class-access",
    language: "cpp",
    difficulty: "easy",
    question:
      "What is the default member access in a C++ class declared with the class keyword?",
    options: [
      "private",
      "public",
      "protected",
      "Access is unspecified until a label appears",
    ],
    correctIndex: 0,
    explanation:
      "Members of a class are private by default. Members of a struct are public by default; both can use explicit access labels.",
    topic: "Classes",
  },
  {
    id: "cpp:medium:raii",
    language: "cpp",
    difficulty: "medium",
    question:
      "What is the central resource-management principle of RAII in C++?",
    options: [
      "All resources must be stored in global variables",
      "Resources can be released only by explicit delete expressions",
      "Tie resource ownership to object lifetime and release resources in destructors",
      "Use garbage collection for all resource types",
    ],
    correctIndex: 2,
    explanation:
      "RAII binds a resource to an owning object. Its destructor releases the resource when the object's lifetime ends, including during normal exception unwinding.",
    topic: "Resource management",
  },
  {
    id: "cpp:medium:virtual-destructor",
    language: "cpp",
    difficulty: "medium",
    question:
      "A Derived object is deleted through a Base* pointing to it. In C++17, what is required of Base's destructor for this ordinary polymorphic deletion to be well-defined?",
    options: [
      "It must be static",
      "It must be virtual and accessible at the deletion site",
      "It must be private and non-virtual",
      "It must return bool",
    ],
    correctIndex: 1,
    explanation:
      "Deleting a derived object through a base pointer requires a virtual base destructor in this C++17 case. Virtual destruction invokes the derived destructor before the base destructor.",
    topic: "Polymorphism",
  },
  {
    id: "cpp:medium:vector-invalidation",
    language: "cpp",
    difficulty: "medium",
    question:
      "What happens to existing iterators, pointers, and references to std::vector elements when push_back causes reallocation?",
    options: [
      "Only the end iterator is invalidated",
      "Only references are invalidated",
      "They all remain valid",
      "They are all invalidated",
    ],
    correctIndex: 3,
    explanation:
      "Reallocation relocates the vector's element storage, invalidating all iterators, pointers, and references to its elements, as well as the past-the-end iterator.",
    topic: "Containers",
  },
  {
    id: "cpp:medium:unique-ownership",
    language: "cpp",
    difficulty: "medium",
    question:
      "Which operation transfers ownership from a non-null std::unique_ptr<int> p to a new unique_ptr q?",
    options: [
      "auto q = std::move(p);",
      "auto q = p;",
      "auto q = p.get();",
      "auto q = *p;",
    ],
    correctIndex: 0,
    explanation:
      "Moving a unique_ptr transfers ownership and leaves the source empty. Copying is disabled; get() exposes a non-owning raw pointer, and dereferencing accesses the value.",
    topic: "Smart pointers",
  },
  {
    id: "cpp:medium:object-slicing",
    language: "cpp",
    difficulty: "medium",
    question:
      "Derived publicly inherits from a concrete, copyable Base. Given Derived d; Base b = d;, what does b contain?",
    options: [
      "A reference that preserves d's dynamic type",
      "An independent Base object copied from d's Base subobject",
      "A complete independent Derived object",
      "An automatically allocated Derived pointer",
    ],
    correctIndex: 1,
    explanation:
      "Copying a derived object into a base object by value slices it: only the base subobject is copied, and the new object's type is Base.",
    topic: "Object model",
  },
  {
    id: "cpp:hard:move-cast",
    language: "cpp",
    difficulty: "hard",
    question: "What does std::move(x) itself do in C++?",
    options: [
      "Immediately transfers every resource owned by x",
      "Always invokes x's move constructor",
      "Casts x to an xvalue so a later operation can select a move overload",
      "Destroys x after making a copy",
    ],
    correctIndex: 2,
    explanation:
      "std::move is a cast, not a resource transfer. The receiving operation determines whether moving, copying, or some other behavior occurs; for example, const objects often cannot bind to conventional move constructors.",
    topic: "Move semantics",
  },
  {
    id: "cpp:hard:forwarding-reference",
    language: "cpp",
    difficulty: "hard",
    question:
      "For template<class T> void f(T&& value), an int lvalue x is passed as f(x). What are the deduced T and the parameter type after reference collapsing?",
    options: [
      "T is int; the parameter is int&&",
      "T is int&; the parameter is int&",
      "T is const int; the parameter is const int&&",
      "T is int*; the parameter is int*&&",
    ],
    correctIndex: 1,
    explanation:
      "With a forwarding reference and an lvalue argument, T is deduced as an lvalue reference. int& combined with && collapses to int&.",
    topic: "Templates",
  },
  {
    id: "cpp:hard:release-acquire",
    language: "cpp",
    difficulty: "hard",
    question:
      "Thread A writes a non-atomic payload, then performs a release store to an atomic flag. Thread B's acquire load reads the value from that store, then reads the payload. With no other payload writes, what is guaranteed?",
    options: [
      "The release/acquire pair orders the payload write before B's payload read",
      "The payload must still be atomic in this scenario",
      "The acquire load resets the flag",
      "Release stores synchronize with all relaxed loads regardless of what they read",
    ],
    correctIndex: 0,
    explanation:
      "An acquire load that reads from the release store synchronizes with it. The preceding payload write therefore happens-before the subsequent payload read, avoiding a data race in the stated scenario.",
    topic: "Memory model",
  },
  {
    id: "cpp:hard:mandatory-elision",
    language: "cpp",
    difficulty: "hard",
    question:
      "In C++17, Widget make() { return Widget{}; } returns to Widget w = make();. Widget has an accessible default constructor and destructor, but deleted copy and move constructors. Is this valid?",
    options: [
      "No, the return always requires a copy constructor",
      "No, the initialization always requires a move constructor",
      "Only if an optional compiler optimization is enabled",
      "Yes, same-type prvalue initialization constructs directly without copy or move",
    ],
    correctIndex: 3,
    explanation:
      "C++17 prvalue semantics guarantee direct construction in this case. Unlike returning a named local (NRVO), this does not depend on optional copy elision; an accessible, non-deleted destructor is still required.",
    topic: "Object lifetime",
  },
  {
    id: "cpp:hard:shared-pointer-cycle",
    language: "cpp",
    difficulty: "hard",
    question:
      "Two objects own each other through std::shared_ptr members. After all external owners are released, why can the objects remain alive?",
    options: [
      "shared_ptr never invokes destructors",
      "The cycle keeps both strong reference counts nonzero; a weak_ptr back-reference can break it",
      "Reference counting automatically detects cycles but delays destruction",
      "Every shared_ptr permanently owns its object even after reset",
    ],
    correctIndex: 1,
    explanation:
      "shared_ptr uses strong reference counts and does not collect ownership cycles. A weak_ptr observes without increasing the strong count, allowing an appropriately designed cycle to be broken.",
    topic: "Smart pointers",
  },
  {
    id: "python:easy:floor-division",
    language: "python",
    difficulty: "easy",
    question: "What is the value of -7 // 2 in Python 3?",
    options: ["-3", "-3.5", "3", "-4"],
    correctIndex: 3,
    explanation:
      "Python's // operator floors the quotient toward negative infinity, so -3.5 becomes -4 rather than truncating toward zero.",
    topic: "Operators",
  },
  {
    id: "python:easy:immutable-sequence",
    language: "python",
    difficulty: "easy",
    question:
      "Which built-in Python sequence type does not allow replacing its elements after creation?",
    options: ["list", "tuple", "bytearray", "dict"],
    correctIndex: 1,
    explanation:
      "A tuple is an immutable sequence: its element references cannot be replaced. A mutable object stored inside a tuple may still be mutated. A dict is a mutable mapping, not a sequence type.",
    topic: "Data types",
  },
  {
    id: "python:easy:range-stop",
    language: "python",
    difficulty: "easy",
    question: "What is list(range(1, 4)) in Python 3?",
    options: ["[1, 2, 3]", "[1, 2, 3, 4]", "[0, 1, 2, 3]", "[4, 3, 2, 1]"],
    correctIndex: 0,
    explanation:
      "range includes its start and excludes its stop. With the default step of 1, range(1, 4) yields 1, 2, and 3.",
    topic: "Iteration",
  },
  {
    id: "python:easy:empty-truth-value",
    language: "python",
    difficulty: "easy",
    question: "What does bool([]) return in Python 3?",
    options: ["True", "None", "False", "It raises TypeError"],
    correctIndex: 2,
    explanation:
      "Empty built-in containers, including lists, are false in a Boolean context. A nonempty list is true regardless of the truth value of its elements.",
    topic: "Truth values",
  },
  {
    id: "python:easy:dictionary-membership",
    language: "python",
    difficulty: "easy",
    question: "For a Python dictionary d, what does key in d check?",
    options: [
      "Whether key is a stored value",
      "Whether key is a key-value tuple",
      "Whether key is an attribute of d",
      "Whether key is a stored key",
    ],
    correctIndex: 3,
    explanation:
      "Dictionary membership tests keys. To check values, use d.values(); to check key-value pairs, use d.items().",
    topic: "Dictionaries",
  },
  {
    id: "python:medium:mutable-default",
    language: "python",
    difficulty: "medium",
    question:
      "Given def add(x, items=[]): items.append(x); return items, what does the second call return after add(1) followed by add(2), with no other mutations?",
    options: ["[2]", "[1, 2]", "[]", "It raises TypeError"],
    correctIndex: 1,
    explanation:
      "Default argument expressions are evaluated when the function is defined, not on each call. Both calls reuse the same default list, so the second result contains both elements.",
    topic: "Functions",
  },
  {
    id: "python:medium:shallow-copy",
    language: "python",
    difficulty: "medium",
    question: "After a = [[1], [2]]; b = a.copy(); b[0].append(3), what is a?",
    options: ["[[1], [2]]", "[[1], [2], [3]]", "[[1, 3], [2]]", "[[3], [2]]"],
    correctIndex: 2,
    explanation:
      "list.copy makes a shallow copy of the outer list. The inner lists remain shared, so mutating b[0] also changes the list referenced by a[0].",
    topic: "Copying",
  },
  {
    id: "python:medium:generator-exhaustion",
    language: "python",
    difficulty: "medium",
    question:
      "Given g = (x * x for x in range(3)), what is list(g) after list(g) has already been evaluated once?",
    options: [
      "[]",
      "[0, 1, 4]",
      "[1, 4, 9]",
      "It automatically creates a new generator",
    ],
    correctIndex: 0,
    explanation:
      "A generator is a single-pass iterator. The first list(g) consumes it; subsequent iteration over the exhausted generator produces no values.",
    topic: "Generators",
  },
  {
    id: "python:medium:identity-equality",
    language: "python",
    difficulty: "medium",
    question:
      "After a = [1, 2]; b = [1, 2], what are the results of a == b and a is b, respectively?",
    options: [
      "False and False",
      "True and True",
      "False and True",
      "True and False",
    ],
    correctIndex: 3,
    explanation:
      "List equality compares elements, so these lists are equal. is compares object identity; the two list displays create distinct objects.",
    topic: "Object identity",
  },
  {
    id: "python:medium:decorator-order",
    language: "python",
    difficulty: "medium",
    question:
      "A Python function f has @outer above @inner. Ignoring rebinding side effects, which expression describes how the decorators are applied to the original function?",
    options: [
      "inner(outer(f))",
      "outer(inner(f))",
      "outer(f), then inner(f) independently",
      "f(outer, inner)",
    ],
    correctIndex: 1,
    explanation:
      "Decorator application is nested from the bottom up: inner receives the original function, then outer receives inner's result. The final result is bound to the function name.",
    topic: "Decorators",
  },
  {
    id: "python:hard:late-binding",
    language: "python",
    difficulty: "hard",
    question:
      "After funcs = [lambda: i for i in range(3)], what is [f() for f in funcs] in Python 3?",
    options: ["[0, 1, 2]", "[0, 0, 0]", "[2, 2, 2]", "It raises NameError"],
    correctIndex: 2,
    explanation:
      "The closures share the comprehension's variable i and look up its value when called. After the comprehension, that value is 2. A default argument such as lambda i=i: i would capture each iteration's value instead.",
    topic: "Closures",
  },
  {
    id: "python:hard:data-descriptor",
    language: "python",
    difficulty: "hard",
    question:
      "Under Python's default instance attribute lookup, a class data descriptor and the instance's __dict__ both provide the same attribute name. Which takes precedence?",
    options: [
      "The class data descriptor",
      "The instance dictionary entry",
      "Whichever was created first",
      "Lookup raises an ambiguity error",
    ],
    correctIndex: 0,
    explanation:
      "Data descriptors, which define __set__ or __delete__ as well as lookup behavior, take precedence over instance dictionary entries. Non-data descriptors can instead be shadowed by an instance entry.",
    topic: "Descriptors",
  },
  {
    id: "python:hard:c3-mro",
    language: "python",
    difficulty: "hard",
    question:
      "Given class A: pass; class B(A): pass; class C(A): pass; class D(B, C): pass (each class defined separately), what is D.__mro__?",
    options: [
      "(D, B, A, C, object)",
      "(D, C, B, A, object)",
      "(D, B, C, object, A)",
      "(D, B, C, A, object)",
    ],
    correctIndex: 3,
    explanation:
      "Python's C3 linearization preserves local base order and places a shared ancestor after its derived classes. The diamond therefore resolves as D, B, C, A, object.",
    topic: "Inheritance",
  },
  {
    id: "python:hard:context-suppression",
    language: "python",
    difficulty: "hard",
    question:
      "A with body raises an exception, and its context manager's __exit__ returns True without raising another exception. What happens to the body exception?",
    options: [
      "It is re-raised automatically",
      "It is suppressed, and execution continues after the with statement",
      "It is converted to StopIteration",
      "The body restarts from its first statement",
    ],
    correctIndex: 1,
    explanation:
      "A truthy return from __exit__ signals that the context manager handled the exception. A false or None return would allow the exception to propagate.",
    topic: "Context managers",
  },
  {
    id: "python:hard:generator-return",
    language: "python",
    difficulty: "hard",
    question:
      "A Python 3 generator yields 1, then executes return 7. After next(g) yields 1, what happens on the next next(g) call?",
    options: [
      "It yields 7",
      "It returns None normally",
      "It raises StopIteration whose value is 7",
      "It raises SyntaxError because generators cannot return a value",
    ],
    correctIndex: 2,
    explanation:
      "Returning from a generator terminates iteration. The return value becomes the value attribute of the resulting StopIteration; it is not yielded as another element.",
    topic: "Generator protocol",
  },
];

function matchesFilters(
  question: McqQuestion,
  language: QuizLanguage | "mixed",
  difficulty: QuizDifficulty | "mixed",
): boolean {
  return (
    (language === "mixed" || question.language === language) &&
    (difficulty === "mixed" || question.difficulty === difficulty)
  );
}

export function getMcqCount(
  language: QuizLanguage | "mixed",
  difficulty: QuizDifficulty | "mixed",
): number {
  return MCQ_QUESTIONS.filter((question) =>
    matchesFilters(question, language, difficulty),
  ).length;
}

/** Strictly samples matching questions; fractional sizes round down and oversized requests clip to the pool. */
export function buildMcqQuiz(
  language: QuizLanguage | "mixed",
  difficulty: QuizDifficulty | "mixed",
  size: number,
  random: () => number = Math.random,
): McqQuestion[] {
  if (size <= 0 || Number.isNaN(size)) return [];

  const pool = MCQ_QUESTIONS.filter((question) =>
    matchesFilters(question, language, difficulty),
  );
  return shuffleQuestions(pool, random)
    .slice(0, Math.floor(size))
    .map((question) => {
      // Track original indices rather than infer correctness from shuffled option text.
      const options = shuffleQuestions(
        question.options.map((text, index) => ({ text, index })),
        random,
      );
      return {
        ...question,
        options: options.map((option) => option.text),
        correctIndex: options.findIndex(
          (option) => option.index === question.correctIndex,
        ),
      };
    });
}
