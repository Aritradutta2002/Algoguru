import { ContentSection } from "./recursionContent";

export const javaSQLContent: ContentSection[] = [
  // ─── FUNDAMENTALS ───
  {
    id: "sql-intro",
    title: "SQL — Introduction & History",
    difficulty: "Easy",
    theory: [
      "**SQL (Structured Query Language)** is a domain-specific language designed for managing and manipulating **relational databases**. It was originally developed at IBM by **Donald Chamberlin** and **Raymond Boyce** in the early 1970s, based on Edgar F. Codd's relational model.",
      "SQL became an **ANSI standard in 1986** and an **ISO standard in 1987**. Major revisions include SQL-92, SQL:1999 (recursive queries, triggers), SQL:2003 (window functions, XML), SQL:2011 (temporal data), and SQL:2016 (JSON support).",
      "**Why SQL matters for interviews:** SQL is the universal language of data. Every backend engineer, data engineer, and full-stack developer must be fluent in SQL. Interview questions range from basic CRUD to complex analytical queries involving window functions, CTEs, and query optimization.",
      "**SQL vs NoSQL:** SQL databases (MySQL, PostgreSQL, Oracle, SQL Server) enforce a **schema**, support **ACID transactions**, and use **joins** for related data. NoSQL databases (MongoDB, Cassandra, DynamoDB) offer schema flexibility, horizontal scaling, and eventual consistency. The choice depends on data structure, consistency requirements, and scale.",
      "**Types of SQL Commands:** DDL (Data Definition Language) — CREATE, ALTER, DROP, TRUNCATE. DML (Data Manipulation Language) — SELECT, INSERT, UPDATE, DELETE. DCL (Data Control Language) — GRANT, REVOKE. TCL (Transaction Control Language) — COMMIT, ROLLBACK, SAVEPOINT. DQL (Data Query Language) — SELECT (sometimes classified separately).",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- DDL: Create a table
CREATE TABLE employees (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) UNIQUE,
    department VARCHAR(50),
    salary     DECIMAL(10,2) DEFAULT 0.00,
    hire_date  DATE NOT NULL,
    manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DML: Insert rows
INSERT INTO employees (name, email, department, salary, hire_date)
VALUES ('Alice Johnson', 'alice@company.com', 'Engineering', 95000, '2022-01-15'),
       ('Bob Smith', 'bob@company.com', 'Engineering', 88000, '2022-03-20'),
       ('Carol White', 'carol@company.com', 'Marketing', 72000, '2021-06-01');

-- DQL: Query with filter
SELECT name, salary FROM employees WHERE department = 'Engineering' ORDER BY salary DESC;

-- DML: Update
UPDATE employees SET salary = salary * 1.10 WHERE department = 'Engineering';

-- DML: Delete
DELETE FROM employees WHERE id = 3;

-- DDL: Alter table
ALTER TABLE employees ADD COLUMN phone VARCHAR(20);

-- DDL: Drop table
-- DROP TABLE employees;  -- Destructive! Use with caution` }],
    note: "SQL is **declarative** — you specify *what* data you want, not *how* to get it. The database engine's query optimizer determines the execution plan."
  },

  // ─── SELECT, WHERE, ORDER BY ───
  {
    id: "sql-select",
    title: "SELECT, WHERE, ORDER BY & LIMIT",
    difficulty: "Easy",
    theory: [
      "The **SELECT** statement is the foundation of SQL querying. It retrieves data from one or more tables. The logical order of execution is: FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT/OFFSET.",
      "**WHERE clause** filters rows before grouping. It supports comparison operators (=, <>, <, >, <=, >=), logical operators (AND, OR, NOT), pattern matching (LIKE, ILIKE), range checks (BETWEEN), set membership (IN), and NULL checks (IS NULL, IS NOT NULL).",
      "**ORDER BY** sorts the result set. You can sort by multiple columns, use ASC (default) or DESC, and reference columns by alias or position number. **NULLS FIRST/LAST** controls NULL ordering (PostgreSQL).",
      "**LIMIT and OFFSET** control pagination. LIMIT restricts the number of rows returned. OFFSET skips a specified number of rows. For large datasets, **keyset pagination** (WHERE id > last_seen_id) is more efficient than OFFSET because OFFSET still scans skipped rows.",
      "**DISTINCT** removes duplicate rows from the result. DISTINCT ON (PostgreSQL) returns the first row for each unique value of specified columns. Use sparingly — it can be expensive on large datasets.",
      "**Aliasing:** Use AS to rename columns or tables in the result. Table aliases are essential for self-joins and improve readability. Column aliases defined in SELECT cannot be used in WHERE (use HAVING or a subquery instead).",
      "**Interview Tip:** Always mention the logical execution order when discussing SQL. Understanding that WHERE executes before SELECT explains why you can't use column aliases in WHERE clauses.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- Basic SELECT with WHERE
SELECT name, department, salary
FROM employees
WHERE salary > 80000 AND department = 'Engineering';

-- Pattern matching with LIKE
SELECT * FROM employees WHERE name LIKE 'A%';        -- starts with A
SELECT * FROM employees WHERE email LIKE '%@gmail%';  -- contains @gmail
SELECT * FROM employees WHERE name LIKE '_o%';        -- second char is 'o'

-- IN operator
SELECT * FROM employees WHERE department IN ('Engineering', 'Marketing', 'Sales');

-- BETWEEN (inclusive on both ends)
SELECT * FROM employees WHERE salary BETWEEN 70000 AND 100000;

-- NULL handling
SELECT * FROM employees WHERE manager_id IS NULL;     -- top-level managers

-- ORDER BY with multiple columns
SELECT name, department, salary
FROM employees
ORDER BY department ASC, salary DESC;

-- LIMIT + OFFSET for pagination
SELECT * FROM employees ORDER BY id LIMIT 10 OFFSET 20;  -- page 3 (10 per page)

-- Keyset pagination (more efficient for large tables)
SELECT * FROM employees WHERE id > 100 ORDER BY id LIMIT 10;

-- DISTINCT
SELECT DISTINCT department FROM employees;

-- Column aliases
SELECT name, salary * 12 AS annual_salary
FROM employees
ORDER BY annual_salary DESC;  -- alias works in ORDER BY but NOT in WHERE` }],
    note: "**Performance insight:** LIKE patterns starting with '%' cannot use indexes efficiently. For full-text search, use dedicated features like PostgreSQL's `tsvector` or MySQL's `FULLTEXT` indexes."
  },

  // ─── AGGREGATE FUNCTIONS & GROUP BY ───
  {
    id: "sql-aggregates",
    title: "Aggregate Functions & GROUP BY",
    difficulty: "Easy",
    theory: [
      "**Aggregate functions** perform calculations across a set of rows and return a single value. The main aggregates are: COUNT (number of rows), SUM (total), AVG (average), MIN (minimum), MAX (maximum).",
      "**COUNT variations:** COUNT(*) counts all rows including NULLs. COUNT(column) counts non-NULL values. COUNT(DISTINCT column) counts unique non-NULL values. This distinction is a frequent interview question.",
      "**GROUP BY** divides rows into groups based on column values. Each group produces one row in the result. Every column in SELECT must either appear in GROUP BY or be wrapped in an aggregate function — this is a fundamental rule.",
      "**HAVING** filters groups after aggregation (unlike WHERE which filters individual rows before grouping). You can reference aggregate functions in HAVING but not in WHERE.",
      "**ROLLUP and CUBE** (SQL:1999) provide subtotals and grand totals. ROLLUP generates hierarchical subtotals. CUBE generates all possible subtotal combinations. GROUPING SETS lets you specify exactly which groupings to compute.",
      "**Interview classic:** 'Find departments with more than 5 employees whose average salary exceeds 80000.' This tests GROUP BY + HAVING + multiple aggregates.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- Basic aggregates
SELECT COUNT(*) AS total_employees,
       AVG(salary) AS avg_salary,
       MIN(salary) AS min_salary,
       MAX(salary) AS max_salary,
       SUM(salary) AS total_payroll
FROM employees;

-- COUNT variations
SELECT COUNT(*) AS total_rows,              -- includes NULLs
       COUNT(manager_id) AS has_manager,     -- excludes NULLs
       COUNT(DISTINCT department) AS dept_count  -- unique departments
FROM employees;

-- GROUP BY with aggregates
SELECT department,
       COUNT(*) AS emp_count,
       AVG(salary) AS avg_salary,
       MAX(salary) AS top_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;

-- HAVING filters groups (not rows)
SELECT department, AVG(salary) AS avg_sal
FROM employees
GROUP BY department
HAVING COUNT(*) >= 5 AND AVG(salary) > 80000;

-- ROLLUP for subtotals (MySQL/PostgreSQL)
SELECT department, COUNT(*) AS cnt, SUM(salary) AS total
FROM employees
GROUP BY ROLLUP(department);
-- Produces: per-department totals + grand total row

-- GROUPING SETS (PostgreSQL)
SELECT department, EXTRACT(YEAR FROM hire_date) AS hire_year, COUNT(*)
FROM employees
GROUP BY GROUPING SETS (
    (department),
    (hire_year),
    (department, hire_year),
    ()  -- grand total
);` }],
    note: "**Rule of thumb:** If you need to filter *before* grouping → use WHERE. If you need to filter *after* grouping → use HAVING."
  },

  // ─── JOINS ───
  {
    id: "sql-joins",
    title: "Joins — INNER, OUTER, CROSS, SELF",
    difficulty: "Medium",
    theory: [
      "**Joins** combine rows from two or more tables based on a related column. Understanding join types is the #1 most tested SQL topic in interviews.",
      "**INNER JOIN** returns only rows that have matching values in both tables. If an employee has no matching department, that employee is excluded. This is the default and most common join type.",
      "**LEFT (OUTER) JOIN** returns all rows from the left table and matching rows from the right table. If no match exists, the right side columns contain NULL. This is essential for finding 'missing' relationships — e.g., employees without a department.",
      "**RIGHT (OUTER) JOIN** is the mirror of LEFT JOIN — all rows from the right table with matching left rows. In practice, most developers rewrite RIGHT JOINs as LEFT JOINs by swapping table order for readability.",
      "**FULL (OUTER) JOIN** returns all rows from both tables. Where no match exists, NULLs fill the missing side. Useful for data reconciliation — finding records that exist in one table but not the other.",
      "**CROSS JOIN** produces the Cartesian product — every row from table A paired with every row from table B. If A has M rows and B has N rows, the result has M×N rows. Useful for generating combinations or date/category matrices.",
      "**SELF JOIN** is when a table is joined to itself. Classic use case: employee-manager hierarchy (employees table references itself via manager_id). Always use table aliases to disambiguate.",
      "**NATURAL JOIN** automatically joins on columns with the same name. Avoid in production — it's fragile and can break when columns are added. **USING** is a safer alternative when join columns share the same name.",
      "**Join performance:** Indexes on join columns are critical. The database may use Nested Loop Join (small tables), Hash Join (equality joins, larger tables), or Merge Join (sorted inputs). EXPLAIN ANALYZE reveals the chosen strategy.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- INNER JOIN: employees with their department info
SELECT e.name, e.salary, d.department_name, d.location
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;

-- LEFT JOIN: all employees, even those without a department
SELECT e.name, d.department_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;

-- Find employees WITHOUT a department (LEFT JOIN + IS NULL pattern)
SELECT e.name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE d.id IS NULL;

-- FULL OUTER JOIN: reconcile two datasets
SELECT COALESCE(a.email, b.email) AS email,
       a.name AS system_a_name,
       b.name AS system_b_name
FROM system_a a
FULL OUTER JOIN system_b b ON a.email = b.email
WHERE a.email IS NULL OR b.email IS NULL;  -- mismatches only

-- SELF JOIN: employee with their manager's name
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- CROSS JOIN: generate a calendar matrix
SELECT d.date_val, c.category_name
FROM dates d
CROSS JOIN categories c;

-- Multiple joins
SELECT e.name, d.department_name, p.project_name
FROM employees e
JOIN departments d ON e.department_id = d.id
JOIN project_assignments pa ON pa.employee_id = e.id
JOIN projects p ON pa.project_id = p.id;

-- USING shorthand (when column names match)
SELECT e.name, d.department_name
FROM employees e
JOIN departments d USING (department_id);` }],
    note: "**Interview pattern:** 'Find all X that don't have Y' → LEFT JOIN + WHERE right_side IS NULL. This is more efficient than NOT IN with subqueries because NOT IN handles NULLs poorly."
  },

  // ─── SUBQUERIES ───
  {
    id: "sql-subqueries",
    title: "Subqueries — Scalar, Correlated & Derived Tables",
    difficulty: "Medium",
    theory: [
      "A **subquery** (inner query) is a query nested inside another query. Subqueries can appear in SELECT, FROM, WHERE, and HAVING clauses.",
      "**Scalar subquery** returns exactly one value (one row, one column). Can be used in SELECT or WHERE. If it returns more than one row, the query errors.",
      "**Row subquery** returns a single row with multiple columns. Used with row constructors: WHERE (col1, col2) = (SELECT ...).",
      "**Table subquery (derived table)** returns a result set used as a virtual table in FROM. Must always have an alias. This is powerful for multi-step transformations.",
      "**Correlated subquery** references columns from the outer query. It executes once per row of the outer query, making it potentially expensive. The EXISTS operator is the most common use with correlated subqueries.",
      "**EXISTS vs IN:** EXISTS stops at the first match (short-circuits), making it efficient for large subquery results. IN materializes the entire subquery result. EXISTS handles NULLs correctly; NOT IN does not (if the subquery returns any NULL, NOT IN returns no rows).",
      "**Subquery vs JOIN:** Many subqueries can be rewritten as JOINs for better performance. However, correlated subqueries for existence checks (EXISTS) are often optimal. Modern query optimizers can flatten simple subqueries into joins automatically.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- Scalar subquery in WHERE
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Scalar subquery in SELECT
SELECT name, salary,
       salary - (SELECT AVG(salary) FROM employees) AS above_avg
FROM employees;

-- Correlated subquery: employees earning more than their dept average
SELECT e.name, e.salary, e.department
FROM employees e
WHERE e.salary > (
    SELECT AVG(e2.salary)
    FROM employees e2
    WHERE e2.department = e.department  -- correlated!
);

-- EXISTS: departments that have at least one employee
SELECT d.department_name
FROM departments d
WHERE EXISTS (
    SELECT 1 FROM employees e WHERE e.department_id = d.id
);

-- NOT EXISTS: departments with no employees
SELECT d.department_name
FROM departments d
WHERE NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.department_id = d.id
);

-- Derived table (subquery in FROM)
SELECT dept_stats.department, dept_stats.avg_salary
FROM (
    SELECT department, AVG(salary) AS avg_salary, COUNT(*) AS cnt
    FROM employees
    GROUP BY department
) AS dept_stats
WHERE dept_stats.cnt >= 3
ORDER BY dept_stats.avg_salary DESC;

-- IN with subquery
SELECT name FROM employees
WHERE department_id IN (
    SELECT id FROM departments WHERE location = 'New York'
);

-- ALL / ANY
SELECT name, salary FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE department = 'Marketing');` }],
    note: "**Critical interview gotcha:** `NOT IN (subquery)` returns **empty result** if the subquery contains any NULL value. Always prefer `NOT EXISTS` for safety."
  },

  // ─── WINDOW FUNCTIONS ───
  {
    id: "sql-window",
    title: "Window Functions — ROW_NUMBER, RANK, LEAD/LAG",
    difficulty: "Hard",
    theory: [
      "**Window functions** perform calculations across a set of rows related to the current row, without collapsing them into groups (unlike GROUP BY). They are defined by the OVER() clause.",
      "**PARTITION BY** divides the result set into partitions (like GROUP BY for window functions). Each partition is processed independently. Without PARTITION BY, the entire result set is one partition.",
      "**ORDER BY** inside OVER() defines the order within each partition. This is required for ranking and cumulative functions.",
      "**Frame specification** (ROWS BETWEEN / RANGE BETWEEN) defines exactly which rows relative to the current row are included in the calculation. Default frame with ORDER BY is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW.",
      "**Ranking functions:** ROW_NUMBER() assigns unique sequential integers (no ties). RANK() assigns the same rank to ties and skips numbers (1,2,2,4). DENSE_RANK() assigns the same rank to ties without gaps (1,2,2,3). NTILE(n) divides rows into n roughly equal groups.",
      "**Value functions:** LAG(col, n) accesses the value from n rows before. LEAD(col, n) accesses the value from n rows after. FIRST_VALUE(col) and LAST_VALUE(col) access the first/last value in the frame. NTH_VALUE(col, n) accesses the nth value.",
      "**Aggregate window functions:** SUM(), AVG(), COUNT(), MIN(), MAX() can all be used with OVER() to compute running totals, moving averages, etc.",
      "**Window functions execute after WHERE, GROUP BY, and HAVING** but before ORDER BY and LIMIT. You cannot use window functions in WHERE — wrap in a subquery or CTE.",
      "**Interview favorite:** 'Find the second highest salary in each department' → ROW_NUMBER() or DENSE_RANK() with PARTITION BY department.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- ROW_NUMBER: assign unique row numbers per department
SELECT name, department, salary,
       ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
FROM employees;

-- Find top 3 earners in each department
SELECT * FROM (
    SELECT name, department, salary,
           DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk
    FROM employees
) ranked
WHERE rnk <= 3;

-- RANK vs DENSE_RANK vs ROW_NUMBER
SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,   -- 1,2,3,4,5
       RANK()       OVER (ORDER BY salary DESC) AS rank_val,  -- 1,2,2,4,5 (gaps)
       DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk  -- 1,2,2,3,4 (no gaps)
FROM employees;

-- LAG / LEAD: compare with previous/next row
SELECT name, salary,
       LAG(salary, 1) OVER (ORDER BY salary) AS prev_salary,
       LEAD(salary, 1) OVER (ORDER BY salary) AS next_salary,
       salary - LAG(salary, 1) OVER (ORDER BY salary) AS salary_gap
FROM employees;

-- Running total (cumulative sum)
SELECT name, salary,
       SUM(salary) OVER (ORDER BY hire_date) AS running_total
FROM employees;

-- Moving average (last 3 rows)
SELECT name, hire_date, salary,
       AVG(salary) OVER (
           ORDER BY hire_date
           ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS moving_avg_3
FROM employees;

-- NTILE: divide into quartiles
SELECT name, salary,
       NTILE(4) OVER (ORDER BY salary) AS quartile
FROM employees;

-- Percentage of department total
SELECT name, department, salary,
       ROUND(100.0 * salary / SUM(salary) OVER (PARTITION BY department), 2) AS pct_of_dept
FROM employees;` }],
    note: "**Window functions are the #1 advanced SQL topic in FAANG interviews.** Master ROW_NUMBER, RANK, running totals, and LAG/LEAD — they appear in nearly every SQL round."
  },

  // ─── CTEs ───
  {
    id: "sql-cte",
    title: "Common Table Expressions (CTEs) & Recursive Queries",
    difficulty: "Medium",
    theory: [
      "A **CTE (Common Table Expression)** is a named temporary result set defined with the WITH clause. It exists only for the duration of a single query and improves readability by breaking complex queries into logical steps.",
      "**Non-recursive CTEs** are essentially named subqueries. They can be referenced multiple times in the main query (unlike derived tables which must be repeated). Some databases materialize CTEs (PostgreSQL before v12), while others inline them (MySQL 8+, PostgreSQL 12+).",
      "**Multiple CTEs** can be defined in a single WITH clause, separated by commas. Later CTEs can reference earlier ones, enabling step-by-step data transformations.",
      "**Recursive CTEs** have a base case (anchor member) and a recursive step joined by UNION ALL. They terminate when the recursive step produces no new rows. Essential for hierarchical data: org charts, category trees, graph traversal.",
      "**Recursive CTE structure:** WITH RECURSIVE cte AS (anchor UNION ALL recursive_step). The recursive step references the CTE itself. Always include a termination condition to prevent infinite loops.",
      "**CTE vs Subquery vs Temp Table:** CTEs win on readability and are scoped to one query. Temp tables persist for the session and can be indexed. Subqueries are inline and can be auto-flattened by the optimizer. For interview answers, CTEs demonstrate clean thinking.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- Simple CTE
WITH dept_stats AS (
    SELECT department,
           COUNT(*) AS emp_count,
           AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department
)
SELECT department, emp_count, avg_salary
FROM dept_stats
WHERE emp_count >= 3
ORDER BY avg_salary DESC;

-- Multiple CTEs (chained)
WITH high_earners AS (
    SELECT * FROM employees WHERE salary > 90000
),
dept_summary AS (
    SELECT department, COUNT(*) AS cnt
    FROM high_earners
    GROUP BY department
)
SELECT * FROM dept_summary WHERE cnt >= 2;

-- Recursive CTE: employee hierarchy (org chart)
WITH RECURSIVE org_chart AS (
    -- Base case: top-level managers (no manager)
    SELECT id, name, manager_id, 1 AS level, CAST(name AS VARCHAR(1000)) AS path
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive step: find direct reports
    SELECT e.id, e.name, e.manager_id, oc.level + 1,
           CONCAT(oc.path, ' → ', e.name)
    FROM employees e
    INNER JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT name, level, path FROM org_chart ORDER BY path;

-- Recursive CTE: generate date series
WITH RECURSIVE dates AS (
    SELECT DATE '2024-01-01' AS dt
    UNION ALL
    SELECT dt + INTERVAL '1 day' FROM dates WHERE dt < '2024-01-31'
)
SELECT dt FROM dates;

-- Recursive CTE: Fibonacci sequence
WITH RECURSIVE fib AS (
    SELECT 1 AS n, 1 AS val, 0 AS prev_val
    UNION ALL
    SELECT n + 1, val + prev_val, val FROM fib WHERE n < 20
)
SELECT n, val FROM fib;` }],
    note: "**Interview tip:** When given a complex query, always start by outlining the CTE structure. It shows the interviewer you think in logical steps."
  },

  // ─── INDEXING & PERFORMANCE ───
  {
    id: "sql-indexes",
    title: "Indexes — B-Tree, Hash, Composite & Covering",
    difficulty: "Hard",
    theory: [
      "An **index** is a data structure that speeds up data retrieval at the cost of additional storage and slower writes (INSERT/UPDATE/DELETE). Think of it like a book's index — instead of scanning every page, you look up the topic and jump to the right page.",
      "**B-Tree index** (default) is a balanced tree structure. Supports equality (=), range (<, >, BETWEEN), ORDER BY, and prefix LIKE ('abc%'). Does NOT help with suffix LIKE ('%abc'). O(log n) lookup. Most versatile and commonly used index type.",
      "**Hash index** stores hash values of the indexed column. Only supports equality (=) lookups — no range queries, no sorting. O(1) average lookup but rarely used because B-Tree is nearly as fast for equality and far more versatile.",
      "**Composite (multi-column) index** indexes multiple columns in a specific order. Follows the **leftmost prefix rule** — an index on (A, B, C) can be used for queries on (A), (A, B), or (A, B, C), but NOT (B) or (C) alone. Column order matters enormously.",
      "**Covering index** includes all columns needed by a query, allowing the database to satisfy the query entirely from the index without accessing the table data (an 'index-only scan'). This can dramatically speed up read-heavy queries.",
      "**Clustered vs Non-clustered:** A clustered index determines the physical order of data on disk (one per table — usually the primary key). Non-clustered indexes are separate structures with pointers to the data rows.",
      "**When NOT to index:** Small tables (full scan is faster), columns with low cardinality (e.g., boolean), tables with heavy write loads, columns rarely used in WHERE/JOIN/ORDER BY.",
      "**Index maintenance:** Indexes consume disk space and slow down writes. Over-indexing is a common anti-pattern. Use EXPLAIN ANALYZE to verify an index is actually being used. Drop unused indexes.",
      "**Partial index** (PostgreSQL): indexes only rows matching a condition. E.g., CREATE INDEX idx ON orders (status) WHERE status = 'pending'. Smaller and faster than a full index.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- Create a B-Tree index (default)
CREATE INDEX idx_emp_department ON employees(department);

-- Composite index (order matters!)
CREATE INDEX idx_emp_dept_salary ON employees(department, salary);
-- This helps: WHERE department = 'Eng' AND salary > 80000
-- This helps: WHERE department = 'Eng'
-- This does NOT help: WHERE salary > 80000 (leftmost prefix rule)

-- Unique index (enforces uniqueness + speeds up lookups)
CREATE UNIQUE INDEX idx_emp_email ON employees(email);

-- Covering index (includes extra columns)
CREATE INDEX idx_emp_covering ON employees(department, salary) INCLUDE (name);
-- SELECT name, salary FROM employees WHERE department = 'Eng'
-- → Index-only scan, no table access needed!

-- Partial index (PostgreSQL)
CREATE INDEX idx_active_orders ON orders(created_at)
WHERE status = 'active';

-- Hash index (PostgreSQL) — equality only
CREATE INDEX idx_emp_email_hash ON employees USING HASH (email);

-- EXPLAIN ANALYZE: see the query plan
EXPLAIN ANALYZE
SELECT name, salary FROM employees WHERE department = 'Engineering';
-- Look for: Seq Scan (bad on large tables) vs Index Scan (good)

-- Drop unused indexes
DROP INDEX IF EXISTS idx_emp_department;

-- List all indexes on a table (PostgreSQL)
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'employees';` }],
    warning: "**Over-indexing** degrades write performance. Every INSERT/UPDATE/DELETE must update all relevant indexes. Profile before adding indexes — don't guess."
  },

  // ─── QUERY OPTIMIZATION ───
  {
    id: "sql-optimization",
    title: "Query Optimization & EXPLAIN",
    difficulty: "Hard",
    theory: [
      "**Query optimization** is the process of analyzing and improving SQL queries to minimize execution time, I/O, and resource usage. The database's **query optimizer** automatically generates an execution plan, but understanding it helps you write better queries.",
      "**EXPLAIN** shows the query plan without executing. **EXPLAIN ANALYZE** (PostgreSQL) or **EXPLAIN FORMAT=JSON** (MySQL) actually executes the query and shows real timing and row counts. Always use ANALYZE when profiling.",
      "**Common scan types:** Sequential Scan (reads entire table — slow for large tables), Index Scan (uses index then fetches rows — fast), Index Only Scan (satisfies query from index alone — fastest), Bitmap Index Scan (for multiple index conditions).",
      "**Join algorithms:** Nested Loop (for small tables or indexed joins), Hash Join (builds hash table from smaller table, probes with larger — great for equality joins), Merge Join (both inputs sorted — efficient for large sorted datasets).",
      "**Key optimization strategies:** 1) Add appropriate indexes. 2) Avoid SELECT * — fetch only needed columns. 3) Use LIMIT for pagination. 4) Avoid functions on indexed columns in WHERE (kills index usage). 5) Use EXISTS instead of IN for large subqueries. 6) Denormalize read-heavy tables. 7) Use materialized views for expensive aggregations.",
      "**N+1 query problem:** Fetching a list of items, then issuing a separate query for each item's related data. Solution: use JOINs or batch IN queries. This is the most common performance issue in application code.",
      "**Query anti-patterns:** Using DISTINCT to mask a bad join. Using ORDER BY RAND() for random selection (scans entire table). Comparing with functions: WHERE YEAR(date_col) = 2024 (use WHERE date_col >= '2024-01-01').",
      "**Cardinality estimation:** The optimizer estimates how many rows each step will produce. Stale statistics lead to bad plans. Run ANALYZE (PostgreSQL) or ANALYZE TABLE (MySQL) to update statistics.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- EXPLAIN ANALYZE (PostgreSQL) — see real execution
EXPLAIN ANALYZE
SELECT e.name, d.department_name
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.salary > 80000;

-- BAD: Function on indexed column prevents index use
SELECT * FROM employees WHERE YEAR(hire_date) = 2024;
-- GOOD: Sargable (Search ARGument ABLE) — uses index
SELECT * FROM employees
WHERE hire_date >= '2024-01-01' AND hire_date < '2025-01-01';

-- BAD: SELECT *
SELECT * FROM employees WHERE department = 'Engineering';
-- GOOD: Select only needed columns
SELECT name, salary FROM employees WHERE department = 'Engineering';

-- BAD: N+1 queries (in application code)
-- for each department: SELECT * FROM employees WHERE dept_id = ?
-- GOOD: Single join
SELECT d.name, e.name, e.salary
FROM departments d
JOIN employees e ON e.department_id = d.id;

-- BAD: ORDER BY RAND() for random row
SELECT * FROM products ORDER BY RAND() LIMIT 1;
-- GOOD: Use table count + offset
SELECT * FROM products LIMIT 1 OFFSET FLOOR(RANDOM() * (SELECT COUNT(*) FROM products));

-- Force index hint (MySQL)
SELECT * FROM employees FORCE INDEX (idx_emp_dept_salary)
WHERE department = 'Engineering' AND salary > 80000;

-- Update statistics (PostgreSQL)
ANALYZE employees;` }],
    note: "**Interview mantra:** 'SELECT only what you need, index what you search, and always check EXPLAIN.'"
  },

  // ─── NORMALIZATION ───
  {
    id: "sql-normalization",
    title: "Normalization — 1NF to BCNF & Denormalization",
    difficulty: "Medium",
    theory: [
      "**Database normalization** is the process of organizing data to minimize redundancy and dependency. It follows a series of 'normal forms' (NF), each building on the previous one.",
      "**1NF (First Normal Form):** Each cell contains a single atomic value (no lists, no sets). Each row is unique (has a primary key). Each column has a consistent data type. **Violation example:** A 'phone_numbers' column containing '555-1234, 555-5678'.",
      "**2NF (Second Normal Form):** Must be in 1NF. Every non-key column must depend on the entire primary key (no partial dependencies). Relevant when the primary key is composite. **Violation:** In a table with PK (student_id, course_id), storing student_name depends only on student_id.",
      "**3NF (Third Normal Form):** Must be in 2NF. No transitive dependencies — non-key columns must not depend on other non-key columns. **Violation:** Storing department_name and department_location together (location depends on department_name, not directly on employee_id).",
      "**BCNF (Boyce-Codd Normal Form):** A stricter version of 3NF. Every determinant must be a candidate key. Rarely violated in practice if you're already in 3NF. Important for theoretical interviews.",
      "**Denormalization** is the intentional addition of redundancy to improve read performance. Common in data warehouses, reporting databases, and high-traffic applications. Techniques include adding computed columns, duplicating data across tables, and using materialized views.",
      "**Trade-offs:** Normalization → data integrity, smaller storage, slower reads (more joins). Denormalization → faster reads, redundant data, risk of inconsistency, larger storage.",
      "**Interview rule:** Design schemas in 3NF, then selectively denormalize based on query patterns and performance requirements.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- ❌ Violates 1NF: multi-valued column
CREATE TABLE students_bad (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    phone_numbers VARCHAR(500)  -- '555-1234, 555-5678' — NOT atomic!
);

-- ✅ 1NF: separate table for multi-valued attribute
CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(100)
);
CREATE TABLE student_phones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT REFERENCES students(id),
    phone VARCHAR(20) NOT NULL
);

-- ❌ Violates 2NF: partial dependency on composite key
CREATE TABLE enrollments_bad (
    student_id INT,
    course_id INT,
    student_name VARCHAR(100),  -- depends only on student_id!
    grade CHAR(2),
    PRIMARY KEY (student_id, course_id)
);

-- ✅ 2NF: separate student info
CREATE TABLE enrollments (
    student_id INT REFERENCES students(id),
    course_id INT REFERENCES courses(id),
    grade CHAR(2),
    PRIMARY KEY (student_id, course_id)
);

-- ❌ Violates 3NF: transitive dependency
CREATE TABLE employees_bad (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    dept_id INT,
    dept_name VARCHAR(100),    -- depends on dept_id, not employee id
    dept_location VARCHAR(100) -- transitive: depends on dept_name
);

-- ✅ 3NF: separate departments table
CREATE TABLE departments (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100)
);
CREATE TABLE employees_3nf (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    dept_id INT REFERENCES departments(id)
);` }],
    note: "**Normalize until it hurts, denormalize until it works.** — common database design philosophy."
  },

  // ─── TRANSACTIONS & ACID ───
  {
    id: "sql-transactions",
    title: "Transactions, ACID & Isolation Levels",
    difficulty: "Hard",
    theory: [
      "A **transaction** is a logical unit of work consisting of one or more SQL operations that must either all succeed (COMMIT) or all fail (ROLLBACK). Transactions guarantee data integrity in concurrent environments.",
      "**ACID properties:** **Atomicity** — all operations succeed or none do. **Consistency** — the database transitions from one valid state to another. **Isolation** — concurrent transactions don't interfere with each other. **Durability** — committed changes survive system failures (written to disk/WAL).",
      "**Isolation levels** define how transactions interact. From least to most strict: READ UNCOMMITTED (dirty reads possible), READ COMMITTED (no dirty reads, but non-repeatable reads possible — PostgreSQL default), REPEATABLE READ (no phantom reads in some DBs — MySQL InnoDB default), SERIALIZABLE (full isolation, as if transactions ran sequentially).",
      "**Concurrency phenomena:** **Dirty Read** — reading uncommitted changes from another transaction. **Non-Repeatable Read** — re-reading a row gives different values because another transaction modified it. **Phantom Read** — re-running a query returns different rows because another transaction inserted/deleted rows.",
      "**Deadlocks** occur when two transactions wait for each other's locks. The database detects deadlocks and rolls back one transaction (the victim). Prevention: access resources in consistent order, keep transactions short, use appropriate isolation levels.",
      "**Savepoints** allow partial rollback within a transaction. SAVEPOINT sp1; ... ROLLBACK TO sp1; — rolls back to the savepoint without aborting the entire transaction.",
      "**Two-Phase Commit (2PC)** is used in distributed databases to ensure atomicity across multiple nodes. Phase 1: Prepare (all nodes vote). Phase 2: Commit (if all voted yes) or Abort.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- Basic transaction
BEGIN TRANSACTION;  -- or just BEGIN; or START TRANSACTION;

UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;

-- If both succeed:
COMMIT;

-- If anything goes wrong:
-- ROLLBACK;

-- Transaction with error handling (PostgreSQL PL/pgSQL)
DO $$
BEGIN
    UPDATE accounts SET balance = balance - 500 WHERE id = 1;
    UPDATE accounts SET balance = balance + 500 WHERE id = 2;
    
    -- Verify no negative balance
    IF (SELECT balance FROM accounts WHERE id = 1) < 0 THEN
        RAISE EXCEPTION 'Insufficient funds';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Transaction failed: %', SQLERRM;
        -- Transaction is automatically rolled back
END $$;

-- Savepoints for partial rollback
BEGIN;
INSERT INTO orders (customer_id, total) VALUES (1, 100);
SAVEPOINT sp1;
INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 5, 2);
-- Oops, wrong product — rollback just this part
ROLLBACK TO sp1;
INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 7, 2);
COMMIT;

