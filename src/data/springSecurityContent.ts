import { ContentSection } from "./recursionContent";

/* -------------------------------------------------------------------------- */
/*  Spring Security — Complete In-Depth Theory                                */
/*  Covers SecurityFilterChain, Authentication vs Authorization, UserDetails, */
/*  Password Encoding, JWT, OAuth2/OIDC, Method Security, CSRF, and CORS.    */
/*  Written against Spring Boot 3.x / Spring Security 6.x / Java 17+.         */
/* -------------------------------------------------------------------------- */

export const springSecurityContent: ContentSection[] = [
  {
    id: "sec-intro",
    title: "Security Fundamentals",
    difficulty: "Easy",
    theory: [
      "Application security is built upon the **CIA Triad**:",
      "1. **Confidentiality**: Ensuring sensitive information is accessible only to authorized entities.",
      "2. **Integrity**: Ensuring data is trustworthy, accurate, and protected from unauthorized tampering.",
      "3. **Availability**: Ensuring services and resources remain reliably accessible to legitimate users.",
      "**Spring Security** is a powerful, highly customizable authentication and access-control framework that is the de-facto standard for securing Spring-based applications.",
      "In Spring Boot, simply adding the starter dependency **`spring-boot-starter-security`** immediately secures the application out of the box with zero code: (1) Generates a random one-time UUID security password in the startup console, (2) Configures HTTP Basic authentication, (3) Enables standard HTTP Security Headers (X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options), and (4) Protects every endpoint behind a mandatory login prompt."
    ],
    keyPoints: [
      "Security rests on the CIA Triad: Confidentiality, Integrity, and Availability.",
      "Adding `spring-boot-starter-security` secures all endpoints automatically by default.",
      "Generates an ephemeral password logged in console on application bootstrap.",
      "Spring Security 6.x / Boot 3.x uses modern lambda-based DSLs for configuration."
    ],
    code: [
      {
        title: "Default Spring Security Starter Dependency",
        language: "xml",
        content: `<!-- In pom.xml: Instantly locks down all endpoints -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>`
      }
    ],
    note: "Default credentials: Username is `user`, password is the 36-character UUID string generated in the console on startup."
  },
  {
    id: "sec-auth-vs-authz",
    title: "Authentication vs Authorization",
    difficulty: "Easy",
    theory: [
      "The two foundational pillars of application access control are **Authentication** and **Authorization**.",
      "**1. Authentication (AuthN — 'Who are you?')**:",
      "The process of verifying the claimed identity of a user, service, or client. It validates credentials such as username/password, JWT signature, API keys, or biometrics.",
      "In Spring Security, successful authentication produces an **`Authentication`** object stored in the **`SecurityContext`** via `SecurityContextHolder.getContext().getAuthentication()`. The principal represents the validated identity.",
      "**2. Authorization (AuthZ — 'What are you allowed to do?')**:",
      "The process of determining whether an authenticated user has permission to access a specific resource or perform an operation. It evaluates roles (e.g. `ROLE_ADMIN`), authorities (`READ_PRIVILEGE`), or SpEL expressions.",
      "In Spring Security, authorization is evaluated by the `AuthorizationFilter` using `GrantedAuthority` records associated with the authenticated principal."
    ],
    keyPoints: [
      "Authentication = Identity verification ('Who are you?').",
      "Authorization = Permission evaluation ('What can you do?').",
      "The `Authentication` object is held in `SecurityContextHolder`.",
      "Roles and privileges are represented as `GrantedAuthority` collections."
    ],
    code: [
      {
        title: "Accessing Authenticated Principal from SecurityContextHolder",
        language: "java",
        content: `package com.algoguru.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CurrentUserController {

    @GetMapping("/api/v1/whoami")
    public String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return "Anonymous User";
        }
        return "Authenticated user: " + auth.getName() + " with roles: " + auth.getAuthorities();
    }
}`
      }
    ],
    tip: "You can inject the `Authentication` or `Principal` object directly into any controller method signature as an argument."
  },
  {
    id: "sec-filter-chain",
    title: "SecurityFilterChain",
    difficulty: "Medium",
    theory: [
      "Spring Security's web infrastructure is built entirely on standard Java Servlet Filters via the **`DelegatingFilterProxy`** and the **`FilterChainProxy`**.",
      "When an HTTP request enters the servlet container, `DelegatingFilterProxy` hands off control to Spring's `FilterChainProxy`, which routes the request through an ordered list of security filters known as the **`SecurityFilterChain`**.",
      "**Major Architectural Change in Spring Security 6 / Boot 3**:",
      "The historical base class `WebSecurityConfigurerAdapter` was deprecated in Spring Security 5.7 and **completely removed in Spring Security 6 / Spring Boot 3**. Security is now configured component-style by declaring a **`@Bean public SecurityFilterChain filterChain(HttpSecurity http)`** using modern lambda-based DSLs.",
      "Standard Filter Order: `CorsFilter` -> `CsrfFilter` -> `AuthenticationFilter` (e.g. `UsernamePasswordAuthenticationFilter` or custom JWT filter) -> `ExceptionTranslationFilter` -> `AuthorizationFilter`."
    ],
    keyPoints: [
      "`WebSecurityConfigurerAdapter` is completely removed in Spring Security 6 / Boot 3.",
      "Configure security by returning a `@Bean SecurityFilterChain` with lambda DSL.",
      "Filters execute in a strict topological order before reaching `DispatcherServlet`.",
      "Use `requestMatchers(\"/public/**\").permitAll()` and `.anyRequest().authenticated()`."
    ],
    code: [
      {
        title: "Modern Spring Security 6 / Boot 3 SecurityFilterChain Configuration",
        language: "java",
        content: `package com.algoguru.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for stateless REST APIs
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults()); // Or configure JWT filter

        return http.build();
    }
}`
      }
    ],
    warning: "Always place more specific `requestMatchers` (such as `/api/v1/admin/**`) **before** more general patterns (`anyRequest()`), as rules are evaluated in sequential top-down order."
  },
  {
    id: "sec-in-memory",
    title: "In-Memory Authentication",
    difficulty: "Easy",
    theory: [
      "For quick local development, integration testing, and non-production prototypes, Spring Security provides **`InMemoryUserDetailsManager`**.",
      "It stores credentials and roles in an in-memory hash map. When a request arrives with credentials, Spring Security verifies them against this in-memory user registry.",
      "In Spring Security 6, all passwords in memory **must be encoded** using a configured `PasswordEncoder` (such as `BCryptPasswordEncoder`). Storing plain-text passwords without a password encoder prefix or encoder bean throws an `IllegalArgumentException: There is no PasswordEncoder mapped for the id \"null\"`."
    ],
    keyPoints: [
      "`InMemoryUserDetailsManager` stores users in memory; ideal for local testing.",
      "Requires an active `PasswordEncoder` bean.",
      "Define users using `User.builder()` with roles and encrypted passwords.",
      "Never use in-memory authentication in multi-instance production environments."
    ],
    code: [
      {
        title: "Configuring InMemoryUserDetailsManager with BCrypt",
        language: "java",
        content: `package com.algoguru.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@Configuration
public class InMemorySecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder encoder) {
        UserDetails regularUser = User.builder()
            .username("student")
            .password(encoder.encode("password123"))
            .roles("STUDENT")
            .build();

        UserDetails adminUser = User.builder()
            .username("admin")
            .password(encoder.encode("adminSecret!"))
            .roles("ADMIN", "STUDENT")
            .build();

        return new InMemoryUserDetailsManager(regularUser, adminUser);
    }
}`
      }
    ],
    tip: "Roles configured via `.roles(\"ADMIN\")` are automatically prefixed with `ROLE_` internally by Spring Security (`ROLE_ADMIN`)."
  },
  {
    id: "sec-jdbc",
    title: "JDBC Authentication",
    difficulty: "Medium",
    theory: [
      "For applications with user records stored in a relational database, Spring Security provides **`JdbcUserDetailsManager`**.",
      "`JdbcUserDetailsManager` executes SQL queries against standard or custom relational tables to load user credentials and authority mappings directly over JDBC.",
      "Spring Security provides default DDL schemas with two tables: `users(username, password, enabled)` and `authorities(username, authority)`.",
      "If your enterprise database schema differs from the default tables, you can override the queries using `.usersByUsernameQuery(\"SELECT email, password, active FROM ...\")` and `.authoritiesByUsernameQuery(\"SELECT email, role FROM ...\")`."
    ],
    keyPoints: [
      "`JdbcUserDetailsManager` reads user credentials and roles directly from a database.",
      "Operates against a configured `DataSource` bean.",
      "Supports custom table structures via custom SQL queries.",
      "Suitable for standard relational database authentication setups."
    ],
    code: [
      {
        title: "Configuring JdbcUserDetailsManager with Custom SQL",
        language: "java",
        content: `package com.algoguru.config;

import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.JdbcUserDetailsManager;

@Configuration
public class JdbcSecurityConfig {

    @Bean
    public UserDetailsService jdbcUserDetailsService(DataSource dataSource) {
        JdbcUserDetailsManager manager = new JdbcUserDetailsManager(dataSource);
        
        // Custom schema queries
        manager.setUsersByUsernameQuery(
            "SELECT email, password_hash, is_active FROM app_users WHERE email = ?"
        );
        manager.setAuthoritiesByUsernameQuery(
            "SELECT u.email, r.role_name FROM app_users u " +
            "JOIN user_roles r ON u.id = r.user_id WHERE u.email = ?"
        );
        return manager;
    }
}`
      }
    ],
    note: "In modern applications using Spring Data JPA, implementing a custom `UserDetailsService` with your `UserRepository` is usually preferred over raw `JdbcUserDetailsManager`."
  },
  {
    id: "sec-user-details",
    title: "UserDetailsService & UserDetailsManager",
    difficulty: "Medium",
    theory: [
      "The core contract for retrieving user authentication data in Spring Security is the **`UserDetailsService`** interface.",
      "It contains a single method: **`UserDetails loadUserByUsername(String username)`**. When a user attempts to log in, Spring's `DaoAuthenticationProvider` calls this method to retrieve the stored credentials and authorities from your database.",
      "**`UserDetails`** represents the user principal. It exposes: `getUsername()`, `getPassword()`, `getAuthorities()`, `isAccountNonExpired()`, `isAccountNonLocked()`, `isCredentialsNonExpired()`, and `isEnabled()`.",
      "**`UserDetailsManager`** extends `UserDetailsService` by adding mutative operations: `createUser()`, `updateUser()`, `deleteUser()`, and `changePassword()`.",
      "By creating a custom implementation of `UserDetailsService` that injects your Spring Data JPA `UserRepository`, you seamlessly bridge your custom domain user entities into Spring Security's authentication lifecycle."
    ],
    keyPoints: [
      "`UserDetailsService` has one method: `loadUserByUsername(String)`.",
      "`UserDetails` represents the user credentials, status flags, and granted authorities.",
      "`DaoAuthenticationProvider` compares raw entered passwords against the `UserDetails` password hash.",
      "Best approach for custom database schemas using Spring Data JPA."
    ],
    code: [
      {
        title: "Custom UserDetailsService Backed by Spring Data JPA Repository",
        language: "java",
        content: `package com.algoguru.service;

import com.algoguru.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
            .map(user -> new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                user.isActive(),
                true, true, true,
                user.getRoles().stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                    .collect(Collectors.toList())
            ))
            .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }
}`
      }
    ],
    warning: "Never return `null` from `loadUserByUsername`. If the user is not found, always throw `UsernameNotFoundException`."
  },
  {
    id: "sec-password",
    title: "Password Encoding — BCrypt, Argon2",
    difficulty: "Medium",
    theory: [
      "Storing passwords in plain text or using fast hash algorithms (like MD5 or SHA-256) is a severe security vulnerability. Fast hashes allow attackers to execute billions of guesses per second using GPUs and rainbow tables.",
      "Enterprise systems require **Adaptive One-Way Password Hashing Functions** that incorporate an automatic salt and a tunable computational work factor (cost parameter).",
      "**`PasswordEncoder` Implementations**:",
      "1. **`BCryptPasswordEncoder` (Industry Standard)**: Based on the Blowfish cipher. Incorporates an automatic 16-byte random salt and configurable work factor (default `10`, meaning $2^{10} = 1024$ iterations).",
      "2. **`Argon2PasswordEncoder` (Most Secure)**: Winner of the Password Hashing Competition. Designed to be memory-hard, making GPU and ASIC brute-force attacks infeasible.",
      "3. **`DelegatingPasswordEncoder`**: Spring Security's default encoder. Prefixes stored hashes with an identifier (e.g. `{bcrypt}$2a$10$...` or `{argon2}...`), allowing applications to upgrade password hashing algorithms over time without resetting user passwords."
    ],
    keyPoints: [
      "Never store plain-text passwords or use fast hashes (MD5, SHA-256).",
      "`BCryptPasswordEncoder` is the standard; `Argon2` is state-of-the-art memory-hard.",
      "Includes automatic per-password salting to defeat rainbow table attacks.",
      "`DelegatingPasswordEncoder` prefixes hashes with the algorithm id (`{bcrypt}`)."
    ],
    code: [
      {
        title: "Declaring and Using a BCryptPasswordEncoder Bean",
        language: "java",
        content: `package com.algoguru.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Strength/cost factor of 12 (4096 rounds of key expansion)
        return new BCryptPasswordEncoder(12);
    }
}

// In your RegistrationService:
// String rawPassword = "UserSecret123!";
// String hash = passwordEncoder.encode(rawPassword);
// boolean matches = passwordEncoder.matches(enteredPassword, storedHash);`
      }
    ],
    tip: "A BCrypt work factor of 10 to 12 provides a balanced trade-off between authentication security and CPU consumption under high traffic."
  },
  {
    id: "sec-jwt",
    title: "JWT Authentication",
    difficulty: "Hard",
    theory: [
      "In modern stateless microservices and single-page applications (React, Angular), session-based state stored in server memory does not scale horizontally. **JWT (JSON Web Token — RFC 7519)** provides a stateless, cryptographically verifiable token architecture.",
      "A JWT consists of three base64url-encoded parts separated by dots: **`Header.Payload.Signature`**.",
      "- **Header**: Specifies the token type (`JWT`) and signing algorithm (`HS256`, `RS256`).",
      "- **Payload (Claims)**: Contains statements about the entity (e.g. `sub` (subject/username), `exp` (expiration timestamp), `roles`).",
      "- **Signature**: Created by hashing the header and payload with a secret key (HMAC) or private key (RSA). The server verifies this signature without querying a database or session store.",
      "**Implementation Flow**:",
      "1. User logs in at `/api/auth/login` with username and password.",
      "2. Server validates credentials and generates a signed JWT access token (short TTL, e.g. 15 minutes) and a refresh token (longer TTL, e.g. 7 days).",
      "3. Client stores token and attaches it to subsequent requests in the `Authorization: Bearer <token>` header.",
      "4. A custom **`OncePerRequestFilter`** (`JwtAuthenticationFilter`) interceptor extracts the token, verifies the cryptographic signature, parses claims, constructs an `UsernamePasswordAuthenticationToken`, and populates `SecurityContextHolder`."
    ],
    keyPoints: [
      "JWT enables stateless authentication across horizontally scaled microservices.",
      "Consists of three parts: `Header.Payload.Signature`.",
      "Verified on every request via a custom `OncePerRequestFilter` before `AuthorizationFilter`.",
      "Use short-lived Access Tokens (15 min) paired with revocable Refresh Tokens."
    ],
    code: [
      {
        title: "OncePerRequestFilter Implementing JWT Verification",
        language: "java",
        content: `package com.algoguru.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);
            if (tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUsernameFromToken(jwt);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                var authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        filterChain.doFilter(request, response);
    }
}`
      }
    ],
    warning: "Never store sensitive information (passwords, social security numbers, API keys) inside the JWT payload claims. The payload is merely base64-encoded and can be decoded and read by anyone."
  },
  {
    id: "sec-oauth2",
    title: "OAuth 2.0 & OpenID Connect",
    difficulty: "Hard",
    theory: [
      "**OAuth 2.0 (RFC 6749)** is an industry-standard authorization framework that enables third-party applications to obtain limited access to an HTTP service on behalf of a resource owner without sharing user passwords.",
      "**OpenID Connect (OIDC)** is an identity layer built directly on top of OAuth 2.0 that adds standardized **Authentication**. OAuth 2.0 issues an Access Token (for authorization); OIDC additionally issues an **ID Token** (a JWT containing user profile identity data).",
      "**Key Actors**:",
      "- **Resource Owner**: The end user who grants access.",
      "- **Client**: The application requesting access (your Spring Boot app).",
      "- **Authorization Server**: The identity provider (Google, GitHub, Keycloak, Auth0).",
      "- **Resource Server**: The API holding protected resources.",
      "**Authorization Code Flow with PKCE (Proof Key for Code Exchange)**:",
      "The most secure flow for web applications. The client redirects the user to the Authorization Server to log in. The server redirects back with an authorization code, which the client exchanges via a back-channel POST request for an Access Token and ID Token.",
      "In Spring Boot, adding `spring-boot-starter-oauth2-client` or `spring-boot-starter-oauth2-resource-server` handles this entire handshake and token validation pipeline automatically."
    ],
    keyPoints: [
      "OAuth 2.0 handles delegated authorization; OIDC adds authentication and ID Tokens.",
      "Authorization Code Flow with PKCE is the gold standard for secure logins.",
      "Spring Boot supports both OAuth2 Client (login via Google/GitHub) and OAuth2 Resource Server.",
      "Resource Servers validate incoming JWTs against the Authorization Server's JWKS endpoint."
    ],
    code: [
      {
        title: "Spring Boot OAuth2 Resource Server Configuration",
        language: "yaml",
        content: `# application.yml: Configure Spring Boot as an OAuth2 Resource Server (e.g. Keycloak or Auth0)
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.algoguru.com/realms/algoguru-realm
          # Spring Boot automatically downloads public keys from the JWKS endpoint!

---
# Java SecurityFilterChain:
# http.oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));`
      }
    ],
    tip: "Use Keycloak or an external IdP (Identity Provider) in enterprise architectures rather than implementing your own OAuth 2.0 authorization server from scratch."
  },
  {
    id: "sec-method",
    title: "Method-Level Security — @PreAuthorize, @Secured",
    difficulty: "Medium",
    theory: [
      "While URL-based security in `SecurityFilterChain` restricts web access at the HTTP boundary, **Method-Level Security** protects business logic inside services and repositories regardless of how they are invoked.",
      "**Setup**: Enable method security by adding **`@EnableMethodSecurity`** to a configuration class (in Spring Security 6, this replaces the older `@EnableGlobalMethodSecurity`).",
      "**Annotations**:",
      "1. **`@PreAuthorize` (Recommended)**: Evaluates a Spring Expression Language (SpEL) expression **before** the method executes. If false, access is denied immediately with an `AccessDeniedException`.",
      "   Examples: `@PreAuthorize(\"hasRole('ADMIN')\")`, `@PreAuthorize(\"hasAuthority('COURSE_WRITE')\")`, `@PreAuthorize(\"#username == authentication.name or hasRole('ADMIN')\")`.",
      "2. **`@PostAuthorize`**: Evaluates the expression **after** the method executes, allowing verification of the returned object: `@PostAuthorize(\"returnObject.owner == authentication.name\")`.",
      "3. **`@Secured`**: Older legacy annotation; accepts a simple string array of roles without SpEL support.",
      "4. **`@PreFilter` / `@PostFilter`**: Automatically filters elements in or out of collections based on security rules."
    ],
    keyPoints: [
      "Requires `@EnableMethodSecurity` at configuration level.",
      "`@PreAuthorize` evaluates SpEL expressions before method execution.",
      "Can reference method parameters (`#id`) and the current user (`authentication.name`).",
      "`@PostAuthorize` inspects the method return value (`returnObject`)."
    ],
    code: [
      {
        title: "Method Security with SpEL Checking Parameter and Ownership",
        language: "java",
        content: `package com.algoguru.service;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
class MethodSecurityConfig {}

@Service
public class DocumentService {

    // Only administrators or the user who owns the document can edit it
    @PreAuthorize("hasRole('ADMIN') or #ownerUsername == authentication.name")
    public void editDocument(Long documentId, String ownerUsername, String content) {
        // Business logic...
    }

    @PreAuthorize("hasAuthority('EXPORT_REPORTS')")
    public byte[] generateAuditReport() {
        return new byte[0];
    }
}`
      }
    ],
    tip: "Method security works via Spring AOP proxies. Calling a `@PreAuthorize` method internally from within the same class (`this.editDocument(...)`) bypasses security checks."
  },
  {
    id: "sec-csrf",
    title: "CSRF Protection",
    difficulty: "Medium",
    theory: [
      "**CSRF (Cross-Site Request Forgery)** is an attack where an untrusted third-party site tricks an authenticated user's browser into executing unwanted actions on a trusted web application where the user has an active session cookie.",
      "**Synchronizer Token Pattern**:",
      "Spring Security defends against CSRF using the Synchronizer Token Pattern. The server generates a random, cryptographically unpredictable CSRF token associated with the session. When state-modifying requests (`POST`, `PUT`, `DELETE`, `PATCH`) are submitted, the client must include this token in an HTTP header (`X-XSRF-TOKEN` or `X-CSRF-TOKEN`) or form parameter. Requests lacking a valid token are rejected with `403 Forbidden`.",
      "**When to Disable CSRF**:",
      "CSRF attacks rely exclusively on browsers automatically appending stored session cookies (or HTTP Basic credentials). If your backend is a **Stateless REST API using Bearer JWT tokens**, the browser does not automatically send tokens. Therefore, **disabling CSRF via `http.csrf(csrf -> csrf.disable())` is safe and standard practice for stateless REST services**.",
      "However, if your application uses cookies for authentication or renders server-side HTML templates (Thymeleaf), CSRF protection **must remain enabled**."
    ],
    keyPoints: [
      "CSRF exploits automatic browser cookie transmission from untrusted origins.",
      "Spring Security enables CSRF protection by default using the Synchronizer Token pattern.",
      "Stateless REST APIs using JWT Bearer authentication should safely disable CSRF.",
      "Web applications using session cookies must keep CSRF enabled."
    ],
    code: [
      {
        title: "Disabling CSRF for Stateless REST vs Enabling Cookie-Based CSRF for SPA",
        language: "java",
        content: `// 1. For Stateless REST APIs with JWT:
http.csrf(csrf -> csrf.disable())

// 2. For Cookie-based Single Page Applications (Angular/React):
http.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
    // Writes XSRF-TOKEN cookie readable by JavaScript frontends
)`
      }
    ],
    warning: "Never disable CSRF on an application that uses session cookies for authentication, or you expose your users to one-click account takeover attacks."
  },
  {
    id: "sec-cors",
    title: "CORS in Security",
    difficulty: "Medium",
    theory: [
      "When integrating a frontend application (e.g. running on `localhost:3000`) with a Spring Security backend, developers frequently encounter CORS errors.",
      "**Why Security Filter Order Matters**:",
      "Browser CORS preflight `OPTIONS` requests do **not** contain authentication credentials (no Authorization header, no cookies). If Spring Security's authorization filter evaluates the `OPTIONS` request before CORS processing takes place, it rejects the preflight with `401 Unauthorized` or `403 Forbidden`, blocking the frontend.",
      "To resolve this, Spring Security provides a dedicated **`CorsFilter`** that must execute **before** authentication filters.",
      "Enabling CORS in Spring Security 6:",
      "1. Configure `http.cors(Customizer.withDefaults())` inside `SecurityFilterChain`.",
      "2. Provide a **`CorsConfigurationSource`** bean specifying allowed origins, methods, and headers."
    ],
    keyPoints: [
      "Preflight `OPTIONS` requests contain no authentication credentials.",
      "CORS filters must execute before authentication filters in the security chain.",
      "Configure via `http.cors(Customizer.withDefaults())` and declare a `CorsConfigurationSource` bean.",
      "Always expose custom headers (e.g. `Authorization`, `X-Total-Count`) via `exposedHeaders`."
    ],
    code: [
      {
        title: "Complete Spring Security CORS Integration",
        language: "java",
        content: `package com.algoguru.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;
import java.util.List;

@Configuration
public class SecurityCorsConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults()) // Integrates CorsConfigurationSource
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000", "https://algoguru.com"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}`
      }
    ],
    tip: "Configuring a `CorsConfigurationSource` bean handles CORS for both Spring Security and Spring MVC simultaneously."
  },
  {
    id: "sec-rbac",
    title: "Role-Based Access Control",
    difficulty: "Medium",
    theory: [
      "**RBAC (Role-Based Access Control)** assigns permissions to specific roles (e.g., `ROLE_STUDENT`, `ROLE_INSTRUCTOR`, `ROLE_ADMIN`), and users are assigned one or more roles.",
      "**Roles vs Authorities in Spring Security**:",
      "- An **Authority** (Privilege) is a granular permission to perform a specific action (e.g. `COURSE_READ`, `USER_DELETE`).",
      "- A **Role** is a higher-level group of authorities. By Spring Security convention, roles are internally prefixed with **`ROLE_`**.",
      "- Method `.hasRole(\"ADMIN\")` looks for the authority `ROLE_ADMIN`.",
      "- Method `.hasAuthority(\"COURSE_READ\")` checks for the exact string `COURSE_READ` without prefixing.",
      "**Hierarchical Roles (`RoleHierarchy`)**:",
      "In enterprise systems, roles naturally form hierarchies (e.g., `ROLE_ADMIN` should implicitly have all permissions of `ROLE_INSTRUCTOR` and `ROLE_STUDENT`). Without role hierarchies, you must attach every individual role to the admin user. Spring Security allows defining a `RoleHierarchy` bean to express this relationship cleanly."
    ],
    keyPoints: [
      "Roles are coarse-grained (`ROLE_ADMIN`); Authorities are fine-grained (`USER_WRITE`).",
      "`.hasRole(\"X\")` automatically checks for `ROLE_X`.",
      "`.hasAuthority(\"X\")` checks for exact literal match `X`.",
      "Use `RoleHierarchy` to define role inheritance (`ROLE_ADMIN > ROLE_INSTRUCTOR > ROLE_STUDENT`)."
    ],
    code: [
      {
        title: "RoleHierarchy Bean Definition and Usage",
        language: "java",
        content: `package com.algoguru.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;

@Configuration
public class RoleHierarchyConfig {

    @Bean
    public RoleHierarchy roleHierarchy() {
        // ADMIN inherits INSTRUCTOR, which inherits STUDENT
        return RoleHierarchyImpl.fromHierarchy("""
            ROLE_ADMIN > ROLE_INSTRUCTOR
            ROLE_INSTRUCTOR > ROLE_STUDENT
        """);
    }
}`
      }
    ],
    tip: "Prefer fine-grained authorities (`hasAuthority('COURSE_PUBLISH')`) in business code rather than hardcoding roles (`hasRole('ADMIN')`). This makes permission management configurable without code changes."
  },
  {
    id: "sec-ldap",
    title: "LDAP Authentication",
    difficulty: "Hard",
    theory: [
      "**LDAP (Lightweight Directory Access Protocol)** is an enterprise application protocol used to query and manage centralized directory services (such as Microsoft Active Directory, OpenLDAP, or Apache Directory Server).",
      "In large corporations, employee credentials, organizational units (OUs), and group memberships reside in an LDAP directory.",
      "Spring Security supports LDAP authentication via **`spring-security-ldap`**.",
      "**Authentication Mechanism**:",
      "1. **Bind Authentication**: Spring Security attempts to bind (log in) to the LDAP server directly using the user's entered Distinguished Name (DN) and password.",
      "2. **Search and Bind**: If the exact user DN is unknown, Spring Security binds with an administrative service account, searches the directory for the user by email or sAMAccountName, and then attempts to bind with the discovered DN and user password.",
      "3. **Authorities Mapping**: Group memberships in LDAP (e.g., `CN=Engineering,OU=Groups,DC=corp`) are retrieved and mapped into Spring Security `GrantedAuthority` records."
    ],
    keyPoints: [
      "Integrates with enterprise directories (Active Directory, OpenLDAP).",
      "Requires `spring-security-ldap` dependency.",
      "Supports Bind Authentication and Search-and-Bind patterns.",
      "Maps LDAP organizational groups into Spring Security roles."
    ],
    code: [
      {
        title: "Configuring Embedded or Remote LDAP Authentication",
        language: "java",
        content: `package com.algoguru.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.ldap.authentication.LdapAuthenticationProvider;
import org.springframework.security.ldap.authentication.BindAuthenticator;
import org.springframework.security.ldap.DefaultSpringSecurityContextSource;
import org.springframework.security.ldap.userdetails.DefaultLdapAuthoritiesPopulator;

@Configuration
public class LdapConfig {

    @Bean
    public DefaultSpringSecurityContextSource contextSource() {
        return new DefaultSpringSecurityContextSource("ldap://corp-directory.internal:389/dc=algoguru,dc=com");
    }

    @Bean
    public LdapAuthenticationProvider ldapAuthenticationProvider(DefaultSpringSecurityContextSource contextSource) {
        BindAuthenticator authenticator = new BindAuthenticator(contextSource);
        authenticator.setUserDnPatterns(new String[] { "uid={0},ou=people" });

        DefaultLdapAuthoritiesPopulator authoritiesPopulator = 
            new DefaultLdapAuthoritiesPopulator(contextSource, "ou=groups");
        authoritiesPopulator.setGroupRoleAttribute("cn");
        authoritiesPopulator.setRolePrefix("ROLE_");

        return new LdapAuthenticationProvider(authenticator, authoritiesPopulator);
    }
}`
      }
    ],
    note: "Modern cloud-native architectures frequently replace direct LDAP connections with SAML 2.0 or OIDC federation against Okta, Azure AD, or PingFederate."
  }
];
