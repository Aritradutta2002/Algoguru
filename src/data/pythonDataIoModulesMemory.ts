import type { InterviewTopic } from "@/data/pythonInterviewMetadataBase";
import type { PyQuestionMeta } from "@/data/pythonInterviewMetadataBase";

export const pythonTopicsPart5: InterviewTopic[] = [
  {
    id: "file-io",
    title: "File I/O & Context Managers",
    icon: "📁",
    questions: [
      {
        id: "pyi1",
        question: "What are the different file opening modes in Python?",
        answer: "open(path, mode, encoding=...) mode string combines THREE axes:\n\n**Access**: r read (default; error if missing) | w write (TRUNCATES existing! creates new) | a append (creates if missing, always writes at end) | x exclusive creation (FileExistsError if present — safe artifact writing).\n\n**Content type**: default TEXT mode (str in/out, newline translation, encoding applied) vs **b** BINARY (bytes in/out, no encoding/newline translation) — rb/wb/ab for images, pickles, network payloads.\n\n**Combination flags**: + extends r/w/a to READ-WRITE (r+ no truncate, position at start; w+ truncates then allows reads; a+ appends-only writes though reads allowed).\n\n**Critical gotchas**:\n- w destroys immediately on open — appending intent with w is a classic data-loss bug (use a).\n- Text mode REQUIRES encoding param for portability (default locale cp1252/utf-8 divergence across OSes); ALWAYS pass encoding='utf-8' explicitly.\n- Binary modes forbid encoding arg.\n- newline='' controls translation (csv module demands it!).\n\nMode table recall under pressure wins points; emphasize the truncate-on-w and encoding-default traps as battle scars.",
        code: `with open("demo.txt", "w", encoding="utf-8") as f:
    f.write("line1\\nline2\\n")

with open("demo.txt", "a", encoding="utf-8") as f:
    f.write("appended\\n")

try:
    open("demo.txt", "x")
except FileExistsError as e:
    print("exclusive:", e)

with open("logo.bin", "wb") as f:
    f.write(bytes([0x89, 0x50]))
with open("logo.bin", "rb") as f:
    print(f.read())`,
        codeLanguage: "python",
        explanation: "Modes stack access (r/w/a/x), type (b), and + for read-write — remember w truncates instantly, x refuses overwrites, and text mode needs explicit encoding.",
      },
      {
        id: "pyi2",
        question: "Why is the with statement essential for file handling?",
        answer: "**with** invokes the CONTEXT MANAGER protocol guaranteeing cleanup: __enter__ acquires (returns handle), body executes, __exit__ runs UNCONDITIONALLY afterward — normal completion OR exception — releasing the resource deterministically.\n\n**Without with**, you must manually try/finally close(): verbose and leak-prone — forgotten close on early return/exception holds descriptors (fd exhaustion → 'Too many open files' production incidents), delays flushing (lost buffered writes on crash).\n\n**Mechanics**: CPython refcounting often closes dropped files promptly, but DON'T rely on it — PyPy/other GCs delay arbitrarily; explicit with is correctness not style.\n\n**Multiple resources**: comma-stacked: with open(a) as fa, open(b) as fb: ... (3.1+); parenthesized multi-line form 3.10+.\n\n**Custom context managers**: class with __enter__/__exit__ (exit receives exc info; return truthy only to SUPPRESS exceptions) or @contextlib.contextmanager generator (pre-yield=enter, post-yield=exit wrapped in try/finally).\n\nAlso mention closing flushes buffers — data integrity angle — and that many objects beyond files participate (locks, sockets, sessions, temp dirs, DB connections).",
        code: `from contextlib import contextmanager

# guaranteed close even on exception
try:
    with open("data.txt", "w") as f:
        f.write("important")
        raise RuntimeError("crash mid-write")
except RuntimeError:
    pass                                # f already closed!

@contextmanager
def timer(label):
    import time; t0 = time.perf_counter()
    try:
        yield
    finally:
        print(label, round(time.perf_counter() - t0, 4))

with timer("block"):
    sum(range(100_000))

with open("a.txt", "w") as fa, open("b.txt", "w") as fb:
    fa.write("A"); fb.write("B")`,
        codeLanguage: "python",
        explanation: "with guarantees __exit__/finally-style release on every path — preventing descriptor leaks and lost buffered writes; build your own via __enter__/__exit__ or @contextmanager.",
      },
      {
        id: "pyi3",
        question: "What are the ways to read a file, and when does each fit?",
        answer: "**read()**: entire content as ONE str/bytes — fine for config/small files; dangerous on multi-GB inputs (RAM spike).\n\n**read(size)** / **readline()**: manual chunked/line stepping — control-oriented loops until empty sentinel.\n\n**Iterate directly**: `for line in f:` — lazy line streaming, constant memory, THE default for large text. Combine with enumerate(f, 1) for numbering; strip trailing \\n via rstrip('\\n') (not strip() which eats meaningful whitespace).\n\n**readlines()**: list of ALL lines — convenience for small files wanting indexed access; memory-equivalent to read().splitlines(keepends=True).\n\n**Binary variants**: read(n) chunks power hashing/streaming protocols (hashlib updates chunk-by-chunk).\n\n**Random access**: seek(offset, whence)/tell() reposition (0=start,1=current,2=end); essential for fixed-record formats, tail-follow implementations; text-mode seeks restricted to tell()-returned cookies (opaque due to encoding) — binary mode for arithmetic seeking.\n\n**Performance notes**: iterating beats readline loops; buffering param tunes throughput; csv.reader/json.load wrap handles rather than pre-reading strings when possible.",
        code: `with open("big.log", "w") as f:
    f.writelines(f"entry {i}\\n" for i in range(5))

with open("big.log") as f:
    for n, line in enumerate(f, 1):       # streaming
        if n <= 2:
            print(n, line.rstrip())

with open("big.log") as f:
    head = [next(f) for _ in range(2)]     # first-k pattern
    pos = f.tell()
    f.seek(0)
    print(len(f.readlines()), "total lines")

with open("logo.bin", "rb") as f:
    import hashlib
    h = hashlib.sha256()
    while chunk := f.read(65536):
        h.update(chunk)
    print(h.hexdigest()[:16])`,
        codeLanguage: "python",
        explanation: "Iterate handles lazily for scale, read() small files wholesale, read(size) for binary chunking, and seek/tell for random access (binary mode for arithmetic offsets).",
      },
      {
        id: "pyi4",
        question: "Compare pickle and json for serialization.",
        answer: "**json**: human-readable TEXT, language-agnostic standard. Types limited: dict/list/str/int/float/bool/None (tuples→lists; keys must be str/int-coercible). Safe-ish (no code execution); json.dump(s) write, load(s) read; custom types via default=/object_hook. Interop format of APIs/configs.\n\n**pickle**: BINARY Python-specific protocol serializing ARBITRARY object graphs — custom classes, nested references, cycles, functions-by-reference (module-qualified names). pickle.dump/load (+ higher protocol params). Faithful round-trip including object identity sharing within a graph.\n\n**THE security chasm interviewers demand**: unpickling EXECUTES arbitrary code — never unpickle untrusted data (craftable payloads = RCE). JSON parsing cannot execute anything. Rule: cross-trust-boundary ⇒ json (or signed/validated formats); trusted intra-app caching/checkpoints ⇒ pickle acceptable.\n\n**Practical trade-offs**: pickle preserves tuples/dates/custom classes without converters; json debuggable/diffable/cross-service. Versioning: pickle breaks when class layouts shift (classes stored by reference path); json schema evolution more manageable. Alternatives bridging both: msgpack/protobuf/orjson (fast json) / parquet (tabular).\n\nDemo custom-class round trip failing in json but succeeding in pickle — visceral contrast.",
        code: `import json, pickle
from datetime import datetime

class Event:
    def __init__(self, kind, at):
        self.kind, self.at = kind, at

e = Event("login", datetime.now())

try:
    json.dumps(e)
except TypeError as ex:
    print("json:", ex)

blob = pickle.dumps(e)
restored = pickle.loads(blob)
print(type(restored).__name__, restored.at.isoformat()[:19])

j = json.dumps({"kind": e.kind, "at": e.at.isoformat()})
print(json.loads(j))`,
        codeLanguage: "python",
        explanation: "JSON: safe, portable, primitive-typed text for boundaries; pickle: powerful Python-object binaries for trusted contexts — unpickling untrusted bytes is remote-code-execution risk.",
      },
      {
        id: "pyi5",
        question: "os.path vs pathlib — how do modern path operations differ?",
        answer: "**pathlib.Path** (3.4+, matured since) models paths as OBJECTS with methods/operators replacing scattered os.path functions:\n\n| Task | os.path | pathlib |\n|---|---|---|\n| Join | os.path.join(a, b) | a / b |\n| Name/ext | basename/splitext | p.name, p.stem, p.suffix |\n| Exists | os.path.exists(p) | p.exists() |\n| Read/write | open dance | p.read_text(encoding=...), p.write_text(), read_bytes/write_bytes |\n| List dir | os.listdir | p.iterdir(), p.glob('*.py'), rglob recursive |\n| mkdir | os.makedirs(..., exist_ok=True) | p.mkdir(parents=True, exist_ok=True) one-liner |\n| Home/cwd | expanduser/getcwd | Path.home(), Path.cwd() |\n| Rename/remove | os.rename/remove | p.replace(t), p.unlink(missing_ok=True) (3.8+) |\n\n**Path benefits**: fluent chaining (Path('log')/'2024'/f'{day}.txt'), pure-vs-concrete distinction (PurePath manipulable without FS), iterdir/glob generators, .resolve() symlink-real paths, cross-platform semantics handled internally.\n\n**When os/os.path still needed**: low-level fds/stat flags (os.stat st_), environment/process ops, some libs expecting strings (pass str(p) easily).\n\nModern verdict: pathlib default for filesystem work; demonstrate glob + read_text one-liner elegance versus os.path ceremony.",
        code: `from pathlib import Path

base = Path("project") / "src"
(base / "pkg").mkdir(parents=True, exist_ok=True)
(base / "pkg" / "__init__.py").write_text("__version__ = '1.0'\\n")

print([p.name for p in base.rglob("*.py")])
mod = base / "pkg" / "__init__.py"
print(mod.read_text().strip())
print(mod.stem, mod.suffix, mod.exists())

for p in Path(".").glob("**/__init__.py"):
    print(p.resolve())`,
        codeLanguage: "python",
        explanation: "pathlib turns path juggling into operator/method chains with built-in IO helpers — prefer it over os.path unless you need raw stat/fd-level control.",
      },
      {
        id: "pyi6",
        question: "How do seek() and tell() work? Give a practical use case.",
        answer: "File positions enable RANDOM ACCESS:\n\n**tell()**: current byte offset from start.\n**seek(offset, whence)**: move position — whence 0 (SET, default) absolute; 1 (CUR) relative; 2 (END) offset-from-end (whence 1/2 need binary mode officially).\n\n**Caveats**: text mode positions are OPAQUE COOKIES (non-zero cookie values valid ONLY from tell(); arithmetic invalid due to variable-width encodings + newline translation). Binary mode gives true byte math.\n\n**Killer applications**:\n1. **tail -f emulation / log tailing**: seek(0, 2) jump to end, poll new bytes.\n2. **Fixed-record databases**: rec_n position = n * RECORD_SIZE; seek+read O(1) row fetch.\n3. **Resume partial downloads**: stored byte count → seek there, continue writing/appending ranges.\n4. **Header inspection**: read magic bytes (PNG \\x89PNG), then seek back before full parse.\n5. **In-place record update** (same-length fields): seek-write-seek without rewriting whole file.\n\n**Gotchas**: append-mode ('a') forces writes to END regardless of seek; mixing buffered reads then writes requires seek discipline; truncate(size) pairs with seeking for resizing.\n\nDemo magic-byte check + fixed-record lookup — concrete patterns beat definitions.",
        code: `RECORD = 16
with open("rows.bin", "wb") as f:
    for i in range(3):
        f.write(f"user{i:05d}".ljust(RECORD, "\\0").encode())

def fetch(row):
    with open("rows.bin", "rb") as f:
        f.seek(row * RECORD)
        return f.read(RECORD).rstrip(b"\\0").decode()

print(fetch(0), fetch(2))

with open("logo.bin", "rb") as f:
    magic = f.read(2)
    print("png?" , magic == b"\\x89P")   # inspect header
    f.seek(-1, 2)                        # last byte
    print("tail:", f.read())`,
        codeLanguage: "python",
        explanation: "tell reports and seek repositions the byte cursor (binary mode for real arithmetic) — powering tails, fixed-record lookups, resumed downloads and header sniffing.",
      },
      {
        id: "pyi7",
        question: "How do you work with CSV files robustly?",
        answer: "**csv module** over naive split(',') — because quoting/embedded commas/newlines/escapes break splitting instantly:\n\nimport csv\nwith open(path, newline='', encoding='utf-8') as f:\n    reader = csv.reader(f)          # rows as lists\n    header = next(reader)\n    for row in reader: ...\n\n**Critical details**:\n1. **newline='' REQUIRED** on the open — csv handles line endings itself; default translation corrupts embedded-newline quoted fields (documented gotcha).\n2. **DictReader**: maps header→values per row (row['col']) — schema-friendly; restval/restkey for ragged rows; DictWriter with fieldnames + extrasaction policy.\n3. **Typed values**: everything arrives as STR — convert ints/dates explicitly (or pandas/pydantic layer).\n4. **Dialects/sniffing**: delimiter=';' tablinum via csv.Sniffer().sniff(sample) for unknown formats; excel/excel-tab presets.\n5. **Writing**: writer.writerow/list; QUOTE_MINIMAL default, QUOTE_ALL for picky consumers; lineterminator tuning for Windows consumers.\n\n**Scaling up**: big files stream row-wise (constant memory); heavy analytics → pandas.read_csv(chunksize=...) iterators; strict validation → pydantic per-row.\n\nDemo DictReader write/read cycle with an embedded comma field surviving — proof of value.",
        code: `import csv

rows = [
    {"name": "Widget, Large", "qty": 3},
    {"name": "Gadget", "qty": 12},
]
with open("items.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["name", "qty"])
    w.writeheader()
    w.writerows(rows)

with open("items.csv", newline="", encoding="utf-8") as f:
    for rec in csv.DictReader(f):
        print(rec["name"], "->", int(rec["qty"]) * 2)
print(open("items.csv").read())`,
        codeLanguage: "python",
        explanation: "Use csv.DictReader/Writer with newline='' opens — proper quoting survives embedded commas/newlines that wreck manual splits; convert the all-string values yourself.",
      },
      {
        id: "pyi8",
        question: "How does the contextlib module simplify context management?",
        answer: "**contextlib toolbox**:\n\n**@contextmanager**: generator becomes context manager — pre-yield = __enter__ body, yielded value = as-target, post-yield (in finally!) = __exit__. One-liner CMs without class ceremony:\n@contextmanager\ndef suppressing(*excs):\n    try: yield\n    except excs: pass\n\n**closing(obj)**: calls obj.close() on exit — adapt close-having non-CMs.\n**suppress(*exceptions)**: swallow SPECIFIC exceptions declaratively (contextlib.suppress(FileNotFoundError): os.remove(tmp)) — far better than bare except-pass.\n**redirect_stdout/stderr**: capture/print-capture tests (redirect_stdout(io.StringIO())).\n**ExitStack** (power tool): dynamic N-resource stacking — register callbacks (callback(fn)), push enterables, pop_all() to transfer ownership on success paths; ideal variable-count files/transactions.\n**nullcontext**: placeholder CM for optional-wrapper branching (tests swapping real wrappers out).\n**ContextDecorator mixin**: turn CM into decorator usable both ways (@mycm on def AND with mycm():).\n\n**Design guidance**: suppress>except-pass; ExitStack replaces nested-with pyramids; keep generator CMs' try/finally discipline so exceptions during body still clean up (yield inside try!).",
        code: `import os, io, contextlib

with contextlib.suppress(FileNotFoundError):
    os.remove("ghost.tmp")
print("gone-or-never")

buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    print("captured!")
print("got:", buf.getvalue().strip())

from contextlib import ExitStack
paths = ["x1.txt", "x2.txt"]
with ExitStack() as stack:
    files = [stack.enter_context(open(p, "w")) for p in paths]
    files[0].write("first")
# all closed here, even if one open failed midway`,
        codeLanguage: "python",
        explanation: "contextlib ships @contextmanager factories plus suppress/closing/redirect helpers and ExitStack for dynamic resource piles — expressive cleanup without boilerplate classes.",
      },
      {
        id: "pyi9",
        question: "How do temporary files and atomic writes work?",
        answer: "**tempfile toolkit** (secure, auto-cleaned):\n- NamedTemporaryFile(delete=False?) — real named file visible to other processes (Windows forces reopen-dance quirks); TemporaryFile anonymous (unlinked immediately, POSIX-fast).\n- TemporaryDirectory — context-managed tree removal; test fixtures love it.\n- mkstemp/mkdtemp low-level fd/path primitives (permissions 600 by default — secure defaults vs predictable /tmp guessing attacks).\n- SpooledTemporaryFile: RAM until size threshold then spills to disk (email attachments pipelines).\n\n**Atomic write pattern** (crash-safe file replacement — readers NEVER see half-files):\n1. Write FULL content to temp file SAME DIRECTORY as target (same filesystem ⇒ rename works).\n2. flush() + os.fsync(fd) forcing physical durability.\n3. os.replace(tmp, target) — ATOMIC POSIX/Windows syscall (overwrites atomically; unlike os.rename cross-platform overwrite semantics).\nOptionally fsync parent directory for crash-consistency purists.\n\n**Uses**: config stores, checkpoint files, cache blobs — anywhere torn writes corrupt state.\n\nDemo atomic_write helper + tempfile round trip — production-grade polish interviewers reward.",
        code: `import os, tempfile, json

def atomic_write_json(path, data):
    tmp_fd, tmp_path = tempfile.mkstemp(dir=os.path.dirname(path) or ".")
    try:
        with os.fdopen(tmp_fd, "w", encoding="utf-8") as f:
            json.dump(data, f)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, path)          # atomic swap
    except BaseException:
        os.unlink(tmp_path)
        raise

atomic_write_json("state.json", {"ok": True})
print(open("state.json").read())

with tempfile.TemporaryDirectory() as td:
    p = os.path.join(td, "scratch.txt")
    open(p, "w").write("temp")
    print(os.listdir(td))
print("cleaned:", os.path.exists(td))`,
        codeLanguage: "python",
        explanation: "tempfile gives secure auto-cleaning scratch space; durable atomic replacement = write-temp-same-dir, flush+fsync, then os.replace — readers never observe torn files.",
      },
      {
        id: "pyi10",
        question: "How do you walk directories recursively? Compare os.walk, pathlib, and scandir.",
        answer: "**os.walk(top)**: yields (dirpath, dirnames, filenames) triples descending depth-first — THE bulk-walker. In-place mutation of dirnames controls traversal: dirs[:] = [d for d in dirs if d != '.git'] prunes branches (skip node_modules!), topdown=False enables post-order (children before parents — safe delete/rename walks).\n\n**pathlib alternatives**: Path.rglob(pattern)/glob('**/x') recursive matching (convenience-first, loads matches lazily); iterdir() single-level manual recursion for custom logic.\n\n**os.scandir(dir)**: iterator of DirEntry objects carrying cached is_file()/is_dir()/stat WITHOUT extra syscalls (huge win vs listdir+stat-per-name) — performance choice for shallow scans/hot loops; walk() itself builds on scandir since 3.5.\n\n**Selection guide**: simple recursive sweep → os.walk; pattern-filtered collection → pathlib rglob; perf-critical single-level scans → scandir; need pruning/post-order → walk with dirnames tricks.\n\n**Cross-cutting tips**: follow_symlinks params guard link-loops; errors='ignore' tolerance; sort dirnames/filenames for deterministic order (walk yields arbitrary FS order!).",
        code: `import os
from pathlib import Path

os.makedirs("tree/a/b", exist_ok=True)
open("tree/a/leaf1.py", "w").close()
open("tree/a/b/leaf2.py", "w").close()

for root, dirs, files in os.walk("tree"):
    print(root, "->", sorted(files))

print([str(p) for p in Path("tree").rglob("*.py")])

with os.scandir("tree/a") as it:
    for entry in it:
        print(entry.name, entry.is_dir())`,
        codeLanguage: "python",
        explanation: "os.walk streams recursive triples (mutate dirnames to prune, topdown=False for post-order); pathlib rglob filters patterns; scandir wins syscall-light shallow scans.",
      },
      {
        id: "pyi11",
        question: "How do you handle character encoding issues when reading files?",
        answer: "**Root cause matrix**: bytes on disk ↔ str in memory decode via SOME codec; mismatch ⇒ UnicodeDecodeError (invalid sequences) or mojibake (wrong-but-valid codec, e.g., utf-8 bytes read as cp1252 showing â€™ garbage).\n\n**Defensive reading ladder**:\n1. KNOW thy source: API docs/spec say utf-8 → enforce encoding='utf-8' ALWAYS (never rely on locale default — Windows cp1252 trap).\n2. Detect when unknown: charset-normalizer/chardet libraries guess from statistics (confidence scores); BOM sniffing (utf-8-sig codec strips Excel-export BOMs transparently).\n3. Tolerate dirty data: errors='replace' (\\ufffd markers preserving positions) / 'ignore' (lossy silence) / 'backslashreplace' (debug-visible) — choose per pipeline contract, LOG counts of replacements.\n4. Fail fast contracts: default strict for internal pipelines where corruption = bug worth crashing on.\n\n**Writing symmetric care**: match consumer expectations (legacy systems demanding latin-1); surrogateescape handler round-trips undecodable bytes losslessly (POSIX filename handling trick!).\n\n**Debug ritual**: repr() the offending bytes, hexdump around failure offset, identify codec by signature (EF BB BF ⇒ utf-8 BOM). Narrating this procedure IS the senior signal.",
        code: `raw = "caf\\u00e9 – na\\u00efve".encode("utf-8")

print(raw.decode("utf-8"))
print(raw.decode("cp1252", errors="replace"))    # mojibake view

with open("mixed.bin", "wb") as f:
    f.write(b"ok \\xff\\xfe bad")

with open("mixed.bin", encoding="utf-8", errors="replace") as f:
    text = f.read()
print(repr(text))

with open("bom.csv", "wb") as f:
    f.write("\\ufeffcol\\nval".encode("utf-8"))
with open("bom.csv", encoding="utf-8-sig") as f:
    print(f.readline().strip())                  # BOM stripped`,
        codeLanguage: "python",
        explanation: "Always pin encoding explicitly; detect unknowns (chardet/BOM codecs), tolerate with chosen errors handlers + logging, and debug failures via repr'd bytes — never trust locale defaults.",
      },
    ],
  },
  {
    id: "modules",
    title: "Modules, Packages & Environments",
    icon: "🧩",
    questions: [
      {
        id: "pym1",
        question: "What happens when Python imports a module?",
        answer: "**Import machinery sequence** (sys.import machinery):\n1. **Cache check**: sys.modules dict — already-imported name returns INSTANTLY (module singleton; subsequent edits ignored without reload).\n2. **Finders**: sys.meta_path finders consulted (BuiltinImporter for stdlib C modules, FrozenImporter, PathFinder scanning sys.path).\n3. **Loader/exec**: found spec's loader creates EMPTY module object, inserts into sys.modules FIRST (cycle safety!), then EXECUTES module top-to-bottom in its namespace — defs/classes run NOW; import-time side effects happen here.\n4. Binding: `import m` binds local NAME m; `from m import x` binds ATTRIBUTE x (snapshot reference — later m.x rebind invisible to importer!).\n\n**Consequences interviewers probe**:\n- Import cost paid ONCE (startup budgets; lazy imports defer).\n- Circular imports partially WORK when accesses deferred (function bodies) but fail on import-time attribute needs — fix via restructuring, local imports, or TYPE_CHECKING guards.\n- Module-level mutable globals shared across ALL importers (config drift bugs).\n- __pycache__ bytecode written for imported (not main) modules when writable.\n\nMention importlib.reload for dev hot-reload caveats (existing references stale).",
        code: `import sys, math

print("math" in sys.modules)         # True (stdlib preloaded)
import my_counter                    # executes once

# my_counter.py contents imagined:
# COUNT = 0
# def bump(): global COUNT; COUNT += 1

from my_counter import bump, COUNT
bump()
print(COUNT)                         # 0 — from-import bound ORIGINAL int!
import my_counter as mc
print(mc.COUNT)                      # 1 — module attr is live`,
        codeLanguage: "python",
        explanation: "Imports check sys.modules cache, locate via finders, execute module body once inserting into cache — from-import snapshots attributes while module-attr access stays live.",
      },
      {
        id: "pym2",
        question: "What goes in __init__.py and what are namespace packages?",
        answer: "**Regular packages**: directory WITH __init__.py. On package import, __init__ executes FIRST — its job:\n1. **Curate public API**: re-export key names (from .core import Engine) so users write from mypkg import Engine not deep paths.\n2. **Define __all__** controlling from mypkg import * surface + signaling intent to linters/docs.\n3. Light initialization/version metadata (__version__), logging config touchpoints.\nKEEP IT LIGHT — heavyweight imports slow every package touch (CLI cold-start pain); lazy module-level __getattr__ (PEP 562) defers optionally.\n\n**Namespace packages (PEP 420, implicit since 3.3)**: directories WITHOUT __init__.py become namespace portions — multiple distribution sites can CONTRIBUTE submodules under ONE virtual package name (corporate monorepo overlays, plugin ecosystems extending vendor namespaces). No init code possible; finder merges portions.\n\n**Decision guidance**: application/library code → regular packages (init present, explicit); partitioned mega-packages/plugin mount points → namespace packages deliberately.\n\n**Relative imports inside packages**: from ..utils import x (bounded by package root; running file directly breaks them — module vs script context). Show __all__ + lazy getattr flourish.",
        code: `# mypkg/__init__.py
__version__ = "2.1.0"
__all__ = ["Engine", "load_config"]

def __getattr__(name):                 # PEP 562 lazy exports
    if name == "load_config":
        from .config import load_config
        return load_config
    raise AttributeError(name)

from .core import Engine               # eager flagship export

# usage:
# from mypkg import Engine, __version__
# heavy submodule imported only on first load_config()`,
        codeLanguage: "python",
        explanation: "__init__.py executes at package import curating API (__all__, re-exports, version) — keep it lean with lazy __getattr__; init-less directories merge as PEP 420 namespace packages.",
      },
      {
        id: "pym3",
        question: "How does Python find modules — explain sys.path resolution?",
        answer: "Import search order for plain names:\n1. sys.modules cache (already loaded?).\n2. sys.meta_path finders: builtin (sys.builtin_module_names — compiled-in like sys), frozen, then **PathFinder iterating sys.path IN ORDER** — FIRST match wins!\n\n**sys.path contents at startup**: script's directory (or cwd for -m/interactive) FIRST, PYTHONPATH env entries, install-dependent site-packages (venv-scoped!), zip/egg hooks. Inspect live: python -c \"import sys; print(sys.path)\".\n\n**Shadowing hazards (classic interviews)**: naming a file random.py/email.py near your script hijacks stdlib/third-party imports (script-dir precedes site-packages!). Symptoms: AttributeError on expected module members. Diagnose: print(module.__file__) revealing unexpected location.\n\n**Manipulation tools** (ranked): venv isolation (preferred); PYTHONPATH for dev augmentation; sys.path.insert(0,...) hacks LAST RESORT inside scripts/tests (fragile order dependence); editable installs pip install -e . making YOUR package properly importable.\n\n**Security note**: path precedence = injection vector (writable cwd + crafted module names); python -P (3.11+) and -E harden. Also -I isolated mode.",
        code: `import sys
print(sys.path[:4])                     # script-dir, pythonpath, stdlib, site...

import json                              # stdlib
print(json.__file__)                     # legit location

# shadow demo: create ./random.py next to script ->
# import random  -> YOUR file wins (script dir first)!
import subprocess
out = subprocess.run([sys.executable, "-c",
    "import sys; print(sys.flags.isolated)"], capture_output=True, text=True)
print(out.stdout.strip())`,
        codeLanguage: "python",
        explanation: "Names resolve through meta_path finders onto ordered sys.path (script dir → PYTHONPATH → site-packages) — first hit wins, so local files can shadow stdlib; prefer venvs/-e installs over path hacks.",
      },
      {
        id: "pym4",
        question: "Why does circular import happen and how do you fix it?",
        answer: "**Mechanics**: A imports B mid-execution; B imports A — A EXISTS in sys.modules but is PARTIALLY INITIALIZED (only defs above the import line executed). If B needs missing attributes AT IMPORT TIME → ImportError (cannot import name X from partially initialized module).\n\n**Reproduces reliably**: two modules each importing the other at top level, or package __init__ importing submodules that import back.\n\n**Fix menu (ordered preference)**:\n1. **Restructure responsibilities** — extract shared bits into THIRD module both import (dependency inversion; usually the right architecture).\n2. **Defer import INTO function bodies** — executed at call time when both modules complete (standard for plugin lookups, CLI dispatch).\n3. **Import module, not names**: import utils then utils.helper() at call time — attribute resolved lazily dodging init-time absence.\n4. **TYPE_CHECKING guard** for annotations only: from typing import TYPE_CHECKING; if TYPE_CHECKING: from a import A (+ forward refs/quotes).\n5. Local imports inside __init__ last lines ordering tweaks (brittle; smell).\n\n**Prevention culture**: layered architecture rules (models ← services ← api, never back), lint tooling flagging cycles (import-linter, pydeps graphs). Explain mechanics THEN prescribe — mechanics knowledge separates candidates.",
        code: `# orders.py
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from billing import Invoice          # editor-only, runtime-free

class Order:
    def invoice(self):
        from billing import Invoice      # deferred: safe at CALL time
        return Invoice(self.total)

# billing.py
from orders import Order                 # fine — orders fully loads first

class Invoice:
    def __init__(self, total): self.total = total

o = Order(); o.total = 99
print(o.invoice().total)`,
        codeLanguage: "python",
        explanation: "Cycles break when a half-initialized module lacks requested attrs — extract shared cores, defer imports to call time, import modules-not-names, and gate annotation imports behind TYPE_CHECKING.",
      },
      {
        id: "pym5",
        question: "What are the dangers of from module import *?",
        answer: "**Wildcard imports** dump module namespace into yours — banned in production style (PEP 8) for cause:\n\n1. **Name collisions SILENTLY override** — later import's definitions clobber earlier locals/builtins unpredictably with import-order sensitivity: from os import * then from posixpath import * — which open survived?\n2. **Readability death**: origin of any name untraceable (grep fails across star-imports); IDE static analysis degrades.\n3. **Accidental execution/API pollution**: everything public lands in scope — private-ish helpers included (underscore-prefixed excluded, others NOT).\n4. **Lint/type-check blindness**: undefined-name detection weakened.\n\n**The mitigations if forced**:\n- Module defines **__all__** whitelist — star imports ONLY those (still collision-prone among stars, but bounded/intentional).\n- Interactive REPL exploration: acceptable scratch-space usage.\n- Explicit imports ALWAYS preferable; alias collisions deliberately (import numpy as np).\n\n**Related nuance**: __all__ ALSO documents intended public API (help()/docs honor it) even absent star-imports — dual purpose worth stating.\n\nDemo collision surprise + __all__ containment — quick visceral proof.",
        code: `# lib_a.py: export = "from A"
# lib_b.py: export = "from B"; hidden = 42
with open("lib_a.py", "w") as f: f.write("export = 'A'\\n")
with open("lib_b.py", "w") as f: f.write("export = 'B'\\n__all__=['export']\\nhidden = 42\\n")

from lib_a import *
print(export)
from lib_b import *
print(export)                            # silently replaced!
try:
    hidden
except NameError as e:
    print("__all__ filtered:", e)`,
        codeLanguage: "python",
        explanation: "Star imports blindside you with silent name overrides and untraceable origins — define __all__ to bound them, but prefer explicit imports everywhere outside the REPL.",
      },
      {
        id: "pym6",
        question: "Explain virtual environments — why and how (venv, pip, requirements)?",
        answer: "**Problem solved**: projects need conflicting dependency versions (Django 4 vs 5) against ONE interpreter; global installs collide. A **venv** = lightweight directory with symlinks/copies of interpreter + ISOLATED site-packages + activation adjusting PATH/VIRTUAL_ENV.\n\n**Workflow**:\npython -m venv .venv\nsource .venv/bin/activate (win: .venv\\Scripts\\Activate.ps1)\npip install requests\npip freeze > requirements.txt   # pin exact versions==\npip install -r requirements.txt\ndeactivate\n\n**Modern packaging stack worth naming**:\n- **requirements.txt** — flat pins (app deployments).\n- **pyproject.toml** (PEP 518/621) — project metadata + dependencies; build backends (setuptools/hatchling/poetry-core); THE standard now.\n- **lock files**: poetry.lock/uv.lock/pip-tools compile — reproducible transitive trees (apps should deploy from locks; libraries declare RANGES instead).\n- **uv/pip-tools/Poetry/PDM** tooling generation speeding resolves.\n\n**Conceptual checks interviewers add**: venvs are DISPOSABLE (recreate from lock); system python stays pristine; IDE interpreters point INTO .venv; docker images often skip activation (absolute paths/ENV vars).\n\nContrast conda briefly (env + non-Python binaries/science stacks).",
        code: `# terminal workflow:
# python -m venv .venv
# .venv\\Scripts\\Activate.ps1        (windows)
# pip install "requests>=2.31"
# pip freeze > requirements.txt

import subprocess, sys
out = subprocess.run([sys.executable, "-m", "pip", "--version"],
                     capture_output=True, text=True)
print(out.stdout.strip())             # pip bound to ACTIVE env

# pyproject.toml excerpt:
# [project]
# dependencies = ["requests>=2.31,<3"]`,
        codeLanguage: "python",
        explanation: "venvs isolate per-project site-packages beside one interpreter — create with venv module, pin via requirements/locks, and standardize project metadata in pyproject.toml.",
      },
      {
        id: "pym7",
        question: "What are relative imports and when do they fail?",
        answer: "**Syntax**: leading dots encode package levels — from . import sibling; from ..pkg import thing (one dot=current package, two=parent...).\n\n**Requirement**: relative imports resolve via module __package__ — they ONLY work INSIDE packages executed as part of one. Running a module DIRECTLY (python src/pkg/mod.py) sets __package__=None/__name__='__main__' with NO package context → **ImportError: attempted relative import with no known parent package** — the infamous error.\n\n**Correct executions**:\n- Run as module from ROOT: python -m pkg.mod (cwd on path; package context intact).\n- Entry points/console-scripts (installed packages import properly).\n- Tests via pytest importing package normally.\n\n**Style guidance**: RELATIVE for intra-package cohesion (refactor-rename-proof, explicit locality); ABSOLUTE (from mypkg.utils import x) for clarity across layers/public surfaces — teams pick conventions (often absolute everywhere).\n\n**Hybrid trap**: script-turned-module wanting direct-run debugging — provide if __name__ == '__main__': block using ABSOLUTE imports, or python -m invocation habit; sys.path hacks discouraged.\n\nDemo the failing direct-run vs working -m run via subprocess — concrete reproduction earns credit.",
        code: `import os, subprocess, sys, textwrap

os.makedirs("pkga", exist_ok=True)
open("pkga/__init__.py", "w").close()
open("pkga/helper.py", "w").write("VAL = 41\\n")
open("pkga/main_mod.py", "w").write(
    "from .helper import VAL\\nprint('answer', VAL + 1)\\n")

direct = subprocess.run([sys.executable, "pkga/main_mod.py"],
                        capture_output=True, text=True, cwd=".")
print("direct-run:", direct.stderr.strip().splitlines()[-1])

asmod = subprocess.run([sys.executable, "-m", "pkga.main_mod"],
                       capture_output=True, text=True, cwd=".")
print("module-run:", asmod.stdout.strip())`,
        codeLanguage: "python",
        explanation: "Dot-imports need package context (__package__); running files directly strips it — execute via python -m pkg.mod or installed entry points, else ImportError with no known parent.",
      },
      {
        id: "pym8",
        question: "What is __name__ == '__main__' guarding, and what is python -m?",
        answer: "**Guard recap** (see basics topic): module knows HOW it ran via __name__ — '__main__' when executed directly, module-name when imported; guard isolates script behavior keeping imports side-effect-free/testable.\n\n**python -m module_name**: runs module AS PACKAGE-AWARE module — sys.path[0] becomes CWD (not script dir!), package hierarchy honored (relative imports work!), __name__='__main__' still set. Powers:\n- Standard-tool invocation regardless of install layout: python -m venv, -m pip, -m pytest (guarantees TESTED interpreter's copy!), -m http.server.\n- Package entrypoints via **__main__.py**: python -m mypkg executes mypkg/__main__.py — distributable CLIs without console-script plumbing.\n- Debugging modules in-place with correct context (the relative-import rescue).\n\n**Direct-file vs -m differences summary**: path seeding (script-dir vs cwd), package context (none vs full), zipapp support.\n\n**Pro structure**: thin module guard calling main(); argparse inside main; library logic importable — dual-nature files stay clean. Mention runpy module introspecting this machinery as flourish.",
        code: `# cli.py
def main():
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--greet", default="hi")
    args = p.parse_args()
    print(args.greet, "from", __name__)

if __name__ == "__main__":
    main()

# python cli.py --greet hello   -> runs directly
# python -m cli                  -> same, cwd-based import context
# pkg/__main__.py makes: python -m pkg  launch the package`,
        codeLanguage: "python",
        explanation: "The guard keeps imports side-effect free; python -m executes modules with cwd-path and full package context — enabling stdlib tools, __main__.py package CLIs, and correct relative imports.",
      },
      {
        id: "pym9",
        question: "How do you organize a production Python project layout?",
        answer: "**Canonical src-layout** (recommended):\n\nproject/\n├─ pyproject.toml           # metadata/deps/build-backend\n├─ README.md, LICENSE\n├─ src/\n│  └─ mypackage/\n│     ├─ __init__.py\n│     ├─ core.py  cli.py\n│     └─ py.typed           # PEP 561 type-marker\n├─ tests/\n│  └─ test_core.py\n└─ .github/workflows/ci.yml\n\n**Why src over flat (mypackage/ at root)**: prevents ACCIDENTALLY importing the source tree instead of the INSTALLED package during tests (import-shadowing bug class); forces proper installation/editable-install discipline — CI catches packaging breakage early.\n\n**Key components**:\n- pyproject.toml [project] table: name/version/requires-python/dependencies; [build-system]; optional-deps extras (dev/test); entry-points [project.scripts] for CLIs.\n- tests mirroring package structure; pytest.ini/tox/nox configs; lint/format configs (ruff/black) colocated in pyproject.\n- Version single-sourcing (dynamic version from __init__ or VCS tagging).\n\n**Workflow commands**: pip install -e '.[dev]' editable with extras; python -m build producing sdist+wheel; twine publish.\n\nJustifying src-layout's shadow-test rationale is the senior differentiator here.",
        code: `# pyproject.toml sketch
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "mypackage"
version = "1.2.0"
requires-python = ">=3.11"
dependencies = ["httpx>=0.27"]

[project.optional-dependencies]
dev = ["pytest>=8", "ruff"]

[project.scripts]
mypackage-cli = "mypackage.cli:main"

# install:  pip install -e ".[dev]"`,
        codeLanguage: "python",
        explanation: "Ship src/ layout + pyproject.toml (metadata, deps, extras, entry-points), mirrored tests, and editable installs — src-layout blocks accidental uninstalled-source imports that flat layouts allow.",
      },
      {
        id: "pym10",
        question: "How do module-level singletons and configuration sharing work?",
        answer: "**Module = natural singleton**: import machinery caches modules in sys.modules — EVERY importer shares ONE instance. Module-level STATE therefore acts globally:\n\n# settings.py\nDEBUG = False\n_client = None\ndef client():\n    global _client\n    if _client is None:\n        _client = build()\n    return _client\nAll importers see identical DEBUG/_client — the idiomatic lightweight registry/constants/shared-client pattern.\n\n**Caveats interviewers probe**:\n1. **from m import X snapshots VALUES** for immutables — rebinding m.X later leaves importers stale (functions reading m.X see updates). Shared MUTABLES mutate visibly through either binding.\n2. **Test pollution**: monkeypatched module state leaks between tests without fixtures resetting (autouse teardown restoring snapshots).\n3. **Multiprocessing**: child processes RE-IMPORT (spawn) — module state RESETS per process; shared-state illusions shatter (need queues/managers, not globals).\n4. Import-time configuration reads (env vars) bake BEFORE dotenv/tests adjust — prefer lazy getters.\n5. Class-based DI containers/registries offer testability seams module globals resist.\n\nBalance: embrace module singletons for genuinely-static concerns; parameterize anything lifecycle/environment-sensitive.",
        code: `# shared.py
registry = {}

def register(key, fn):
    registry[key] = fn

# app_a.py effect shown inline here:
import shared
shared.register("a", lambda: 1)

import sys, types
shared_again = sys.modules["shared"]     # same object!
shared_again.register("b", lambda: 2)
print(list(shared.registry))              # ['a', 'b']

from shared import registry as snap
shared.register("c", lambda: 3)
print("c" in snap)                        # True — mutable shared`,
        codeLanguage: "python",
        explanation: "sys.modules caching makes each module a process-wide singleton — great for registries/constants; beware snapshot bindings, test leakage, and per-process resets under multiprocessing.",
      },
    ],
  },
  {
    id: "memory",
    title: "Memory Management & GIL Internals",
    icon: "🧠",
    questions: [
      {
        id: "pyh1",
        question: "How does reference counting work in CPython?",
        answer: "**Every heap object carries ob_refcnt** — a count of live references. Increments: assignment/binding, container storage, argument passing. Decrements: del name, rebinding, container removal, scope exit. **Zero ⇒ immediate deterministic destruction**: finalizer (__del__) called, memory freed to allocator NOW.\n\n**Inspection**: sys.getrefcount(x) (reports +1 for its own argument binding); weakref probes without pinning.\n\n**Strengths**: instant reclamation, predictable peak memory, no stop-the-world pauses (vs tracing GC lags), simple mental model.\n\n**Costs/failures**:\n1. Per-operation counter traffic (thread-safe via locked/GIL-atomic ops) — overhead tax on every assignment.\n2. **CYCLES immortalize participants**: a.child=b; b.parent=a keeps counts ≥1 forever — refcounting alone CANNOT reclaim; enters the generational CYCLE COLLECTOR's domain.\n3. Refcount churn optimization notes: freelists/small-object allocators (pymalloc arenas) mitigate malloc costs beneath counting.\n\n**Why cycles get special machinery**: containers (dict/list/object instances) may reference each other arbitrarily; the GC traverses them computing EXTERNAL reachability (covered in next question's depth).\n\nInterview arc: mechanism → strengths → cycle limitation → handoff to gc — shows complete model.",
        code: `import sys

lst = [1, 2, 3]
print(sys.getrefcount(lst))      # 2 (lst + arg)

alias = lst
print(sys.getrefcount(lst))      # 3

del alias
print(sys.getrefcount(lst))      # back to 2

class Node: pass
a, b = Node(), Node()
a.other, b.other = b, a          # cycle formed
del a, b                          # refcounts stuck >0 — GC rescues`,
        codeLanguage: "python",
        explanation: "Refcounts increment on binding/storage/passing and free objects instantly at zero — except reference cycles, which only the supplementary cyclic GC can reclaim.",
      },
      {
        id: "pyh2",
        question: "Explain the generational garbage collector for cycles.",
        answer: "gc module supplements refcounting solely for CONTAINER OBJECTS (lists/dicts/sets/tuples-of/instances/functions...) organized into **three generations** by survival history: gen0 (newborns, collected most often), gen1, gen2 (elders, rarely scanned). Threshold heuristics (gc.get_threshold() default 700,10,10 allocations-minus-deallocations) trigger young passes; survivors PROMOTE.\n\n**Cycle detection algorithm** (subtract-and-traverse):\n1. For candidate generation, COPY each container's refcount, then DECREMENT counts for all intra-generation references (internal refs don't prove external liveness).\n2. Remaining positive counts = externally referenced roots; traverse FROM those marking reachable.\n3. Unmarked containers = unreachable islands (cycles) → finalize/free despite mutual refcounts.\n\n**Generational rationale**: most objects die YOUNG (temporaries); cheap frequent gen0 passes catch them; costly full scans rare.\n\n**Controls**: gc.collect(generation?) force; gc.disable()/enable() — famous fork-performance pattern (disable pre-fork to avoid copying GC bookkeeping); gc.freeze() moves objects out of scanning (pre-fork optimization, 3.7+); gc.set_threshold tuning for allocation-heavy services; gc.callbacks hooking pause metrics.\n\nNote __del__-bearing cycles: fully collectible since 3.4 (PEP 442) — legacy trivia worth one line.",
        code: `import gc

class Pair:
    def __init__(self): self.partner = None

a, b = Pair(), Pair()
a.partner, b.partner = b, a
addr = id(a)
del a, b

print(gc.collect(0))                 # >=2 reclaimed incl. pair cycle
print(any(id(o) == addr for o in gc.get_objects()))  # likely False

print(gc.get_threshold())            # (700, 10, 10)
print(gc.get_stats()[0]["collections"], "gen0 sweeps so far")`,
        codeLanguage: "python",
        explanation: "Three survivor generations schedule increasingly-rare scans; subtract-internal-refcounts-then-traverse finds unreachable cycles that refcounting alone frees never.",
      },
      {
        id: "pyh3",
        question: "How can Python programs leak memory despite garbage collection?",
        answer: "GC reclaims UNREFERENCED objects — leaks persist whenever references LINGER unintentionally:\n\n**Top leak vectors**:\n1. **Growing global caches/registries**: unbounded dicts keyed by request IDs/user input (hand-rolled memoization without eviction!). Fix: lru_cache(maxsize), TTL caches, WeakValueDictionary.\n2. **Exception tracebacks**: storing sys.exc_info()/exception objects keeps FRAMES alive → entire call-stack locals pinned. Fix: log-and-clear, avoid long-lived exc holders.\n3. **Closures capturing fat scopes**: inner function referencing one variable pins ALL enclosing locals via cell/frame. Fix: narrow captures, del large locals pre-return.\n4. **lru_cache on METHODS** — self in keys retains every instance forever (classic ORM leak). Fix: weakref-keys wrapper, per-instance caches, staticmethod.\n5. **Event-listener accumulation**: subscribe-without-unsubscribe (GUI/observer patterns). Fix: weakref.WeakMethod callbacks, explicit unsubscribe in lifecycle.\n6. **Thread-local accumulations** in long-lived thread pools; session/connection pools without caps.\n7. **C-extension leaks** (native buffers ignoring refcounts) — tracemalloc blind; valgrind territory.\n\n**Diagnosis workflow**: tracemalloc snapshot diffs (top stats by lineno), objgraph count growth/find-backrefs, gc.get_objects filtering types, production: continuous profiler (memray/py-spy).\n\nNarrate #2+#4 with fix snippets — highest interview frequency.",
        code: `import weakref, gc

cache = weakref.WeakValueDictionary()   # leak-proof cache

class Big: pass
obj = Big()
cache["k"] = obj
print("cached:", "k" in cache)
del obj
gc.collect()
print("after del:", "k" in cache)        # evicted automatically

import sys
try:
    raise ValueError("boom")
except ValueError as e:
    tb_holders = []
    tb_holders.append(e)                 # keeps frame alive!
del tb_holders
gc.collect()`,
        codeLanguage: "python",
        explanation: "Leaks come from LIVE references — unbounded caches, retained tracebacks, closure captures, self-keyed method caches, listener piles; hunt with tracemalloc diffs and weakref fixes.",
      },
      {
        id: "pyh4",
        question: "What is the GIL and why does it exist?",
        answer: "**Global Interpreter Lock**: ONE mutex per PROCESS permitting a single thread to execute PYTHON BYTECODE at any instant — even across 64 cores, threads timeshare the interpreter.\n\n**Why it exists (design history)**:\n1. CPython's memory safety rests on REFERENCE COUNTING; making per-object counts lock-free/atomic across every op historically cost significant single-thread speed OR required fine-grained locking complexity explosion.\n2. ONE coarse lock was the pragmatic 1990s bargain: simpler implementation, faster unithreaded performance, C-extension ecosystem simplicity (extensions assume GIL held).\n3. Alternative attempts (gilectomy removing GIL) made single-thread slower; per-object locking (PyPy STM experiments) traded elsewhere.\n\n**What it does NOT serialize**: I/O syscalls (socket/file/db waits RELEASE GIL), blocking C computations in extensions DESIGNED to release (numpy kernels, hashlib/zlib on big buffers), processes entirely (own GILs).\n\n**Current landscape (interview gold)**: PEP 703 — free-threaded CPython build (3.13 experimental, opt-in) removing GIL reliance with biased reference counting; PEP 684 per-interpreter GIL (subinterpreters parallelism). Knowing trajectory signals currency.\n\nFraming sentence: \"GIL protects CPython's refcounting internals, not Python semantics — I/O concurrency thrives; CPU parallelism needs processes or native code.\"",
        code: `import threading, time, sys

def cpu():
    t = 0
    for i in range(20_000_000): t += i
    return t

t0 = time.perf_counter()
cpu(); cpu()
serial = time.perf_counter() - t0

ts = [threading.Thread(target=cpu) for _ in range(2)]
t0 = time.perf_counter()
[t.start() for t in ts]; [t.join() for t in ts]
parallel = time.perf_counter() - t0

print(f"serial={serial:.2f}s threads={parallel:.2f}s  (GIL serializes)")
print(sys.version.split()[0])`,
        codeLanguage: "python",
        explanation: "One mutex per process gates bytecode execution to protect refcount-based memory management — I/O releases it, CPU-bound threads gain nothing, and free-threaded 3.13+ builds are changing the story.",
      },
      {
        id: "pyh5",
        question: "When do you choose threading vs multiprocessing vs asyncio?",
        answer: "**Decision matrix by bottleneck**:\n\n**threading** — I/O-BOUND concurrency (network/file/db waits release GIL): scrapers, fan-out API calls, GUI responsiveness. Shared memory easy BUT race-prone (locks needed). Overhead ~MB/thread; hundreds feasible.\n\n**multiprocessing** — CPU-BOUND parallelism: number crunching, image processing, ML preprocessing. Separate processes/interpreters bypass GIL scaling linearly-ish across cores. Costs: spawn overhead (~100ms+), IPC serialization (queues/pipes/Manager), no shared objects (memory-mapped arrays/SharedMemory for heavy exchange). Pool.map the workhorse.\n\n**asyncio** — MASSIVE concurrent I/O (thousands of sockets/websockets): single-threaded cooperative event loop; await yields control. Zero lock anxiety (cooperative switching at awaits), lowest per-task overhead (~KB). Constraint: ENTIRE stack must be async-aware; CPU work BLOCKS loop (offload via run_in_executor/process pool). Latency-sensitive servers/proxies/chat backends.\n\n**Quick chooser sentence**: waiting-on-network few-dozen tasks → threads; burning-CPU → processes; thousands-of-idle-connections → asyncio; mixed → asyncio orchestrating executor/process offloads.\n\nBonus: concurrent.futures.ThreadPoolExecutor/ProcessPoolExecutor unify APIs — swap executor type, keep code.",
        code: `import asyncio, time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

def blocking_io():
    time.sleep(0.2); return "io-done"

def crunch(n):
    return sum(i * i for i in range(n))

async def server_like():
    loop = asyncio.get_running_loop()
    r1 = await loop.run_in_executor(None, blocking_io)      # thread offload
    r2 = await loop.run_in_executor(
        ProcessPoolExecutor(), crunch, 500_000)             # cpu offload
    return r1, r2

print(asyncio.run(server_like()))
with ThreadPoolExecutor(4) as ex:                # I/O fan-out
    print(list(ex.map(blocking_io, range(3))))`,
        codeLanguage: "python",
        explanation: "Threads for moderate I/O waits, processes for CPU parallelism (GIL escape), asyncio for thousands of cooperative sockets — mix via executors under an event loop when workloads blend.",
      },
      {
        id: "pyh6",
        question: "What are race conditions and how do you prevent them in threads?",
        answer: "**Race condition**: correctness depends on THREAD INTERLEAVING timing — two threads read-modify-write shared state concurrently losing updates (counter += 1 compiles to LOAD/ADD/STORE — interleavings drop increments).\n\n**Demonstration**: N threads × M increments without lock yield < N×M consistently — reproducible lost-update proof (GIL switches between BYTECODES, not statements!).\n\n**Prevention arsenal**:\n1. **Lock** (mutex): critical sections serialized — acquire/release (with-lock context manager MANDATORY for exception safety). Keep sections MINIMAL (throughput + deadlock avoidance).\n2. **RLock**: reentrant — same-thread reacquisition legal (recursive functions holding lock).\n3. **Higher abstractions FIRST**: queue.Queue (thread-safe producer/consumer — eliminates most hand-locking), collections.deque append/pop atomicity claims, concurrent.futures for delegation.\n4. **Immutable messaging**: share DATA SNAPSHOTS not mutable structures (functional borders).\n5. **Atomic single-op idioms**: dict/set single operations are effectively atomic UNDER GIL — check-then-act compounds are NOT (get-then-set races!).\n6. Deadlock hygiene: consistent lock ORDERING, timeouts (acquire(timeout=)), single-lock designs preferred.\n\n**Detection**: stress tests with high contention, thread-sanitizer-style tooling scarce in Python — design reviews catch better than tests.",
        code: `import threading

N_THREADS, N_INC = 8, 100_000
counter = 0
lock = threading.Lock()

def unsafe():
    global counter
    for _ in range(N_INC):
        counter += 1                 # LOAD/ADD/STORE interleaves!

threads = [threading.Thread(target=unsafe) for _ in range(N_THREADS)]
[t.start() for t in threads]; [t.join() for t in threads]
print("unsafe:", counter, "!=", N_THREADS * N_INC)

counter = 0
def safe():
    global counter
    for _ in range(N_INC):
        with lock:
            counter += 1

threads = [threading.Thread(target=safe) for _ in range(N_THREADS)]
[t.start() for t in threads]; [t.join() for t in threads]
print("safe:", counter)`,
        codeLanguage: "python",
        explanation: "Interleaved read-modify-write bytecode loses updates; guard compound operations with with-lock minimal sections — or sidestep locking entirely via queue.Queue message passing.",
      },
      {
        id: "pyh7",
        question: "Compare Lock, RLock, Semaphore, Event, and Condition.",
        answer: "**threading synchronization menu**:\n\n**Lock**: binary mutex — one holder; NON-reentrant (same-thread re-acquire DEADLOCKS). Default guard for critical sections.\n\n**RLock**: reentrant variant — owner thread may acquire repeatedly (depth-counted, matched releases); enables recursive/layered code paths holding protection across helper calls.\n\n**Semaphore(value)**: counter gate admitting N concurrent holders — resource pools (DB connections, rate limiting to downstream APIs); Semaphore(1) ≈ Lock without ownership semantics. BoundedSemaphore guards release-overcalls.\n\n**Event**: boolean broadcast flag — wait() blocks until set(); any-thread set()/clear(); one-shot readiness signaling (initialization-complete barriers, graceful-shutdown switches). NOT for count tracking.\n\n**Condition(lock)**: wait/notify coordination on PREDICATE changes — classic bounded-buffer: producers notify after append; consumers wait while empty. MUST hold lock while waiting/notifying; wait() atomically releases+sleeps+reacquires; notify_all avoids lost-wakeup subtleties.\n\n**Selection heuristic**: exclusive section→Lock; recursion-depth→RLock; N-slot admission→Semaphore; announce-state→Event; wait-for-complex-condition→Condition (or redesign onto queue.Queue which internally uses Condition — often the superior abstraction).",
        code: `import threading, queue, time

sem = threading.BoundedSemaphore(2)      # two-lane bridge
def lane(i):
    with sem:
        print(f"car {i} crossing"); time.sleep(0.01)

ready = threading.Event()
def worker():
    ready.wait(timeout=1)                 # gate on readiness
    return "started"

t = threading.Thread(target=worker); t.start()
ready.set(); print(t.join() or "started")

q = queue.Queue(maxsize=2)                # Condition-powered channel
def prod():
    for i in range(3): q.put(i)
def cons():
    out = []
    while len(out) < 3: out.append(q.get())
    return out

threading.Thread(target=prod).start()
print(cons())`,
        codeLanguage: "python",
        explanation: "Lock excludes, RLock recurses, Semaphore admits-N, Event broadcasts readiness, Condition coordinates predicates — and queue.Queue wraps the hard cases safely.",
      },
      {
        id: "pyh8",
        question: "Why is queue.Queue preferred over list or deque for thread communication?",
        answer: "**queue.Queue = synchronized message channel** purpose-built for producer/consumer:\n\n1. **Blocking semantics**: put() blocks on FULL (maxsize backpressure!), get() blocks on EMPTY — eliminating busy-wait loops and manual condition juggling. Timeout variants (put(timeout)/get_nowait) for responsive shutdowns.\n\n2. **Built-in Condition machinery**: internal Lock+Condition coordinate sleepers efficiently — no lost-wakeup foot-guns.\n\n3. **Task accounting**: task_done()/join() track COMPLETION not just enqueue — join() unblocks when all dequeued items PROCESSED (pipeline drain detection for shutdown). deque/list lack completion semantics entirely.\n\n4. **Priority/LIFO variants**: PriorityQueue (heap by item order), LifoQueue — drop-in strategy swaps.\n\n**vs list**: append/pop are GIL-atomic-ish BUT pop(0) is O(n), no blocking/backpressure/completion — hand-building conditions around it recreates Queue badly.\n\n**vs deque**: append/popleft genuinely O(1)+atomic individually, yet compound flows (wait-for-item) still need external locking — deque fits token buckets/ring buffers, Queue fits WORK DISTRIBUTION.\n\n**Pattern snippet**: worker pool pulling sentinel-poison pills for graceful termination — canonical interview closer.",
        code: `import threading, queue

NUM_WORKERS = 3
tasks = queue.Queue()
results = []

def worker():
    while True:
        item = tasks.get()
        if item is None:                 # poison pill
            tasks.task_done()
            break
        results.append(item * item)
        tasks.task_done()

for i in range(6):
    tasks.put(i)
for _ in range(NUM_WORKERS):
    threading.Thread(target=worker, daemon=True).start()

tasks.join()                              # all processed
for _ in range(NUM_WORKERS):
    tasks.put(None)                       # stop workers
print(sorted(results))`,
        codeLanguage: "python",
        explanation: "Queue bundles blocking put/get with backpressure, condition-based waking, and task_done/join completion tracking — work distribution done right versus bare list/deque gymnastics.",
      },
      {
        id: "pyh9",
        question: "How do you profile and reduce memory usage in Python?",
        answer: "**Measurement arsenal** (measure FIRST, optimize second):\n- **tracemalloc**: stdlib allocation tracing — start()/take_snapshot()/compare_to(top N by lineno) diffing periods; filter traces by filename; pinpoint LEAKING LINES.\n- **sys.getsizeof** shallow size (container shells exclude elements! recursive sizing needs recipes/__slots__ comparisons).\n- **pympler/asizeof** deep sizes; **memray** flamegraphs of live allocations (industry favorite); **py-spy** sampling including memory modes (prod-safe).\n- gc.get_objects()/objgraph.typestats census by type; objgraph.show_growth deltas.\n\n**Reduction playbook**:\n1. **__slots__** on mass-instantiated classes (30–60% instance shrink).\n2. **Generator pipelines** replacing intermediate lists (stream, don't materialize).\n3. **Right-size structures**: array/numpy for numeric homogeneity (vs int-object lists), interned enums instead of string soup, bitfields/flags packs.\n4. **Interning/sharing**: sys.intern repeated strings, frozenset constants, flyweight registries.\n5. **Eviction policies**: lru_cache bounds, TTL caches, WeakValueDictionary for auxiliary mappings.\n6. **Lazy loading**: import-heavy modules on demand, cached_property for derived blobs.\n\nDemo tracemalloc before/after slots — quantified improvement closes strongly.",
        code: `import tracemalloc

tracemalloc.start()
plain = [{"x": i, "y": i} for i in range(200_000)]
snap1 = tracemalloc.take_snapshot()

class Point:
    __slots__ = ("x", "y")
    def __init__(self, x, y): self.x, self.y = x, y

slotted = [Point(i, i) for i in range(200_000)]
current, peak = tracemalloc.get_traced_memory()
top = snap1.compare_to(tracemalloc.take_snapshot(), "lineno")
tracemalloc.stop()
print(f"peak={peak/1e6:.1f}MB; biggest delta: {top[0]}")`,
        codeLanguage: "python",
        explanation: "Trace with tracemalloc diffs (or memray in prod), then cut weight via slots, streaming generators, compact arrays, interning, bounded caches and lazy loading — always quantify before claiming.",
      },
      {
        id: "pyh10",
        question: "What are weak references and when are they useful?",
        answer: "**weakref.ref(obj)** creates a reference NOT increasing refcount — observing without pinning. When target dies, ref returns None (or proxy auto-dies via WeakRef proxies). Containers variants: WeakValueDictionary (values weak — cache entries vanish when nobody else holds them), WeakKeyDictionary (keys weak — metadata attached to objects dies WITH them), WeakSet (tracking/live-instance registries).\n\n**Canonical applications**:\n1. **Caches that self-clean**: memoize RESULTS keyed by object without extending lifetimes (WeakValueDictionary) — memory-leak antidote for naive caching.\n2. **Observer/listener lists**: subjects hold WEAK callbacks — subscribers unsubscribed implicitly on garbage collection (no manual unsubscribe burden/leaks).\n3. **Instance registries**: WeakSet tracking all live Widgets for broadcast without owning them.\n4. **Breaking cycles intentionally**: parent→child strong, child→parent weak (tree back-refs) — complement/refactor of cycle-GC reliance.\n5. **lru_cache-on-method fix**: weak-keyed method caches avoiding self-pinning.\n\n**Constraints**: NOT all types weak-referenceable (int/str/tuple/list/dict direct = TypeError; SUBCLASSES are) — wrap or subclass when needed. Proxies (weakref.proxy) behave like target transparently but raise ReferenceError once dead. Finalizers (weakref.finalize) attach exit-actions without __del__ pitfalls — modern cleanup recommendation!",
        code: `import weakref, gc

class Widget: pass

listeners = weakref.WeakSet()
w = Widget()
listeners.add(w)
print("live listeners:", len(listeners))
del w; gc.collect()
print("after del:", len(listeners))       # auto-unregistered

cache = weakref.WeakValueDictionary()
big = cache.setdefault("k", Widget())
print(cache["k"] is big)
del big; gc.collect()
print("k" in cache)                       # False`,
        codeLanguage: "python",
        explanation: "Weakrefs observe objects without keeping them alive — powering self-cleaning caches, auto-unregistering observers and cycle-breaking back-refs via ref/proxy/Weak*Dict/Set plus finalize().",
      },
      {
        id: "pyh11",
        question: "How does multiprocessing achieve parallelism, and what are its costs?",
        answer: "**Mechanism**: separate PROCESSES each with OWN interpreter+GIL — OS scheduler runs them on distinct cores simultaneously (true CPU parallelism). Workers created via fork (Unix fast, copies-on-write) or spawn (default Win/macOS 3.8+: fresh interpreter re-imports main module — hence __main__ guard REQUIREMENT).\n\n**API tiers**: Process targets; Pool/ProcessPoolExecutor map/apply batching; shared utilities: Queue/Pipe IPC, Manager proxies, shared_memory.SharedMemory/array zero-copy buffers, Lock/Semaphore cross-process variants.\n\n**Costs ledger**:\n1. **Startup**: spawn ~100ms+/process (fork cheaper, Unix-only perks, thread+fork hazards) — pool reuse amortizes.\n2. **Serialization tax**: arguments/results pickle across address spaces — huge NumPy arrays pay copy costs (mitigate: SharedMemory, memory-mapped files, chunked imap with larger chunksize).\n3. **No shared mutable state**: globals independent per process (surprise bug source); coordination via explicit IPC.\n4. Memory duplication baseline (copy-on-write softens under fork until writes).\n5. Daemon/lifecycle/join discipline; KeyboardInterrupt propagation quirks.\n\n**Sweet spot verification**: benchmark speedup vs core count — diminishing when pickled payload dominates compute (send indices not matrices!).\n\nDemo Pool.map square-mapping + note spawn/fork difference — grounded practicality.",
        code: `from multiprocessing import Pool, cpu_count
import time

def heavy(n):
    return sum(i * i for i in range(n))

if __name__ == "__main__":                 # REQUIRED for spawn safety
    nums = [2_000_000] * 8
    t0 = time.perf_counter()
    with Pool(processes=min(4, cpu_count())) as pool:
        outs = pool.map(heavy, nums, chunksize=2)
    print(f"{time.perf_counter()-t0:.2f}s across cores; last={outs[-1]%10**6}")
    t0 = time.perf_counter()
    [heavy(n) for n in nums]
    print(f"serial={time.perf_counter()-t0:.2f}s")`,
        codeLanguage: "python",
        explanation: "Processes own their interpreters/GILs for real core parallelism — paying startup, pickling and no-shared-memory taxes; guard entry points and batch smartly with Pool/SharedMemory.",
      },
      {
        id: "pyh12",
        question: "What is the role of __del__ and why is it fragile?",
        answer: "**__del__** = finalizer invoked when object about to be DESTROYED (refcount-zero or GC-collected cycle member). Intent: resource cleanup — but modern guidance says AVOID in favor of context managers/weakref.finalize.\n\n**Fragility catalogue**:\n1. **Timing nondeterministic**: cycles collect WHENEVER gc runs; PyPy/other impls delay indefinitely — RAII assumptions break (files may close late/never promptly).\n2. **Interpreter-shutdown hazards**: module globals may be NONE-ed during teardown → AttributeError inside __del__ (ignored with warning printed).\n3. **Exception swallowing**: __del__ exceptions print to stderr, IGNORED otherwise — silent failure paths.\n4. **Reference cycles PRE-3.4 uncollectable** with __del__ (resolved PEP 442, but resurrect-order surprises linger).\n5. **Resurrection possible** (storing self somewhere in __del__) — GC handles once more then gives up (uncollectable flag) — arcane bug territory.\n6. Blocks certain optimizations; interacts poorly with generators/frames retention via tracebacks.\n\n**Preferred replacements**:\n- with/context manager for scoped resources (deterministic!).\n- **weakref.finalize(obj, callback, *args)**: registers callable running ONCE at collection OR interpreter exit — survives cycles, no resurrection, explicit args captured (avoids self!). Stdlib-recommended destructor.\n\nDemo flaky-del vs finalize — crisp contrast ending.",
        code: `import weakref

class Risky:
    def __del__(self):
        print("risky __del__ ran")       # WHEN? nondeterministic!

class Safer:
    def __init__(self, name):
        self.name = name
        weakref.finalize(self, lambda n: print(f"finalized {n}"), name)

r = Risky(); del r                        # immediate here (refcount), not generally
s = Safer("db-conn"); del s               # finalize fires at collection

# scoped alternative:
from contextlib import closing
class Conn:
    def close(self): print("closed via with")
with closing(Conn()):
    pass                                  # deterministic cleanup`,
        codeLanguage: "python",
        explanation: "__del__ runs at unpredictable collection times with shutdown/swallowing hazards — prefer with-blocks for scoping and weakref.finalize for collection-time callbacks.",
      },
    ],
  },
];

