import { ContentSection } from "./recursionContent";
import { attachDiagrams } from "./diagramAttach";
import { springDataJpaVisualizations } from "./springDataJpaVisualizations";

/* -------------------------------------------------------------------------- */
/*  Spring Data JPA — Complete In-Depth Theory                                */
/*  Covers Entities, Relationships, Repositories, Derived Queries, JPQL,      */
/*  Pagination, Transactions, N+1 Problem, Migrations (Flyway), and Auditing. */
/*  Written against Spring Boot 3.x / Hibernate 6.x / Java 17+.               */
/* -------------------------------------------------------------------------- */

const springDataJpaRaw: ContentSection[] = [
  {
    id: "jpa-intro",
    title: "JPA & Hibernate Overview",
    difficulty: "Easy",
    theory: [
      "To build robust persistence layers, it is critical to distinguish between **JPA (Jakarta Persistence API)**, **Hibernate ORM**, and **Spring Data JPA**.",
      "1. **JPA**: A specification (set of interfaces and rules) originally defined under Java EE and now managed under **Jakarta EE (`jakarta.persistence.*`)**. It provides standard annotations (`@Entity`, `@Table`, `@Id`) and interfaces (`EntityManager`, `EntityTransaction`), but contains **zero operational implementation code**.",
      "2. **Hibernate**: The most popular, enterprise-grade **ORM (Object-Relational Mapping)** implementation of the JPA specification. Hibernate implements JPA's interfaces, handles SQL generation across different database dialects, manages the first-level persistence cache, and provides proprietary extensions (such as Envers and Spatial).",
      "3. **Spring Data JPA**: A high-level abstraction layer that sits on top of JPA/Hibernate. It reduces data access boilerplate by dynamically generating repository implementations at runtime based on interface definitions (`JpaRepository`), derived query methods, and pagination support.",
      "The core architectural concept in JPA is the **Persistence Context** (managed by `EntityManager`). When an entity is loaded inside a transaction, it is in a **Managed state**. Hibernate tracks all modifications to managed entities via **Dirty Checking** and automatically flushes SQL updates to the database when the transaction commits."
    ],
    keyPoints: [
      "JPA is the specification (`jakarta.persistence.*`); Hibernate is the ORM implementation.",
      "Spring Data JPA sits on top of Hibernate, eliminating boilerplate DAO code via `JpaRepository`.",
      "The `EntityManager` manages the Persistence Context (First-Level Cache).",
      "Dirty checking automatically generates SQL UPDATEs for modified managed entities upon commit."
    ],
    diagram: {
      type: "layers",
      title: "Spring Data JPA Architecture Stack",
      data: [
        {
          label: "Application Layer",
          color: "primary",
          children: [
            { label: "UserRepository extends JpaRepository<User, Long>" },
            { label: "Service Layer with @Transactional" }
          ]
        },
        {
          label: "Spring Data JPA Abstraction",
          color: "accent",
          children: [
            { label: "Dynamic Proxy Repository Implementations" },
            { label: "Derived Query Execution, Pageable & Sort" }
          ]
        },
        {
          label: "JPA Provider (Hibernate 6.x)",
          color: "info",
          children: [
            { label: "EntityManager, Session, Persistence Context (L1 Cache)" },
            { label: "Dirty Checking, SQL Dialect Generation" }
          ]
        },
        {
          label: "JDBC & Database Connection Pool",
          color: "success",
          children: [
            { label: "HikariCP DataSource -> JDBC Driver -> PostgreSQL / MySQL" }
          ]
        }
      ]
    },
    code: [
      {
        title: "Starter Dependency for Spring Data JPA",
        language: "xml",
        content: `<!-- In pom.xml: Pulls JPA, Hibernate 6, HikariCP, and Spring TX -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- Database Driver -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>`
      }
    ],
    note: "In Spring Boot 3.x, Hibernate 6.x is the default ORM engine. Package imports must use `jakarta.persistence.*`, not legacy `javax.persistence.*`."
  },
  {
    id: "jpa-entity-mapping",
    title: "Entity Mapping (@Entity, @Id, @GeneratedValue)",
    difficulty: "Easy",
    theory: [
      "In JPA, an **Entity** is a lightweight, persistent domain object that maps directly to a relational database table row. Entities are defined using annotations from `jakarta.persistence`.",
      "Core Mapping Annotations:",
      "- **`@Entity`**: Declares that a class is a JPA entity. The class must have a no-arg constructor (can be `protected`), cannot be `final`, and cannot have `final` persistent fields.",
      "- **`@Table(name = \"users\")`**: Specifies the primary database table. If omitted, JPA defaults the table name to the class name.",
      "- **`@Id`**: Designates the primary key field of the entity.",
      "- **`@GeneratedValue`**: Configures the primary key generation strategy:",
      "  1. `GenerationType.IDENTITY`: Relies on an auto-increment database column (e.g. MySQL `AUTO_INCREMENT`, PostgreSQL `SERIAL`). **Disables JDBC batch inserts** because Hibernate must execute immediate SQL INSERTs to obtain the generated ID.",
      "  2. `GenerationType.SEQUENCE`: Relies on a database sequence object (standard in PostgreSQL and Oracle). Highly recommended because Hibernate can pre-allocate IDs in batches using `allocationSize` without executing immediate inserts.",
      "  3. `GenerationType.TABLE`: Uses a separate helper table to store IDs (slow, rarely used).",
      "  4. `GenerationType.AUTO`: Allows Hibernate to pick the strategy based on the database dialect."
    ],
    keyPoints: [
      "Every entity requires `@Entity` and an `@Id` primary key.",
      "`@Table(name = \"...\")` maps class to relational table.",
      "`GenerationType.IDENTITY` prevents JDBC batching; `GenerationType.SEQUENCE` supports batching.",
      "Entities require a no-args constructor (can be `protected`)."
    ],
    code: [
      {
        title: "Entity Definition with Sequence-Based ID Generation",
        language: "java",
        content: `package com.algoguru.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "students", indexes = {
    @Index(name = "idx_student_email", columnList = "email", unique = true)
})
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "student_seq_gen")
    @SequenceGenerator(name = "student_seq_gen", sequenceName = "student_seq", allocationSize = 50)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "enrolled_at", updatable = false)
    private Instant enrolledAt = Instant.now();

    // Required by JPA
    protected Student() {}

    public Student(String fullName, String email) {
        this.fullName = fullName;
        this.email = email;
    }

    // Getters and setters...
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
}`
      }
    ],
    warning: "Never use Java Records as JPA entities. JPA requires entities to be mutable and proxyable with no-arg constructors, whereas Records are final and immutable."
  },
  {
    id: "jpa-column-mapping",
    title: "Column Mapping & Lifecycle Annotations",
    difficulty: "Medium",
    theory: [
      "JPA provides rich field-level annotations to customize how Java attributes translate to SQL columns, data types, and lifecycle hooks.",
      "**Column Mapping Annotations**:",
      "- **`@Column`**: Configures column name (`name`), nullability (`nullable = false`), length (`length = 255`), uniqueness (`unique = true`), and mutability (`insertable = false`, `updatable = false`).",
      "- **`@Enumerated`**: Maps Java enums. Always use `EnumType.STRING` (e.g. `@Enumerated(EnumType.STRING)`). Never use `EnumType.ORDINAL` because adding or reordering enum constants silently corrupts database rows.",
      "- **`@Transient`**: Informs JPA that a field is not persistent and should not be stored in the database.",
      "- **`@Lob`**: Maps Large Objects (CLOB for long text, BLOB for binary data).",
      "**Entity Lifecycle Callbacks**:",
      "JPA allows intercepting entity lifecycle transitions directly within the entity class without separate listeners:",
      "- `@PrePersist`: Executed immediately before the entity is first persisted (`INSERT`). Ideal for setting `createdAt` timestamps.",
      "- `@PreUpdate`: Executed before an existing entity is updated (`UPDATE`). Ideal for `updatedAt` timestamps.",
      "- `@PreRemove`, `@PostPersist`, `@PostUpdate`, `@PostRemove`, `@PostLoad`."
    ],
    keyPoints: [
      "Always use `@Enumerated(EnumType.STRING)` for enum fields.",
      "`@Transient` ignores non-database calculation fields.",
      "`@PrePersist` and `@PreUpdate` handle automated timestamp population.",
      "`insertable = false, updatable = false` is useful for read-only database-generated columns."
    ],
    code: [
      {
        title: "Enum Mapping and PrePersist / PreUpdate Lifecycle Callbacks",
        language: "java",
        content: `package com.algoguru.entity;

import jakarta.persistence.*;
import java.time.Instant;

public enum Role { STUDENT, INSTRUCTOR, ADMIN }

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING) // CRITICAL: Never use ORDINAL!
    @Column(nullable = false)
    private Role role = Role.STUDENT;

    @Transient // Not saved in database
    private String temporaryAuthToken;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onPrePersist() {
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    protected void onPreUpdate() {
        this.updatedAt = Instant.now();
    }
}`
      }
    ],
    tip: "For enterprise auditing across all entities, use Spring Data JPA Auditing (`@EntityListeners(AuditingEntityListener.class)`) instead of manual `@PrePersist` methods."
  },
  {
    id: "jpa-relationships",
    title: "Relationships — @OneToOne, @OneToMany, @ManyToOne, @ManyToMany",
    difficulty: "Hard",
    theory: [
      "Relational databases represent associations using Foreign Keys. JPA translates these associations into object references using four relationship annotations.",
      "**1. `@ManyToOne` / `@OneToMany` (Most Common)**:",
      "Represents parent-child relationships (e.g., Department has Many Employees).",
      "- The **Owning Side** contains the actual Foreign Key column and is annotated with `@ManyToOne` and `@JoinColumn(name = \"department_id\")`.",
      "- The **Inverse Side** is annotated with `@OneToMany(mappedBy = \"department\")`. The `mappedBy` attribute tells Hibernate: 'The Foreign Key is owned by the `department` field in the child class; do not create a separate join table.'",
      "**2. `@OneToOne`**:",
      "One entity corresponds to exactly one other entity (e.g., User has one UserProfile). The owning side declares `@JoinColumn(name = \"profile_id\", unique = true)`.",
      "**3. `@ManyToMany`**:",
      "Represents many-to-many associations (e.g., Students and Courses). Handled via a join table defined with `@JoinTable(name = \"student_courses\", joinColumns = @JoinColumn(...), inverseJoinColumns = @JoinColumn(...))`.",
      "In bidirectional associations, always provide **helper synchronization methods** (`addChild()`, `removeChild()`) to keep both sides of the Java object graph in sync in memory."
    ],
    keyPoints: [
      "The Owning side owns the Foreign Key and defines `@JoinColumn`.",
      "The Inverse side defines `mappedBy = \"fieldNameOnOwningSide\"`.",
      "Omission of `mappedBy` on `@OneToMany` causes Hibernate to create an unwanted join table!",
      "Always maintain bidirectional memory references using helper methods."
    ],
    code: [
      {
        title: "Bidirectional One-to-Many Relationship with Helper Methods",
        language: "java",
        content: `package com.algoguru.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "departments")
public class Department {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    // Inverse side: mappedBy references the 'department' field in Employee
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Employee> employees = new ArrayList<>();

    // Helper synchronization methods:
    public void addEmployee(Employee emp) {
        employees.add(emp);
        emp.setDepartment(this); // Sync child's foreign key
    }

    public void removeEmployee(Employee emp) {
        employees.remove(emp);
        emp.setDepartment(null);
    }
}

@Entity
@Table(name = "employees")
class Employee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    // Owning side: contains foreign key column department_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    public void setDepartment(Department dept) { this.department = dept; }
}`
      }
    ],
    warning: "Never use `java.util.Set` with `CascadeType.ALL` without properly overriding `equals()` and `hashCode()` based on business keys (not database IDs, which are null prior to persist)."
  },
  {
    id: "jpa-cascade",
    title: "Cascade Types",
    difficulty: "Medium",
    theory: [
      "In JPA, operations performed on a parent entity (such as saving, updating, or deleting) can automatically cascade to associated child entities via **Cascade Types**.",
      "Configured using the `cascade` attribute on relationship annotations (e.g. `@OneToMany(cascade = CascadeType.ALL)`).",
      "Available `jakarta.persistence.CascadeType` options:",
      "1. **`CascadeType.PERSIST`**: Saving a new parent automatically saves newly attached child entities (`entityManager.persist(parent)` triggers `persist` on children).",
      "2. **`CascadeType.MERGE`**: Updating a detached parent entity cascades to children.",
      "3. **`CascadeType.REMOVE`**: Deleting the parent automatically issues SQL `DELETE` statements for all associated children.",
      "4. **`CascadeType.REFRESH`**: Reloading the parent from the database refreshes children.",
      "5. **`CascadeType.DETACH`**: Detaching parent detaches children from the persistence context.",
      "6. **`CascadeType.ALL`**: Applies all of the above cascades.",
      "**`orphanRemoval = true` vs `CascadeType.REMOVE`**:",
      "- `CascadeType.REMOVE` only deletes children when the parent itself is explicitly deleted.",
      "- `orphanRemoval = true` deletes a child entity from the database if it is simply **removed from the parent's collection** (`parent.getChildren().remove(child)`)."
    ],
    keyPoints: [
      "Cascading propagates entity lifecycle transitions from parent to children.",
      "`CascadeType.ALL` is standard for strict parent-child aggregate roots (e.g., Order -> OrderItems).",
      "`orphanRemoval = true` deletes children removed from parent collections.",
      "Never use `CascadeType.REMOVE` on `@ManyToOne` or `@ManyToMany` associations (it would delete shared records!)."
    ],
    code: [
      {
        title: "CascadeType.ALL and orphanRemoval in an Order-OrderItem Aggregate",
        language: "java",
        content: `package com.algoguru.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Saving, updating, or deleting an Order automatically cascades to all OrderItems.
    // Removing an item from the list deletes it from the database!
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }
}`
      }
    ],
    warning: "Using `CascadeType.ALL` or `CascadeType.REMOVE` on `@ManyToMany` relationships will cause catastrophic data loss by deleting associated entities shared by other records."
  },
  {
    id: "jpa-fetch",
    title: "Fetch Types — LAZY vs EAGER",
    difficulty: "Hard",
    theory: [
      "The `fetch` attribute determines **when** associated entities are loaded from the database into memory.",
      "**1. `FetchType.EAGER`**:",
      "The associated entities are loaded immediately along with the parent entity using an SQL `JOIN` or immediate secondary queries.",
      "JPA defaults to `EAGER` for single-valued relationships (`@ManyToOne` and `@OneToOne`).",
      "**Dangerous Anti-Pattern**: Eager loading causes catastrophic performance degradation. Loading 100 orders with Eager-fetched Customer, OrderItems, and Products issues dozens of unwanted queries and can pull thousands of unnecessary database rows into heap memory.",
      "**2. `FetchType.LAZY` (Best Practice)**:",
      "Associated entities are **not** loaded when the parent is retrieved. Instead, Hibernate initializes a lightweight **CGLIB/ByteBuddy dynamic proxy** placeholder.",
      "The actual SQL query is deferred until a getter on the association is invoked (`order.getItems().size()`).",
      "JPA defaults to `LAZY` for collection relationships (`@OneToMany` and `@ManyToMany`).",
      "**Golden Rule**: **Always set `fetch = FetchType.LAZY` on `@ManyToOne` and `@OneToOne`** explicitly. Every association in your application should default to LAZY.",
      "**`LazyInitializationException`**: Occurs if a lazy association is initialized after the database transaction or `Session` has closed (e.g. inside a presentation layer or Jackson serializer without `@Transactional`)."
    ],
    keyPoints: [
      "`EAGER` loads immediately; `LAZY` loads on first access via a dynamic proxy.",
      "Always explicitly set `fetch = FetchType.LAZY` on `@ManyToOne` and `@OneToOne`.",
      "Default rule: Single-valued (`@ManyToOne`, `@OneToOne`) = EAGER by default; Collections (`@OneToMany`, `@ManyToMany`) = LAZY by default.",
      "`LazyInitializationException` happens when calling lazy getters outside an active transaction."
    ],
    code: [
      {
        title: "Explicitly Overriding Default EAGER on ManyToOne to LAZY",
        language: "java",
        content: `package com.algoguru.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "reviews")
public class Review {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String comment;

    // CRITICAL: JPA defaults @ManyToOne to FetchType.EAGER!
    // ALWAYS override to FetchType.LAZY to prevent performance bugs.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    // Getters and setters...
}`
      }
    ],
    tip: "Never solve `LazyInitializationException` by switching associations to `FetchType.EAGER` or setting `spring.jpa.open-in-view=true`. Solve it using `JOIN FETCH` queries, `@EntityGraph`, or DTO projections."
  },
  {
    id: "jpa-repository",
    title: "Repository Hierarchy (CrudRepository, JpaRepository)",
    difficulty: "Medium",
    theory: [
      "Spring Data JPA organizes data access operations into a clean, hierarchical inheritance tree of repository interfaces.",
      "**The Repository Hierarchy**:",
      "1. **`Repository<T, ID>`**: A marker interface with zero methods. It captures the domain type and ID type.",
      "2. **`CrudRepository<T, ID>`**: Provides standard generic CRUD operations: `save()`, `findById()`, `existsById()`, `findAll()`, `count()`, `deleteById()`, `deleteAll()`.",
      "3. **`ListCrudRepository<T, ID>`** (Introduced in Spring Data 3.x / Boot 3): Returns `List<T>` instead of `Iterable<T>` for methods like `findAll()`.",
      "4. **`PagingAndSortingRepository<T, ID>`**: Adds methods for paginated and sorted retrieval: `findAll(Sort sort)` and `findAll(Pageable pageable)`.",
      "5. **`JpaRepository<T, ID>`**: The most full-featured, JPA-specific interface. Extends `ListCrudRepository`, `ListPagingAndSortingRepository`, and `QueryByExampleExecutor`. Adds JPA-specific batch execution: `saveAllAndFlush()`, `flush()`, `deleteAllInBatch()`, and `getReferenceById()` (lazy proxy lookup).",
      "At application startup, Spring Data JPA scans for interfaces extending `Repository` and generates dynamic Java dynamic proxy implementations, completely eliminating manual DAO and JDBC code."
    ],
    keyPoints: [
      "`JpaRepository` extends `ListCrudRepository` and `PagingAndSortingRepository`.",
      "Provides ready-to-use CRUD, pagination, sorting, and batch flushing.",
      "Spring Data generates implementation classes automatically via dynamic proxies at startup.",
      "Use `getReferenceById(id)` when you only need an entity reference to set a foreign key without querying the DB."
    ],
    code: [
      {
        title: "Declaring a JpaRepository Interface",
        language: "java",
        content: `package com.algoguru.repository;

import com.algoguru.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    // Standard methods inherited:
    // save(), findById(), findAll(), deleteById(), count(), flush()

    // Custom query methods defined here...
    Optional<Student> findByEmail(String email);
}`
      }
    ],
    note: "The `@Repository` annotation on interfaces extending `JpaRepository` is technically optional because Spring Data automatically identifies and registers them, but adding it enables Spring's `PersistenceExceptionTranslationPostProcessor`."
  },
  {
    id: "jpa-derived-queries",
    title: "Derived Query Methods",
    difficulty: "Medium",
    theory: [
      "One of Spring Data JPA's most powerful features is **Query Method Derivation**. Spring Data parses the method signature according to a defined grammar and generates the underlying JPQL query automatically.",
      "**Method Parsing Structure**:",
      "A query method name consists of a **prefix** (`find...By`, `read...By`, `query...By`, `count...By`, `exists...By`, `delete...By`) followed by property expressions linked with keywords.",
      "**Supported Predicate Keywords**:",
      "- Equality & Comparison: `Is`, `Equals`, `Not`, `Like`, `StartingWith`, `EndingWith`, `Containing`, `IgnoreCase`.",
      "- Range & Numbers: `GreaterThan`, `GreaterThanEqual`, `LessThan`, `Between`.",
      "- Null Checks: `IsNull`, `IsNotNull`.",
      "- Booleans: `True`, `False`.",
      "- Logical Operators: `And`, `Or` (e.g. `findByStatusAndAgeGreaterThan`).",
      "- Limiting Results: `findFirstByOrderByScoreDesc()`, `findTop5ByCategoryId()`.",
      "If a query method references an entity property that does not exist or has a typo (e.g. `findByEmaill`), Spring Data JPA detects the error at application startup during context initialization and fails fast with a clear exception."
    ],
    keyPoints: [
      "Queries are automatically derived from method names without writing SQL or JPQL.",
      "Supports operators: `And`, `Or`, `Between`, `LessThan`, `Containing`, `IgnoreCase`.",
      "Supports existence and counts: `existsByEmail(...)`, `countByStatus(...)`.",
      "Fails fast at application startup if entity property names do not match method signatures."
    ],
    code: [
      {
        title: "Comprehensive Examples of Derived Query Methods",
        language: "java",
        content: `package com.algoguru.repository;

import com.algoguru.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface StudentQueryRepository extends JpaRepository<Student, Long> {

    // SELECT * FROM students WHERE email = ?
    Optional<Student> findByEmail(String email);

    // SELECT * FROM students WHERE full_name ILIKE '%query%'
    List<Student> findByFullNameContainingIgnoreCase(String query);

    // SELECT * FROM students WHERE enrolled_at BETWEEN ? AND ?
    List<Student> findByEnrolledAtBetween(Instant start, Instant end);

    // SELECT COUNT(*) > 0 FROM students WHERE email = ?
    boolean existsByEmail(String email);

    // SELECT COUNT(*) FROM students WHERE active = true
    long countByActiveTrue();

    // SELECT * FROM students ORDER BY enrolled_at DESC LIMIT 3
    List<Student> findTop3ByOrderByEnrolledAtDesc();
}`
      }
    ],
    warning: "Derived method names can become excessively long and unreadable for queries with 4+ conditions (e.g. `findByAgeAndStatusAndCountryAndCityOrderByNameDesc`). Use `@Query` instead when complexity grows."
  },
  {
    id: "jpa-query-annotation",
    title: "@Query Annotation",
    difficulty: "Medium",
    theory: [
      "When derived queries become too complex or require explicit performance optimizations, Spring Data JPA provides the **`@Query`** annotation.",
      "By default, `@Query` uses **JPQL (Java Persistence Query Language)**. JPQL operates on the **Java Entity Model**, referencing Java class names and entity field names rather than database table names and raw column names.",
      "**Parameter Binding**:",
      "1. **Named Parameters (Best Practice)**: Use `:paramName` in the query and `@Param(\"paramName\")` in the method signature.",
      "2. **Positional Parameters**: Use `?1`, `?2` corresponding to argument order (fragile to parameter reordering).",
      "**Modifying Queries (`@Modifying`)**:",
      "For DML operations (`UPDATE` or `DELETE`), the method must be annotated with both **`@Modifying`** and **`@Transactional`**. Without `@Modifying`, Spring Data attempts to execute the query via `executeQuery()` instead of `executeUpdate()`, throwing an `InvalidDataAccessApiUsageException`.",
      "Add `clearAutomatically = true` to `@Modifying` to clear the Hibernate persistence context after execution, preventing stale first-level cache state from masking database updates."
    ],
    keyPoints: [
      "`@Query` defaults to JPQL: queries target Java Entity classes, not database tables.",
      "Use named parameters (`:paramName` + `@Param`) for readable, safe queries.",
      "UPDATE and DELETE queries require `@Modifying` and `@Transactional`.",
      "Set `@Modifying(clearAutomatically = true)` to avoid stale entity state in the L1 cache."
    ],
    code: [
      {
        title: "JPQL Queries with Named Parameters and Modifying Updates",
        language: "java",
        content: `package com.algoguru.repository;

import com.algoguru.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    // JPQL query: targets User entity and email field
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.createdAt >= :cutoff")
    List<User> findActiveUsersByRole(
        @Param("role") User.Role role,
        @Param("cutoff") java.time.Instant cutoff
    );

    // Bulk UPDATE query
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("UPDATE User u SET u.role = :newRole WHERE u.id IN :userIds")
    int bulkPromoteUsers(
        @Param("userIds") List<Long> userIds,
        @Param("newRole") User.Role newRole
    );
}`
      }
    ],
    tip: "Use `JOIN FETCH` inside JPQL `@Query` methods to fetch parent and associated child entities in a single SQL query, completely eliminating the N+1 problem."
  },
  {
    id: "jpa-native-queries",
    title: "Native & Named Queries",
    difficulty: "Hard",
    theory: [
      "While JPQL provides database-agnostic queries, certain operations require database-specific SQL features (PostgreSQL JSONB operators, Common Table Expressions / CTEs, window functions, or specialized vendor indexes).",
      "Setting **`nativeQuery = true`** on the `@Query` annotation executes raw, database-specific SQL directly against the JDBC connection without JPQL translation.",
      "**Mapping Native Query Results**:",
      "1. **Entities**: If the native query `SELECT *` returns all columns matching an `@Entity`, Spring maps the result directly to entity instances.",
      "2. **Spring Data Projections (Interfaces)**: When returning a subset of columns, declare a Java interface with getter methods matching the SQL column alias names (e.g., `SELECT u.id AS id, u.email AS email`). Spring Data creates dynamic proxies to back the interface.",
      "3. **DTO Projections (Constructor Expression)**: Map results directly to a Java Record or DTO class using constructor expressions in JPQL: `SELECT new com.algoguru.dto.UserSummaryDto(u.id, u.email) FROM User u`.",
      "**Drawbacks of Native Queries**: Native queries bypass Hibernate's database dialect abstraction, locking your codebase to a specific database vendor, and do not benefit from compile-time entity validation."
    ],
    keyPoints: [
      "`@Query(value = \"...\", nativeQuery = true)` executes raw SQL directly.",
      "Essential for database-specific features (JSONB, full-text search, CTEs).",
      "Map column subsets using Interface-based or Record DTO projections.",
      "Native queries do not validate field names at startup and reduce database portability."
    ],
    code: [
      {
        title: "Native SQL Query with Interface-Based Projection",
        language: "java",
        content: `package com.algoguru.repository;

import com.algoguru.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface UserStatsRepository extends JpaRepository<User, Long> {

    // Projection interface: method names match SQL column aliases
    interface UserActivitySummary {
        String getUsername();
        Long getOrderCount();
        Double getTotalSpent();
    }

    // Native PostgreSQL query with aggregation and joins
    @Query(value = """
        SELECT u.username AS username,
               COUNT(o.id) AS orderCount,
               COALESCE(SUM(o.amount), 0.0) AS totalSpent
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.created_at >= :since
        GROUP BY u.id, u.username
        ORDER BY totalSpent DESC
        LIMIT 10
        """, nativeQuery = true)
    List<UserActivitySummary> findTopSpenders(@Param("since") java.time.Instant since);
}`
      }
    ],
    tip: "When using native queries with pagination, you must explicitly provide a `countQuery`: `@Query(value = \"...\", countQuery = \"SELECT count(*) FROM ...\", nativeQuery = true)`."
  },
  {
    id: "jpa-pagination",
    title: "Pagination & Sorting",
    difficulty: "Medium",
    theory: [
      "Retrieving massive datasets into application memory causes severe latency and memory exhaustion. Spring Data JPA provides native, high-performance pagination via **`Pageable`**, **`Page<T>`**, and **`Slice<T>`**.",
      "**Core Abstractions**:",
      "1. **`Pageable`**: An interface representing request pagination parameters. Created via `PageRequest.of(pageNumber, pageSize, Sort.by(\"createdDate\").descending())`. Note that page indices are **0-based**.",
      "2. **`Page<T>`**: Represents a chunk of data alongside total pagination metadata: total elements (`getTotalElements()`), total pages (`getTotalPages()`), and current page number. To compute this, Spring Data executes **two SQL queries**: the actual paginated query (`LIMIT / OFFSET`) and an additional `COUNT(*)` query.",
      "3. **`Slice<T>`**: An optimized alternative for infinite-scroll UIs. `Slice` only queries for `pageSize + 1` records to determine if a next slice exists, **avoiding the expensive `COUNT(*)` query entirely**.",
      "4. **`Sort`**: Controls SQL `ORDER BY` clauses independently of pagination."
    ],
    keyPoints: [
      "`PageRequest.of(page, size, sort)` creates 0-indexed pagination requests.",
      "`Page<T>` executes an extra `COUNT(*)` query to determine total pages.",
      "`Slice<T>` avoids the `COUNT(*)` query; ideal for mobile and infinite-scroll feeds.",
      "Pass `Pageable` directly as the last parameter of any derived or `@Query` method."
    ],
    code: [
      {
        title: "Pagination and Slice Usage in Repository and Service",
        language: "java",
        content: `package com.algoguru.service;

import com.algoguru.entity.Product;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

interface ProductRepository extends JpaRepository<Product, Long> {
    // Derived query with pagination
    Page<Product> findByCategory(String category, Pageable pageable);

    // High-performance Slice (no COUNT query)
    Slice<Product> findByInStockTrue(Pageable pageable);
}

@Service
public class ProductCatalogService {

    private final ProductRepository repository;

    public ProductCatalogService(ProductRepository repository) {
        this.repository = repository;
    }

    public Page<Product> getProductsPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("price").ascending());
        return repository.findByCategory("Electronics", pageable);
    }
}`
      }
    ],
    tip: "For tables with millions of rows, `OFFSET` pagination becomes slow because the DB must scan and skip offset rows. Use keyset pagination (seeking by ID: `WHERE id > :lastSeenId ORDER BY id ASC LIMIT :size`)."
  },
  {
    id: "jpa-transactions",
    title: "Transaction Management (@Transactional)",
    difficulty: "Hard",
    theory: [
      "Database transactions adhere to **ACID** properties (Atomicity, Consistency, Isolation, Durability). Spring provides declarative transaction management via the **`@Transactional`** annotation.",
      "**How `@Transactional` Works via AOP Proxy**:",
      "Spring creates a dynamic proxy around your `@Transactional` service bean (`TransactionInterceptor`). When a method is invoked: (1) The proxy opens a database connection and starts a transaction (`connection.setAutoCommit(false)`), (2) The target method executes, (3) If the method completes normally, the proxy commits the transaction, (4) If a runtime exception is thrown, the proxy rolls back the transaction.",
      "**Key Configuration Attributes**:",
      "1. **`propagation`**: Defines transactional boundaries:",
      "   - `REQUIRED` (Default): Joins existing transaction if present, or creates a new one.",
      "   - `REQUIRES_NEW`: Suspends any existing transaction and always creates an independent physical transaction.",
      "   - `SUPPORTS`, `MANDATORY`, `NEVER`, `NOT_SUPPORTED`.",
      "2. **`isolation`**: Controls concurrency anomalies (Dirty Read, Non-Repeatable Read, Phantom Read): `READ_COMMITTED` (default in PostgreSQL/Oracle), `REPEATABLE_READ` (default in MySQL InnoDB), `SERIALIZABLE`.",
      "3. **`readOnly = true`**: Optimizes Hibernate dirty checking (Hibernate skips snapshot comparisons) and routes queries to read replicas in clustered databases.",
      "4. **`rollbackFor`**: By default, Spring only rolls back on **Unchecked Exceptions (`RuntimeException` and `Error`)**, not Checked Exceptions (`Exception`). Specify `@Transactional(rollbackFor = Exception.class)` to roll back on all exceptions."
    ],
    keyPoints: [
      "`@Transactional` works via Spring AOP proxies wrapping the target method.",
      "Default rollback occurs only on unchecked exceptions (`RuntimeException`); configure `rollbackFor = Exception.class`.",
      "Self-invocation (`this.method()`) bypasses the Spring AOP proxy and disables transactions!",
      "Use `readOnly = true` on query methods to optimize performance."
    ],
    code: [
      {
        title: "Enterprise Transactional Service with Propagation and Rollback Rules",
        language: "java",
        content: `package com.algoguru.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BankTransferService {

    @Transactional(
        propagation = Propagation.REQUIRED,
        isolation = Isolation.READ_COMMITTED,
        rollbackFor = Exception.class, // Rollback on checked exceptions too!
        timeout = 10 // Abort if execution exceeds 10 seconds
    )
    public void transferFunds(Long fromAcc, Long toAcc, double amount) throws Exception {
        debit(fromAcc, amount);
        credit(toAcc, amount);
        logAuditTrail(fromAcc, toAcc, amount); // Even if this fails, everything rolls back
    }

    // Requires independent transaction: audit must be recorded even if transfer fails
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSecurityAudit(String event) {
        // Saved in a separate commit
    }

    private void debit(Long acc, double amt) { /* ... */ }
    private void credit(Long acc, double amt) { /* ... */ }
    private void logAuditTrail(Long from, Long to, double amt) { /* ... */ }
}`
      }
    ],
    warning: "Calling another `@Transactional` method in the same class via `this.otherMethod()` bypasses the Spring AOP proxy. The transaction settings on `otherMethod` will be completely ignored!"
  },
  {
    id: "jpa-n-plus-1",
    title: "N+1 Problem & Solutions",
    difficulty: "Hard",
    theory: [
      "The **N+1 Query Problem** is the single most common performance bug in ORM applications. It occurs when retrieving a parent collection of size $N$, and the ORM executes **1 query** for the parent and then executes **$N$ additional independent queries** to fetch associated children.",
      "**Scenario**: Fetching 50 `Department` records with `employees`: (1) 1 query fetches 50 departments (`SELECT * FROM departments`), (2) As the application loops through departments, Hibernate executes 50 individual queries (`SELECT * FROM employees WHERE department_id = ?`). Total = 51 queries instead of 1!",
      "**Three Industry-Standard Solutions**:",
      "1. **`JOIN FETCH` in JPQL**: Tells Hibernate to perform an SQL `INNER JOIN` or `LEFT JOIN` and populate both parent and child entities in a single query result set: `SELECT d FROM Department d LEFT JOIN FETCH d.employees`.",
      "2. **`@EntityGraph`**: Declaratively instructs Spring Data JPA which lazy attributes to fetch eagerly for a specific repository method without altering entity-level `FetchType.LAZY` defaults: `@EntityGraph(attributePaths = {\"employees\"})`.",
      "3. **Batch Fetching (`default_batch_fetch_size`)**: In `application.properties`, setting `spring.jpa.properties.hibernate.default_batch_fetch_size=50` tells Hibernate to fetch lazy collections using an SQL `IN` query (`WHERE department_id IN (?, ?, ...)`). Reduces $N+1$ queries to $\\lceil N/50 \\rceil + 1$ queries."
    ],
    keyPoints: [
      "N+1 problem occurs when fetching 1 parent collection triggers N child queries.",
      "Solution 1: `JOIN FETCH` in JPQL retrieves parent and children in 1 query.",
      "Solution 2: `@EntityGraph(attributePaths = {\"...\"})` overrides fetch plan on repository methods.",
      "Solution 3: Configure `hibernate.default_batch_fetch_size=50` in properties."
    ],
    code: [
      {
        title: "Solving N+1 using JOIN FETCH and @EntityGraph",
        language: "java",
        content: `package com.algoguru.repository;

import com.algoguru.entity.Department;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface DepartmentPerformanceRepository extends JpaRepository<Department, Long> {

    // Solution 1: Explicit JPQL JOIN FETCH (1 single query executed)
    @Query("SELECT DISTINCT d FROM Department d LEFT JOIN FETCH d.employees")
    List<Department> findAllWithEmployeesFetch();

    // Solution 2: @EntityGraph (Spring Data generates optimal join query)
    @EntityGraph(attributePaths = { "employees", "manager" })
    List<Department> findAll();
}`
      }
    ],
    tip: "Enable SQL logging with `spring.jpa.show-sql=true` and `logging.level.org.hibernate.orm.jdbc.bind=trace` during local development to spot N+1 queries early."
  },
  {
    id: "jpa-migrations",
    title: "Database Migrations — Flyway, Liquibase",
    difficulty: "Medium",
    theory: [
      "In production environments, setting `spring.jpa.hibernate.ddl-auto=update` is **strictly prohibited** because Hibernate's schema generator can lock tables, drop foreign keys, or fail unpredictably.",
      "Production enterprise systems use automated, version-controlled **Database Migration Tools**: **Flyway** and **Liquibase**.",
      "**Flyway Internals**:",
      "Flyway uses plain SQL scripts placed in `src/main/resources/db/migration/`. Scripts follow a strict naming convention: **`V<Version>__<Description>.sql`** (e.g. `V1__init_schema.sql`, `V2__add_user_indices.sql`). Note the double underscore.",
      "When Spring Boot starts up:",
      "1. Flyway creates and locks a metadata table named `flyway_schema_history`.",
      "2. It scans migration scripts, computes a SHA-256 checksum for each file, and checks which migrations have already run.",
      "3. Unapplied migrations execute sequentially inside transactions.",
      "4. If a previously applied migration file is modified, Flyway detects a checksum mismatch and halts application startup to prevent schema corruption.",
      "**Flyway vs Liquibase**: Flyway uses simple, native SQL scripts; Liquibase uses XML, YAML, or JSON changelogs that offer database independence at the cost of verbose syntax."
    ],
    keyPoints: [
      "Never use `ddl-auto=update` in production; always use Flyway or Liquibase.",
      "Flyway scripts are placed in `src/main/resources/db/migration/`.",
      "Naming format: `V{version}__{description}.sql` with two underscores.",
      "Tracks applied migrations and checksums in `flyway_schema_history`."
    ],
    code: [
      {
        title: "Flyway Dependency and Migration SQL Script",
        language: "sql",
        content: `-- In src/main/resources/db/migration/V1__create_students_table.sql

CREATE TABLE students (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_email ON students(email);`
      }
    ],
    warning: "Never edit or rename a migration script that has already been deployed and executed in test or production environments. Doing so triggers a Flyway checksum validation failure on startup."
  },
  {
    id: "jpa-auditing",
    title: "Auditing — @CreatedDate, @LastModifiedDate",
    difficulty: "Easy",
    theory: [
      "Enterprise governance and security compliance require tracking **who created or modified a database record** and **when the change occurred**.",
      "Spring Data JPA provides automated auditing through four standard annotations from `org.springframework.data.annotation`:",
      "- `@CreatedDate`: Automatically populated with the creation timestamp when the entity is first persisted.",
      "- `@LastModifiedDate`: Automatically updated with the current timestamp whenever the entity changes.",
      "- `@CreatedBy`: Automatically populated with the username/ID of the authenticated user who created the record.",
      "- `@LastModifiedBy`: Automatically updated with the user who modified the record.",
      "**Setup Requirements**:",
      "1. Add **`@EnableJpaAuditing`** to a `@Configuration` class.",
      "2. Add **`@EntityListeners(AuditingEntityListener.class)`** to the audited entity or a reusable `@MappedSuperclass` base entity.",
      "3. Implement the **`AuditorAware<String>`** bean to extract the current username from Spring Security's `SecurityContextHolder`."
    ],
    keyPoints: [
      "Automates recording creation and modification timestamps and user identities.",
      "Requires `@EnableJpaAuditing` and `@EntityListeners(AuditingEntityListener.class)`.",
      "Best implemented on an abstract `@MappedSuperclass` extended by all entities.",
      "Implement `AuditorAware<T>` to integrate with Spring Security's `SecurityContext`."
    ],
    code: [
      {
        title: "Reusable Auditable Base Entity with AuditorAware Implementation",
        language: "java",
        content: `package com.algoguru.entity;

import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.annotation.*;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import java.time.Instant;
import java.util.Optional;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @CreatedBy
    private String createdBy;

    @LastModifiedBy
    private String lastModifiedBy;
}

@Configuration
@EnableJpaAuditing
class AuditConfig {
    @Bean
    public AuditorAware<String> auditorProvider() {
        // In real apps, extract username from SecurityContextHolder
        return () -> Optional.of("system_admin");
    }
}`
      }
    ],
    tip: "Use `@MappedSuperclass` on base entity classes so child entities inherit auditing fields without generating a separate table."
  }
];

export const springDataJpaContent: ContentSection[] = attachDiagrams(
  springDataJpaRaw,
  springDataJpaVisualizations,
);
