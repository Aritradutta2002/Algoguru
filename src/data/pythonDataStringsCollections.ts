import type { InterviewTopic } from "@/data/pythonInterviewMetadataBase";
import type { PyQuestionMeta } from "@/data/pythonInterviewMetadataBase";

export const pythonTopicsPart2: InterviewTopic[] = [
  {
    id: "strings",
    title: "Strings in Depth",
    icon: "🧵",
    questions: [
      {
        id: "pys1",
        question: "Why are Python strings immutable?",
        answer: "Strings cannot be modified after creation — every \"modification\" method returns a NEW string.\n\n**Design rationale**:\n1. **Safe sharing**: identical literals can reference one interned object; mutation would corrupt every holder.\n2. **Hashability**: immutable + cached hash lets str serve as dict keys and set members — foundational to Python's dict-heavy design (attribute lookups are dict hits on interned names!).\n3. **Security**: file paths, module names, env keys can't be changed behind the interpreter's back mid-operation.\n4. **Thread safety**: shared strings need no locks.\n5. **Optimization**: compile-time constant folding (\"ab\" \"cd\" concatenation), interning, and predictable memory layout.\n\n**Performance consequence**: naive += concatenation in a loop is O(n²) — each step copies the whole string so far. CPython optimizes the exact pattern `s += x` when refcount is 1 (in-place resize), but DON'T rely on it — other implementations (PyPy) don't. The correct idiom is collecting parts then **\"\".join(parts)**: single allocation, O(total).\n\n**Escape hatches when mutation is genuinely needed**: build bytearray or io.StringIO, convert back at the end; or use list of chars.\n\nDemonstrate with id() changing across concatenation — concrete proof beats assertion.",
        code: `s = "hello"
print(id(s))
s += " world"
print(id(s))          # different object

parts = []
for i in range(5):
    parts.append(str(i))
result = "".join(parts)
print(result)         # 01234

buf = bytearray(b"hi")
buf[0] = ord("H")     # mutable alternative
print(buf.decode())   # Hi`,
        codeLanguage: "python",
        explanation: "Immutability buys safe sharing, hashing, interning and thread safety — pay with O(n²) loops unless you accumulate and join.",
      },
      {
        id: "pys2",
        question: "Explain string slicing syntax including negative indices and steps.",
        answer: "Slicing extracts subsequences via **seq[start:stop:step]** and works on ALL sequence types (str, list, tuple, bytes).\n\n**Indexing model**: start is INCLUSIVE, stop EXCLUSIVE. Valid indices run 0..len-1, but slice bounds clamp silently — s[:999] never errors (contrast with indexing s[999] → IndexError). Omitting values uses defaults: start=0, stop=len, step=1. Negative indices count from the end: s[-1] is last char.\n\n**step**: controls stride. Positive steps walk forward; negative walk BACKWARD from higher default start toward lower default stop. The famous reversal: s[::-1]. s[::2] takes every second char. With explicit negative step: s[5:1:-2] walks indices 5,3.\n\n**Mental formula** (for positive step): indices chosen are start, start+step, ... < stop. For negative: start, start+step, ... > stop.\n\n**Common idioms**: first n chars s[:n]; last char s[-1]; drop extension name.rsplit(\".\", 1)[0]; copy sequence s[:] (shallow); palindrome check s == s[::-1]; reverse words \" \".join(s.split()[::-1]).\n\n**Gotchas**: slices return NEW objects (strings always new due to immutability; lists shallow-copied — nested refs shared!). Empty results are silent (\"abc\"[10:20] == \"\").",
        code: `s = "Pythonic"
print(s[0], s[-1])       # P c
print(s[0:6])            # Python
print(s[:6], s[6:])      # Python ic
print(s[::-1])           # cinotyhP
print(s[::3])            # Phn
print(s[6:1:-2])         # cn
print(s[100:])           # "" — no error
lst = [[1], [2]]
cp = lst[:]
cp[0].append(9)
print(lst)               # [[1, 9], [2]] — shallow!`,
        codeLanguage: "python",
        explanation: "[start:stop:step] with inclusive-start/exclusive-stop, clamped bounds and negative strides — slicing never raises, it just returns less.",
      },
      {
        id: "pys3",
        question: "What is string interning? How does sys.intern work?",
        answer: "**Interning** stores each distinct string as a single shared object in an internal table; equal strings become pointer-identical.\n\n**What CPython interns automatically**: string LITERALS that resemble identifiers ([A-Za-z0-9_]) — variable-name-like constants such as \"name\", \"user_id\". This accelerates attribute/dict-key lookups (pointer comparison fast path before full hash equality) and saves memory. Strings built at runtime (concatenation, input(), splits) are NOT auto-interned; nor are strings with spaces/punctuation.\n\n**sys.intern(s)**: manually places/returns the canonical interned instance. Legitimate use case: programs comparing MILLIONS of strings repeatedly (parsers, deduplication) — identity check short-circuits expensive comparisons, and memory collapses to unique instances. Measure first; interning has costs (table retention — interned strings live long).\n\n**Interview traps**:\n- `a = \"hello\"; b = \"hel\" + \"lo\"` — constant folding may make them identical; but `p=\"hel\"; b=p+\"lo\"` computes at runtime → likely not same object.\n- NEVER write correctness against is for strings; interning is an optimization with version-dependent edges.\n- Small-string caching vs interning are related but distinct mechanisms.\n\nState clearly: semantics must rely only on ==; is-behavior is incidental.",
        code: `import sys

a = "python_intern"
b = "python" + "_intern"
print(a == b, a is b)    # True True-ish (folding)

c = "".join(["py", "thon"])
print(a is c)            # usually False — runtime-built

d = sys.intern(c)
print(a is d)            # True — forced intern

big = [sys.intern("tag_%d" % (i % 100)) for i in range(100000)]
# repeated tags share one object each`,
        codeLanguage: "python",
        explanation: "Identifier-like literals are auto-interned for fast dict/attribute paths; sys.intern extends that to runtime strings for comparison-heavy workloads.",
      },
      {
        id: "pys4",
        question: "Compare the main string methods: split, join, strip, replace, find/index, startswith.",
        answer: "These cover 90% of daily text processing — know signatures and edge cases:\n\n**split()**: no-arg split() divides on ANY whitespace runs and discards empties — different from split(\" \") which honors single separators producing empty strings. split(sep, maxsplit) limits splits; rsplit from right. Splitting on empty separator raises ValueError (use list(s) for chars).\n\n**join()**: separator.join(iterable_of_str) — THE efficient concatenator. All elements MUST be str (map(str, xs) first otherwise). Called on the SEPARATOR string, not the data.\n\n**strip()/lstrip()/rstrip()**: trims whitespace by default or any chars in the given set (order-independent set semantics: \"xyx hello x\".strip(\"x \")). Not prefix removal — that's removeprefix/removesuffix (3.9+), a classic misuse.\n\n**replace(old, new, count=-1)**: replaces all or first-count occurrences; no regex (use re.sub for patterns).\n\n**find vs index**: both locate substring returning position; find returns -1 when missing while index RAISES ValueError. Choose per error-handling style. rfind/rindex scan backward.\n\n**startswith/endswith**: accept TUPLES of prefixes — name.endswith((\".jpg\", \".png\")); great for filters without loops.",
        code: `csv_line = "  a , b ,c "
print(csv_line.split(","))     # ['  a ', ' b ', 'c ']
print("a  b\\tc".split())       # ['a', 'b', 'c'] any whitespace
print("::".join(["x", "y"]))   # x::y
print("|".join(map(str, [1, 2])))  # 1|2

raw = "...title!!!"
print(raw.strip(".!"))          # title
print(raw.removeprefix("...")) # title!!!

s = "banana"
print(s.find("na"), s.index("an"))
print(s.replace("na", "NA", 1))  # baNAna
print(s.startswith(("ba", "ta")))`,
        codeLanguage: "python",
        explanation: "Master split's whitespace-vs-separator modes, join-on-separator efficiency, strip-as-char-set vs removeprefix, find(-1)/index(raise), tuple-aware endswith.",
      },
      {
        id: "pys5",
        question: "How do you check if a string contains another string or matches a pattern?",
        answer: "**Membership — the `in` operator**: `\"sub\" in s` returns bool, calls __contains__, efficient substring search (CPython uses a mix of Crochemore-Perrin two-way algorithm). Case-insensitive needs normalization: needle.lower() in haystack.lower() (or casefold() for full Unicode correctness, e.g., German ß→ss).\n\n**Positional search**: s.find(sub) / s.index(sub) give locations; count occurrences with s.count(sub).\n\n**Prefix/suffix**: startswith/endswith incl. tuple forms.\n\n**Pattern matching — re module** when membership isn't enough:\n- re.search(pattern, s) scans anywhere; match anchors at START; fullmatch entire string.\n- Returns Match objects: m.group(), m.group(1) capture groups, m.span().\n- Compile hot patterns once (re.compile) for reuse & readability; use raw strings r\"\\d+\" to dodge backslash escaping.\n- Character classes, quantifiers, groups, alternation |, lookahead (?=...).\n- re.sub for replacement incl. function callbacks; re.findall/re.finditer for extraction.\n\n**Decision guide**: literal containment → in ; fixed affixes → startswith/endswith ; structure extraction/validation → regex ; heavy parsing → proper parser libraries. Avoid regex for simple containment — slower and unreadable.",
        code: `import re

s = "Order #12345 shipped to Berlin"
print("#12345" in s)             # True
print(s.lower().count("order"))  # 1
print(s.startswith("Order"), s.endswith(("Berlin", "Paris")))

m = re.search(r"#(\\d+).*to (\\w+)", s)
if m:
    print(m.group(0))            # #12345 shipped to Berlin
    print(m.groups())            # ('12345', 'Berlin')

pat = re.compile(r"\\w+@\\w+\\.com")
print(pat.search("mail bob@ex.com now").group())  # bob@ex.com
print(re.sub(r"\\d+", "N", s))    # Order #N shipped to Berlin`,
        codeLanguage: "python",
        explanation: "`in` for literal containment, startswith/endswith tuples for affixes, compiled raw-string regexes for structural extraction and substitution.",
      },
      {
        id: "pys6",
        question: "What is the difference between str methods like upper/lower/title/casefold and when do they matter?",
        answer: "Case-transform family:\n\n**upper()/lower()**: standard ASCII-centric mappings applied Unicode-wide. Fast path exists for pure-ASCII strings.\n\n**casefold()** (3.3+): AGGRESSIVE lowercasing designed for caseless MATCHING. Differences vs lower(): German ß → \"ss\" (lower leaves ß), plus various Greek/Turkish expansions. Any case-insensitive comparison of arbitrary user text should use casefold on BOTH sides: a.casefold() == b.casefold().\n\n**title()/capitalize()**: title capitalizes Each Word'S First Letter (and apostrophe quirks: \"they're\" → \"They'Re\"); capitalize lowercases rest of whole string leaving first char upper. swapcase flips.\n\n**Why interviews ask**: reveals Unicode awareness beyond ASCII.\n- Turkish dotless-i problem: \"Istanbul\".lower() yields i-dotless mismatch under Turkish locale expectations — locale-sensitive casing needs specialized libs (pyuca/icu), not builtin methods.\n- Comparisons: normalize FIRST (unicodedata.normalize(\"NFC\", s)) then casefold — combining accents break naive equality (é as single point vs e + U+0301).\n- Sorting/search UIs: use casefold keys as sort/display secondary.\n\nPractical snippet should show ß and composed-decomposed é equality failing pre-normalization.",
        code: `print("Hello World".upper())
print("HELLO".lower())
print("hello world".title())     # Hello World
print("they're".title())          # They'Re quirk!
print("straße".casefold())        # strasse
print("ß".lower() == "ss")        # False
print("straße".casefold() == "STRASSE".casefold())  # True

import unicodedata
a = "caf\\u00e9"        # composed é
b = "cafe\\u0301"       # e + combining accent
print(a == b)                                  # False
n_a = unicodedata.normalize("NFC", a).casefold()
n_b = unicodedata.normalize("NFC", b).casefold()
print(n_a == n_b)                              # True`,
        codeLanguage: "python",
        explanation: "Use casefold (not lower) for case-insensitive matching, and NFC-normalize before comparing accented text — ASCII habits break Unicode data.",
      },
      {
        id: "pys7",
        question: "How does join() differ from + concatenation performance-wise?",
        answer: "**+ creates a new string per operation**, copying left operand entirely each time: building via loop `out += part` is O(n²) worst case — total copied characters grow quadratically (1+2+...+k parts).\n\n**join() allocates ONCE**: it sums lengths first, then fills a single buffer — linear time regardless of piece count. For k pieces averaging m chars: join ≈ O(k·m); naive concat ≈ O(k²·m/2).\n\n**The CPython caveat**: the interpreter special-cases `s = s + x` / `s += x` statements where s's refcount is exactly 1 — resizing in place, making the naive loop near-linear IN CPython ONLY. PyPy/Jython lack this; refcount>1 (aliases!) defeats it even in CPython. So the optimization is an accident you shouldn't depend on.\n\n**Correct idioms**:\n- Known pieces list: \"\".join(pieces)\n- Generator/stream: collect into list then join (join materializes its argument twice internally — passing generators still works but lists are faster).\n- Building large text files: write chunks directly to file object instead of assembling giant strings.\n- Structured templating: f-strings per line into a list.\n\nBenchmark demonstration with timeit makes the answer memorable; mention numbers roughly (10⁵ pieces: seconds vs milliseconds).",
        code: `import timeit

pieces = [str(i) for i in range(50_000)]

t_concat = timeit.timeit(
    lambda: [None for p in pieces] and eval("''.__class__()".join([])) or None,
    number=0)

def slow():
    out = ""
    for p in pieces:
        out += p
    return out

def fast():
    return "".join(pieces)

print("concat :", timeit.timeit(slow, number=10))
print("join   :", timeit.timeit(fast, number=10))
assert slow() == fast()`,
        codeLanguage: "python",
        explanation: "+ copies cumulative buffers (O(n²)); join precomputes total size into ONE buffer (O(n)) — accumulate parts in a list, join once.",
      },
      {
        id: "pys8",
        question: "What are raw strings and when must you use them?",
        answer: "A **raw string** (r\"...\", R'...') tells the parser NOT to process backslash escapes — what you type is literally what the string holds. r\"C:\\new\\test\" keeps double backslashes; normal \"C:\\new\\test\" would embed newline + tab characters.\n\n**Critical clarifications interviewers probe**:\n1. Raw strings are a SYNTAX-level convenience for YOU writing literals; they produce ordinary str objects — no separate raw-string TYPE exists at runtime.\n2. A raw string cannot END in an odd number of backslashes: r\"path\\\\\" is invalid because the final backslash would escape the quote (workaround: r\"path\" + \"\\\\\").\n3. Backslash STILL escapes quotes inside raw strings (r\"a\\\"b\" contains a backslash-quote) — escaping machinery isn't fully off.\n\n**Where raw strings are essential**:\n- **Regex patterns**: re.match(r\"\\d{3}-\\w+\") — without r, \"\\d\" is invalid escape (DeprecationWarning/SyntaxWarning since 3.12) and \"\\\\d\" doubles noise.\n- Windows file paths: r\"C:\\Users\\name\".\n- LaTeX, SQL with backslashes, docstrings containing escapes.\n\nRelated: bytes literals rb\"...\", f-string combos rf\"...\" combine prefixes. Also note Python 3 treats unknown escapes in NORMAL strings as errors-in-waiting — another reason regexes demand raw strings.",
        code: `normal = "C:\\new\\folder"
raw = r"C:\\new\\folder"
print(normal == raw)      # False!
print(repr(normal))       # 'C:\\new\\folder' with newline+tab
print(repr(raw))

import re
text = "id=42-user_x"
print(re.search(r"id=(\\d+)-(\\w+)", text).groups())

# print(r"ends with backslash \\")  <- SyntaxError if odd count
print(r"safe" "\\\\")        # workaround ends-with-backslash`,
        codeLanguage: "python",
        explanation: "r'' disables escape PROCESSING at parse time (still plain str): mandatory for regex patterns and Windows paths; can't end in odd backslashes.",
      },
      {
        id: "pys9",
        question: "Explain str.format mini-language formatting: alignment, padding, numbers, dates.",
        answer: "Both f-strings and str.format share the **format spec mini-language** appended after a colon: {value:[[fill]align][sign][#][0][width][,][.precision][type]}.\n\n**Alignment & padding**: < left, > right, ^ center; optional fill char precedes align. f\"{'hi':*^10}\" → ****hi*****. Default align: strings left, numbers right.\n\n**Width/zero-fill**: {:8} pads spaces; {:08.2f} zero-fills (classic IDs/timestamps).\n\n**Numbers**:\n- Precision: {:.3f} fixed decimals; {:g} compact.\n- Thousands separator: {:,} → 1,234,567 ; European style {:,.n}? Actually swap via format(n, ',').replace... or locale.\n- Percent: {:.1%} multiplies by 100 and appends %.\n- Bases: {:b} {:o} {:x}/{:X} hex, {:e} scientific, {:#x} adds 0x prefix.\n- Sign control: {: +d} forces +/-; {: d} space for positives.\n\n**Dates**: datetime supports __format__ delegating to strftime codes directly in specs: f\"{dt:%Y-%m-%d %H:%M}\".\n\n**Dynamic specs**: nesting lets width/precision come from variables: f\"{val:{w}.{p}f}\" — table rendering without manual math.\n\nKnowing sign/base/percent combos signals production experience — tables, logs, CSV exports all lean on these.",
        code: `pi = 3.14159
n = 1234567.891
print(f"{pi:.2f}")          # 3.14
print(f"{pi:08.3f}")        # 0003.142
print(f"{'left':<10}|{'right':>10}|{'mid':^10}")
print(f"{'mid':-^10}")      # ---mid----
print(f"{n:,}")             # 1,234,567.891
print(f"{n:,.2f}")          # 1,234,567.89
print(f"{0.8734:.1%}")      # 87.3%
print(f"{255:x} {255:#010b}")  # ff 0b11111111
from datetime import datetime
now = datetime.now()
print(f"{now:%Y-%m-%d %H:%M:%S}")
w, p = 12, 4
print(f"[{pi:{w}.{p}}]")    # dynamic width/precision`,
        codeLanguage: "python",
        explanation: "One spec grammar powers f-strings and format(): fill+align, width, zero-pad, thousands, percent, bases and strftime codes — with nestable dynamic fields.",
      },
      {
        id: "pys10",
        question: "How do you efficiently process very large text files line by line?",
        answer: "**Never read whole files with read() when they may exceed RAM** — stream instead.\n\n**Idiomatic streaming**: iterate the file object directly — it reads lazily chunk-by-chunk yielding lines:\nwith open(path, encoding=\"utf-8\") as f:\n    for line in f:\n        process(line.rstrip(\"\\n\"))\nMemory stays constant regardless of file size; the with block guarantees closure even on exceptions.\n\n**Variants & trade-offs**:\n- f.readline(): manual loop until \"\" sentinel — clunkier, rarely wins.\n- list(f) / f.readlines(): loads ALL lines eagerly — only for bounded sizes needing random access.\n- Binary mode \"rb\" + incremental decode, or open(..., buffering=...) to tune chunk sizes for throughput.\n- Huge SINGLE lines (no newlines): iterate binary in fixed chunks: while chunk := f.read(1<<20).\n- gzip.open / bz2 / zipfile transparently compose with the same iteration protocol.\n\n**Processing pipeline tips**: generator functions chain stages lazily (read → filter → transform → aggregate) keeping memory flat; csv.reader wraps handles similarly; enumerate(f, 1) supplies line numbers cheaply.\n\nMention universal newlines translation and errors='replace' for dirty data as polish points.",
        code: `def suspicious_lines(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        for lineno, line in enumerate(f, 1):
            if "ERROR" in line:
                yield lineno, line.strip()

def word_count(path):
    counts = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            for w in line.split():
                counts[w] = counts.get(w, 0) + 1
    return counts

with open("demo.txt", "w") as f:
    f.write("ok line\\nERROR boom\\nplain\\n")
print(list(suspicious_lines("demo.txt")))`,
        codeLanguage: "python",
        explanation: "Iterate the file handle (lazy line streaming) inside a with block; chain generator stages to keep memory O(line) not O(file).",
      },
      {
        id: "pys11",
        question: "What is the difference between str and repr of an object?",
        answer: "Two dunder hooks define textual representations:\n\n**__str__**: for END USERS — readable, friendly. Invoked by str(obj), print(), f-string {} conversion.\n\n**__repr__**: for DEVELOPERS/debugging — unambiguous, ideally EVALUABLE to reconstruct the object (repr convention). Invoked by repr(), interactive REPL echo, debugger watches, collections printing containers' contents, f-string {!r}.\n\n**Fallback rule**: if __str__ is missing, Python USES __repr__ — hence defining repr alone gives decent behavior everywhere; the reverse is false (default object.__repr__ shows class+address).\n\n**Conventions**:\n- repr: <ClassName(field=value, ...)> or ClassName(...) eval-style; quote strings inside (repr their repr).\n- str: human phrasing, units, rounding acceptable.\n- dataclasses/@property tooling generate sensible repr automatically; enum members print as ClassName.MEMBER.\n\n**Debug superpower**: log with lazy %-formatting (%r) or f\"{value!r}\" so invisible whitespace/type mismatches surface immediately — classic bug where \"5\" vs 5 or trailing spaces hide behind str.\n\nContainer gotcha: print([obj]) shows reprs of ELEMENTS, never their str — another reason repr deserves priority when choosing one to implement.",
        code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __repr__(self):
        return f"Point({self.x!r}, {self.y!r})"
    def __str__(self):
        return f"({self.x}, {self.y})"

p = Point(3, 4)
print(p)          # (3, 4)          __str__
print(repr(p))    # Point(3, 4)     __repr__
print([p])        # [Point(3, 4)]   container uses repr
print(f"{p!r}")   # Point(3, 4)

class OnlyRepr:
    def __repr__(self):
        return "OnlyRepr()"
o = OnlyRepr()
print(str(o))     # falls back to __repr__`,
        codeLanguage: "python",
        explanation: "__str__ targets humans via print/f-strings; __repr__ targets debugging (eval-friendly) — containers call repr, and missing __str__ falls back to it.",
      },
      {
        id: "pys12",
        question: "How do you count character/word frequencies in a string?",
        answer: "**Characters**:\n- collections.Counter(s) — one-liner returning dict-like mapping char→count, with most_common(n) top-k. O(n) hash counting.\n- s.count(ch) for a single known char (C-speed loop; fastest when checking few chars).\n\n**Words**:\n- Normalize first (casefold, strip punctuation) then split: Counter(re.findall(r\"[\\w']+\", text.casefold())) — regex tokenization beats bare split() which keeps punctuation attached.\n- Stopword filtering via set difference comprehension before counting.\n\n**Counter superpowers worth naming**:\n- most_common(k) — heap-backed top-k.\n- Arithmetic: c1 + c2, c1 - c2 (subtract), & intersection of minimums, | union of maximums — anagram/diff checks trivially.\n- elements() replays multiset contents; missing keys return 0 instead of KeyError.\n\n**Alternatives**: defaultdict(int) manual loop (pre-Counter style, still seen in codebases); dict.get(w, 0)+1 one-pass; pandas value_counts for tabular contexts.\n\nComplexity note: all hash approaches average O(n); sorting by count adds O(u log u) over unique tokens u.",
        code: `from collections import Counter
import re

text = "the quick brown fox jumps over the lazy dog the end"
chars = Counter(text)
print(chars.most_common(3))
words = Counter(re.findall(r"[\\w']+", text.casefold()))
print(words["the"])              # 3
print(words.most_common(2))

a, b = Counter("listen"), Counter("silent")
print(a == b)                    # True — anagram test

d = {}
for w in words.elements():
    d[w] = d.get(w, 0) + 1
print(d["fox"])                  # 1`,
        codeLanguage: "python",
        explanation: "Counter over casefolded regex tokens is the canonical frequency tool — with most_common, arithmetic merging and anagram-grade comparisons built in.",
      },
      {
        id: "pys13",
        question: "What are the differences between isdigit(), isdecimal(), isnumeric()?",
        answer: "Three overlapping-but-distinct digit tests — precision here signals Unicode fluency:\n\n**isdecimal()**: strictest — only characters usable to build base-10 NUMBERS (category Nd): ASCII 0-9, Arabic-Indic ٠١٢, Devanagari digits. What int() accepts.\n\n**isdigit()**: decimal PLUS superscripts/subscripts/other digit-property chars (² ³ ¹). Superscript two passes isdigit but int(\"²\") raises ValueError — the trap!\n\n**isnumeric()**: broadest — adds numeric-value characters: fractions (½), Roman numerals (Ⅷ), Chinese/Japanese numerals (五 三). All pass, none convertible via int().\n\nContainment chain: isdecimal ⊂ isdigit ⊂ isnumeric.\n\nEmpty strings: all three return False (no coercion surprises).\n\n**Practical guidance**:\n- Validating user integer input → isdecimal() (or try/int() EAFP, best).\n- Detecting \"looks like a digit glyph\" typographically → isdigit().\n- Numeric-symbol detection (fractions etc.) → isnumeric(); conversion requires unicodedata.numeric(ch) which returns float VALUE for such chars — nice flourish.\nAlso adjacent: str.isalpha/isalnum/isspace families and their Unicode breadth versus ASCII assumptions.",
        code: `tests = ["42", "42.0", "²", "½", "Ⅷ", "四", ""]
for t in tests:
    print(repr(t),
          t.isdecimal(), t.isdigit(), t.isnumeric())

print("42".isdigit() and int("42"))   # fine
try:
    int("²")
except ValueError as e:
    print("int fails on superscript")

import unicodedata
print(unicodedata.numeric("½"))       # 0.5
print(unicodedata.numeric("Ⅷ"))       # 8.0`,
        codeLanguage: "python",
        explanation: "isdecimal (int()-safe Nd digits) ⊂ isdigit (+superscripts) ⊂ isnumeric (+fractions/Roman/CJK numerals) — validate input with isdecimal or EAFP int().",
      },
      {
        id: "pys14",
        question: "How do you reverse a string, and why is there no built-in reverse method?",
        answer: "**Primary idiom — slicing**: s[::-1]. O(n), one new string, works because negative step walks backward. Universally recognized by Python readers.\n\n**Alternative — reversed() + join**: \"\".join(reversed(s)). reversed() returns a lazy iterator; joining materializes. Slightly more verbose; shines when combined transformations chain (filter/map between reverse and join) or when reversing OTHER iterables uniformly (lists support lst.reverse()/reversed too).\n\n**Why no s.reverse()**: mutability asymmetry. Lists HAVE .reverse() because they mutate in place. Strings are IMMUTABLE — an in-place reverse is impossible; adding str.reverse() would just sugar-coat slicing, violating \"one obvious way\" minimalism. Guido-era design kept the API tight; reversed(seq) generic protocol (__reversed__/sequence fallback) covers all sequences uniformly.\n\n**Edge cases & extensions**:\n- Reverse WORDS order, not letters: \" \".join(s.split()[::-1]).\n- Grapheme clusters (emoji with modifiers, accents) break naive codepoint reversal — true text segmentation needs third-party grapheme lib; worth mentioning for senior polish.\n- Palindrome testing pairs naturally with slicing: clean = \"\".join(filter(str.isalnum, s.casefold())); clean == clean[::-1].",
        code: `s = "Python"
print(s[::-1])                    # nohtyP
print("".join(reversed(s)))       # nohtyP

sentence = "never odd or even"
words_rev = " ".join(sentence.split()[::-1])
print(words_rev)

def is_palindrome(t):
    t = "".join(c for c in t.casefold() if c.isalnum())
    return t == t[::-1]
print(is_palindrome("A man, a plan, a canal: Panama"))  # True

lst = [1, 2, 3]
lst.reverse()                     # in place — lists CAN mutate
print(lst, list(reversed(lst)))`,
        codeLanguage: "python",
        explanation: "Reverse via s[::-1] (or join(reversed(s))); no str.reverse() exists because immutables can't flip in place — reversed() serves all sequences generically.",
      },
      {
        id: "pys15",
        question: "What are the most common string-related bugs in real code?",
        answer: "Interviewers love battle stories; catalog the classics:\n\n**1. Encoding mismatches**: reading UTF-8 file with platform-default encoding (Windows cp1252) → UnicodeDecodeError or mojibake. ALWAYS pass encoding=\"utf-8\" explicitly to open/text APIs.\n\n**2. str/bytes mixing**: concatenating or comparing str with bytes raises TypeError — decode network/file payloads promptly, keep boundaries disciplined.\n\n**3. Mutable default & accumulation**: appending to a shared default list of strings persists across calls (covered elsewhere) — manifests as mysteriously growing outputs.\n\n**4. Naive concatenation in loops**: quadratic blowups on big inputs; profile reveals join fix.\n\n**5. Whitespace invisibles**: trailing spaces/newlines breaking == comparisons — strip() at ingestion; debug with repr()/!r to SEE them.\n\n**6. Case-sensitivity assumptions**: \"ID\" != \"id\"; use casefold comparisons for user-facing matching.\n\n**7. Stringly-typed logic**: parsing floats/bools ad hoc (\"True\" string vs True); centralize conversion helpers.\n\n**8. Regex metachar injection**: re.escape(user_input) before embedding into patterns.\n\n**9. Off-by-one slicing**: forgetting exclusive stop; test boundaries explicitly.\n\nFraming two of these with a debugging anecdote (what symptom → root cause → guardrail added: lint rule, helper, encoding policy) turns knowledge into credibility.",
        code: `# 1. explicit encodings everywhere
with open("data.csv", encoding="utf-8", errors="strict") as f:
    rows = f.read()

# 5/6. normalize at boundaries
def norm_key(raw):
    return raw.strip().casefold()

# 8. escape user regex fragments
import re
pattern = re.compile(re.escape("$pecial (input)") + r"=\\d+")

# 5. reveal invisible characters
suspicious = "admin\\u200b"      # zero-width space!
print(repr(suspicious), len(suspicious))
print(norm_key(suspicious) == norm_key("admin"))`,
        codeLanguage: "python",
        explanation: "Top offenders: implicit encodings, str/bytes leaks, invisible whitespace/case mismatches, quadratic concat, unescaped regex input — defend with explicit policies and repr-debugging.",
      },
    ],
  },
  {
    id: "collections",
    title: "Lists, Tuples, Sets & Dicts",
    icon: "📦",
    questions: [
      {
        id: "pyc1",
        question: "What is the difference between a list and a tuple?",
        answer: "**Mutability is the headline**: lists mutate in place (append, insert, remove, sort...); tuples are frozen at creation. Everything else flows from this.\n\n**Comparison dimensions**:\n- **Syntax**: [1, 2] vs (1, 2). Single-element tuples need comma: (5,) — parentheses alone don't make tuples, the COMMA does (5 is int; 5, is tuple).\n- **Hashability**: tuples hashable (when contents are) → dict keys/set members, function return bundles; lists unhashable.\n- **Semantics**: tuple = heterogeneous RECORD (\"Ada\", 36, True); list = homogeneous COLLECTION of items processed uniformly. Static type hints reflect this: tuple[str, int] fixed shape vs list[int] variable length.\n- **Performance**: tuples smaller (no over-allocation) and faster to create; iterating comparable.\n- **Safety**: immutable structures can't be mutated by callee — defensive by construction; namedtuples/dataclass(frozen) formalize records further.\n\n**When tuples bite**: \"immutable shell, mutable guts\" — t = ([1],) allows t[0].append(2), and attempting t[0] += [...] mutates THEN raises TypeError. Also tuple unpacking powers swaps/multiple returns — syntax-level synergy.\n\nRule of thumb to state: reach for tuple until you need mutation.",
        code: `point = (10, 20)
record = {"loc": point}          # hashable key material
sizes = [160, 180]
sizes.append(200)                # lists grow

single = (5,)
not_tuple = (5)
print(type(single).__name__, type(not_tuple).__name__)

mixed_t = (1, "a", [2])
mixed_t[2].append(3)             # inner list mutates
print(mixed_t)                   # (1, 'a', [2, 3])
try:
    mixed_t[2] += [4]            # mutate then fail store-back
except TypeError:
    print("TypeError after mutation:", mixed_t)`,
        codeLanguage: "python",
        explanation: "Lists = mutable homogeneous collections; tuples = immutable heterogeneous records — giving hashing, safety, slight speed, and record-shaped typing.",
      },
      {
        id: "pyc2",
        question: "How is a dict implemented internally? Why is lookup O(1)?",
        answer: "dict is an open-addressed **hash table**. Each key runs through hash(key) → slot index = hash mod table_size; probing resolves collisions.\n\n**CPython layout (compact dict since 3.6)**: two arrays — a sparse INDEX array mapping slots to entries, and a dense ENTRIES array storing (hash, key, value) triples in insertion order. Benefits: iteration follows insertion order (guaranteed language-wide since 3.7), deletion leaves dense-array tombstones rather than sparse holes, memory friendlier than classic per-slot structs.\n\n**Hash requirements**: keys must be hashable (immutable-ish: __hash__ consistent with __eq__). Equal objects MUST have equal hashes. Lists/dicts rejected (unhashable) for good reason — content drift would orphan entries.\n\n**Collision handling**: perturb-based linear probing; load factor threshold (~2/3) triggers RESIZE (power-of-two growth, rehash all) — occasional O(n) spikes amortized into O(1) average.\n\n**Average complexities**: lookup/insert/delete O(1) expected; worst O(n) under adversarial collisions (hash-flooding DoS mitigated by random hash seeds for str).\n\n**Value vs identity nuance**: lookup compares hash then equality (==), so 1 and True collide intentionally (equal + same hash) — fun demo.",
        code: `d = {"apple": 1, "banana": 2}
d["cherry"] = 3                 # insert
print(list(d.items()))          # insertion order preserved
del d["apple"]
print(list(d))                  # order minus apple

print(hash("apple") == hash("apple"))  # deterministic per-run
print(hash(1) == hash(True))           # True — equal => equal hash
d2 = {1: "int", True: "bool"}
print(d2)                       # {1: 'bool'} one slot!

class K:
    def __init__(self, v): self.v = v
    def __hash__(self): return hash(self.v)
    def __eq__(self, o): return self.v == o.v
kd = {K("x"): 9}
print(kd[K("x")])               # custom key works`,
        codeLanguage: "python",
        explanation: "Dict = hash table with compact entries array (insertion-ordered since 3.6/3.7), probing collisions, resize at ~2/3 load — O(1) average ops.",
      },
      {
        id: "pyc3",
        question: "Are dictionaries ordered? Since when?",
        answer: "**Yes — insertion order is preserved and guaranteed.** Implementation detail arrived in CPython 3.6 (compact dict layout); became an OFFICIAL language guarantee in **Python 3.7** (synced across all conforming implementations).\n\n**Precise semantics**:\n- Iteration (keys, values, items), repr, JSON dumping follow FIRST-insertion sequence.\n- Reassigning an EXISTING key updates its value WITHOUT moving position — original slot retained.\n- Deleting then re-adding a key appends it at the END (fresh insertion).\n\n**OrderedDict still matters** despite plain-dict ordering:\n1. move_to_end(key, last=True) — LRU cache building block.\n2. popitem(last=False) pops FIFO head (dict popitem is LIFO-only).\n3. Equality SENSITIVITY to order: OrderedDict(a=1,b=2) == OrderedDict(b=2,a=1) is False — plain dicts compare equal ignoring order. Matters for config snapshots/tests.\n4. Signals intent explicitly in APIs where sequence is contractual.\n\n**Sorting vs ordering**: sorted(d.items(), key=...) produces ordered VIEWS/copies — doesn't reorder d itself; rebuild dict(sorted(...)) if needed.\n\nHistorical hook: pre-3.6 dicts were unordered hash tables; code relying on order was buggy until the guarantee landed.",
        code: `d = {}
d["z"] = 1; d["a"] = 2
d["z"] = 99                      # update: stays first-position
print(list(d))                   # ['z', 'a']
del d["z"]; d["z"] = 100         # re-add goes last
print(list(d))                   # ['a', 'z']

from collections import OrderedDict
od = OrderedDict(banana=2, apple=1)
od.move_to_end("banana")         # now last was already last
print(od == OrderedDict(apple=1, banana=2))  # False — order-sensitive
pd = {"b": 2, "a": 1}
print(pd == {"a": 1, "b": 2})    # True — order-blind`,
        codeLanguage: "python",
        explanation: "Dicts preserve insertion order (guaranteed 3.7+); OrderedDict remains for move_to_end, FIFO popping and order-sensitive equality.",
      },
      {
        id: "pyc4",
        question: "What is the difference between a set and a frozenset?",
        answer: "**set**: mutable unordered collection of UNIQUE hashable elements — add/remove/discard/pop/clear mutate it. Built via {1,2,3} or set(iterable) (empty needs set(), since {} is a dict!).\n\n**frozenset**: immutable variant — construct once, never changes. Hashable ⇒ usable as dict KEY, set ELEMENT, or constant in module scope. No mutators; everything else identical (membership, algebra).\n\n**Set algebra (both types)**: union | , intersection &, difference -, symmetric difference ^; named equivalents accept ANY iterable (set.union(xs) vs | needing sets). Subset/superset: <= >= < proper. Membership `in` is O(1) average — the core reason to choose sets over lists for dedup/lookup (list `in` is O(n)).\n\n**When frozenset specifically**: graph adjacency constants, memoization keys of visited states, feature flags sets passed around safely, composite dict keys {(x, frozenset(tags)): val}. Also protects API boundaries — callee can't tamper.\n\n**Gotchas**:\n- Sets unordered: NO indexing/slicing; sort via sorted(s).\n- Elements must be hashable — no lists/dicts/sets inside; nest frozensets instead.\n- {False, 0, 0.0} collapses to one element ({0}); likewise {1, True}.",
        code: `skills = {"py", "sql"}
skills.add("git"); skills.discard("nope")   # silent remove
print("py" in skills, len(skills))

fs = frozenset({"read", "write"})
perms = {fs: "admin_file"}        # frozenset as dict key
print(perms[frozenset("writer" "read".split())])

a, b = {1, 2, 3}, {3, 4}
print(a | b, a & b, a - b, a ^ b)
print({1, True, 1.0})             # {1} — equality collapse

try:
    {frozenset([1]), {2}}
except TypeError as e:
    print(e)                      # unhashable inner set`,
        codeLanguage: "python",
        explanation: "set mutates for O(1) membership and algebra; frozenset freezes it into a hashable constant usable as keys/elements and safe shared state.",
      },
      {
        id: "pyc5",
        question: "Explain the collections module highlights: defaultdict, Counter, deque, namedtuple, OrderedDict.",
        answer: "**defaultdict(default_factory)**: missing-key access auto-invokes factory (list, int, set...) instead of KeyError. Grouping idiom: dd = defaultdict(list); dd[key].append(v) — kills the get-or-init dance. Caveat: accidental READS create entries (use .get for probing).\n\n**Counter**: multiset counter — Counter(iterable) tallies; most_common(k), elements(), arithmetic (+ - & |), missing keys → 0. Frequency tables, anagram diffs, voting tallies.\n\n**deque** (double-ended queue): linked blocks giving O(1) appendleft/popleft AND append/pop right; list.pop(0) is O(n)! Powers queues, sliding windows (maxlen=N auto-evicts), rotating (rotate(k)), BFS frontiers. Random ACCESS is O(n)-ish middle — pick per access pattern.\n\n**namedtuple(typename, fieldnames)**: tuple subclass with NAMED fields — rec.x instead of rec[0]; memory-light records, unpackable, _asdict(), _replace() copies. Modern rivals: typing.NamedTuple (class syntax + hints) and dataclasses (mutable option, defaults).\n\n**OrderedDict**: order-sensitive equality, move_to_end, popitem(last=False) — LRU recipes; plain dict covers mere ordering since 3.7.\n\nChoosing among them demonstrates idiomatic fluency — each replaces hand-rolled boilerplate.",
        code: `from collections import defaultdict, Counter, deque, namedtuple

posts = [("ai", 1), ("web", 2), ("ai", 3)]
by_tag = defaultdict(list)
for tag, pid in posts:
    by_tag[tag].append(pid)
print(by_tag)                     # {'ai': [1, 3], 'web': [2]}

votes = Counter(["yes", "no", "yes"])
print(votes.most_common(1))       # [('yes', 2)]

dq = deque(maxlen=3)
for i in range(5):
    dq.append(i)
print(dq)                         # deque([2, 3, 4]) evicts old

Point = namedtuple("Point", "x y")
p = Point(3, 4)
print(p.x, p.y, p._asdict())`,
        codeLanguage: "python",
        explanation: "defaultdict removes init boilerplate, Counter counts, deque gives O(1) both-end ops, namedtuple names records, OrderedDict adds order-sensitive behaviors.",
      },
      {
        id: "pyc6",
        question: "What is the difference between sort() and sorted()?",
        answer: "**list.sort()**: in-place METHOD on lists — reorders the existing list, returns None (by design, preventing `x = lst.sort()` foot-guns). Mutates callers' data — aliasing side effects.\n\n**sorted(iterable)**: BUILT-IN accepting ANY iterable (lists, tuples, strs, dicts→keys, generators, sets) — returns a NEW sorted LIST, original untouched.\n\n**Shared machinery**: Timsort — hybrid merge/insertion sort, O(n log n) worst, EXPLOITS existing runs (adaptive: nearly-sorted input approaches O(n)), stable (equal keys retain relative order — enables multi-pass sorts).\n\n**Key customization**: key= function extracting comparison basis (itemgetter, attrgetter, lambdas); reverse=True. NO cmp argument in py3 — emulate via key tuples or functools.cmp_to_key for exotic orders.\n\n**Multi-field sorting**: stable multi-PASS trick — sort by least-significant key first, then primary: data.sort(key=itemgetter(2)); data.sort(key=itemgetter(0)). Or single-pass tuple keys (careful: mixed-type fields break tuple comparison — negate numerics for desc, wrap strings in reverse-trick classes otherwise).\n\n**Dict sorting**: sorted(d.items(), key=lambda kv: kv[1]) → list of pairs; dict(sorted(...)) rebuilds ordered.",
        code: `from operator import itemgetter

nums = [5, 2, 9, 1]
out = sorted(nums)
print(nums, out)          # original intact

people = [("Ada", 36, "eng"), ("Bob", 25, "ops"), ("Cid", 36, "art")]
by_age_name = sorted(people, key=lambda p: (p[1], p[0]))
print(by_age_name)

# stable multi-pass: dept asc, then age desc
tmp = sorted(people, key=lambda p: p[1], reverse=True)
stable = sorted(tmp, key=itemgetter(2))
print(stable)

words = ["pear", "fig", "apple"]
print(sorted(words, key=len, reverse=True))`,
        codeLanguage: "python",
        explanation: "sort() mutates lists returning None; sorted() copies any iterable into a fresh list — both ride stable adaptive Timsort with key=/reverse= customization.",
      },
      {
        id: "pyc7",
        question: "What is the time complexity of common operations on list, dict, set, and deque?",
        answer: "Big-O fluency separates seniors. Reference card (n items, k relevant):\n\n**list** (dynamic array of refs):\n- Index/store arr[i]: O(1)\n- append/pop tail: O(1) amortized (occasional resize copy)\n- insert(0)/pop(0)/in membership: O(n) (shift all; linear scan)\n- slice a:b: O(b-a); sort: O(n log n)\n\n**dict** (open-addressed hash table):\n- get/set/del/in: O(1) average, O(n) pathological collisions\n- iteration: O(n) over capacity-proportional table\n- keys()/values()/items(): views — O(1) to obtain, O(n) to traverse\n\n**set** (same hashing core):\n- add/remove/in: O(1) average\n- Algebra | & - ^: O(len(smaller/other) approx) — union O(n+m)\n\n**collections.deque** (block-linked):\n- append/pop BOTH ends: O(1)\n- middle indexing dq[i]: O(n) traversal — anti-pattern for random access\n- rotate: O(k)\n\n**tuple** mirrors list reads (O(1) index) minus mutations.\n\n**Practical red flags to cite**: using list as queue (pop(0) → quadratic BFS), membership loops over lists inside loops (O(n²) — switch to set), repeated string += (O(n²)).",
        code: `from collections import deque
import timeit

n = 20_000
lst = list(range(n))
st = set(range(n))
dq = deque(range(n))

print("list in :", timeit.timeit(lambda: n-1 in lst, number=100))
print("set  in :", timeit.timeit(lambda: n-1 in st, number=100))

q_list = list(range(n))
t0 = timeit.perf_counter()
for _ in range(2000): q_list.pop(0)      # O(n) shift each
t1 = timeit.perf_counter()
for _ in range(2000): dq.popleft()       # O(1)
t2 = timeit.perf_counter()
print(f"pop0 list={t1-t0:.4f}s  deque={t2-t1:.6f}s")`,
        codeLanguage: "python",
        explanation: "Arrays win indexed access, hashes win membership, deques win both-end queues — knowing shift/scan costs prevents accidental O(n²) designs.",
      },
      {
        id: "pyc8",
        question: "How do list comprehensions work and when do they beat loops?",
        answer: "Comprehensions build lists declaratively: **[expression for item in iterable if condition]** — desugared to an optimized bytecode loop appending results, typically 20–40% faster than equivalent for-loop.append and clearer intent-wise.\n\n**Anatomy**: expression transforms EACH surviving item; trailing if FILTERS (may stack multiple ifs); leading conditional-expression selects values: [x if ok(x) else 0 for x in xs]. Multiple for clauses flatten nests: [f(r,c) for r in rows for c in cols] (row-major order).\n\n**Siblings**: {k_expr: v_expr for ...} dict comp; {x for ...} set comp; (x for ...) GENERATOR expr — lazy, memory-flat, ideal inside sum()/any()/max(). Walrus integration filters computed intermediates: [y for t in data if (y := heavy(t)) > 0].\n\n**When comprehensions WIN**: transform+filter pipelines readable in one glance; building new collections; feeding aggregate functions.\n\n**When they LOSE**:\n- Multi-step bodies needing statements (try, assignments) — loops stay honest.\n- Deep nesting (>2 fors/ifs) becomes write-only — extract helpers or loop.\n- Side effects (printing/writing) — comprehension semantically implies BUILDING a result; abusing it misleads readers and wastes a throwaway list.\n- Huge intermediate materialization when only aggregation needed — prefer generator expressions.\n\nScope nugget: comprehension body runs in its OWN function scope (3.x); loop vars don't leak.",
        code: `vals = [-4, 7, -1, 9, 0]

abs_pos = [v for v in vals if v > 0]           # filter
clipped = [max(v, 0) for v in vals]            # transform
signed = ["+" if v > 0 else "-" for v in vals] # select
pairs = [(i, v) for i, v in enumerate(vals)]   # enrich
flat = [x for row in [[1,2],[3]] for x in row] # nest-flatten

sq_sum = sum(x*x for x in vals)                # genexp feed
print(abs_pos, clipped, signed, flat, sq_sum)

matrix = [[1, 2, 3], [4, 5, 6]]
transposed = [list(col) for col in zip(*matrix)]
print(transposed)`,
        codeLanguage: "python",
        explanation: "Comprehensions fuse filter+transform into one optimized expression — reach for them when a pipeline reads linearly; bail to loops when logic needs statements.",
      },
      {
        id: "pyc9",
        question: "What is the difference between copy.copy() and assignment for collections?",
        answer: "Assignment (b = a) binds a NEW NAME to the SAME object — zero copying, pure aliasing; mutations through either name are globally visible (ids equal).\n\n**copy.copy(a) — shallow**: constructs a NEW outer container replicating the top level; ELEMENT references copied verbatim. Consequences: replacing top-level items (shallow[0] = x) doesn't affect original, but MUTATING shared nested objects (shallow[0].append) does — both see it.\n\nShorthand producers of shallow copies: list(a), a[:], a.copy(), dict(a), set(a) — all equivalent to copy.copy for those types.\n\n**copy.deepcopy(a)**: recursively clones nested containers (memoized to preserve shared subgraphs and cycles). Full independence at maximal cost.\n\n**Decision matrix**:\n- Scalars-only flat collection → shallow suffices (immutable elements can't be mutated anyway).\n- Nested structures needing isolation → deepcopy or targeted comprehension copies ([row[:] for row in grid] — cheaper than deepcopy when depth is known).\n- Read-sharing intended → skip copying; consider immutable types/frozen dataclasses to make sharing SAFE instead of copying defensively forever.\n\nDemo ids at both levels proves the boundary precisely — memorize the output pattern.",
        code: `import copy

orig = {"meta": [1, 2], "name": "cfg"}
alias = orig
shallow = copy.copy(orig)
deep = copy.deepcopy(orig)

orig["meta"].append(3)
orig["name"] = "renamed"
print(alias)    # fully affected
print(shallow)  # meta shared [1,2,3]; name stale 'cfg'
print(deep)     # fully independent

grid = [[0]*3 for _ in range(3)]
grid[0][0] = 9
print(grid)     # comprehension rows independent
bad = [[0]*3]*3
bad[0][0] = 9
print(bad)      # aliasing trap! all rows change`,
        codeLanguage: "python",
        explanation: "= aliases; copy() clones one level (nested refs shared); deepcopy clones recursively — the [[0]*3]*3 row-aliasing trap is the classic proof.",
      },
      {
        id: "pyc10",
        question: "How do you merge dictionaries in modern Python?",
        answer: "**Four eras, ascending elegance**:\n\n1. **update()** — mutates receiver: d1.update(d2). Later keys WIN. Careful with shared references.\n\n2. **{**d1, **d2}** — dict-unpacking literal (3.5+): builds NEW dict; later unpackings override; composes multiple sources inline.\n\n3. **d1 | d2** — merge OPERATOR (3.9+) creating new dict, right side winning conflicts; **|=`** for in-place update. Reads cleanly in chains: defaults | overrides.\n\n4. **Manual/Collections patterns** for special semantics: ChainMap(defaults, overrides) — LIVE layered VIEW, zero copying, edits hit FIRST map (great config precedence); defaultdict for accumulating merges in loops.\n\n**Conflict-resolution nuance**: all built-ins bias RIGHT (later source wins). Precedence configs often want LEFT-bias: merged = {**overrides, **defaults}? No — that lets defaults clobber; instead merged = {**defaults, **explicit} where explicit later wins. State the winner rule explicitly in interviews.\n\n**Deep merge**: none built-in — nested dicts need recursive function/library (pydantic, glom); mention that |= is shallow.\n\nPerformance: | and unpacking allocate; update/|= reuse capacity — negligible until hot loops with big dicts.",
        code: `defaults = {"theme": "dark", "retries": 3, "extra": {"log": 1}}
overrides = {"retries": 5}

merged = defaults | overrides          # 3.9+
print(merged["retries"], "theme" in merged)

unpacked = {**defaults, **overrides}   # 3.5+
print(unpacked["retries"])

inplace = dict(defaults)
inplace |= overrides                   # shallow update

from collections import ChainMap
view = ChainMap(overrides, defaults)   # lookup precedence
print(view["retries"], view["theme"])
overrides["retries"] = 7
print(view["retries"])                 # live view reflects`,
        codeLanguage: "python",
        explanation: "| / |= (3.9) join dicts right-wins; {**a, **b} predates it; ChainMap layers views without copying; all merges are SHALLOW.",
      },
      {
        id: "pyc11",
        question: "What are dictionary views? How do keys(), values(), items() behave?",
        answer: "dict.keys()/values()/items() return **VIEW objects** — dynamic windows onto the dict, NOT snapshots. Mutating the dict instantly reflects through existing views; conversely keys/items views support set operations.\n\n**Properties**:\n- Lazy: O(1) creation, O(n) iteration; no memory duplication.\n- Dynamic: view after deletions shrinks — classic surprise when looping a view WHILE mutating (RuntimeError: dictionary changed size during iteration). Safe routes: iterate over list(view) copy, or build filtered new dict comprehension.\n- keys() behaves like a SET (unique hashables): d.keys() & other_keys, |, - work. items() acts set-like WHEN values are hashable (usable for diffing small dicts). values() is multiset-ish — only membership/countable, no set algebra (values may repeat/be unhashable).\n- Membership: `\"k\" in d` ≡ in keys view (fast path direct on dict); value membership `v in d.values()` is O(n) scan.\n\n**Patterns**: items() drives k,v loops (for k, v in d.items()); symmetric difference detects config drift: added = new.keys() - old.keys().\n\nContrast with py2's returned LISTS (snapshots) — the semantic shift explains why mutating-during-iteration now raises instead of silently misbehaving.",
        code: `d = {"a": 1, "b": 2, "c": 3}
ks = d.keys()
del d["a"]
print(list(ks))                  # ['b', 'c'] — dynamic!

added = {"c": 3, "d": 4}.keys() - d.keys()
removed = d.keys() - {"c": 9, "d": 4}.keys()
print("added:", added, "removed:", removed)

for k, v in d.items():
    print(k, v, end="; ")
print()

safe_iter = [ (k, d[k]) for k in list(d) ]  # snapshot route`,
        codeLanguage: "python",
        explanation: "Views are live, lazy projections: keys/items behave set-wise, values() only membership — snapshot with list(view) before mutating during iteration.",
      },
      {
        id: "pyc12",
        question: "What happens when you modify a list while iterating over it?",
        answer: "Iterating uses an INTERNAL POSITION CURSOR advancing by one per next() — mutating the list mid-loop shifts subsequent elements UNDER the cursor, skipping some and/or revisiting others. No exception is raised for lists (unlike dicts!) — it fails SILENTLY, which is why it's a beloved interview trap.\n\n**Classic broken example**:\nnums = [1,2,2,3,2]\nfor n in nums:\n    if n == 2: nums.remove(n)\nAdjacent 2s cause skips: cursor advances past the element shifted into the inspected slot. Result leaves stray 2s.\n\n**Dicts/sets DO raise RuntimeError (changed size during iteration)** — protective failure since 3.x.\n\n**Correct patterns**:\n1. Build NEW collection (comprehension) — preferred: kept = [x for x in nums if x != 2].\n2. Iterate over a COPY while mutating original: for x in nums[:]: ... nums.remove(x) — O(n²) but simple for rare removals.\n3. Backward index loop deleting by index: for i in range(len(nums)-1, -1, -1): if bad(nums[i]): del nums[i].\n4. while + index management for complex logic.\n5. itertools.filterfalse / generator pipeline for streaming filters.\n\nExplain WHY (cursor vs shifting array) then show the comprehension fix — that pairing nails the concept.",
        code: `nums = [1, 2, 2, 3, 2, 2]
for n in nums:
    if n == 2:
        nums.remove(n)
print("buggy:", nums)            # [1, 2, 3, 2] — skipped!

kept = [x for x in [1, 2, 2, 3, 2, 2] if x != 2]
print("fixed:", kept)

data = [1, 2, 2, 3, 2]
for x in data[:]:
    if x == 2:
        data.remove(x)
print(data)                      # [1, 3]

d = {"a": 1}
# for k in d: del d[k]           # RuntimeError
for k in list(d):
    del d[k]
print(d)                         # {}`,
        codeLanguage: "python",
        explanation: "Mid-iteration mutation shifts elements past the cursor (silent skips) — rebuild via comprehension, iterate a copy, or walk indices backwards.",
      },
      {
        id: "pyc13",
        question: "What is *unpacking and **packing in function calls and assignments?",
        answer: "Star syntax moves fluidly between PACKING (collecting) and UNPACKING (spreading) depending on side:\n\n**In assignments/targets**: star collects leftovers into a LIST: first, *rest = [1,2,3] → rest=[2,3]; a, *mid, z = seq (one starred target max). Tuple packing powers multiple returns/swap.\n\n**In CALLS (unpacking)**: f(*args_list) spreads a sequence into positional args; f(**kwargs_dict) spreads mapping into keyword args. Requirements: starred iterable non-str preferred (strings spread chars!), **-mapping keys must be valid identifier strings (else TypeError).\n\n**In DEFINITIONS (packing)**: def f(*args) gathers extra positionals into tuple; def f(**kwargs) gathers keywords into dict; signature order: positional, *args, keyword-only (after *), **kwargs last.\n\n**Composition power**: wrappers/decorators forwarding transparently (def wrapper(*a, **kw): return fn(*a, **kw)); merging iterables [*a, *b, *c] / dicts {**d1, **d2}; zipping uneven seqs with strict=True (3.10).\n\n**Multiple unpackings allowed inline**: [*xs, mid, *ys] — py3.5+. Mismatched arity errors: TypeError missing/too-many arguments — surface at call time.\n\nInterview cue: demonstrate a logging decorator using both directions plus keyword-only separator (*, key).",
        code: `def report(*args, sep=" | ", **kwargs):
    return sep.join(map(str, args)), kwargs

vals, opts = report(1, 2, 3, level="debug")
print(vals, opts)

base = [1, 2]
extended = [*base, 3, *(4, 5)]
print(extended)                  # [1, 2, 3, 4, 5]

head, *tail = extended
print(head, tail)

def api(path, *, timeout=30, **headers):
    return path, timeout, headers
print(api("/users", timeout=5, auth="tok"))

d1, d2 = {"a": 1}, {"b": 2}
print({**d1, **d2})`,
        codeLanguage: "python",
        explanation: "* / ** pack extras in definitions, unpack sequences/maps in calls, and gather leftovers in assignments — the backbone of flexible APIs and decorators.",
      },
      {
        id: "pyc14",
        question: "How does zip() work? What about strict mode and unzipping?",
        answer: "**zip(*iterables)** lazily aggregates position-aligned elements into tuples, stopping at the SHORTEST input (historically) — a generator consumed once.\n\n**Key behaviors**:\n- Lazy: pairs stream on demand — safe with infinite iterators, memory-flat; wrap list(zip(...)) to materialize.\n- Truncation hazard: unequal lengths silently DROP tails — classic data-loss bug. **zip(..., strict=True) (3.10+)** raises ValueError on length mismatch; for older versions itertools.zip_longest(fillvalue=...) pads to longest.\n- One-shot: exhausted zip can't rewind — recreate per pass.\n\n**Unzip idiom**: transpose with star-unpack: names, scores = zip(*pairs) — zip(*) feeds each tuple column as separate argument. Returns tuples; convert as needed. Empty input edge: zip(*[]) raises (needs ≥1 arg) — guard.\n\n**Power patterns**:\n- Pairwise neighbors: zip(seq, seq[1:]) (or itertools.pairwise 3.10+, cleaner).\n- Parallel iteration replacing index juggling: for name, sc in zip(names, scores).\n- Dict building: dict(zip(keys, values)).\n- Matrix transpose: list(zip(*matrix)) then map list.\n\nComplexity O(min lengths); mention itertools for advanced alignment needs (batched, pairwise, starmap).",
        code: `names = ["ada", "bob", "cy"]
scores = [91, 85]
print(dict(zip(names, scores)))          # ada:91, bob:85 (cy dropped!)

try:
    list(zip(names, scores, strict=True))
except ValueError as e:
    print("strict:", e)

from itertools import zip_longest
print(list(zip_longest(names, scores, fillvalue=0)))

pairs = list(zip(names, scores))
a, b = zip(*pairs)                        # unzip/transpose
print(a, b)

seq = [10, 20, 30, 40]
print(list(zip(seq, seq[1:])))            # neighbor pairs`,
        codeLanguage: "python",
        explanation: "zip lazily aligns iterables truncating to shortest — use strict=True (3.10+) to catch mismatches and zip(*cols) to transpose/unzip.",
      },
      {
        id: "pyc15",
        question: "What is a NamedTuple and when would you choose it over a class or dict?",
        answer: "**namedtuple** (collections) generates a lightweight IMMUTABLE record type: tuple semantics (ordered, unpackable, hashable-if-fields-are) PLUS named attribute access and helpful repr.\n\nPoint = namedtuple(\"Point\", [\"x\", \"y\"]); p = Point(3, 4); p.x == p[0]. Extras: _make(iterable) factory, _asdict(), _replace(**changes) returning copy, _fields introspection, defaults via namedtuple(\"T\", \"a b\", defaults=[0]).\n\n**Typing.NamedTuple**: typed successor — class syntax, annotations surface to mypy/IDEs, identical runtime behavior. Prefer it in modern codebases.\n\n**vs plain dict**: attribute-checked fields (typo p.zd → AttributeError not silent None), far lighter memory (no per-instance dict when slots-like), hashable/enumerable semantics, self-documenting signatures. Dicts win for DYNAMIC schemas, JSON-ish blobs, mutation.\n\n**vs full class**: free __init__/__repr__/__eq__/__hash__, tuple-compat (destructuring in loops, sorting by field tuples), tiny footprint. Classes win for BEHAVIOR-heavy objects, validation, inheritance hierarchies, mutability.\n\n**Sweet spots**: coordinates, config snapshots, DB rows, CSV records, graph nodes keyed by tuples, returning structured multi-values. dataclasses(frozen=True, slots=True) overlap heavily — namedtuple when tuple-interop matters; dataclass when richer defaults/validation needed.",
        code: `from typing import NamedTuple

class Stock(NamedTuple):
    symbol: str
    price: float
    qty: int = 0

s = Stock("AAPL", 189.5)
price, *_ = s                       # unpackable
print(s.symbol, price, s)           # AAPL 189.5 Stock(symbol='AAPL', ...)
print(s._replace(qty=10))           # copy-update
print(hash(Stock("X", 1.0)) == hash(Stock("X", 1.0)))

rows = [Stock("MSFT", 330.2, 5), Stock("GOOG", 140.1, 2)]
cheap = min(rows, key=lambda r: r.price)
print(cheap.symbol)`,
        codeLanguage: "python",
        explanation: "NamedTuple = immutable, hashable, unpackable record with named fields — perfect for fixed-shape data; dicts for dynamic, classes for behavior-rich.",
      },
      {
        id: "pyc16",
        question: "How do you remove duplicates from a list, preserving order?",
        answer: "**Canonical one-liner — dict.fromkeys**: list(dict.fromkeys(items)). Dicts preserve insertion order (3.7+) and dedupe keys, so this is O(n), order-stable, and hash-fast — the modern go-to.\n\n**Classic seen-set loop** (works pre-3.7, generalizes with custom keys):\nseen=set(); out=[]\nfor x in items:\n    if x not in seen: seen.add(x); out.append(x)\nExplicit and adaptable — attach normalization inside (casefold, rounding).\n\n**Dedupe by ATTRIBUTE/key**: {obj.id: obj for obj in objs}.values() — last-wins; or seen-ids variant for first-wins. Unhashable payloads (dicts/lists): dedupe on serialized fingerprint (json.dumps(sort_keys=True)) or tupleified projection.\n\n**Non-preserving shortcuts**: list(set(items)) — fastest BUT scrambles order (and collapses 1/True!). Use when order irrelevant.\npandas drop_duplicates for tabular scale; itertools.recipe unique_everseen for streaming (memory-flat, consumes generator once).\n\n**Equality nuance**: dedup uses __eq__/__hash__; NaN poisons sets (each nan != nan yet object-identity may dedupe inconsistently) — normalize or exclude.\n\nBenchmark note: fromkeys ≈ set-loop ≫ naive `if x not out` list-scan (which is O(n²) — the anti-pattern to call out).",
        code: `items = [3, 1, 3, 2, 1, "a", "a"]
print(list(dict.fromkeys(items)))       # [3, 1, 2, 'a']

def uniq_by(items, key):
    seen, out = set(), []
    for x in items:
        k = key(x)
        if k not in seen:
            seen.add(k); out.append(x)
    return out

words = ["Hi", "hi", "HI!", "hey"]
print(uniq_by(words, str.casefold))     # ['Hi', 'HI!', 'hey']

recs = [{"id": 2, "v": "b"}, {"id": 1, "v": "a"}, {"id": 2, "v": "z"}]
first_wins = uniq_by(recs, lambda r: r["id"])
print(first_wins)`,
        codeLanguage: "python",
        explanation: "list(dict.fromkeys(xs)) dedupes order-preserved in O(n); generalize with a seen-set + key function for normalized or attribute-based uniqueness.",
      },
      {
        id: "pyc17",
        question: "What is the difference between dict.get(), setdefault(), and defaultdict?",
        answer: "Three strategies for absent keys — each fits different intents:\n\n**d.get(key, default=None)**: READ-only accessor — returns default when missing, CREATES nothing. Perfect probes/lookups with fallbacks. Cost: evaluating default arg happens EAGERLY (expensive defaults computed even on hit — pass cheap sentinel or branch).\n\n**d.setdefault(key, factory_result)**: read-and-maybe-init — inserts default if absent and RETURNS final value. Idiom: d.setdefault(tag, []).append(pid). Trap: the DEFAULT ARGUMENT IS ALWAYS CONSTRUCTED (empty list is cheap, but setdefault(k, expensive_query()) pays even when present!). Also awkward chaining.\n\n**defaultdict(factory)**: factory invoked LAZILY only on MISSING access (dd[k] or dd[k].append) — zero waste on hits. Best for sustained grouping/counting patterns. Caveats: accidental READS pollute dict with empty defaults; serialization surprises (phantom keys); factory must be zero-arg callable (functools.partial for configured ones).\n\n**Selection heuristic**: one-off optional read → get ; occasional grouped insert in plain dict → setdefault ; systematic grouping/accumulation → defaultdict. Interview bonus: show the eager-evaluation trap distinguishing setdefault vs defaultdict — subtle and decisive.",
        code: `from collections import defaultdict

conf = {"retries": 3}
print(conf.get("timeout", 30))          # 30, conf unchanged

groups = {}
groups.setdefault("odd", []).append(1)
groups.setdefault("even", []).append(2)
print(groups)

dd = defaultdict(list)
dd["odd"].append(1); dd["odd"].append(3)
print(dict(dd))

# eager-eval trap:
import time
def costly():
    time.sleep(0.1); return []
t0=time.perf_counter()
conf.setdefault("cache", costly())      # sleeps EVEN though new? yes here
t1=time.perf_counter()
conf.setdefault("retries", costly())    # sleeps again though key exists!
print(f"setdefault paid twice: {time.perf_counter()-t0:.2f}s")
dd2 = defaultdict(costly)
_ = dd2.get("miss")                      # get() bypasses factory`,
        codeLanguage: "python",
        explanation: "get() reads safely without writes; setdefault inits inline but evaluates default eagerly; defaultdict calls its factory lazily only on misses.",
      },
      {
        id: "pyc18",
        question: "How do heaps work in Python and when do you use heapq over sorting?",
        answer: "**heapq** implements a binary MIN-heap on top of a plain LIST with heap invariant: parent ≤ children (heap[k] ≤ heap[2k+1], heap[2k+2]). Index 0 is the global minimum — NOT fully sorted overall.\n\n**Core ops (all O(log n) unless noted)**:\n- heapify(lst): bottom-up construction in O(n) (better than n pushes O(n log n)).\n- heappush/heappop: insert/extract-min maintaining invariant.\n- heap[0]: peek min O(1).\n- heappushpop / heapreplace: fused push+pop faster than separate calls.\n\n**Killer applications**:\n1. **Top-K / Bottom-K streaming**: heapq.nlargest(k, it, key)/nsmallest — O(n log k) memory-flat vs full sort O(n log n) when k≪n; also manual pushpop thresholding.\n2. **Priority queues / schedulers**: tasks tuples (priority, counter, payload) — counter breaks ties avoiding payload comparison errors (non-comparable dicts!).\n3. **Merging sorted streams**: heapq.merge(*streams) lazy k-way merge.\n4. Dijkstra/A*: frontier as heap.\n\n**When plain sorted() wins**: one-shot full ordering, need slicing/arbitrary access afterwards (heap list isn't sorted!), static data. Max-heap: negate keys (push (-prio, ...)) — no max flag.\n\nStability caveat: heaps unstable; tie-break counters restore determinism.",
        code: `import heapq

nums = [9, 1, 8, 3, 7, 2]
heapq.heapify(nums)
print(nums[0])                    # 1 — min peek
print(heapq.heappop(nums), nums)  # 1 [...]

data = [5, 1, 9, 3, 7]
print(heapq.nlargest(2, data))    # [9, 7]
print(heapq.nsmallest(2, data, key=lambda x: -x))

pq = []
heapq.heappush(pq, (2, 0, "write-log"))
heapq.heappush(pq, (1, 1, "handle-req"))
while pq:
    prio, cnt, task = heapq.heappop(pq)
    print(prio, task)

merged = list(heapq.merge([1, 4], [2, 3], [0, 5]))
print(merged)                     # [0, 1, 2, 3, 4, 5]`,
        codeLanguage: "python",
        explanation: "heapq maintains a min-heap atop a list — O(log n) pushes/pops shine for streaming top-K, priority queues and k-way merges; sorted() still owns full static ordering.",
      },
    ],
  },
];
