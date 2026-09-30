import { defineBackendChunk } from "./contract";

/**
 * SQL, Transactions, JPA & Hibernate (b139–b168).
 *
 * Maps to Chapter 5 of the master interview plan (Q106–Q135). Aimed at the
 * 3–4 year backend engineer: relational fundamentals, transaction correctness,
 * the JPA/Hibernate persistence model and the performance traps that show up
 * in every production Spring Data app.
 */
export const chunk10SqlJpa = defineBackendChunk({
  topic: "sql-jpa",
  questions: [
    {
      id: "b139",
      question: "Explain SELECT, WHERE, GROUP BY and HAVING — and how NULL changes the result.",
      answer:
        "Logical order of evaluation (not the written order):\n\n" +
        "1. `FROM` / `JOIN` — build the row set.\n" +
        "2. `WHERE` — filter **individual rows** before grouping.\n" +
        "3. `GROUP BY` — collapse rows into groups.\n" +
        "4. `HAVING` — filter **groups** using aggregates.\n" +
        "5. `SELECT` — project columns / aggregates.\n" +
        "6. `ORDER BY` then `LIMIT`.\n\n" +
        "**WHERE vs HAVING** — `WHERE` cannot see aggregates (`COUNT`, `SUM`) because grouping has not happened yet; `HAVING` runs after and can. Put row-level predicates in `WHERE` (they shrink the set earlier and can use indexes), aggregate predicates in `HAVING`.\n\n" +
        "**NULL is three-valued logic** — every comparison is TRUE, FALSE or *unknown*, and `WHERE` keeps only rows that are TRUE. `NULL = NULL` is *unknown*, not true, so `WHERE col = NULL` never matches; use `IS NULL`/`IS NOT NULL`. `COUNT(col)` skips NULLs but `COUNT(*)` counts rows regardless. `SUM`/`AVG` ignore NULLs (so `AVG` divides by the non-NULL count, which can surprise you). A `NOT IN (subquery)` that returns even one NULL yields no rows at all — a classic production bug; prefer `NOT EXISTS`, which is NULL-safe. `GROUP BY` treats all NULLs as one group, and `ORDER BY` clusters them together (their position varies by database, tunable with `NULLS FIRST`/`NULLS LAST`). Use `COALESCE(col, default)` to fold NULLs into a real value before comparing or aggregating.",
      code: `-- Orders per customer with more than 3 completed orders, ignoring NULL status
SELECT customer_id,
       COUNT(*)               AS total_orders,
       SUM(amount)            AS revenue
FROM   orders
WHERE  status IS NOT NULL          -- row filter, uses index on status
GROUP  BY customer_id
HAVING COUNT(*) > 3                -- group filter, needs the aggregate
ORDER  BY revenue DESC
LIMIT  10;

-- NULL trap: NOT IN with a NULL in the list returns ZERO rows
SELECT * FROM orders
WHERE  customer_id NOT IN (SELECT id FROM banned_customers); -- risky if id nullable
-- safe version:
SELECT o.* FROM orders o
WHERE  NOT EXISTS (SELECT 1 FROM banned_customers b WHERE b.id = o.customer_id);`,
      codeLanguage: "sql",
      explanation:
        "Tests the logical query pipeline plus the NULL/three-valued-logic gotchas that break WHERE and NOT IN.",
      followUps: [
        "Why can't you reference a SELECT alias in WHERE?",
        "How does COUNT(*) differ from COUNT(column)?",
        "Why is NOT EXISTS safer than NOT IN?",
      ],
    },
    {
      id: "b140",
      question: "Explain the SQL join types and when duplicate rows appear.",
      answer:
        "Join types:\n\n" +
        "- **INNER JOIN** — only rows matching on both sides.\n" +
        "- **LEFT (OUTER) JOIN** — all left rows; unmatched right columns are NULL.\n" +
        "- **RIGHT JOIN** — mirror of left; rarely needed, rewrite as LEFT.\n" +
        "- **FULL OUTER JOIN** — all rows from both, NULLs where no match.\n" +
        "- **CROSS JOIN** — Cartesian product (every combination); useful for calendars/grids, dangerous by accident.\n\n" +
        "**Row multiplication** — a join is not a lookup. If one order has 3 line items, `orders JOIN order_items` returns the order **3 times**. Aggregating over that double-counts (`SUM(order.total)` triples it). Fix by aggregating the child in a subquery first, or `SUM(DISTINCT)` cautiously, or grouping correctly.\n\n" +
        "**Performance** — the DB picks a nested-loop, hash or merge join based on statistics and available indexes. Index the join columns (usually the FK side). A missing index on a large table forces a hash/seq scan.\n\n" +
        "**Anti-joins** — 'rows with no match' via `LEFT JOIN ... WHERE right.id IS NULL` or `NOT EXISTS`.",
      code: `-- Customers and their orders; customers with none still appear (LEFT)
SELECT c.id, c.name, o.id AS order_id
FROM   customers c
LEFT   JOIN orders o ON o.customer_id = c.id;

-- ROW MULTIPLICATION: this OVER-counts revenue if orders have many items
SELECT c.name, SUM(o.amount) AS revenue      -- WRONG once items joined
FROM   customers c
JOIN   orders o      ON o.customer_id = c.id
JOIN   order_items i ON i.order_id   = o.id  -- amount repeated per item
GROUP  BY c.name;

-- Anti-join: customers who never ordered
SELECT c.*
FROM   customers c
LEFT   JOIN orders o ON o.customer_id = c.id
WHERE  o.id IS NULL;`,
      codeLanguage: "sql",
      explanation:
        "Checks whether you understand joins as set operations that multiply rows, not lookups — the root of double-counted aggregates.",
      followUps: [
        "How would you avoid double-counting when joining two child tables?",
        "When would the planner choose a hash join over a nested loop?",
      ],
    },
    {
      id: "b141",
      question: "When do you reach for a subquery, a CTE, or a window function?",
      answer:
        "**Subquery** — a query nested in `WHERE`/`FROM`/`SELECT`. Correlated subqueries reference the outer row and run per row (watch performance); scalar subqueries must return one value.\n\n" +
        "**CTE (`WITH`)** — a named, readable prelude. Great for breaking a complex query into steps and for **recursion** (org charts, graph traversal, hierarchies). Note: in some engines a CTE is an optimization fence; in modern PostgreSQL it is inlined unless `MATERIALIZED`.\n\n" +
        "**Window functions** — compute across a set of rows *related to the current row* **without collapsing them** (unlike `GROUP BY`). `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG`/`LEAD`, running `SUM() OVER (...)`. This is how you do 'top N per group', running totals, deduplication and gap detection.\n\n" +
        "Rule of thumb: reporting/analytics that keep detail rows → window functions; step-wise readability or recursion → CTE; simple existence/lookup → subquery.\n\n" +
        "A window function is defined by its `OVER (PARTITION BY ... ORDER BY ... ROWS/RANGE ...)` clause: `PARTITION BY` resets the calculation per group, `ORDER BY` gives ranking/running-total semantics, and the frame clause bounds which rows feed each computation (e.g. a moving average over the last 3 rows). This is strictly more expressive than `GROUP BY` because you keep every detail row while still seeing the aggregate alongside it. For subqueries, prefer `EXISTS`/`NOT EXISTS` over `IN`/`NOT IN` when the inner query can return NULLs or large sets — `EXISTS` short-circuits and is NULL-safe. And remember the CTE materialization caveat differs by engine, so on a hot path verify with `EXPLAIN` rather than assuming the optimizer inlines it.",
      code: `-- Top 2 highest-paid employees PER department (window function)
WITH ranked AS (
    SELECT e.*,
           ROW_NUMBER() OVER (PARTITION BY department_id
                              ORDER BY salary DESC) AS rn
    FROM   employees e
)
SELECT id, name, department_id, salary
FROM   ranked
WHERE  rn <= 2;

-- Running total of daily revenue
SELECT day,
       amount,
       SUM(amount) OVER (ORDER BY day
                         ROWS BETWEEN UNBOUNDED PRECEDING
                                  AND CURRENT ROW) AS running_total
FROM   daily_revenue;

-- Recursive CTE: full management chain above an employee
WITH RECURSIVE chain AS (
    SELECT id, manager_id, name FROM employees WHERE id = 42
    UNION ALL
    SELECT e.id, e.manager_id, e.name
    FROM   employees e JOIN chain c ON e.id = c.manager_id
)
SELECT * FROM chain;`,
      codeLanguage: "sql",
      explanation:
        "Distinguishes analytical SQL maturity — window functions for 'top N per group' and running totals without losing detail rows.",
      followUps: [
        "RANK vs DENSE_RANK vs ROW_NUMBER — what differs on ties?",
        "When is a CTE materialized and why does that matter?",
      ],
    },
    {
      id: "b142",
      question: "How do database indexes work, and what are the trade-offs?",
      answer:
        "Most indexes are **B-tree**: a balanced, sorted structure giving `O(log n)` lookup, range scans and ordered reads. The leaf level points to the row (heap tuple or, in clustered/InnoDB primary indexes, holds the row).\n\n" +
        "**Composite index column order matters** — an index on `(a, b)` serves `WHERE a = ?`, `WHERE a = ? AND b = ?`, and `ORDER BY a, b`, but **not** `WHERE b = ?` alone (leftmost-prefix rule).\n\n" +
        "**Covering index** — if the index contains every column the query needs, the DB answers from the index alone (index-only scan), skipping the table.\n\n" +
        "**Selectivity** — indexes help when a predicate is selective (returns few rows). Indexing a boolean/low-cardinality column is often useless; the planner will seq-scan anyway.\n\n" +
        "**Cost** — every index slows `INSERT`/`UPDATE`/`DELETE` (must be maintained) and consumes storage. Over-indexing is a real anti-pattern. Other types: **hash** (equality only), **GIN/GiST** (JSONB, full-text, arrays), **partial** (`WHERE deleted = false`), **expression** (`lower(email)`).",
      code: `-- Composite index: order matters (leftmost prefix rule)
CREATE INDEX idx_orders_cust_date ON orders (customer_id, created_at);

-- Uses the index (leftmost prefix + range):
SELECT * FROM orders WHERE customer_id = 7 AND created_at >= '2026-01-01';
-- Does NOT use it efficiently (skips leading column):
SELECT * FROM orders WHERE created_at >= '2026-01-01';

-- Covering / index-only scan: everything needed is in the index
CREATE INDEX idx_orders_cover ON orders (customer_id) INCLUDE (status, amount);

-- Partial index: only the rows you actually query
CREATE INDEX idx_active_users ON users (email) WHERE is_active = true;

-- Expression index for case-insensitive search
CREATE INDEX idx_users_email_lower ON users (lower(email));`,
      codeLanguage: "sql",
      explanation:
        "Core DB performance topic — B-tree mechanics, leftmost-prefix on composites, covering indexes and the write-amplification cost.",
      followUps: [
        "Why won't an index on (a, b) help a query filtering only on b?",
        "When is a full table scan actually the right plan?",
        "What is an index-only scan?",
      ],
    },
    {
      id: "b143",
      question: "You added an index but the query is still slow. How do you use EXPLAIN, and why might the index be ignored?",
      answer:
        "Run `EXPLAIN` for the plan and `EXPLAIN ANALYZE` to actually execute and show real timings, row estimates vs actuals, and which nodes dominate. Read it bottom-up / inside-out: look for `Seq Scan` on big tables, huge `rows` estimates, or estimate-vs-actual mismatches (stale statistics).\n\n" +
        "**Why an index gets ignored:**\n\n" +
        "- **Non-sargable predicate** — wrapping the column in a function (`WHERE lower(email) = ?`, `WHERE date(created_at) = ?`) or doing math on it defeats the index. Rewrite as a range, or add an expression index.\n" +
        "- **Implicit type cast** — `WHERE varchar_col = 123` casts the column, not the literal.\n" +
        "- **Low selectivity** — the planner estimates it will read most of the table, so a seq scan is cheaper.\n" +
        "- **Stale statistics** — run `ANALYZE`; the planner's row estimates are wrong.\n" +
        "- **Leading wildcard** — `LIKE '%foo'` can't use a B-tree.\n" +
        "- **OR across columns** — sometimes needs separate indexes + a bitmap OR, or a rewrite to `UNION`.\n\n" +
        "Fix the query shape first, add/repair the index second.",
      code: `-- See the real plan with timings and row estimates
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders
WHERE  customer_id = 42 AND status = 'PAID';

-- NON-SARGABLE: function on the column defeats idx_orders_created
SELECT * FROM orders WHERE date(created_at) = '2026-09-30';       -- Seq Scan
-- SARGABLE rewrite (uses the index):
SELECT * FROM orders
WHERE  created_at >= '2026-09-30' AND created_at < '2026-10-01';

-- Fix stale planner statistics
ANALYZE orders;`,
      codeLanguage: "sql",
      explanation:
        "Practical performance triage — reading EXPLAIN ANALYZE and recognizing non-sargable predicates, stale stats and low selectivity.",
      followUps: [
        "What is a sargable predicate?",
        "How do you tell the planner's estimate is wrong from EXPLAIN ANALYZE?",
        "What does BUFFERS tell you?",
      ],
    },
    {
      id: "b144",
      question: "What is ACID, and where do you draw transaction boundaries in a Spring service?",
      answer:
        "**ACID:**\n\n" +
        "- **Atomicity** — all statements commit or none do; a failure rolls the whole unit back.\n" +
        "- **Consistency** — the transaction moves the DB from one valid state to another, respecting constraints.\n" +
        "- **Isolation** — concurrent transactions don't corrupt each other (tunable via isolation level).\n" +
        "- **Durability** — once committed, it survives a crash (WAL / redo log flushed to disk).\n\n" +
        "**Boundaries** — the transaction should wrap a single **business use case**, opened at the **service layer**, not the repository (each repo call in its own transaction gives you no atomicity). Keep transactions **short**: do slow work (HTTP calls, file IO, sending email) *outside* the transaction, because an open transaction holds a DB connection and locks.\n\n" +
        "In Spring, `@Transactional` on the service method defines the boundary. A common bug is doing a remote call inside the transaction — it pins a pooled connection for the call's duration and can exhaust the pool under load.",
      code: `@Service
public class TransferService {
    private final AccountRepository accounts;
    private final AuditClient audit; // remote HTTP

    // One business unit = one transaction, opened at the SERVICE layer.
    @Transactional
    public void transfer(long from, long to, BigDecimal amount) {
        Account src = accounts.findByIdForUpdate(from);
        Account dst = accounts.findByIdForUpdate(to);
        src.debit(amount);
        dst.credit(amount);
        // Both saves commit together, or neither does (atomicity).
    }

    public void transferAndNotify(long from, long to, BigDecimal amt) {
        transfer(from, to, amt);          // commit first (short tx)...
        audit.record(from, to, amt);      // ...THEN slow remote call, outside tx
    }
}`,
      codeLanguage: "java",
      explanation:
        "Correctness foundation — ACID plus the practical rule that transactions wrap one use case, live at the service layer, and stay short.",
      followUps: [
        "Why not put a REST call inside a @Transactional method?",
        "What does durability actually rely on (WAL/fsync)?",
        "Why is repository-per-transaction insufficient?",
      ],
    },
    {
      id: "b145",
      question: "Explain isolation levels and the anomalies each one prevents.",
      answer:
        "Anomalies, weakest to strongest:\n\n" +
        "- **Dirty read** — read another transaction's uncommitted change.\n" +
        "- **Non-repeatable read** — re-read the same row, get a different value (someone updated + committed).\n" +
        "- **Phantom read** — re-run the same range query, get new/removed rows.\n\n" +
        "SQL isolation levels:\n\n" +
        "- **READ UNCOMMITTED** — allows all three (dirty reads possible).\n" +
        "- **READ COMMITTED** — no dirty reads; non-repeatable and phantoms still possible. **PostgreSQL default.**\n" +
        "- **REPEATABLE READ** — no dirty or non-repeatable reads. **MySQL/InnoDB default.** (PostgreSQL's RR also blocks phantoms via MVCC snapshots.)\n" +
        "- **SERIALIZABLE** — transactions behave as if run one at a time; may abort with a serialization error you must retry.\n\n" +
        "PostgreSQL uses **MVCC**: readers see a snapshot and don't block writers. Higher isolation → fewer anomalies but more conflicts/aborts/locks. Pick the lowest level that's correct for the use case, and handle serialization failures with a retry.\n\n" +
        "It helps to tie each anomaly to a concrete bug: a non-repeatable read breaks a transaction that reads a balance twice and expects consistency; a phantom breaks a check-then-insert (two transactions both find 'no existing booking' and both insert). SERIALIZABLE eliminates these but in PostgreSQL it uses Serializable Snapshot Isolation, which doesn't block — it detects conflicts at commit and aborts one with a serialization error, so any code using it **must** wrap the transaction in a retry loop. A subtle trap under MVCC READ COMMITTED is that within one statement you see a consistent snapshot, but two separate statements can see different data, so multi-statement read-modify-write logic needs either a higher level, `SELECT ... FOR UPDATE`, or optimistic version checks. The pragmatic default is READ COMMITTED plus explicit locking or `@Version` on the few places that need it.",
      code: `@Service
public class ReportService {

    // Snapshot-consistent read across many queries -> REPEATABLE_READ
    @Transactional(isolation = Isolation.REPEATABLE_READ, readOnly = true)
    public Report build() { /* multiple SELECTs see one consistent snapshot */ }

    // Money movement that must be serialization-safe; retry on conflict
    @Retryable(retryFor = CannotSerializeTransactionException.class, maxAttempts = 3)
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void settle(long accountId) {
        // If PostgreSQL detects a serialization anomaly it throws 40001;
        // @Retryable re-runs the whole method.
    }
}`,
      codeLanguage: "java",
      explanation:
        "Concurrency correctness — mapping dirty/non-repeatable/phantom reads to levels, knowing DB defaults, and retrying serialization failures.",
      followUps: [
        "What is the default isolation level in PostgreSQL vs MySQL?",
        "How does MVCC let readers avoid blocking writers?",
        "Why must SERIALIZABLE code be retry-safe?",
      ],
    },
    {
      id: "b146",
      question: "How do database locks and deadlocks happen, and how do you deal with them?",
      answer:
        "The DB takes **row locks** on `UPDATE`/`DELETE` and on `SELECT ... FOR UPDATE`, plus lighter shared locks for reads under some isolation levels. Writers block writers on the same row; in MVCC databases readers generally don't block.\n\n" +
        "**Deadlock** — two transactions each hold a lock the other needs, forming a cycle. The DB detects it and kills one (the *victim*) with a deadlock error; your code must catch and retry it.\n\n" +
        "**Prevention:**\n\n" +
        "- **Consistent lock ordering** — always lock rows in the same order (e.g. by ascending id). The classic transfer deadlock is A→B in one tx and B→A in another; ordering by id removes the cycle.\n" +
        "- Keep transactions **short** and touch the fewest rows.\n" +
        "- Use `SELECT ... FOR UPDATE` deliberately, or `FOR UPDATE SKIP LOCKED` for worker-queue patterns.\n" +
        "- Set a `lock_timeout` so a stuck transaction fails fast instead of hanging.\n\n" +
        "Operationally, read the deadlock log — it shows both statements and the lock graph.",
      code: `-- Worker queue: grab N jobs without blocking other workers
BEGIN;
SELECT id FROM jobs
WHERE  status = 'READY'
ORDER  BY created_at
FOR UPDATE SKIP LOCKED           -- skip rows other workers already locked
LIMIT  10;
-- ... process, then:
UPDATE jobs SET status = 'DONE' WHERE id = ANY(:ids);
COMMIT;

-- Deadlock avoidance: always lock accounts in a fixed order (by id)
BEGIN;
SELECT * FROM accounts WHERE id IN (:a, :b) ORDER BY id FOR UPDATE;
-- both concurrent transfers lock the lower id first -> no cycle
COMMIT;`,
      codeLanguage: "sql",
      explanation:
        "Production incident relevance — lock types, why deadlocks form a cycle, and the consistent-ordering + SKIP LOCKED remedies.",
      followUps: [
        "How does FOR UPDATE SKIP LOCKED help a job queue?",
        "Why does consistent lock ordering prevent deadlocks?",
        "How do you retry a deadlock victim safely?",
      ],
    },
    {
      id: "b147",
      question: "Optimistic vs pessimistic locking — when do you use each?",
      answer:
        "Both prevent the **lost update** (two transactions read a row, both write, one silently overwrites the other).\n\n" +
        "**Optimistic locking** — no DB lock is held. A `@Version` column is checked on write: the `UPDATE ... WHERE id = ? AND version = ?` fails (0 rows) if someone else changed it, throwing `OptimisticLockException`. Cheap, scales well, ideal for **low-contention** and long 'read → think → save' UI flows. You must handle the exception (reload + retry, or tell the user).\n\n" +
        "**Pessimistic locking** — acquire a DB lock up front (`SELECT ... FOR UPDATE`, `LockModeType.PESSIMISTIC_WRITE`). Other writers block until you commit. Correct under **high contention** or when a retry is expensive, but it holds locks (reducing throughput) and risks deadlocks/lock-timeout.\n\n" +
        "Rule of thumb: default to **optimistic**; switch to pessimistic for hot rows (inventory counters, seat booking) where conflicts are frequent.\n\n" +
        "The deeper trade-off is *where* the concurrency cost lands. Optimistic locking is 'detect and recover': it costs nothing until a conflict actually happens, but the caller must be able to retry or surface a friendly 'someone else changed this' message, which is perfect for long user think-time where holding a database lock across a screen would be disastrous. Pessimistic locking is 'prevent': it serializes access up front, so it's simpler to reason about correctness but it holds real database locks, cuts concurrency on the locked rows, and can deadlock — always set a lock timeout and acquire locks in a consistent order. For very hot counters, an even better answer is often to avoid row-level contention entirely with an atomic `UPDATE ... SET qty = qty - 1 WHERE qty > 0` or a dedicated sharded/aggregated counter design.",
      code: `@Entity
public class Product {
    @Id Long id;
    int stock;

    @Version           // JPA manages this; UPDATE ... WHERE version = ?
    long version;
}

@Service
public class InventoryService {
    // OPTIMISTIC: retry the whole method if someone raced us
    @Retryable(retryFor = OptimisticLockingFailureException.class, maxAttempts = 3)
    @Transactional
    public void reserve(long id, int qty) {
        Product p = repo.findById(id).orElseThrow();
        p.setStock(p.getStock() - qty);   // version bumped on flush
    }

    // PESSIMISTIC: lock the row for a hot counter
    @Transactional
    public void reserveHot(long id, int qty) {
        Product p = repo.findByIdForUpdate(id); // @Lock(PESSIMISTIC_WRITE)
        p.setStock(p.getStock() - qty);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Common JPA design decision — @Version optimistic locking by default, pessimistic FOR UPDATE for hot rows, always with a retry story.",
      followUps: [
        "What SQL does @Version generate on update?",
        "How do you retry an OptimisticLockException cleanly?",
        "Which do you pick for a seat-booking system and why?",
      ],
    },
    {
      id: "b148",
      question: "When would you use JSONB in PostgreSQL, and what are the trade-offs?",
      answer:
        "`JSONB` stores JSON in a decomposed binary form — it's indexable and queryable, unlike `text`/`json`. Reach for it when part of the data is **genuinely schemaless or sparse**: per-tenant custom fields, flexible product attributes, storing an external API payload, feature flags.\n\n" +
        "**Querying** — `->`/`->>` extract, `@>` containment, `?` key existence. A **GIN index** makes containment queries fast.\n\n" +
        "**Trade-offs:**\n\n" +
        "- No column constraints/foreign keys inside the JSON; typos and type drift aren't caught by the DB.\n" +
        "- Updating one key rewrites the whole document (MVCC), so huge documents that change often are costly.\n" +
        "- Queries are more awkward and easy to write inefficiently; joins on JSON fields are painful.\n\n" +
        "Rule: keep **relational data relational**; use JSONB for the truly variable edge. Don't model your whole domain as one JSONB blob — you lose the reasons you chose an RDBMS.\n\n" +
        "When you do use JSONB, index deliberately: a GIN index with the `jsonb_path_ops` operator class accelerates containment (`@>`) queries and is smaller than the default, while a targeted B-tree index on a single **expression** (`((data->>'status'))`) is better when you always filter on one extracted scalar. You can even enforce a little discipline with `CHECK` constraints validating specific keys, or generated columns that project a hot JSON field into a real, constrainable column. The honest framing for an interview is that JSONB gives you document-store flexibility inside a transactional relational database — a great pragmatic middle ground — but every key you query often is a hint that it probably wanted to be a proper column with a type, a constraint, and maybe a foreign key.",
      code: `CREATE TABLE products (
    id         bigserial PRIMARY KEY,
    name       text NOT NULL,
    attributes jsonb NOT NULL DEFAULT '{}'   -- flexible, sparse fields
);

-- GIN index for containment / key queries
CREATE INDEX idx_products_attrs ON products USING gin (attributes);

-- Find products where attributes contain {"color":"red"}
SELECT id, name FROM products WHERE attributes @> '{"color":"red"}';

-- Extract a value (->> returns text)
SELECT name, attributes->>'size' AS size FROM products;`,
      codeLanguage: "sql",
      explanation:
        "PostgreSQL feature awareness — JSONB for the schemaless edge with GIN indexing, while keeping core relational data relational.",
      followUps: [
        "Difference between json and jsonb?",
        "How would you map a JSONB column in a JPA entity?",
        "Why can frequent updates to a large JSONB document be slow?",
      ],
    },
    {
      id: "b149",
      question: "How do you manage database schema changes with Flyway or Liquibase?",
      answer:
        "Schema is **versioned in source control** as ordered migration scripts applied automatically on startup or in CI/CD — never hand-edited in production. Both tools track applied versions in a metadata table (`flyway_schema_history`) so each migration runs exactly once and drift is detectable.\n\n" +
        "- **Flyway** — plain, ordered SQL (`V1__init.sql`, `V2__add_index.sql`) plus repeatable (`R__view.sql`). Simple, SQL-first.\n" +
        "- **Liquibase** — changelogs in XML/YAML/JSON/SQL with changesets; more DB-agnostic and richer rollback support.\n\n" +
        "**Key practices:**\n\n" +
        "- Migrations are **immutable once merged** — never edit a released script; add a new one.\n" +
        "- **Backward-compatible / expand-contract** for zero-downtime: add nullable column → backfill → start writing → make non-null → drop old — across multiple deploys so old and new app versions both work.\n" +
        "- Avoid long locking DDL on huge tables during peak; use `CREATE INDEX CONCURRENTLY`.\n" +
        "- Test migrations against a production-like DB (Testcontainers) in CI.\n\n" +
        "The expand-contract (parallel-change) pattern is the crux of zero-downtime schema evolution and worth explaining fully: because a rolling deploy runs old and new application code simultaneously, every migration must be compatible with *both* versions at once. So a rename becomes add-new-column → deploy code that writes both → backfill → deploy code that reads new → drop old, spread across several releases rather than one destructive `ALTER`. Keep each migration small, forward-only (prefer roll-forward fixes over rollbacks, which are risky once data has changed), and idempotent where possible. Beware locking DDL on large tables — adding a `NOT NULL` column with a default, or an index, can lock writes; use `CREATE INDEX CONCURRENTLY`, add columns nullable first, and backfill in batches to avoid a production stall.",
      code: `-- Flyway: V3__add_status_to_orders.sql (immutable once merged)
ALTER TABLE orders ADD COLUMN status varchar(20);
UPDATE orders SET status = 'LEGACY' WHERE status IS NULL;
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;

-- Build a big index without blocking writes
CREATE INDEX CONCURRENTLY idx_orders_status ON orders (status);`,
      codeLanguage: "sql",
      explanation:
        "Team delivery safety — versioned, immutable migrations plus expand-contract for zero-downtime schema evolution.",
      followUps: [
        "How do you do a zero-downtime column rename?",
        "Why must you never edit a released migration?",
        "Flyway vs Liquibase — when pick which?",
      ],
    },
    {
      id: "b150",
      question: "How does a connection pool like HikariCP work, and how do you size it?",
      answer:
        "Opening a DB connection (TCP + auth + session setup) costs milliseconds — too slow per request. A **pool** keeps a set of live connections; a request **borrows** one, uses it, and **returns** it. HikariCP (Spring Boot's default) is fast and deliberately minimal.\n\n" +
        "**Key settings:**\n\n" +
        "- `maximumPoolSize` — the ceiling. Bigger is *not* better: the DB has finite CPU/IO. A common formula is `connections ≈ ((core_count * 2) + effective_spindle_count)`; often 10–20 is right, not 200.\n" +
        "- `connectionTimeout` — how long a caller waits for a free connection before failing (default 30s).\n" +
        "- `idleTimeout` / `maxLifetime` — recycle connections (keep `maxLifetime` a bit under the DB/proxy's timeout).\n" +
        "- `minimumIdle` — usually leave equal to max for steady pools.\n\n" +
        "**Symptoms of getting it wrong:** `connection is not available, request timed out` = pool exhausted — usually because transactions are too long, someone did slow IO while holding a connection, or a **connection leak** (borrowed, never returned — set `leakDetectionThreshold`). Over-sizing just moves the bottleneck to the DB and adds context-switching.",
      code: `# application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 15        # size to the DB, not the app threads
      minimum-idle: 15
      connection-timeout: 30000    # ms to wait for a free connection
      idle-timeout: 600000
      max-lifetime: 1700000        # < DB/proxy idle timeout
      leak-detection-threshold: 20000  # warn if a connection is held >20s`,
      codeLanguage: "yaml",
      explanation:
        "Common production bottleneck — pooling rationale, why small pools beat huge ones, and diagnosing exhaustion vs leaks.",
      followUps: [
        "Why can a smaller pool give higher throughput?",
        "What causes 'connection is not available' timeouts?",
        "How does leak detection help?",
      ],
    },
    {
      id: "b151",
      question: "Explain the JPA persistence context and the four entity states.",
      answer:
        "The **persistence context** (the `EntityManager`, one per transaction) is a first-level cache and unit of work that tracks managed entities. Entity states:\n\n" +
        "- **New / transient** — a plain `new` object, no id, not tracked. Not in the DB.\n" +
        "- **Managed / persistent** — attached to the context (via `persist`, `merge`, or a query result). Changes are **auto-tracked**; you don't call `save()` to update — dirty checking flushes them.\n" +
        "- **Detached** — was managed, but the context closed (transaction ended) or `detach()`/`clear()` was called. Changes are no longer tracked. Touching a lazy association now throws `LazyInitializationException`.\n" +
        "- **Removed** — marked for deletion (`remove`), will be `DELETE`d on flush.\n\n" +
        "**Identity guarantee:** within one context, the same primary key returns the **same object instance** (repeatable reads from the L1 cache). `persist` makes a new entity managed; `merge` copies a detached entity's state onto a managed copy and returns *that* copy — a classic trap is using the argument you passed to `merge` instead of its return value.",
      code: `@Transactional
public void demo(EntityManager em) {
    Order o = new Order();          // NEW / transient
    em.persist(o);                  // -> MANAGED (id assigned, tracked)

    o.setStatus("PAID");            // no save() needed: dirty checking flushes it

    Order same = em.find(Order.class, o.getId());
    System.out.println(o == same);  // true: L1 cache identity within the context

    em.detach(o);                   // -> DETACHED (changes no longer tracked)
    Order managed = em.merge(o);    // copies state onto a MANAGED instance...
    // use 'managed', NOT 'o', from here on

    em.remove(managed);             // -> REMOVED (DELETE on flush)
}`,
      codeLanguage: "java",
      explanation:
        "ORM mental model — new/managed/detached/removed, dirty checking, L1-cache identity, and the merge-return-value trap.",
      followUps: [
        "persist vs merge — what does merge return and why care?",
        "What causes LazyInitializationException?",
        "How does the L1 cache guarantee identity?",
      ],
    },
    {
      id: "b152",
      question: "How do dirty checking and flushing work in Hibernate?",
      answer:
        "**Dirty checking** — Hibernate keeps a snapshot of each managed entity's state when it was loaded. At **flush** time it compares current field values against the snapshot and generates `UPDATE`s only for changed entities/columns. That's why setting a field on a managed entity persists without any explicit `save()`.\n\n" +
        "**Flush** — synchronizing pending changes (INSERT/UPDATE/DELETE) to the DB, *without* committing. It happens: (1) automatically before a query that could be affected, (2) on transaction commit, (3) on an explicit `flush()`. Flush mode is `AUTO` by default; `COMMIT` flushes only at commit.\n\n" +
        "**Ordering** — Hibernate orders statements (inserts, then updates, then deletes) and batches them, which can surprise you (your INSERT may not hit the DB when you 'expect').\n\n" +
        "**Performance note:** dirty checking has a cost proportional to the number of managed entities and their fields. Loading thousands of entities into one context makes every flush expensive — use `readOnly` transactions (Hibernate skips snapshots / uses `FlushMode.MANUAL`) or projections for read-heavy paths, and `clear()` during large batches.",
      code: `@Transactional
public void rename(long id, String name) {
    Customer c = repo.findById(id).orElseThrow(); // managed + snapshot taken
    c.setName(name);                              // no save() call
    // On commit, Hibernate diffs vs snapshot -> UPDATE customers SET name=? ...
}

// Read-only skips dirty-check snapshots -> faster, prevents accidental writes
@Transactional(readOnly = true)
public List<CustomerView> list() {
    return repo.findAllProjectedBy();
}`,
      codeLanguage: "java",
      explanation:
        "Explains how Hibernate writes changes — snapshot diffing at flush, automatic flush triggers, and the readOnly optimization.",
      followUps: [
        "When exactly does an automatic flush happen?",
        "Why does readOnly=true speed up read paths?",
        "How can flush ordering surprise you?",
      ],
    },
    {
      id: "b153",
      question: "Lazy vs eager fetching — and how do you avoid LazyInitializationException?",
      answer:
        "**FetchType** controls when an association loads. Defaults: `@ManyToOne`/`@OneToOne` are **EAGER**; `@OneToMany`/`@ManyToMany` are **LAZY**.\n\n" +
        "**LAZY** — the association is a proxy; the real query fires on first access. Good default (don't pull the whole object graph), but if the access happens **after the transaction/session closed**, you get `LazyInitializationException`.\n\n" +
        "**EAGER** — always loaded with the parent. Tempting as a 'fix' but it's a trap: it loads data you often don't need and causes N+1 or huge cartesian joins across every query for that entity. **Prefer LAZY everywhere**, even on `@ManyToOne` (`fetch = LAZY`), and load what you need explicitly.\n\n" +
        "**Correct fixes for the exception (not switching to EAGER):**\n\n" +
        "- **Fetch join / `@EntityGraph`** to load the association within the transaction when you need it.\n" +
        "- Map to a **DTO projection** so nothing lazy escapes the transaction.\n" +
        "- Keep the operation inside the service transaction; don't rely on Open-Session-In-View.\n\n" +
        "It's worth naming why EAGER is so pernicious: because it applies to *every* query that touches the entity — including derived finders and `findById` — you can't opt out per use case, and eager `@OneToMany`s combine into a Cartesian product that both slows queries and can silently duplicate rows. LAZY plus explicit, per-query fetching (fetch joins, entity graphs, or DTO projections) gives you precise control over exactly what each screen loads. Spring Boot enables Open-Session-In-View by default, which hides `LazyInitializationException` by keeping the session open through view rendering — convenient but a trap, because it fires lazy queries during serialization (N+1 outside the transaction) and blurs the transactional boundary; disabling it (`spring.jpa.open-in-view=false`) forces you to load what you need deliberately, which is the healthier long-term design.",
      code: `@Entity
public class Order {
    @Id Long id;
    @ManyToOne(fetch = FetchType.LAZY)  // override EAGER default
    Customer customer;
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    List<OrderItem> items;
}

public interface OrderRepository extends JpaRepository<Order, Long> {
    // Load items eagerly for THIS query only (avoids LazyInit + N+1)
    @EntityGraph(attributePaths = {"items", "customer"})
    Optional<Order> findWithItemsById(Long id);

    // Or an explicit fetch join
    @Query("select o from Order o join fetch o.items where o.id = :id")
    Optional<Order> loadWithItems(@Param("id") Long id);
}`,
      codeLanguage: "java",
      explanation:
        "Root cause of countless ORM issues — prefer LAZY, and fix LazyInit with fetch joins/entity graphs/DTOs, never blanket EAGER.",
      followUps: [
        "What are the default fetch types per association?",
        "Why is making everything EAGER the wrong fix?",
        "What is Open-Session-In-View and why is it controversial?",
      ],
    },
    {
      id: "b154",
      question: "What is the N+1 query problem and how do you fix it?",
      answer:
        "**N+1** — you run 1 query to load N parents, then the code touches a lazy association on each, firing 1 query **per parent** = 1 + N queries. With 500 orders you get 501 round-trips; latency explodes. It's the single most common Hibernate performance bug and often invisible in dev with tiny data.\n\n" +
        "**Detect it** — enable SQL logging / `hibernate.generate_statistics`, or use a tool like the datasource-proxy / Hypersistence utilities to fail tests when query count is too high.\n\n" +
        "**Fixes:**\n\n" +
        "- **Fetch join** (`JOIN FETCH`) or **`@EntityGraph`** — one query with a join. Best for single/root queries. Caveat: joining a `@OneToMany` multiplies rows; use `DISTINCT` and be careful combining with pagination (Hibernate paginates in memory then — bad).\n" +
        "- **`@BatchSize` / `hibernate.default_batch_fetch_size`** — loads lazy associations in batches (`WHERE parent_id IN (?, ?, ...)`), turning N+1 into 1 + ceil(N/batch). Great with pagination.\n" +
        "- **DTO projection** — write JPQL that selects exactly the columns into a constructor/interface projection; no lazy loading at all.\n\n" +
        "Rule: paginate → batch fetch; single aggregate → fetch join; read model → projection.",
      code: `// Detect in a test: assert the query count
long before = statistics.getPrepareStatementCount();
List<Order> orders = orderRepo.findAll();
orders.forEach(o -> o.getItems().size()); // triggers N+1 if lazy + no fetch
// before+1 == after would be the goal

// Fix A: entity graph (one query)
@EntityGraph(attributePaths = "items")
List<Order> findAllBy();

// Fix B: batch fetching (pagination-friendly) - application.yml
// spring.jpa.properties.hibernate.default_batch_fetch_size: 50

// Fix C: DTO projection - no lazy loading escapes
@Query("select new com.app.OrderSummary(o.id, o.total, c.name) " +
       "from Order o join o.customer c")
List<OrderSummary> summaries();`,
      codeLanguage: "java",
      explanation:
        "The most important JPA performance question — recognizing 1+N, and matching the fix (fetch join, batch size, projection) to the access pattern.",
      followUps: [
        "Why does JOIN FETCH break pagination?",
        "How does @BatchSize change the generated SQL?",
        "How would you detect N+1 automatically in CI?",
      ],
    },
    {
      id: "b155",
      question: "JPQL vs Criteria API vs native queries — when do you use each?",
      answer:
        "**JPQL** — object-oriented query language over entities (`select o from Order o where o.status = :s`). Portable across databases, type-checked against the model, the default for static queries. Doesn't support DB-specific features.\n\n" +
        "**Criteria API** — build queries programmatically with a type-safe builder. Verbose, but the right tool for **dynamic queries** where predicates depend on runtime input (optional filters in a search screen) — you avoid string concatenation. The JPA metamodel (`Order_.status`) gives compile-time safety. In Spring Data, **Specifications** wrap Criteria nicely.\n" +
        "**Native SQL** — raw SQL when you need DB-specific features (window functions, CTEs, `JSONB @>`, hints) or hand-tuned performance. Loses portability and entity type safety; map to entities or projections.\n\n" +
        "**Always parameterize** — never concatenate user input into JPQL/SQL (injection). Criteria and named parameters do this for you. Default to JPQL; Criteria/Specifications for dynamic filters; native for the DB-specific 5%.\n\n" +
        "A practical decision guide: if the query shape is fixed, a JPQL `@Query` (or a Spring Data derived method) is the most readable and portable; if the query shape varies with which filters the user supplied, build it with the Criteria API or Spring Data `Specification`s so you compose predicates safely instead of string-concatenating a WHERE clause. Reach for native SQL only when you genuinely need engine features JPQL can't express — window functions, recursive CTEs, `JSONB` operators, `INSERT ... ON CONFLICT`, or optimizer hints — and map the result to a projection/DTO to keep it clean. Across all three, always bind values as parameters: it prevents SQL injection *and* lets the database reuse cached execution plans, which is a real performance win on hot queries.",
      code: `// Dynamic search with Spring Data Specifications (Criteria under the hood)
public static Specification<Order> filter(String status, Long customerId) {
    return (root, query, cb) -> {
        var preds = new ArrayList<Predicate>();
        if (status != null)     preds.add(cb.equal(root.get("status"), status));
        if (customerId != null) preds.add(cb.equal(root.get("customer").get("id"), customerId));
        return cb.and(preds.toArray(Predicate[]::new));
    };
}
// repo.findAll(filter("PAID", 42L), pageable);

// Native query for a DB-specific feature (mapped to a projection)
@Query(value = "SELECT customer_id, SUM(amount) revenue FROM orders " +
               "GROUP BY customer_id ORDER BY revenue DESC LIMIT :n",
       nativeQuery = true)
List<CustomerRevenue> topCustomers(@Param("n") int n);`,
      codeLanguage: "java",
      explanation:
        "Query-implementation judgment — JPQL default, Criteria/Specifications for dynamic filters, native SQL for DB-specific needs, always parameterized.",
      followUps: [
        "How do Spring Data Specifications relate to the Criteria API?",
        "How do you prevent SQL injection in a native query?",
        "Why avoid building JPQL by string concatenation?",
      ],
    },
    {
      id: "b156",
      question: "What are DTO projections and why prefer them for read models?",
      answer:
        "A **projection** returns only the columns a screen needs, not full entities. Benefits: smaller `SELECT`, no lazy loading / N+1, nothing managed by the persistence context (no dirty checking cost), and you don't leak entities (and their whole graph) to the web layer.\n\n" +
        "**Interface-based projection** — declare an interface with getters; Spring Data generates the implementation and selects just those columns. Supports nested and 'open' (SpEL) projections.\n\n" +
        "**Class/constructor projection** — a JPQL `new com.app.Dto(...)` expression or a record; explicit and refactor-friendly.\n\n" +
        "Rule: **entities for writes, DTOs for reads.** Returning entities straight from controllers causes lazy-loading serialization errors, over-fetching, and accidental exposure of internal fields. Projections make read paths fast and the API contract explicit.\n\n" +
        "There's a meaningful difference between the projection kinds beyond syntax. A **closed** interface projection lists exactly the accessors you need, so Spring Data can push a narrow `SELECT` of just those columns to the database — the fastest read. An **open** projection (using `@Value` SpEL that combines fields) can't be pushed down, so Hibernate fetches the whole entity and computes the value in memory, losing much of the benefit. Constructor/record (DTO) projections via `select new ...` are explicit and give you a clean immutable object that's safe to serialize. Choosing projections also decouples your API from the schema: internal renames or added columns don't leak to clients, and you avoid the classic mistake of annotating entities with Jackson and security concerns that really belong on a dedicated response type.",
      code: `// Interface projection: Spring selects only id, total, customer.name
public interface OrderView {
    Long getId();
    BigDecimal getTotal();
    String getCustomerName();     // maps to customer.name via nested path
}
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<OrderView> findByStatus(String status);   // generated SELECT is narrow
}

// Constructor / record projection via JPQL
public record OrderSummary(Long id, BigDecimal total, String customer) {}

@Query("select new com.app.OrderSummary(o.id, o.total, c.name) " +
       "from Order o join o.customer c where o.status = :status")
List<OrderSummary> summaries(@Param("status") String status);`,
      codeLanguage: "java",
      explanation:
        "Clean API + query optimization — projections avoid over-fetching, N+1 and entity leakage; entities for writes, DTOs for reads.",
      followUps: [
        "Interface vs class projection — trade-offs?",
        "Why is returning entities from controllers risky?",
        "Can a projection use a nested association path?",
      ],
    },
    {
      id: "b157",
      question: "How do you map JPA associations correctly, and what does mappedBy mean?",
      answer:
        "In a bidirectional relationship one side is the **owning side** — the one with the foreign key, which Hibernate uses to decide the `INSERT`/`UPDATE`. `mappedBy` marks the **inverse** side ('I am mapped by the `order` field on the other entity'); the inverse side is read-only for persistence.\n\n" +
        "**The classic bug:** you add a child to the parent's collection but the FK is on the child. If you only set one direction, Hibernate persists nothing / a null FK, because the *owning* (child) side wasn't updated. Fix with **helper methods** that keep both sides in sync.\n\n" +
        "**Guidance:**\n\n" +
        "- Prefer `@ManyToOne` (owning) + `@OneToMany(mappedBy=...)` (inverse). Often you don't even need the collection.\n" +
        "- Make `@ManyToOne` `fetch = LAZY`.\n" +
        "- Avoid `@ManyToMany` with entities; model the join table as its own entity so you can add columns later.\n" +
        "- Be careful with `equals`/`hashCode` on entities in `Set`s — base them on a business key, not the generated id.",
      code: `@Entity
public class Order {
    @Id @GeneratedValue Long id;

    @OneToMany(mappedBy = "order",           // inverse side
               cascade = CascadeType.ALL, orphanRemoval = true)
    List<OrderItem> items = new ArrayList<>();

    // Helper keeps BOTH sides consistent (fixes the null-FK bug)
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);                 // set the OWNING side too
    }
}

@Entity
public class OrderItem {
    @Id @GeneratedValue Long id;
    @ManyToOne(fetch = FetchType.LAZY)       // owning side: holds the FK
    @JoinColumn(name = "order_id")
    Order order;
}`,
      codeLanguage: "java",
      explanation:
        "JPA mapping correctness — owning vs inverse side, mappedBy, and sync helper methods that prevent the null-FK persistence bug.",
      followUps: [
        "Which side does Hibernate use to write the FK?",
        "Why add both sides in a helper method?",
        "Why avoid @ManyToMany with plain entities?",
      ],
    },
    {
      id: "b158",
      question: "What do cascade types and orphanRemoval do, and where do they bite?",
      answer:
        "**Cascade** propagates entity operations from parent to children so you don't manage each manually:\n\n" +
        "- `PERSIST` — saving the parent saves new children.\n" +
        "- `MERGE` — merging cascades to children.\n" +
        "- `REMOVE` — deleting the parent deletes children.\n" +
        "- `ALL` — all of the above (+ `REFRESH`, `DETACH`).\n\n" +
        "**orphanRemoval = true** — different from `CascadeType.REMOVE`: it deletes a child when it's **removed from the collection** (orphaned), not just when the parent is deleted. Ideal for true parent-owns-child composition (an order and its line items).\n\n" +
        "**Where it bites:**\n\n" +
        "- `CascadeType.REMOVE` / `orphanRemoval` on a `@ManyToOne`-shared entity can **delete rows you didn't mean to** (e.g. cascading from Order to a shared Customer). Only cascade REMOVE on genuine composition.\n" +
        "- Cascading delete of a large collection issues one `DELETE` per row (N deletes) unless you bulk-delete.\n" +
        "- `orphanRemoval` fires on `clear()` / reassigning the collection.\n\n" +
        "Rule: cascade only along true ownership; never cascade REMOVE onto shared reference data.",
      code: `@Entity
public class Order {
    @Id @GeneratedValue Long id;

    // Order truly OWNS its items: save/delete them with the order,
    // and delete any item removed from the list.
    @OneToMany(mappedBy = "order",
               cascade = CascadeType.ALL,
               orphanRemoval = true)
    List<OrderItem> items = new ArrayList<>();

    // Customer is SHARED reference data: NO cascade REMOVE here!
    @ManyToOne(fetch = FetchType.LAZY)
    Customer customer;
}

// Removing from the collection deletes the row (orphanRemoval):
order.getItems().remove(0);   // -> DELETE FROM order_items WHERE id = ?`,
      codeLanguage: "java",
      explanation:
        "Data-integrity risk area — cascade semantics vs orphanRemoval, and why cascading REMOVE onto shared entities deletes data unexpectedly.",
      followUps: [
        "Difference between CascadeType.REMOVE and orphanRemoval?",
        "Why is cascade REMOVE on a @ManyToOne dangerous?",
        "How do you bulk-delete children efficiently?",
      ],
    },
    {
      id: "b159",
      question: "How does pagination work in JPA, and why prefer keyset pagination at scale?",
      answer:
        "**Offset pagination** — `Pageable`/`LIMIT ? OFFSET ?`. Spring Data's `Page` also runs a `COUNT(*)` for the total. Simple and jump-to-page friendly, but two problems at scale: (1) `OFFSET 1_000_000` still **scans and discards** a million rows — deep pages get slow; (2) inserts/deletes between page loads cause **skipped or duplicated rows** (the window shifts).\n\n" +
        "Use **`Slice`** instead of `Page` when you don't need the total count — it skips the expensive `COUNT` and just asks for one extra row to know if there's a next page.\n\n" +
        "**Keyset (cursor) pagination** — page by a stable, indexed sort key instead of an offset: `WHERE (created_at, id) < (:lastTs, :lastId) ORDER BY created_at DESC, id DESC LIMIT :size`. Constant time regardless of depth (uses the index), and stable under concurrent writes. Downside: no random 'page 500' jump, and the sort key must be unique/stable (add `id` as a tiebreaker). Ideal for infinite scroll and large datasets.",
      code: `// Offset pagination (Slice avoids the COUNT query)
Slice<Order> page = orderRepo.findByStatus("PAID", PageRequest.of(3, 20));

// Keyset pagination: constant time at any depth, stable under writes
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("select o from Order o " +
           "where o.createdAt < :ts or (o.createdAt = :ts and o.id < :id) " +
           "order by o.createdAt desc, o.id desc")
    List<Order> nextPage(@Param("ts") Instant ts,
                         @Param("id") Long id,
                         Pageable limit);   // PageRequest.of(0, 20)
}
// pass the last row's (createdAt, id) as the cursor for the next call`,
      codeLanguage: "java",
      explanation:
        "Scalable list endpoints — offset's deep-page and drift problems, Slice vs Page, and keyset pagination on an indexed unique sort key.",
      followUps: [
        "Why does OFFSET get slow on deep pages?",
        "Page vs Slice — what's the extra cost of Page?",
        "Why must the keyset sort key be unique?",
      ],
    },
    {
      id: "b160",
      question: "How do you make batch inserts and updates efficient in Hibernate?",
      answer:
        "By default Hibernate sends one `INSERT` per entity — 10k inserts = 10k round-trips. To batch:\n\n" +
        "- Enable JDBC batching: `hibernate.jdbc.batch_size` (e.g. 50), plus `order_inserts`/`order_updates` so Hibernate groups statements of the same type.\n" +
        "- **Flush and clear** the persistence context every batch (`em.flush(); em.clear();`) — otherwise all entities pile up in the L1 cache, memory grows, and dirty-checking gets slower each iteration.\n" +
        "- **Identity generation defeats batching**: `GenerationType.IDENTITY` forces Hibernate to execute each insert immediately to get the id, so no batching. Use `SEQUENCE` with a pooled/`hi-lo` allocator instead.\n" +
        "- For pure bulk operations, a **single JPQL bulk `UPDATE`/`DELETE`** or a native statement is far faster than loading entities — but it bypasses the persistence context (stale L1 cache; `clear()` after).\n\n" +
        "For truly huge loads, consider `COPY`/`INSERT ... SELECT` at the SQL level rather than the ORM.\n\n" +
        "The mental model to convey is that JPA is optimized for managing a modest graph of objects per transaction, not for moving millions of rows — so bulk work fights the ORM's own machinery (the L1 cache, dirty checking, cascade traversal, and per-row id generation) unless you deliberately disable it. Concretely: batch and order statements, flush-and-clear on an interval to keep the persistence context bounded, switch id generation off `IDENTITY` so inserts can actually batch, and for read-heavy jobs use read-only/stateless sessions. When the transformation can be expressed entirely in the database, keeping it there (`INSERT ... SELECT`, `UPDATE ... FROM`, or `COPY` for ingestion) avoids the JVM round-trips altogether and is often orders of magnitude faster. If the job is central to the product, Spring Batch formalizes all of this with chunked commits, restartability, and failure skipping.",
      code: `# application.yml
spring:
  jpa:
    properties:
      hibernate:
        jdbc.batch_size: 50
        order_inserts: true
        order_updates: true

// Batch insert loop: flush + clear each batch to bound memory
@Transactional
public void importAll(List<Customer> rows) {
    for (int i = 0; i < rows.size(); i++) {
        em.persist(rows.get(i));
        if (i % 50 == 0) { em.flush(); em.clear(); } // send batch, free L1 cache
    }
}

// Bulk update: one statement, bypasses the context (clear afterwards)
@Modifying(clearAutomatically = true)
@Query("update Order o set o.status = 'ARCHIVED' where o.createdAt < :cutoff")
int archiveOld(@Param("cutoff") Instant cutoff);`,
      codeLanguage: "java",
      explanation:
        "Bulk performance — JDBC batching, flush/clear to bound memory, why IDENTITY breaks batching, and bulk JPQL for mass updates.",
      followUps: [
        "Why does GenerationType.IDENTITY disable insert batching?",
        "Why flush AND clear during a big loop?",
        "What are the risks of a bulk JPQL update on the L1 cache?",
      ],
    },
    {
      id: "b161",
      question: "Explain Hibernate's first- and second-level caches.",
      answer:
        "**First-level (L1) cache** — the persistence context itself, always on, scoped to **one transaction/EntityManager**. Within it, `find` by the same id returns the same instance without re-querying, and it enables dirty checking. It's not shared across transactions and is cleared when the context closes.\n\n" +
        "**Second-level (L2) cache** — optional, **shared across transactions/sessions** in the `SessionFactory`, backed by a provider (EhCache, Caffeine, Infinispan, Hazelcast for clusters). You opt entities in with `@Cacheable` + a caching strategy. There's also a **query cache** (caches query result *ids*) which must be used with the L2 entity cache.\n\n" +
        "**Concurrency strategies:** `READ_ONLY` (reference data), `NONSTRICT_READ_WRITE`, `READ_WRITE` (soft locks), `TRANSACTIONAL`.\n\n" +
        "**Risks:** staleness (another app/service or a native bulk update changes the DB and the cache doesn't know), cache-invalidation complexity, and in a cluster you need a distributed/invalidating provider. Rule: cache **read-mostly, rarely-changing reference data**; don't cache hot transactional tables. For app-level caching, Spring's `@Cacheable` on service methods is often simpler and clearer than Hibernate L2.",
      code: `@Entity
@Cacheable
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_ONLY)
public class Country {           // reference data: safe to cache across sessions
    @Id String iso;
    String name;
}

# application.yml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          use_query_cache: true
          region.factory_class: org.hibernate.cache.jcache.JCacheRegionFactory`,
      codeLanguage: "java",
      explanation:
        "ORM caching trade-offs — L1 (per-tx, always on) vs L2 (shared, opt-in), concurrency strategies, and the staleness/invalidation risks.",
      followUps: [
        "What invalidates the L2 cache — and what silently doesn't (bulk updates)?",
        "When would you use Spring @Cacheable instead of Hibernate L2?",
        "What does the query cache actually store?",
      ],
    },
    {
      id: "b162",
      question: "What is Open-Session-In-View and why is it controversial?",
      answer:
        "**Open-Session-In-View (OSIV)** keeps the Hibernate `Session`/persistence context open for the **entire HTTP request** — through the controller and view/serialization — so lazy associations can still be loaded while Jackson serializes the response. Spring Boot enables it **by default** (`spring.jpa.open-in-view=true`), which is why lazy loading 'just works' even outside the service transaction.\n\n" +
        "**Why it's controversial:**\n\n" +
        "- **Hidden N+1** — lazy loads fire during serialization, in the web layer, invisibly and outside any explicit query plan.\n" +
        "- **Connection held longer** — the DB connection is bound to the thread for the whole request (including slow serialization / view rendering), hurting pool throughput.\n" +
        "- **Blurs boundaries** — the persistence context leaks into the presentation layer; queries happen where you can't see or control them.\n\n" +
        "**Recommended approach:** disable it (`spring.jpa.open-in-view=false`) and load everything you need **inside the service transaction** — via fetch joins, entity graphs, or DTO projections — so nothing lazy escapes. You'll surface `LazyInitializationException`s that were being masked, and fix them properly.",
      code: `# Disable OSIV and load data explicitly in the service layer
spring:
  jpa:
    open-in-view: false     # default is true; turn it OFF

// Then load what the response needs INSIDE the transaction:
@Transactional(readOnly = true)
public OrderResponse getOrder(long id) {
    Order o = orderRepo.findWithItemsById(id)   // @EntityGraph fetch
                       .orElseThrow();
    return OrderResponse.from(o);               // map to DTO while managed
}`,
      codeLanguage: "yaml",
      explanation:
        "Common Spring/Hibernate anti-pattern — OSIV masks N+1 and holds connections; disable it and load inside the transaction via graphs/DTOs.",
      followUps: [
        "What is the default value of spring.jpa.open-in-view?",
        "What breaks when you disable OSIV, and how do you fix it?",
        "Why does OSIV hurt connection-pool throughput?",
      ],
    },
    {
      id: "b163",
      question: "How do you use JPA locking (LockModeType) for concurrent updates?",
      answer:
        "JPA exposes locking via `LockModeType`:\n\n" +
        "- **OPTIMISTIC** — checks the `@Version` on commit (implicit whenever you have a version column).\n" +
        "- **OPTIMISTIC_FORCE_INCREMENT** — bumps the version even if you didn't modify the entity (to lock an aggregate root when you change a child).\n" +
        "- **PESSIMISTIC_READ** — shared lock; others can read, not write.\n" +
        "- **PESSIMISTIC_WRITE** — exclusive lock (`SELECT ... FOR UPDATE`); the usual choice for 'read then update this exact row safely'.\n" +
        "- **PESSIMISTIC_FORCE_INCREMENT** — pessimistic lock *and* version bump.\n\n" +
        "Apply with `@Lock` on a repository method, `em.find(entity, id, lockMode)`, or a query hint. Add `jakarta.persistence.lock.timeout` so a blocked lock fails fast instead of hanging.\n\n" +
        "**Interaction with isolation:** pessimistic locks give you serialization on specific rows without raising the whole transaction to `SERIALIZABLE`. Optimistic locking works at any isolation but requires a retry loop on failure. Choose pessimistic for hot contended rows, optimistic for the common low-contention case.\n\n" +
        "The `_FORCE_INCREMENT` variants deserve a concrete example: when you modify a child entity but the business invariant belongs to the aggregate root, bumping the root's version (via `OPTIMISTIC_FORCE_INCREMENT`) ensures two transactions editing different children of the same aggregate still conflict, preserving consistency of the whole. Operationally, always pair pessimistic locks with `jakarta.persistence.lock.timeout` so a contended row fails fast with a lock-timeout exception instead of threads piling up and exhausting the connection pool, and acquire multiple locks in a consistent global order to avoid deadlocks. Under the hood `PESSIMISTIC_WRITE` maps to `SELECT ... FOR UPDATE` (and `FOR SHARE` for read), so what you're really doing is delegating serialization to the database's row locks for just the rows that need it.",
      code: `public interface AccountRepository extends JpaRepository<Account, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)               // SELECT ... FOR UPDATE
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout",
                           value = "3000"))             // fail after 3s
    @Query("select a from Account a where a.id = :id")
    Account findByIdForUpdate(@Param("id") Long id);
}

@Transactional
public void withdraw(long id, BigDecimal amt) {
    Account a = accounts.findByIdForUpdate(id);  // row locked until commit
    a.debit(amt);
}`,
      codeLanguage: "java",
      explanation:
        "Consistency under concurrent writes — the LockModeType matrix, applying @Lock, lock timeouts, and choosing pessimistic vs optimistic.",
      followUps: [
        "When would you use OPTIMISTIC_FORCE_INCREMENT?",
        "How does a lock timeout differ from a statement timeout?",
        "Why can pessimistic locking avoid raising isolation to SERIALIZABLE?",
      ],
    },
    {
      id: "b164",
      question: "Normalization vs denormalization — how do you decide?",
      answer:
        "**Normalization** removes redundancy so each fact lives in one place:\n\n" +
        "- **1NF** — atomic columns, no repeating groups.\n" +
        "- **2NF** — no partial dependency on part of a composite key.\n" +
        "- **3NF** — no transitive dependency (non-key columns depend only on the key).\n\n" +
        "Benefits: no update anomalies, smaller writes, integrity enforced by FKs/constraints. It's the correct default for OLTP systems.\n\n" +
        "**Denormalization** deliberately duplicates data (or precomputes aggregates) to avoid expensive joins on read-heavy paths — reporting tables, materialized views, a cached `order_count` on a customer row, search documents. The cost: you must keep copies in sync (triggers, application code, scheduled jobs, or async events), and you reintroduce anomaly risk.\n\n" +
        "**Decision:** normalize first; denormalize only for a **measured** read bottleneck, and make the duplication's maintenance explicit. In practice: normalized core tables + targeted read models (materialized views / projections / a cache) rather than denormalizing the source of truth.\n\n" +
        "Framing it as a write-versus-read optimization clarifies the choice: normalization optimizes writes and integrity (one fact, one place, enforced by constraints) at the cost of joins on read, while denormalization optimizes reads at the cost of write complexity and the risk of copies drifting out of sync. The senior instinct is to keep a single normalized **source of truth** and derive denormalized read models from it — materialized views you refresh, CQRS-style read projections, a search index, or a cache — so the duplication is regenerable and its staleness is a deliberate, bounded property rather than a bug. Reserve in-place denormalization (a counter column, a cached total) for cases proven by profiling, and back it with a reliable sync mechanism (transactional trigger, outbox event, or scheduled reconciliation) plus monitoring to detect divergence.",
      code: `-- Normalized (3NF): source of truth
CREATE TABLE customers (id bigint PRIMARY KEY, name text);
CREATE TABLE orders (id bigint PRIMARY KEY,
                     customer_id bigint REFERENCES customers(id),
                     amount numeric);

-- Denormalized READ MODEL kept in sync separately (materialized view)
CREATE MATERIALIZED VIEW customer_stats AS
SELECT c.id, c.name, COUNT(o.id) AS order_count, COALESCE(SUM(o.amount),0) revenue
FROM   customers c LEFT JOIN orders o ON o.customer_id = c.id
GROUP  BY c.id, c.name;

REFRESH MATERIALIZED VIEW CONCURRENTLY customer_stats;  -- scheduled refresh`,
      codeLanguage: "sql",
      explanation:
        "Schema-design judgment — normalize the source of truth, denormalize only for measured read bottlenecks with explicit sync.",
      followUps: [
        "Give an update anomaly that 3NF prevents.",
        "How do you keep a denormalized column in sync?",
        "Materialized view vs application-maintained counter — trade-offs?",
      ],
    },
    {
      id: "b165",
      question: "Database constraints vs application validation — why do you need both?",
      answer:
        "**Application validation** (Bean Validation `@NotNull`, `@Email`, service checks) gives fast, user-friendly feedback and encodes business rules. But it **cannot guarantee integrity under concurrency**: two requests can both pass a 'is this email taken?' check and then both insert — a race the app can't win.\n\n" +
        "**Database constraints** (`NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`) are the **last line of defense**, enforced atomically by the DB regardless of how many app instances run. A `UNIQUE` index is the *only* correct way to prevent duplicate emails; the app 'check-then-insert' is inherently racy.\n\n" +
        "**Defense in depth:** validate in the app for UX and clear messages, *and* enforce the invariant in the DB for correctness. Then **map the DB error** (e.g. `DataIntegrityViolationException` from a unique-violation) back into a friendly 409/validation response — don't let it surface as a raw 500.\n\n" +
        "Constraints also protect you from bugs, bad migrations, manual SQL, and other services touching the same schema.",
      code: `-- The ONLY reliable duplicate prevention (survives concurrency + multi-instance)
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);
ALTER TABLE orders ADD CONSTRAINT chk_amount_positive CHECK (amount > 0);

// App: validate for UX, but catch the DB constraint for correctness
@Transactional
public User register(RegisterRequest req) {
    try {
        return userRepo.save(new User(req.email()));
    } catch (DataIntegrityViolationException e) {   // unique violation lost the race
        throw new EmailAlreadyUsedException(req.email()); // -> HTTP 409
    }
}`,
      codeLanguage: "java",
      explanation:
        "Robust integrity design — app validation for UX, DB constraints for correctness under concurrency, and mapping violations to clean responses.",
      followUps: [
        "Why can't application-level uniqueness checks prevent duplicates?",
        "How do you translate a unique-violation into an HTTP 409?",
        "What kinds of rules belong in CHECK constraints?",
      ],
    },
    {
      id: "b166",
      question: "How do you process a very large dataset without running out of memory?",
      answer:
        "Never `findAll()` a huge table — it loads every row and every managed entity into the persistence context. Options:\n\n" +
        "- **Pagination / chunking** — process in fixed-size batches (keyset pagination is best; offset degrades). Simple and restartable.\n" +
        "- **Streaming / cursor** — `Stream<Entity>` from a repository or a scrollable JDBC `ResultSet` with a fetch size, so rows arrive incrementally. Must run inside a transaction, in `forward-only`/`read-only` mode, and you **must clear the persistence context periodically** (`em.detach`/`clear`) or the L1 cache still grows.\n" +
        "- **Set-based SQL** — for transformations, an `UPDATE ... FROM` / `INSERT ... SELECT` that stays in the DB beats pulling rows into the JVM entirely.\n\n" +
        "Also: set a **statement timeout**, use a separate/bounded connection so a batch job doesn't starve the web pool, make the job **idempotent/restartable** (track progress), and for real ETL use Spring Batch (chunk-oriented reader/processor/writer with checkpoints).\n\n" +
        "The single most important idea is to keep memory **bounded** regardless of table size: whether you page, stream, or use a JDBC cursor, the persistence context (and the JDBC driver's own buffering) must not accumulate the whole result set. That's why streaming requires a read-only, forward-only cursor with a sensible fetch size *and* periodic `clear()`, and why keyset pagination beats `OFFSET` (which re-scans skipped rows and gets slower the deeper you go). Design the job to be resumable by recording the last processed key so a crash restarts from there rather than from zero, and isolate it operationally — a separate connection pool and a statement timeout — so a long-running batch can't starve online request traffic. For anything mission-critical, Spring Batch gives you all of this (chunked commits, restart from the last checkpoint, skip/retry policies) out of the box.",
      code: `// Streaming read: process incrementally and clear the L1 cache
@Transactional(readOnly = true)
public void export() {
    try (Stream<Order> stream = orderRepo.streamAllBy()) {  // Stream<Order>
        int[] n = {0};
        stream.forEach(order -> {
            write(order);
            if (++n[0] % 1000 == 0) em.clear();   // stop the context growing
        });
    }
}

// Repo: fetch-size hint enables a server-side cursor
@QueryHints(@QueryHint(name = HINT_FETCH_SIZE, value = "500"))
@Query("select o from Order o")
Stream<Order> streamAllBy();`,
      codeLanguage: "java",
      explanation:
        "Batch/export scenarios — streaming cursors + periodic clear, keyset chunking, set-based SQL, timeouts and restartability.",
      followUps: [
        "Why does streaming still OOM without clearing the context?",
        "Why is keyset chunking better than OFFSET for big jobs?",
        "When would you reach for Spring Batch?",
      ],
    },
    {
      id: "b167",
      question: "A production deadlock is happening intermittently. How do you troubleshoot it?",
      answer:
        "**1. Capture evidence.** Enable/collect the DB's deadlock log — PostgreSQL logs the deadlock with both statements and the lock wait graph; MySQL InnoDB has `SHOW ENGINE INNODB STATUS`. That tells you exactly which two transactions and which rows/indexes were involved.\n\n" +
        "**2. Find the cycle.** Deadlocks are always a lock-ordering cycle: tx1 locks A then B, tx2 locks B then A. Trace the code paths that touch those tables/rows and identify the differing order.\n\n" +
        "**3. Fix the ordering.** Impose a **consistent lock order** (e.g. always update rows sorted by id), reduce the transaction's scope, and shorten how long locks are held (no slow work inside the transaction).\n\n" +
        "**4. Make it survivable.** Add a **retry** on the deadlock error (the DB kills one victim; retrying usually succeeds), keep operations idempotent, and set a `lock_timeout` so waits fail fast.\n\n" +
        "**5. Reduce contention.** Consider `FOR UPDATE SKIP LOCKED` for queues, narrower indexes to avoid gap/range locks (MySQL), or splitting hot rows.\n\n" +
        "Reproduce in a test with two concurrent transactions to confirm the fix.",
      code: `-- PostgreSQL: the deadlock report names both statements + the lock graph
-- ERROR:  deadlock detected
-- DETAIL: Process 123 waits for ShareLock on transaction 456; blocked by 789.
--         Process 789 waits for ShareLock on transaction 999; blocked by 123.

// Survive it: retry the victim, and lock in a consistent order
@Retryable(retryFor = CannotAcquireLockException.class,
           maxAttempts = 3, backoff = @Backoff(delay = 50, multiplier = 2))
@Transactional
public void transfer(long a, long b, BigDecimal amt) {
    long first = Math.min(a, b), second = Math.max(a, b);  // fixed order!
    Account x = accounts.findByIdForUpdate(first);
    Account y = accounts.findByIdForUpdate(second);
    // ... move money ...
}`,
      codeLanguage: "java",
      explanation:
        "Incident response — read the deadlock graph, break the lock-ordering cycle, retry the victim, and shrink transactions.",
      followUps: [
        "Where do PostgreSQL and MySQL surface deadlock details?",
        "Why does retrying usually resolve a deadlock?",
        "How can gap locks in MySQL cause deadlocks?",
      ],
    },
    {
      id: "b168",
      question: "How do you prevent SQL injection in a Java backend?",
      answer:
        "SQL injection happens when user input is **concatenated into a query string**, letting an attacker change its structure (`' OR 1=1 --`). The fix is always the same: **never build queries by string concatenation with user input; use parameter binding**, which sends the query and the data separately so input can never become SQL.\n\n" +
        "- **JDBC** — `PreparedStatement` with `?` placeholders (never `Statement` + string concat).\n" +
        "- **JPA/JPQL** — named/positional parameters (`:name`); Spring Data derived queries and `@Query` with `@Param` parameterize automatically.\n" +
        "- **Native queries** — still parameterize (`:id`), don't interpolate.\n" +
        "- **Dynamic ORDER BY / column names** — these can't be bound as parameters, so validate against an **allowlist** of known-safe columns; never pass raw input into `ORDER BY`.\n\n" +
        "Layer on least-privilege DB accounts, input validation, and an ORM (which parameterizes by default). Note `@Query` with SpEL or string building can reintroduce injection — keep user input in bound parameters.",
      code: `// VULNERABLE: string concatenation
String sql = "SELECT * FROM users WHERE email = '" + email + "'"; // NEVER

// SAFE (JDBC): bound parameter
PreparedStatement ps = conn.prepareStatement(
        "SELECT * FROM users WHERE email = ?");
ps.setString(1, email);            // input can't alter the SQL structure

// SAFE (JPA): named parameter
@Query("select u from User u where u.email = :email")
Optional<User> findByEmail(@Param("email") String email);

// Dynamic sort: parameters can't bind identifiers -> allowlist
private static final Set<String> SORTABLE = Set.of("name", "createdAt");
String col = SORTABLE.contains(input) ? input : "createdAt";  // validate!`,
      codeLanguage: "java",
      explanation:
        "Non-negotiable security baseline — parameter binding everywhere, plus allowlisting the identifiers (ORDER BY/columns) that can't be bound.",
      followUps: [
        "Why can't ORDER BY column be a bound parameter?",
        "How does PreparedStatement stop injection at the protocol level?",
        "Can an ORM still be injectable?",
      ],
    },
  ],
  meta: {
    b139: { difficulty: "easy", priority: "very-high", tags: ["sql", "group-by", "null"], readMinutes: 4 },
    b140: { difficulty: "medium", priority: "very-high", tags: ["sql", "joins", "cardinality"], readMinutes: 4 },
    b141: { difficulty: "medium", priority: "high", tags: ["sql", "cte", "window-functions"], readMinutes: 5 },
    b142: { difficulty: "medium", priority: "very-high", tags: ["index", "b-tree", "performance"], readMinutes: 5 },
    b143: { difficulty: "hard", priority: "very-high", tags: ["explain", "sargable", "tuning"], readMinutes: 5 },
    b144: { difficulty: "medium", priority: "very-high", tags: ["acid", "transactions", "boundaries"], readMinutes: 4 },
    b145: { difficulty: "hard", priority: "very-high", tags: ["isolation", "mvcc", "anomalies"], readMinutes: 5 },
    b146: { difficulty: "hard", priority: "high", tags: ["locks", "deadlock", "skip-locked"], readMinutes: 5 },
    b147: { difficulty: "medium", priority: "very-high", tags: ["optimistic", "pessimistic", "version"], readMinutes: 5 },
    b148: { difficulty: "medium", priority: "low", tags: ["postgres", "jsonb", "gin"], readMinutes: 4, versions: ["PostgreSQL"] },
    b149: { difficulty: "medium", priority: "high", tags: ["flyway", "liquibase", "migrations"], readMinutes: 5 },
    b150: { difficulty: "medium", priority: "very-high", tags: ["hikaricp", "connection-pool", "sizing"], readMinutes: 5 },
    b151: { difficulty: "medium", priority: "very-high", tags: ["jpa", "persistence-context", "entity-states"], readMinutes: 5 },
    b152: { difficulty: "medium", priority: "high", tags: ["hibernate", "dirty-checking", "flush"], readMinutes: 4 },
    b153: { difficulty: "medium", priority: "very-high", tags: ["fetch", "lazy", "lazyinit"], readMinutes: 5 },
    b154: { difficulty: "hard", priority: "very-high", tags: ["n+1", "fetch-join", "batch-size"], readMinutes: 5 },
    b155: { difficulty: "medium", priority: "high", tags: ["jpql", "criteria", "native"], readMinutes: 5 },
    b156: { difficulty: "medium", priority: "high", tags: ["dto", "projection", "read-model"], readMinutes: 4 },
    b157: { difficulty: "medium", priority: "very-high", tags: ["association", "mappedby", "owning-side"], readMinutes: 5 },
    b158: { difficulty: "medium", priority: "high", tags: ["cascade", "orphan-removal", "integrity"], readMinutes: 5 },
    b159: { difficulty: "hard", priority: "high", tags: ["pagination", "keyset", "slice"], readMinutes: 5 },
    b160: { difficulty: "hard", priority: "high", tags: ["batch", "jdbc-batching", "sequence"], readMinutes: 5 },
    b161: { difficulty: "medium", priority: "medium", tags: ["hibernate", "l1-cache", "l2-cache"], readMinutes: 5 },
    b162: { difficulty: "medium", priority: "very-high", tags: ["osiv", "lazy", "connections"], readMinutes: 4 },
    b163: { difficulty: "hard", priority: "high", tags: ["lockmodetype", "pessimistic", "version"], readMinutes: 5 },
    b164: { difficulty: "medium", priority: "medium", tags: ["normalization", "denormalization", "schema"], readMinutes: 4 },
    b165: { difficulty: "medium", priority: "high", tags: ["constraints", "validation", "integrity"], readMinutes: 4 },
    b166: { difficulty: "hard", priority: "medium", tags: ["streaming", "batch", "memory"], readMinutes: 5 },
    b167: { difficulty: "hard", priority: "high", tags: ["deadlock", "troubleshooting", "retry"], readMinutes: 5 },
    b168: { difficulty: "medium", priority: "very-high", tags: ["security", "sql-injection", "prepared-statement"], readMinutes: 4 },
  },
});
