import type { InterviewTopic } from "@/data/pythonInterviewMetadataBase";
import type { PyQuestionMeta } from "@/data/pythonInterviewMetadataBase";

export const pythonTopicsPart1: InterviewTopic[] = [
  {
    id: "basics",
    title: "Python Basics & Execution",
    icon: "🐍",
    questions: [
      {
        id: "pyb1",
        question: "What is Python? What are its key features?",
        answer: "Python is a high-level, general-purpose, interpreted programming language created by Guido van Rossum and first released in 1991. Its design philosophy emphasizes code readability and simplicity — the famous **Zen of Python** (PEP 20) states \"Readability counts\" and \"There should be one obvious way to do it\".\n\n**Key features (interview framing):**\n- **Interpreted**: Code executes line by line via the CPython VM; no separate compile step.\n- **Dynamically typed**: Variable types are resolved at runtime; no type declarations required (optional hints since 3.5).\n- **Strongly typed**: Despite dynamic typing, implicit unsafe conversions like \"1\" + 1 are rejected.\n- **Multi-paradigm**: Supports procedural, object-oriented, and functional styles.\n- **Batteries included**: Rich standard library (json, re, os, collections, itertools...).\n- **Automatic memory management**: Reference counting plus a cyclic garbage collector.\n- **Extensible**: C/C++ extensions and a massive PyPI ecosystem (NumPy, Django, pandas).\n\n**Where Python shines**: scripting, automation, data science/ML, web backends, testing, DevOps. **Trade-offs**: slower than compiled languages for CPU-bound work, and the GIL limits parallel thread execution (addressable via multiprocessing or native extensions).",
        code: `import sys
print(sys.version)          # e.g. 3.12.x
print(__name__)             # __main__ when run directly

# Zen of Python
import this  # prints 19 guiding principles`,
        codeLanguage: "python",
        explanation: "Python is an interpreted, dynamically-but-strongly typed, multi-paradigm language prized for readability and its huge ecosystem.",
        followUpQuestions: ["Is Python interpreted or compiled?", "Why is Python slower than C?", "What is CPython vs PyPy?"],
      },
      {
        id: "pyb2",
        question: "Is Python interpreted or compiled?",
        answer: "The honest answer is **both** — Python is usually described as interpreted, but modern implementations compile source to bytecode first.\n\n**Execution pipeline (CPython)**:\n1. Source (.py) is parsed into an **AST** (syntax errors surface here).\n2. The compiler translates the AST into **bytecode** (.pyc cache in __pycache__).\n3. The **PVM (Python Virtual Machine)** — a stack-based loop inside CPython — executes bytecode instructions one at a time.\n\n**Why \"interpreted\" still fits**: bytecode is not native machine code. There is no ahead-of-time machine-code generation by default, so you lose C-level speed but gain portability of .pyc across same-version interpreters and instant edit-run cycles.\n\n**Nuances worth mentioning**: .pyc caching only happens for imported modules, not the main script. Implementations differ — **PyPy** uses JIT compilation to native code, **Cython** transpiles to C. Interviewers want the pipeline: source → AST → bytecode → PVM, and the point that compilation exists but targets bytecode, not CPU instructions.",
        code: `# demo.py — imported modules get cached bytecode
def add(a, b):
    return a + b

# Inspect bytecode:
import dis
dis.dis(add)
#   LOAD_FAST a, LOAD_FAST b, BINARY_ADD (or BINARY_OP), RETURN_VALUE

ls __pycache__/   # add.cpython-312.pyc appears after import`,
        codeLanguage: "python",
        explanation: "Python compiles source to bytecode which a virtual machine interprets — 'interpreted' refers to never producing native binaries.",
      },
      {
        id: "pyb3",
        question: "What is the difference between a dynamically typed and strongly typed language? Where does Python fall?",
        answer: "These two axes are often confused; they answer different questions.\n\n**Dynamic vs static typing — WHEN types are checked**:\n- Static (Java, C++, Go): types checked at compile time; variables have fixed declared types.\n- Dynamic (Python, JavaScript, Ruby): types checked at runtime; a name can be rebound to values of any type.\n\n**Strong vs weak typing — HOW strictly conversions happen**:\n- Strong (Python): no silent coercions between unrelated types. \"1\" + 1 raises TypeError.\n- Weak (JavaScript, PHP): implicit coercion — \"1\" + 1 yields \"11\" or 2 depending on operator.\n\n**So Python is dynamically AND strongly typed.** A variable x can hold int then str, but mixing incompatible types in an operation fails loudly instead of corrupting data.\n\n**Practical consequences**:\n- Errors surface at runtime → thorough tests and/or type checkers matter.\n- Optional **type hints** (PEP 484) give static analysis (mypy, pyright) without changing runtime behavior — hints are not enforced by the interpreter.\n- Duck typing works naturally: functions accept anything supporting the needed operations.",
        code: `x = 42          # int
x = "hello"     # rebinding to str is fine (dynamic)
print(x + "!")  # hello!

print("1" + 1)  # TypeError: can only concatenate str (not "int") to str
# JS equivalent would coerce: "1" + 1 -> "11"

def double(n): return n * 2
double(4)       # 8
double("ab")    # abab — duck typing`,
        codeLanguage: "python",
        explanation: "Dynamic = types checked at runtime and names are untyped; strong = no implicit cross-type coercion. Python is both dynamic and strong.",
      },
      {
        id: "pyb4",
        question: "What is PEP 8 and why does it matter?",
        answer: "**PEP 8** is Python Enhancement Proposal #8 — the official style guide for Python code, written largely by Guido van Rossum, Barry Warsaw, and Nick Coghlan. It defines conventions that make codebases uniform and readable.\n\n**Core rules**:\n- Indentation: 4 spaces (never tabs).\n- Naming: snake_case for functions/variables/modules, PascalCase (CapWords) for classes, UPPER_SNAKE for constants, _single_underscore for internal use.\n- Two blank lines between top-level functions/classes; one between methods.\n- Imports grouped: standard library → third-party → local, each alphabetized, on separate lines.\n- Spaces around operators and after commas; no space inside parentheses; avoid inline comments unless necessary.\n- Line length guideline ≤ 79 chars (many teams relax to 88–120).\n\n**Why interviewers ask**: style consistency lowers cognitive load during reviews and collaboration. Real teams enforce it automatically with tools — **black** (formatter), **ruff/flake8** (linter), **isort** (imports), pre-commit hooks.\n\n**Related**: PEP 257 covers docstring conventions (triple quotes, first line as summary). Mentioning tooling shows practical experience beyond memorizing rules.",
        code: `# PEP 8 compliant example
import os
import sys

MAX_RETRIES = 3

class HttpClient:
    def __init__(self, base_url):
        self.base_url = base_url

    def fetch(self, path):
        return f"{self.base_url}/{path}"

def process_items(items):
    result = []
    for item in items:
        if item > 0:
            result.append(item * 2)
    return result`,
        codeLanguage: "python",
        explanation: "PEP 8 is the community style guide — 4 spaces, snake_case functions, PascalCase classes — enforced in practice by black/ruff/flake8.",
      },
      {
        id: "pyb5",
        question: "What is the difference between == and is in Python?",
        answer: "**== compares value equality; is compares identity** — whether two names reference the exact same object in memory.\n\n**Rules**:\n- == calls the left operand's __eq__ method, so classes customize what equality means.\n- is checks id(a) == id(b); it cannot be overridden and is O(1).\n- For small ints (-5..256) and short identifier-like strings, CPython caches/interns objects, so is sometimes returns True coincidentally — never rely on this.\n\n**When to use each**:\n- Use is ONLY for singletons: x is None, x is not None. This is the canonical, lint-enforced pattern because None is a true singleton.\n- Everything else (numbers, strings, lists, dicts) → == (or != ).\n\n**Classic bug**: comparing numbers with is works in tests (small ints cached) then breaks with larger values in production. Similarly \"a\" is \"a\" may pass due to interning but is implementation-dependent behavior.\n\nBonus nuance: NumPy makes the distinction vivid — a == b returns an element-wise array of booleans, while a is b checks array identity.",
        code: `a = [1, 2, 3]
b = [1, 2, 3]
c = a

print(a == b)   # True  — equal contents
print(a is b)   # False — different list objects
print(a is c)   # True  — same object

x = None
print(x is None)        # correct singleton check
print(256 is 256)       # True  (cached small int — coincidence!)
print(257 is 257)       # often False across statements
s1 = "hello world"
s2 = "hello world"
print(s1 is s2)         # implementation-dependent; use ==`,
        codeLanguage: "python",
        explanation: "== asks 'equal value?' (via __eq__), is asks 'same object?' (same id). Only use is for None and other singletons.",
      },
      {
        id: "pyb6",
        question: "What is None in Python?",
        answer: "**None is Python's null object** — a singleton instance of type NoneType used to represent \"no value\" or an absent result.\n\n**Key properties**:\n- It is a real object, not a keyword meaning zero or empty. len(None) fails; None == 0 is False.\n- There is exactly ONE None instance per interpreter, hence identity checks work reliably.\n- Functions without an explicit return statement (or with bare return) return None.\n- None is falsy: bool(None) is False, but it is distinct from other falsy values (0, \"\", [], {}).\n\n**Correct usage patterns**:\n- Check presence with `if x is None` / `if x is not None` — not `== None` (custom __eq__ could interfere; linters flag it).\n- As a default parameter placeholder: def f(x=None). Inside, distinguish \"caller passed nothing\" from \"caller passed a falsy value\" using explicit None comparison.\n- Sentinel for missing dict keys or optional API results.\n\n**Trap**: `if not x` conflates None with 0, empty string, and empty containers. When those mean different things, test explicitly against None.",
        code: `def find_user(uid):
    if uid == 1:
        return {"name": "Ada"}
    # implicit return None

user = find_user(2)
print(user)            # None
print(type(None))      # <class 'NoneType'>

if user is None:               # identity check
    print("Not found")

def greet(name=None):
    if name is None:
        name = "guest"
    return f"hi {name}"

values = [0, "", [], None]
for v in values:
    print(bool(v))     # False, False, False, False — all falsy yet different`,
        codeLanguage: "python",
        explanation: "None is the unique NoneType singleton meaning absence of value; compare with is, and don't conflate it with other falsy values.",
      },
      {
        id: "pyb7",
        question: "Explain the mutable default argument pitfall.",
        answer: "Default argument values are evaluated **once, at function definition time**, and stored in the function object — not re-created on every call. If the default is mutable (list, dict, set), all calls share that same object, so mutations persist across calls.\n\n**The classic bug**:\ndef append_to(item, target=[]): target.append(item); return target\nEvery call appends into the SAME list: successive calls accumulate items unexpectedly.\n\n**Correct pattern**: default to None and create fresh container inside:\ndef append_to(item, target=None):\n    if target is None: target = []\n    ...\nThis preserves the convenience of omitting the argument while guaranteeing isolation per call.\n\n**Why it matters in interviews**: it demonstrates understanding of function-object internals — inspect with fn.__defaults__ to see the shared default. It also explains related behavior: defaults can even be mutated intentionally (memoization tricks), and immutable defaults (None, int, str, tuple, frozenset) are safe because they cannot be changed in place.\n\nDetection tooling: pylint's W0102 dangerous-default-value and ruff's B006 flag mutable defaults. Note dataclasses solve this elegantly with field(default_factory=list).",
        code: `def bad_append(item, target=[]):
    target.append(item)
    return target

print(bad_append(1))   # [1]
print(bad_append(2))   # [1, 2]  <- surprise! same list reused
print(bad_append.__defaults__)  # ([1, 2],)

def good_append(item, target=None):
    if target is None:
        target = []
    target.append(item)
    return target

print(good_append(1))  # [1]
print(good_append(2))  # [2]`,
        codeLanguage: "python",
        explanation: "Defaults bind once at definition; a mutable default is shared across calls — use None sentinel + create inside the function.",
        followUpQuestions: ["How do dataclasses handle mutable defaults?", "Where are defaults stored?"],
      },
      {
        id: "pyb8",
        question: "What are truthy and falsy values in Python?",
        answer: "Every object in Python has an inherent boolean value used whenever a condition is evaluated (if, while, and/or, filter, ternaries). **Falsy** objects evaluate to False; everything else is **truthy**.\n\n**Falsy values (complete list)**:\n- None\n- False\n- Zero numerics of every type: 0, 0.0, 0j, Decimal(0)\n- Empty sequences/collections: \"\", [], (), {}, set(), frozenset(), range(0)\n- bytes b\"\"\n- Any object whose class defines __bool__ returning False or __len__ returning 0\n\nEverything else — including non-empty strings, non-zero numbers, containers with items, functions, classes, instances — is truthy.\n\n**Customization**: define __bool__ (preferred) or __len__ on your class to control truthiness. If both defined, __bool__ wins.\n\n**Idioms and traps**:\n- `if items:` is preferred over `if len(items) > 0` — pythonic and polymorphic.\n- But beware: `if x:` conflates None, 0, and empty container. When they must be distinguished, compare explicitly (`if x is None`, `if x == 0`).\n- bool(obj) lets you see exactly how an object will evaluate.",
        code: `falsy = [None, False, 0, 0.0, "", [], {}, set(), ()]
truthy = [True, 1, -1, "a", [0], {"k": 1}, (0,), object()]

print([bool(v) for v in falsy])    # all False
print([bool(v) for v in truthy])   # all True

items = []
if items:                          # pythonic emptiness check
    print("has items")

class Stack:
    def __init__(self): self.data = []
    def push(self, v): self.data.append(v)
    def __len__(self): return len(self.data)

s = Stack()
print(bool(s))     # False — __len__ is 0
s.push(1)
print(bool(s))     # True`,
        codeLanguage: "python",
        explanation: "Objects carry implicit truthiness: None/False/zeros/empties are falsy; classes customize via __bool__ or __len__.",
      },
      {
        id: "pyb9",
        question: "How do and / or operators actually behave (short-circuit evaluation)?",
        answer: "In Python, **and/or do not return booleans — they return one of their operands**, chosen by short-circuit rules. This is why expressions like x or \"default\" work.\n\n**and**: evaluates left operand; if falsy, returns it immediately (right side never runs). Otherwise returns the right operand.\n  - 3 and 5 → 5 ; 0 and 5 → 0\n\n**or**: evaluates left operand; if truthy, returns it immediately. Otherwise returns the right operand.\n  - 3 or 5 → 3 ; 0 or \"default\" → \"default\"\n\n**Short-circuiting has side-effect implications**: guard patterns rely on it — `if obj is not None and obj.ready():` safely skips the second call when obj is None. Put cheap/likely-decisive conditions first.\n\n**Precedence**: not > and > or. Chained mixed operators should be parenthesized for clarity: (a or b) and c differs from a or (b and c).\n\n**Related**: comparison chaining (1 < x < 10) is a separate feature — evaluated once per operand, equivalent to (1 < x) and (x < 10) but without evaluating x twice.\n\nReturn-value semantics make and/or usable as expression-level conditionals, though conditional expressions (ternary) are clearer for choosing values.",
        code: `print(3 and 5)         # 5   (left truthy -> return right)
print(0 and 5)         # 0   (left falsy  -> short-circuit)
print(0 or "default")  # default
print("hi" or "default")  # hi

name = ""
display = name or "Anonymous"
print(display)         # Anonymous

obj = None
# safe guard: right side never evaluated when obj is None
print(obj is not None and obj.ready())  # False

print(not 0, not "a")  # True False
print(True or False and False)  # True — and binds tighter`,
        codeLanguage: "python",
        explanation: "and/or return operands and short-circuit: 'x or default' supplies fallbacks; guards prevent evaluating unsafe right-hand calls.",
      },
      {
        id: "pyb10",
        question: "What is the conditional (ternary) expression in Python?",
        answer: "Python's ternary is written **value_if_true if condition else value_if_false** — an expression, not a statement, so it can appear anywhere a value can (assignments, arguments, returns, comprehensions).\n\nx = 10\nparity = \"even\" if x % 2 == 0 else \"odd\"\n\n**Evaluation order**: the condition is evaluated FIRST, then only one branch executes — unlike the trick `[false_val, true_val][cond]` which evaluates both branches eagerly (and breaks with side effects or division-by-zero risks).\n\n**Chaining/nesting**: possible but hurts readability fast:\ngrade = \"A\" if s >= 90 else \"B\" if s >= 80 else \"C\"\nRead nested ternaries bottom-up. Most style guides suggest max one level of nesting; otherwise use if/elif statements or a lookup structure.\n\n**Common uses**:\n- Default/fallback selection combined with or: name = user_input or \"anonymous\" (though plain or changes semantics for falsy-but-valid values).\n- Inline returns: return n if n >= 0 else -n (abs).\n- In list/dict comprehensions for per-item transformation: [x if x >= 0 else 0 for x in vals].\n- Filtering comprehension syntax is different: [x for x in vals if cond] — the trailing if filters rather than selects.\n\nInterview tip: emphasize expression-vs-statement distinction and eager-evaluation trap of index-based emulation.",
        code: `age = 20
status = "adult" if age >= 18 else "minor"
print(status)                       # adult

def classify(n):
    return "pos" if n > 0 else ("zero" if n == 0 else "neg")
print(classify(-5), classify(0), classify(7))

vals = [-2, 5, -9, 8]
clipped = [v if v >= 0 else 0 for v in vals]
filtered = [v for v in vals if v >= 0]
print(clipped)    # [0, 5, 0, 8]
print(filtered)   # [5, 8]

# eager trap: both sides evaluated here
# r = divide() if ok else fallback  -> only chosen branch runs`,
        codeLanguage: "python",
        explanation: "Ternary is 'a if cond else b' — a lazy expression form of if/else usable anywhere a value is expected.",
      },
      {
        id: "pyb11",
        question: "What is the walrus operator (:=) introduced in Python 3.8?",
        answer: "The walrus operator (**:=**, PEP 572, Python 3.8) is the **assignment expression**: it assigns a value to a variable AND returns that value within a surrounding expression. Traditional assignment (=) is a statement and cannot appear inside expressions.\n\n**Primary use cases**:\n- While loops with computed conditions:\n  while chunk := file.read(8192): process(chunk)\n  Eliminates duplicated read logic before and inside the loop.\n- Avoiding repeated computation:\n  if (n := len(data)) > 100: print(f\"large: {n}\")\n  n is bound once and reusable in the body.\n- Comprehension filtering on computed values:\n  [y for x in data if (y := transform(x)) is not None]\n\n**Scope rule**: := assigns to the ENCLOSING scope (in comprehensions, the containing function), unlike comprehension-local loop variables — this was central to the PEP debate.\n\n**Restrictions**: cannot be used at top level of a statement (x := 1 alone needs parentheses: (x := 1)); disallowed in some positions like keyword argument values without parens.\n\n**Style guidance**: use where it removes genuine duplication; overuse harms readability. Some teams restrict it in review guidelines. Know it for interviews — it signals current-language awareness.",
        code: `import random

stream = iter([3, 0, 7])
while (val := next(stream, None)) is not None:
    print("got", val)

data = "x" * 250
if (n := len(data)) > 100:
    print(f"long input: {n} chars")

results = [cleaned for raw in [" a ", "", " b "] 
           if (cleaned := raw.strip())]
print(results)   # ['a', 'b']`,
        codeLanguage: "python",
        explanation: ":= assigns inside an expression (PEP 572), ideal for while-loop conditions and avoiding recomputation in ifs/comprehensions.",
      },
      {
        id: "pyb12",
        question: "Why does 0.1 + 0.2 != 0.3 in Python?",
        answer: "Because Python floats are **IEEE 754 double-precision binary floating-point**, and most decimal fractions have NO exact binary representation. 0.1 is stored as the nearest binary fraction (≈0.1000000000000000055511151231257827...), likewise 0.2. Their sum is ≈0.30000000000000004, while the literal 0.3 rounds to a slightly different nearest value — so equality fails.\n\n**This is not a Python bug** — identical behavior exists in C, Java, JavaScript. repr() in modern Python displays the SHORTEST string that round-trips, which hides the tiny error until arithmetic exposes it.\n\n**Correct approaches**:\n- Money and other exact decimals → decimal.Decimal (base-10, arbitrary precision): Decimal(\"0.1\") + Decimal(\"0.2\") == Decimal(\"0.3\") ✓. Construct from strings!\n- Scientific/measurement tolerance → math.isclose(a, b, rel_tol=1e-9) or abs(a-b) < eps instead of ==.\n- Rational arithmetic → fractions.Fraction(1, 10) is exact.\n- Massive numeric arrays → numpy.float64 has same issue; use tolerances.\n\n**Interview framing**: explain binary-vs-decimal representability (1/10 is repeating in binary like 1/3 in decimal), then immediately offer Decimal/isclose remedies — showing both cause and cure.",
        code: `print(0.1 + 0.2)              # 0.30000000000000004
print(0.1 + 0.2 == 0.3)       # False
print(format(0.1, ".20f"))    # 0.10000000000000000555

from decimal import Decimal
print(Decimal("0.1") + Decimal("0.2"))   # 0.3
print(Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))  # True

from fractions import Fraction
print(Fraction(1, 10) + Fraction(2, 10) == Fraction(3, 10))  # True

import math
print(math.isclose(0.1 + 0.2, 0.3))     # True`,
        codeLanguage: "python",
        explanation: "Floats are IEEE 754 binary doubles; 0.1 isn't exactly representable — use Decimal for money, isclose/tolerance for comparisons.",
      },
      {
        id: "pyb13",
        question: "What is integer interning (small integer caching) in CPython?",
        answer: "CPython caches **small integers from -5 to 256** as singleton objects created at interpreter startup. Every occurrence of, say, 42 anywhere in your program references the SAME int object. Rationale: these values dominate real workloads (indices, counters, ASCII codes), so sharing avoids millions of allocations and speeds comparisons via pointer equality paths.\n\n**Observable effects**:\na = 256; b = 256; a is b → True (cached)\na = 257; b = 257; a is b → often False when executed across separate lines/statements (two distinct allocations), though constant folding may fold them within one compiled unit — famously confusing in REPL vs script contexts.\n\n**Similar mechanisms**: string literals that look like identifiers are interned (sys.intern forces it for runtime strings); empty tuples and small tuples of constants are also folded.\n\n**Critical takeaways**:\n- NEVER depend on is for numeric/string equality — it is an implementation artifact, version-dependent, and optimizer-sensitive. Use ==.\n- Understanding interning explains memory profiles: many references, few objects.\n- Beyond -5..256, ints are ordinary immutable heap objects of arbitrary size (no overflow!) — contrast with Java's fixed-width primitives.\n\nMentioning the range and the \"don't rely on it\" rule is exactly what interviewers listen for.",
        code: `a = 100
b = 100
print(a is b)      # True — cached small int

c = 257
d = 257
print(c is d)      # frequently False (outside cache)

x = 2 ** 100
print(x)           # 1267650600228229401496703205376 — no overflow

s1 = sys.intern("run_time_string") if False else None
import sys
t1 = sys.intern("".join(["foo", "bar"]))
t2 = sys.intern("".join(["foo", "bar"]))
print(t1 is t2)    # True — forced interning`,
        codeLanguage: "python",
        explanation: "CPython pre-allocates ints -5..256 so is may accidentally match them — an implementation detail never to rely on for equality.",
      },
      {
        id: "pyb14",
        question: "How do you swap two variables without a temporary variable?",
        answer: "Pythonic swap uses **tuple packing/unpacking**: a, b = b, a. Under the hood the right side builds a tuple of current values BEFORE any assignment, then unpacks into the left-side targets — so no temp variable and no lost values.\n\n**Why it works (mechanics)**:\n1. RHS evaluates completely first → creates tuple (old_b, old_a).\n2. LHS unpacks positionally into existing names.\nBytecode shows ROT_TWO/SWAP optimization for two elements — CPython avoids materializing the tuple in the simple case, making it very fast.\n\n**Extensions of the same idea**:\n- Swap three+: a, b, c = c, a, b\n- Swap with expressions: arr[i], arr[j] = arr[j], arr[i] — idiomatic pivot swaps in quicksort.\n- Unpacking with star: first, *rest = seq ; a, *mid, z = seq\n\n**Contrast with other languages**: classic temp-variable dance (temp=a; a=b; b=temp) or XOR swap (C) are unnecessary noise in Python and less readable. Also note the subtle bug class this prevents: naive sequential assignments (a = b; b = a) lose the original a.\n\nInterviewers like hearing BOTH the syntax and the evaluate-RHS-first mechanics, plus a concrete algorithm use case like in-place partition swapping.",
        code: `a, b = 1, 2
a, b = b, a
print(a, b)        # 2 1

arr = [4, 1, 3, 2]
i, j = 0, 3
arr[i], arr[j] = arr[j], arr[i]   # in-place element swap
print(arr)         # [2, 1, 3, 4]

first, *middle, last = [1, 2, 3, 4, 5]
print(first, middle, last)        # 1 [2, 3, 4] 5

x, y, z = 1, 2, 3
x, y, z = z, x, y                 # rotate
print(x, y, z)                    # 3 1 2`,
        codeLanguage: "python",
        explanation: "Tuple unpacking (a, b = b, a) evaluates the right side fully first — clean, temp-free swapping including inside lists.",
      },
      {
        id: "pyb15",
        question: "What is the difference between / (true division) and // (floor division)?",
        answer: "Python (3.x) splits division into distinct operators:\n\n**/ — true division**: always returns a float, even for evenly divisible integers. 7 / 2 → 3.5 ; 6 / 3 → 2.0. Matches mathematical expectation; int results promote naturally.\n\n**// — floor division**: divides and floors toward NEGATIVE infinity, returning an int when both operands are int (float otherwise). 7 // 2 → 3 ; but 7 // -2 → -4 (floor of −3.5), NOT −3.\n\n**% remainder consistency**: Python defines % such that (a // b) * b + a % b == a always. Consequence: sign of result follows DIVISOR. 7 % -3 → -2 ; -7 % 3 → 2. This differs from C/Java, where remainder takes the dividend's sign. Useful property: cyclic indexing ((i - k) % n) stays non-negative for positive n.\n\n**divmod(a, b)** returns the pair (a // b, a % b) atomically — handy for chunking algorithms.\n\n**Rounding direction matters**: floor ≠ truncation for negatives (math.floor(-3.5)=-4 vs int(-3.5)=-3 truncates toward zero). Choosing // vs int() is therefore semantic, not cosmetic.\n\nAlso remember Python 2's classic gotcha: 7 / 2 was integer division there — a primary reason for the breaking 2→3 change.",
        code: `print(7 / 2, type(7 / 2))    # 3.5 float
print(6 / 3)                  # 2.0

print(7 // 2)     # 3
print(-7 // 2)    # -4  (floors toward -inf)
print(int(-3.5))  # -3  truncation — different!

print(7 % 3)      # 1
print(-7 % 3)     # 2   (sign follows divisor)
print(7 % -3)     # -2

q, r = divmod(17, 5)
print(q, r)       # 3 2`,
        codeLanguage: "python",
        explanation: "/ gives floats (true division); // floors toward -inf; % follows divisor sign so (a//b)*b + a%b == a holds.",
      },
      {
        id: "pyb16",
        question: "What is the difference between a module and a package?",
        answer: "**A module is a single .py file** containing definitions (functions, classes, variables) and runnable code. **A package is a directory of modules** (typically with an __init__.py) providing hierarchical namespace organization.\n\n**Module essentials**:\n- Each module has its own global namespace — collisions avoided via qualification (math.sqrt vs mymod.sqrt).\n- Modules execute ONCE on first import; subsequent imports fetch the cached module from sys.modules.\n- Any .py file is importable if its location is on sys.path.\n\n**Package essentials**:\n- Directory layout: mypkg/__init__.py, mypkg/core.py, mypkg/utils/helpers.py → imports look like from mypkg.utils.helpers import parse.\n- __init__.py (traditional packages) runs on package import; may expose a curated public API via __all__ or re-exports. Since Python 3.3, namespace packages allow directories WITHOUT __init__.py (PEP 420).\n- Relative imports inside packages: from . import core ; from ..utils import helpers (only valid within package context).\n\n**Distribution layer**: above packages sit distributions (pip-installable units) described by pyproject.toml — worth one sentence in interviews.\n\nTypical senior-signal points: import caching, circular-import avoidance via restructuring or late imports, and keeping __init__.py light to cut startup cost.",
        code: `# project layout:
# mypkg/
#   __init__.py        -> from .core import run  (curated API)
#   core.py
#   utils/
#     __init__.py
#     helpers.py

# elsewhere:
from mypkg import run                # via __init__ re-export
from mypkg.utils.helpers import fmt

# inside mypkg/core.py:
# from .utils.helpers import fmt     (relative)
import mypkg.core
import sys
print(mypkg.core in sys.modules.values())  # True after import`,
        codeLanguage: "python",
        explanation: "Module = one .py file with its own namespace; package = directory of modules with __init__.py forming an import hierarchy.",
      },
      {
        id: "pyb17",
        question: "What does if __name__ == '__main__': do?",
        answer: "Every module has a string attribute __name__. When Python runs a file directly (python app.py), that module's __name__ is set to **\"__main__\"**. When the same file is IMPORTED, __name__ becomes the module's name (e.g., \"app\"). The idiom exploits this to make files dual-purpose.\n\n**Why it exists**:\n- Scripts need entry-point logic; libraries must NOT execute side effects on import. The guard separates the two cleanly.\n- Enables importing functions/classes from a file that also works standalone — the foundation of testability (pytest imports your module; your demo/experiment code under the guard doesn't fire).\n\n**Typical content**: CLI parsing (argparse), quick demos, starting servers, calling main(). Professional projects put logic in a main() function and just call main() under the guard, keeping the branch minimal.\n\n**Related facts interviewers probe**:\n- Entry-point scripts installed via pip console_scripts bypass this (they import and call a function), so the guard is optional there.\n- Multiprocessing on Windows/spawn re-imports the main module — missing guard causes infinite process spawning (RuntimeError protects you).\n- __main__.py inside a package enables python -m mypkg execution.\n\nBeing able to explain WHY (side-effect-free imports) scores better than reciting the snippet.",
        code: `# converter.py
def c_to_f(c):
    return c * 9 / 5 + 32

def main():
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("celsius", type=float)
    args = p.parse_args()
    print(f"{args.celsius}C = {c_to_f(args.celsius)}F")

if __name__ == "__main__":
    main()

# python converter.py 100  -> runs main
# from converter import c_to_f  -> main skipped`,
        codeLanguage: "python",
        explanation: "__name__ is '__main__' only when run directly; the guard keeps imports side-effect free so modules stay testable and reusable.",
      },
    ],
  },
  {
    id: "data-types",
    title: "Data Types, Variables & Operators",
    icon: "🔢",
    questions: [
      {
        id: "pyd1",
        question: "What are Python's built-in core data types?",
        answer: "Python's built-in types group into a few families — knowing the taxonomy cold is table stakes:\n\n**Numeric**: int (arbitrary precision!), float (IEEE 754 double), complex (j suffix), plus bool (subclass of int!).\n\n**Sequence types**: str (immutable Unicode text), bytes/bytearray (immutable/mutable binary), list (mutable dynamic array), tuple (immutable sequence), range (lazy arithmetic sequence).\n\n**Set types**: set (mutable hash set), frozenset (immutable).\n\n**Mapping**: dict (hash table preserving insertion order).\n\n**Others**: NoneType (the None singleton), function/type/module objects, and everything else is an object too — including classes themselves (instances of type).\n\n**Mutability axis (the interview-favorite split)**:\n- Immutable: int, float, complex, bool, str, tuple, frozenset, bytes\n- Mutable: list, dict, set, bytearray\n\nConsequences of immutability: safe as dict keys/set members, shareable without defensive copies, enables interning/caching. Mutables cannot be hashed (unhashable type errors).\n\n**Type inspection**: type(x) for exact type, isinstance(x, (int, float)) honoring inheritance (bool passes isinstance int checks — a subtle favorite).",
        code: `nums = [3, 3.14, 2+3j, True]
print([type(n).__name__ for n in nums])
# ['int', 'float', 'complex', 'bool']

print(isinstance(True, int))    # True — bool subclasses int
print(hash((1, 2)))             # tuples hashable
try:
    hash([1, 2])                # lists unhashable
except TypeError as e:
    print(e)

d = {(1, 2): "point"}           # tuple as dict key
print(d[(1, 2)])`,
        codeLanguage: "python",
        explanation: "Core families: numeric, sequences (str/list/tuple/range/bytes), sets, dict, NoneType — split decisively by mutability, which drives hashing rules.",
      },
      {
        id: "pyd2",
        question: "How are variables different in Python compared to languages like Java or C?",
        answer: "Python variables are **names bound to objects**, not typed storage boxes.\n\n**Model**:\n- A variable is an entry in a namespace dict mapping the name string → object reference (conceptually; CPython optimizes locals to array slots).\n- Objects live on the heap carrying their own type info, refcount, and payload.\n- Assignment NEVER copies data — it rebinds the name to an (existing or new) object: y = x copies the REFERENCE, so both names point to one object.\n\n**Contrast with Java/C**:\n- C: int x reserves sizeof(int) bytes on stack; the box IS the storage.\n- Java primitives similar; objects via references but variables still statically typed.\n- Python: the name is typeless; the OBJECT is typed. Same name can rebind to int then str.\n\n**Practical fallout**:\n- Aliasing bugs: a = b = [] shares one list; mutating through either name affects both. Copy explicitly when independence is needed.\n- Function arguments pass object references by value (call-by-object-sharing) — mutations of mutables leak out; REBINDING a parameter doesn't affect the caller.\n- del removes the binding, possibly triggering object destruction via refcount drop — not the object directly.\n\nExplaining aliasing with a quick diagram-in-words is the strongest way to demonstrate mastery.",
        code: `x = [1, 2]
y = x            # alias — same object
y.append(3)
print(x)         # [1, 2, 3]

print(id(x) == id(y))   # True

a = b = []       # one shared list!
a.append(9)
print(b)         # [9]

def mutate(lst):
    lst.append("changed")     # visible to caller

def rebind(lst):
    lst = [99]                # local rebinding only

nums = [1]
mutate(nums); print(nums)     # [1, 'changed']
rebind(nums); print(nums)     # unchanged`,
        codeLanguage: "python",
        explanation: "Names are references bound to typed heap objects; assignment aliases rather than copies — mutation leaks, rebinding doesn't.",
      },
      {
        id: "pyd3",
        question: "What is the difference between mutable and immutable types? Why does it matter?",
        answer: "**Mutable** objects can change content in place after creation: list, dict, set, bytearray, and custom class instances by default. **Immutable** objects cannot: int, float, bool, str, tuple, frozenset, bytes. \"Changing\" an immutable rebinds the name to a NEW object.\n\ns = \"hi\"; s += \"!\" creates a new string — verifiable via changing id(s). Meanwhile lst.append(x) alters the existing list, id stable.\n\n**Why it matters — five consequences**:\n1. **Hashability**: only immutables can be dict keys / set members (their hash can't drift). Nested mutables inside tuples break this: hash(([1],)) fails.\n2. **Aliasing safety**: passing a list to ten functions risks surprise mutations; strings/tuples are inherently safe to share (why str.replace returns new strings).\n3. **Default-argument trap**: mutable defaults persist across calls (classic bug); immutable defaults are harmless.\n4. **Augmented assignment semantics**: lst += x mutates in place (__iadd__); tup += x REBINDS to a new tuple — different performance and aliasing behavior.\n5. **Performance**: immutable interning/caching possible; mutables need defensive copying.\n\n**Freezing strategies**: tuple(), frozenset(), types.MappingProxyType, dataclasses(frozen=True) for read-only views of data.",
        code: `lst = [1, 2]
print(id(lst))          # e.g. 140...
lst += [3]              # in-place extend
print(id(lst))          # SAME id

tup = (1, 2)
print(id(tup))
tup += (3,)             # NEW tuple object
print(id(tup))          # DIFFERENT id

d = {[1, 2]: "x"}       # TypeError: unhashable type: 'list'
d2 = {(1, 2): "x"}      # fine

inner = [1]
t = (inner,)
inner.append(2)         # mutable content inside immutable shell
print(t)                # ([1, 2],)`,
        codeLanguage: "python",
        explanation: "Mutable = changeable in place (list/dict/set); immutable = replaced not modified (str/int/tuple) — driving hashing, aliasing safety, and default-arg behavior.",
      },
      {
        id: "pyd4",
        question: "Explain shallow copy vs deep copy.",
        answer: "Assignment (b = a) copies NOTHING — both names reference one object. To duplicate, Python offers two levels:\n\n**Shallow copy** — copy.copy(a), a.copy(), list(a), a[:]: constructs a new outer container whose ELEMENTS are references to the originals. Top level independent; nested mutables still shared. Mutating a nested list through either copy is visible through the other.\n\n**Deep copy** — copy.deepcopy(a): recursively clones the entire object graph. Fully independent, but expensive and can hit recursion issues with deeply nested/self-referential structures (handled internally via a memo dict that also preserves shared references and cycles).\n\n**Choosing correctly**:\n- Flat list of scalars → shallow suffices (ints/strings are immutable anyway).\n- Matrix/list-of-lists needing independent rows → deepcopy OR explicit comprehension [row[:] for row in grid].\n- Config objects passed around → consider deepcopy defensively, or immutable design (frozen dataclasses) to sidestep copying entirely.\n\n**Customization**: classes control copying via __copy__ and __deepcopy__(self, memo). pickle round-trip is another (heavier) deep-copy route.\n\nDemo with ids at each nesting level is the clearest interview proof.",
        code: `import copy

grid = [[1, 2], [3, 4]]
alias = grid
shallow = copy.copy(grid)
deep = copy.deepcopy(grid)

grid[0][0] = 99
print(alias)     # [[99, 2], [3, 4]]  shared
print(shallow)   # [[99, 2], [3, 4]]  inner still shared!
print(deep)      # [[1, 2], [3, 4]]   fully independent

grid[1] = ["new"]
print(shallow)   # [[99, 2], [3, 4]]  top level unaffected

flat = [1, [2]]
print(id(flat) != id(shallow_of := copy.copy(flat)),
      id(flat[1]) == id(copy.copy(flat)[1]))  # True True`,
        codeLanguage: "python",
        explanation: "Shallow copy duplicates only the outer container (nested refs shared); deepcopy clones the whole graph recursively via memoized traversal.",
      },
      {
        id: "pyd5",
        question: "How does type conversion work? What are implicit vs explicit conversions?",
        answer: "**Explicit conversion (casting)** calls constructor functions: int(\"42\"), float(\"3.14\"), str(123), list(\"abc\"), tuple((1,2)), set([1,1]), dict([(\"a\",1)]), bool(anything). Constructors validate and raise on garbage — int(\"abc\") → ValueError; int(\"3.7\") also ValueError (must go through float first).\n\n**Implicit conversion (coercion)** happens only in narrow, well-defined spots — Python is strongly typed, so it resists silent conversions:\n- Numeric promotion ladder in mixed arithmetic: int → float → complex. 1 + 2.0 → 3.0.\n- bool IS int: True + True → 2 (surprising but intentional).\n- Truthiness conversion in conditions: if \"x\": invokes bool() implicitly.\n- String formatting interpolates values implicitly; but \"n=\" + 5 raises TypeError — must write str(5) or f-strings.\n\n**Truthiness rules for bool()**: falsy = None, False, 0/0.0/0j, empty str/list/tuple/dict/set, custom __bool__/__len__ falsy. Everything else True.\n\n**Gotchas worth citing**: round() banker's rounding (round(0.5)=0, round(1.5)=2); float precision loss converting huge ints to float; str↔bytes requiring encoding param.\n\nInterview tip: lead with \"explicit constructors + minimal coercion = fewer surprises\", then show the numeric promotion chain.",
        code: `print(int("42"), float("3.14"), str(99))
print(int(3.99))          # 3 truncates, no rounding
print(round(2.5), round(3.5))  # 2 4 — banker's rounding

print(1 + 2.0)            # 3.0 — int promoted to float
print(True + True)        # 2 — bool is int subclass
print("5" + 5)            # TypeError — no implicit coercion

print(bool(0), bool(""), bool([0]), bool(None))

try:
    int("3.7")
except ValueError as e:
    print("ValueError:", e)`,
        codeLanguage: "python",
        explanation: "Cast with constructors (int/float/str/list...); Python coerces almost nothing implicitly except numeric promotion and bool truthiness.",
      },
      {
        id: "pyd6",
        question: "How does Python handle arbitrarily large integers?",
        answer: "Python's int has **no fixed width and no overflow** — it grows to fit available memory. CPython stores ints as arrays of 30-bit digits (PyLongObject) with a size header, promoting transparently as values grow. Contrast with C/Java where int overflow wraps silently (Java Integer.MAX_VALUE + 1 goes negative) and BigInteger is a separate class you must opt into.\n\n**Demonstration**: 2 ** 200 computes instantly; factorial(500) yields hundreds of digits. Arithmetic remains exact — no floating error.\n\n**Boundaries and conversions**:\n- Converting giant int ↔ float loses precision or raises OverflowError (int(1e308*10)).\n- sys.maxsize (≈9.2e18) is NOT an int limit — it's the max for sizes/indices (CPython pointers), relevant for len() ranges and slicing.\n- Strings of digits ↔ int conversions of enormous magnitude now require sys.set_int_max_str_digits due to DoS mitigation (CVE-2020-10735) — nice up-to-date detail.\n\n**Performance trade-off**: bignum arithmetic costs more than machine-word ops; tight numerical loops should use numpy fixed-size dtypes or accept the overhead. Hash of large ints still consistent (modulus-based).\n\nFraming: \"arbitrary precision by default; opt into machine speed when profiling demands it.\"",
        code: `big = 2 ** 200
print(big)                      # full 61-digit number
print(len(str(big)))

import math
f500 = math.factorial(500)
print(len(str(f500)))           # 1135 digits, exact

import sys
print(sys.maxsize)              # 9223372036854775807 — index limit
print(sys.maxsize + 1 > 0)      # True — no wraparound

# float conversion limit
try:
    float(10 ** 400)
except OverflowError as e:
    print("OverflowError:", e)`,
        codeLanguage: "python",
        explanation: "int auto-grows (30-bit digit arrays internally) — exact arbitrary precision, no overflow; sys.maxsize bounds indices, not ints.",
      },
      {
        id: "pyd7",
        question: "What is the difference between bytes, str, and bytearray?",
        answer: "**str**: immutable sequence of UNICODE code points — human-readable text. No direct byte representation; encoding decides bytes.\n\n**bytes**: immutable sequence of RAW BYTES (0–255). File/network payloads, protocols, hashes are bytes. Literal prefix b\"...\" (ASCII-only contents).\n\n**bytearray**: mutable bytes — build binary buffers incrementally, then freeze with bytes(buf).\n\n**The encode/decode boundary** (the heart of every Unicode bug):\ntext.encode(\"utf-8\") → bytes ; raw.decode(\"utf-8\") → str. Mixing them raises TypeError: can't concat str to bytes — forcing deliberate boundary crossings. UTF-8 is variable-length (1–4 bytes/char), so len(str) counts CHARACTERS while len(bytes) counts BYTES: \"é\" is 1 char, 2 UTF-8 bytes.\n\n**Common operations**:\n- Reading files: open(path, \"r\", encoding=\"utf-8\") for text mode vs \"rb\" for bytes mode (images, zip, sockets).\n- Slicing bytes yields ints in py3: b\"ab\"[0] → 97 (contrast: str slice yields str).\n- decode errors='replace'|'ignore'|'strict' policy choice.\n\nRule of thumb to state aloud: **work in str internally; encode at edges (disk/network)**. Mention mojibake/UnicodeDecodeError debugging stories if asked for depth.",
        code: `text = "café"
raw = text.encode("utf-8")
print(raw)                # b'caf\\xc3\\xa9'
print(len(text), len(raw))        # 4 5 — é is 2 bytes

back = raw.decode("utf-8")
print(back == text)       # True

buf = bytearray(b"abc")
buf.extend(b"de")
buf[0] = 122
print(bytes(buf))         # b'zbcde'

print(b"abc"[0])          # 97 (int)
with open("x.bin", "rb") as f: pass  # binary IO returns bytes`,
        codeLanguage: "python",
        explanation: "str=unicode chars (immutable), bytes=raw bytes (immutable), bytearray=mutable bytes; convert explicitly with encode/decode at I/O edges.",
      },
      {
        id: "pyd8",
        question: "What are f-strings and why are they preferred over %-formatting and str.format()?",
        answer: "f-strings (formatted string literals, PEP 498, Python 3.6+) embed expressions directly inside braces of a prefixed literal: f\"User {name} scored {score:.1%}\".\n\n**Comparison across the three eras**:\n1. printf-style: \"%s scored %.1f%%\" % (name, score) — positional fragility, tuple mismatch errors.\n2. str.format: \"{} scored {:.1f}\".format(name, score) — safer, but template separated from values; verbose.\n3. f-string: expression INLINE with the text — readable top-to-bottom, fastest (compiled to efficient bytecode), supports any expression: f\"{a+b}\", f\"{items[-1]!r}\".\n\n**Power features**:\n- Format spec mini-language: alignment f\"{x:>8}\", padding, thousands f\"{n:,}\", percentage f\"{p:.1%}\", dates f\"{dt:%Y-%m-%d}\".\n- Debug shorthand (3.8+): f\"{value=}\" renders \"value=...\" — superb for logging.\n- Conversion flags !r !s !a choose repr/str/ascii.\n- Nesting: f\"{d[key]:>{width}}\".\n\n**Constraints**: expression scope is enclosing scope (no comprehension-local leakage surprises post-3.12 changes aside); cannot reuse a single template object for later substitution — that's the one legit reason to keep .format() (templates loaded from config/i18n). For logging specifically, prefer lazy % args so formatting skips when level disabled.",
        code: `name, score = "Ada", 0.927
print("%s scored %.1f%%" % (name, score * 100))
print("{} scored {:.1%}".format(name, score))
print(f"{name} scored {score:.1%}")      # Ada scored 92.7%

price, qty = 1234567.891, 3
print(f"total: {price * qty:,.2f}")      # 3,703,703.67
print(f"{score=:.2f}")                   # score=0.93
print(f"{ {'a': 1} }")                   # dict literal needs spaces
from datetime import date
print(f"today {date.today():%d %b %Y}")`,
        codeLanguage: "python",
        explanation: "f-strings interpolate expressions inline with rich format specs — faster and more readable than % and .format(); keep .format only for external templates.",
      },
      {
        id: "pyd9",
        question: "Explain augmented assignment operators and the += aliasing subtlety.",
        answer: "Augmented assignments (+= -= *= /= //= %= **= &= |= ^= >>= <<=) combine operation and assignment: x += 1 ≈ x = x + 1 — BUT for objects, Python attempts the IN-PLACE special method first.\n\n**The critical mechanism**: for x += y, Python calls x.__iadd__(y) if defined (mutate-and-return-self, typically mutables), else falls back to x = x.__add__(y) (create-new, immutables). So:\n- List: lst += [9] mutates the ORIGINAL object (like extend) — all aliases see it.\n- Tuple/str: t += (9,) binds the name to a NEW object — aliases unaffected.\n\n**Famous bug demonstrating the semantics**:\nt = ([1, 2],)\nt[0] += [99]\nRaises TypeError ('tuple' object doesn't support item assignment) YET the inner list HAS been mutated to [1, 2, 99] — because __iadd__ succeeded in place, then the store-back into the tuple failed. Great interview story proving in-place vs rebind distinction.\n\n**Other notes**:\n- Repeated target evaluation: big_dict[k].counter += 1 evaluates big_dict[k] once — efficiency win over manual form.\n- For NumPy arrays, += operates truly in-place (dtype constraints apply).\n- Immutables gain nothing semantically; CPython peephole-optimize simple cases anyway.",
        code: `a = [1, 2]
b = a
a += [3]              # in-place extend
print(b)              # [1, 2, 3] — alias saw mutation

s = "hi"
t = s
s += "!"
print(t)              # hi — strings rebind

tup = ([1, 2],)
try:
    tup[0] += [99]
except TypeError as e:
    print("TypeError:", e)
print(tup)            # ([1, 2, 99],) — mutated despite error!`,
        codeLanguage: "python",
        explanation: "+= prefers __iadd__ (in-place for mutables) else falls back to rebind (__add__) — explaining alias differences and the famous tuple-element mutation quirk.",
      },
      {
        id: "pyd10",
        question: "What is the difference between del, remove(), and pop()?",
        answer: "All three eliminate list elements but differ in interface:\n\n**del statement**: deletes by INDEX (or slice, or entire variable binding). del lst[2] ; del lst[1:3] ; del lst clears all. No return value. Works on variables themselves (del x unbinds the name) — the others are method calls on objects.\n\n**list.remove(value)**: searches by VALUE, removing the first matching occurrence; raises ValueError if absent. O(n) scan. Loop-with-remove is the classic skip-elements bug — removal shifts subsequent indices mid-iteration; use comprehensions or iterate a copy.\n\n**list.pop(index=-1)**: removes AND RETURNS the element; default pops the LAST item — O(1) at tail, O(n) at head/front (use collections.deque for O(1) both ends). pop() enables stack patterns; pop(0) queue anti-pattern (quadratic).\n\n**Selection guide**:\n- Know position, ignore value → del (also slices).\n- Need the removed value → pop.\n- Know value, not position → remove (guard with membership check or try/except).\n- Transforming wholesale → rebuild via comprehension (fastest, safest).\n\nComplexities recap: delete-by-index O(n) shifting (O(1) only at end), remove O(n) search + shift, pop tail O(1).",
        code: `lst = [10, 20, 30, 20]
del lst[0]
print(lst)             # [20, 30, 20]

lst.remove(30)
print(lst)             # [20, 20]

last = lst.pop()
print(last, lst)       # 20 [20]

# skip-during-iteration bug:
nums = [1, 2, 2, 3, 2]
for n in nums[:]:
    if n == 2:
        nums.remove(n)
print(nums)            # [1, 3] — safe via copy

evens_sq = [n*n for n in range(6) if n % 2 == 0]  # preferred transform`,
        codeLanguage: "python",
        explanation: "del kills by index/slice/binding, remove() hunts by value, pop() extracts and returns — pick by whether you know index, value, or need the item.",
      },
      {
        id: "pyd11",
        question: "What is operator precedence and associativity in Python? Give examples.",
        answer: "Precedence determines which operators bind tighter when expressions mix them; associativity resolves ties among SAME-precedence operators (mostly left-to-right; exponentiation is right-to-left).\n\n**High→low highlights (subset)**:\n1. () grouping, function calls, indexing\n2. ** (exponent) — right associative: 2 ** 3 ** 2 = 2 ** 9 = 512, NOT 64\n3. unary +x -x ~x\n4. * / // %\n5. + -\n6. << >>\n7. & ^ |\n8. comparisons (< <= > >= == != , chained)\n9. not\n10. and (then) or\n11. conditional expr, lambda, walrus\n\n**Classic traps**:\n- not x == y parses as not (x == y), i.e., x != y — surprising to many.\n- -2 ** 2 = -(2 ** 2) = -4; unary minus binds LOOSER than **.\n- 1 < 2 == True chains as (1<2) and (2==True) → 2==1 → False! Comparisons CHAIN, they don't associate pairwise-left like C.\n- Bitwise & binds tighter than comparisons in C but LOOSER than == in Python? No — in Python == binds TIGHTER than &: x & 3 == 1 means x & (3 == 1) → type error risk. Parenthesize bitwise ops.\n\nBest practice: when in doubt, parenthesize — readability beats memorizing tables, and reviewers will thank you.",
        code: `print(2 ** 3 ** 2)     # 512 — right associative
print(-2 ** 2)         # -4 — unary minus looser than **
print(not 1 == 2)      # True — not (1==2)
print(1 < 2 == True)   # False — chained: (1<2) and (2==True)
print(1 < 2 and 2 < 3) # True

x = 5
print(x & 3 == 1)      # x & (3==1) => 5 & False => 0 (!)
print((x & 3) == 1)    # True — parenthesize bitwise

print(True if 3 > 2 else False, 1 | 2 ^ 3 & 1)`,
        codeLanguage: "python",
        explanation: "Precedence orders mixed-operator parsing; ties resolve left-to-right except ** — watch not x==y, chained comparisons, and unary minus vs **.",
      },
      {
        id: "pyd12",
        question: "What is the Global Interpreter Lock's effect on everyday Python code?",
        answer: "The **GIL** is a mutex in CPython allowing only ONE thread to execute Python bytecode at a time within a process. Even on many-core machines, threads don't run Python code simultaneously.\n\n**Why it exists**: CPython's memory management (reference counting) isn't thread-safe; a single lock is a drastically simpler, faster solution than fine-grained locking on every object. Removing it (attempts: gilectomy, PEP 703 free-threaded build in 3.13 experimental) historically made single-threaded programs slower.\n\n**What the GIL does NOT block**:\n- I/O concurrency: threads RELEASE the GIL while waiting on socket/file/syscalls — threading works great for network/disk-bound work.\n- Native extensions (numpy, hashlib, zlib) release the GIL during heavy C computation.\n- multiprocessing: separate processes, separate GILs, true parallelism (IPC overhead).\n\n**Everyday implications**: CPU-bound pure-Python threads gain nothing from cores (may slow from contention); latency-sensitive servers mix threads for I/O with processes/workers for crunching. asyncio sidesteps threads entirely via cooperative scheduling on one thread.\n\nInterview framing: state what the GIL locks (bytecode execution), when it releases (I/O, C calls), and the decision matrix threads-vs-processes-vs-asyncio.",
        code: `import threading, time

def cpu_task():
    count = 0
    for _ in range(10_000_000): count += 1

start = time.perf_counter()
threads = [threading.Thread(target=cpu_task) for _ in range(2)]
[t.start() for t in threads]; [t.join() for t in threads]
print(f"2 CPU threads: {time.perf_counter()-start:.2f}s (~same as serial)")

def io_task():
    time.sleep(1)   # GIL released while sleeping/IO

start = time.perf_counter()
ts = [threading.Thread(target=io_task) for _ in range(5)]
[t.start() for t in ts]; [t.join() for t in ts]
print(f"5 IO threads: {time.perf_counter()-start:.2f}s (~1s, concurrent)")`,
        codeLanguage: "python",
        explanation: "GIL serializes bytecode execution per process — irrelevant for I/O-bound threads, fatal for CPU-bound ones; escape via processes or GIL-releasing C code.",
      },
      {
        id: "pyd13",
        question: "What are namespaces and scopes? Explain the LEGB rule.",
        answer: "A **namespace** is a mapping from names to objects (module globals, function locals, builtins, class bodies, instance/class dicts). **Scope** is the textual region where a namespace is directly searchable.\n\n**LEGB resolution order** when reading a name:\n1. **Local** — current function's scope.\n2. **Enclosing** — any wrapping function closures.\n3. **Global** — the module's namespace.\n4. **Builtins** — the builtins module (len, print...).\nFirst hit wins; missing everywhere → NameError.\n\n**Writing vs reading asymmetry**: assigning inside a function creates a LOCAL by default — even if a global of that name exists (shadowing). To rebind outer scopes: **global x** (module) or **nonlocal x** (nearest enclosing function, 3.x). Without them you'd get UnboundLocalError when reading before assignment in a branch.\n\n**Subtleties**:\n- Mutation ≠ rebinding: appending to a global list needs no global (no rebinding occurs).\n- Class scopes do NOT participate in closures for methods — LEGB skips class body for nested references.\n- Comprehensions have their own local scope (loop vars don't leak, 3.x).\n- dir(module)/globals()/locals() introspect namespaces; locals() snapshot semantics.\n\nDemonstrate shadowing + UnboundLocalError + nonlocal counter closure — the trifecta interviewers expect.",
        code: `x = "global"

def outer():
    x = "enclosing"
    def inner():
        nonlocal x
        x = "modified by inner"
    inner()
    print(x)          # modified by inner

outer()
print(x)               # global

count = 0
def bump_wrong():
    # count += 1       # UnboundLocalError (local assumed)
    global count
    count += 1
bump_wrong()
print(count)           # 1

log = []
def record(msg):
    log.append(msg)    # mutation: no global needed
record("hi")
print(log)`,
        codeLanguage: "python",
        explanation: "Name lookup walks Local→Enclosing→Global→Builtins; assignment creates locals unless declared global/nonlocal — mutations of outers don't need declarations.",
      },
      {
        id: "pyd14",
        question: "How does garbage collection work in Python?",
        answer: "CPython uses a **hybrid strategy**: primary reference counting + secondary generational cycle collector.\n\n**Reference counting**: every object carries ob_refcnt. Increments on binding/passing/storing; decrements when names deleted/scopes exit/containers shrink. Hitting zero frees the object IMMEDIATELY and deterministically (calls __del__ if present). Predictable, but costs per-operation updates and fails on CYCLES (a.b = b; b.a = a keeps both counts ≥1 forever).\n\n**Cycle detector (gc module)**: tracks container objects (dict, list, instances...) in generational buckets (gen0 young → gen2 old). Periodically it traverses surviving objects computing external references; unreachable cycles get freed regardless of nonzero internal refcounts. Generational hypothesis: most objects die young, so frequent young-gen scans catch temporaries cheaply.\n\n**Manual controls** (rarely needed): gc.collect() force-run; gc.disable()/enable() (commonly disabled in perf-critical forks); gc.get_stats(); weakref to observe without pinning alive.\n\n**Leak scenarios that defeat GC**: objects referenced from long-lived global registries, __del__-bearing cycles (pre-3.4 issue, mostly solved), C-extension leaks, lingering closures/lru_cache growth, exception tracebacks holding frames.\n\nMention that PyPy replaces this with GC-only design (no refcounting) — shows breadth beyond CPython.",
        code: `import gc, sys

a = []; b = []
a.append(b); b.append(a)   # cycle
del a, b
print(gc.collect())        # >=2 — cycle collected

class Node:
    def __init__(self): self.other = None

x = Node()
print(sys.getrefcount(x))  # 2 (x + arg)
y = x
print(sys.getrefcount(x))  # 3

import weakref
w = weakref.ref(Node())
print(w())                 # None already collected`,
        codeLanguage: "python",
        explanation: "Refcounting frees at zero instantly; a generational collector reclaims reference cycles — leaks come from live references, not magic.",
      },
      {
        id: "pyd15",
        question: "What is the difference between isinstance() and type()?",
        answer: "**type(x)** returns the EXACT class of x. **isinstance(x, cls)** returns True if x is cls OR any SUBCLASS of cls (honoring inheritance and __instancecheck__).\n\n**When each fits**:\n- isinstance is the default for type checking — polymorphism-friendly. Code accepting Animal shouldn't reject Dog.\n- type(x) is cls (identity compare) enforces EXACT type — occasionally desired (rejecting sneaky subclasses, distinguishing bool from int: type(True) is int is False while isinstance(True, int) is True).\n- Checking multiple: isinstance(x, (int, float)) accepts a tuple.\n\n**Anti-patterns**:\n- type(x) == cls — wrong even for exact checks (breaks with metaclasses' odd __eq__, slower than is); prefer type(x) is cls.\n- Excessive isinstance chains signal missed polymorphism opportunity (duck typing or visitor pattern).\n- isinstance against str to detect \"stringly-typed\" APIs blocks safe duck types like collections.abc.Sequence alternatives.\n\n**Advanced nugget**: isinstance consults cls.__instancecheck__ (metaclass hook) — ABCs like Iterable use it to register virtual subclasses: isinstance({}, Iterable) is True despite dict not inheriting Iterable. That's why isinstance({}, dict) vs Iterable checks diverge — great senior-level flourish.",
        code: `class Animal: pass
class Dog(Animal): pass

d = Dog()
print(type(d) is Dog)          # True
print(type(d) is Animal)       # False
print(isinstance(d, Animal))   # True — subclass accepted
print(isinstance(d, Dog))      # True

print(isinstance(True, int))   # True (bool ⊂ int)
print(type(True) is int)       # False

from collections.abc import Iterable
print(isinstance({"a":1}, Iterable))   # True via registration
print(isinstance({"a":1}, dict))       # True
print(type({"a":1}) is dict)           # True`,
        codeLanguage: "python",
        explanation: "type() is exact-class identity; isinstance honors inheritance and ABC virtual registrations — default to isinstance, reserve type-is for strict exclusion.",
      },
      {
        id: "pyd16",
        question: "What does the pass statement do and when is it useful?",
        answer: "**pass is a no-op**: syntactically a statement, semantically nothing. Python requires at least one statement in every block (functions, classes, loops, conditionals, try) — pass fills that slot without behavior.\n\n**Legitimate uses**:\n1. **Skeletons/stubs during development**: def todo(): ... then implement later. Idiomatic alternative is the Ellipsis literal (...) — same effect, common in stubs and abstract signatures (PEP 484 style).\n2. **Deliberately empty overrides**: class AdminRouter(BaseRouter): pass inheriting behavior untouched.\n3. **Exception swallowing**: except SpecificError: pass — MUST be narrowly scoped and commented; bare-except-pass hides bugs and is a red flag in review (ruff S110).\n4. **Placeholder branches documenting inaction**: if retry_budget_exhausted: pass else: attempt()\n\n**pass vs alternatives**:\n- Ellipsis (...) signals intentional incompleteness; pass reads as neutral filler. Type stubs (.pyi) conventionally use ....\n- docstring alone satisfies block requirement too.\n- continue vs pass: continue SKIPS to next loop iteration (only legal in loops); pass does nothing and falls through.\n\nInterview angle: they're really probing judgment about empty handlers — always pair except-pass with logging or justification, never blanket silence.",
        code: `class PluginBase:
    def on_start(self): ...

class MetricsPlugin(PluginBase):
    pass                     # inherit everything

def api_stub(): ...
print(api_stub())            # None

for ch in "a1b2":
    if ch.isdigit():
        continue             # skip iteration
    print(ch, end="")        # ab

try:
    risky()
except KeyError:
    pass                     # tolerated absence — comment why`,
        codeLanguage: "python",
        explanation: "pass satisfies Python's block-needs-a-statement rule as a no-op — use for stubs/empty overrides; treat except: pass as a documented, last-resort swallow.",
      },
    ],
  },
];
