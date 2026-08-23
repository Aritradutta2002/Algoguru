import type { InterviewTopic } from "@/data/pythonInterviewMetadataBase";
import type { PyQuestionMeta } from "@/data/pythonInterviewMetadataBase";

export const pythonTopicsPart4: InterviewTopic[] = [
  {
    id: "oop",
    title: "Object-Oriented Python",
    icon: "🧱",
    questions: [
      {
        id: "pyo1",
        question: "What is the purpose of self in Python classes?",
        answer: "**self is the explicit first parameter of instance methods** receiving the INSTANCE being operated on. obj.method(x) desugars to Class.method(obj, x) — the attribute lookup finds the function on the class, then binds the instance as first arg (descriptor protocol does this binding).\n\n**Key points**:\n1. It's a CONVENTIONAL name, not a keyword — any name works, but self is universal style.\n2. Explicit-by-design (Guido's choice): makes instance access unambiguous — you always SEE which namespace variables come from (self.x vs local x), unlike implicit this in Java/C++.\n3. __init__ is just an initializer called AFTER object creation (__new__ allocates) — self there IS the freshly allocated instance being configured.\n4. Bound methods: obj.method captures obj; passing method around retains the binding.\n5. classmethods receive cls (the CLASS), staticmethods receive nothing automatically.\n\n**Common errors revealing understanding**: calling self.method() without defining it on instance path; forgetting self parameter → TypeError takes 0 arguments when called with 1; using Class.method() where instance expected.\n\nContrast note: unlike Java's implicit this, Python's explicitness enables functional tricks — methods can be extracted and rebound (types.MethodType) for mixin-style composition.",
        code: `class Wallet:
    def __init__(self, balance=0):
        self.balance = balance          # attribute ON instance

    def deposit(self, amount):
        self.balance += amount          # explicit instance ref
        return self                     # chaining enabled

w = Wallet()
w.deposit(10).deposit(20)               # bound-method chain
print(w.balance)

# desugar proof:
Wallet.deposit(w, 5)
print(w.balance)

m = w.deposit                            # bound method remembers w
print(m.__self__ is w, m(100))`,
        codeLanguage: "python",
        explanation: "self is the explicitly passed instance — attribute lookup + descriptor binding turn obj.m(x) into Class.m(obj, x); explicitness keeps namespaces visible.",
      },
      {
        id: "pyo2",
        question: "What is the difference between class attributes and instance attributes?",
        answer: "**Class attributes** live on the CLASS object — shared by all instances, defined directly in class body. **Instance attributes** live in each instance's __dict__, typically created via self.x = ... in __init__ or elsewhere.\n\n**Lookup order**: instance.__dict__ first, THEN class (then MRO base classes). Assignment through instance ALWAYS writes instance-level, SHADOWING the class attr without touching it.\n\n**The mutable class-attribute trap**: class Dog: toys = [] — ALL dogs append into ONE shared list (class-level mutation via any instance!). Immutable class attrs (constants) are safe shared; mutables need per-instance init: self.toys = [] in __init__.\n\n**Legitimate class-attribute uses**: constants/enums, counters tracking instances (Dog.count += 1 via class name or inside methods), default configs read-before-write, registry dicts, @classmethod state.\n\n**Introspection**: vars(obj) instance dict; vars(Class)/Class.__dict__ class-level; del obj.x removes shadow restoring visibility of class value; setattr/delattr dynamics.\n\nDemo both lookup/shadowing behavior AND the shared-mutable bug with the fix — the pairing interviewers expect.",
        code: `class Dog:
    species = "canine"           # class attr (safe immutable)
    count = 0
    toys = []                    # TRAP: shared mutable!

    def __init__(self, name):
        self.name = name         # instance attr
        Dog.count += 1

a, b = Dog("Rex"), Dog("Fido")
print(a.species, b.species, Dog.count)

a.species = "wolf-hybrid"        # shadows per-instance
print(a.species, b.species, Dog.species)
del a.species                    # unshadow
print(a.species)

a.toys.append("ball")            # affects ALL dogs!
print(b.toys)

class SafeDog:
    def __init__(self):
        self.toys = []           # per-instance fix`,
        codeLanguage: "python",
        explanation: "Class attrs are shared (lookup falls back to class after instance dict); instance assignment only shadows — mutables at class level leak across all instances.",
      },
      {
        id: "pyo3",
        question: "Explain @staticmethod vs @classmethod vs instance methods.",
        answer: "Three method flavors differ in their automatic first argument:\n\n**Instance methods** (plain def): receive self — operate on instance state; most common; polymorphism-friendly (overridable dispatch).\n\n**@classmethod**: receives cls (the actual CLASS of the call — subclass-aware even when called through inheritance). Uses:\n- Alternative constructors: Date.from_iso(s) returning cls(...) — subclasses get correct type FREE (polymorphic factories).\n- Operating on class-level state/registries.\n\n**@staticmethod**: NO auto argument — plain function NAMESPACED inside class for cohesion/discoverability. Pure utility related to class domain (validation helpers, conversions).\n\n**Selection heuristic**: need instance data → instance method; need class identity/factory → classmethod; neither → staticmethod (or move OUT of class if truly unrelated).\n\n**Inheritance nuances**: classmethod invoked via SubClass sees cls=SubClass (builds SubClass instances!) — key factory benefit. Both static/class callable on instances too. __init_subclass__ and classmethod combos power plugin registration patterns.\n\nBonus polish: property objects wrap instance methods for attribute syntax — mention as fourth flavor.",
        code: `class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @classmethod
    def from_fahrenheit(cls, f):        # polymorphic factory
        return cls((f - 32) * 5 / 9)

    @staticmethod
    def is_freezing(c):                 # pure utility
        return c <= 0

    def warmer_than(self, other):       # instance comparison
        return self.celsius > other.celsius

class Kelvin(Temperature):
    pass

t = Temperature.from_fahrenheit(212)
k = Kelvin.from_fahrenheit(32)
print(type(k).__name__)                # Kelvin! cls-aware
print(Temperature.is_freezing(-5))`,
        codeLanguage: "python",
        explanation: "Instance methods get self, classmethods get the invoking cls (subclass-correct factories), staticmethods get nothing (namespaced utilities).",
      },
      {
        id: "pyo4",
        question: "What are properties and how do they implement encapsulation?",
        answer: "**@property** exposes a METHOD as computed ATTRIBUTE — callers write obj.area, not obj.area(); class internally controls computation/validation. Pythonic replacement for Java getter/setter ceremony.\n\n**Full pattern**:\n@property\ndef price(self): return self._price\n@price.setter\ndef price(self, v):\n    if v < 0: raise ValueError(...)\n    self._price = v\n(deleter similarly.) Underscore-prefixed _price signals internal storage.\n\n**Why superior to explicit getters/setters**:\n1. **Start simple, upgrade later WITHOUT breaking API** — public attribute today can become validated property tomorrow; call sites unchanged. This kills the \"always write accessors\" rationale.\n2. Computed/virtual fields: rect.area derived lazily-on-read; caching via cached_property.\n3. Read-only attributes: define property WITHOUT setter — assignment raises AttributeError (immutable-ish facades).\n4. Validation centralized at boundary; logging/deprecation warnings transparently injectable.\n\n**Related tools**: __setattr__/__getattr__ for blanket interception (careful recursion!), descriptors (property IS a descriptor — reusable validation types across many attrs), dataclasses field metadata.\n\nInterview flourish: \"properties make encapsulation a REFACTORING decision, not an upfront tax\" — memorable framing.",
        code: `class Account:
    def __init__(self, balance=0):
        self._balance = balance       # conventionally private

    @property
    def balance(self):                # read as attribute
        return self._balance

    @balance.setter
    def balance(self, value):
        if value < 0:
            raise ValueError("balance cannot go negative")
        print(f"balance -> {value}")   # audit hook
        self._balance = value

acct = Account(100)
print(acct.balance)                   # no parens!
acct.balance = 250
try:
    acct.balance = -1
except ValueError as e:
    print(e)`,
        codeLanguage: "python",
        explanation: "@property turns accessor logic into attribute syntax — validate/compute/log behind a stable public surface, upgrading plain fields later without caller changes.",
      },
      {
        id: "pyo5",
        question: "How do privacy conventions work (_x vs __x / name mangling)?",
        answer: "Python has NO enforced private — trust-based conventions:\n\n**_single_underscore**: \"internal use\" signal by consensus. Not imported by from module import * (unless __all__ says otherwise), linters warn on external access, but NOTHING blocks access — API courtesy marker.\n\n**__double_underscore (class attrs only)**: triggers NAME MANGLING — identifier rewritten to _ClassName__attr during compilation INSIDE that class body. Purpose: collision avoidance in INHERITANCE (subclass accidentally overriding parent internals), NOT secrecy — _Obj__secret still accessible deliberately.\n\n**Mangling rules/gotchas**: applies to identifiers with ≤1 trailing underscore (__x_ unmangled); mangling uses DEFINING class name; breaks getattr string expectations (need mangled form); debugging surprise when inspecting __dict__.\n\n**__dunder__ (leading+trailing)**: RESERVED for Python protocol methods — NEVER invent your own; don't mangle these.\n\n**Design guidance**: default to single underscore; reach for double only for attribute-conflict-prone framework/mixin internals. True immutability needs properties-without-setters, __slots__, frozen dataclasses, or MappingProxyType.\n\nDemonstrate mangling access + import-star exclusion — concrete beats theory.",
        code: `class Vault:
    def __init__(self):
        self._hint = "internal"       # convention only
        self.__pin = 1234             # mangled

v = Vault()
print(v._hint)                        # accessible, discouraged
print(v._Vault__pin)                  # mangled name reachable
print(sorted(k for k in v.__dict__))

class Cracked(Vault):
    def reveal(self):
        # return self.__pin          # AttributeError! mangled as _Cracked__pin
        return self._Vault__pin       # deliberate parent access

c = Cracked()
print(c.reveal())`,
        codeLanguage: "python",
        explanation: "_x is a politeness flag (skipped by import *); __x mangles to _Class__x preventing SUBCLASS collisions, not hiding — dunders stay reserved for protocols.",
      },
      {
        id: "pyo6",
        question: "What is MRO (Method Resolution Order)? How does C3 linearization work?",
        answer: "**MRO** defines the search order for attributes/methods across the inheritance graph — visible via Class.__mro__ or Class.mro(). Python 2.3+ uses the **C3 linearization** algorithm.\n\n**C3 guarantees**:\n1. Children precede parents (specializations first).\n2. Parents appear in DECLARATION order for each class.\n3. Each class appears exactly once; monotonic (subtle: preserves ordering consistency).\n\nClassic diamond: D(B, C), B(A), C(A) → D, B, C, A, object — A consulted once, LAST, after both branches.\n\n**Why C3 over old depth-first**: pre-2.3 orderings could visit common ancestors BEFORE later-declared bases violating local precedence, breaking cooperative multiple inheritance. Inconsistent hierarchies now REFUSE construction: TypeError \"Cannot create a consistent MRO\" (e.g., class X(A, B) where B extends A).\n\n**super() synergy**: super() follows THIS MRO dynamically — cooperative methods chain via super().__init__() etc., each class contributing once. That's why mixins work: each mixin calls super() trusting linearization reaches collaborators then root.\n\n**Practical tooling**: inspecting __mro__ debugs \"why did THAT method run\" mysteries; functools total ordering and mixin stacks depend on predictable MRO.\n\nDraw the diamond verbally + show __mro__ output — crisp demonstration.",
        code: `class A:
    def who(self): return "A"
    def ping(self): print("A.ping"); super().ping()

class B(A):
    def ping(self): print("B.ping"); super().ping()

class C(A):
    def ping(self): print("C.ping"); super().ping()

class D(B, C):
    def ping(self): print("D.ping"); super().ping()

D().ping()                 # D B C A — cooperative chain
print([c.__name__ for c in D.__mro__])

try:
    class X(C, B): pass    # conflicts C3 (B after its child... actually ok)
except TypeError as e:
    print(e)
class Y(D, B): pass        # would violate: B before its own child D? demo error case below
try:
    class Z(B, D): pass
except TypeError as e:
    print("inconsistent:", str(e)[:60])`,
        codeLanguage: "python",
        explanation: "C3 builds one consistent order (children→bases in declaration order, shared roots last) powering both attribute lookup and cooperative super() chains across diamonds.",
      },
      {
        id: "pyo7",
        question: "How does super() really work? Common misconceptions?",
        answer: "**super(cls, obj)** returns a PROXY dispatching along the MRO STARTING AFTER cls — not \"the parent class\"! Misconception #1 busted: with multiple inheritance there may be no single parent; super navigates the LINEARIZATION.\n\n**Zero-arg super()** (py3): compiler magic fills current __class__ + first arg — super().__init__() means \"next class in MY MRO after me\".\n\n**Cooperative multiple inheritance pattern**: EVERY __init__ calls super().__init__(...) letting each mixin/base contribute initialization once, in MRO order — foundation of mixin design (logging+serializable+dbmodel stacks).\n\n**Misconceptions checklist**:\n1. super() ≠ ParentClass direct call (bypasses siblings in diamonds, double-init risks).\n2. Calling super twice in one method duplicates downstream work — structure chains once.\n3. Signature mismatch pitfalls: cooperative chains must agree on forwarding (*args/**kwargs passthrough or coordinated contracts).\n4. Old-style super(Parent, self).__init__() still valid py3 but redundant.\n\n**Diamond demo payoff**: show __init__ chain executing each class EXACTLY once despite two paths to root — the canonical proof of proxy-over-MRO semantics.\n\nAlso mention classmethod super usage (super().new-ish patterns) briefly for completeness.",
        code: `class Base:
    def __init__(self, **kw):
        print("Base init")
        super().__init__(**kw)

class Mixin(Base):
    def __init__(self, **kw):
        print("Mixin adds logging")
        super().__init__(**kw)

class Leaf(Mixin):
    def __init__(self, **kw):
        print("Leaf init")
        super().__init__(**kw)

Leaf()                       # Leaf → Mixin → Base → object (once each!)

class Wrong(Base):
    def __init__(self):
        Base.__init__(self)  # bypasses Mixin-style siblings
        Base.__init__(self)  # double-run hazard`,
        codeLanguage: "python",
        explanation: "super() is an MRO-position proxy (next stop, not parent) enabling each cooperative class to run once along the chain — the backbone of mixin architectures.",
      },
      {
        id: "pyo8",
        question: "Does Python support multiple inheritance? What about the diamond problem?",
        answer: "**Yes — full multiple inheritance**, managed safely by C3 MRO + explicit conflict resolution:\n\n**Diamond shape**: D(B, C), both extending A. Naive languages re-run A's init twice or pick arbitrarily. Python answers:\n1. **Single linearization**: __mro__ places A once, last — attribute/method lookups unambiguous.\n2. **cooperative super()** chains init once through every participant.\n3. Method conflicts resolved by DECLARATION ORDER: D(B, C) prefers B's override.\n\n**Realistic hazards beyond the toy diamond**:\n- Unrelated bases BOTH defining same-named method silently picks leftmost — document/intent-check overrides.\n- State collisions: two bases using same internal attr name (mitigate via name mangling __x).\n- Interface-like needs better served by ABCs/mixins (behavior-only, super-friendly) than heavyweight multi-parents.\n\n**Mixins best practices**: keep mixins narrow/stateless-ish, always call super(), place BEFORE primary base: class CachedJSONView(CacheMixin, View).\n\nAlternative composition note: modern guidance often prefers COMPOSITION (has-a) + protocols over inheritance webs — mention as architectural maturity signal.",
        code: `class Loggable:
    def __init__(self, **kw):
        print("log setup"); super().__init__(**kw)
    def save(self): print("[logged]"); super().save()

class Serializable:
    def __init__(self, **kw):
        print("serializer ready"); super().__init__(**kw)
    def save(self): print("[serialized]"); super().save()

class Model:
    def __init__(self, **kw): print("model core"); super().__init__(**kw)
    def save(self): print("DB write")

class User(Loggable, Serializable, Model):
    pass

u = User()
u.save()                     # logged → serialized → DB
print([c.__name__ for c in User.__mro__])`,
        codeLanguage: "python",
        explanation: "Multiple inheritance is legal and orderly: C3 fixes one lookup line, super() runs each contributor once — mixins stack cleanly when they delegate upward.",
      },
      {
        id: "pyo9",
        question: "How do abstract base classes (abc module) work?",
        answer: "**abc** provides true abstract declarations: inherit ABC (or set metaclass=ABCMeta), decorate with @abstractmethod — instantiation of UNIMPLEMENTED subclasses raises TypeError at creation time.\n\n**Core mechanics**:\n- @abstractmethod collects into __abstractmethods__; ABCMeta.__call__ refuses instantiation until all satisfied.\n- Abstract methods CAN have implementations (call via super() from overrides — template method pattern).\n- Combine with @classmethod/@staticmethod/@property stacking order matters (@property over @abstractmethod).\n- abstractproperty deprecated — use stacked decorators.\n\n**Virtual subclassing (killer feature)**: register() declares ANY class as virtual subclass WITHOUT inheritance: Sequence.register(MyTree) → isinstance(MyTree_instance, Sequence) True. Plus __subclasshook__ lets ABCs define STRUCTURAL checks — Sized matches anything with __len__: duck typing formalized!\n\n**collections.abc gallery**: Iterable, Iterator, Sequence, Mapping, Set, Callable, Hashable, Sized, Container — inheriting grants free mixin methods (subclass Mapping → get pop update for implementing __getitem__ etc.).\n\n**vs Protocols (typing.Protocol)**: nominal-via-registration vs STRUCTURAL-by-default; Protocol needs no declaration from implementers. Mention both + when each fits (frameworks enforce contracts → ABC; library-agnostic shapes → Protocol).",
        code: `from abc import ABC, abstractmethod

class Storage(ABC):
    @abstractmethod
    def put(self, key, value): ...
    @abstractmethod
    def get(self, key): ...
    def exists(self, key):              # concrete helper
        try: self.get(key); return True
        except KeyError: return False

class MemoryStorage(Storage):
    def __init__(self): self.d = {}
    def put(self, k, v): self.d[k] = v
    def get(self, k): return self.d[k]

try:
    Storage()
except TypeError as e:
    print("abstract:", e)
print(isinstance(MemoryStorage(), Storage))`,
        codeLanguage: "python",
        explanation: "ABCs block incomplete instantiation via @abstractmethod bookkeeping, support shared concrete helpers, and can adopt foreign classes through register()/__subclasshook__ virtual membership.",
      },
      {
        id: "pyo10",
        question: "What is duck typing? Give examples and trade-offs.",
        answer: "**\"If it walks like a duck and quacks like a duck...\"** — Python cares about BEHAVIOR (available operations), not declared lineage. Any object usable where needed ops exist passes; isinstance gates unnecessary.\n\n**Canonical examples**:\n- len() accepts anything defining __len__ (custom containers \"just work\").\n- File-like objects: code writing .write() accepts real files, io.StringIO, sockets, mocks — testability superpower.\n- Iteration consumes anything with __iter__/__getitem__.\n- sorted(key=...) takes any unary callable.\n\n**Trade-offs**:\n✓ Flexibility, minimal coupling, easy mocking/plugin ecosystems, generic algorithms free.\n✗ Errors surface LATE (mid-operation AttributeError instead of entry check), unclear contracts (which attrs ARE required?), refactoring risk invisible.\n\n**Modern reconciliation**:\n1. typing.Protocol (structural typing): declare REQUIRED members; mypy verifies statically while runtime stays duck-typed (no inheritance demanded!). runtime_checkable enables isinstance-by-shape checks.\n2. EAFP idiom: try/except around capability use instead of pre-flight hasattr.\n3. Document contracts in docstrings/type hints even without enforcement.\n\nAnswer arc interviewers love: define → example → weakness → Protocol as typed duck typing evolution — shows historical + contemporary command.",
        code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Closer(Protocol):
    def close(self) -> None: ...

def use_and_close(resource):        # duck-typed consumer
    resource.write("data")
    resource.close()

use_and_close(open("/tmp/x", "w"))
import io
buf = io.StringIO()
use_and_close(buf)                  # StringIO quacks!
print(isinstance(buf, Closer))      # True — structurally

try:
    use_and_close(object())         # no write/close
except AttributeError as e:
    print("late failure:", e)`,
        codeLanguage: "python",
        explanation: "Duck typing dispatches on present capabilities, not class trees — flexible and mock-friendly, with late errors now mitigated statically by typing.Protocol structural checks.",
      },
      {
        id: "pyo11",
        question: "Explain dunder methods: __str__ vs __repr__, __eq__/__hash__, __len__, __call__.",
        answer: "**Dunder (magic) methods** let classes plug into language protocols — operators, iteration, printing, truthiness.\n\n**__str__ / __repr__**: user-facing vs developer-facing text (str()/print vs repr/debugger/containers). Missing __str__ falls back to __repr__ — implement repr first, eval-friendly convention.\n\n**__eq__ / __hash__ CONTRACT**: defining __eq__ sets __hash__ to None unless also defined — instances become UNHASHABLE silently! Rules: equal objects MUST hash equal; hash should use same immutable fields. Mutable-state equality breaks dict keys (key mutated → orphaned bucket). dataclasses(eq=True) auto-manages pair; frozen=True keeps safe.\n\n**__len__ / __bool__**: len() protocol; truthiness (bool preferred, else __len__≠0).\n\n**__call__**: instances become invokable (stateful functions/decorators).\n\n**Others worth naming**: __iter__/__next__ (iteration), __getitem__ (+legacy iteration fallback & slices), __contains__ (in), __enter__/__exit__ (context managers), __getattr__/__getattribute__ (attribute interception), arithmetic family __add__ et al. with reflected variants, __slots__ (memory/layout).\n\n**Anti-pattern warning**: don't invent your own __weird__ names (reserved); don't override __getattribute__ casually (breaks everything subtly).\n\nCompact Point class demonstrating eq/hash/str/repr quartet lands the answer.",
        code: `class Point:
    __slots__ = ("x", "y")          # fixed layout, no __dict__
    def __init__(self, x, y):
        object.__setattr__(self, 'x', x); object.__setattr__(self, 'y', y)
    def __eq__(self, o):
        return isinstance(o, Point) and (self.x, self.y) == (o.x, o.y)
    def __hash__(self):
        return hash((self.x, self.y))
    def __repr__(self):
        return f"Point({self.x}, {self.y})"
    def __len__(self): return 2
    def __add__(self, o): return Point(self.x + o.x, self.y + o.y)

pts = {Point(1, 2): "origin-ish"}
print(Point(1, 2) in pts, Point(1, 2) + Point(3, 4))
try:
    Point(0, 0).z = 9
except AttributeError as e:
    print("slots:", e)`,
        codeLanguage: "python",
        explanation: "Dunders wire classes into core protocols — repr-first printing, paired eq/hash (else unhashable!), len/bool truthiness, call/iter/context hooks and operator overloads.",
      },
      {
        id: "pyo12",
        question: "What are dataclasses and what problems do they solve?",
        answer: "**@dataclass** (PEP 557, 3.7+) generates boilerplate from annotated fields: __init__, __repr__, __eq__ (and optionally __hash__/ordering) — killing repetitive init/repr/equality handwriting.\n\n**Field toolkit**:\n- field(default_factory=list) — THE safe mutable-default solution.\n- field(init=False, repr=False, compare=False) per-field participation control.\n- frozen=True → immutable instances (write attempts raise FrozenInstanceError) enabling hashing (eq=True implied) and thread-safe sharing.\n- slots=True (3.10+) → memory-light, attribute-typo-proof.\n- kw_only=True (3.10+) forces keyword construction.\n- __post_init__ hook validates/cross-derives after generated init (needs InitVar for init-only params).\n\n**Hierarchy of record options**: namedtuple/NamedTuple (tuple-compatible, immutable), plain dataclass (mutable value object), frozen dataclass (value object/hashable), attrs library (predecessor, richer validators/converters), pydantic BaseModel (validation+serialization layer atop annotations — FastAPI staple).\n\n**When NOT dataclass**: behavior-heavy domain models (plain classes), dynamic schemas (dicts), performance-critical numeric arrays (numpy/pandas structures).\n\nShow mutable-default trap FIXED plus frozen+slots combo — practical maturity markers.",
        code: `from dataclasses import dataclass, field

@dataclass(frozen=True, slots=True)
class OrderItem:
    sku: str
    qty: int
    tags: frozenset[str] = field(default_factory=frozenset)

@dataclass
class Cart:
    items: list[OrderItem] = field(default_factory=list)  # safe mutable default
    def total(self, price_of):
        return sum(price_of(i.sku) * i.qty for i in self.items)
    def __post_init__(self):
        if not isinstance(self.items, list):
            raise TypeError("items must be list")

cart = Cart()
cart.items.append(OrderItem("SKU1", 2, frozenset({"gift"})))
print(cart)
print(cart == Cart(items=[OrderItem("SKU1", 2)]))  # False (tags differ)`,
        codeLanguage: "python",
        explanation: "dataclasses synthesize init/repr/eq from annotations — with default_factory, frozen/slots/kw_only switches and __post_init__ covering validation and immutability needs.",
      },
      {
        id: "pyo13",
        question: "What is __slots__ and when should you use it?",
        answer: "__slots__ = (\"x\", \"y\") replaces the per-instance dynamic __dict__ with FIXED storage slots — declaring exactly which attributes exist.\n\n**Benefits**:\n1. **Memory**: eliminates instance dict (~50–70% smaller for small objects) — millions of points/rows add up dramatically. (Note: since 3.11+, instances with __dict__ got leaner via keyed sharing, but slots still wins.)\n2. **Speed**: slot access slightly faster (direct offsets vs dict hash lookup); attribute typos fail FAST with AttributeError instead of silent creation.\n3. **Contract enforcement**: accidental new attributes impossible — typo self.nmae = ... explodes immediately rather than ghost-failing reads.\n\n**Costs/gotchas**:\n- No dynamic attributes (getattr defaults break); weakref requires '__weakref__' in slots explicitly.\n- Inheritance subtleties: parents WITH slots + children adding slots coexist; child without __slots__ reintroduces __dict__; multiple bases with nonempty slots conflict (layout clash TypeError).\n- Interacts with dataclasses(slots=True) generating this for you.\n- Pickle/copy generally fine; some libs introspecting __dict__ degrade.\n\n**Verdict**: default plain classes for flexibility; deploy slots for MASS-INSTANTIATED records (grid cells, particles, parsed rows) or strict-API surfaces. Measure with tracemalloc before/after — evidence-based adoption.",
        code: `import tracemalloc

class Plain:
    def __init__(self, a, b): self.a, self.b = a, b

class Slotted:
    __slots__ = ("a", "b")
    def __init__(self, a, b): self.a, self.b = a, b

tracemalloc.start()
many_plain = [Plain(1, 2) for _ in range(200_000)]
p_mem = tracemalloc.get_traced_memory()[0]
tracemalloc.reset_peak()
many_slot = [Slotted(1, 2) for _ in range(200_000)]
s_mem = tracemalloc.get_traced_memory()[0]
tracemalloc.stop()
print(f"plain={p_mem/1e6:.1f}MB slotted={s_mem/1e6:.1f}MB")

try:
    Slotted(1, 2).oops = 1
except AttributeError as e:
    print("blocked:", e)`,
        codeLanguage: "python",
        explanation: "__slots__ trades dynamic attributes for fixed-offset storage — big memory savings and typo-proofing at scale, with inheritance/weakref caveats to respect.",
      },
      {
        id: "pyo14",
        question: "What are metaclasses? When (if ever) do you need one?",
        answer: "Classes themselves are OBJECTS — instances of their METACLASS (default type). Defining metaclass=MyMeta customizes CLASS CREATION: intercept __init__/__new__ of the class object itself (validate attributes, auto-register subclasses, inject methods, enforce interfaces).\n\n**Mechanics**: class Foo(metaclass=MyMeta) → MyMeta(name, bases, ns) runs at definition time. __init_subclass__ + __set_name__ (3.6+) cover MOST former metaclass jobs WITHOUT metaclass complexity — prefer them first!\n\n**Legitimate remaining uses**:\n1. Framework registries collecting all subclasses (ORM model discovery — though __init_subclass__ suffices usually).\n2. Enforcing cross-cutting invariants across every subclass (abstract enforcement predates abc; API surface locking).\n3. Customizing INSTANCE-call behavior globally (type.__call__ override controlling instantiation — singleton/pooling).\n4. abc.ABCMeta itself, Enum.Meta, Protocol interplay — stdlib precedent.\n\n**Tim Peters' law**: \"If you're unsure whether you need metaclasses, you don't.\" Complexity: interaction surprises (multiple metaclasses conflict requiring common base), debugging opacity, team readability cost.\n\nInterview stance: explain mechanics confidently, then advocate __init_subclass__/decorators/protocols as modern replacements — restraint signals seniority.",
        code: `class Registered(type):
    registry = {}
    def __new__(mcls, name, bases, ns):
        cls = super().__new__(mcls, name, bases, ns)
        if bases:                       # skip the root itself
            Registered.registry[name] = cls
        return cls

class Plugin(metaclass=Registered): pass
class EmailPlugin(Plugin): pass
class SmsPlugin(Plugin): pass

print(list(Registered.registry))

# modern alternative — no metaclass:
class Base:
    def __init_subclass__(cls, **kw):
        super().__init_subclass__(**kw)
        Base.known = getattr(Base, "known", []) + [cls]

class A(Base): pass
print(Base.known)`,
        codeLanguage: "python",
        explanation: "Metaclasses are class-factories hooking class creation for registries/invariants — but __init_subclass__/__set_name__ now handle most needs; invoke them before reaching for metaclass machinery.",
      },
      {
        id: "pyo15",
        question: "Composition vs inheritance — how do you choose in Python?",
        answer: "**Inheritance = is-a** (substitutable specialization); **composition = has-a** (delegation to parts). Modern Python guidance heavily favors composition + protocols for flexibility.\n\n**Choose inheritance when**:\n- Genuine substitutability holds (Circle IS-A Shape satisfying LSP everywhere Shape used).\n- Framework contract demands it (extend View, TestCase, Exception).\n- Mixins ADD narrow orthogonal capability with cooperative super() discipline.\n- Polymorphic dispatch across heterogeneous collections via shared base/ABC.\n\n**Choose composition when**:\n- Reusing IMPLEMENTATION without behavioral contract (Engine inside Car — Car is-not-an Engine).\n- Behavior varies AT RUNTIME (strategy injection: payment_method param vs PaymentType hierarchy explosion).\n- Avoiding fragile-base-class coupling: parent changes ripple invisibly; delegation draws explicit boundaries.\n- Testing seams: injected collaborators mock trivially; inherited internals entangle.\n\n**Python-specific levers weakening inheritance's pull**: duck typing + Protocol remove NEED for shared base to be interchangeable; monkey-free wrappers trivial; decorators wrap behavior; dataclasses compose value payloads cheaply.\n\n**Heuristic to voice**: inherit for CONTRACTS (few, stable, shallow ≤2 levels); compose for CAPABILITIES. Deep taxonomies smell like taxonomy-for-its-own-sake.",
        code: `class Engine:
    def start(self): return "vroom"

class Car:                              # HAS-A engine
    def __init__(self, engine): self.engine = engine
    def drive(self): return self.engine.start()

class LoggingEngine:                    # decorator-composition variant
    def __init__(self, inner): self.inner = inner
    def start(self):
        print("engine requested")
        return self.inner.start()

car = Car(LoggingEngine(Engine()))
print(car.drive())

class Shape:                            # genuine is-a contract
    def area(self): raise NotImplementedError

class Square(Shape):
    def __init__(self, s): self.s = s
    def area(self): return self.s ** 2`,
        codeLanguage: "python",
        explanation: "Inherit only for true substitutable contracts and framework hooks; compose (inject/wrap/delegate) for capabilities — Python's duck typing and protocols make composition frictionless.",
      },
      {
        id: "pyo16",
        question: "How do you implement a Singleton in Python? Are there better alternatives?",
        answer: "**Implementation menu**:\n1. **Module-level instance** (idiomatic singleton): config.py holds one instance; imports share it (modules cached in sys.modules). Zero machinery — often THE answer.\n2. **Metaclass-controlled**: override type.__call__ caching instance per class (thread-safe with lock) — classic interview version.\n3. **__new__ guard**: cls._instance check in __new__ (init reruns though! coordinate carefully).\n4. **Borg/shared-state**: all instances share __dict__ (identity differs, state identical).\n5. functools.lru_cache on constructor or dependency-injection container registration.\n\n**Thread-safety caveat**: lazy creation races — wrap with threading.Lock or accept eager module-import creation (GIL serializes imports adequately for typical cases).\n\n**Why interviewers push back**: singletons hide global state, complicate tests (reset burden between tests), invite ordering bugs. Alternatives:\n- Dependency INJECTION: create once in main/composition-root, PASS explicitly — testable, visible lifetimes.\n- Module constants for genuinely static config.\n- Context-local singletons (contextvars) for per-request scope in web apps.\n\nDeliver: quick metaclass snippet + \"but I'd inject it\" close — implementation skill plus architectural judgment.",
        code: `import threading

class SingletonMeta(type):
    _instances = {}
    _lock = threading.Lock()
    def __call__(cls, *a, **kw):
        if cls not in cls._instances:
            with cls._lock:
                if cls not in cls._instances:     # double-checked
                    cls._instances[cls] = super().__call__(*a, **kw)
        return cls._instances[cls]

class AppConfig(metaclass=SingletonMeta):
    def __init__(self):
        self.settings = {"env": "prod"}

a, b = AppConfig(), AppConfig()
print(a is b, a.settings)

# preferred: explicit wiring
class Service:
    def __init__(self, config): self.config = config
svc = Service(AppConfig())        # dependency injection`,
        codeLanguage: "python",
        explanation: "Singletons via metaclass/__new__ work (lock for threads), but module instances or explicit dependency injection usually serve better — hidden globals tax testing and reasoning.",
      },
      {
        id: "pyo17",
        question: "What is __new__ and how does it differ from __init__?",
        answer: "Object creation is TWO phases: **__new__(cls, ...)** STATIC method ALLOCATES and RETURNS the instance (default: object.__new__ via type.__call__); **__init__(self, ...)** then INITIALIZES that returned object (implicitly returns None).\n\n**Override __new__ when you must control WHAT object exists**, not just configure it:\n1. Singleton/instance pooling (return cached).\n2. Immutables: int/str/tuple subclasses REQUIRE __new__ (can't mutate after init) — e.g., caching interned values, normalizing in constructor: class PositiveInt(int) validating in __new__.\n3. Returning instances of DIFFERENT/subclass types (factory-ish constructors, alternate bases selection).\n4. Metaclass plumbing/intercepting instantiation globally (type.__call__ level).\n\n**Signature choreography**: whatever __new__ receives flows to __init__ too; mismatches raise TypeError. Forgetting to RETURN from __new__ yields None objects (classic bug!). object.__new__(cls) manual call needed when overriding with extra args and custom __init__ handling them.\n\n**Rule of thumb**: 99% cases __init__ suffices; reach for __new__ for allocation-level control (caching, immutables, alternate types). Demonstrate PositiveInt and a memoizing __new__.",
        code: `class Positive(int):
    def __new__(cls, value):
        if value <= 0:
            raise ValueError("must be positive")
        return super().__new__(cls, value)   # immutable: build right

p = Positive(5)
print(p, p + 1, isinstance(p, int))
try:
    Positive(-1)
except ValueError as e:
    print(e)

class Cached:
    cache = {}
    def __new__(cls, key):
        if key not in cls.cache:
            inst = super().__new__(cls)
            inst.key = key
            cls.cache[key] = inst
        return cls.cache[key]

print(Cached("a") is Cached("a"))`,
        codeLanguage: "python",
        explanation: "__new__ allocates-and-returns (static, cls-first) before __init__ configures — override it for immutables, caching/singletons, or returning different types; never forget to return.",
      },
      {
        id: "pyo18",
        question: "How does operator overloading work? Show reflected and in-place variants.",
        answer: "Special methods map operators to behavior: a + b tries **a.__add__(b)**; if NotImplemented (sentinel!) returns, Python retries **REFLECTED b.__radd__(a)** — enabling mixed-type support without knowing peer's class.\n\n**Family snapshot**: arithmetic (__add__ __sub__ __mul__ __truediv__ __floordiv__ __mod__ __pow__), reflected (r-prefix), augmented (__iadd__ preferring in-place mutate-return-self, falling back to __add__ rebind), comparisons (__eq__ __ne__ __lt__ __le__ __gt__ __ge__ with swap+fallback rules), unary (__neg__ __pos__ __abs__ ~__invert__), bitwise/shifts, container extras (__contains__ via __iter__ fallback).\n\n**Best practices**:\n- Return **NotImplemented** (not raise NotImplementedError!) for unsupported operand types — hands control back to interpreter for reflected attempt then TypeError.\n- Symmetric handling: Vector + int vs int + Vector both sensible via radd.\n- Keep semantic sanity: __eq__ pairs with __hash__; rich comparisons ideally consistent (functools.total_ordering derives rest from __eq__+__lt__).\n- Don't overload surprising meanings (+ for unrelated concepts harms readability).\n\nNumPy/pandas demonstrate ecosystem-scale overloading (element-wise arrays). Demo vector with add/radd/iadd + total_ordering money class.",
        code: `from functools import total_ordering

class Vec:
    def __init__(self, x, y): self.x, self.y = x, y
    def __add__(self, o):
        if isinstance(o, Vec): return Vec(self.x + o.x, self.y + o.y)
        if isinstance(o, (int, float)): return Vec(self.x + o, self.y + o)
        return NotImplemented
    __radd__ = __add__                      # scalar + Vec too
    def __iadd__(self, o):
        r = self.__add__(o)
        return r if r is NotImplemented else r
    def __repr__(self): return f"Vec({self.x},{self.y})"

print(Vec(1, 2) + Vec(3, 4), 5 + Vec(1, 1))

@total_ordering
class Money:
    def __init__(self, amt): self.amt = amt
    def __eq__(self, o): return self.amt == o.amt
    def __lt__(self, o): return self.amt < o.amt

print(Money(3) < Money(5), Money(5) >= Money(5))`,
        codeLanguage: "python",
        explanation: "Operators resolve via special methods with NotImplemented handshakes to reflected twins; in-place variants prefer mutation — overload semantically, pair eq/hash, leverage total_ordering.",
      },
      {
        id: "pyo19",
        question: "What are descriptors? How does property relate to them?",
        answer: "**Descriptors** customize attribute ACCESS at the CLASS level: any object defining __get__/__set__/__delete__ placed as a CLASS attribute intercepts those operations on instances. They are the machinery UNDER property, methods, classmethod, staticmethod, functions' binding, slots, ORM columns!\n\n**Two flavors**:\n- DATA descriptor: defines __set__ (and/or __delete__) — takes PRIORITY over instance __dict__ (property is data → why setting over a property raises even if instance dict holds name).\n- NON-data: __get__ only — instance __dict__ WINS over it (how instance attributes can shadow methods).\n\nPriority order: data descriptors → instance __dict__ → non-data descriptors → class attrs fallback.\n\n**Reusable validator pattern** (property's generalization across MANY attributes):\nclass Positive:\n    def __set_name__(self, owner, name): self.name = name   # 3.6+\n    def __get__(self, obj, objtype=None): return obj.__dict__[self.name]\n    def __set__(self, obj, value):\n        if value <= 0: raise ValueError(...)\n        obj.__dict__[self.name] = value\nThen class Order: qty = Positive(); price = Positive() — DRY validation.\n\n**When to reach**: repeated per-attribute logic (typed columns, lazy loading, caching, deprecation warnings) — beyond 2–3 properties, descriptors pay off. __set_name__ removes string duplication elegantly.",
        code: `class Positive:
    def __set_name__(self, owner, name):
        self.public = name
    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return obj.__dict__[self.public]
    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(f"{self.public} must be > 0")
        obj.__dict__[self.public] = value

class Order:
    qty = Positive()
    price = Positive()
    def __init__(self, qty, price):
        self.qty, self.price = qty, price

o = Order(2, 9.99)
print(o.qty, o.price)
try:
    o.price = -1
except ValueError as e:
    print("guarded:", e)`,
        codeLanguage: "python",
        explanation: "Descriptors intercept attribute access class-wide (data ones beat instance dicts); property is a bespoke instance — generalize repeated attribute logic via __get__/__set__ + __set_name__.",
      },
      {
        id: "pyo20",
        question: "What common OOP mistakes trip up candidates in interviews?",
        answer: "Rapid-fire trap catalog:\n\n**1. Shared mutable class attributes** — class Dog: tricks=[] accumulates across ALL instances; fix per-instance init. Top-asked bug.\n\n**2. Believing __x is private** — name mangling ≠ security; know _Class__x access and its REAL purpose (subclass collision safety).\n\n**3. super() misconceptions** — treating it as \"parent call\" in multiple inheritance (double-init diamonds); failing to call super().__init__ at all in cooperative chains.\n\n**4. Forgetting self parameter** or calling instance methods on the class directly.\n\n**5. Defining __eq__ without __hash__** — instances silently unhashable; broken dict/set behavior.\n\n**6. Mutating default state in __init__ via class-level mutable** (same as #1 wearing disguise) or leaking mutable args into attributes WITHOUT copying (aliasing caller's list!).\n\n**7. Confusing @staticmethod/@classmethod** — factories written as static losing subclass correctness.\n\n**8. God-objects / deep inheritance** — ignoring composition; 5-level taxonomies.\n\n**9. Properties doing heavy/expensive IO silently** — attribute syntax implies cheapness; surprise latency.\n\n**10. Overriding __getattr__ without guarding recursion** (accessing self.attr inside triggers loop) or confusing it with __getattribute__.\n\nPick two to narrate with war-story detail; rapid-list the rest — calibrated depth impression.",
        code: `class Team:
    members = []                    # BUG 1: shared
    def __init__(self, name, roster=None):
        self.name = name
        self.roster = roster if roster is not None else []  # FIX pattern

t1, t2 = Team("A"), Team("B")
t1.members.append("ghost")          # appears in t2.members too!
print(t2.members)

class Node:
    def __init__(self): self.children = []
    def __getattr__(self, name):    # careful: only MISSES land here
        if name.startswith("_"):
            raise AttributeError(name)
        return f"<auto:{name}>"

n = Node()
print(n.whatever, n.children)`,
        codeLanguage: "python",
        explanation: "Usual suspects: class-level mutables, mangling-as-security myths, super() misuse, missing hash twin, aliasing caller lists, static-vs-class confusion, recursive __getattr__.",
      },
    ],
  },
  {
    id: "decorators",
    title: "Decorators, Closures & Functional Tools",
    icon: "🎩",
    questions: [
      {
        id: "pyt1",
        question: "What is a decorator and how does the @ syntax work?",
        answer: "A **decorator** is a callable taking a function/class and returning a (usually enhanced) replacement. The **@decorator** line above a def is pure sugar:\n\n@timer\ndef work(): ...\n≡ work = timer(work)\n\nExecuted ONCE at definition time (import time) — the wrapper then intercepts every CALL.\n\n**Anatomy of the canonical wrapper**:\nimport functools\ndef timer(fn):\n    @functools.wraps(fn)             # preserve identity!\n    def wrapper(*args, **kwargs):\n        start = perf_counter()\n        try:\n            return fn(*args, **kwargs)\n        finally:\n            print(perf_counter()-start)\n    return wrapper\n\n**Essential disciplines**:\n1. **functools.wraps(fn)** copies __name__/__doc__/__wrapped__/annotations — without it decorated APIs lose introspection (help, docs, frameworks, pickling). Senior litmus.\n2. Forward *args/**kwargs transparently.\n3. Return the ORIGINAL result.\n4. Wrapper signature stays generic; inspect.signature follows __wrapped__ automatically.\n\n**Stacking order**: decorators apply BOTTOM-UP (@a @b def f ≡ a(b(f))) — mental-model: nearest decorator wraps tightest.\n\nBeyond functions: classes as decorators, decorating CLASSES (registry/patching), builtins @property/@staticmethod/@lru_cache as proof of pervasiveness.",
        code: `import functools, time

def timed(fn):
    @functools.wraps(fn)
    def wrapper(*a, **kw):
        t0 = time.perf_counter()
        try:
            return fn(*a, **kw)
        finally:
            ms = (time.perf_counter() - t0) * 1000
            print(f"{fn.__name__}: {ms:.1f}ms")
    return wrapper

@timed
def crunch(n):
    return sum(i * i for i in range(n))

print(crunch.__name__)      # crunch — wraps worked
crunch(200_000)`,
        codeLanguage: "python",
        explanation: "Decorators replace definitions at import time (f = dec(f)); wrappers forward *args/**kwargs, return results, and must wear functools.wraps to keep identity intact.",
      },
      {
        id: "pyt2",
        question: "How do you write decorators that accept arguments?",
        answer: "Argument-taking decorators need an EXTRA layer — a decorator FACTORY:\n\n@retry(times=3)\ndef flaky(): ...\n≡ flaky = retry(times=3)(flaky)   # retry(times=3) runs FIRST returning the real decorator\n\n**Three-tier anatomy**:\ndef retry(times):\n    def decorator(fn):\n        @functools.wraps(fn)\n        def wrapper(*a, **kw):\n            for attempt in range(1, times + 1):\n                try: return fn(*a, **kw)\n                except TransientError:\n                    if attempt == times: raise\n                    sleep(backoff(attempt))\n        return wrapper\n    return decorator\nClosure captures: times → decorator → wrapper (LEGB chain doing real work).\n\n**Supporting BOTH styles** (@dec and @dec(args)):\ndef flexible(fn=None, *, opt=default):\n    def deco(f): ...return wrapper\n    return deco(fn) if fn is not None else deco\nBare usage receives the function directly; parenthesized usage gets kwargs first.\n\n**Class-based alternative**: __init__(self, times) stores config, __call__(self, fn) returns wrapper — cleaner for complex/configurable/stateful decorations.\n\nAlso mention preserving signatures for type-checkers (ParamSpec in modern typing) as polish.",
        code: `import functools, itertools

def retry(times, exceptions=(Exception,)):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*a, **kw):
            for i in range(times):
                try:
                    return fn(*a, **kw)
                except exceptions as e:
                    if i == times - 1:
                        raise
                    print(f"attempt {i+1} failed ({e}), retrying...")
        return wrapper
    return decorator

flakes = iter([ValueError("x"), ValueError("y"), "ok"])

@retry(times=3, exceptions=(ValueError,))
def unstable():
    v = next(flakes)
    if isinstance(v, Exception):
        raise v
    return v

print(unstable())`,
        codeLanguage: "python",
        explanation: "Parameterized decorators are three-deep closures — factory captures config, middle layer takes the function, wrapper executes; dual-mode support detects bare-function application.",
      },
      {
        id: "pyt3",
        question: "Why is functools.wraps essential in decorators?",
        answer: "Without wraps, the WRAPPER's metadata REPLACES the wrapped function's — breaking introspection-dependent machinery.\n\n**What leaks without it**:\n- fn.__name__ becomes \"wrapper\" → tracebacks/logs/docs useless.\n- __doc__ lost → help() empty; doc-tooling skips.\n- __module__, __qualname__ wrong; __annotations__/__dict__ dropped → type hints vanish for mypy/IDEs/frameworks (FastAPI/FastMCP rely on annotations!).\n- __wrapped__ absent → inspect.signature(wrapper) shows (*args, **kwargs) instead of REAL parameters; linters/tests misfire.\n\n**functools.wraps(fn)** copies WRAPPER_ASSIGNMENTS (module/name/qualname/annotations/doc/dict-update) AND sets __wrapped__ = fn — making signature inspection follow through decoration layers.\n\n**Chained decorators**: each layer should wraps() the incoming fn so metadata survives N-deep stacks.\n\n**Edge knowledge**:\n- wraps returns a decorator itself (partial(update_wrapper, ...)).\n- updated=('__dict__',) controls which attrs merge.\n- For CLASS-based decorators, manually assign or provide __wrapped__.\n\nQuick demo contrasting naked-wrapper name vs wrapped name + signature fidelity — visceral proof interviewers remember.",
        code: `import functools, inspect

def naked(fn):
    def wrapper(*a, **kw): return fn(*a, **kw)
    return wrapper

def proper(fn):
    @functools.wraps(fn)
    def wrapper(*a, **kw): return fn(*a, **kw)
    return wrapper

@naked
def alpha(x: int) -> str: "docs"; return str(x)

@proper
def beta(x: int) -> str: "docs"; return str(x)

print(alpha.__name__, alpha.__doc__, alpha.__annotations__)
print(beta.__name__, beta.__doc__, beta.__annotations__)
print(inspect.signature(beta))      # (x: int) -> str`,
        codeLanguage: "python",
        explanation: "wraps copies name/doc/annotations/qualname and plants __wrapped__ so logs, docs, type-checkers and signature inspection see THROUGH your decorator layers.",
      },
      {
        id: "pyt4",
        question: "How do class-based decorators work and when do they beat closures?",
        answer: "Any callable decorates — including INSTANCES whose class implements **__init__(self, fn)** storing the target and **__call__(self, *a)** performing duty. @Decorator syntactically instantiates Decorator(fn).\n\n**Structure**:\nclass CountCalls:\n    def __init__(self, fn):\n        functools.update_wrapper(self, fn)   # manual wraps-equivalent\n        self.fn = fn\n        self.count = 0\n    def __call__(self, *a, **kw):\n        self.count += 1\n        return self.fn(*a, **kw)\n\n@CountCalls\ndef greet(): ...\ngreet(); greet(); greet.count  → 2\n\n**Advantages over closure decorators**:\n1. **Explicit STATE**: attributes beat nonlocal juggling (counters, caches, history).\n2. **Richer API**: extra METHODS/properties on the decorator (reset(), stats, invalidate_cache()).\n3. **Parameterized decorators WITHOUT triple nesting**: __init__(times) + __call__(fn) two-layer clarity.\n4. Inheritance/composition reuse across decorator families; easier unit-testing of decorator logic itself.\n\n**Watch-outs**: update_wrapper copies onto INSTANCE (works, slight nuance vs wraps); pickling decorated callables; instance-per-function memory.\n\n**Sweet spots**: rate limiters, circuit breakers, memoization with eviction policy, task registries — anywhere decorator carries operational state/config.",
        code: `import functools

class RateLimit:
    def __init__(self, max_calls, clock=lambda: 0):
        functools.update_wrapper(self, lambda: None)
        self.max_calls, self.clock = max_calls, clock
        self.window_start = None
        self.calls = 0
    def __call__(self, fn):
        def wrapper(*a, **kw):
            now = self.clock()
            if self.window_start is None or now - self.window_start >= 1:
                self.window_start, self.calls = now, 0
            self.calls += 1
            if self.calls > self.max_calls:
                raise RuntimeError("rate limited")
            return fn(*a, **kw)
        functools.update_wrapper(wrapper, fn)
        return wrapper

@RateLimit(max_calls=2)
def ping():
    return "pong"

print(ping(), ping())
try:
    ping()
except RuntimeError as e:
    print(e)`,
        codeLanguage: "python",
        explanation: "Instances with __init__(config)+__call__(fn) act as decorators carrying real attributes — ideal when wrapping needs state, extra APIs, or simpler parameterization than nested closures.",
      },
      {
        id: "pyt5",
        question: "How do you decorate a class (not a function)?",
        answer: "Class decorators receive the CLASS and return a (usually modified/new) class — running at definition time like function counterparts.\n\n**Common applications**:\n1. **Registries/plugins**: collect decorated classes into dict for factory lookup (command patterns, ORM table discovery, CLI subcommands).\n2. Attribute patching: wrap every public method with logging/auth/timing (loop names, setattr wrapped versions).\n3. Adding methods/mixins dynamically: attach to_dict/from_row helpers.\n4. Enforcing contracts: final-sealing (reject subclassing via __init_subclass__ alternative), interface audits at class creation.\n5. Versioning/provenance stamps: cls.__version__ = \"2\" metadata.\n\n**Modern alternatives often cleaner**: __init_subclass__ hook (inheritance-driven registry without decorator noise), __set_name__ (descriptor wiring), plain inheritance, dataclasses.transform utilities. Choose decorator when marking OPTIONAL/opt-in behaviors; hooks when ALL subclasses participate.\n\n**Pitfalls**: forgetting to RETURN the class (whole class becomes None!), wrapping methods breaks super() introspection unless functools.wraps applied, interacting poorly with pickling if replaced by proxies.\n\nDemo registry + method-wrapping duo — the two patterns asked 90% of the time.",
        code: `import functools

TASKS = {}

def register(name):
    def deco(cls):
        TASKS[name] = cls
        return cls
    return deco

def trace_methods(cls):
    for attr, val in list(vars(cls).items()):
        if callable(val) and not attr.startswith("__"):
            setattr(cls, attr, _trace(val))
    return cls

def _trace(fn):
    @functools.wraps(fn)
    def w(*a, **kw):
        print("->", fn.__name__)
        return fn(*a, **kw)
    return w

@register("email")
@trace_methods
class EmailTask:
    def run(self):
        return "sent"

print(TASKS["email"]().run())
print(list(TASKS))`,
        codeLanguage: "python",
        explanation: "Class decorators transform/collect whole classes at definition time — registries and method-wrapping sweeps are staples; __init_subclass__ is the inheritance-flavored sibling worth citing.",
      },
      {
        id: "pyt6",
        question: "What are closures' practical uses beyond decorators?",
        answer: "Closures = functions retaining enclosing-scope state — decorators are just the famous application:\n\n**1. Factories/configured builders**: make_validator(min, max) returns specialized validators; template renderers pre-bound to context. Beats passing config through every call.\n\n**2. Private state machines**: counter/throttle/token-bucket with nonlocal counters — lighter than classes for single-behavior state.\n\n**3. Callbacks capturing context**: UI handlers, event listeners, async continuations remembering surrounding locals without plumbing.\n\n**4. Memoization tables**: cache dict in enclosing scope (hand-rolled lru_cache precursor).\n\n**5. Currying/partial pipelines**: step generators composing transforms (add_x then scale_y chains).\n\n**6. Test doubles**: stub functions closing over scripted responses; assertion spies recording calls list.\n\n**7. Lazy initialization guards**: compute-once values captured post-first-use (cheap cached_property substitute).\n\n**Gotchas recap**: late-binding loops (bind via defaults), state sharing surprises when factory reused, harder pickling vs top-level functions, memory retention keeping LARGE enclosing objects alive unintentionally (cell references!) — release via setting locals None.\n\nInterview framing: closures give FUNCTION-grained encapsulation — state without ceremony; classes when behavior MULTIPLIES.",
        code: `def number_range(lo, hi):
    def check(v):
        return lo <= v <= hi
    return check

age_ok = number_range(18, 120)
port_ok = number_range(1, 65535)
print(age_ok(25), port_ok(999999))

def spy(fn):
    calls = []
    def wrapper(*a, **kw):
        calls.append((a, kw))
        return fn(*a, **kw)
    wrapper.calls = calls
    return wrapper

@spy
def add(a, b): return a + b
add(1, 2); add(3, 4)
print(add.calls)`,
        codeLanguage: "python",
        explanation: "Beyond decorators, closures deliver configured factories, private state, context-carrying callbacks, memo tables and test spies — function-scoped encapsulation without classes.",
      },
      {
        id: "pyt7",
        question: "What is currying and how does partial relate?",
        answer: "**Currying** transforms f(a, b, c) into chained unary calls f(a)(b)(c) — Haskell-style function decomposition. Python favors PARTIAL APPLICATION instead: fix SOME arguments now, supply rest later (functools.partial).\n\n**Hand-rolled curry** (educational):\ndef curry(fn):\n    def curried(*args):\n        if len(args) >= fn.__code__.co_argcount:\n            return fn(*args)\n        return lambda *more: curried(*args, *more)\n    return curried\n\n**Where partial application shines practically**:\n- Specializing existing APIs: hex2int = partial(int, base=16); send_json = partial(requests.post, headers=json_headers).\n- Callback prep: button.on_click(partial(save, doc_id)) freezing context WITHOUT lambda-loop capture traps.\n- Pipeline stages: process = partial(run, stage=\"clean\").\n- Multiprocessing worker binding (pickles more reliably than exotic closures).\n\n**Currying's niche in Python**: point-free composition experiments, unary-interface compliance (map expects 1-arg — curry then feed incrementally), functional libraries (toolz.curry) for data-flow DSLs.\n\n**Comparison verdict** to state: Python culture prefers explicit partials/named intermediates over deep currying — readability trumps elegance; know both vocabularies for polyglot interviews.",
        code: `from functools import partial

def volume(length, width, height):
    return length * width * height

cube = partial(volume, height=1)      # partially apply
brick = partial(volume, width=2, height=1)
print(cube(4), brick(5))

def curry(fn):
    def curried(*args):
        if len(args) >= fn.__code__.co_argcount:
            return fn(*args)
        return lambda *more: curried(*args, *more)
    return curried

c_vol = curry(volume)
print(c_vol(2)(3)(4), c_vol(2, 3)(4))`,
        codeLanguage: "python",
        explanation: "Currying chains unary functions f(a)(b)(c); Python pragmatism prefers partial application (functools.partial) fixing selected args — both delay completion, differing in call shape.",
      },
      {
        id: "pyt8",
        question: "What is monkey patching and when is it acceptable?",
        answer: "**Monkey patching = modifying classes/modules AT RUNTIME** after import: SomeClass.method = new_impl or module.func = stub. Legal because Python namespaces are mutable dicts underneath.\n\n**Legitimate niches**:\n1. **Testing**: mock.patch swapping collaborators/time.sleep/requests.get — THE sanctioned use (dependency seam without DI redesign).\n2. Emergency third-party hotfixes pending upstream release (documented, pinned, removal-planned).\n3. Library extension points DESIGNED for it: gevent/eventlet rewriting socket module wholesale for async transparency; pytest plugins augmenting protocols.\n4. Environment shims (sitecustomize startup patches).\n\n**Hazards**:\n- Action-at-a-distance: import-order dependent behavior; readers unaware.\n- Upgrade fragility: patched internals shift silently under library updates.\n- Concurrency races during rebinding; partial-application inconsistencies.\n- Debugging disorientation (stack shows source mismatching behavior).\n\n**Discipline when unavoidable**: centralize patches in ONE module with comments/link-to-issue, apply EARLY (before consumers import), assert assumptions (signature check), tests pinning behavior, deprecation plan.\n\n**Cleaner substitutes**: dependency injection, adapter/wrapper classes, subclassing, unittest.mock (structured patching with auto-undo!), Protocol-based seams. Answer posture: know mechanics cold, recommend containment.",
        code: `import time

def fake_sleep(seconds):
    print(f"[stubbed sleep {seconds}s]")

real_sleep = time.sleep
time.sleep = fake_sleep              # patch ON
time.sleep(5)                        # instant!
time.sleep = real_sleep              # restore (mock.patch automates this)

class Money:
    def cents(self): return 100

Money.euros = property(lambda self: self.cents() / 100)  # runtime extension
print(Money().euros)`,
        codeLanguage: "python",
        explanation: "Monkey patching rewires live namespaces — indispensable via mock.patch in tests, risky elsewhere: contain centrally, patch early, restore deterministically, prefer DI/seams.",
      },
      {
        id: "pyt9",
        question: "How does @cached_property differ from @property and lru_cache?",
        answer: "**Three lazy-value tools with distinct trade-offs**:\n\n**@property**: computes EVERY access — always fresh, no storage. Right for cheap derivations (area, full_name) or values needing live recalculation.\n\n**@cached_property** (functools, 3.8+): computes ONCE per instance then stores as regular instance attribute (self.__dict__[name]) — subsequent reads hit dict fast-path, SKIPPING the descriptor. Requirements: instances MUTABLE-dict'd (incompatible with __slots__ without tweaks!), value stable for instance lifetime. Ideal expensive deterministic derivations: parsed AST, DB aggregation, normalized payload.\n\n**@lru_cache on methods**: caches by ARGUMENT TUPLE INCLUDING SELF — global table shared across instances; pins instances alive (memory leak!) unless weakref tricks. Fits staticmethods/free functions; wrong default for per-instance values.\n\n**Invalidation story**: cached_property invalidation = del obj.attr then re-access recomputes (nice trick to teach); lru_cache needs cache_clear/global reasoning.\n\n**Decision matrix**: fresh-every-time → property; heavy+stable+per-instance → cached_property; pure function of args incl. cross-instance reuse → lru_cache; external volatility → explicit TTL/manual cache layer.\n\nDemo timing difference + delete-recompute trick — concrete differentiators.",
        code: `import functools, time

class Report:
    def __init__(self, n): self.n = n

    @property
    def fresh(self):
        time.sleep(0.05); return sum(range(self.n))     # every time

    @functools.cached_property
    def heavy(self):
        time.sleep(0.05); return sum(range(self.n))     # once

r = Report(300000)
t0=time.perf_counter(); r.fresh; r.fresh; print("fresh:", round(time.perf_counter()-t0,3))
t0=time.perf_counter(); r.heavy; r.heavy; print("cached:", round(time.perf_counter()-t0,3))
del r.heavy                                # force recompute next access`,
        codeLanguage: "python",
        explanation: "property recalculates per access; cached_property computes once then parks the value in the instance dict (delete to refresh); lru_cache keys on self too — risking leaks across instances.",
      },
      {
        id: "pyt10",
        question: "What built-in decorators should every Python developer know?",
        answer: "Inventory by purpose:\n\n**Method-role markers**: @staticmethod (no auto arg), @classmethod (cls receiver, alt-constructors), @property + .setter/.deleter (attribute-style logic).\n\n**Performance/memoization**: @functools.lru_cache(maxsize, typed) bounded memoization; @functools.cache (3.9, unbounded shorthand); @functools.cached_property (per-instance one-shot).\n\n**OOP protocol aids**: @functools.total_ordering (derive comparisons from eq+lt), @abstractmethod (abc contracts), @overload (typing-only signature sets), @final (discourage subclass/override — static checkers), @runtime_checkable (Protocol isinstance-by-shape).\n\n**Deprecation/tooling**: @warnings.deprecated (3.13) or custom warn-wrappers; @contextlib.contextmanager (generator→context manager factory — honorary decorator producing decorators-of-functions).\n\n**Async/concurrency**: none magical — but @asyncio.coroutine legacy (dead) worth recognizing historically; trio/anyio use plain async def now.\n\n**Functorial/misc**: @functools.singledispatch (type-based function overloading via registry! great interview garnish), @dataclasses.dataclass (record synthesis), @enum.unique.\n\nPrioritize demonstrating singledispatch + contextmanager fluency — less-common-but-standard signals depth beyond property/lru_cache clichés.",
        code: `import functools, contextlib

@functools.singledispatch
def describe(arg):
    return f"generic {arg!r}"

@describe.register
def _(arg: list): return f"list of {len(arg)}"

@describe.register
def _(arg: int): return f"integer {arg}"

print(describe([1, 2]), describe(7), describe("hi"))

@contextlib.contextmanager
def tag(name):
    print(f"<{name}>")
    yield
    print(f"</{name}>")

with tag("b"):
    print("bold text")`,
        codeLanguage: "python",
        explanation: "Know role-markers (static/class/property), caching trio, total_ordering/abstractmethod, singledispatch overloading, contextmanager factories, plus modern typing markers (final, overload).",
      },
      {
        id: "pyt11",
        question: "How do you write a context manager decorator combining both patterns?",
        answer: "Combining enter/exit semantics with function wrapping — frequent in transactional/resilience code:\n\n**Pattern A — decorator USING a context manager**:\ndef transact(cn):\n    def deco(fn):\n        @wraps(fn)\n        def w(*a, **kw):\n            with cn.begin():          # reuse CM logic\n                return fn(*a, **kw)\n        return w\n    return deco\n\n**Pattern B — generator-based CM factory** (@contextmanager):\n@contextmanager\ndef timing(label):\n    t0 = perf_counter(); yield; print(label, elapsed)\nUsed as: with timing(\"q\"): ... OR converted to decorator: def timed(fn): @wraps(fn); def w: with timing(fn.__name__): return fn(*a)\n\n**Pattern C — class-based CM wrapping calls** for state-rich supervision (retries, metrics spans): __enter__ starts span, __exit__ closes/records exception status (return True ONLY to swallow — almost never!).\n\n**Critical exit-contract knowledge**: __exit__ returning truthy SUPPRESSES the exception — default None propagates correctly; accidental True swallows disasters. finally-style cleanup belongs in __exit__/post-yield regardless of outcome.\n\n**Real-world exemplars**: DB session-per-call, distributed tracing spans, lock scoping, temp-dir lifecycle.\n\nDemo transaction decorator with rollback-on-exception — shows exception flow through yield/exit properly.",
        code: `import functools, contextlib

class FakeConn:
    def begin(self): print("BEGIN")
    def commit(self): print("COMMIT")
    def rollback(self): print("ROLLBACK")

conn = FakeConn()

@contextlib.contextmanager
def transaction(c):
    c.begin()
    try:
        yield c
    except Exception:
        c.rollback()
        raise
    else:
        c.commit()

def transact(fn):
    @functools.wraps(fn)
    def w(*a, **kw):
        with transaction(conn):
            return fn(*a, **kw)
    return w

@transact
def save(x): return x * 2

print(save(21))
try:
    @transact
    def boom(): raise RuntimeError("bad")
    boom()
except RuntimeError:
    pass`,
        codeLanguage: "python",
        explanation: "Wrap functions with context-manager semantics by nesting: @contextmanager supplies enter/exit logic, decorator applies it per call — commit on success, rollback-and-reraise on failure.",
      },
      {
        id: "pyt12",
        question: "What decorator mistakes cause production incidents?",
        answer: "Incident-grade decorator bugs:\n\n**1. Missing functools.wraps** — cascading failures: framework routing by __name__ collides (all endpoints named \"wrapper\"!), docs vanish, serialization breaks.\n\n**2. Not forwarding return values / swallowing results** — wrappers returning None silently truncate data flows discovered days later.\n\n**3. Decoration side effects at IMPORT time** — heavy work/network inside decorator body slows cold starts, breaks test collection, order-dependence.\n\n**4. Shared mutable state on the wrapper without locks** — counters/caches race under threads (increment lost updates); need locks or atomic structures.\n\n**5. Async blindness** — sync wrapper around async def returns COROUTINE never awaited; must detect and provide async wrapper (inspect.iscoroutinefunction).\n\n**6. Exception-handling wrappers that over-catch** — bare except converting bugs into \"handled\" log lines, masking outages.\n\n**7. Stacking-order surprises** — @app.route ABOVE @auth vs reverse changes auth coverage; bottom-up application misunderstood.\n\n**8. Cache unboundedness** — lru_cache(None) on user-input-keyed funcs leaks memory indefinitely.\n\n**9. Breaking signatures for positional users** — adding required params inside wrapper without passthrough discipline.\n\nDeliver #1+#5 deeply (async wrapper snippet), others rapid-fire with consequence framing.",
        code: `import functools, inspect

def robust(fn):
    if inspect.iscoroutinefunction(fn):
        @functools.wraps(fn)
        async def awrapper(*a, **kw):
            return await fn(*a, **kw)
        return awrapper
    @functools.wraps(fn)
    def wrapper(*a, **kw):
        return fn(*a, **kw)
    return wrapper

@robust
async def fetch():
    return "data"

import asyncio
print(asyncio.run(fetch()))
print(inspect.signature(fetch))`,
        codeLanguage: "python",
        explanation: "Top offenders: skipped wraps, lost returns, import-time side effects, unlocked shared state, sync wrappers strangling coroutines — audit decorators like production code because they are.",
      },
      {
        id: "pyt13",
        question: "How would you implement @deprecated decorator and @memoize from scratch?",
        answer: "Two classics demonstrating decorator mastery end-to-end:\n\n**@deprecated** — warn once per callsite, keep behavior identical:\ndef deprecated(msg=\"\"):\n    def deco(fn):\n        warned = False\n        @wraps(fn)\n        def w(*a, **kw):\n            nonlocal warned\n            if not warned:\n                warnings.warn(f\"{fn.__qualname__} deprecated. {msg}\",\n                              DeprecationWarning, stacklevel=2)\n                warned = True\n            return fn(*a, **kw)\n        return w\n    return deco\nNuances: DeprecationWarning hidden by default in app code (visible in tests with -W), stacklevel=2 blames caller line not wrapper, optional hard-fail env for CI enforcement, also decorate classes similarly.\n\n**@memoize** — hand-rolled lru_cache:\ndef memoize(fn):\n    cache = {}\n    sentinel = object()\n    @wraps(fn)\n    def w(*args):\n        hit = cache.get(args, sentinel)\n        if hit is sentinel:\n            hit = cache[args] = fn(*args)   # args tuple must be hashable\n        return hit\n    w.cache = cache                          # introspection/clearing\n    w.cache_clear = cache.clear\n    return w\nExtensions: maxsize LRU eviction via OrderedDict.move_to_end/popitem, TTL entries, async variant with asyncio.Lock.\n\nBoth answers showcase wraps, closure state, stacklevel, hashability constraints — complete decorator literacy in ten lines each.",
        code: `import warnings, functools

def deprecated(msg=""):
    def deco(fn):
        warned = False
        @functools.wraps(fn)
        def w(*a, **kw):
            nonlocal warned
            if not warned:
                warnings.warn(f"use new_api(); {msg}", DeprecationWarning, stacklevel=2)
                warned = True
            return fn(*a, **kw)
        return w
    return deco

@deprecated("since v2")
def old_api(x): return x + 1

def memoize(fn):
    cache = {}
    @functools.wraps(fn)
    def w(*args):
        if args not in cache:
            cache[args] = fn(*args)
        return cache[args]
    w.cache_clear = cache.clear
    return w

calls = 0
@memoize
def slow_double(n):
    global calls; calls += 1
    return n * 2

with warnings.catch_warnings(record=True) as caught:
    warnings.simplefilter("always")
    print(old_api(1), old_api(2), len(caught))   # warn once
print(slow_double(9), slow_double(9), calls)      # 1 real call`,
        codeLanguage: "python",
        explanation: "Deprecated warns once with correct stacklevel via closure flag; memoize keys a dict by hashed args exposing cache_clear — both flexing wraps, state capture and call-site hygiene.",
      },
    ],
  },
  {
    id: "exceptions",
    title: "Exception Handling",
    icon: "🚨",
    questions: [
      {
        id: "pye1",
        question: "Walk through try/except/else/finally execution order.",
        answer: "Four-block anatomy with precise flow:\n\n**try**: monitored region. First raised exception jumps to matching handler (skipping REST of try body!).\n\n**except Type as e**: handlers evaluated TOP-DOWN — first MATCHING type wins (subclass matches parent clause; put SPECIFIC first, broad last). Multiple types tuple-able: except (KeyError, IndexError). as-binding deleted after block (namespace hygiene).\n\n**else**: runs ONLY when try completed with NO exception — success-path separation keeping try minimal (only risky statements inside; else holds dependent logic that shouldn't mask try-errors).\n\n**finally**: ALWAYS executes — after try-success/else, after except handling, even during return/break/continue propagation, even for unhandled exceptions (runs BEFORE propagation continues). Cleanup guarantee zone (files/locks/releases) — though with-statements usually supersede.\n\n**Return interplay traps**:\n- finally return/override DISCARDS in-flight exception or pending return (silent swallow!) — never return inside finally (lint E722 cousin rule).\n- finally assignments can't override already-executed return VALUES but CAN via its own return.\n\nOrder summary sentence: try → [except | else] → finally, with exceptions routing accordingly. Demonstrate matrix of outcomes compactly.",
        code: `def demo(mode):
    log = []
    try:
        log.append("try")
        if mode == "error":
            raise ValueError("boom")
        if mode == "div":
            return 1 / 0
        return "ok"
    except ValueError as e:
        log.append(f"except ValueError: {e}")
        return "handled"
    except ZeroDivisionError:
        log.append("except ZeroDivisionError")
        raise
    else:
        log.append("else (no exception)")
    finally:
        log.append("finally always")
        print(log)

print(demo("clean"))
print(demo("error"))
try:
    demo("div")
except ZeroDivisionError:
    print("propagated after finally")`,
        codeLanguage: "python",
        explanation: "Flow: try → first-matching except OR else-on-success → finally unconditionally; keep try minimal, specific handlers first, and never return inside finally.",
      },
      {
        id: "pye2",
        question: "Describe Python's exception hierarchy and catching strategy.",
        answer: "All exceptions derive from **BaseException**; application code catches **Exception** descendants:\n\nBaseException\n├── SystemExit (sys.exit), KeyboardInterrupt (Ctrl-C), GeneratorExit\n└── Exception\n    ├── ArithmeticError → ZeroDivisionError, OverflowError\n    ├── LookupError → IndexError, KeyError\n    ├── OSError (+subclasses FileNotFoundError, PermissionError, IsADirectoryError...)\n    ├── ValueError, TypeError, AttributeError, NameError\n    ├── RuntimeError → RecursionError, NotImplementedError\n    ├── StopIteration / StopAsyncIteration\n    └── UnicodeError family\n\n**Catching strategy ladder**:\n1. Catch the MOST SPECIFIC type actionable at that layer (FileNotFoundError → create default; KeyError → missing config).\n2. Group siblings: except (KeyError, IndexError) as e when handling identically; exception-GROUPS (except* for ExceptionGroup, 3.11+) for concurrent fan-outs.\n3. Bare except / except Exception: reserved for TOP-LEVEL boundaries (worker loops, request handlers) — LOG then decide crash-vs-continue; never silent-pass.\n4. NEVER catch KeyboardInterrupt/SystemExit routinely (blocks Ctrl-C/exit) — bare-except catches them (it's BaseException-wide)! except Exception avoids this trap.\n\n**Custom trees**: domain base class AppError(Exception) letting callers catch-your-family broadly while specifics refine — mirrors stdlib philosophy (OSError errno specialization).",
        code: `def load(path):
    try:
        with open(path) as f:
            return int(f.read())
    except FileNotFoundError:
        return 0                        # recoverable default
    except (ValueError, UnicodeDecodeError) as e:
        raise RuntimeError(f"corrupt config: {path}") from e

try:
    load("cfg.txt")
except RuntimeError as e:
    print("boundary:", e)

try:
    {}["missing"]
except LookupError as e:                # parent covers KeyError/IndexError
    print("lookup:", type(e).__name__)

for dangerous in (KeyboardInterrupt, SystemExit):
    print(dangerous.__mro__[1].__name__)   # BaseException — avoid catching`,
        codeLanguage: "python",
        explanation: "Catch narrowly actionable types first, group siblings, reserve except Exception for logged boundaries, and never bare-except (it swallows Ctrl-C/SystemExit too).",
      },
      {
        id: "pye3",
        question: "What is the correct way to re-raise exceptions? What does raise from do?",
        answer: "**Three re-raise forms with distinct meanings**:\n\n1. **bare raise** (inside except): re-throws CURRENT exception PRESERVING original traceback — the default choice; handlers may log/annotate but shouldn't destroy provenance.\n\n2. **raise NewError(...) — CHAINING IMPLICIT**: inside an except block, Python attaches original as __context__ displaying \"During handling... another occurred\". Preserves history automatically.\n\n3. **raise NewError(...) from original_exc** — EXPLICIT chaining: sets __cause__, displays \"The above exception was the direct cause...\"; intent-signaling translation (low-level → domain error). Use from None to SUPPRESS context deliberately (clean user-facing errors hiding internals — sparingly, logs should retain detail).\n\n**Anti-patterns**:\n- raise e (explicit var): RESETS traceback to re-raise point?? Actually preserves but loses \"this frame added info\" semantics and breaks in nested scopes subtly; bare raise strictly better.\n- Swallow-then-generic: raising Exception(str(e)) erasing type information callers dispatch on.\n\n**Traceback hygiene extras**: traceback.format_exception for structured logging; exception GROUPS raise ExceptionGroup(\"msg\", [e1, e2]) + except* parallel handling (3.11) for aggregator contexts.\n\nDemo translation chain showing both tracebacks rendered — visual understanding of __cause__/__context__.",
        code: `import json

def parse_config(text):
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"invalid config: {e}") from e   # explicit cause

def bare_reraise_demo():
    try:
        {}["k"]
    except KeyError:
        raise                        # untouched traceback

try:
    parse_config("{bad json")
except ValueError as e:
    print(type(e.__cause__).__name__, "|", e)

try:
    bare_reraise_demo()
except KeyError as e:
    print("bare raise preserved:", repr(e))`,
        codeLanguage: "python",
        explanation: "Bare raise preserves provenance; plain new raises chain implicitly (__context__); 'raise X from err' declares intent (__cause__), and 'from None' silences context for clean UX errors.",
      },
      {
        id: "pye4",
        question: "How do you design custom exception classes?",
        answer: "**Blueprint**:\nclass AppError(Exception):\n    \"\"\"Domain base — callers catch-this-family broadly.\"\"\"\n\nclass ValidationError(AppError):\n    def __init__(self, field, reason):\n        self.field, self.reason = field, reason\n        super().__init__(f\"{field}: {reason}\")\n\n**Design principles**:\n1. **One domain BASE** under Exception — hierarchy communicates taxonomy (catch AppError vs precise subtype), mirroring OSError/RequestException patterns.\n2. **Carry STRUCTURED payload** (field, code, retryable flag, http_status) as ATTRIBUTES — programmatic handling beats string-parsing messages; messages remain for humans.\n3. Meaningful __str__ via super().__init__(formatted) — logs readable immediately.\n4. Don't over-inherit: subclass ValueError/TypeError when SEMANTICS align (callers already catching those keep working) — judgment call, document either way.\n5. Module __all__ export list; avoid leaking third-party exception types across YOUR API boundary — TRANSLATE at edges (requests.HTTPError → MyAppNetworkError) so callers depend only on your taxonomy.\n6. Anti-patterns: empty pass classes with no base linkage (inherit Exception at minimum!), exceptions-as-control-flow for ordinary loops, one mega-exception with mode flags.\n\nBonus: exception GROUPS for aggregating validation failures (multiple bad fields) via ExceptionGroup or custom collector.",
        code: `class AppError(Exception):
    retryable = False

class ValidationFailed(AppError):
    def __init__(self, errors: dict):
        self.errors = errors
        super().__init__(f"{len(errors)} invalid field(s)")

class UpstreamTimeout(AppError):
    retryable = True

def register(form):
    errs = {}
    if not form.get("email"): errs["email"] = "required"
    if errs:
        raise ValidationFailed(errs)

try:
    register({})
except AppError as e:
    print(e, "| retryable:", e.retryable, "|", e.errors)`,
        codeLanguage: "python",
        explanation: "Build one domain base plus structured subtypes carrying machine-readable fields — translate foreign exceptions at boundaries and keep human messages alongside attribute payloads.",
      },
      {
        id: "pye5",
        question: "EAFP vs LBYL — which style should you use?",
        answer: "**LBYL** — Look Before You Leap: pre-check conditions (if key in d:, if os.path.exists(p), if hasattr(o, 'm')).\n**EAFP** — Easier to Ask Forgiveness than Permission: attempt operation, handle failure (try: d[k] except KeyError). Python culturally favors EAFP (idiom baked into docs/community).\n\n**EAFP advantages**:\n1. **Race-free**: TOCTOU eliminated — os.path.exists then open can interleave-delete; direct open+except FileNotFound atomic.\n2. **Faster hot paths**: happy-path has ZERO check overhead (dict hit vs double hash).\n3. Handles impossible-to-precheck states (parse validity, network races).\n\n**LBYL advantages**: clearer intent for EXPECTED-alternative flows, avoids exception overhead on FREQUENT misses (exception raise/catch costs µs — meaningful in tight loops), keeps control flow flat/readable for simple guards.\n\n**Decision heuristics**:\n- Rare failure / concurrency-sensitive / costly-valid-anyway → EAFP.\n- Common alternate branch / cheap reliable predicate → LBYL (dict.get, setdefault are LBYL-flavored built-ins bridging both).\n- Public API boundaries: VALIDATE (LBYL-ish) raising precise TypeErrors; internals: EAFP freely.\n\nBenchmark flavor: try/int vs regex/isdecimal gate — show numbers roughly favoring try for valid-heavy mixes.",
        code: `import os, timeit

# TOCTOU race in LBYL:
# if os.path.exists(p): open(p)   <- file may vanish between!
# EAFP atomic:
def read_or_default(path):
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        return ""

d = {"a": 1}
print(d.get("b", 0))                    # bridge idiom

stmt_eafp = "try:\\n    d['b']\\nexcept KeyError:\\n    pass"
stmt_lbyl = "if 'b' in d:\\n    d['b']"
print("miss-cost eafp:", timeit.timeit(stmt_eafp, globals={"d": d}))
print("miss-cost lbyl:", timeit.timeit(stmt_lbyl, globals={"d": d}))`,
        codeLanguage: "python",
        explanation: "Prefer EAFP for rare/racy failures (atomicity + zero happy-path cost); LBYL suits frequent alternate branches — dict.get/setdefault are the pragmatic middle ground.",
      },
      {
        id: "pye6",
        question: "What happens with return inside finally? Why is it dangerous?",
        answer: "**finally's return (or break/continue) HIJACKS control flow**: any pending return value OR IN-FLIGHT EXCEPTION gets discarded silently — the function exits via finally's route no matter what.\n\n**Disaster demos**:\ndef bad():\n    try:\n        raise ValueError(\"critical\")\n    finally:\n        return \"fine\"        # exception VANISHES\n→ caller sees \"fine\"; outage root-cause erased.\n\ndef subtle():\n    try:\n        return \"computed\"\n    finally:\n        return \"overridden\"  # first return discarded\n\nEven ASSIGNMENT can't undo executed returns, but finally-return replaces wholesale. Same swallowing applies to except-handling: exception mid-handler + finally-return = suppressed.\n\n**Why it bites production**: cleanup blocks grow return-status habits; linting gaps let one slip; intermittent mystery \"successes\" mask systemic faults — nightmare triage.\n\n**Rules**:\n1. NEVER return/break/continue inside finally (ruff B012/flake8 flags; pylint W0134).\n2. finally for CLEANUP only — releases, flushes, logs; use with-statements to sidestep entirely.\n3. Need post-action value adjustments? Compute in finally WITHOUT flow keywords, or restructure.\n\nShow swallowed-exception repro + linter-flagged line comment — memorable cautionary tale.",
        code: `import warnings

def swallow_bug():
    try:
        raise RuntimeError("DB down!")
    finally:
        return "all good"    # RuntimeError silently eaten!

print(swallow_bug())

def override_bug():
    try:
        return 42
    finally:
        return -1            # 42 discarded

print(override_bug())

# Correct cleanup without hijack:
def safe(path):
    f = open(path)
    try:
        return f.read()
    finally:
        f.close()            # no flow keywords here`,
        codeLanguage: "python",
        explanation: "finally containing return/break/continue cancels in-flight exceptions and pending returns — restrict finally to cleanup and let linters (B012) enforce it.",
      },
      {
        id: "pye7",
        question: "What are assert statements for, and what are their limits?",
        answer: "**assert condition[, message]**: debugging aid raising AssertionError when condition falsy — intended for INTERNAL INVARIANT checking (impossible states, post-conditions), not user-facing validation.\n\n**THE critical limit — strippable**: python -O (optimized) REMOVES assert statements entirely (and their message-side effects). Production deployments commonly run -O → asserts vanish → validations disappear silently. Therefore NEVER validate inputs/control logic/security checks with assert.\n\n**Other footguns**:\n1. assert (cond, msg) TUPLE form always-truthy — asserts the tuple object! Classic typo (comma outside parens intended).\n2. Side effects in condition vanish under -O too (assert cleanup() ).\n3. Message expression evaluated LAZILY (good) but only when failing.\n\n**Correct usage zones**:\n- Self-documenting programmer-error tripwires in libraries (internal contract violations deserve loud crashes).\n- Test assertions — pytest rewrites/assert-introspection make them shine THERE (unrelated to -O stripping since tests aren't optimized).\n- Type narrowing hints for checkers (assert isinstance(x, T)).\n\n**Replace in prod code**: explicit `if not cond: raise ValueError/TypeError(custom_msg)` — intentional exceptions surviving optimization with actionable messages. Mention __debug__ flag tie (-O sets False).",
        code: `def divide(a, b):
    # INVALID prod validation (stripped under -O):
    # assert b != 0, "division by zero"
    if b == 0:
        raise ValueError("denominator must be non-zero")   # survives -O
    return a / b

def internal_invariant(nodes):
    assert len(nodes) % 2 == 0, "tree invariant violated"  # OK: programmer bug
    return nodes

try:
    divide(1, 0)
except ValueError as e:
    print("real error:", e)
print(__debug__)            # False under -O`,
        codeLanguage: "python",
        explanation: "Asserts are strippable invariant checks (gone under -O) — perfect for internal impossibilities and tests, wrong for input validation; ship explicit raises instead.",
      },
      {
        id: "pye8",
        question: "How do exception groups and except* work (Python 3.11+)?",
        answer: "Concurrent code raises MULTIPLE exceptions simultaneously (task fan-out) — classic handling flattened them arbitrarily. **ExceptionGroup**(message, [exc1, exc2...]) wraps a TREE of exceptions; **except*** handles subsets in PARALLEL branches.\n\n**Syntax/mechanics**:\ntry:\n    raise ExceptionGroup(\"batch\", [ValueError(\"a\"), TypeError(\"b\"), KeyError(\"c\")])\n*except* ValueError as eg:\n    handle_value_errors(eg.exceptions)      # eg is ExceptionGroup subset\n*except* TypeError:\n    ...\nUnmatched members RERAISE automatically in residual group — nothing silently lost.\n\n**Semantics**:\n- except* matches DEEP members, splitting groups; multiple except* clauses each evaluate (unlike mutually-exclusive except).\n- At most one branch per original leaf; residuals propagate.\n- Naked raise of subgroup supported; derive via eg.split(matcher), eg.subgroup(cond).\n- asyncio.TaskGroup / anyio nurseries raise ExceptionGroups natively — THE motivating ecosystem (gather with return_exceptions=True predates clunkily).\n\n**Custom leaves**: subclass ExceptionGroup or use derive(msg, excs) preserving metadata.\n\n**When NOT**: sequential code — plain raise/except remains correct; groups are for AGGREGATED concurrency failures.\n\nDemo TaskGroup-style manual group + split filtering — cutting-edge signal.",
        code: `try:
    raise ExceptionGroup("batch", [
        ValueError("bad input"),
        ValueError("other input"),
        TypeError("wrong kind"),
    ])
except* ValueError as vg:
    print("values:", [str(e) for e in vg.exceptions])
except* TypeError as tg:
    print("types:", [str(e) for e in tg.exceptions])
# KeyError? none present — nothing residual reraises

eg = ExceptionGroup("g", [ValueError(1)])
vals, rest = eg.split(ValueError)
print(len(vals.exceptions), rest is None)`,
        codeLanguage: "python",
        explanation: "ExceptionGroup bundles concurrent failures; except* branches match member types independently, reraising unmatched residuals — native to TaskGroup/nursery error propagation.",
      },
      {
        id: "pye9",
        question: "What are exception-handling best practices in production code?",
        answer: "**Layered doctrine**:\n\n1. **Catch where you ACT**: handle only exceptions you can meaningfully resolve at that layer; otherwise annotate-context and RERAISE (bare raise) — decisions belong upstream.\n\n2. **Precise breadth**: specific types first; except Exception ONLY at boundaries (request handlers, worker loops, CLI main) with STRUCTURED LOGGING (logger.exception includes traceback) then graceful degradation or exit-code signaling.\n\n3. **Translate at boundaries**: convert third-party/vendor exceptions into YOUR domain taxonomy (custom base) — callers decouple from dependencies; preserve __cause__.\n\n4. **Never silent**: bare except:pass hides outages; if truly ignorable, comment WHY + narrow type + consider debug-log.\n\n5. **Cleanup via with/contextmanagers**, not finally-spam — resources release through protocol even amid exceptions.\n\n6. **Retry deliberately**: exponential backoff+jitter on RETRYABLE subset only; distinguish permanent vs transient (custom retryable attr); cap attempts; circuit-break repeated upstream failures.\n\n7. **Fail fast on programmer errors** — don't catch AssertionError/TypeError from YOUR OWN internals mid-dev; let them crash loudly in tests.\n\n8. **Metrics + alerts**: count exception TYPES (not strings); spike detection beats grep.\n\n9. **Docs**: documented raises in docstrings raise: section for API consumers.\n\nCondense to mantra: specific, logged, translated, cleaned-up, retried-with-judgment.",
        code: `import logging, random, time

log = logging.getLogger("svc")

class Transient(Exception): ...

def with_retry(op, attempts=3):
    for i in range(1, attempts + 1):
        try:
            return op()
        except Transient:
            if i == attempts:
                log.exception("giving up after %s tries", attempts)
                raise
            delay = min(0.1 * 2 ** i, 2) + random.uniform(0, 0.05)  # jitter
            time.sleep(delay)

tries = iter([Transient(), Transient(), "OK"])
print(with_retry(lambda: next(tries)))`,
        codeLanguage: "python",
        explanation: "Handle locally-actable errors precisely; log-and-reraise elsewhere; translate vendors at edges; clean via context managers; retry transient-only with capped jittered backoff.",
      },
      {
        id: "pye10",
        question: "How does exception handling interact with generators and async code?",
        answer: "**Generators**:\n- Exceptions INSIDE generator body propagate to the CONSUMER at next() time (lazy execution = deferred errors!).\n- Consumer can INJECT via gen.throw(exc) — raised AT paused yield; generator may except/continue (recoverable streams) or propagate ending itself.\n- gen.close() raises GeneratorExit at pause — finally blocks run (cleanup guarantee); yielding afterward raises RuntimeError.\n- return value rides StopIteration.value (yield from consumers receive it).\n\n**Async**:\n- await propagates exceptions like synchronous calls — try/except around awaits natural.\n- Tasks defer exceptions: fire-and-forget tasks SWALLOW until awaited/collected — unawaited failing tasks log 'Task exception was never retrieved' ghosts; ALWAYS gather/create_task with retrieval or add done-callbacks.\n- asyncio.gather(..., return_exceptions=True) converts failures to RESULT entries (manual triage) vs default fail-fast canceling siblings (partial cancellation semantics!). TaskGroup (3.11+) cancels siblings on first failure and raises ExceptionGroup — modern default.\n- Cancellation itself arrives as CancelledError — catch ONLY to cleanup then RE-RAISE (swallowing breaks timeouts/shutdowns!).\n\nCross-cutting: finally/context managers remain cleanup backbone in both worlds; shielding (asyncio.shield) protects critical sections from cancellation.",
        code: `import asyncio

def stream():
    try:
        yield 1
        raise ValueError("mid-stream")
    except ValueError:
        yield "recovered"
    finally:
        print("gen cleanup")

g = stream()
print(next(g), next(g))

async def worker(i):
    await asyncio.sleep(0.01)
    if i == 1:
        raise RuntimeError(f"task{i}")
    return i

async def main():
    try:
        async with asyncio.TaskGroup() as tg:
            for i in range(3):
                tg.create_task(worker(i))
    except* RuntimeError as eg:
        print("grouped:", [str(e) for e in eg.exceptions])

asyncio.run(main())`,
        codeLanguage: "python",
        explanation: "Generator errors surface at consumption (throw/close inject control); async tasks stash failures until gathered — use TaskGroup/except* and never swallow CancelledError.",
      },
    ],
  },
];

