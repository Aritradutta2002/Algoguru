import type { Diagram } from "./recursionContent";

/* -------------------------------------------------------------------------- */
/*  Spring Security — Diagram Data                                           */
/*  Keyed by ContentSection `id`; rendered by the shared DiagramRenderer.     */
/* -------------------------------------------------------------------------- */

export const springSecurityVisualizations: Record<string, Diagram> = {
  /* ── Security Fundamentals ── */
  "sec-intro": {
    type: "table-visual",
    title: "CIA Triad & the Default Starter Behaviour",
    data: [
      {
        label: "Confidentiality",
        color: "primary",
        children: [{ label: "Only authorised entities read the data" }, { label: "Authentication + encryption" }],
      },
      {
        label: "Integrity",
        color: "info",
        children: [{ label: "Data is trustworthy & untampered" }, { label: "Signatures, validation, constraints" }],
      },
      {
        label: "Availability",
        color: "accent",
        children: [{ label: "Services stay reachable for legitimate users" }, { label: "Rate limiting, resilience" }],
      },
      {
        label: "Add the starter → everything locked",
        color: "warning",
        children: [
          { label: "Ephemeral UUID password printed on startup" },
          { label: "HTTP Basic + login prompt on all endpoints" },
          { label: "Security headers enabled" },
        ],
      },
    ],
  },

  /* ── Authentication vs Authorization ── */
  "sec-auth-vs-authz": {
    type: "flow",
    title: "AuthN → SecurityContext → AuthZ",
    direction: "vertical",
    data: [
      {
        label: "Authentication — \"Who are you?\"",
        color: "primary",
        children: [
          { label: "Credentials: password, JWT, API key, OIDC" },
          { label: "AuthenticationProvider verifies them" },
        ],
      },
      {
        label: "Authentication object stored in SecurityContextHolder",
        color: "info",
        children: [{ label: "principal + authorities + isAuthenticated()" }],
      },
      {
        label: "Authorization — \"What may you do?\"",
        color: "accent",
        children: [
          { label: "AuthorizationFilter evaluates the request" },
          { label: "GrantedAuthority: ROLE_ADMIN / READ_PRIVILEGE" },
        ],
      },
      {
        label: "Access granted → DispatcherServlet",
        color: "success",
      },
      {
        label: "Denied → 403 Forbidden (401 when unauthenticated)",
        color: "warning",
      },
    ],
  },

  /* ── SecurityFilterChain ─ */
  "sec-filter-chain": {
    type: "flow",
    title: "Filter Chain Before DispatcherServlet",
    direction: "horizontal",
    data: [
      { label: "HTTP request", color: "primary" },
      {
        label: "DelegatingFilterProxy\nspringSecurityFilterChain",
        color: "info",
        children: [{ label: "SecurityFilterAutoConfiguration registers it" }],
      },
      { label: "CorsFilter → CsrfFilter\n→ Authentication filters", color: "accent" },
      { label: "AuthorizationFilter\nrequestMatchers / hasRole", color: "warning" },
      { label: "Controller", color: "success" },
    ],
  },

  /* ── In-Memory Authentication ── */
  "sec-in-memory": {
    type: "layers",
    title: "In-Memory Authentication",
    data: [
      {
        label: "InMemoryUserDetailsManager",
        color: "primary",
        children: [
          { label: "User.builder().username(\"admin\").roles(\"ADMIN\")" },
          { label: "Users live in a HashMap — gone on restart" },
        ],
      },
      {
        label: "Requires a PasswordEncoder bean",
        color: "info",
        children: [{ label: "No plain-text passwords — BCryptPasswordEncoder" }],
      },
      {
        label: "DaoAuthenticationProvider matches the raw password",
        color: "accent",
        children: [{ label: "Against the stored hash" }],
      },
      {
        label: "Use it for: local dev, tests, demos",
        color: "warning",
        children: [{ label: "Never for multi-instance production" }],
      },
    ],
  },

  /* ── JDBC Authentication ─ */
  "sec-jdbc": {
    type: "flow",
    title: "JdbcUserDetailsManager — DB-Backed Users",
    direction: "vertical",
    data: [
      {
        label: "DataSource bean",
        color: "info",
        children: [{ label: "Auto-configured from spring.datasource.*" }],
      },
      {
        label: "JdbcUserDetailsManager",
        color: "primary",
        children: [
          { label: "users / authorities tables by default" },
          { label: "usersByUsernameQuery / authoritiesByUsernameQuery to override" },
        ],
      },
      {
        label: "loadUserByUsername → UserDetails",
        color: "accent",
        children: [{ label: "authorities mapped to GrantedAuthority" }],
      },
      {
        label: "DaoAuthenticationProvider compares the BCrypt hash",
        color: "success",
      },
    ],
  },
  /* ── UserDetailsService & UserDetails ── */
  "sec-user-details": {
    type: "flow",
    title: "Custom UserDetailsService — Login Flow",
    direction: "vertical",
    data: [
      {
        label: "UsernamePasswordAuthenticationToken(username, rawPassword)",
        color: "primary",
      },
      {
        label: "UserDetailsService.loadUserByUsername(String)",
        color: "info",
        children: [{ label: "Single method — the whole SPI" }],
      },
      {
        label: "UserDetails returned",
        color: "accent",
        children: [
          { label: "username, password hash, authorities" },
          { label: "accountNonExpired / isEnabled flags" },
        ],
      },
      {
        label: "DaoAuthenticationProvider compares hashes",
        color: "warning",
        children: [{ label: "passwordEncoder.matches(raw, stored)" }],
      },
      {
        label: "Authenticated → SecurityContext → success handler",
        color: "success",
        children: [{ label: "BadCredentialsException on mismatch" }],
      },
    ],
  },

  /* ── Password Encoding ── */
  "sec-password": {
    type: "table-visual",
    title: "Password Hashing Choices",
    data: [
      {
        label: "Never do this",
        color: "warning",
        children: [
          { label: "Plain text storage" },
          { label: "MD5 / SHA-256 — too fast, rainbow tables" },
          { label: "Hand-rolled salting" },
        ],
      },
      {
        label: "BCryptPasswordEncoder",
        color: "success",
        children: [
          { label: "Adaptive cost factor (strength)" },
          { label: "Automatic per-password salt" },
          { label: "The standard default" },
        ],
      },
      {
        label: "Argon2PasswordEncoder",
        color: "info",
        children: [{ label: "Memory-hard — resists GPU cracking" }, { label: "State of the art" }],
      },
      {
        label: "DelegatingPasswordEncoder",
        color: "accent",
        children: [
          { label: "{bcrypt}$2a$10$..." },
          { label: "Algorithm id prefix enables migration" },
        ],
      },
    ],
  },

  /* ── JWT Authentication ── */
  "sec-jwt": {
    type: "layers",
    title: "JWT — Header.Payload.Signature",
    data: [
      {
        label: "Header",
        color: "info",
        children: [{ label: "{ \"alg\": \"HS256\" | \"RS256\", \"typ\": \"JWT\" }" }],
      },
      {
        label: "Payload (claims — readable by anyone)",
        color: "warning",
        children: [
          { label: "sub, iat, exp, roles" },
          { label: "Never store secrets or sensitive data" },
        ],
      },
      {
        label: "Signature",
        color: "success",
        children: [
          { label: "HMAC with a shared secret, or RSA/EC private key" },
          { label: "Proves integrity — not confidentiality" },
        ],
      },
      {
        label: "Verified per request",
        color: "primary",
        children: [
          { label: "Custom OncePerRequestFilter before AuthorizationFilter" },
          { label: "Stateless — no server-side session" },
          { label: "Short-lived access token + revocable refresh token" },
        ],
      },
    ],
  },

  /* ── OAuth 2.0 & OIDC ── */
  "sec-oauth2": {
    type: "flow",
    title: "Authorization Code Flow with PKCE",
    direction: "horizontal",
    data: [
      { label: "Client\n+ code_verifier", color: "primary" },
      {
        label: "Authorization Server\n/authorize?code_challenge=...",
        color: "info",
      },
      { label: "User consents\n→ authorization code", color: "accent" },
      {
        label: "Server-to-server token exchange",
        color: "warning",
        children: [{ label: "code + code_verifier → token" }],
      },
      {
        label: "Access token (+ ID token for OIDC)",
        color: "success",
        children: [
          { label: "OAuth2 = delegated authorization" },
          { label: "OIDC = authentication + ID token" },
          { label: "Resource Server validates against JWKS" },
        ],
      },
    ],
  },

  /* ── Method-Level Security ─ */
  "sec-method": {
    type: "flow",
    title: "@EnableMethodSecurity — SpEL Guard Rails",
    direction: "vertical",
    data: [
      {
        label: "@EnableMethodSecurity on a @Configuration class",
        color: "info",
        children: [{ label: "Activates the AOP interceptor advisor" }],
      },
      {
        label: "@PreAuthorize(\"hasRole('ADMIN') or #id == authentication.name\")",
        color: "primary",
        children: [{ label: "Evaluated BEFORE the method runs" }],
      },
      {
        label: "SpEL context",
        color: "accent",
        children: [
          { label: "#id — method parameter" },
          { label: "authentication / principal" },
          { label: "Return value only for @PostAuthorize" },
        ],
      },
      {
        label: "@PostAuthorize(\"returnObject.owner == authentication.name\")",
        color: "warning",
        children: [{ label: "Evaluated AFTER — inspects the result" }],
      },
      {
        label: "AccessDeniedException → 403",
        color: "success",
        children: [{ label: "@Secured(\"ROLE_ADMIN\") is the simpler legacy form" }],
      },
    ],
  },
  /* ── CSRF Protection ── */
  "sec-csrf": {
    type: "table-visual",
    title: "CSRF — When To Keep It, When To Disable",
    data: [
      {
        label: "The attack",
        color: "warning",
        children: [
          { label: "Browser auto-sends the session cookie" },
          { label: "A malicious page triggers a state-changing request" },
          { label: "Valid session, forged intent" },
        ],
      },
      {
        label: "Synchronizer Token pattern",
        color: "primary",
        children: [
          { label: "ON by default in Spring Security" },
          { label: "Token stored server-side + sent by the form" },
          { label: "CookieCsrfTokenRepository for SPAs" },
        ],
      },
      {
        label: "Session-cookie web app",
        color: "success",
        children: [{ label: "Keep CSRF enabled" }, { label: "SameSite=Lax as defence in depth" }],
      },
      {
        label: "Stateless JWT API",
        color: "info",
        children: [
          { label: "No cookie → no CSRF vector" },
          { label: "http.csrf(csrf -> csrf.disable())" },
          { label: "Bearer tokens are not ambient credentials" },
        ],
      },
    ],
  },

  /* ── CORS in Security ── */
  "sec-cors": {
    type: "flow",
    title: "CORS Filter Must Run Before Auth",
    direction: "vertical",
    data: [
      {
        label: "Browser sends preflight OPTIONS",
        color: "primary",
        children: [{ label: "No Authorization header, no credentials" }],
      },
      {
        label: "CorsFilter positioned early in the chain",
        color: "info",
        children: [{ label: "Before authentication filters — otherwise 401/403 on preflight" }],
      },
      {
        label: "CorsConfigurationSource bean",
        color: "accent",
        children: [
          { label: "allowedOrigins, allowedMethods, allowedHeaders" },
          { label: "allowCredentials(true) forbids \"*\"" },
          { label: "exposedHeaders — Authorization, X-Total-Count" },
        ],
      },
      {
        label: "http.cors(Customizer.withDefaults())",
        color: "success",
        children: [{ label: "Wires the Spring Security CORS integration" }],
      },
    ],
  },

  /* ── Role-Based Access Control ─ */
  "sec-rbac": {
    type: "hierarchy",
    title: "Roles vs Authorities & Role Inheritance",
    data: [
      {
        label: "GrantedAuthority (fine-grained)",
        color: "info",
        children: [
          { label: "USER_READ · USER_WRITE · REPORT_EXPORT" },
          { label: "hasAuthority(\"USER_WRITE\") — exact literal match" },
        ],
      },
      {
        label: "Role (coarse-grained)",
        color: "primary",
        children: [
          { label: "ROLE_ADMIN · ROLE_INSTRUCTOR · ROLE_STUDENT" },
          { label: "hasRole(\"ADMIN\") checks for ROLE_ADMIN automatically" },
        ],
      },
      {
        label: "RoleHierarchy — inheritance",
        color: "accent",
        children: [
          { label: "ROLE_ADMIN > ROLE_INSTRUCTOR > ROLE_STUDENT" },
          { label: "One hierarchy bean expands implied authorities" },
        ],
      },
    ],
  },

  /* ── LDAP Authentication ── */
  "sec-ldap": {
    type: "flow",
    title: "LDAP Authentication Patterns",
    direction: "horizontal",
    data: [
      {
        label: "spring-security-ldap\n+ LdapContextSource",
        color: "info",
        children: [{ label: "urls, base, userDn, password" }],
      },
      {
        label: "Bind authentication",
        color: "primary",
        children: [{ label: "Bind directly as the user DN" }],
      },
      {
        label: "Search-and-bind",
        color: "accent",
        children: [{ label: "searchBase + searchFilter find the DN" }, { label: "Then bind with the user's password" }],
      },
      {
        label: "Authorities from LDAP groups",
        color: "warning",
        children: [{ label: "groupSearchBase / role mapping" }],
      },
      {
        label: "Enterprise directory\nAD · OpenLDAP",
        color: "success",
        children: [{ label: "Often replaced by SAML / OIDC federation today" }],
      },
    ],
  },
};