-- Set isolation level
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
SELECT * FROM inventory WHERE product_id = 1;
-- ... other operations ...
COMMIT;

-- Check current isolation level (PostgreSQL)
SHOW transaction_isolation;` }],
    note: "**Interview must-know:** Always explain ACID properties with a real example (bank transfer). Knowing isolation levels and their trade-offs distinguishes senior candidates."
  },

  // ─── CONSTRAINTS & KEYS ───
  {
    id: "sql-constraints",
    title: "Constraints — PK, FK, UNIQUE, CHECK & Referential Integrity",
    difficulty: "Medium",
    theory: [
      "**Constraints** enforce rules on data to maintain integrity. They are the first line of defense against bad data — never rely solely on application-level validation.",
      "**PRIMARY KEY:** Uniquely identifies each row. Must be NOT NULL and UNIQUE. Can be single-column (surrogate key like auto-increment ID) or composite (natural key like student_id + course_id). Every table should have a primary key.",
      "**FOREIGN KEY:** Establishes a relationship between tables. References the primary key (or unique key) of another table. Prevents orphaned records. ON DELETE options: CASCADE (delete child rows), SET NULL (set FK to NULL), RESTRICT (prevent deletion), SET DEFAULT.",
      "**UNIQUE:** Ensures all values in a column are distinct. Unlike PRIMARY KEY, allows NULL (most databases allow multiple NULLs in a UNIQUE column). A table can have multiple UNIQUE constraints.",
      "**CHECK:** Validates that values meet a boolean condition. E.g., CHECK (salary > 0), CHECK (age BETWEEN 18 AND 120). Supported in all major databases (MySQL added support in 8.0.16).",
      "**NOT NULL:** Ensures a column cannot contain NULL values. Critical for columns that must always have data (e.g., name, email).",
      "**DEFAULT:** Specifies a default value when no value is provided during INSERT. Can be a literal, function (CURRENT_TIMESTAMP), or expression.",
      "**Surrogate vs Natural keys:** Surrogate keys (auto-increment integer, UUID) are artificial and stable. Natural keys (email, SSN) are meaningful but can change. Most systems use surrogate keys for primary keys.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- Table with comprehensive constraints
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,               -- surrogate key
    sku         VARCHAR(50) UNIQUE NOT NULL,       -- natural key candidate
    name        VARCHAR(200) NOT NULL,
    price       DECIMAL(10,2) CHECK (price > 0),   -- must be positive
    category_id INT REFERENCES categories(id)      -- foreign key
                    ON DELETE SET NULL
                    ON UPDATE CASCADE,
    stock       INT DEFAULT 0 CHECK (stock >= 0),
    status      VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Composite primary key
CREATE TABLE order_items (
    order_id    INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id  INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity    INT NOT NULL CHECK (quantity > 0),
    unit_price  DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);

-- Foreign key with CASCADE delete
-- When a customer is deleted, all their orders are also deleted
ALTER TABLE orders ADD CONSTRAINT fk_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Named constraint (for easier management)
ALTER TABLE employees
    ADD CONSTRAINT chk_salary_range CHECK (salary BETWEEN 30000 AND 500000);

-- Drop a constraint
ALTER TABLE employees DROP CONSTRAINT chk_salary_range;` }],
    note: "**Design principle:** Enforce constraints at the database level, not just in application code. The database is the last line of defense against data corruption."
  },

  // ─── VIEWS & MATERIALIZED VIEWS ───
  {
    id: "sql-views",
    title: "Views & Materialized Views",
    difficulty: "Medium",
    theory: [
      "A **view** is a virtual table defined by a SELECT query. It doesn't store data — it executes the underlying query each time it's accessed. Views simplify complex queries, provide security (expose only certain columns), and offer a stable interface even when underlying tables change.",
      "**Updatable views:** Simple views (single table, no aggregates, no DISTINCT, no GROUP BY) can be updated with INSERT/UPDATE/DELETE. The changes propagate to the underlying table. WITH CHECK OPTION ensures that modifications through the view still satisfy the view's WHERE condition.",
      "**Materialized views** (PostgreSQL, Oracle) store the query result physically on disk. They provide instant access to pre-computed data but become stale. Must be refreshed manually (REFRESH MATERIALIZED VIEW) or on a schedule. Ideal for expensive aggregations, dashboards, and reporting.",
      "**View vs CTE:** Views are persistent (stored in the database), reusable across queries, and can be granted permissions. CTEs are scoped to a single query. Use views for frequently-used query patterns.",
      "**Security through views:** GRANT SELECT on a view without granting access to underlying tables. This lets users see aggregated data without accessing individual records — a common pattern for data privacy.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- Create a view
CREATE VIEW employee_summary AS
SELECT e.id, e.name, e.salary, d.department_name,
       RANK() OVER (PARTITION BY d.id ORDER BY e.salary DESC) AS dept_rank
FROM employees e
JOIN departments d ON e.department_id = d.id;

-- Use the view like a table
SELECT * FROM employee_summary WHERE dept_rank = 1;

-- Updatable view with CHECK OPTION
CREATE VIEW active_employees AS
SELECT * FROM employees WHERE status = 'active'
WITH CHECK OPTION;
-- INSERT/UPDATE through this view must keep status = 'active'

-- Materialized view (PostgreSQL)
CREATE MATERIALIZED VIEW monthly_revenue AS
SELECT DATE_TRUNC('month', order_date) AS month,
       SUM(total) AS revenue,
       COUNT(*) AS order_count
FROM orders
GROUP BY DATE_TRUNC('month', order_date);

-- Create index on materialized view for fast lookups
CREATE INDEX idx_monthly_rev ON monthly_revenue(month);

-- Refresh (required after underlying data changes)
REFRESH MATERIALIZED VIEW monthly_revenue;

-- Concurrent refresh (doesn't lock reads)
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_revenue;

-- Drop view
DROP VIEW IF EXISTS employee_summary;
DROP MATERIALIZED VIEW IF EXISTS monthly_revenue;` }],
    note: "**Interview tip:** Materialized views are the go-to answer for 'How do you speed up a dashboard that runs expensive aggregate queries?'"
  },

  // ─── STORED PROCEDURES & FUNCTIONS ───
  {
    id: "sql-procedures",
    title: "Stored Procedures, Functions & Triggers",
    difficulty: "Hard",
    theory: [
      "**Stored procedures** are precompiled SQL code stored in the database. They accept parameters, contain control flow (IF/ELSE, loops), and can perform multiple operations. Benefits: reduced network traffic, reusable logic, security (GRANT EXECUTE without table access).",
      "**Functions** return a value and can be used in SELECT statements. Stored procedures perform actions and are invoked with CALL. In PostgreSQL, functions and procedures are both created with CREATE FUNCTION/PROCEDURE.",
      "**Triggers** are special procedures that automatically execute in response to table events (INSERT, UPDATE, DELETE). They can fire BEFORE or AFTER the event, and FOR EACH ROW or FOR EACH STATEMENT.",
      "**Trigger use cases:** Audit logging (track who changed what), data validation (complex rules beyond CHECK constraints), maintaining derived columns (e.g., updated_at timestamp), enforcing business rules, cascading updates.",
      "**Trigger warnings:** Triggers add hidden complexity — they execute implicitly, making debugging harder. Avoid long-running operations in triggers. Be cautious of trigger cascades (trigger A fires trigger B, etc.).",
      "**Interview perspective:** Know the difference between procedures and functions. Know BEFORE vs AFTER triggers. Be prepared to write a simple audit trigger.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- PostgreSQL: Create a function
CREATE OR REPLACE FUNCTION get_department_stats(dept_name VARCHAR)
RETURNS TABLE(employee_count BIGINT, avg_salary NUMERIC, max_salary NUMERIC)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(*), ROUND(AVG(salary), 2), MAX(salary)
    FROM employees
    WHERE department = dept_name;
END;
$$;

-- Call the function
SELECT * FROM get_department_stats('Engineering');

-- Stored procedure (PostgreSQL 11+)
CREATE OR REPLACE PROCEDURE transfer_funds(
    sender_id INT, receiver_id INT, amount DECIMAL
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE accounts SET balance = balance - amount WHERE id = sender_id;
    UPDATE accounts SET balance = balance + amount WHERE id = receiver_id;
    
    IF (SELECT balance FROM accounts WHERE id = sender_id) < 0 THEN
        RAISE EXCEPTION 'Insufficient funds';
    END IF;
    
    COMMIT;
END;
$$;

-- Call procedure
CALL transfer_funds(1, 2, 500.00);

-- Audit trigger: track all changes to employees table
CREATE TABLE employee_audit (
    audit_id SERIAL PRIMARY KEY,
    employee_id INT,
    action VARCHAR(10),
    old_salary DECIMAL(10,2),
    new_salary DECIMAL(10,2),
    changed_by TEXT DEFAULT CURRENT_USER,
    changed_at TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_employee_changes()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO employee_audit (employee_id, action, old_salary, new_salary)
        VALUES (OLD.id, 'UPDATE', OLD.salary, NEW.salary);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO employee_audit (employee_id, action, old_salary)
        VALUES (OLD.id, 'DELETE', OLD.salary);
        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER trg_employee_audit
AFTER UPDATE OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION log_employee_changes();` }],
    note: "**Best practice:** Keep trigger logic minimal. For complex workflows, use stored procedures called explicitly — they're easier to debug and test."
  },

  // ─── SET OPERATIONS ───
  {
    id: "sql-set-ops",
    title: "Set Operations — UNION, INTERSECT, EXCEPT",
    difficulty: "Medium",
    theory: [
      "**Set operations** combine results from two or more SELECT statements. Both queries must have the same number of columns with compatible data types.",
      "**UNION** combines results and removes duplicates. **UNION ALL** keeps duplicates and is faster (no deduplication step). Always prefer UNION ALL unless you specifically need deduplication.",
      "**INTERSECT** returns only rows that appear in both result sets. Equivalent to an INNER JOIN on all columns, but syntactically cleaner for set-based logic.",
      "**EXCEPT** (MINUS in Oracle) returns rows from the first query that don't appear in the second. Useful for finding differences between datasets.",
      "**Performance:** UNION requires sorting/hashing for deduplication. UNION ALL is O(n+m). INTERSECT and EXCEPT also require deduplication. For large datasets, consider JOIN-based alternatives.",
      "**Column naming:** The result set uses column names from the first SELECT. ORDER BY can reference these names or column positions (ORDER BY 1, 2).",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- UNION: combine customers and prospects (remove duplicates)
SELECT email, name FROM customers
UNION
SELECT email, name FROM prospects;

-- UNION ALL: faster, keeps duplicates
SELECT product_id, 'sale' AS type, amount FROM sales
UNION ALL
SELECT product_id, 'return' AS type, -amount FROM returns;

-- INTERSECT: customers who are also prospects
SELECT email FROM customers
INTERSECT
SELECT email FROM prospects;

-- EXCEPT: customers who are NOT prospects
SELECT email FROM customers
EXCEPT
SELECT email FROM prospects;

-- Practical: find products sold in January but not February
SELECT product_id FROM orders WHERE EXTRACT(MONTH FROM order_date) = 1
EXCEPT
SELECT product_id FROM orders WHERE EXTRACT(MONTH FROM order_date) = 2;

-- UNION with ORDER BY (applies to final result)
SELECT name, 'customer' AS source FROM customers
UNION ALL
SELECT name, 'employee' AS source FROM employees
ORDER BY name;` }],
    note: "**Interview shortcut:** EXCEPT is the set-based way to express 'Find X that are NOT in Y' — cleaner than LEFT JOIN + IS NULL for simple cases."
  },

  // ─── CASE, COALESCE, NULL HANDLING ───
  {
    id: "sql-case-null",
    title: "CASE Expressions, COALESCE & NULL Handling",
    difficulty: "Easy",
    theory: [
      "**CASE** is SQL's conditional expression (like if-else). Two forms: **Simple CASE** (compares a value to several options) and **Searched CASE** (evaluates boolean expressions). Can be used in SELECT, WHERE, ORDER BY, GROUP BY, and aggregate functions.",
      "**NULL** in SQL represents an unknown or missing value. NULL is not equal to anything — not even itself (NULL = NULL → NULL, not TRUE). Any arithmetic with NULL produces NULL. Any comparison with NULL produces UNKNOWN (which is treated as FALSE in WHERE).",
      "**NULL-safe functions:** COALESCE(a, b, c) returns the first non-NULL argument. NULLIF(a, b) returns NULL if a = b, otherwise a. IFNULL(a, b) (MySQL) / COALESCE(a, b) — returns b if a is NULL.",
      "**IS NULL / IS NOT NULL** are the only correct ways to check for NULL. Never use = NULL or != NULL.",
      "**NULL in aggregates:** COUNT(*) counts all rows. COUNT(column) skips NULLs. SUM, AVG, MIN, MAX all ignore NULLs. If all values are NULL, SUM/AVG return NULL (not 0).",
      "**NULL ordering:** In ORDER BY, NULLs sort differently across databases. PostgreSQL: NULLS LAST (default for ASC). MySQL: NULLs treated as smallest value.",
      "**Interview trap:** WHERE column != 'value' does NOT return rows where column IS NULL. You need: WHERE column != 'value' OR column IS NULL.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- Searched CASE: categorize salaries
SELECT name, salary,
    CASE
        WHEN salary >= 120000 THEN 'Executive'
        WHEN salary >= 90000  THEN 'Senior'
        WHEN salary >= 60000  THEN 'Mid-Level'
        ELSE 'Junior'
    END AS salary_tier
FROM employees;

-- Simple CASE: map status codes
SELECT order_id,
    CASE status
        WHEN 'P' THEN 'Pending'
        WHEN 'S' THEN 'Shipped'
        WHEN 'D' THEN 'Delivered'
        WHEN 'C' THEN 'Cancelled'
        ELSE 'Unknown'
    END AS status_label
FROM orders;

-- CASE in aggregate: conditional counting (pivot)
SELECT department,
    COUNT(CASE WHEN salary >= 90000 THEN 1 END) AS high_earners,
    COUNT(CASE WHEN salary < 90000 THEN 1 END) AS others
FROM employees
GROUP BY department;

-- COALESCE: default for NULLs
SELECT name, COALESCE(phone, email, 'No contact') AS contact_info
FROM customers;

-- NULLIF: avoid division by zero
SELECT department,
       total_revenue / NULLIF(total_orders, 0) AS avg_order_value
FROM department_stats;

-- NULL-safe comparison
SELECT * FROM employees WHERE manager_id IS NULL;  -- correct
-- SELECT * FROM employees WHERE manager_id = NULL;  -- WRONG! Returns nothing

-- COALESCE in calculations
SELECT name,
       COALESCE(bonus, 0) + COALESCE(commission, 0) AS total_extra_comp
FROM employees;` }],
    note: "**Golden rule:** Always handle NULLs explicitly. 'Unexpected NULLs' is the #1 cause of wrong query results in interviews."
  },

  // ─── STRING & DATE FUNCTIONS ───
  {
    id: "sql-functions",
    title: "String, Date & Numeric Functions",
    difficulty: "Easy",
    theory: [
      "**String functions** manipulate text data. Key functions: UPPER/LOWER (case conversion), TRIM/LTRIM/RTRIM (whitespace removal), SUBSTRING/SUBSTR (extract part), CONCAT/|| (concatenation), LENGTH/CHAR_LENGTH, REPLACE, REVERSE, LEFT/RIGHT.",
      "**Date functions** handle temporal data. Key functions: NOW/CURRENT_TIMESTAMP, CURRENT_DATE, DATE_ADD/DATE_SUB (MySQL) or interval arithmetic (PostgreSQL), EXTRACT (year, month, day from date), DATE_TRUNC (PostgreSQL), DATEDIFF, DATE_FORMAT (MySQL) / TO_CHAR (PostgreSQL).",
      "**Numeric functions:** ROUND, CEIL/CEILING, FLOOR, ABS, MOD/%, POWER, SQRT, RANDOM/RAND. CAST and :: (PostgreSQL) for type conversion.",
      "**Type conversion:** CAST(value AS type) is ANSI standard. PostgreSQL also supports value::type. Implicit casting happens in some contexts but explicit is safer.",
      "**Date arithmetic is crucial for interview queries** involving 'last 30 days', 'month-over-month growth', 'year-to-date' calculations.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- String functions
SELECT UPPER('hello') AS upper_case,                    -- HELLO
       LOWER('WORLD') AS lower_case,                    -- world
       TRIM('  hello  ') AS trimmed,                    -- 'hello'
       CONCAT(first_name, ' ', last_name) AS full_name, -- Alice Johnson
       LENGTH('hello') AS str_len,                      -- 5
       SUBSTRING('hello world', 7, 5) AS sub,           -- world
       REPLACE('hello', 'l', 'r') AS replaced,          -- herro
       REVERSE('hello') AS reversed;                    -- olleh

-- Date functions (PostgreSQL)
SELECT NOW() AS current_timestamp,
       CURRENT_DATE AS today,
       CURRENT_DATE - INTERVAL '30 days' AS thirty_days_ago,
       EXTRACT(YEAR FROM hire_date) AS hire_year,
       EXTRACT(MONTH FROM hire_date) AS hire_month,
       DATE_TRUNC('month', hire_date) AS month_start,
       AGE(CURRENT_DATE, hire_date) AS tenure
FROM employees;

-- Date arithmetic: employees hired in the last 90 days
SELECT name, hire_date
FROM employees
WHERE hire_date >= CURRENT_DATE - INTERVAL '90 days';

-- Month-over-month revenue
WITH monthly AS (
    SELECT DATE_TRUNC('month', order_date) AS month, SUM(total) AS revenue
    FROM orders GROUP BY 1
)
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month) AS prev_month,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / LAG(revenue) OVER (ORDER BY month), 2) AS growth_pct
FROM monthly;