export const pythonMetaPart4: Record<string, PyQuestionMeta> = {
  pyo1: { difficulty: "easy", priority: "very-high", tags: ["oop", "self"] },
  pyo2: { difficulty: "medium", priority: "very-high", tags: ["attributes", "mutability"] },
  pyo3: { difficulty: "easy", priority: "high", tags: ["methods"] },
  pyo4: { difficulty: "medium", priority: "very-high", tags: ["property", "encapsulation"] },
  pyo5: { difficulty: "medium", priority: "high", tags: ["privacy", "naming"] },
  pyo6: { difficulty: "hard", priority: "high", tags: ["mro", "c3"] },
  pyo7: { difficulty: "hard", priority: "very-high", tags: ["super", "mro"] },
  pyo8: { difficulty: "medium", priority: "high", tags: ["inheritance", "mixins"] },
  pyo9: { difficulty: "medium", priority: "high", tags: ["abc", "interfaces"] },
  pyo10: { difficulty: "easy", priority: "very-high", tags: ["duck-typing", "protocol"] },
  pyo11: { difficulty: "medium", priority: "very-high", tags: ["dunder", "hash"] },
  pyo12: { difficulty: "easy", priority: "very-high", tags: ["dataclasses"] },
  pyo13: { difficulty: "medium", priority: "medium", tags: ["slots", "memory"] },
  pyo14: { difficulty: "hard", priority: "medium", tags: ["metaclass"] },
  pyo15: { difficulty: "medium", priority: "high", tags: ["design", "composition"] },
  pyo16: { difficulty: "medium", priority: "high", tags: ["singleton", "patterns"] },
  pyo17: { difficulty: "hard", priority: "medium", tags: ["new", "init"] },
  pyo18: { difficulty: "medium", priority: "high", tags: ["operators", "dunder"] },
  pyo19: { difficulty: "hard", priority: "medium", tags: ["descriptors"] },
  pyo20: { difficulty: "medium", priority: "high", tags: ["pitfalls"] },

  pyt1: { difficulty: "easy", priority: "very-high", tags: ["decorators"] },
  pyt2: { difficulty: "medium", priority: "very-high", tags: ["decorators", "factories"] },
  pyt3: { difficulty: "easy", priority: "high", tags: ["functools", "wraps"] },
  pyt4: { difficulty: "medium", priority: "medium", tags: ["decorators", "classes"] },
  pyt5: { difficulty: "medium", priority: "medium", tags: ["decorators", "classes"] },
  pyt6: { difficulty: "medium", priority: "medium", tags: ["closures"] },
  pyt7: { difficulty: "medium", priority: "low", tags: ["currying", "partial"] },
  pyt8: { difficulty: "medium", priority: "medium", tags: ["monkey-patch", "testing"] },
  pyt9: { difficulty: "medium", priority: "high", tags: ["caching", "property"] },
  pyt10: { difficulty: "easy", priority: "high", tags: ["builtins", "decorators"] },
  pyt11: { difficulty: "medium", priority: "medium", tags: ["contextmanager", "decorators"] },
  pyt12: { difficulty: "hard", priority: "medium", tags: ["pitfalls", "async"] },
  pyt13: { difficulty: "medium", priority: "high", tags: ["implementation"] },

  pye1: { difficulty: "easy", priority: "very-high", tags: ["try-except"] },
  pye2: { difficulty: "easy", priority: "very-high", tags: ["hierarchy"] },
  pye3: { difficulty: "medium", priority: "very-high", tags: ["raise", "chaining"] },
  pye4: { difficulty: "medium", priority: "high", tags: ["custom", "design"] },
  pye5: { difficulty: "easy", priority: "high", tags: ["idioms"] },
  pye6: { difficulty: "hard", priority: "high", tags: ["finally", "pitfalls"] },
  pye7: { difficulty: "easy", priority: "high", tags: ["assert"] },
  pye8: { difficulty: "hard", priority: "medium", tags: ["groups", "py311"] },
  pye9: { difficulty: "medium", priority: "high", tags: ["best-practices"] },
  pye10: { difficulty: "hard", priority: "medium", tags: ["generators", "async"] },
};
