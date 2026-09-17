import type { Diagram } from "./recursionContent";

/* -------------------------------------------------------------------------- */
/*  Spring Data JPA — Diagram Data                                           */
/*  Keyed by ContentSection `id`; rendered by the shared DiagramRenderer.     */
/* -------------------------------------------------------------------------- */

export const springDataJpaVisualizations: Record<string, Diagram> = {
  /* ── Entity Mapping ── */
  "jpa-entity-mapping": {
    type: "table-visual",
    title: "Entity Mapping Annotations",
    data: [
      {
        label: "@Entity + @Id",
        color: "primary",
        children: [
          { label: "Mandatory on every entity" },
          { label: "@Table(name = \"orders\") for the mapping" },
          { label: "No-args constructor (may be protected)" },
        ],
      },
      {
        label: "@GeneratedValue strategies",
        color: "info",
        children: [
          { label: "IDENTITY — DB auto-increment, breaks JDBC batching" },
          { label: "SEQUENCE — supports batching, preferred on Oracle/Postgres" },
          { label: "AUTO / TABLE / UUID" },
        ],
      },
      {
        label: "@Column / @Enumerated / @Transient",
        color: "accent",
        children: [
          { label: "EnumType.STRING (never ORDINAL)" },
          { label: "@Transient keeps derived fields out of SQL" },
        ],
      },
    ],
  },

  /* ── Column Mapping & Lifecycle ── */
  "jpa-column-mapping": {
    type: "table-visual",
    title: "Column Mapping & Lifecycle Callbacks",
    data: [
      {
        label: "Mapping",
        color: "primary",
        children: [
          { label: "@Column(name, nullable, length, precision)" },
          { label: "@Enumerated(EnumType.STRING)" },
          { label: "@Lob / @Temporal / @Version" },
        ],
      },
      {
        label: "Read-only columns",
        color: "info",
        children: [
          { label: "insertable = false, updatable = false" },
          { label: "DB-generated values stay untouched" },
        ],
      },
      {
        label: "Lifecycle callbacks",
        color: "accent",
        children: [
          { label: "@PrePersist → createdAt, auditing" },
          { label: "@PreUpdate → modifiedAt" },
          { label: "@PostLoad, @PreRemove" },
        ],
      },
      {
        label: "@Transient",
        color: "muted",
        children: [{ label: "Computed field — never persisted" }],
      },
    ],
  },

  /* ── Relationships ── */
  "jpa-relationships": {
    type: "hierarchy",
    title: "Owning Side Owns the Foreign Key",
    data: [
      {
        label: "Order (owning side for @ManyToOne)",
        color: "primary",
        children: [
          {
            label: "@ManyToOne @JoinColumn(name = \"customer_id\")",
            color: "info",
            children: [{ label: "FK column lives in the ORDER table" }],
          },
          {
            label: "@OneToMany(mappedBy = \"order\")",
            color: "accent",
            children: [
              { label: "Inverse side — no FK, no extra table" },
              { label: "Omitting mappedBy creates an unwanted join table!" },
            ],
          },
        ],
      },
      {
        label: "Bidirectional helper methods",
        color: "success",
        children: [
          { label: "addItem(item) sets both sides in memory" },
          { label: "Keeps the object graph consistent before flush" },
        ],
      },
    ],
  },

  /* ── Cascade Types ── */
  "jpa-cascade": {
    type: "hierarchy",
    title: "CascadeType — Propagating Lifecycle Events",
    data: [
      {
        label: "Order (aggregate root)",
        color: "primary",
        children: [
          {
            label: "@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)",
            color: "success",
            children: [
              { label: "PERSIST → save children with the parent" },
              { label: "MERGE · REFRESH · DETACH · REMOVE" },
              { label: "orphanRemoval deletes removed children" },
            ],
          },
          {
            label: "@ManyToMany — never cascade REMOVE",
            color: "warning",
            children: [{ label: "Would delete SHARED records" }],
          },
          {
            label: "@ManyToOne — no REMOVE cascade",
            color: "warning",
            children: [{ label: "Child must not delete its parent" }],
          },
        ],
      },
    ],
  },

  /* ── Fetch Types ── */
  "jpa-fetch": {
    type: "table-visual",
    title: "LAZY vs EAGER — Defaults & Failure Mode",
    data: [
      {
        label: "LAZY — proxy on first access",
        color: "success",
        children: [
          { label: "@OneToMany / @ManyToMany default" },
          { label: "Loaded only when the getter is called" },
          { label: "LazyInitializationException outside a transaction" },
        ],
      },
      {
        label: "EAGER — loaded immediately",
        color: "warning",
        children: [
          { label: "@ManyToOne / @OneToOne default" },
          { label: "Extra SQL on every parent load" },
          { label: "Force LAZY explicitly on associations" },
        ],
      },
      {
        label: "Fixes for a lazy failure",
        color: "info",
        children: [
          { label: "Fetch inside the transaction / JOIN FETCH" },
          { label: "@EntityGraph on the repository method" },
          { label: "DTO projection instead of the entity" },
        ],
      },
    ],
  },
  /* ── Repository Hierarchy ── */
  "jpa-repository": {
    type: "hierarchy",
    title: "Spring Data Repository Hierarchy",
    data: [
      {
        label: "Repository<T, ID> — marker",
        color: "muted",
        children: [
          {
            label: "CrudRepository<T, ID>",
            color: "info",
            children: [
              {
                label: "ListCrudRepository<T, ID>",
                color: "primary",
                children: [
                  {
                    label: "JpaRepository<T, ID>",
                    color: "success",
                    children: [
                      { label: "findAll(Sort) · flush() · saveAllAndFlush()" },
                      { label: "deleteAllInBatch() · getReferenceById(id)" },
                    ],
                  },
                ],
              },
              { label: "PagingAndSortingRepository<T, ID>" },
            ],
          },
        ],
      },
      {
        label: "Generated at startup",
        color: "accent",
        children: [
          { label: "Dynamic proxy per interface — no implementation class" },
          { label: "getReferenceById(id) = lazy reference, no SELECT" },
        ],
      },
    ],
  },

  /* ── Derived Query Methods ── */
  "jpa-derived-queries": {
    type: "flow",
    title: "Method Name → Generated JPQL",
    direction: "vertical",
    data: [
      {
        label: "findByStatusAndTotalGreaterThan(String, BigDecimal)",
        color: "primary",
        children: [{ label: "find…By = the query trigger" }],
      },
      {
        label: "Parser splits on And / Or",
        color: "info",
        children: [{ label: "Property path must match the entity field" }],
      },
      {
        label: "Keyword → operator mapping",
        color: "accent",
        children: [
          { label: "Between · LessThan · Containing · IgnoreCase" },
          { label: "In · IsNull · StartingWith · OrderBy…Asc/Desc" },
        ],
      },
      {
        label: "Variants: existsBy… / countBy… / deleteBy…",
        color: "warning",
      },
      {
        label: "Fails fast at startup if a property does not exist",
        color: "success",
        children: [{ label: "No silent runtime typo — PropertyReferenceException" }],
      },
    ],
  },

  /* ── @Query ── */
  "jpa-query-annotation": {
    type: "table-visual",
    title: "@Query — JPQL by Default",
    data: [
      {
        label: "JPQL — entity names, not tables",
        color: "primary",
        children: [
          { label: "SELECT o FROM Order o WHERE o.status = :status" },
          { label: "Named parameters (:name) + @Param" },
          { label: "targets Java entity model, portable" },
        ],
      },
      {
        label: "@Modifying UPDATE / DELETE",
        color: "warning",
        children: [
          { label: "Requires @Transactional" },
          { label: "clearAutomatically = true clears the L1 cache" },
          { label: "flushAutomatically = true before execution" },
        ],
      },
      {
        label: "Projections",
        color: "info",
        children: [
          { label: "Interface-based (closed / open)" },
          { label: "Class-based DTO / record constructor expression" },
          { label: "Dynamic Projection parameter" },
        ],
      },
      {
        label: "@Param vs positional",
        color: "accent",
        children: [{ label: "Named parameters survive refactoring" }],
      },
    ],
  },

  /* ── Native & Named Queries ── */
  "jpa-native-queries": {
    type: "flow",
    title: "Native SQL — Power vs Portability",
    direction: "vertical",
    data: [
      {
        label: "@Query(value = \"...\", nativeQuery = true)",
        color: "primary",
        children: [{ label: "Raw SQL executed by Hibernate" }],
      },
      {
        label: "Database-specific capabilities",
        color: "info",
        children: [
          { label: "PostgreSQL JSONB operators" },
          { label: "Full-text search, window functions, CTEs" },
        ],
      },
      {
        label: "Map the result",
        color: "accent",
        children: [
          { label: "Record / interface DTO projection" },
          { label: "Entity mapping when the SELECT matches all columns" },
        ],
      },
      {
        label: "Trade-offs",
        color: "warning",
        children: [
          { label: "Field names are NOT validated at startup" },
          { label: "Reduced portability across databases" },
        ],
      },
    ],
  },
  /* ── Pagination & Sorting ── */
  "jpa-pagination": {
    type: "table-visual",
    title: "Page<T> vs Slice<T>",
    data: [
      {
        label: "Pageable input",
        color: "primary",
        children: [
          { label: "PageRequest.of(page, size, sort) — 0-indexed" },
          { label: "Passed as the last parameter of any query method" },
          { label: "@PageableDefault for controller defaults" },
        ],
      },
      {
        label: "Page<T>",
        color: "info",
        children: [
          { label: "Executes an extra COUNT(*) query" },
          { label: "getTotalElements / getTotalPages" },
          { label: "Needed when the UI shows a page count" },
        ],
      },
      {
        label: "Slice<T>",
        color: "success",
        children: [
          { label: "No COUNT(*) — cheaper" },
          { label: "hasNext() only" },
          { label: "Ideal for infinite scroll / mobile feeds" },
        ],
      },
      {
        label: "Keyset pagination",
        color: "accent",
        children: [{ label: "WHERE id > lastSeenId ORDER BY id LIMIT n" }, { label: "Stable for deep pages" }],
      },
    ],
  },

  /* ── Transactions ── */
  "jpa-transactions": {
    type: "flow",
    title: "@Transactional — Proxy Boundary",
    direction: "vertical",
    data: [
      {
        label: "Caller invokes the proxy bean",
        color: "primary",
        children: [{ label: "TransactionInterceptor starts the transaction" }],
      },
      {
        label: "Method body runs with a bound EntityManager",
        color: "info",
        children: [{ label: "Persistence Context = first-level cache" }, { label: "Dirty checking collects updates" }],
      },
      {
        label: "Commit → flush → SQL UPDATE/INSERT issued",
        color: "accent",
      },
      {
        label: "Rollback rules",
        color: "warning",
        children: [
          { label: "Unchecked exceptions roll back by default" },
          { label: "Checked exceptions do NOT — use rollbackFor" },
          { label: "Self-invocation bypasses the proxy entirely" },
        ],
      },
      {
        label: "Tuning",
        color: "success",
        children: [
          { label: "readOnly = true for query methods" },
          { label: "propagation / isolation as needed" },
        ],
      },
    ],
  },

  /* ── N+1 Problem ── */
  "jpa-n-plus-1": {
    type: "graph",
    title: "N+1 Query Explosion (1 + N SELECTs)",
    data: {
      nodes: [
        { id: "q1", label: "1 query", x: 15, y: 20, color: "primary" },
        { id: "p1", label: "Order 1", x: 50, y: 8, color: "info" },
        { id: "p2", label: "Order 2", x: 50, y: 50, color: "info" },
        { id: "p3", label: "Order N", x: 50, y: 92, color: "info" },
        { id: "c1", label: "items", x: 88, y: 8, color: "warning" },
        { id: "c2", label: "items", x: 88, y: 50, color: "warning" },
        { id: "c3", label: "items", x: 88, y: 92, color: "warning" },
      ],
      edges: [
        { from: "q1", to: "p1" },
        { from: "q1", to: "p2" },
        { from: "q1", to: "p3" },
        { from: "p1", to: "c1" },
        { from: "p2", to: "c2" },
        { from: "p3", to: "c3" },
      ],
      directed: true,
      highlightPath: ["q1", "p2", "c2"],
    },
  },

  /* ── Migrations ─ */
  "jpa-migrations": {
    type: "flow",
    title: "Flyway — Versioned Schema Evolution",
    direction: "horizontal",
    data: [
      {
        label: "V1__init.sql",
        color: "primary",
        children: [{ label: "src/main/resources/db/migration" }],
      },
      { label: "V2__add_orders.sql", color: "info" },
      { label: "V3__add_index.sql", color: "accent" },
      {
        label: "flyway_schema_history",
        color: "success",
        children: [
          { label: "Applied version + checksum recorded" },
          { label: "Checksum mismatch → startup failure" },
        ],
      },
      {
        label: "Never ddl-auto=update in production",
        color: "warning",
        children: [{ label: "Liquibase is the XML/YAML alternative" }],
      },
    ],
  },

  /* ── Auditing ── */
  "jpa-auditing": {
    type: "layers",
    title: "Auditing — Who & When",
    data: [
      {
        label: "@EnableJpaAuditing",
        color: "primary",
        children: [{ label: "Activates the AuditingEntityListener machinery" }],
      },
      {
        label: "@MappedSuperclass Auditable base entity",
        color: "info",
        children: [
          { label: "@EntityListeners(AuditingEntityListener.class)" },
          { label: "@CreatedDate · @LastModifiedDate" },
          { label: "@CreatedBy · @LastModifiedBy" },
        ],
      },
      {
        label: "AuditorAware<T>",
        color: "accent",
        children: [{ label: "Reads the SecurityContext / current user" }],
      },
      {
        label: "Every entity extends the base",
        color: "success",
        children: [{ label: "No duplicated columns or callbacks" }],
      },
    ],
  },
};
