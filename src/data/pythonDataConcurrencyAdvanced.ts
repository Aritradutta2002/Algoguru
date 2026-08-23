import type { InterviewTopic } from "@/data/pythonInterviewMetadataBase";
import type { PyQuestionMeta } from "@/data/pythonInterviewMetadataBase";

export const pythonTopicsPart6: InterviewTopic[] = [
  {
    id: "concurrency",
    title: "Threads, Processes & asyncio in Depth",
    icon: "⚡",
    questions: [
      {
        id: "pyx1",
        question: "How do you create and manage threads? Explain join and daemon.",
        answer: "**Creation routes**: threading.Thread(target=fn, args=(...), kwargs={...}).start() — or subclass Thread overriding run() (call start(), NEVER run() directly which executes inline!). Modern preference: concurrent.futures.ThreadPoolExecutor for pools/futures.\n\n**Lifecycle**: start() spawns OS thread running target; join(timeout) blocks CALLER until thread finishes — coordination point for completion; is_alive() polling; name/ident introspection.\n\n**Daemon threads**: daemon=True marks SERVICE threads that DON'T block interpreter exit — abrupt termination at shutdown (finally blocks may NOT run! resources possibly torn mid-use). Use for heartbeats/monitors; never for transactional work needing cleanup. Non-daemon default keeps program alive until done.\n\n**Return values**: Thread has none — capture via result list/dict (GIL-safe single append), queue.Queue, or Future from executor (future.result() propagates EXCEPTIONS too — plain threads swallow into stderr via excepthook!).\n\n**Error visibility gotcha**: unhandled exceptions in threads kill only THAT thread printing traceback — main continues unaware; executors/futures surface errors on .result().\n\nDemo: pool with as_completed collecting results + exceptions vs raw-thread silence — practical contrast interviewers reward.",
        code: `import threading, time
from concurrent.futures import ThreadPoolExecutor, as_completed

def job(i):
    time.sleep(0.01)
    if i == 2:
        raise ValueError(f"job {i} failed")
    return i * 10

with ThreadPoolExecutor(max_workers=4) as ex:
    futs = {ex.submit(job, i): i for i in range(5)}
    for fut in as_completed(futs):
        try:
            print("got", fut.result())
        except ValueError as e:
            print("surfaced:", e)

t = threading.Thread(target=lambda: time.sleep(0.05), daemon=True)
t.start()
print("main exits without waiting (daemon)")`,
        codeLanguage: "python",
        explanation: "start()/join() manage OS threads (daemon=True skips blocking exit); prefer ThreadPoolExecutor whose futures deliver results AND exceptions instead of silent per-thread tracebacks.",
      },
      {
        id: "pyx2",
        question: "What problems does asyncio solve and how does its event loop work?",
        answer: "**Problem domain**: tens-of-thousands of CONCURRENT I/O operations (websockets, long-polls, proxies) where thread-per-connection memory/scheduling costs explode. asyncio multiplexes thousands of tasks over ONE thread using non-blocking sockets.\n\n**Event loop mechanics**:\n1. Tasks wrap coroutines scheduled on the loop.\n2. Running task executes until **await** on unfinished future — CONTROL YIELDS to loop.\n3. Loop polls the OS selector (epoll/kqueue/IOCP) for readiness of registered fds; completed I/O marks futures done, resuming their tasks via callback queue.\n4. Ready tasks run to next await — cooperative scheduling (tasks must yield voluntarily; a blocking call FREEZES EVERYTHING).\n\n**Vocabulary**: coroutine (async def callable → awaitable), Task (scheduled coroutine), Future (awaitable result placeholder), gather/create_task composition, async with/async for protocols, async generators.\n\n**Golden rules**:\n- Never call blocking functions (time.sleep, requests, heavy CPU) on the loop — use asyncio.sleep, aiohttp/httpx.AsyncClient, loop.run_in_executor / to_thread offloads.\n- Concurrency ONLY at awaits — code between awaits is effectively atomic (fewer locks needed than threads!).\n\nDemo gather fan-out showing wall-time compression + the blocking-call hazard comment — crisp mechanics story.",
        code: `import asyncio, time

async def fetch(name, delay):
    await asyncio.sleep(delay)          # non-blocking wait
    return f"{name} done"

async def main():
    t0 = time.perf_counter()
    results = await asyncio.gather(
        fetch("db", 0.3),
        fetch("api", 0.2),
        fetch("cache", 0.1),
    )
    print(results, f"in {time.perf_counter()-t0:.2f}s (max delay, not sum)")

asyncio.run(main())
# HAZARD: time.sleep(1) here would freeze ALL tasks — use asyncio.sleep`,
        codeLanguage: "python",
        explanation: "One thread's event loop multiplexes non-blocking I/O: tasks run until awaiting, the loop watches selectors, ready callbacks resume them — huge connection counts without thread stacks, but blocking calls stall everything.",
      },
      {
        id: "pyx3",
        question: "async def functions vs generator-based coroutines — how did we get here?",
        answer: "**Evolution timeline** (interview storytelling gold):\n1. **Generators as coroutines** (pre-3.4): yield pauses; send() injects values — hand-rolled scheduling frameworks (tulip era).\n2. **@asyncio.coroutine + yield from** (3.4): asyncio formalized; coroutines were GENERATORS under the hood delegating via yield from chains.\n3. **async/await KEYWORDS** (3.5, PEP 492): dedicated syntax — async def creates native COROUTINE objects (distinct from generators!), await generalizes yield-from delegation. Same suspension machinery, clearer semantics + separate type system support.\n\n**Modern distinctions**:\n- Generator: iterator protocol (yield), synchronous iteration semantics, __next__ driving.\n- Coroutine: AWAIT protocol (send/throw under the hood but conceptually await-driven), must be SCHEDULED (awaited/run()) to execute anything — calling one just CREATES it (common beginner bug: forgetting await!)\n- RuntimeWarning 'coroutine was never awaited' diagnoses missing awaits.\n\n**Async generators** (3.6+): async def + yield hybrid — async for consumption, streaming pipelines over async sources (DB cursors, websockets).\n\nInterview close: await ≈ yield-from lineage explains TaskGroup/gather semantics deeply; never mix old-style decorators today.",
        code: `import asyncio

def gen():
    yield 1
    yield 2

async def coro():
    await asyncio.sleep(0)
    return "coro-result"

g = gen()
print(next(g))                        # drives immediately

c = coro()                            # NOTHING ran!
print(type(c).__name__)               # coroutine
print(asyncio.run(c))                 # now it runs

async def stream(n):
    for i in range(n):
        await asyncio.sleep(0.01)
        yield i

async def main():
    async for v in stream(3):
        print("v", v)

asyncio.run(main())`,
        codeLanguage: "python",
        explanation: "Coroutines evolved from generator plumbing (yield-from) into first-class async/await objects — creating one runs nothing until awaited; async generators blend both worlds for async streams.",
      },
      {
        id: "pyx4",
        question: "Compare asyncio.gather, create_task, and TaskGroup.",
        answer: "**create_task(coro)**: schedules coroutine IMMEDIATELY as independent Task returning a Future handle — fire-and-forget or later-awaited; concurrency STARTS AT CREATION (not at await!). Keep references (GC cancels orphaned unreferenced tasks — documented footgun!).\n\n**gather(*aws)**: awaits many awaitables CONCURRENTLY, returning results IN ORDER once all finish.\n- return_exceptions=False (default): FIRST exception propagates immediately — siblings KEEP RUNNING uncancelled (zombie risk!) unless manually managed.\n- return_exceptions=True: exceptions returned AS RESULT VALUES for triage.\n\n**TaskGroup** (3.11+, modern default):\nasync with asyncio.TaskGroup() as tg:\n    t1 = tg.create_task(a()); t2 = tg.create_task(b())\nStructured concurrency guarantees: ANY failure CANCELS ALL SIBLINGS (clean teardown through cancellation), waits full group exit, then raises ExceptionGroup aggregating everything. Deterministic lifecycle beats gather's leaky partial-failure semantics.\n\n**Selection**: simple homogeneous fan-out with all-or-nothing → TaskGroup; need per-item exception triage WITHOUT cancelling → gather(return_exceptions=True); long-lived detached workers → create_task with held refs + done-callbacks; timeouts → asyncio.timeout context (3.11+) wrapping any of these.\n\nDemo TaskGroup cancellation + gather-triage contrast — cutting-edge fluency marker.",
        code: `import asyncio

async def worker(i):
    await asyncio.sleep(0.05 * (3 - i))
    if i == 1:
        raise RuntimeError(f"w{i} failed")
    return i * 100

async def main():
    try:
        async with asyncio.TaskGroup() as tg:
            for i in range(3):
                tg.create_task(worker(i))
    except* RuntimeError as eg:
        print("TaskGroup cancelled all:", [str(e) for e in eg.exceptions])

    outs = await asyncio.gather(*(worker(i) for i in range(3)),
                                return_exceptions=True)
    print("gather triage:", outs)

asyncio.run(main())`,
        codeLanguage: "python",
        explanation: "create_task launches detached tasks (hold refs!), gather fans out with optional exception-as-value triage, TaskGroup enforces structured all-cancel-on-failure with grouped errors — prefer it by default.",
      },
      {
        id: "pyx5",
        question: "What are daemon threads vs daemonic processes?",
        answer: "**Shared concept**: daemonic workers DON'T prevent interpreter exit — when only daemons remain, runtime shuts down, KILLING them abruptly (no finally guarantees mid-execution!).\n\n**Thread daemons** (threading.Thread(daemon=True)):\n- Typical: monitors, heartbeats, cache refreshers — auxiliary loops.\n- Hazards: killed MID-WRITE possible (torn files), locks possibly left held?? Actually interpreter attempts join-at-exit for non-daemons only; daemons freeze at arbitrary bytecode under GIL during shutdown — resource corruption window real.\n- Setting: t.daemon=True BEFORE start() (else RuntimeError).\n\n**Process daemons** (multiprocessing.Process(daemon=True)):\n- DIFFERENT nuance: daemonic processes CANNOT spawn children (prohibited — orphan prevention); terminated when parent exits, before parent's own cleanup joins them.\n- Typical: pool-adjacent helpers, log shippers.\n\n**Alternatives worth citing**: explicit shutdown EVENT + join pattern (cooperative stop: while not stop_event.is_set(): ...), executor lifecycle managers (with ThreadPoolExecutor auto-joins), asyncio tasks cancelled via TaskGroup scope (structured alternative replacing most daemon needs).\n\nInterview framing: daemons trade graceful-shutdown guarantees for convenience — acceptable for lossy side-work only; transactional work needs cooperative stop signals.",
        code: `import threading, time, multiprocessing

stop = threading.Event()

def monitor():
    while not stop.is_set():          # cooperative loop
        print("[monitor] tick")
        time.sleep(0.02)

t = threading.Thread(target=monitor, daemon=True)
t.start()
time.sleep(0.05)
stop.set(); t.join(timeout=1)         # graceful stop preferred
print("stopped cleanly")

def child():
    print("child ran")

p = multiprocessing.Process(target=child, daemon=True)
# p.start(); p.join()                  # daemons can't have children`,
        codeLanguage: "python",
        explanation: "Daemonic threads/processes die abruptly at owner-exit — fine for lossy monitors, unsafe for transactions; cooperative stop-events plus join give deterministic shutdown instead.",
      },
      {
        id: "pyx6",
        question: "How does multiprocessing.Pool distribute work? What is chunksize?",
        answer: "**Pool mechanics**: spawns N worker processes upfront; input iterable gets SLICED into chunks dispatched via internal task queue; each worker applies function per item, pickling results back through result queue; map() preserves ORDER regardless of completion order; imap lazy-ordered, imap_unordered yields as-completed (throughput-friendly).\n\n**chunksize significance**: items-per-task granularity.\n- chunksize=1: per-ITEM IPC overhead dominates for tiny functions (pickle round-trips swamp compute!) — slow.\n- Large chunks: better amortization BUT load imbalance (one straggler chunk stretches tail latency) + memory batching.\n- Heuristic: chunksize ≈ ceil(len(items)/(workers*4)) balances pipelining vs imbalance; benchmark for hot paths.\n\n**API extras**: apply_async with callback/error_callback; starmap for multi-arg; maxtasksperchild recycling leaky workers; context selection (spawn vs fork) via multiprocessing.get_context.\n\n**Common bugs**: defining worker at REPL/__main__ violations under spawn (pickling by reference fails); closures/lambdas UNPICKLABLE as targets (module-level functions required!) — key interview trap; oversized return payloads (return aggregates, not datasets).\n\nDemo imap_unordered progress pattern + chunksize note — operational maturity.",
        code: `from multiprocessing import Pool
import time

def score(x):                          # module-level (picklable!)
    return x * x

if __name__ == "__main__":
    data = range(20)
    with Pool(4) as p:
        for r in p.imap_unordered(score, data, chunksize=5):
            print(r, end=" ")
    print()
    t0 = time.perf_counter()
    with Pool(2) as p:
        p.map(score, range(200_000), chunksize=50_000)   # amortized IPC
    print(f"chunked map: {time.perf_counter()-t0:.2f}s")`,
        codeLanguage: "python",
        explanation: "Pools pickle chunks of items to workers and stream ordered/unordered results back — tune chunksize to amortize IPC against tail imbalance, keep workers module-level picklable functions.",
      },
      {
        id: "pyx7",
        question: "How do processes share data — queues, pipes, managers, shared memory?",
        answer: "**Isolation premise**: separate address spaces — sharing requires EXPLICIT channels:\n\n**Queue (multiprocessing.Queue)**: pickled message passing, process-safe — THE default for task/result flows. JoinableQueue adds task_done/join drain detection. Avoid sharing the SAME queue via inheritance under spawn (pass as args!).\n\n**Pipe(duplex?)**: two-endpoint CONNECTION for direct pairs — faster than Queue for 1:1, send/recv arbitrary picklables; select()-able fds; fragmentation hazards on concurrent writers (use one-direction-per-pipe discipline).\n\n**Manager()**: server process hosting PROXIES of dict/list/Namespace/locks — convenient SHARED MUTABLE state across machines even (BaseManager remote). Cost: every operation = IPC round-trip (slow; fine for config/status, wrong for hot loops).\n\n**shared_memory.SharedMemory / ShareableList (3.8+)**: zero-copy shared buffers across processes — NumPy arrays viewing the same bytes (np.ndarray(buffer=shm.buf)); pair with Locks for mutation discipline; unlink() lifecycle care. Massive win for image/frame processing pipelines.\n\n**Value/Array**: ctypes-typed shared scalars/arrays with optional lock — lightweight counters.\n\n**Decision ladder**: messages→Queue; pairwise streams→Pipe; casual shared state→Manager; hot numeric blobs→SharedMemory(+Lock).",
        code: `from multiprocessing import Process, Queue, Value
import numpy as np
from multiprocessing import shared_memory

def producer(q, counter):
    for i in range(3):
        q.put({"item": i})
    counter.value += 1

if __name__ == "__main__":
    q = Queue()
    ticks = Value("i", 0)
    p = Process(target=producer, args=(q, ticks))
    p.start()
    print([q.get() for _ in range(3)], "ticks:", ticks.value)
    p.join()

    shm = shared_memory.SharedMemory(create=True, size=24)
    arr = np.ndarray((6,), dtype=np.int32, buffer=shm.buf)
    arr[:] = range(6)                   # visible to other PROCESSES
    print(arr.tolist())
    shm.close(); shm.unlink()`,
        codeLanguage: "python",
        explanation: "Cross-process sharing means queues/pipes for messages, Manager proxies for convenient-but-slow state, and SharedMemory/Value for zero-copy numeric collaboration guarded by locks.",
      },
      {
        id: "pyx8",
        question: "What is the asyncio concurrency model's locking story?",
        answer: "**Cooperative scheduling changes everything**: code between awaits runs WITHOUT preemption — single-threaded loop means no bytecode-level interleaving races like threads. Therefore:\n\n1. Simple counters/dict mutations NEED NO LOCKS if no await inside the read-modify-write — atomicity by cooperativeness.\n2. Races STILL exist ACROSS awaits: check-something → await → act patterns interleave (classic double-fetch: two tasks both see cache-miss, both fetch). Guard multi-await critical sections with **asyncio.Lock** (await lock; async with lock:) — same API family as threading but loop-aware (never block the loop!).\n\n**Toolkit parity**: asyncio.Lock/RLock/Semaphore/BoundedSemaphore/Event/Condition — await-compatible twins; queue.Queue's async sibling asyncio.Queue (put/get coroutines) powering producer/consumer tasks.\n\n**The REAL killer to avoid**: BLOCKING CALLS inside async code (time.sleep, sync DB drivers, CPU crunch) — freezes ALL tasks (no preemption rescue!). Remedies: async libraries, asyncio.to_thread (3.9+) / run_in_executor for unavoidable sync bits.\n\n**Multi-loop/multi-process caveat**: asyncio primitives bind to ONE loop — cross-process still needs multiprocessing primitives.\n\nDemo double-fetch bug fixed with async-with-Lock — subtle-race showcase.",
        code: `import asyncio

cache: dict = {}
lock = asyncio.Lock()

async def expensive(k):
    await asyncio.sleep(0.05)
    return k.upper()

async def get_value(k):
    # RACY version: both tasks miss -> both fetch
    if k not in cache:
        cache[k] = await expensive(k)
    return cache[k]

async def safe_get(k):
    async with lock:                    # span the await gap
        if k not in cache:
            cache[k] = await expensive(k)
        return cache[k]

async def main():
    r = await asyncio.gather(get_value("x"), get_value("x"))
    print("racy calls made:", expensive.calls := getattr(expensive, "calls", 0))
    s = await asyncio.gather(safe_get("y"), safe_get("y"))
    print(s)

asyncio.run(main())`,
        codeLanguage: "python",
        explanation: "Between awaits tasks are atomic, but await-gapped check-then-act races persist — span them with asyncio.Lock/Queue twins, and above all never block the loop.",
      },
      {
        id: "pyx9",
        question: "When does GIL release happen? How do you verify your workload benefits from threads?",
        answer: "**GIL release points**:\n1. Blocking SYSCALLS around I/O: socket recv/send waiting, file reads, sleep — CPython releases around the OS call, reacquiring after.\n2. Deliberate C-extension sections: hashlib/zlib compressing large buffers, NumPy ufuncs, database drivers, regex on big strings — authors wrap long C regions with Py_BEGIN_ALLOW_THREADS macros.\n3. NOT released: pure-Python computation loops (bytecode holds lock, switching only between opcodes/ticks).\n\n**Verification playbook (evidence over vibes)**:\n1. Amdahl sketch: estimate fraction P of wall-time in GIL-releasing waits; speedup ceiling = 1/(1-P).\n2. MICRO-BENCHMARK: run workload serially vs ThreadPoolExecutor(N) measuring wall-clock — near-linear gain ⇒ releasing (I/O-bound ✓); flat/worse ⇒ holding (CPU-bound → processes).\n3. Profile attribution: py-spy dump shows threads parked in epoll/read (good) vs eval_loop (bad); cProfile cumulative on native calls hints.\n4. Production signal: CPU utilization during threaded phase — pinned ~1 core ⇒ GIL-bound; spread ⇒ parallel I/O.\n\n**Escape hatches when verification disappoints**: process pools, asyncio restructuring (if wait-heavy), native acceleration (numpy/cython nogil sections), Rust/C extensions releasing GIL, or free-threaded 3.13+ builds experimentally.",
        code: `import hashlib, time, os
from concurrent.futures import ThreadPoolExecutor

payload = os.urandom(4_000_000)

def digest(_):
    return hashlib.sha256(payload).hexdigest()[:8]   # releases GIL in C

data = list(range(8))
t0 = time.perf_counter()
[digest(d) for d in data]
serial = time.perf_counter() - t0

t0 = time.perf_counter()
with ThreadPoolExecutor(4) as ex:
    list(ex.map(digest, data))
par = time.perf_counter() - t0
print(f"serial={serial:.3f}s threads={par:.3f}s -> speedup {serial/par:.1f}x")`,
        codeLanguage: "python",
        explanation: "GIL frees during blocking syscalls and GIL-aware C sections (hashlib/numpy/IO) — benchmark serial-vs-threaded wall times and watch core utilization to prove your workload actually parallelizes.",
      },
      {
        id: "pyx10",
        question: "How do you shut down concurrent systems gracefully?",
        answer: "**Graceful shutdown anatomy** (drain work, release resources, bounded wait):\n\n**Threads**: sentinel POISON PILLS into queue.Queue (workers break on None) + task_done/join drain + join(timeout) workers; OR Event-flag checked per iteration (while not stop.is_set()). Executor route: shutdown(wait=True, cancel_futures=True) (3.9+) stops NEW submissions, cancels queued, finishes running.\n\n**Processes**: Pool.terminate() harsh vs close()+join() drained; workers cooperate via shared Event checking; child SIGTERM handlers (signal.signal) setting flags for cleanup windows.\n\n**asyncio**: cancellation IS the mechanism — task.cancel() raises CancelledError at next await; tasks catch ONLY to CLEANUP then RE-RAISE (swallowing breaks timeout/cancellation semantics!); shield() protects critical finalization; TaskGroup scopes cancel-all automatically on exit/exception; asyncio.run closes loop after gathering pending.\n\n**Signals wiring**: SIGTERM/SIGINT handler sets stop-event / cancels main task — container/K8s orchestration expects this within grace periods (SIGKILL follows!).\n\n**Universal checklist**: stop accepting new work → drain/in-flight completion (bounded!) → flush/close resources → exit codes meaningful. Timeout everywhere — graceful ≠ infinite.",
        code: `import asyncio

async def service(stop_evt: asyncio.Event):
    try:
        while not stop_evt.is_set():
            await asyncio.sleep(0.05)       # simulate request
            print("served")
    except asyncio.CancelledError:
        print("cleanup: flush metrics")
        raise                               # re-raise!

async def main():
    stop = asyncio.Event()
    svc = asyncio.create_task(service(stop))
    await asyncio.sleep(0.12)
    stop.set()
    await asyncio.wait_for(svc, timeout=1)  # bounded drain
    print("exited cleanly")

asyncio.run(main())`,
        codeLanguage: "python",
        explanation: "Graceful shutdown = stop intake, drain in-flight work with bounded waits, release resources — poison pills/events for threads, cooperative cancellation for asyncio, signal handlers wiring it to SIGTERM.",
      },
      {
        id: "pyx11",
        question: "How does concurrent.futures unify threads and processes?",
        answer: "**concurrent.futures** abstracts execution behind Executor + Future — swap ThreadPoolExecutor/ProcessPoolExecutor WITHOUT touching call-site logic:\n\nwith ProcessPoolExecutor() as ex:      # was ThreadPoolExecutor\n    pages = list(ex.map(fetch, urls))\n\n**Core API**:\n- submit(fn, *a, **kw) → Future (non-blocking); future.result(timeout)/exception()/add_done_callback; cancel() pending ones.\n- map(fn, iterables) ordered lazy; as_completed(futures) iterate COMPLETION order (progress bars, first-wins races); wait(fs, return_when=FIRST_COMPLETED/ALL_COMPLETED/FIRST_EXCEPTION).\n\n**Future semantics**: exceptions STASHED until .result() re-raises there — centralized error handling versus raw threads' silent stderr. Timeouts enforce liveness.\n\n**Choosing executor**: I/O modest-scale → Threads; CPU/GIL-bound → Processes (picklable fn+args constraint!); async world bridges via loop.run_in_executor(None, sync_fn) integrating legacy blocking calls INTO event loops.\n\n**Limits worth naming**: no priorities/retries built-in (layer atop), initializer/initargs per-worker setup hooks, mp context selection for spawn/fork control.\n\nInterview closer: futures model = promise-style composition predating async/await — conceptual bridge demonstrating depth.",
        code: `from concurrent.futures import (
    ThreadPoolExecutor, ProcessPoolExecutor,
    as_completed, wait, FIRST_COMPLETED)

def square(n): return n * n

if __name__ == "__main__":
    with ProcessPoolExecutor(max_workers=3) as cpu_pool:
        print(list(cpu_pool.map(square, [2, 3, 4])))

    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = [pool.submit(square, i) for i in range(6)]
        done, pending = wait(futs, return_when=FIRST_COMPLETED)
        print("first done:", done.pop().result())
        for f in as_completed(futs):
            print(f.result(), end=" ")
        print()`,
        codeLanguage: "python",
        explanation: "Executors expose submit/map/as_completed over Futures regardless of thread-or-process backend — unified error re-raising on .result(), easy backend swaps, and executor bridging into asyncio loops.",
      },
      {
        id: "pyx12",
        question: "What common concurrency bugs should you recognize instantly?",
        answer: "Rapid-fire incident catalogue:\n\n**1. Lost updates**: counter += 1 across threads without locks (interleaved LOAD/ADD/STORE). Fix Lock or atomic structures.\n\n**2. Check-then-act races**: if k not in cache: fetch-and-store ×N tasks duplicate work. Fix lock-spanning or setdefault/single-flight patterns.\n\n**3. Deadlock**: two locks acquired in OPPOSITE orders by two threads. Fix global ordering/timeout/single-lock redesign.\n\n**4. Blocking the event loop**: time.sleep/requests inside async task freezing all tasks. Fix async libs/to_thread.\n\n**5. Never-awaited coroutines**: calling async fn without await — nothing executes (RuntimeWarning ghost behavior).\n\n**6. Unretrieved task exceptions**: fire-and-forget asyncio Tasks failing silently until GC warning; failures lost. Fix done-callbacks/TaskGroup/gather.\n\n**7. Swallowed CancelledError**: bare except around awaits breaking timeouts/shutdown. Fix catch-cleanup-RERAISE.\n\n**8. Spawn-mode crashes**: multiprocessing lambdas/REPL targets unpicklable; missing __main__ guard causing process bombs. Fix module-level functions + guards.\n\n**9. Daemon mid-write kills**: daemonic threads terminated during file writes corrupting artifacts. Fix cooperative stop.\n\n**10. Shared-state-across-processes illusions**: globals reset per spawned process. Fix explicit IPC.\n\nNarrate #3 deadlock sequence + #6 retrieval fix concretely; rapid-list rest.",
        code: `import asyncio, threading

lock_a, lock_b = threading.Lock(), threading.Lock()

# DEADLOCK recipe (do NOT run): T1 holds a wants b; T2 holds b wants a.
def t1_bad():
    with lock_a:
        threading.Event().wait(0.01)
        with lock_b: pass               # ordering violation

async def fire_and_forget_leak():
    async def doomed():
        raise RuntimeError("lost!")
    asyncio.create_task(doomed())       # nobody awaits/retrieves!
    await asyncio.sleep(0.01)

asyncio.run(fire_and_forget_leak())     # prints warning at GC`,
        codeLanguage: "python",
        explanation: "Instant-recognition list: lost updates, TOCTOU doubles, opposite-order deadlocks, loop-blocking calls, never-awaited coroutines, unretrieved task errors, swallowed cancellations, spawn pickling bombs.",
      },
      {
        id: "pyx13",
        question: "How would you design a rate limiter for concurrent callers?",
        answer: "**Requirements framing**: cap events per WINDOW (fixed/sliding/token-bucket), thread-safe AND/OR async-safe, bounded waiting vs fail-fast modes.\n\n**Token bucket (canonical)**: capacity C tokens refill at R/sec; each call consumes 1 (or n) tokens; empty⇒wait/unblock. Handles bursts ≤C while averaging R.\n\n**Thread-safe implementation options**:\n1. **Semaphore + replenisher thread**: BoundedSemaphore(C); background thread releases elapsed tokens periodically — coarse but simple.\n2. **Lock + timestamp ledger**: with lock: purge timestamps older than window; if len < limit append-now-pass else compute sleep-until. Sliding-window precision.\n3. Redis-backed (distributed): INCR+EXPIRE or token-bucket Lua — multi-instance truth (production systems!).\n\n**Async variant**: asyncio.Lock + monotonic() timestamps; await computed sleep OUTSIDE lock (don't serialize sleepers unnecessarily — wake-stagger via condition or per-task sleeps).\n\n**Design details interviewers probe**: clock source (time.monotonic — immune to NTP jumps!), fairness (FIFO vs starvation), burst allowance semantics, per-key sharding (dict of limiters + eviction), observability (rejected/waited metrics).\n\nCompact sliding-window thread class demo — implementation credibility.",
        code: `import threading, time
from collections import deque

class RateLimiter:
    def __init__(self, max_calls, period):
        self.max, self.period = max_calls, period
        self.hits = deque()
        self.lock = threading.Lock()

    def acquire(self):
        while True:
            with self.lock:
                now = time.monotonic()
                while self.hits and now - self.hits[0] > self.period:
                    self.hits.popleft()
                if len(self.hits) < self.max:
                    self.hits.append(now)
                    return True
                wait = self.period - (now - self.hits[0])
            time.sleep(min(wait, 0.05))

limiter = RateLimiter(max_calls=3, period=0.2)
for i in range(5):
    limiter.acquire()
    print("call", i, "passed at", round(time.monotonic() % 10, 3))`,
        codeLanguage: "python",
        explanation: "Token buckets or sliding-window ledgers under a lock (monotonic clocks!) rate-limit threads; mirror with asyncio.Lock for loops, and reach for Redis when limits span instances.",
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced Topics & Common Traps",
    icon: "🎓",
    questions: [
      {
        id: "pya1",
        question: "How do type hints work and what do they buy you?",
        answer: "**Mechanics**: annotations attach EXPRESSIONS to parameters/variables/returns — stored in __annotations__, NOT enforced at runtime by Python itself. Static checkers (mypy, pyright/pylance) + IDEs consume them; frameworks (FastAPI/pydantic) derive schemas/validation dynamically.\n\n**Syntax spectrum**:\ndef greet(name: str, excited: bool = False) -> str:\nitems: list[int] = []           # builtin generics 3.9+\npos: tuple[str, float] | None   # union operator 3.10+\nOptional[X] ≡ X | None legacy spelling\nCallable[[int], str], Iterable[T], Literal[\"r\",\"w\"], TypedDict dicts, Annotated[int, Ge(0)] metadata.\n\n**from __future__ import annotations** (or 3.12+ defaults trajectory) makes annotations STRINGS lazily — forward refs without quotes, faster startup.\n\n**What they BUY**:\n1. Bug catching PRE-runtime (None-passing, wrong types across boundaries).\n2. Refactoring confidence (rename impact visible), IDE completion/jump-to-def quality leap.\n3. Executable documentation of APIs.\n4. Framework magic (dependency injection, OpenAPI generation).\n\n**Gradual typing doctrine**: annotate public surfaces/boundaries first; check strictness ramp (mypy --strict aspirational); ignore= pragmatism. Runtime validation STILL needs pydantic/asserts — types describe, they don't guard!",
        code: `def top_prices(items: list[tuple[str, float]], n: int = 3) -> dict[str, float]:
    ranked = sorted(items, key=lambda kv: kv[1], reverse=True)[:n]
    return dict(ranked)

prices: list[tuple[str, float]] = [("gpu", 999.0), ("ssd", 89.5)]
print(top_prices(prices, n=2))
# mypy catches: top_prices([("gpu", "999")])  -- str in float slot`,
        codeLanguage: "python",
        explanation: "Annotations are inert metadata consumed by checkers/IDEs/frameworks — gradual typing documents contracts and catches cross-boundary mistakes statically, while runtime validation stays your job.",
      },
      {
        id: "pya2",
        question: "What is typing.Protocol and structural typing?",
        answer: "**Protocol** (PEP 544) declares EXPECTED MEMBERSHIP SHAPE — any object with matching methods qualifies WITHOUT inheriting: nominal-free \"static duck typing\".\n\nclass Drawable(Protocol):\n    def draw(self) -> None: ...\n\ndef render(d: Drawable): d.draw()\nrender(AnyClassWithDraw())     # passes mypy — structure matches!\n\n**Key properties**:\n1. Implementers stay UNAWARE — third-party/plain classes satisfy protocols implicitly (vs ABC requiring inheritance/register).\n2. @runtime_checkable enables isinstance(obj, Protocol) shape-checks (method-presence only — signatures unchecked at runtime!).\n3. Protocol classes can provide DEFAULT IMPLEMENTATIONS mixed-in when explicitly inherited.\n4. Variance handled via TypeVar bounds/protocols generics (Iterable[T] covariance conventions).\n\n**Protocol vs ABC decision**: enforcing framework membership + shared concrete behavior → ABC (nominal, register escape hatch); describing CAPABILITIES consumed loosely (file-like, closeable, hash-shaped) → Protocol (zero coupling). Stdlib precedent: SupportsInt/SupportsIndex, HasItems-ish patterns migrating toward protocols.\n\n**Ecosystem impact**: decoupled seams for testing (define narrow protocol, fake trivially), dependency inversion without inheritance tax.\n\nDemo runtime_checkable isinstance + checker-verified mismatch comment — modern-typing fluency.",
        code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Closeable(Protocol):
    def close(self) -> None: ...

class Socket:
    def close(self): print("socket closed")

class NoClose:
    pass

def cleanup(resource: Closeable):
    resource.close()

cleanup(Socket())                       # structural fit
print(isinstance(Socket(), Closeable))  # True by shape
print(isinstance(NoClose(), Closeable)) # False`,
        codeLanguage: "python",
        explanation: "Protocols type-check by member SHAPE without declarations — static duck typing decoupling consumers from providers, with runtime_checkable offering presence-only isinstance checks.",
      },
      {
        id: "pya3",
        question: "Explain generics: TypeVar, Generic classes, and bound constraints.",
        answer: "**TypeVar** parameterizes relationships BETWEEN types — preserving precision beyond Any:\n\nT = TypeVar(\"T\")\ndef first(xs: list[T]) -> T: ...        # same T in/out — element type preserved!\n\nWithout generics: list[Any]→Any loses info; checkers blind downstream.\n\n**Constraints & bounds**:\n- Bound (hierarchy ceiling): T = TypeVar(\"T\", bound=Comparable-ish Shape) — accepts subclasses, body may use Shape members.\n- Constrained (exact menu): AnyStr = TypeVar('AnyStr', bytes, str) — exactly those, mixing forbidden per-call.\n\n**Generic classes**: class Stack(Generic[T]): push(self, item: T)... — Stack[int] instantiations track element types through methods.\n\n**Modern conveniences**: PEP 695 (3.12) sugar — def first[T](xs: list[T]) -> T and class Stack[T]: eliminating TypeVar boilerplate; ParamSpec (3.10) forwarding CALLABLE SIGNATURES (decorator wrappers preserving arg types!): P = ParamSpec(\"P\"); def deco(fn: Callable[P, R]) -> Callable[P, R].\n\n**Where shine appears**: container utilities, ORM query builders, typed repositories, decorator libraries — anywhere input-type determines output-type.\n\nDemo identity/first preservation plus generic Stack — inference payoff visible in comments.",
        code: `from typing import TypeVar, Generic

T = TypeVar("T")

def middle(xs: list[T]) -> T:
    return xs[len(xs) // 2]

nums = middle([1, 2, 3])            # inferred int
words = middle(["a", "b"])          # inferred str

class Box(Generic[T]):
    def __init__(self, item: T): self.item = item
    def swap(self, other: "Box[T]") -> None:
        self.item, other.item = other.item, self.item

b1: Box[int] = Box(10)
b2: Box[int] = Box(20)
b1.swap(b2)
print(b1.item, b2.item, nums, words)`,
        codeLanguage: "python",
        explanation: "TypeVars link input/output types so checkers preserve precision; bound/constrained variants restrict scope, Generic[T] classes track parameters, and 3.12's [T] syntax sweetens it all.",
      },
      {
        id: "pya4",
        question: "Dataclasses vs NamedTuple vs attrs vs pydantic — choosing record types.",
        answer: "**Decision matrix across the record-type spectrum**:\n\n**typing.NamedTuple**: immutable, tuple-COMPATIBLE (unpacking, sorting, low memory), class-syntax hints. Choose when tuple-interop matters (CSV rows, coordinate math, sorting heterogeneous keys) or minimal deps.\n\n**@dataclasses.dataclass**: stdlib value objects; mutable-by-default; rich field controls (default_factory/frozen/slots/kw_only), __post_init__ validation hooks. Default choice for internal DTOs/configs/domain records without external validation needs.\n\n**attrs**: third-party predecessor of dataclasses — richer out-of-box: validators (@validators.gt(0)), converters (str.strip coercion), slots always-on option, finer eq/order generation. Choose for validation-lightweight projects already dep-tolerant.\n\n**pydantic BaseModel**: RUNTIME VALIDATION + parsing at boundaries — coerces types (\"42\"→42 int mode), nested models, JSON/schema generation (FastAPI/OpenAPI engine), settings management. Costs: heavier construction, mutable-class semantics differences (model_config frozen available). Choose for EXTERNAL inputs: HTTP payloads, env config, LLM structured outputs.\n\n**Anti-patterns**: pydantic for pure internals (needless overhead), NamedTuple when mutation lifecycle needed, hand-rolled __init__/__repr__ ceremony any of these eliminate.\n\nQuick perf note: NamedTuple/dataclass(slots) construct fastest; pydantic v2 (pydantic-core rust) narrowed gaps substantially — cite recency awareness.",
        code: `from typing import NamedTuple
from dataclasses import dataclass
from pydantic import BaseModel, Field

class Row(NamedTuple):
    id: int
    label: str

@dataclass(slots=True)
class Config:
    retries: int = 3
    endpoint: str = "/api"

class UserIn(BaseModel):
    email: str
    age: int = Field(ge=0, le=130)

u = UserIn(email="a@b.c", age="29")     # coerced!
print(Row(1, "x"), Config(), u.age + 1, type(u.age))`,
        codeLanguage: "python",
        explanation: "NamedTuple for tuple-shaped immutables, dataclass as stdlib workhorse, attrs when validators matter cheaply, pydantic when EXTERNAL data demands parsing/validation and schemas.",
      },
      {
        id: "pya5",
        question: "How do Enums improve code over string/int constants?",
        answer: "**Enum** (enum module) defines CLOSED symbol sets with identity, iteration, and namespace safety:\n\nclass Status(Enum):\n    PENDING = \"pending\"\n    ACTIVE = \"active\"\n\n**Wins over bare constants**:\n1. **Closed-world checks**: match/if exhaustiveness (checkers flag missing arms w/ Literal+Enum combos); typos become AttributeError not silent string-compare misses.\n2. **Identity semantics**: is-comparison valid (singletons); accidental equality traps avoided (Status.ACTIVE != \"active\" — forces deliberate .value extraction).\n3. **Namespace grouping + iteration** (list(Status), len) powering UIs/CLI choices.\n4. **Behavior attachment**: methods/properties ON enum members (Status.ACTIVE.can_transition(...)), _missing_ hooks parsing tolerant.\n\n**Flavors**: IntEnum (int-compat — wire protocols/legacy), StrEnum (3.11+, string-compat serialization), Flag/IntFlag (bitmask combos: Perm.R|Perm.W, contains-testing), auto() numbering.\n\n**Patterns**: lookup maps {Status: handler}; from_value via Status(value) with ValueError handling; @unique guarding duplicates; db storage storing .value with boundary conversion.\n\nDemo match-statement dispatch on enum + Flag combos — modern idiomatic polish.",
        code: `from enum import Enum, Flag, auto

class State(Enum):
    IDLE = auto()
    RUNNING = auto()
    FAILED = auto()

class Perms(Flag):
    R = auto()
    W = auto()
    X = auto()

def handle(s: State):
    match s:
        case State.IDLE: return "spin up"
        case State.RUNNING: return "healthy"
        case State.FAILED: return "alert!"

p = Perms.R | Perms.W
print(handle(State.RUNNING), p, Perms.R in p, list(Perms))
print(State["RUNNING"], State(3))`,
        codeLanguage: "python",
        explanation: "Enums close vocabularies with identity, iteration, attached behavior and match-friendly dispatch — IntEnum/StrEnum/Flag variants bridge wire formats and bitmask combinations.",
      },
      {
        id: "pya6",
        question: "What are descriptors' practical applications beyond property?",
        answer: "(Beyond the OOP-topic primer — applied catalog.) Descriptors power FRAMEWORK-GRADE attribute behaviors reusable across MANY classes:\n\n1. **Typed column/field systems**: ORM columns (SQLAlchemy Column descriptors intercept access → lazy-load rows), schema fields (marshmallow/pydantic v1 style) — attribute syntax hiding IO/validation.\n2. **Lazy/computed caching attributes**: descriptor storing cached value post-first-access (cached_property IS a non-data descriptor!) with invalidation hooks.\n3. **Validation contracts**: reusable Positive/NonEmpty/Range descriptors (see OOP example) — DRY across dozens of models vs property repetition.\n4. **Deprecation shims**: descriptor warns on ACCESS then forwards — smooth migrations without breaking attribute reads.\n5. **Unit conversion facades**: temperature_c/temperature_f views over single stored kelvin value; timezone-aware datetime attributes.\n6. **Method binding machinery itself**: functions ARE descriptors (__get__ returns bound methods!) — the reason obj.method binds; static/classmethod similarly implemented. Knowing this explains binding deeply.\n7. **Weakref-backed associations**: extra-data-per-instance maps without polluting instance dicts (WeakKeyDictionary under __get__).\n\n**Build trigger heuristic**: same accessor pattern appearing in ≥3 classes ⇒ promote to descriptor with __set_name__. Demo deprecated-access + cached descriptor duo.",
        code: `import warnings

class Deprecated:
    def __set_name__(self, owner, name):
        self.name = name
    def __get__(self, obj, objtype=None):
        if obj is not None:
            warnings.warn(f"{owner.__name__}.{self.name} deprecated",
                          DeprecationWarning, stacklevel=2)
            return obj.__dict__[self.name]
        return self

class Legacy:
    payload = Deprecated()
    def __init__(self): self.payload = {"v": 1}

lg = Legacy()
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    print(lg.payload)
    print("warned:", bool(w))`,
        codeLanguage: "python",
        explanation: "Beyond property, descriptors implement ORMs' columns, reusable validators, caches, deprecation warnings and method-binding itself — promote any accessor pattern repeated across classes.",
      },
      {
        id: "pya7",
        question: "__getattr__ vs __getattribute__ — difference and dangers?",
        answer: "**Interception tiers**:\n- **__getattribute__(self, name)**: called for EVERY attribute access — universal gateway. Override = high-risk (must delegate super().__getattribute__ or infinite recursion; breaks internals subtly; performance tax on all accesses).\n- **__getattr__(self, name)**: FALLBACK invoked only AFTER normal lookup FAILS (AttributeError path) — safe extension hook for dynamic/virtual attributes.\n\n**Canonical uses**:\n- __getattr__: proxy/delegation objects (forward unknown attrs to wrapped client), lazy-loading ORMs (relationship attrs triggering queries), dynamic REST clients (client.users.list generated), config namespaces.\n- __getattribute__: logging/tracing ALL accesses, access-control enforcement, transparent persistence layers — framework territory, rarely app code.\n\n**Dangers checklist**:\n1. Recursion: referencing self.anything INSIDE either hook re-triggers lookup — use object.__getattribute__(self,'x') or precomputed locals.\n2. __getattr__ masking typos: typo'd names silently hit fallback returning junk — raise AttributeError deliberately for unknowns, validate prefixes.\n3. Dunder lookups BYPASS instance (type-level special-method lookup) — __getattr__ won't virtualize __len__ etc.\n4. Pickle/copy interplay expecting specific protocols.\n\nDemo delegation proxy via __getattr__ + recursion-safe __getattribute__ snippet — precise-tier understanding.",
        code: `class LazyClient:
    def __init__(self, inner):
        object.__setattr__(self, "_inner", inner)   # bypass hook safely
    def __getattr__(self, name):                     # misses only
        return getattr(self._inner, name)

class Audit:
    def __init__(self): object.__setattr__(self, "x", 5)
    def __getattribute__(self, name):
        print(f"access:{name}")
        return object.__getattribute__(self, name)   # mandatory delegation

inner = type("I", (), {"hello": lambda s: "hi"})()
proxy = LazyClient(inner())
print(proxy.hello())

a = Audit()
print(a.x)`,
        codeLanguage: "python",
        explanation: "__getattr__ handles MISSES (safe for proxies/lazy loads); __getattribute__ sees EVERYTHING (framework tracing) — both must avoid self-referential recursion via object.__getattribute__.",
      },
      {
        id: "pya8",
        question: "unittest vs pytest — comparison and migration notes.",
        answer: "**unittest** (stdlib, xUnit heritage): class TestCase hierarchy, setUp/tearDown fixtures, assertion METHOD zoo (assertEqual/assertRaises...), TestLoader discovery. Verbose but zero-dependency, familiar to JUnit migrants.\n\n**pytest** (de-facto industry standard):\n- Plain assert statements WITH INTROSPECTIVE REWRITING — failure output shows intermediate expressions (assert a == b prints values!) — massive debugging speedup.\n- **Fixtures via dependency injection**: @pytest.fixture functions injected BY NAME into tests; scope=session/module/function; yield-teardown; conftest.py sharing — replaces setUp hierarchies elegantly, composable/overridable.\n- Parametrize: @pytest.mark.parametrize(\"x,out\", [(2,4),(3,9)]) — data-driven tables killing copy-paste tests.\n- Rich plugin ecosystem (pytest-asyncio, pytest-cov, pytest-mock, xdist parallel).\n- Runs unittest suites TOO (migration-friendly coexistence).\n\n**Migration path**: pytest adopts existing unittest classes immediately → incrementally convert assertions/fixtures → introduce parametrize/fixtures on new tests.\n\n**Craft essentials regardless framework**: AAA arrange-act-assert, one-behavior-per-test, fast unit isolation + thin integration tier, mocking SEAMS not internals (monkeypatch fixture pytest-flavored).\n\nSide-by-side same-test rendering — readability verdict obvious.",
        code: `import unittest
import pytest

def add(a, b): return a + b

class AddTest(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(2, 3), 5)

@pytest.mark.parametrize("a,b,out", [(2, 3, 5), (0, 0, 0), (-1, 1, 0)])
def test_add_pytest(a, b, out):
    assert add(a, b) == out              # rich failure diffs

@pytest.fixture
def sample():
    return {"k": 42}

def test_fixture(sample):
    assert sample["k"] == 42`,
        codeLanguage: "python",
        explanation: "pytest wins via plain-assert introspection, DI fixtures, parametrize tables and plugins (while running unittest suites) — migrate incrementally starting from new tests.",
      },
      {
        id: "pya9",
        question: "How does mocking work well in Python tests?",
        answer: "**Mock toolbox (unittest.mock)**:\n- Mock/MagicMock: attribute-recording stand-ins (calls tracked, return_value/ side_effect scripting; MagicMock covers dunders).\n- patch(...): TEMP-SWAP targets — CRITICAL RULE: patch WHERE USED, not where defined (from module import fn binds locally — patch module.fn not importing-module.fn!). autospec=True mirrors signatures preventing drift-rot mocks.\n- monkeypatch (pytest fixture): setattr/delattr/setenv with auto-undo — pythonic lighter patching.\n\n**Craft principles separating seniors**:\n1. Mock DEPENDENCIES at seams (network/db/clock/random), never the unit's internals — over-mocking tests implementation not behavior (refactor fragility).\n2. Assert BEHAVIOR: mock.assert_called_once_with(...) sparingly — prefer asserting OBSERVABLE outcomes; interaction-tests only for imperative edges (email sent!).\n3. side_effect for sequences/exceptions; return chains via Mock(return_value=Mock()).\n4. Time/random determinism: freeze clock via injectable now()/patch time.time — flaky-test antidote.\n5. Async: AsyncMock for coroutine returns; patch autospec-aware.\n\n**Anti-patterns**: mocking EVERYTHING (brittle theater), real-network unit tests, sleeping tests (inject waits/events).\n\nDemo patch-where-used + autospec assertion — craft-signaling snippet.",
        code: `from unittest.mock import patch, MagicMock

class Client:
    def fetch(self, url): ...

def page_title(client: Client, url: str) -> str:
    return client.fetch(url).split("<title>")[1]

with patch("__main__.Client.fetch", autospec=True) as m:
    m.return_value = "<title>Hello</title>"
    c = Client()
    print(page_title(c, "http://x"))
    m.assert_called_once_with(c, "http://x")   # self arg with autospec

fake = MagicMock(side_effect=[1, 2, ValueError("end")])
print(fake(), fake())
try:
    fake()
except ValueError as e:
    print(e)`,
        codeLanguage: "python",
        explanation: "Patch dependencies where LOOKED UP (autospec'd), script return_value/side_effect, assert interactions sparingly — mock seams like network/time, never your own internals.",
      },
      {
        id: "pya10",
        question: "How do you configure production-grade logging?",
        answer: "**Architecture**: Logger (named hierarchy app.db) → Handler (destination) → Formatter (layout) → Filter (predicate). Loggers PROPAGATE to ancestors (child logs flow root handlers) — configure ROOT once, get loggers per-module via logging.getLogger(__name__).\n\n**Level discipline**: DEBUG (diagnostic detail), INFO (business milestones), WARNING (degradations/recoverable), ERROR (failed ops needing attention), CRITICAL (system-fatal). Set thresholds per-handler/env (dev DEBUG console, prod INFO json).\n\n**Production essentials**:\n1. Structured OUTPUT: python-json-logger/json formatter — machine-parseable fields (event, request_id, duration_ms) beats grep-regex forever.\n2. Context propagation: logger adapters/extra fields, contextualize via contextvars middleware (request ids crossing awaits!).\n3. RotatingFileHandler/TimedRotating or stdout-to-container-collector (12-factor: LOG TO STDOUT, orchestrator owns shipping).\n4. logger.exception(msg) inside except captures TRACEBACK automatically (exc_info=True equivalent).\n5. NEVER log secrets/PII (masking filters); lazy %-args formatting avoiding cost when disabled (log.debug(\"x %s\", expensive()) NOT f-string!).\n6. dictConfig/fileConfig centralization; uvicorn/gunicorn handlers alignment avoiding double-formatting.\n\nAnti-patterns: print debugging residue, root-level basicConfig scattered across modules, string-format eagerness, log-and-swallow without reraise decisions.",
        code: `import logging, logging.config

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"json": {"format": "%(asctime)s %(levelname)s %(name)s %(message)s"}},
    "handlers": {"console": {"class": "logging.StreamHandler",
                             "formatter": "json", "level": "INFO"}},
    "root": {"handlers": ["console"], "level": "DEBUG"},
}
logging.config.dictConfig(LOGGING)
log = logging.getLogger("app.payments")

try:
    raise ValueError("card declined")
except ValueError:
    log.exception("payment failed order=%s", "ord-99")   # lazy + traceback`,
        codeLanguage: "python",
        explanation: "Hierarchical loggers feed configured handlers/formatters — ship structured JSON to stdout with levels disciplined, lazy %-formatting, exception() tracebacks and contextvars for request correlation.",
      },
      {
        id: "pya11",
        question: "What is the time complexity of common Python operations? (cheat sheet)",
        answer: "**Hash-based (dict/set)**: membership/insert/delete/get O(1) average (O(n) worst adversarial); iteration O(n); dict merge O(n+m).\n\n**list (dynamic array)**: index O(1); append/pop-END amortized O(1); insert(0)/pop(0)/delete-middle O(n) shifting; membership `in` O(n) scan; slice k items O(k); sort O(n log n) stable Timsort; reverse O(n); min/max/count O(n).\n\n**collections.deque**: BOTH ends O(1); middle index O(n).\n\n**str**: immutable — concat += O(n²) naive loops (join O(total)); slicing/index O(k)/O(1); find O(n·m) typical fast-practical; upper/split O(n).\n\n**heapq**: push/pop O(log n); peek O(1); heapify O(n); nlargest(k) O(n log k).\n\n**sorted containers absent stdlib** (bisect insertions O(n) shift despite O(log n) search).\n\n**Algorithms staples**: recursion overhead per-call µs; comprehension ≈ 0.7× loop-append cost; function call overhead notable in hot loops (inline/manual unroll judiciously).\n\n**Meta-advice**: complexity answers paired with CONSTANT factors (hashing cost of keys, tuple-vs-list allocation) and MEASURED profiles — big-O alone rarely decides; quadratic ACCIDENTALS (nested membership scans, pop(0) queues, string += ) cause real incidents.",
        code: `import timeit

setup = "from collections import deque; d=list(range(10_000)); q=deque(d)"
print("list in  :", timeit.timeit("9999 in d", setup, number=1000))
print("set in   :", timeit.timeit("s=set(d); 9999 in s", setup, number=1000))
print("pop(0)   :", timeit.timeit("d.pop(0)", setup, number=2000))
print("popleft  :", timeit.timeit("q.popleft()", setup, number=2000))`,
        codeLanguage: "python",
        explanation: "Memorize the grid — hashes O(1), array ends O(1)-amortized but fronts O(n), deque both-ends O(1), sort nlogn, string += quadratic — then pair theory with measured constant factors.",
      },
      {
        id: "pya12",
        question: "List the classic Python gotchas every interviewer loves.",
        answer: "Rapid-fire hall of fame (know WHY each bites):\n\n**1. Mutable default arguments** — shared across calls ([] default persists); fix None-sentinel.\n\n**2. Late-binding closures** — lambdas in loops see FINAL variable; bind via default i=i.\n\n**3. is vs ==** — small-int/string interning coincidences; is reserved for None/singletons.\n\n**4. Chained assignment aliasing** — a = b = [] one shared list; [[0]*3]*3 row-sharing matrix bug.\n\n**5. Integer division // floors negative** — -7//2=-4; % sign follows divisor.\n\n**6. Float representation** — 0.1+0.2!=0.3; Decimal/isclose.\n\n**7. Tuple containing mutable mutates** — t[0]+=… raises TypeError AFTER mutating (iadd succeeded, store-back failed).\n\n**8. Boolean is int** — True+True==2; isinstance(True,int) True.\n\n**9. Exception variable deleted** after except block (as-scope hygiene).\n\n**10. Default dict-view mutation during iteration** RuntimeError; list-snapshot fixes.\n\n**11. round half-to-even** — round(0.5)=0 round(1.5)=2 banker's rounding.\n\n**12. String interning quirks** — 'a is a' true, runtime-built may differ.\n\n**13. sys.path shadowing** — local random.py hijacks stdlib.\n\nDeliver 3–4 with live demos, name-drop remainder — breadth-plus-depth calibrated close.",
        code: `def trap(xs=[]): xs.append(1); return xs
print(trap(), trap())                       # shared default!

fns = [lambda: i for i in range(3)]
print([f() for f in fns])                   # late binding [2,2,2]

t = ([1],)
try:
    t[0] += [2]
except TypeError:
    pass
print(t)                                    # mutated despite TypeError!

print(round(0.5), round(1.5), -7 // 2, True + True)`,
        codeLanguage: "python",
        explanation: "The canon: mutable defaults, late-binding lambdas, interning-vs-is, aliased assignments, floor-division signs, float equality, tuple-element iadd quirk, banker's rounding, view-mutation errors.",
      },
      {
        id: "pya13",
        question: "How does structural pattern matching work (match/case)?",
        answer: "**PEP 634 (3.10)** — pattern matching far beyond switch:\n\nmatch command.split():\n    case [\"go\", direction]: move(direction)\n    case [\"drop\", *objects]: drop_all(objects)\n    case [action] if action in VERBS: help(action)\n    case _: usage()\n\n**Pattern vocabulary**:\n- **Sequence patterns** [a, b, *rest] (lists/tuples/strings; NOT iterators/sets).\n- **Mapping patterns** {\"cmd\": cmd, \"flags\": **flags} (partial-match subset semantics — killer for JSON routing).\n- **Class patterns** Point(x=int(), y=0) — isinstance + attribute destructuring combined; keyword args bind attributes; __match_args__ positional protocol.\n- **OR patterns** \"n\" | \"north\"; **guard clauses** if-extra conditions; **capture names** lowercase bindings; dotted constants (Color.RED) treated as VALUE comparisons (bare capitalized names are CAPTURES — famous footgun!).\n\n**Semantics**: cases tried TOP-DOWN, first MATCHING (incl. guard) wins; no fall-through; wildcard _ doesn't bind.\n\n**Use zones**: AST/message/JSON dispatch, command parsers, state machines, visitor replacements. Anti-zones: single-variable equality (plain if clearer), boolean flags soup.\n\nDemo JSON-ish handler with mapping+class patterns — flagship differentiator.",
        code: `class Click:
    def __init__(self, x, y): self.x, self.y = x, y

event = {"type": "click", "pos": Click(3, 4)}

def handle(ev):
    match ev:
        case {"type": "click", "pos": Click(x=3, y=y)}:
            return f"triple-click zone y={y}"
        case {"type": "click", "pos": p}:
            return f"click at {p.x},{p.y}"
        case {"type": kind, **rest}:
            return f"unhandled {kind}: {list(rest)}"
        case _:
            return "?"
print(handle(event))`,
        codeLanguage: "python",
        explanation: "match/case destructures sequences, mappings (subset semantics!) and class attributes with guards and OR-patterns — first-match-wins dispatch ideal for JSON/AST/command routing.",
      },
      {
        id: "pya14",
        question: "What profiling tools exist and what's your optimization workflow?",
        answer: "**Workflow doctrine**: MEASURE → attribute → fix hotspot → RE-MEASURE. Never optimize on intuition.\n\n**CPU profiling arsenal**:\n- **cProfile** (deterministic): per-function ncalls/tottime/cumtime — profile run: python -m cProfile -s cumtime app.py; analyze via pstats sorters; overhead noticeable but attribution complete.\n- **py-spy** (sampling, prod-safe): py-spy top/dump/record flamegraphs on LIVE processes — no instrumentation, the incident-responder tool.\n- **line_profiler** (@profile kernprof -l): LINE-level hotspots after function identified.\n- **pyinstrument** (sampling, low-overhead): statistical call-stack timelines friendlier than cProfile for web apps.\n\n**Memory side**: tracemalloc snapshots/diffs, memray flamegraphs incl. native, objgraph growth.\n\n**Optimization ladder once hotspot proven**: algorithm/data-structure swap (O-fixes dwarf micro-opts) → builtin/C-library leverage (sum/map/itertools/numpy vectorization) → caching (lru_cache) → concurrency split (I/O overlap / process fan-out) → micro-tweaks LAST (local-var binding, comprehension swaps — measure each!).\n\n**Communication skill**: quote before/after numbers + flamegraph links; declare diminishing-returns stops. Demo cProfile on quadratic-vs-linear snippet.",
        code: `import cProfile, pstats, io

def quadratic(n):
    hits = 0
    lst = list(range(n))
    for x in lst:
        if x in lst: hits += 1          # O(n^2)
    return hits

pr = cProfile.Profile()
pr.enable(); quadratic(4000); pr.disable()
s = io.StringIO()
pstats.Stats(pr, stream=s).sort_stats("tottime").print_stats(3)
print("\\n".join(s.getvalue().splitlines()[4:9]))

def linear(n):
    return len(set(range(n)) & set(range(n)))   # O(n) rewrite
print(linear(4000))`,
        codeLanguage: "python",
        explanation: "Profile with cProfile locally, py-spy in prod, line_profiler for line truths — then climb the ladder: algorithms first, builtins/C libs, caching, concurrency, micro-tweaks last, numbers always.",
      },
      {
        id: "pya15",
        question: "How do you make Python code faster without changing algorithms?",
        answer: "**Constant-factor toolkit** (post-algorithm sanity):\n\n**1. Lean on C builtins**: sum/min/max/any/all/sorted, str methods, itertools — C-speed loops replace Python-level ones. any(x > 0 for x in xs) beats manual loop+break.\n\n**2. Local variable binding**: hot loops hoisting globals/method lookups (append = lst.append outside loop) — global/attr lookups are dict hops.\n\n**3. Comprehensions/generators over manual append** (~20–40% faster) — but materializing lists you don't need wastes more than saved.\n\n**4. String joining discipline**: ''.join(parts) vs += accumulation (quadratic trap).\n\n**5. Membership containers**: set/dict for repeated `in` tests (O(1) vs O(n)) — dedupe-then-test patterns.\n\n**6. Function-call overhead trims**: inline tiny hot-path helpers judiciously; avoid property calls in inner loops (direct attr where contract allows).\n\n**7. Numeric mass-work → NumPy/Pandas vectorization** (100×+ typical) — or arrays/array module trimming object boxing.\n\n**8. Lazy evaluation**: generators keeping working-set small improves cache locality too.\n\n**9. Compile-out escapes**: Cython/mypyc/Rust (PyO3)/numba JIT for kernel functions — 10–100× on numeric kernels.\n\n**10. Interpreter flags**: python -O strips asserts; PYTHONOPTIMIZE; startup via -S/-X frozen_modules for CLI tools.\n\nAlways pair claims with timeit evidence — show 2 quick wins measured.",
        code: `import timeit

setup = "data = list(range(100_000)); append_target = []"

loop_ver = """
out = []
for x in data:
    if x % 2 == 0:
        out.append(x * 2)
"""
comp_ver = "[x * 2 for x in data if x % 2 == 0]"
gen_ver = "sum(x * 2 for x in data if x % 2 == 0)"

print("loop :", timeit.timeit(loop_ver, setup, number=20))
print("comp :", timeit.timeit(comp_ver, setup, number=20))
print("gen  :", timeit.timeit(gen_ver, setup, number=20))`,
        codeLanguage: "python",
        explanation: "Constant-factor wins: C-builtins over Python loops, comprehensions, local-name hoisting, set-membership, join-not-concat, vectorization, and compiled kernels — each verified by timeit, never assumed.",
      },
      {
        id: "pya16",
        question: "How does packaging and distribution work end-to-end?",
        answer: "**Artifact pipeline**: source tree → **sdist** (.tar.gz source archive) + **wheel** (.whl BUILT distribution — installers PREFER wheels: no build step, faster, no compiler needed) → upload (twine to PyPI / private index) → consumer pip resolves+installs.\n\n**pyproject.toml roles** (PEP 517/518/621): declares build-backend (setuptools/hatchling/flit/poetry-core), project metadata (name/version/deps/requires-python/readme/license), classifiers/urls, optional-dependencies extras ([project.optional-dependencies] dev/test), entry-points ([project.scripts] console commands, gui-scripts), dynamic version sources.\n\n**Build & publish**: python -m build (creates dist/ both artifacts) ; twine check dist/* ; twine upload (PyPI API token). Private mirrors: devpi/artifactory/cloudsmith; corporate index env vars.\n\n**Install modes consumers see**: regular wheel install; **pip install -e .** editable (src-layout path hook for development); pinned requirements/lockfiles reproducibility; pipx for app-isolation CLIs.\n\n**Versioning discipline**: semver-ish MAJOR.MINOR.PATCH, single-sourced (hatch-vcs/setuptools-scm tagging), changelogs; deprecation policy in docs.\n\n**Quality gates pre-publish**: twine check, test-install in fresh venv, README rendering (twine), license files inclusion.\n\nDemo minimal hatchling pyproject + build commands annotated.",
        code: `# pyproject.toml (minimal hatchling)
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "mypkg"
version = "0.3.1"
requires-python = ">=3.10"
dependencies = ["httpx"]

[project.scripts]
mypkg = "mypkg.cli:main"

# terminal flow:
#   pip install build twine
#   python -m build            -> dist/mypkg-0.3.1.tar.gz + .whl
#   twine check dist/*
#   twine upload dist/*        -> PyPI`,
        codeLanguage: "python",
        explanation: "pyproject.toml drives a build-backend producing sdist+wheel; twine publishes to PyPI/private indexes — consumers pin versions or install editable, preferring wheels for compiler-free installs.",
      },
      {
        id: "pya17",
        question: "What senior-level habits distinguish great Python engineers?",
        answer: "Closing synthesis question — demonstrate judgment across dimensions:\n\n**Code craftsmanship**: idiom fluency (comprehensions/context-managers/EAFP/dataclasses) WITHOUT cleverness worship; explicit over implicit; small pure functions + typed boundaries; docstrings that age well.\n\n**Correctness instincts**: property-based testing (hypothesis) alongside examples; edge-first thinking (empty/unicode/huge/concurrent); race-condition radar; security defaults (no eval/pickle-untrusted, parameterized SQL, secret hygiene).\n\n**Performance humility**: measure-first culture (profilers quoted in PRs), complexity literacy with constant-factor honesty, scalability ceilings stated upfront.\n\n**Operational maturity**: structured logging with correlation ids, metrics/traces emitted, graceful degradation + circuit breakers, config via env with validation layers, feature-flag rollout thinking.\n\n**Tooling stewardship**: ruff/black/mypy gates in CI, pre-commit enforcement, lockfile reproducibility, dependency-audit cadence (pip-audit), src-layout packaging hygiene.\n\n**Collaboration signals**: readable PR narratives (what/why/testing), ADR-writing for architectural choices, mentoring through code review questions not dictates.\n\n**Learning posture**: tracks release notes (3.12/3.13 features cited naturally), evaluates trade-offs CURRENTLY (free-threading, uv, pydantic v2) rather than cargo-cult.\n\nPick TWO dimensions, narrate concrete war stories — authenticity lands the offer.",
        code: `# senior-habit sampler: typed seam + measurable + observable
from dataclasses import dataclass
import logging, time, functools

log = logging.getLogger(__name__)

@dataclass(frozen=True, slots=True)
class RetryPolicy:
    attempts: int = 3

def retry(policy: RetryPolicy):
    def deco(fn):
        @functools.wraps(fn)
        def w(*a, **kw):
            for i in range(1, policy.attempts + 1):
                try:
                    return fn(*a, **kw)
                except Transient:
                    log.warning("attempt %d/%d failed", i, policy.attempts)
                    if i == policy.attempts:
                        raise
        return w
    return deco

class Transient(Exception): ...`,
        codeLanguage: "python",
        explanation: "Seniors differentiate through typed boundaries, measurement-first performance, operational observability, tooling gates, honest PR narratives and current-release fluency — judgment over trivia.",
      },
    ],
  },
];

export const pythonMetaPart6: Record<string, PyQuestionMeta> = {
  pyx1: { difficulty: "easy", priority: "high", tags: ["threads"] },
  pyx2: { difficulty: "hard", priority: "very-high", tags: ["asyncio", "event-loop"] },
  pyx3: { difficulty: "medium", priority: "medium", tags: ["coroutines", "history"] },
  pyx4: { difficulty: "medium", priority: "very-high", tags: ["taskgroup", "gather"] },
  pyx5: { difficulty: "easy", priority: "medium", tags: ["daemon"] },
  pyx6: { difficulty: "medium", priority: "high", tags: ["pool", "chunksize"] },
  pyx7: { difficulty: "medium", priority: "high", tags: ["ipc", "shared-memory"] },
  pyx8: { difficulty: "hard", priority: "high", tags: ["async", "locks"] },
  pyx9: { difficulty: "medium", priority: "high", tags: ["gil", "benchmark"] },
  pyx10: { difficulty: "medium", priority: "high", tags: ["shutdown", "graceful"] },
  pyx11: { difficulty: "easy", priority: "high", tags: ["futures", "executors"] },
  pyx12: { difficulty: "medium", priority: "very-high", tags: ["bugs", "pitfalls"] },
  pyx13: { difficulty: "hard", priority: "medium", tags: ["design", "rate-limit"] },

  pya1: { difficulty: "easy", priority: "very-high", tags: ["typing"] },
  pya2: { difficulty: "medium", priority: "high", tags: ["protocol", "structural"] },
  pya3: { difficulty: "hard", priority: "high", tags: ["generics", "typevar"] },
  pya4: { difficulty: "medium", priority: "high", tags: ["records", "pydantic"] },
  pya5: { difficulty: "easy", priority: "high", tags: ["enums"] },
  pya6: { difficulty: "hard", priority: "low", tags: ["descriptors"] },
  pya7: { difficulty: "hard", priority: "medium", tags: ["getattr", "hooks"] },
  pya8: { difficulty: "easy", priority: "very-high", tags: ["testing", "pytest"] },
  pya9: { difficulty: "medium", priority: "high", tags: ["mocking"] },
  pya10: { difficulty: "medium", priority: "high", tags: ["logging"] },
  pya11: { difficulty: "easy", priority: "very-high", tags: ["complexity"] },
  pya12: { difficulty: "medium", priority: "very-high", tags: ["gotchas"] },
  pya13: { difficulty: "medium", priority: "high", tags: ["pattern-matching"] },
  pya14: { difficulty: "medium", priority: "high", tags: ["profiling"] },
  pya15: { difficulty: "medium", priority: "high", tags: ["performance"] },
  pya16: { difficulty: "medium", priority: "medium", tags: ["packaging"] },
  pya17: { difficulty: "easy", priority: "medium", tags: ["seniority"] },
};