-- Numeric functions
SELECT ROUND(3.14159, 2) AS rounded,     -- 3.14
       CEIL(3.2) AS ceiling,              -- 4
       FLOOR(3.8) AS floored,             -- 3
       ABS(-42) AS absolute,              -- 42
       MOD(17, 5) AS remainder;           -- 2

-- Type casting
SELECT CAST('2024-01-15' AS DATE);
SELECT '42'::INTEGER;  -- PostgreSQL shorthand` }],
    note: "**Interview pattern:** Date functions appear in almost every SQL round — 'find users who signed up in the last 7 days', 'calculate month-over-month growth', etc."
  },

  // ─── ADVANCED: PIVOT, UNPIVOT, LATERAL, JSON ───
  {
    id: "sql-advanced",
    title: "Advanced SQL — PIVOT, LATERAL, JSON & More",
    difficulty: "Expert",
    theory: [
      "**PIVOT** transforms rows into columns (crosstab). Standard SQL uses CASE + GROUP BY. SQL Server and Oracle have native PIVOT syntax. PostgreSQL uses the crosstab() function from the tablefunc extension.",
      "**UNPIVOT** transforms columns into rows — the reverse of PIVOT. Useful for normalizing denormalized data. Standard SQL uses UNION ALL or VALUES + LATERAL.",
      "**LATERAL JOIN** (PostgreSQL, MySQL 8+) allows a subquery in FROM to reference columns from preceding tables. Like a correlated subquery but more powerful — can return multiple rows/columns. Essential for 'top N per group' queries.",
      "**JSON support:** Modern databases (PostgreSQL, MySQL 5.7+) support JSON data types and operators. PostgreSQL has json and jsonb (binary, faster). Key operators: ->> (get text), -> (get JSON), @> (contains), #> (path lookup). Use for semi-structured data.",
      "**MERGE/UPSERT:** MERGE (SQL standard) performs INSERT, UPDATE, or DELETE in a single statement based on conditions. PostgreSQL uses INSERT ... ON CONFLICT (upsert). MySQL uses INSERT ... ON DUPLICATE KEY UPDATE.",
      "**Common Table Expression DELETE/UPDATE:** In PostgreSQL, CTEs can include data-modifying statements (INSERT, UPDATE, DELETE in CTEs), enabling complex multi-step operations in a single query.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- PIVOT using CASE + GROUP BY (works everywhere)
SELECT
    department,
    COUNT(CASE WHEN salary_tier = 'Junior' THEN 1 END) AS junior_count,
    COUNT(CASE WHEN salary_tier = 'Mid' THEN 1 END) AS mid_count,
    COUNT(CASE WHEN salary_tier = 'Senior' THEN 1 END) AS senior_count
FROM (
    SELECT department,
           CASE WHEN salary < 60000 THEN 'Junior'
                WHEN salary < 90000 THEN 'Mid'
                ELSE 'Senior' END AS salary_tier
    FROM employees
) categorized
GROUP BY department;

-- LATERAL JOIN: top 3 earners per department
SELECT d.department_name, top.name, top.salary
FROM departments d
CROSS JOIN LATERAL (
    SELECT e.name, e.salary
    FROM employees e
    WHERE e.department_id = d.id
    ORDER BY e.salary DESC
    LIMIT 3
) AS top;

-- UPSERT (PostgreSQL)
INSERT INTO products (sku, name, price, stock)
VALUES ('SKU-001', 'Widget', 29.99, 100)
ON CONFLICT (sku)
DO UPDATE SET price = EXCLUDED.price, stock = products.stock + EXCLUDED.stock;

-- JSON queries (PostgreSQL)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL
);

INSERT INTO events (data) VALUES
('{"type": "click", "page": "/home", "user_id": 42}'),
('{"type": "purchase", "amount": 99.99, "user_id": 42}');

-- Query JSON fields
SELECT data->>'type' AS event_type,
       data->>'user_id' AS user_id
FROM events
WHERE data->>'type' = 'purchase';

-- JSON containment (uses GIN index)
SELECT * FROM events WHERE data @> '{"type": "click"}';

-- Create GIN index for JSONB
CREATE INDEX idx_events_data ON events USING GIN (data);

-- MERGE statement (SQL Server / PostgreSQL 15+)
MERGE INTO target_table t
USING source_table s ON t.id = s.id
WHEN MATCHED THEN UPDATE SET t.value = s.value
WHEN NOT MATCHED THEN INSERT (id, value) VALUES (s.id, s.value)
WHEN NOT MATCHED BY SOURCE THEN DELETE;` }],
    note: "**LATERAL JOIN** is the most underused yet powerful SQL feature. It solves 'top N per group' problems elegantly — a favorite in advanced interviews."
  },

  // ─── INTERVIEW PATTERNS ───
  {
    id: "sql-interview-patterns",
    title: "Top SQL Interview Patterns & Problems",
    difficulty: "Hard",
    theory: [
      "This section covers the **most frequently asked SQL interview patterns** at top tech companies. These patterns appear repeatedly across FAANG, startups, and data engineering roles.",
      "**Pattern 1 — Second/Nth Highest:** Find the Nth highest salary. Solutions: DENSE_RANK, LIMIT+OFFSET, subquery with COUNT DISTINCT.",
      "**Pattern 2 — Consecutive Days/Streaks:** Find users active for N consecutive days. Key technique: ROW_NUMBER trick (date - ROW_NUMBER gives same value for consecutive dates).",
      "**Pattern 3 — Running Total/Cumulative Sum:** Use SUM() OVER (ORDER BY ...) for running aggregates.",
      "**Pattern 4 — Duplicate Detection:** Find duplicates using GROUP BY + HAVING COUNT(*) > 1 or window functions.",
      "**Pattern 5 — Top N per Group:** DENSE_RANK + PARTITION BY, or LATERAL JOIN.",
      "**Pattern 6 — Gap Analysis:** Find missing values in a sequence using self-join or window functions.",
      "**Pattern 7 — Year-over-Year/Month-over-Month:** LAG function with proper date grouping.",
      "**Pattern 8 — Median Calculation:** PERCENTILE_CONT(0.5) or manual calculation with ROW_NUMBER.",
    ],
    code: [{ title: "SQL Example", language: "sql", content: `-- Pattern 1: Second highest salary
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Better: Nth highest using DENSE_RANK
SELECT salary FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
) ranked WHERE rnk = 2;

-- Pattern 2: Find users with 3+ consecutive active days
WITH numbered AS (
    SELECT user_id, active_date,
           active_date - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY active_date)
               * INTERVAL '1 day' AS grp
    FROM user_activity
),
streaks AS (
    SELECT user_id, grp, COUNT(*) AS streak_length,
           MIN(active_date) AS streak_start, MAX(active_date) AS streak_end
    FROM numbered
    GROUP BY user_id, grp
)
SELECT * FROM streaks WHERE streak_length >= 3;

-- Pattern 3: Running total
SELECT order_date, amount,
       SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- Pattern 4: Find duplicate emails
SELECT email, COUNT(*) AS cnt
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Delete duplicates (keep one)
DELETE FROM users
WHERE id NOT IN (
    SELECT MIN(id) FROM users GROUP BY email
);

-- Pattern 5: Top 2 salaries per department
SELECT * FROM (
    SELECT name, department, salary,
           DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk
    FROM employees
) t WHERE rnk <= 2;

-- Pattern 6: Find gaps in a sequence
SELECT t1.id + 1 AS gap_start,
       MIN(t2.id) - 1 AS gap_end
FROM sequence_table t1
JOIN sequence_table t2 ON t2.id > t1.id
GROUP BY t1.id
HAVING t1.id + 1 < MIN(t2.id);

-- Pattern 7: Month-over-month growth
WITH monthly AS (
    SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS users
    FROM users GROUP BY 1
)
SELECT month, users,
       ROUND(100.0 * (users - LAG(users) OVER (ORDER BY month))
             / NULLIF(LAG(users) OVER (ORDER BY month), 0), 1) AS growth_pct
FROM monthly;

-- Pattern 8: Median salary (PostgreSQL)
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary
FROM employees;` }],
    note: "**Master these 8 patterns** and you can solve 90% of SQL interview questions. Practice writing them from memory."
  },
];
