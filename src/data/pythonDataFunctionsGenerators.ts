import type { InterviewTopic } from "@/data/pythonInterviewMetadataBase";
import type { PyQuestionMeta } from "@/data/pythonInterviewMetadataBase";

export const pythonTopicsPart3: InterviewTopic[] = [
  {
    id: "functions",
    title: "Functions & Scope",
    icon: "🎯",
    questions: [
      {
        id: "pyf1",
        question: "What are *args and **kwargs and how do they work?",
        answer: "**In function DEFINITIONS they PACK** surplus arguments:\n- def f(*args): collects extra positional arguments into a TUPLE.\n- def f(**kwargs): collects extra keyword arguments into a DICT.\nNames are conventional; the stars are the syntax.\n\n**Signature ordering rule**: positional params → *args → keyword-only params (anything after *args, or bare *) → **kwargs:\ndef api(path, limit=10, *tags, timeout=30, **meta)\nKeyword-only parameters (after the star) force callers to name them — self-documenting APIs.\n\n**In CALL SITES they UNPACK**: f(*seq) spreads iterable into positionals; f(**mapping) spreads into keywords.\n\n**Primary use cases**:\n1. **Transparent wrappers/decorators**: forward everything: wrapper(*a, **kw): inner(*a, **kw).\n2. Variable-arity utilities: max(), print(sep=..., end=...) style APIs.\n3. Argument delegation/adaptation between layers.\n4. Merging collections inline: [*a, *b], {**d1, **d2}.\n\n**Gotchas**: mutable default interplay still applies; unpacking a STRING spreads characters (f(*\"abc\") → three args); dict keys for ** must be identifier-valid strings; duplicate keyword supply raises TypeError (f(1, a=2, **{\"a\": 3})).\n\nInterview demo: write a timer decorator forwarding arbitrary signatures — instant credibility.",
        code: `def flexible(required, *pos_extra, kw_only="default", **rest):
    return required, pos_extra, kw_only, rest

print(flexible(1, 2, 3, kw_only="t", extra=True))
# (1, (2, 3), 't', {'extra': True})

def logged(fn):
    def wrapper(*args, **kwargs):
        print("calling", fn.__name__, args, kwargs)
        return fn(*args, **kwargs)
    return wrapper

@logged
def add(a, b=0):
    return a + b
print(add(2, b=5))

parts = {"b": 9}
print(add(1, **parts))`,
        codeLanguage: "python",
        explanation: "*args/**kwargs pack extras into tuple/dict at definition; the same stars unpack sequences/mappings at calls — enabling transparent wrappers and variable-arity APIs.",
      },
      {
        id: "pyf2",
        question: "Explain positional-only and keyword-only parameters (/ and * markers).",
        answer: "Python 3 formalized parameter-passing control with two markers in signatures:\n\ndef f(pos_only, /, normal, *, kw_only):\n\n**Positional-only (before /)**: callers CANNOT name these — f(1, 2) ok; f(a=1) TypeError. Why exist: future-proofing names (std libs rename internals without breaking callers), mirroring C-API functions, avoiding collisions with **kwargs keys. Examples: len(obj), pow(base, exp).\n\n**Keyword-only (after *)**: callers MUST name them — f(x, key=1) ok; f(x, 1) TypeError. Benefits: self-documenting call sites, safe addition of new options without breaking positional callers, boolean-flag readability (sort(data, reverse=True)).\n\n**Combinations**: bare * with nothing after it means \"everything following is keyword-only\"; / alone ends positional-only section. Both may coexist as shown; parameters between them accept either style.\n\n**Practical guidance**: public APIs benefit from keyword-only flags/options (readability, extensibility); low-level helpers use positional-only to keep names private contract. dataclass __init__s often expose keyword-only via field(kw_only=True) (3.10+).\n\nDemonstrating a signature using BOTH markers plus the resulting TypeErrors is the crisp interview answer.",
        code: `def split_demo(a, b, /, c, *, flag=False):
    return a + b + c, flag

print(split_demo(1, 2, 3, flag=True))     # OK

try:
    split_demo(a=1, b=2, c=3)
except TypeError as e:
    print(e)                               # positional-only

try:
    split_demo(1, 2, 3, True)
except TypeError as e:
    print(e)                               # keyword-only

def opts(*, retries=0, verbose=False):     # pure keyword-only API
    return retries, verbose
print(opts(retries=3, verbose=True))`,
        codeLanguage: "python",
        explanation: "/ locks params against keyword use (name-freedom for APIs); * forces naming after it (readable, extensible options) — both carve precise calling contracts.",
      },
      {
        id: "pyf3",
        question: "What are first-class functions? Show how functions behave like objects.",
        answer: "Functions in Python are **first-class objects**: they can be assigned to variables, stored in collections, passed as arguments, returned from other functions, and carry attributes — exactly like ints or strings.\n\n**Evidence playground**:\n- Aliasing: shout = print; shout(\"hi\").\n- Collections dispatch: ops = {\"add\": operator.add, \"sub\": operator.sub}; ops[cmd](x, y) — replaces switch statements.\n- Higher-order built-ins: map/filter/sorted(key=fn) consume functions.\n- Returning factories: make_adder(n) returns closure capturing n.\n- Introspection: fn.__name__, fn.__doc__, inspect.signature(fn).\n- Attributes: attach metadata fn.version = \"1.0\" (functools.wraps leverages this).\n\n**Consequences**:\n- Callback-driven design everywhere (GUI events, sorting keys, strategy pattern minus boilerplate classes).\n- Decorators become possible (functions accepting/returning functions).\n- Lambdas are just unnamed function objects — same type types.FunctionType.\n\nContrast with languages where functions are second-class (old Java pre-lambdas needing anonymous classes). Mention callable protocol: any object with __call__ acts like a function — classes instantiate via it, instances can be callable too.",
        code: `import operator, types

def make_multiplier(n):
    def multiply(x):
        return x * n
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)
print(double(10), triple(10))
print(type(double), isinstance(double, types.FunctionType))

ops = {"sum": operator.add, "diff": operator.sub}
print(ops["sum"](7, 2), ops["diff"](7, 2))

apply_n = lambda fn, val, times: fn(val) if times == 1 else apply_n(fn, fn(val), times - 1)
print(apply_n(double, 3, 3))       # 24`,
        codeLanguage: "python",
        explanation: "Functions are runtime objects — storable, passable, returnable, introspectable — powering callbacks, strategy maps, closures and decorators.",
      },
      {
        id: "pyf4",
        question: "What is a closure? How does variable capture work?",
        answer: "A **closure** is an inner function that REMEMBERS variables from its enclosing scope even after that scope finished executing. The captured variables live in cell objects attached to the inner function (fn.__closure__), referenced as free variables (fn.__code__.co_freevars).\n\n**Requirements**: nested function + reference to enclosing-scope variable (not just locals/globals) + enclosing function returns/exposes the nested one.\n\n**The late-binding trap** (favorite interview question): closures capture VARIABLES, not VALUES. Loop-created closures all see the FINAL value:\nfns = [lambda: i for i in range(3)]; [f() for f in fns] → [2, 2, 2]\nFix by binding NOW via default argument (evaluated at def time): lambda i=i: i — or functools.partial.\n\n**Writing to captured vars**: assignment rebinds locally unless declared nonlocal (counter factory classic). Reading needs no declaration.\n\n**Uses**: decorators (wrap target), factories/configured functions (partial alternatives), callbacks retaining context without classes, memoization tables.\n\n**vs class instances**: closures are lighter-weight private state; __closure__ inspection reveals cells. Demonstrate counter with nonlocal plus the loop trap side-by-side.",
        code: `def make_counter():
    count = 0
    def inc():
        nonlocal count
        count += 1
        return count
    return inc

c1, c2 = make_counter(), make_counter()
print(c1(), c1(), c2())            # 1 2 1 — independent state
print(c1.__code__.co_freevars)     # ['count']

# late binding trap:
fns = [lambda: i for i in range(3)]
print([f() for f in fns])          # [2, 2, 2]

bound = [lambda i=i: i for i in range(3)]
print([f() for f in bound])        # [0, 1, 2]`,
        codeLanguage: "python",
        explanation: "Closures capture enclosing VARIABLES (cells) not values — giving stateful factories; loops share the variable unless you bind early via defaults.",
      },
      {
        id: "pyf5",
        question: "How do global and nonlocal declarations differ?",
        answer: "Both REBIND names in outer scopes from within a function — targeting different levels:\n\n**global x**: binds x to the MODULE namespace. Subsequent reads/writes hit module globals regardless of intervening scopes. Creating module vars from deep inside functions is possible but usually a smell (hidden coupling, testing pain).\n\n**nonlocal x** (Python 3): binds x to the NEAREST ENCLOSING function scope that has x — enables closures to mutate their captured state (counters, accumulators, caches). SyntaxError if no enclosing binding exists (unlike global which happily creates).\n\n**Neither needed for MUTATION of outer mutables**: outer_list.append(v) works declaration-free because you mutate the OBJECT, never rebind the NAME. The declarations matter only for rebinding (=, +=, del).\n\n**Pitfalls**:\n- Shadowing surprise: assigning without declaration creates LOCAL even when outer exists — reading BEFORE that line raises UnboundLocalError.\n- global in nested functions reaches past intermediates straight to module.\n- Class bodies don't create enclosing-function scopes — nonlocal cannot see class attributes.\n\nDesign note: heavy global/nonlocal usage signals refactor pressure — parameterize instead. Legit niches: decorator bookkeeping, singletons, performance-critical counters.",
        code: `level = 0

def raise_level():
    global level
    level += 1

def accumulator():
    total = 0
    def add(n):
        nonlocal total
        total += n
        return total
    return add

raise_level(); raise_level()
print(level)                        # 2

acc = accumulator()
print(acc(10), acc(5), acc(1))     # 10 15 16

log = []
def note(msg):
    log.append(msg)                 # mutation: no declaration
note("hi"); print(log)`,
        codeLanguage: "python",
        explanation: "global rebinds module-level names; nonlocal rebinds nearest enclosing function's — both only needed for REBINDING, not mutating outer objects.",
      },
      {
        id: "pyf6",
        question: "What is the LEGB scope resolution order and its gotchas?",
        answer: "**L-E-G-B lookup chain** for any READ: Local → Enclosing → Global(module) → Builtins; first match wins, else NameError.\n\n**Gotcha gallery**:\n1. **Assignment creates local EVERYWHERE in the function** — Python decides scoping statically at compile time, so x used before assignment ANYWHERE in body makes ALL reads UnboundLocalError:\ndef f(): print(x); x = 1 → error even though module x exists.\n2. **Loop variables leak... in comprehensions they DON'T**: for-loops leave iterator var in enclosing scope post-loop; comprehension internals stay isolated (own scope).\n3. **Class scope blindness**: class-body names aren't visible to METHODS (no enclosing link) — methods need self/cls or module globals; comprehension inside class also can't see class vars directly.\n4. **Builtins shadowing**: list = [1] locally shadows builtin thereafter — subtle bugs; linters catch.\n5. **globals() vs locals()**: globals() IS the real mutable dict; locals() returns snapshot-ish mapping (fast C locals array materialized) — mutating it has NO effect on true locals.\n6. **del removes binding**, possibly exposing outer same-named var afterwards.\n\nDemo UnboundLocalError plus class-scope miss — those two trip up most candidates.",
        code: `x = "module"

def tricky():
    # print(x)        # UnboundLocalError IF uncommented with next line
    x = "local"
    return x

print(tricky(), x)

class Config:
    factor = 3
    vals = [1, 2]
    scaled = [v * factor for v in vals]   # NameError! factor invisible
    # fix: iterate over class attr explicitly via default arg trick

builtins_shadow = len                     # capture before shadowing
len = lambda s: 99
print(len("abcd"), builtins_shadow("abcd"))
del len                                   # restore binding`,
        codeLanguage: "python",
        explanation: "Reads resolve L→E→G→B statically; assignments declare locals function-wide — producing UnboundLocalError surprises, comprehension isolation, and class-scope invisibility.",
      },
      {
        id: "pyf7",
        question: "What does map/filter/reduce do and when should you prefer comprehensions?",
        answer: "**map(fn, *iterables)**: lazy iterator applying fn element-wise (multi-sequence support: map(add, xs, ys)).\n**filter(pred, iterable)**: lazy iterator keeping truthy-predicate items.\n**functools.reduce(fn, iterable, initializer)**: folds to SINGLE value via cumulative binary application (reduce(add, [1,2,3]) = 6). Not builtin anymore (moved to functools in py3 — Guido's taste signal).\n\nAll three are LAZY (except reduce consuming fully) — composable pipelines without intermediate lists.\n\n**When comprehensions win (Guido-endorsed preference)**:\n- Transform+filter reads linearly: [f(x) for x in xs if p(x)] beats map/filter nesting — no mental lambda-juggling, no str() wrapping.\n- Named transforms instead of opaque lambdas improve stack traces/tests.\n- reduce with unfamiliar fn obscures intent — dedicated builtins exist: sum, any, all, math.prod, min/max; complex folds often clearer as explicit loops.\n\n**When functional trio shines**: existing named functions map directly (map(str.upper, words) — cleaner than comp calling method); multi-stream zipping via map(fn, xs, ys); pipeline composition across heterogeneous stages; huge datasets where generator chaining avoids memory spikes.\n\nBalanced verdict interviewers like: know all forms; default pythonic comprehensions; reach for map/reduce in streaming/composition contexts.",
        code: `from functools import reduce
from operator import add, mul

nums = [1, 2, 3, 4, 5]

print(list(map(str, nums)))                       # ['1'...]
print([str(n) for n in nums])                     # equivalent

even_sq = map(lambda n: n*n, filter(lambda n: n % 2 == 0, nums))
print(list(even_sq))
print([n*n for n in nums if n % 2 == 0])          # clearer

print(reduce(mul, nums), sum(nums), math := __import__("math").prod(nums))
print(list(map(add, [1, 2], [10, 20])))           # [11, 22] multi-stream`,
        codeLanguage: "python",
        explanation: "map/filter stream lazily over elements, reduce folds to one value — but comprehensions read better for transform+filter; keep functional trio for named-fn and multi-stream cases.",
      },
      {
        id: "pyf8",
        question: "What are the rules and limits of lambda functions?",
        answer: "**lambda parameters: expression** creates an anonymous single-expression function — full object, usable anywhere functions fit.\n\n**Hard constraints**:\n- ONE expression only: no statements (assignments pre-walrus, while, try, return, annotations, docstrings).\n- No type hints on parameters (syntax disallowed).\n- Immediately-invoked style aside, unreadable ones violate PEP 8's advice: assign to a NAME only when a def would be worse (PEP 8 actually says don't assign lambdas to names — use def for tracebacks/names).\n\n**Legitimate niches** (short, obvious, throwaway):\n- sort/group keys: sorted(rows, key=lambda r: (r.age, r.name)).\n- GUI/callback registration, tiny strategies in dicts.\n- default factories: defaultdict(lambda: \"N/A\").\n- Inline currying glue: partial alternatives.\n\n**Anti-patterns to denounce**:\n- Multi-clause ternary chains inside lambda (write def!).\n- Assigning long lambdas: fn = lambda x: ... — loses __name__ (tracebacks show <lambda>), blocks docs/decorators.\n- Late-binding loop capture: lambdas in comprehensions referencing loop var see final value — fix with default-arg binding i=i or partial.\n\nAlternatives when outgrowing lambda: def (statements/hints/name), operator.itemgetter/attrgetter/methodcaller (faster, clearer key funcs), functools.partial for pre-bound args.",
        code: `rows = [("Ada", 36), ("Bob", 25), ("Cy", 36)]
by_age_name = sorted(rows, key=lambda r: (r[1], r[0]))
print(by_age_name)

from collections import defaultdict
flags = defaultdict(lambda: "unset")
print(flags["missing"])

square = lambda x: x * x           # PEP8 prefers def here
print(square(9))

funcs = [lambda: i for i in range(3)]        # late binding!
print([f() for f in funcs])
ok = [lambda i=i: i for i in range(3)]       # bound now
print([f() for f in ok])

from operator import itemgetter             # better than lambda
print(sorted(rows, key=itemgetter(1))[-1])`,
        codeLanguage: "python",
        explanation: "Lambda = anonymous one-expression function — ideal for short sort keys and factories; graduate to def/itemgetter/partial once logic, naming or typing matters.",
      },
      {
        id: "pyf9",
        question: "How do recursive functions work in Python? What about the recursion limit?",
        answer: "Recursion = function calling itself toward a BASE CASE, unwinding afterward. Each call allocates a FRAME (locals, evaluation stack) on the CALL STACK.\n\n**Recursion limit**: sys.getrecursionlimit() defaults ~1000 — guards against C-stack overflow (segfault protection). Exceeding raises RecursionError. Raise it via sys.setrecursionlimit(n) cautiously — beyond OS thread stack you crash hard, so pair with threading.stack_size or algorithm change.\n\n**Performance reality**: Python lacks tail-call optimization (Guido rejected TCO: destroys stack traces/debuggability). Deep recursion costs frames + function-call overhead; iterative rewrite usually faster and safer.\n\n**Classic conversions**:\n- factorial/fibonacci → loop or functools.lru_cache for overlapping subproblems (naive fib O(2ⁿ) → memoized O(n)).\n- Tree/graph traversal → explicit stack/queue (iterative DFS/BFS) handling depth beyond limits naturally.\n- Divide & conquer (mergesort, quicksort) fine recursively — log-depth by design.\n\n**Idiomatic recursion sweet spots**: arbitrary-nested structures (JSON walking, filesystem trees), grammars/parsers, backtracking — where depth is bounded by DATA SHAPE, and expressiveness trumps micro-speed.\n\nInterview flourish: mention RecursionError vs StackOverflow segfault distinction and generator-based traversal alternatives.",
        code: `import sys
from functools import lru_cache

sys.setrecursionlimit(3000)
print(sys.getrecursionlimit())

def fact(n):
    return 1 if n <= 1 else n * fact(n - 1)

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fact(10), fib(90))         # big int, memoized fast

def walk(node):                   # nested structure recursion
    if isinstance(node, dict):
        for v in node.values():
            yield from walk(v)
    elif isinstance(node, list):
        for v in node:
            yield from walk(v)
    else:
        yield node

print(list(walk({"a": [1, {"b": [2, 3]}]})))`,
        codeLanguage: "python",
        explanation: "Recursion consumes call frames until base case; ~1000-frame guard raises RecursionError, no TCO exists — memoize overlapping work or convert deep traversals to explicit stacks/yield-from.",
      },
      {
        id: "pyf10",
        question: "What does functools.lru_cache do and what are its pitfalls?",
        answer: "**@lru_cache(maxsize=128, typed=False)** memoizes function results keyed by ARGUMENTS: repeat calls with equal args return instantly from cache (LRU eviction bounds memory). Turns exponential naive recursions (fib, grid paths) linear; caches expensive pure queries (API responses keyed by params, parsing).\n\n**Requirements — the function MUST be pure-ish**:\n- Same args ⇒ same result (no reliance on time/random/external state).\n- Arguments HASHABLE (lists/dicts/sets as args → TypeError; normalize to tuples).\n- No meaningful SIDE EFFECTS per call (cached calls skip them!).\n\n**Pitfalls checklist**:\n1. Mutable/default-trap args poison identity semantics.\n2. Memory growth: unbounded maxsize=None leaks long-lived processes; size entries not bytes (big payloads ×128 still huge).\n3. Cache invalidation absent — stale results when underlying data changes; clear via cache_clear().\n4. Methods: self in key pins INSTANCES alive (leak!) — use staticmethod wrapping, weakref patterns, or per-instance dicts.\n5. typed=True distinguishes 3 vs 3.0 (usually unwanted).\n6. Exceptions NOT cached — failing calls retry (often desired).\n\n**Modern siblings**: @cache (3.9) = lru_cache(None) simpler; @cached_property (instance-level, no args); manual dict memoization for custom policies. Metrics: cache_info() reports hits/misses — great for demonstrating wins in interviews.",
        code: `from functools import lru_cache

calls = 0

@lru_cache(maxsize=None)
def slow_square(n):
    global calls
    calls += 1
    import time; time.sleep(0.05)
    return n * n

print(slow_square(9), slow_square(9), slow_square(8))
print(calls)                          # 2 — one cached hit
print(slow_square.cache_info())

try:
    @lru_cache
    def bad(lst): return sum(lst)
    bad([1, 2])
except TypeError as e:
    print("unhashable:", e)`,
        codeLanguage: "python",
        explanation: "lru_cache memoizes hashable-arg pure functions with bounded LRU policy — beware unhashable args, instance-leaking self keys, and staleness; cache_info proves the win.",
      },
      {
        id: "pyf11",
        question: "What is functools.partial and how does it differ from closures/lambdas?",
        answer: "**functools.partial(func, *fixed_args, **fixed_kwargs)** freezes selected arguments AHEAD of call, returning a NEW callable accepting the remainder. add = lambda a,b: a+b; inc = partial(add, 1); inc(41) → 42.\n\n**vs lambda/closure — when partial wins**:\n- Reuses EXISTING named function (no re-expression): partial(int, base=16) parses hex instantly readable.\n- Preserves __name__/__doc__ of wrapped func (partial(func).__func__); lambdas anonymize tracebacks.\n- Keyword freezing reads declaratively: render = partial(template.render, escape=True).\n- Works with any callable including classes (pre-configuring constructors: JsonParser = partial(json.JSONDecoder, strict=False)).\n\n**Mechanics details**: partial objects store func/args/keywords; calling concatenates LEFT-fixed positional args then call-time args (order fixed — can't pre-bind RIGHT-side positional without lambda; partialmethod adapts for class methods).\n\n**Typical applications**: callback registration with context (button.clicked.connect(partial(save, doc_id))), reducing argument plumbing through layers, adapter shims between mismatched interfaces, multiprocessing worker preparation (picklability advantage over some closures!).\n\n**When lambda/closure fits better**: computed/derived expressions rather than existing-callable binding; right-side binding; transformations.\n\nShow pickle contrast if pressed on advanced differences.",
        code: `import functools

power = lambda base, exp: base ** exp
square = functools.partial(power, exp=2)   # freeze kwarg
cube = functools.partial(power, exp=3)
print(square(9), cube(3))

hex_parse = functools.partial(int, base=16)
print(hex_parse("ff"))                      # 255

def notify(msg, level, channel):
    print(f"[{level}#{channel}] {msg}")
warn_slack = functools.partial(notify, channel="slack", level="WARN")
warn_slack("disk high")

print(square.func, square.keywords)         # introspection`,
        codeLanguage: "python",
        explanation: "partial pre-binds arguments of an existing callable — more descriptive and traceback-friendly than lambda for freezing inputs; args append left, kwargs merge.",
      },
      {
        id: "pyf12",
        question: "How does argument passing work — is Python call-by-value or call-by-reference?",
        answer: "Neither label fits precisely: Python uses **call-by-object-reference** (aka call-by-sharing). What gets passed is a COPY OF THE REFERENCE — the callee receives the SAME OBJECT, but rebinding the parameter name affects only the local frame.\n\n**Two observable behaviors**:\n1. **Mutation propagates**: callee changes to MUTABLE objects (list.append, dict[k]=v, obj.attr=x) are visible to caller — shared object.\n2. **Rebinding doesn't**: param = new_object rebinds the LOCAL name only; caller's variable untouched.\n\n**Immutable args appear value-like** purely because immutables CAN'T be mutated — int/str/tuple params effectively constant.\n\n**Defensive techniques when mutation risk unwanted**:\n- Copy at boundary: process(items[:]) or copy.deepcopy for nests.\n- Accept immutable/Sequence views: typing Mapping/Sequence hints discourage mutation.\n- Return NEW values (functional style): doubled = scale(xs) building fresh lists.\n- frozen dataclasses for records passed around.\n\n**Out-parameter anti-pattern**: returning tuples beats mutating args for clarity; multiple returns via unpacking.\n\nKiller demonstration: swap attempt inside function fails (rebinding) WHILE in-place sort succeeds (mutation) — one snippet proving both halves.",
        code: `def modify(lst, num):
    lst.append(100)          # visible to caller
    num = 999                # local rebinding only

nums, n = [1, 2], 5
modify(nums, n)
print(nums, n)               # [1, 2, 100] 5

def failed_swap(a, b):
    a, b = b, a              # rebinds locals only

x, y = 1, 2
failed_swap(x, y)
print(x, y)                  # 1 2 unchanged

def in_place_sort(vals):
    vals.sort()              # mutation visible
data = [3, 1, 2]
in_place_sort(data)
print(data)                  # [1, 2, 3]`,
        codeLanguage: "python",
        explanation: "References are passed by value: callees share your OBJECTS (mutations propagate) but never your NAMES (rebinding stays local) — immutables just look value-copied.",
      },
      {
        id: "pyf13",
        question: "What are keyword-only and positional-only benefits in API design?",
        answer: "(Design-focused follow-up to syntax.) Markers / and * turn calling conventions into DESIGN TOOLS:\n\n**Keyword-only (*) benefits**:\n1. **Boolean-flag clarity**: transfer(amount, immediate=True) beats mystery third positional True at review time.\n2. **Safe evolution**: adding new options never breaks existing positional callers nor shifts meanings.\n3. **Symmetry enforcement**: prevents swapped same-typed adjacent args (send(src, dst) vs send(dst, src) bug class).\n4. **Self-documenting tests/mocks**.\n\n**Positional-only (/) benefits**:\n1. **Naming freedom**: implementation may rename params without deprecations — stdlib relies on this (e.g., math.hypot internal renames).\n2. **Prevents caller dependence** on incidental parameter names.\n3. **Mirrors C extensions** faithfully; avoids collision when forwarding **kwargs containing same-named key.\n4. Enables overload-like wrappers accepting anything into *args cleanly.\n\n**Combined canonical shape**: def create(name, /, *, template=\"base\", validate=True) — identity-ish core positional, configurable tail keyword-only. Standard library exemplars: sorted(..., key=, reverse=), pow, divmod, dataclasses.field(kw_only).\n\n**Migration tactic**: turning formerly-positional params keyword-only is BREAKING — version-gate with DeprecationWarning period. Interviewers appreciate acknowledging compatibility cost.",
        code: `def send_message(body, /, *, urgent=False, tag=None):
    return f"({tag or '-'}){'!' if urgent else '.'}", body

print(send_message("deploy done", urgent=True, tag="ops"))

def legacy(a, b): return a + b

def modern(a, b, /, **opts):        # / keeps a,b name-free
    return legacy(a, b) + opts.get("bias", 0)

print(modern(1, 2, bias=10))         # 13

import inspect
print(inspect.signature(send_message))`,
        codeLanguage: "python",
        explanation: "* yields readable, extensible option surfaces; / preserves renaming freedom and dodges name collisions — together they encode deliberate calling contracts.",
      },
      {
        id: "pyf14",
        question: "What is the difference between a function attribute, docstring, and annotation?",
        answer: "Three metadata channels on function objects:\n\n**Docstring (__doc__)**: first statement string literal documenting usage for help()/IDEs; PEP 257 conventions (triple-quoted summary line). Runtime-readable documentation — nothing enforced.\n\n**Annotations**: PEP 3107 syntax attaching expressions to parameters/returns: def area(r: float, pi: float = 3.14) -> float. Stored in __annotations__ dict; **NOT type-checked at runtime** — pure metadata consumed by my/pyright, IDEs, frameworks (FastAPI/pydantic derive schemas/validation!). String-literal forward refs or from __future__ import annotations defers evaluation.\n\n**Arbitrary attributes**: fn.author = ... custom tagging (registration patterns: route handlers registering themselves; marking test traits). Persist only in-process.\n\n**Related tooling**: functools.wraps copies __dict__/__doc__/__name__/__annotations__ onto decorators' wrappers (without it, decorated APIs lose docs/signatures — common senior-level catch). inspect.signature resolves defaults/kind incl. annotations; get_type_hints evaluates stringified ones.\n\n**Hierarchy summary for interviews**: docstring = prose humans; annotations = machine-consumable contracts (types); attributes = free-form programmatic tags. None alter behavior by themselves (annotations included!) — behavior comes from consumers.",
        code: `import inspect

def parse(raw: "str | bytes", *, strict: bool = False) -> dict:
    """Parse raw payload into a mapping."""
    return {"raw": raw, "strict": strict}

print(parse.__doc__)
print(parse.__annotations__)
print(inspect.signature(parse))

parse.is_handler = True                    # attribute tagging
handlers = [f for f in (parse,) if getattr(f, "is_handler", False)]
print(handlers)

from functools import wraps
def traced(fn):
    @wraps(fn)                             # keeps meta intact
    def w(*a, **k):
        return fn(*a, **k)
    return w`,
        codeLanguage: "python",
        explanation: "__doc__ documents for humans, annotations feed type-checkers/frameworks (runtime-inert), plain attributes enable registration patterns — wraps() must copy all three through decorators.",
      },
      {
        id: "pyf15",
        question: "What is the __call__ method and why does it matter?",
        answer: "Defining **__call__(self, ...)** on a class makes INSTANCES callable: obj(...) invokes type(obj).__call__(obj, ...) — blurring functions and objects.\n\n**Why powerful**:\n1. **Stateful callables**: closures-with-benefits — counters, rate limiters, model predictors holding weights: predictor = Scorer(model); score = predictor(features).\n2. **Functor/class-based decorators**: class registering config in __init__, doing work in __call__ — supports arguments cleanly (decorator WITH parameters pattern).\n3. **Strategy objects interchangeable with functions** — duck-typed wherever callables accepted (sorted(key=CallableInstance())).\n4. Framework idioms: Django class-based views dispatch via as_view→call; ML layers forward() analogues.\n\n**callable(x)** checks presence (functions/classes/partial/instances-with-__call__).\n\n**Trade-offs vs plain functions**: heavier construction, but encapsulates config+lifecycle; pickling sometimes easier than exotic closures; debugging adds a layer.\n\n**Bonus nuance**: metaclasses make CLASSES themselves callable via type.__call__ — instantiation itself routes there (__call__ on metaclass ≠ on class). Mentioning that separation signals depth.",
        code: `class CallCounter:
    def __init__(self, fn):
        self.fn = fn
        self.count = 0
    def __call__(self, *a, **kw):
        self.count += 1
        return self.fn(*a, **kw)

@CallCounter                       # class-based decorator
def greet(name):
    return f"hi {name}"

print(greet("ada"), greet("bob"), greet.count)

class Adder:
    def __init__(self, base):
        self.base = base
    def __call__(self, x):
        return self.base + x

inc = Adder(10)
print(callable(inc), inc(5))`,
        codeLanguage: "python",
        explanation: "__call__ turns instances into first-class callables — carrying configuration/state across invocations, enabling class-based decorators and framework view objects.",
      },
      {
        id: "pyf16",
        question: "How do you write a function with optional, validated parameters cleanly?",
        answer: "Combine language features into robust signatures:\n\n**Pattern stack**:\n1. **Defaults + None sentinel** distinguishing \"not provided\" from falsy values: def query(table, columns=None, order=None): columns = columns or \"*\" (careful: [] or \"\" legitimate values need explicit `if columns is None`).\n2. **Never mutable defaults** — None sentinel creating fresh containers inside.\n3. **Keyword-only validation toggles**: def create(*, strict=True) keeping calls readable.\n4. **Runtime validation**: explicit checks raising ValueError/TypeError with ACTIONABLE messages listing received types/values; or EAFP try/int conversion catching upstream junk.\n5. **Type hints + pydantic/dataclass(frozen) for schema-grade APIs**: automatic coercion/validation, generated errors — FastAPI-style boundary validation.\n6. **Enums/Literal for closed sets**: mode: Literal[\"r\", \"w\"] beats stringly checks; Invalid enum value raises instantly.\n7. **Post-init invariants** (dataclasses __post_init__) centralizing cross-field rules.\n\n**Error-message craft**: include param name, received repr, expected constraint, and doc-pointer — logs become self-debugging.\n\n**Anti-patterns**: silent clamping (hide bugs), assert for validation (stripped under -O!), broad except around casts hiding real defects.\n\nA compact before/after refactor demonstrates maturity best.",
        code: `from dataclasses import dataclass, field
from typing import Literal

def paginate(items, page=1, per_page=None, *, max_per=100):
    if per_page is None:
        per_page = 20
    if not 1 <= per_page <= max_per:
        raise ValueError(f"per_page must be 1..{max_per}, got {per_page!r}")
    start = (page - 1) * per_page
    return items[start:start + per_page]

print(paginate(list(range(50)), page=2, per_page=30))

@dataclass(frozen=True)
class Job:
    name: str
    priority: Literal["low", "high"] = "low"
    tags: frozenset = field(default_factory=frozenset)

j = Job("etl", priority="high")
print(j)`,
        codeLanguage: "python",
        explanation: "None-sentinels + keyword-only options + explicit ValueError messages (+ Literal/pydantic at boundaries) produce APIs that fail loudly and read clearly.",
      },
      {
        id: "pyf17",
        question: "What common mistakes do candidates make with Python functions?",
        answer: "Rapid-fire catalog (interviewers probe several):\n\n**1. Mutable default arguments** persisting across calls — THE classic; fix None sentinel. Know __defaults__ proof.\n\n**2. Confusing print and return** — logging instead of yielding results breaks composability/tests.\n\n**3. Late-binding closures in loops** — lambdas capturing loop var see final value; bind via default args.\n\n**4. Ignoring return values of in-place methods** — lst.sort() returns None; x = lst.sort() destroys reference.\n\n**5. Shadowing builtins** — naming params list/dict/id/sum then calling the builtin inside.\n\n**6. except-swallowing broad handlers** inside functions masking bugs from callers.\n\n**7. Side-effectful imports/module-level work** invoked merely to import one helper (violating __main__ guard discipline).\n\n**8. Deep recursion without memoization/base-case rigor** — RecursionError in interviews; lru_cache rescue.\n\n**9. Misusing *args/**kwargs** — forwarding without wraps losing signatures; unpacking strings accidentally.\n\n**10. Assert-based input validation** — vanishes under python -O; use explicit raises.\n\n**11. Returning different TYPES conditionally** (sometimes list, sometimes None) — inconsistent contracts hurt callers; always return consistent shape (empty list, not None).\n\nDeliver two with war stories, others rapid — depth-plus-breadth impression.",
        code: `# 4 classic:
nums = [3, 1, 2]
sorted_nums = nums.sort()          # None! lost the list
fixed = sorted(nums)

# 1 classic:
def tag_all(item, tags=[]):        # shared forever
    tags.append(item); return tags
print(tag_all(1), tag_all(2))

def tag_safe(item, tags=None):
    tags = [] if tags is None else tags
    tags.append(item); return tags
print(tag_safe(1), tag_safe(2))

# 11: consistent shapes
def find_even(ns):
    evens = [n for n in ns if n % 2 == 0]
    return evens                    # [] not None`,
        codeLanguage: "python",
        explanation: "Usual suspects: mutable defaults, print-vs-return, .sort()-returns-None, late-binding loops, builtin shadowing, assert-as-validation, inconsistent return types.",
      },
    ],
  },
  {
    id: "generators",
    title: "Iterators, Generators & Comprehensions",
    icon: "🔄",
    questions: [
      {
        id: "pyg1",
        question: "What is the difference between an iterable and an iterator?",
        answer: "**Iterable**: any object implementing **__iter__()** returning an iterator (or legacy __getitem__). It's something you can LOOP over — lists, tuples, strs, dicts, sets, files, generators, range. Repeatable iteration typically yields FRESH iterators each pass (list iterates twice identically).\n\n**Iterator**: object implementing **__next__()** AND __iter__() (returning self) — a STATEFUL cursor producing the NEXT value, raising StopIteration when exhausted. One-shot: exhausted iterators stay empty forever.\n\n**Relationship**: every iterator is iterable (self-returning __iter__), not vice versa. for-loops desugar to iter(it) once + repeated next() catching StopIteration.\n\n**Practical consequences**:\n- Consuming a generator/zip/map/file TWICE silently yields nothing second time — classic bug; wrap in list/tuple to reuse.\n- Functions receiving \"iterables\" should avoid len()/indexing (generators lack them) — duck-type via iter() protocol.\n- iter(obj) vs next(obj, sentinel) direct manipulation powers custom consumption loops (chunked readers).\n\nQuick litmus test for interviews: iter(lst) is iter(lst) False (fresh iterators), iter(gen) is gen True (iterator already).",
        code: `lst = [1, 2]
gen = (x for x in [1, 2])

it = iter(lst)
print(next(it), next(it))
try:
    next(it)
except StopIteration:
    print("exhausted")

print(iter(lst) is iter(lst))   # False — new iterators
print(iter(gen) is gen)         # True — already iterator

def consume_twice(src):
    print(sum(src), sum(src))   # second pass empty!
consume_twice(gen2 := (i for i in [1, 2, 3]))

fixed = [1, 2, 3]
print(sum(fixed), sum(fixed))   # container re-iterates`,
        codeLanguage: "python",
        explanation: "Iterable = has __iter__ (loopable, reusable); Iterator = has __next__ cursor + StopIteration (one-shot). for = iter() + next() loop.",
      },
      {
        id: "pyg2",
        question: "What is a generator function and what does yield do?",
        answer: "A **generator function** contains yield — calling it executes NOTHING immediately, returning a **generator object** (lazy iterator). Each next() runs code UNTIL the next yield, pausing there: local state (variables, instruction pointer) FREEZES in the frame and resumes on subsequent next(). StopIteration signals completion (bare return or falling off end).\n\n**Why transformative**:\n1. **Lazy/streaming**: produces items on demand — process 10GB logs in constant memory.\n2. **Composable pipelines**: gen chains (read → parse → filter → aggregate) fuse into single pass without intermediate lists.\n3. **Infinite sequences**: naturals counter, sensor feeds — impossible with concrete lists.\n4. **Cooperative control flow**: yield suspends/resumes — foundation of coroutines/asyncio (yield from delegation historically).\n\n**Generator extras**: .close() forcing GeneratorExit, .throw() injecting exceptions, return VALUE lands in StopIteration.value (consumed by yield from expression result). Generators auto-implement iterator protocol; their __iter__ returns self.\n\n**Gotchas**: single-consumption (reuse → empty), no len/indexing, exceptions surface at CONSUMPTION time not creation (defining broken gen runs clean until iterated!).\n\nDemo fibonacci generator + pipeline — staple answer.",
        code: `def fibonacci():
    a, b = 0, 1
    while True:                  # infinite — safe lazily
        yield a
        a, b = b, a + b

fib = fibonacci()
print([next(fib) for _ in range(8)])

def evens(nums):
    for n in nums:
        if n % 2 == 0:
            yield n * 10

pipeline = evens(range(10))
print(list(pipeline))
print(list(pipeline))            # [] — consumed!

def countdown(n):
    yield from range(n, 0, -1)
    return "lift-off"
cd = countdown(3)
print(next(cd), next(cd), next(cd))
try:
    next(cd)
except StopIteration as e:
    print("value:", e.value)`,
        codeLanguage: "python",
        explanation: "yield pauses the frame resuming on next() — generators give lazy, memory-flat, infinite-capable pipelines that run only while consumed.",
      },
      {
        id: "pyg3",
        question: "Generator expression vs list comprehension — when does each win?",
        answer: "Syntax twin differing in brackets: **[expr for x in xs]** builds ENTIRE list eagerly; **(expr for x in xs)** returns lazy generator computing per-next().\n\n**Choose generator expression when**:\n- Feeding single consumer: sum(x*x for x in big), any(), max() — zero intermediate allocation, O(1) memory.\n- Streaming pipelines chained: lines = (l.strip() for l in f); errors = (l for l in lines if \"ERR\" in l).\n- Infinite/unbounded sources.\n- Data consumed ONCE.\n\n**Choose list comprehension when**:\n- Need len/indexing/repeated passes/slicing — generators offer none.\n- Results reused multiple times (regenerating costs recomputation).\n- Must persist AFTER source closes (file handles!) — lazy gen reading closed file explodes later.\n- Materializing small-to-medium collections where clarity > micro-memory.\n\n**Subtleties**:\n- Genexp captures enclosing vars LIVE (late-binding like closures) vs listcomp evaluating immediately.\n- Genexp as sole argument drops extra parens: sum(x for x in xs).\n- Empty genexp truthiness: bool((x for x in [])) is TRUE (object exists!) — check via list() or next(sentinel); frequent bug.\n\nRule: lazy by default in pipelines; solidify to list when iterating twice.",
        code: `import sys

big = range(10_000_000)
total = sum(n * n for n in big)          # O(1) memory
lc_mem = sys.getsizeof([n for n in range(1000)])
ge_mem = sys.getsizeof(n for n in range(1000))
print(lc_mem, "vs", ge_mem)              # ~8KB vs ~200B

lines = (l.strip() for l in [" a ", "ERR b ", " c "])
errs = [l for l in lines if "ERR" in l]
print(errs)

ge = (x for x in [])
print(bool(ge))                          # True — trap!
print(not list(ge))                      # proper emptiness check`,
        codeLanguage: "python",
        explanation: "() streams one item at a time (O(1) mem, single-use); [] materializes (random access, reusable) — go lazy for pipelines/aggregates, eager when re-accessing.",
      },
      {
        id: "pyg4",
        question: "What does yield from do?",
        answer: "**yield from iterable** (PEP 380, py3.3) DELEGATES a generator's operation to a sub-generator/iterable — transparently forwarding produced values AND establishing bidirectional channels for next()/send()/throw()/close().\n\n**Equivalent-to** (conceptually): for v in sub: yield v — PLUS crucial extras the loop misses: sub's return value becomes yield-from EXPRESSION's value; sent values/thrown exceptions route INTO sub; GeneratorExit propagation.\n\n**Uses**:\n1. **Flattening/recursion**: tree walks yield from child for arbitrary depth (cleaner than nested loops).\n2. **Composition/refactoring**: split mega-generators into named stages chaining yield from stage_a(); stage_b().\n3. **Pipeline plumbing** pre-async: coroutine delegation era birthed asyncio syntax (async/await generalized it).\n\nresult = yield from sub_gen captures sub's return — enabling value-returning components inside streams.\n\n**Modern context**: for plain flattening, itertools.chain/from_iterable cover simple cases; recursion still needs yield from. In async code, await replaced yield from — but understanding it explains await's semantics deeply (await ≈ suspend-and-delegate lineage).\n\nDemo recursive JSON leaf-walker + composed pipeline showing return-value capture.",
        code: `def leaves(node):
    if isinstance(node, dict):
        for v in node.values():
            yield from leaves(v)
    elif isinstance(node, list):
        for v in node:
            yield from leaves(v)
    else:
        yield node

tree = {"a": 1, "b": [2, {"c": 3, "d": [4, 5]}]}
print(list(leaves(tree)))

def inner():
    yield 1
    yield 2
    return "inner-done"

def outer():
    result = yield from inner()
    yield f"(got: {result})"

print(list(outer()))`,
        codeLanguage: "python",
        explanation: "yield from delegates to a sub-generator — forwarding values, send/throw channels and its return value, enabling recursive walks and staged composition.",
      },
      {
        id: "pyg5",
        question: "How do generator methods close(), send(), and throw() work?",
        answer: "Generators are COROUTINE-lite bidirectional channels:\n\n**send(value)**: resumes execution making the PAUSED yield EXPRESSION evaluate to value: received = yield item — pushes data INTO generator (must primed via next()/send(None) first, else TypeError).\n\n**throw(exc)**: raises exc AT the paused yield point — generator may handle (except around yield, continue producing), transform, or let propagate ending itself. Injects failures/cancellation mid-stream.\n\n**close()**: raises GeneratorExit at pause point — graceful shutdown; generator should cleanup (finally blocks run!) WITHOUT yielding again (RuntimeError if it does). Context-manager resources inside generators release properly thanks to this.\n\n**Applications**: consumer-producer pipelines (running averages, parsers fed chunks), cancellation protocols (asyncio heritage), resource-safe streamed processing.\n\n**Modern relevance**: async/await machinery descends directly from these semantics (await ≈ yield-based suspension formalized); bare generators-as-coroutines discouraged for concurrency today — use async def — but send/close remain vital for advanced iterator control.\n\nDemo: running-average receiver via send + finally-on-close cleanup — concise showcase.",
        code: `def averager():
    total = count = 0.0
    avg = None
    try:
        while True:
            value = yield avg
            total += value
            count += 1
            avg = total / count
    finally:
        print("cleanup on close")

avg = averager()
next(avg)                      # prime
print(avg.send(10), avg.send(5), avg.send(7.5))
avg.close()

def resilient():
    while True:
        try:
            x = yield "ready"
        except ValueError:
            print("recovered"); continue

r = resilient(); next(r)
print(r.throw(ValueError("boom")), r.send(None))`,
        codeLanguage: "python",
        explanation: "send injects values into the paused yield expression, throw raises at it (recoverable), close triggers GeneratorExit for finally-based cleanup.",
      },
      {
        id: "pyg6",
        question: "What are the most useful itertools tools?",
        answer: "itertools = battle-tested C-speed iterator algebra — name-drop these by category:\n\n**Infinite**: count(start, step) enumerators/counters; cycle(seq) round-robin (pair with islice!); repeat(obj, times?) constant seeding (repeat(None, n) placeholders).\n\n**Terminating**: accumulate(iter, func) running totals/scans (running_max via max); chain(*its)/chain.from_iterable(nested) concatenate lazily; compress(data, selectors) mask-filter; dropwhile/takewhile predicate-window slicing; islice(iter, stop/steps) lazy slicing (only way to slice generators!); starmap(fn, arg_tuples) unpacking map; zip_longest padding zip.\n\n**Combinatoric**: product (nested loops/cartesian), permutations, combinations(+with_replacement) — interview staples for brute-force problems.\n\n**Grouping**: groupby(iter, key) consecutive grouping — MUST sort by same key first (classic misuse!); recipes build unique_everseen, pairwise.\n\n**Patterns worth reciting**: batched via islice window loop; flatten = chain.from_iterable(matrix); sliding windows = tee/pairwise combos; round-robin recipe.\n\nFraming tip: emphasize LAZINESS + composability (constant-memory pipelines) and C implementation speed versus hand loops.",
        code: `from itertools import (count, cycle, islice, accumulate, groupby,
                       product, permutations, chain, zip_longest, pairwise)

print(list(islice(count(10, 5), 3)))            # [10,15,20]
print(list(islice(cycle("AB"), 5)))             # ABABA
print(list(accumulate([1, 2, 3], lambda a, b: a * b)))
print(dict(groupby("AAABBC")))                  # consecutive groups
print(list(product([0, 1], repeat=2)))
print(list(permutations("abc", 2)))
print(list(chain([1], (2, 3), "45")))
print(list(zip_longest([1, 2], "xyz", fillvalue="_")))
print(list(pairwise([1, 2, 3])))                # neighbors`,
        codeLanguage: "python",
        explanation: "itertools supplies lazy C-speed primitives — count/cycle/islice for streams, groupby (sort first!), product/permutations for search spaces, chain/zip_longest for merging.",
      },
      {
        id: "pyg7",
        question: "How do enumerate and zip replace index-based looping?",
        answer: "Range-index looping (`for i in range(len(xs))`) is a code smell — enumerate/zip express INTENT directly:\n\n**enumerate(iterable, start=0)** yields (index, item) pairs lazily:\nfor idx, row in enumerate(rows, start=1): ...\nZero-copy counter; start=1 humanizes displays/logs. Beats manual counter increments and range(len()) lookups (xs[i] double access cost + off-by-one risks).\n\n**zip(a, b, ...)** walks parallel sequences positionally:\nfor name, score in zip(names, scores): ...\nEliminates index juggling for parallel arrays. Remember shortest-truncation semantics; strict=True (3.10+) asserts equal lengths — cheap invariant guard for data integrity.\n\n**Combos**: enumerate(zip(a, b)) gives (i, (x, y)); dict(zip(keys, values)) builds mappings; matrix transpose via zip(*m).\n\n**When indices ARE appropriate**: mutating IN PLACE (need positions), stride/subsequence windows (range steps), comparing element-vs-neighbors (or zip(seq, seq[1:])/pairwise).\n\nInterview framing: readability + fewer bugs + laziness parity — enumerate/zip are iterators themselves, composable into the streaming ecosystem.",
        code: `names = ["ada", "bob", "cy"]
scores = [91, 85, 77]

for rank, (n, s) in enumerate(zip(names, scores), start=1):
    print(rank, n, s)

report = {n: s for n, s in zip(names, scores)}
print(report)

grid = [[1, 2], [3, 4]]
transposed = list(zip(*grid))
print(transposed)

for cur, nxt in zip(scores, scores[1:]):
    print(cur, "->", nxt, end="  ")`,
        codeLanguage: "python",
        explanation: "enumerate supplies paired indices lazily (start= for humans), zip aligns parallel sequences (strict= guards lengths) — replacing fragile range(len()) loops.",
      },
      {
        id: "pyg8",
        question: "Why can't you iterate a generator twice? How do you handle it?",
        answer: "Generators ARE their own iterators (iter(g) is g) with a single exhausted cursor — after StopIteration, subsequent iterations yield NOTHING silently (no error!). Containers (list/tuple/dict/str/range) instead mint FRESH iterators per __iter__ call — hence reusable.\n\n**Failure mode demo**: report = (calc(r) for r in rows); print(sum(report)); print(list(report)) → second output []. Silent emptiness makes this insidious in refactors (helper switched from list-comp to genexp downstream suddenly \"loses\" data).\n\n**Strategies**:\n1. **Materialize once**: data = list(genexp) when dataset comfortably fits RAM — pay memory, gain reuse.\n2. **Recreate per pass**: wrap generation in a FUNCTION/lambda returning fresh generator per call: rows_source() invoked anew.\n3. **itertools.tee(orig, n)**: splits one iterator into n independent ones — CAVEAT buffers divergence (memory grows with lag between branches); often slower than re-listing; document before deploying.\n4. Redesign pipeline to single-pass aggregation when volumes large (combine stats in one sweep).\n\n**Detection tips**: functions SHOULD document whether they consume iterators; defensively list() unknown inputs at API boundaries when multi-pass needed internally.",
        code: `from itertools import tee

src = [1, 2, 3]
g = (x * 10 for x in src)
print(sum(g), list(g))            # 60 [] — drained!

def fresh():                       # recreate-per-pass
    return (x * 10 for x in src)
print(sum(fresh()), list(fresh()))

material = list(fresh())
print(sum(material), sum(material))  # reusable now

a, b = tee([1, 2, 3])
print(list(a), list(b))              # independent branches`,
        codeLanguage: "python",
        explanation: "Generators carry one exhaustible cursor — second passes silently yield empty; fix by materializing to list, regenerating via factory functions, or tee (mind buffering).",
      },
      {
        id: "pyg9",
        question: "What is lazy evaluation's role in Python beyond generators?",
        answer: "Generators are the headline act, but laziness pervades Python:\n\n**Lazy constructs inventory**:\n- range/memoryview/builtins map/filter/reversed/enumerate/zip — all iterators/views computing on demand.\n- Dict/set/list VIEWS (keys()) reflect live state.\n- Short-circuit and/or defer right operands; conditional expressions evaluate one branch.\n- Properties/__getattr__ compute attributes on ACCESS (ORM lazy-loading relations!).\n- functools.lazy-ish patterns: cached_property computes once on first touch; module-level import-inside-function defers heavyweight deps.\n- Default dict factories (defaultdict) construct only on miss.\n- Mock.patch deferring behavior; SQLAlchemy Query objects compose SQL without executing (query.filter(...).filter(...).first()).\n\n**Benefits**: constant-memory pipelines, skip-never-computed work (filters short-circuit), infinite structures, cheaper object construction, responsive UIs (compute on demand).\n\n**Costs/trade-offs**: deferred ERRORS (bad genexp defined fine, explodes mid-consume — harder traces), double-evaluation hazards if source re-queried, debugging opacity (nothing happens until consumed!), side-effect timing surprises.\n\nInterview synthesis: identify laziness BOUNDARY deliberately — keep hot paths eager/simple, push laziness to edges (IO, bulk transforms) where it pays rent.",
        code: `class LazyConfig:
    def __init__(self): self._db = None
    @property
    def db(self):                       # computed on first access
        if self._db is None:
            print("connecting...")
            self._db = {"conn": 1}
        return self._db

cfg = LazyConfig()
print("created without connecting")
print(cfg.db["conn"])                    # connects NOW
print(cfg.db["conn"])                    # cached

sq = map(lambda x: x*x, [1, 2, 3])
print("mapped, nothing ran yet")
print(list(sq))                          # executes here`,
        codeLanguage: "python",
        explanation: "Laziness spans iterators, views, properties, short-circuits and ORM queries — deferring computation saves work/memory but moves errors and effects to consumption time.",
      },
      {
        id: "pyg10",
        question: "How do you implement a custom iterator class vs a generator?",
        answer: "**Protocol class approach**: define __iter__ returning self and __next__ advancing state/raising StopIteration. Full control, explicit state fields, reusable object semantics, type-hintable (Iterator[T]), supports extra methods beyond protocol.\n\n**Generator approach**: single function with yield auto-supplies protocol — less boilerplate, implicit state in locals. Prefer by default for simple sequences.\n\n**Choose CLASS iterator when**:\n- Multiple simultaneous independent cursors over ONE object (custom container: tree with breadth-first AND depth-first iterators — separate iterator classes or iter-view methods).\n- State machine complexity clearer as attributes/methods.\n- Need reset()/peek()/skip() extended API.\n- Interop requiring isinstance checks against registered ABCs / richer interface.\n\n**Container vs iterator separation** (crucial design point): Container defines __iter__ RETURNING a fresh iterator each call (often delegating to generator internally!); Iterator is the disposable cursor. Best practice hybrid: container.__iter__ = generator function — clean + reusable + minimal code.\n\nDemo: Playlist container whose __iter__ yields via generator, plus explicit ShuffleIterator class showing the classful alternative.",
        code: `class Countdown:                    # container → fresh iterators
    def __init__(self, n): self.n = n
    def __iter__(self):
        i = self.n                  # generator-based __iter__
        while i > 0:
            yield i
            i -= 1

cd = Countdown(3)
print(list(cd), list(cd))           # reusable!

class StepIterator:                 # explicit iterator class
    def __init__(self, start, stop, step):
        self.cur, self.stop, self.step = start, stop, step
    def __iter__(self): return self
    def __next__(self):
        if self.cur >= self.stop:
            raise StopIteration
        val = self.cur
        self.cur += self.step
        return val

print(list(StepIterator(0, 10, 3)))`,
        codeLanguage: "python",
        explanation: "Custom iterators implement __iter__/__next__ explicitly (state-rich, multi-cursor capable); generators give the protocol free — containers should return fresh iterators (generator-backed __iter__ is idiomatic).",
      },
      {
        id: "pyg11",
        question: "What is the difference between yield and return?",
        answer: "**return**: terminates function, hands back ONE final value, discards frame. Calling again starts FRESH execution.\n\n**yield**: SUSPENDS function mid-execution emitting a value; frame + locals PRESERVED; next resumption continues AFTER the yield. Presence of yield anywhere (even unreachable!) makes the call a GENERATOR FACTORY — body runs on iteration, not invocation.\n\n**Comparison table points**:\n- Call semantics: normal function executes immediately; generator function returns generator object instantly.\n- Values: return singular finale; yield streams MANY values over time.\n- State: return forgets everything; yield remembers (enabling incremental algorithms, infinite streams).\n- Completion: falling off end / bare return → StopIteration; `return X` in generator delivers X via StopIteration.value (visible to yield from caller) — NOT emitted as yielded item!\n\n**Hybrid uses**: early-return guards inside generators (validate then stream) totally legal; return in try/finally ensures cleanup.\n\n**Common misconception to correct**: \"return inside generator returns value to for-loop\" — false; for-loops IGNORE StopIteration.value; only yield from/manual next-catch see it. Async coroutines: return value surfaces from awaiting — analogous mechanics.\n\nDemo contrasting both + the StopIteration.value capture.",
        code: `def normal_max(xs):
    if not xs:
        return None              # exits entirely
    return max(xs)

def running_max(xs):
    best = None
    for x in xs:
        best = x if best is None or x > best else best
        yield best               # streams progress
    return best                  # hidden in StopIteration.value

print(normal_max([3, 9, 2]))
print(list(running_max([3, 9, 2])))

g = running_max([5, 1, 8])
next(g); next(g); next(g)
try:
    next(g)
except StopIteration as e:
    print("final:", e.value)     # 8 — return payload`,
        codeLanguage: "python",
        explanation: "return ends with one value (in generators smuggled via StopIteration.value, seen only by yield from); yield pauses-and-streams many values preserving state.",
      },
      {
        id: "pyg12",
        question: "How do you build memory-efficient data pipelines with generators?",
        answer: "**Architecture**: chain single-purpose generators — each consumes upstream lazily, yields downstream incrementally. Total memory ≈ ONE item (per stage), regardless of dataset size; CPU pipelined item-at-a-time.\n\n**Reference pipeline skeleton**:\nlines = read(path) → parsed = (json.loads(l) for l in lines) → valid = (r for r in parsed if r.ok) → enriched = (transform(r) for r in valid) → aggregate loop consumes terminal stage.\n\n**Key disciplines**:\n1. Never materialize mid-pipeline (list() breaks the promise — reserve for sinks/small checkpoints).\n2. Push filtering EARLIEST possible — cheapest reduction first shrinks downstream work.\n3. File handles via with/context managers INSIDE generators; cleanup on close/exception (finally).\n4. Batch where syscall-dominated: chunked reads (islice windows) amortize IO while bounding memory.\n5. Error strategy: per-item try/except with poison-message logging (don't kill whole stream), or fail-fast flag — decide explicitly.\n6. Backpressure awareness: pull-based generators inherently throttle to consumer speed (contrast queues).\n\n**Tooling**: heapq.merge merges sorted streams; multiprocessing/executor pools insert PARALLEL stages (imap_unordered) preserving streaming; profiling via tracemalloc validates flatness.\n\nDemo compact ETL: read → parse → filter → aggregate with constant memory claim.",
        code: `import json

def read_lines(path):
    with open(path, encoding="utf-8") as f:
        yield from f

def parse(lines):
    for line in lines:
        try:
            yield json.loads(line)
        except json.JSONDecodeError:
            continue                # skip poison lines

records = parse(read_lines("events.jsonl"))
valid = (r for r in records if r.get("amount", 0) > 0)
total = sum(r["amount"] for r in valid)   # single pass, O(1) RAM

with open("events.jsonl", "w") as f:
    f.write('{"amount": 10}\\n{"amount": -5}\\nbroken\\n{"amount": 32}\\n')
records = parse(read_lines("events.jsonl"))
valid = (r for r in records if r.get("amount", 0) > 0)
print(sum(r["amount"] for r in valid))    # 42`,
        codeLanguage: "python",
        explanation: "Compose filter/transform generators so each item flows end-to-end independently — constant memory, earliest filtering, guarded IO, pull-based throttling.",
      },
    ],
  },
];
