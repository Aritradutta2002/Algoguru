import { ContentSection } from "./recursionContent";

export const javaJDBCContent: ContentSection[] = [
  {
    id: "jdbc-intro",
    title: "JDBC Architecture & Drivers",
    difficulty: "Easy",
    theory: [
      "**JDBC (Java Database Connectivity)** is the standard Java API for connecting to relational databases. It provides a uniform interface to interact with any database (MySQL, PostgreSQL, Oracle, SQLite) through a consistent set of classes and interfaces in `java.sql` and `javax.sql`.",
      "**JDBC Architecture:** Your Java application talks to the **JDBC API** (interfaces like Connection, Statement, ResultSet), which delegates to a **JDBC Driver** (database-specific implementation). The driver translates JDBC calls into the database's native protocol. This abstraction means switching databases requires only changing the driver — your code stays the same.",
      "**Four Types of JDBC Drivers:** Type 1 (JDBC-ODBC Bridge, deprecated), Type 2 (Native-API, requires native libraries), Type 3 (Network Protocol, middleware-based), **Type 4 (Thin/Pure Java)** — the modern standard. Type 4 drivers communicate directly with the database via its network protocol, are platform-independent, and require no native libraries.",
      "**Key JDBC Interfaces:** `DriverManager` — manages drivers and creates connections. `Connection` — represents a database session. `Statement` — executes static SQL. `PreparedStatement` — executes parameterized SQL (prevents SQL injection). `CallableStatement` — calls stored procedures. `ResultSet` — holds query results as a scrollable cursor.",
      "**JDBC Workflow:** (1) Load driver class, (2) Establish connection via `DriverManager.getConnection(url, user, pass)`, (3) Create Statement or PreparedStatement, (4) Execute query (SELECT → `executeQuery()`, INSERT/UPDATE/DELETE → `executeUpdate()`), (5) Process ResultSet, (6) Close resources (use try-with-resources).",
      "**Connection URL Format:** `jdbc:mysql://host:port/database`, `jdbc:postgresql://host:port/database`, `jdbc:sqlite:filename.db`. The URL tells the DriverManager which driver to use and where the database is located."
    ],
    diagram: {
      type: "flow",
      title: "JDBC Architecture — Request Flow",
      direction: "horizontal",
      data: [
        { label: "Java Application", color: "primary" },
        { label: "JDBC API (java.sql)", color: "info" },
        { label: "JDBC Driver (Type 4)", color: "accent" },
        { label: "Database (MySQL/PostgreSQL)", color: "success" }
      ]
    },
    code: [
      {
        title: "Basic JDBC Connection & Query",
        language: "java",
        content: `import java.sql.*;

public class JDBCBasics {
    public static void main(String[] args) {
        // Connection URL format: jdbc:dbtype://host:port/database
        String url = "jdbc:mysql://localhost:3306/mydb";
        String user = "root";
        String password = "password";

        // Try-with-resources ensures auto-closing
        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            System.out.println("Connected to database!");
            System.out.println("DB: " + conn.getMetaData().getDatabaseProductName());
            System.out.println("Version: " + conn.getMetaData().getDatabaseProductVersion());
        } catch (SQLException e) {
            System.err.println("Connection failed: " + e.getMessage());
            System.err.println("SQL State: " + e.getSQLState());
            System.err.println("Error Code: " + e.getErrorCode());
        }
    }
}`
      }
    ],
    note: "Modern JDBC drivers (Type 4) auto-register via `META-INF/services` — you no longer need `Class.forName(\"com.mysql.cj.jdbc.Driver\")`."
  },
  {
    id: "jdbc-crud",
    title: "CRUD Operations with JDBC",
    difficulty: "Medium",
    theory: [
      "**CRUD** stands for Create (INSERT), Read (SELECT), Update (UPDATE), Delete (DELETE) — the four fundamental database operations. JDBC provides two ways to execute SQL:",
      "**Statement** — for static SQL without parameters. Simple but vulnerable to **SQL injection** attacks. Use only for DDL commands (CREATE TABLE, ALTER TABLE) or when there are absolutely no user inputs.",
      "**PreparedStatement** — for parameterized SQL with `?` placeholders. **Always use this for user inputs.** Benefits: (1) Prevents SQL injection (parameters are escaped automatically), (2) Better performance (database can cache the execution plan), (3) Cleaner code (no string concatenation).",
      "**executeQuery()** — for SELECT statements, returns a `ResultSet`. **executeUpdate()** — for INSERT, UPDATE, DELETE, returns the number of affected rows. **execute()** — for any SQL, returns boolean (true if ResultSet, false if update count).",
      "**ResultSet** is a cursor that iterates over query results row by row. Call `next()` to advance — returns false when no more rows. Access columns by name (`getString(\"name\")`) or index (`getInt(1)` — 1-based). ResultSet is **not** a collection — it's connected to the database and should be closed promptly.",
      "**Batch Operations:** For inserting/updating many rows, use `addBatch()` and `executeBatch()` instead of individual `executeUpdate()` calls. Batch processing reduces network round-trips and can be 10-100x faster for large datasets."
    ],
    code: [
      {
        title: "Full CRUD with PreparedStatement",
        language: "java",
        content: `import java.sql.*;

public class CRUDDemo {
    static final String URL = "jdbc:mysql://localhost:3306/school";
    static final String USER = "root", PASS = "password";

    public static void main(String[] args) throws SQLException {
        try (Connection conn = DriverManager.getConnection(URL, USER, PASS)) {

            // ── CREATE TABLE ──
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("""
                    CREATE TABLE IF NOT EXISTS students (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        age INT,
                        gpa DOUBLE
                    )""");
            }

            // ── INSERT (Create) ──
            String insertSQL = "INSERT INTO students (name, age, gpa) VALUES (?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(insertSQL,
                    Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, "Alice");
                ps.setInt(2, 20);
                ps.setDouble(3, 3.8);
                ps.executeUpdate();

                // Get auto-generated ID
                ResultSet keys = ps.getGeneratedKeys();
                if (keys.next()) {
                    System.out.println("Inserted ID: " + keys.getInt(1));
                }
            }

            // ── SELECT (Read) ──
            String selectSQL = "SELECT * FROM students WHERE gpa >= ?";
            try (PreparedStatement ps = conn.prepareStatement(selectSQL)) {
                ps.setDouble(1, 3.0);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        System.out.printf("ID: %d, Name: %s, Age: %d, GPA: %.1f%n",
                            rs.getInt("id"),
                            rs.getString("name"),
                            rs.getInt("age"),
                            rs.getDouble("gpa"));
                    }
                }
            }

            // ── UPDATE ──
            String updateSQL = "UPDATE students SET gpa = ? WHERE name = ?";
            try (PreparedStatement ps = conn.prepareStatement(updateSQL)) {
                ps.setDouble(1, 3.9);
                ps.setString(2, "Alice");
                int rows = ps.executeUpdate();
                System.out.println("Updated " + rows + " row(s)");
            }

            // ── DELETE ──
            String deleteSQL = "DELETE FROM students WHERE age < ?";
            try (PreparedStatement ps = conn.prepareStatement(deleteSQL)) {
                ps.setInt(1, 18);
                int rows = ps.executeUpdate();
                System.out.println("Deleted " + rows + " row(s)");
            }
        }
    }
}`
      },
      {
        title: "Batch Insert — High Performance",
        language: "java",
        content: `import java.sql.*;

public class BatchInsert {
    public static void main(String[] args) throws SQLException {
        String url = "jdbc:mysql://localhost:3306/school";
        try (Connection conn = DriverManager.getConnection(url, "root", "pass")) {
            conn.setAutoCommit(false); // important for batch performance

            String sql = "INSERT INTO students (name, age, gpa) VALUES (?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                String[] names = {"Bob", "Charlie", "Dave", "Eve", "Frank"};
                for (int i = 0; i < names.length; i++) {
                    ps.setString(1, names[i]);
                    ps.setInt(2, 18 + i);
                    ps.setDouble(3, 3.0 + (i * 0.2));
                    ps.addBatch();

                    // Execute batch every 1000 rows (memory management)
                    if ((i + 1) % 1000 == 0) ps.executeBatch();
                }
                ps.executeBatch(); // remaining rows
                conn.commit();
                System.out.println("Batch insert complete!");
            } catch (SQLException e) {
                conn.rollback(); // undo everything on error
                throw e;
            }
        }
    }
}`
      }
    ],
    warning: "**NEVER** concatenate user input into SQL strings: `\"SELECT * FROM users WHERE name = '\" + userInput + \"'\"` is vulnerable to SQL injection. **ALWAYS** use PreparedStatement with `?` placeholders."
  },
  {
    id: "jdbc-transactions",
    title: "Transactions & Error Handling",
    difficulty: "Medium",
    theory: [
      "A **transaction** is a group of SQL operations that must execute as an **atomic unit** — either ALL succeed or ALL are rolled back. Transactions ensure data integrity in scenarios like bank transfers (debit + credit must both succeed).",
      "**ACID Properties:** **Atomicity** — all-or-nothing execution. **Consistency** — database moves from one valid state to another. **Isolation** — concurrent transactions don't interfere. **Durability** — committed changes survive crashes.",
      "**JDBC Transaction Control:** By default, JDBC uses **auto-commit** mode — each SQL statement is a separate transaction. For multi-statement transactions: (1) `conn.setAutoCommit(false)`, (2) Execute multiple statements, (3) `conn.commit()` on success, (4) `conn.rollback()` on error.",
      "**Savepoints:** Allow partial rollbacks within a transaction. `Savepoint sp = conn.setSavepoint(\"after_insert\")` → if something fails later, `conn.rollback(sp)` undoes only the work after the savepoint, preserving earlier work.",
      "**Transaction Isolation Levels:** Control how concurrent transactions interact. `READ_UNCOMMITTED` (dirty reads possible), `READ_COMMITTED` (default for most DBs), `REPEATABLE_READ`, `SERIALIZABLE` (strictest, slowest). Set via `conn.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED)`.",
      "**SQLException Handling:** Always catch `SQLException`, which provides: `getMessage()` (error description), `getSQLState()` (standard error code), `getErrorCode()` (vendor-specific code), and `getNextException()` (chained exceptions). Use these for meaningful error logging and recovery."
    ],
    code: [
      {
        title: "Transaction — Bank Transfer Example",
        language: "java",
        content: `import java.sql.*;

public class TransactionDemo {
    public static void transfer(Connection conn, int fromId, int toId, double amount)
            throws SQLException {
        // Disable auto-commit for transaction
        conn.setAutoCommit(false);
        Savepoint beforeTransfer = conn.setSavepoint("before_transfer");

        try {
            // 1. Check balance
            PreparedStatement checkPS = conn.prepareStatement(
                "SELECT balance FROM accounts WHERE id = ?");
            checkPS.setInt(1, fromId);
            ResultSet rs = checkPS.executeQuery();
            if (!rs.next()) throw new SQLException("Account not found: " + fromId);
            double balance = rs.getDouble("balance");
            if (balance < amount) throw new SQLException("Insufficient funds");

            // 2. Debit sender
            PreparedStatement debitPS = conn.prepareStatement(
                "UPDATE accounts SET balance = balance - ? WHERE id = ?");
            debitPS.setDouble(1, amount);
            debitPS.setInt(2, fromId);
            debitPS.executeUpdate();

            // 3. Credit receiver
            PreparedStatement creditPS = conn.prepareStatement(
                "UPDATE accounts SET balance = balance + ? WHERE id = ?");
            creditPS.setDouble(1, amount);
            creditPS.setInt(2, toId);
            int rows = creditPS.executeUpdate();
            if (rows == 0) throw new SQLException("Receiver not found: " + toId);

            // 4. Log transaction
            PreparedStatement logPS = conn.prepareStatement(
                "INSERT INTO transactions (from_id, to_id, amount) VALUES (?, ?, ?)");
            logPS.setInt(1, fromId);
            logPS.setInt(2, toId);
            logPS.setDouble(3, amount);
            logPS.executeUpdate();

            // All succeeded — commit
            conn.commit();
            System.out.printf("Transferred $%.2f from %d to %d%n", amount, fromId, toId);

        } catch (SQLException e) {
            // Something failed — rollback everything
            conn.rollback(beforeTransfer);
            System.err.println("Transfer failed, rolled back: " + e.getMessage());
            throw e;
        } finally {
            conn.setAutoCommit(true); // restore default
        }
    }
}`
      }
    ],
    tip: "Always put `conn.rollback()` in the catch block and `conn.setAutoCommit(true)` in finally. Use try-with-resources for all JDBC objects."
  },
  {
    id: "jdbc-dao",
    title: "DAO Pattern & Best Practices",
    difficulty: "Hard",
    theory: [
      "The **DAO (Data Access Object) Pattern** separates database access logic from business logic. Each entity (User, Product, Order) gets its own DAO class that handles all CRUD operations. This follows the **Single Responsibility Principle** — your service classes don't deal with SQL.",
      "**DAO Structure:** (1) **Model/Entity class** — plain Java object representing a database row (e.g., `Student` with fields matching columns). (2) **DAO interface** — defines the contract (`findById`, `findAll`, `save`, `update`, `delete`). (3) **DAO implementation** — implements the interface with actual JDBC code.",
      "**Connection Pooling:** Creating a new database connection for every request is extremely expensive (~200-500ms). **Connection pools** (HikariCP, Apache DBCP, C3P0) maintain a pool of pre-created connections that are borrowed and returned. **HikariCP** is the fastest and default in Spring Boot. Typical pool size: 10-20 connections.",
      "**ResultSet Mapping:** Manually mapping ResultSet columns to Java objects is tedious and error-prone. The DAO pattern centralizes this mapping in one place. For production applications, consider ORM frameworks like **Hibernate/JPA** that automate this entirely.",
      "**Best Practices:** Always use **PreparedStatement** (never Statement with user input). Always use **try-with-resources** to close connections, statements, and result sets. Use **connection pooling** in production. Keep SQL strings as **constants**. Implement the DAO as an **interface** for testability (mock the DAO in unit tests). Handle **SQLExceptions** meaningfully — don't just print stack traces.",
      "**JDBC vs ORM (Hibernate/JPA):** JDBC gives full SQL control, better for complex queries and CP database problems. ORM abstracts SQL away, faster development for standard CRUD, but can generate inefficient queries. Many teams use both — ORM for simple CRUD, native SQL (via JDBC or JPA native queries) for complex operations."
    ],
    code: [
      {
        title: "Complete DAO Pattern Implementation",
        language: "java",
        content: `import java.sql.*;
import java.util.*;

// ── 1. Model (Entity) ──
class Student {
    private int id;
    private String name;
    private int age;
    private double gpa;

    public Student() {}
    public Student(String name, int age, double gpa) {
        this.name = name; this.age = age; this.gpa = gpa;
    }

    // Getters & setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public double getGpa() { return gpa; }
    public void setGpa(double gpa) { this.gpa = gpa; }

    @Override
    public String toString() {
        return String.format("Student{id=%d, name='%s', age=%d, gpa=%.1f}", id, name, age, gpa);
    }
}

// ── 2. DAO Interface ──
interface StudentDAO {
    Optional<Student> findById(int id);
    List<Student> findAll();
    List<Student> findByMinGpa(double minGpa);
    int save(Student student);       // returns generated ID
    boolean update(Student student);
    boolean delete(int id);
}

// ── 3. DAO Implementation ──
class StudentDAOImpl implements StudentDAO {
    private final Connection conn;

    // SQL constants
    private static final String FIND_BY_ID = "SELECT * FROM students WHERE id = ?";
    private static final String FIND_ALL = "SELECT * FROM students ORDER BY name";
    private static final String FIND_BY_GPA = "SELECT * FROM students WHERE gpa >= ?";
    private static final String INSERT = "INSERT INTO students (name, age, gpa) VALUES (?, ?, ?)";
    private static final String UPDATE = "UPDATE students SET name=?, age=?, gpa=? WHERE id=?";
    private static final String DELETE = "DELETE FROM students WHERE id = ?";

    StudentDAOImpl(Connection conn) { this.conn = conn; }

    // Helper: map ResultSet row to Student object
    private Student mapRow(ResultSet rs) throws SQLException {
        Student s = new Student();
        s.setId(rs.getInt("id"));
        s.setName(rs.getString("name"));
        s.setAge(rs.getInt("age"));
        s.setGpa(rs.getDouble("gpa"));
        return s;
    }

    @Override
    public Optional<Student> findById(int id) {
        try (PreparedStatement ps = conn.prepareStatement(FIND_BY_ID)) {
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            return rs.next() ? Optional.of(mapRow(rs)) : Optional.empty();
        } catch (SQLException e) { throw new RuntimeException(e); }
    }

    @Override
    public List<Student> findAll() {
        List<Student> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(FIND_ALL);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) { throw new RuntimeException(e); }
        return list;
    }

    @Override
    public int save(Student s) {
        try (PreparedStatement ps = conn.prepareStatement(INSERT,
                Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, s.getName());
            ps.setInt(2, s.getAge());
            ps.setDouble(3, s.getGpa());
            ps.executeUpdate();
            ResultSet keys = ps.getGeneratedKeys();
            return keys.next() ? keys.getInt(1) : -1;
        } catch (SQLException e) { throw new RuntimeException(e); }
    }

    // ... update() and delete() follow the same pattern
    @Override public List<Student> findByMinGpa(double minGpa) { return List.of(); }
    @Override public boolean update(Student s) { return false; }
    @Override public boolean delete(int id) { return false; }
}

// ── 4. Usage ──
// StudentDAO dao = new StudentDAOImpl(connection);
// int id = dao.save(new Student("Alice", 20, 3.8));
// Optional<Student> found = dao.findById(id);
// List<Student> all = dao.findAll();`
      }
    ],
    tip: "In production, use **HikariCP** for connection pooling and consider **Spring JDBC Template** or **JPA/Hibernate** to eliminate boilerplate JDBC code."
  },
  {
    id: "jdbc-advanced",
    title: "Advanced JDBC — Metadata & Pooling",
    difficulty: "Hard",
    theory: [
      "**DatabaseMetaData** provides information about the database itself — version, supported features, table structure. Access via `conn.getMetaData()`. Useful for building generic database tools, migration scripts, or admin panels.",
      "**ResultSetMetaData** provides information about query results — column count, names, types, nullable status. Access via `rs.getMetaData()`. Essential for building dynamic query tools or ORM-like frameworks.",
      "**Connection Pooling with HikariCP:** HikariCP is the fastest Java connection pool (used by Spring Boot by default). Configuration: `maximumPoolSize` (default 10), `minimumIdle`, `connectionTimeout` (30s default), `idleTimeout` (10min), `maxLifetime` (30min). Formula for pool size: `connections = ((CPU cores × 2) + disk spindles)` — typically 10-20 for most applications.",
      "**Scrollable & Updatable ResultSets:** Default ResultSets are forward-only and read-only. Create scrollable (`TYPE_SCROLL_INSENSITIVE`) and updatable (`CONCUR_UPDATABLE`) ResultSets to navigate freely (`absolute()`, `relative()`, `previous()`) and modify data directly.",
      "**RowSet Interface:** A disconnected, serializable alternative to ResultSet. `CachedRowSet` loads all data into memory and disconnects — useful for transferring data across layers. `JdbcRowSet` is a connected, JavaBean-style wrapper around ResultSet.",
      "**JDBC in the Modern Ecosystem:** While raw JDBC is still used for complex queries and low-level control, most production apps use higher-level abstractions: **Spring JDBC Template** (eliminates boilerplate), **MyBatis** (SQL mapping), **Hibernate/JPA** (full ORM). Understanding JDBC is essential because all these frameworks are built on top of it."
    ],
    code: [
      {
        title: "Database & ResultSet Metadata",
        language: "java",
        content: `import java.sql.*;

public class MetaDataDemo {
    public static void main(String[] args) throws SQLException {
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/mydb", "root", "pass")) {

            // ── Database Metadata ──
            DatabaseMetaData dbMeta = conn.getMetaData();
            System.out.println("DB: " + dbMeta.getDatabaseProductName());
            System.out.println("Version: " + dbMeta.getDatabaseProductVersion());
            System.out.println("Driver: " + dbMeta.getDriverName());
            System.out.println("Max connections: " + dbMeta.getMaxConnections());

            // List all tables
            ResultSet tables = dbMeta.getTables(null, null, "%", 
                new String[]{"TABLE"});
            while (tables.next()) {
                System.out.println("Table: " + tables.getString("TABLE_NAME"));
            }

            // ── ResultSet Metadata ──
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM students LIMIT 1");
            ResultSetMetaData rsMeta = rs.getMetaData();

            int colCount = rsMeta.getColumnCount();
            for (int i = 1; i <= colCount; i++) {
                System.out.printf("Column %d: %s (%s, nullable=%s)%n",
                    i,
                    rsMeta.getColumnName(i),
                    rsMeta.getColumnTypeName(i),
                    rsMeta.isNullable(i) == ResultSetMetaData.columnNullable
                );
            }
        }
    }
}`
      },
      {
        title: "HikariCP Connection Pool Setup",
        language: "java",
        content: `import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.sql.*;

public class ConnectionPoolDemo {
    private static HikariDataSource dataSource;

    static {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:mysql://localhost:3306/mydb");
        config.setUsername("root");
        config.setPassword("password");

        // Pool configuration
        config.setMaximumPoolSize(10);       // max connections
        config.setMinimumIdle(5);            // min idle connections
        config.setConnectionTimeout(30000);  // 30s wait for connection
        config.setIdleTimeout(600000);       // 10min idle before removal
        config.setMaxLifetime(1800000);      // 30min max connection lifetime

        // Performance optimizations
        config.addDataSourceProperty("cachePrepStmts", "true");
        config.addDataSourceProperty("prepStmtCacheSize", "250");
        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

        dataSource = new HikariDataSource(config);
    }

    // Get connection from pool (fast — ~1ms vs ~200ms for new connection)
    public static Connection getConnection() throws SQLException {
        return dataSource.getConnection(); // borrows from pool
    }
    // Connection.close() returns it to the pool (not actually closed)

    public static void main(String[] args) throws SQLException {
        // Each request borrows a connection
        try (Connection conn = getConnection()) {
            PreparedStatement ps = conn.prepareStatement(
                "SELECT COUNT(*) FROM students");
            ResultSet rs = ps.executeQuery();
            if (rs.next()) System.out.println("Students: " + rs.getInt(1));
        } // connection returned to pool here

        // Pool stats
        System.out.println("Active: " + dataSource.getHikariPoolMXBean()
            .getActiveConnections());
        System.out.println("Idle: " + dataSource.getHikariPoolMXBean()
            .getIdleConnections());
    }
}`
      }
    ],
    note: "**HikariCP** is the industry standard for Java connection pooling — it's the default in Spring Boot and is significantly faster than alternatives like C3P0 or DBCP."
  }
];