export const pythonMetaPart5: Record<string, PyQuestionMeta> = {
  pyi1: { difficulty: "easy", priority: "high", tags: ["files", "modes"] },
  pyi2: { difficulty: "easy", priority: "very-high", tags: ["with", "context"] },
  pyi3: { difficulty: "easy", priority: "high", tags: ["reading", "io"] },
  pyi4: { difficulty: "medium", priority: "very-high", tags: ["serialization", "security"] },
  pyi5: { difficulty: "easy", priority: "high", tags: ["pathlib", "os"] },
  pyi6: { difficulty: "medium", priority: "medium", tags: ["seek", "random-access"] },
  pyi7: { difficulty: "medium", priority: "high", tags: ["csv"] },
  pyi8: { difficulty: "medium", priority: "medium", tags: ["contextlib"] },
  pyi9: { difficulty: "hard", priority: "medium", tags: ["atomic", "tempfile"] },
  pyi10: { difficulty: "easy", priority: "medium", tags: ["walk", "scandir"] },
  pyi11: { difficulty: "medium", priority: "high", tags: ["encoding", "unicode"] },

  pym1: { difficulty: "medium", priority: "very-high", tags: ["imports"] },
  pym2: { difficulty: "medium", priority: "high", tags: ["packages", "namespace"] },
  pym3: { difficulty: "medium", priority: "high", tags: ["sys-path", "shadowing"] },
  pym4: { difficulty: "hard", priority: "very-high", tags: ["circular-imports"] },
  pym5: { difficulty: "easy", priority: "high", tags: ["wildcard", "style"] },
  pym6: { difficulty: "easy", priority: "high", tags: ["venv", "pip"] },
  pym7: { difficulty: "medium", priority: "high", tags: ["relative-imports"] },
  pym8: { difficulty: "easy", priority: "high", tags: ["main", "dunder"] },
  pym9: { difficulty: "medium", priority: "medium", tags: ["packaging", "layout"] },
  pym10: { difficulty: "medium", priority: "medium", tags: ["singleton", "state"] },

  pyh1: { difficulty: "medium", priority: "very-high", tags: ["refcount"] },
  pyh2: { difficulty: "hard", priority: "high", tags: ["gc", "cycles"] },
  pyh3: { difficulty: "hard", priority: "very-high", tags: ["leaks", "diagnosis"] },
  pyh4: { difficulty: "medium", priority: "very-high", tags: ["gil"] },
  pyh5: { difficulty: "medium", priority: "very-high", tags: ["concurrency", "choice"] },
  pyh6: { difficulty: "hard", priority: "high", tags: ["races", "locks"] },
  pyh7: { difficulty: "medium", priority: "high", tags: ["sync", "primitives"] },
  pyh8: { difficulty: "easy", priority: "high", tags: ["queue", "threads"] },
  pyh9: { difficulty: "medium", priority: "high", tags: ["profiling", "memory"] },
  pyh10: { difficulty: "medium", priority: "medium", tags: ["weakref"] },
  pyh11: { difficulty: "medium", priority: "very-high", tags: ["multiprocessing"] },
  pyh12: { difficulty: "hard", priority: "low", tags: ["del", "finalize"] },
};
