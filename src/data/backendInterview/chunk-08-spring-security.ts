import { defineBackendChunk } from "./contract";

/**
 * Spring Security — complete theory (b107–b124).
 */
export const chunk08SpringSecurity = defineBackendChunk({
  topic: "spring-security",
  questions: [
    {
      id: "b107",
      question: "Explain the Spring Security architecture and the filter chain end to end.",
      answer:
        "Spring Security is, fundamentally, **a chain of servlet filters**. Everything else is detail.\n\n" +
        "The plumbing:\n\n" +
        "1. **`DelegatingFilterProxy`** — a standard servlet filter registered in the container. It does nothing itself; it looks up a Spring bean named `springSecurityFilterChain` and delegates. This is the bridge from the servlet world into the Spring context, so security filters can be normal beans with dependencies injected.\n" +
        "2. **`FilterChainProxy`** — that bean. It holds a **list of `SecurityFilterChain`s**, each with a `RequestMatcher`. For each request it picks the **first matching chain** and runs only that chain's filters. This is why chain order matters and why a broad matcher placed first will shadow everything after it.\n" +
        "3. **The `SecurityFilterChain`** — an ordered list of filters, roughly:\n\n" +
        "- `DisableEncodeUrlFilter`, `WebAsyncManagerIntegrationFilter`\n" +
        "- **`SecurityContextHolderFilter`** — loads any existing `SecurityContext` and, crucially, **clears it in a `finally`** so nothing leaks to the next request on a pooled thread.\n" +
        "- `HeaderWriterFilter` — security headers (HSTS, X-Content-Type-Options, frame options).\n" +
        "- `CorsFilter`, then **`CsrfFilter`**.\n" +
        "- `LogoutFilter`.\n" +
        "- **Authentication filters** — `UsernamePasswordAuthenticationFilter`, `BearerTokenAuthenticationFilter`, `OAuth2LoginAuthenticationFilter`, `BasicAuthenticationFilter`, or your own.\n" +
        "- `RequestCacheAwareFilter`, `SecurityContextHolderAwareRequestFilter`, `AnonymousAuthenticationFilter` (which assigns an `AnonymousAuthenticationToken` so 'unauthenticated' is still an `Authentication`).\n" +
        "- **`ExceptionTranslationFilter`** — wraps the rest in try/catch and converts `AuthenticationException` → `AuthenticationEntryPoint` (401 / redirect to login) and `AccessDeniedException` → `AccessDeniedHandler` (403).\n" +
        "- **`AuthorizationFilter`** (Spring Security 6; formerly `FilterSecurityInterceptor`) — **last**, and it makes the authorize decision.\n\n" +
        "**The mental model to state:** authentication filters populate the `SecurityContext`; `AuthorizationFilter` at the end of the chain decides; `ExceptionTranslationFilter` sits between them to turn exceptions into HTTP responses. Debug the order with `logging.level.org.springframework.security=DEBUG`, which prints the whole chain at startup.",
      code: `import org.springframework.context.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity(debug = false)     // debug=true prints the full filter chain
public class FilterChainArchitecture {

    /**
     * Chain 1: the API. securityMatcher restricts this chain to /api/**.
     * FilterChainProxy picks the FIRST matching chain, so order is significant.
     */
    @Bean
    @Order(1)
    SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/api/**")
            .csrf(csrf -> csrf.disable())                       // token auth, no cookies
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> res.sendError(401, "unauthenticated"))
                .accessDeniedHandler((req, res, e) -> res.sendError(403, "forbidden")))
            .build();
    }

    /**
     * Chain 2: the browser-facing UI. Sessions and CSRF stay ON here.
     */
    @Bean
    @Order(2)
    SecurityFilterChain webChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login", "/css/**", "/js/**").permitAll()
                .anyRequest().authenticated())
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/dashboard", true)
                .failureUrl("/login?error"))
            .logout(logout -> logout
                .logoutUrl("/logout")
                .deleteCookies("JSESSIONID")
                .invalidateHttpSession(true))
            .sessionManagement(s -> s
                .sessionFixation(fix -> fix.changeSessionId())   // default, prevents fixation
                .maximumSessions(1).maxSessionsPreventsLogin(false))
            .headers(h -> h
                .frameOptions(f -> f.sameOrigin())
                .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000)))
            .build();
    }

    /**
     * Chain 3: static assets and health - no security filters run at all.
     * Faster than permitAll(), which still walks the whole chain.
     */
    @Bean
    @Order(0)
    SecurityFilterChain assetChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/actuator/health/**", "/favicon.ico", "/static/**")
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .csrf(csrf -> csrf.disable())
            .securityContext(ctx -> ctx.disable())
            .sessionManagement(s -> s.disable())
            .build();
    }
}`,
      codeLanguage: "java",
      explanation:
        "DelegatingFilterProxy to FilterChainProxy to the first matching SecurityFilterChain; authenticate early, translate exceptions, authorize last.",
      followUps: [
        "Why does the order of SecurityFilterChain beans matter?",
        "Where exactly does ExceptionTranslationFilter sit and why?",
      ],
    },
    {
      id: "b108",
      question: "Authentication vs authorization — trace a login through AuthenticationManager and its providers.",
      answer:
        "**Authentication = who are you.** **Authorization = what may you do.** In Spring Security they are cleanly separated: filters authenticate, `AuthorizationManager` authorizes.\n\n" +
        "The authentication collaborators:\n\n" +
        "- **`Authentication`** — both the *request* for authentication and the *result*. Holds `principal`, `credentials`, `authorities` and `authenticated`. Implementations: `UsernamePasswordAuthenticationToken`, `JwtAuthenticationToken`, `AnonymousAuthenticationToken`.\n" +
        "- **`AuthenticationManager`** — one method, `authenticate(Authentication) throws AuthenticationException`. The contract: return a **fully populated** `Authentication`, throw if it can prove the credentials are bad, or return `null` if it cannot decide.\n" +
        "- **`ProviderManager`** — the standard implementation. It holds a **list of `AuthenticationProvider`s** and asks each one that `supports()` the token type, stopping at the first success. It can also delegate to a **parent** manager. On success it **erases credentials** from the result (`eraseCredentials`).\n" +
        "- **`AuthenticationProvider`** — the pluggable unit: `DaoAuthenticationProvider` (database), `JwtAuthenticationProvider`, `LdapAuthenticationProvider`, or your own for an API key or OTP.\n\n" +
        "The flow for a form login:\n\n" +
        "1. `UsernamePasswordAuthenticationFilter` extracts username/password and builds an **unauthenticated** token.\n" +
        "2. It calls `AuthenticationManager.authenticate(token)`.\n" +
        "3. `ProviderManager` → `DaoAuthenticationProvider` → `UserDetailsService.loadUserByUsername` → `PasswordEncoder.matches(raw, encoded)` → account checks (expired, locked, disabled) via `UserDetailsChecker`.\n" +
        "4. On success it builds an **authenticated** token carrying the authorities.\n" +
        "5. The filter stores it via `SecurityContextRepository` and fires `AuthenticationSuccessEvent`; on failure, `AuthenticationFailureBadCredentialsEvent`.\n\n" +
        "**Two details interviewers like:** `DaoAuthenticationProvider` runs the password encoder even when the user does not exist, to prevent **timing-based user enumeration**; and `BadCredentialsException` is deliberately used for both 'no such user' and 'wrong password'.",
      code: `import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.event.*;
import org.springframework.security.core.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.*;

/** A custom provider: API-key authentication alongside the usual username/password. */
@Component
class ApiKeyAuthenticationProvider implements AuthenticationProvider {

    private final ApiKeyStore store;
    ApiKeyAuthenticationProvider(ApiKeyStore store) { this.store = store; }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String key = (String) authentication.getCredentials();
        ApiKey found = store.findActive(key)
            .orElseThrow(() -> new BadCredentialsException("invalid api key"));
        if (found.expired()) throw new CredentialsExpiredException("api key expired");

        List<GrantedAuthority> authorities = found.scopes().stream()
            .map(s -> (GrantedAuthority) new SimpleGrantedAuthority("SCOPE_" + s))
            .toList();

        // Returning an AUTHENTICATED token (3-arg constructor sets authenticated=true).
        return new ApiKeyAuthenticationToken(found.clientId(), authorities);
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return ApiKeyAuthenticationToken.class.isAssignableFrom(authentication);
    }
}

class ApiKeyAuthenticationToken extends AbstractAuthenticationToken {
    private final Object principal;
    ApiKeyAuthenticationToken(Object principal, Collection<? extends GrantedAuthority> auth) {
        super(auth);
        this.principal = principal;
        setAuthenticated(true);
    }
    @Override public Object getCredentials() { return null; }   // erased
    @Override public Object getPrincipal() { return principal; }
}

record ApiKey(String clientId, Set<String> scopes, boolean expired) { }
interface ApiKeyStore { Optional<ApiKey> findActive(String key); }

/** Wiring several providers behind one ProviderManager. */
@org.springframework.context.annotation.Configuration
class AuthenticationConfig {

    @org.springframework.context.annotation.Bean
    AuthenticationManager authenticationManager(UserDetailsService uds,
                                                PasswordEncoder encoder,
                                                ApiKeyAuthenticationProvider apiKeyProvider) {
        DaoAuthenticationProvider dao = new DaoAuthenticationProvider();
        dao.setUserDetailsService(uds);
        dao.setPasswordEncoder(encoder);
        dao.setHideUserNotFoundExceptions(true);     // no user enumeration

        ProviderManager manager = new ProviderManager(List.of(dao, apiKeyProvider));
        manager.setEraseCredentialsAfterAuthentication(true);
        return manager;
    }
}

/** Auditing: every success and failure is published as an application event. */
@Component
class AuthenticationAuditListener {

    @EventListener
    public void onSuccess(AuthenticationSuccessEvent event) {
        System.out.println("LOGIN OK " + event.getAuthentication().getName());
    }

    @EventListener
    public void onFailure(AbstractAuthenticationFailureEvent event) {
        // Feed this into lockout / rate limiting.
        System.out.println("LOGIN FAIL " + event.getAuthentication().getName()
            + " reason=" + event.getException().getClass().getSimpleName());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Filter builds an unauthenticated token, ProviderManager asks each supporting AuthenticationProvider, and the result populates the SecurityContext.",
      followUps: [
        "Why does DaoAuthenticationProvider hash a password even for a non-existent user?",
        "When would you write a custom AuthenticationProvider instead of a filter?",
      ],
    },
    {
      id: "b109",
      question: "What is SecurityContextHolder, how is it stored, and what breaks with async code?",
      answer:
        "`SecurityContextHolder` is the **static access point** to the current `SecurityContext`, which wraps the current `Authentication`. It is a `ThreadLocal` by default.\n\n" +
        "Three strategies:\n\n" +
        "- **`MODE_THREADLOCAL`** (default) — one context per thread.\n" +
        "- **`MODE_INHERITABLETHREADLOCAL`** — child threads inherit it at creation. Useful for `@Async`, but dangerous with **pooled** threads because a pooled thread was created once, long ago, and inherits whatever was current then.\n" +
        "- **`MODE_GLOBAL`** — one context for the whole JVM. Desktop apps only.\n\n" +
        "Persistence across requests is a **separate** concern, handled by `SecurityContextRepository`:\n\n" +
        "- `HttpSessionSecurityContextRepository` — the stateful default, stores it in the session.\n" +
        "- `NullSecurityContextRepository` — stateless APIs; nothing is saved.\n" +
        "- `RequestAttributeSecurityContextRepository`, `DelegatingSecurityContextRepository`.\n\n" +
        "In Spring Security 6 the retrieval moved to `SecurityContextHolderFilter`, and **saving is no longer automatic** — an authentication filter must explicitly call `securityContextRepository.saveContext(...)`. That migration detail trips a lot of people upgrading.\n\n" +
        "What breaks:\n\n" +
        "- **`@Async` / `CompletableFuture` / raw threads** — the new thread has no context. Fix with `DelegatingSecurityContextAsyncTaskExecutor`, `DelegatingSecurityContextRunnable/Callable`, or `SecurityContextHolder.setContext(...)` in a `TaskDecorator`.\n" +
        "- **Reactive (WebFlux)** — `ThreadLocal` is meaningless when the chain hops threads. WebFlux uses `ReactiveSecurityContextHolder`, which reads from the **Reactor `Context`**, not a thread local.\n" +
        "- **Virtual threads** — fine in principle, but `ThreadLocal`-heavy code scales poorly; `ScopedValue` is the future direction.\n" +
        "- **Leaks** — always clear it in a `finally`. The framework does; hand-rolled code often does not, and a pooled thread then serves the next request as the previous user.",
      code: `import org.springframework.security.concurrent.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.context.annotation.*;
import reactor.core.publisher.Mono;

import java.util.concurrent.*;

@Configuration
class SecurityContextPropagation {

    /** Reading the current user - the standard idiom. */
    static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return "anonymous";
        return auth.getName();
    }

    /** Setting it manually (e.g. in a custom filter or a system job). */
    static void runAs(Authentication authentication, Runnable action) {
        SecurityContext previous = SecurityContextHolder.getContext();
        try {
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            action.run();
        } finally {
            SecurityContextHolder.setContext(previous);   // ALWAYS restore
        }
    }

    /** @Async: wrap the executor so the context travels to the worker thread. */
    @Bean
    Executor securityAwareExecutor() {
        ThreadPoolTaskExecutor delegate = new ThreadPoolTaskExecutor();
        delegate.setCorePoolSize(8);
        delegate.setMaxPoolSize(16);
        delegate.setQueueCapacity(100);
        delegate.setThreadNamePrefix("sec-async-");
        delegate.initialize();
        return new DelegatingSecurityContextAsyncTaskExecutor(delegate);
    }

    /** Manual wrapping for one-off tasks. */
    static void submitWithContext(ExecutorService pool) {
        Runnable task = () -> System.out.println("running as " + currentUsername());
        pool.submit(new DelegatingSecurityContextRunnable(task));

        Callable<String> callable = SecurityContextPropagation::currentUsername;
        pool.submit(new DelegatingSecurityContextCallable<>(callable));
    }

    /** BROKEN: a raw thread sees no context at all. */
    static void broken() {
        new Thread(() -> System.out.println(currentUsername())).start();  // "anonymous"
    }

    /** WebFlux: the context lives in the Reactor Context, not a ThreadLocal. */
    static Mono<String> reactiveCurrentUser() {
        return ReactiveSecurityContextHolder.getContext()
            .map(SecurityContext::getAuthentication)
            .map(Authentication::getName)
            .defaultIfEmpty("anonymous");
    }
}

/** A custom filter in Spring Security 6 must SAVE the context explicitly. */
class ExplicitSaveFilter extends org.springframework.web.filter.OncePerRequestFilter {

    private final org.springframework.security.web.context.SecurityContextRepository repo =
        new org.springframework.security.web.context.HttpSessionSecurityContextRepository();

    @Override
    protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request,
                                    jakarta.servlet.http.HttpServletResponse response,
                                    jakarta.servlet.FilterChain chain)
            throws jakarta.servlet.ServletException, java.io.IOException {
        try {
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            // context.setAuthentication(authenticateSomehow(request));
            SecurityContextHolder.setContext(context);
            repo.saveContext(context, request, response);   // NOT automatic in 6.x
            chain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();           // never leak to the next request
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "It is a ThreadLocal, so async, pooled and reactive code loses it — wrap executors, use ReactiveSecurityContextHolder, and always clear it.",
      followUps: [
        "Why is MODE_INHERITABLETHREADLOCAL unsafe with a thread pool?",
        "What changed about saving the context in Spring Security 6?",
      ],
    },
    {
      id: "b110",
      question: "How do UserDetailsService, UserDetails and GrantedAuthority fit together?",
      answer:
        "These three interfaces are the **user-data contract** between your domain model and Spring Security.\n\n" +
        "**`UserDetailsService`** — a single method, `loadUserByUsername(String) throws UsernameNotFoundException`. Its only job is to fetch the user. It does **not** check the password; `DaoAuthenticationProvider` does that afterwards. Implement it over JPA, LDAP, a cache or a remote call.\n\n" +
        "**`UserDetails`** — what it returns: `getUsername()`, `getPassword()` (the **encoded** hash, never plaintext), `getAuthorities()`, plus four boolean flags — `isAccountNonExpired`, `isAccountNonLocked`, `isCredentialsNonExpired`, `isEnabled`. All four are checked by `UserDetailsChecker` and each maps to a distinct exception (`AccountExpiredException`, `LockedException`, `CredentialsExpiredException`, `DisabledException`).\n\n" +
        "**`GrantedAuthority`** — a single string permission. The convention:\n\n" +
        "- **Roles** are prefixed `ROLE_` (`ROLE_ADMIN`). `hasRole(\"ADMIN\")` adds the prefix for you; `hasAuthority(\"ROLE_ADMIN\")` does not. Mixing these up is the most common authorization bug.\n" +
        "- **Scopes** from OAuth2 are prefixed `SCOPE_` by default.\n\n" +
        "**The strongly recommended pattern:** implement `UserDetails` on a **dedicated adapter** that *wraps* your JPA entity rather than on the entity itself. Reasons: the entity would leak the password hash everywhere; Hibernate lazy-loading of authorities fails outside a transaction (`LazyInitializationException` during authentication); and it couples your persistence model to a security framework. Fetch the roles eagerly in the query (`JOIN FETCH`) and build an immutable adapter.\n\n" +
        "Round it out: `UserDetailsManager` adds create/update/delete/changePassword; `InMemoryUserDetailsManager` and `JdbcUserDetailsManager` are the built-ins; `User.withUsername(...)` is the convenient builder.",
      code: `import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "app_user")
class AppUser {
    @Id @GeneratedValue Long id;
    @Column(unique = true, nullable = false) String email;
    @Column(nullable = false) String passwordHash;
    boolean enabled = true;
    boolean locked = false;
    Instant credentialsChangedAt = Instant.now();

    @ElementCollection(fetch = FetchType.EAGER)     // eager: avoids lazy-init at login
    @CollectionTable(name = "user_authority")
    Set<String> authorities = new HashSet<>();
}

interface AppUserRepository extends org.springframework.data.jpa.repository.JpaRepository<AppUser, Long> {
    @org.springframework.data.jpa.repository.Query(
        "select u from AppUser u left join fetch u.authorities where u.email = :email")
    Optional<AppUser> findByEmailWithAuthorities(String email);
}

/**
 * ADAPTER - do NOT implement UserDetails on the entity itself.
 * Immutable, no Hibernate proxy, no password leaking into the domain model.
 */
record SecurityUser(Long id, String email, String passwordHash,
                    Collection<? extends GrantedAuthority> authorities,
                    boolean enabled, boolean locked, boolean credentialsExpired)
        implements UserDetails {

    static SecurityUser from(AppUser user) {
        List<GrantedAuthority> granted = user.authorities.stream()
            .map(a -> (GrantedAuthority) new SimpleGrantedAuthority(
                a.startsWith("ROLE_") || a.startsWith("SCOPE_") ? a : "ROLE_" + a))
            .toList();
        boolean expired = user.credentialsChangedAt
            .isBefore(Instant.now().minus(java.time.Duration.ofDays(90)));
        return new SecurityUser(user.id, user.email, user.passwordHash,
            granted, user.enabled, user.locked, expired);
    }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String getPassword()                 { return passwordHash; }
    @Override public String getUsername()                 { return email; }
    @Override public boolean isAccountNonExpired()        { return true; }
    @Override public boolean isAccountNonLocked()         { return !locked; }
    @Override public boolean isCredentialsNonExpired()    { return !credentialsExpired; }
    @Override public boolean isEnabled()                  { return enabled; }
}

@Service
class DatabaseUserDetailsService implements UserDetailsService {

    private final AppUserRepository repository;
    DatabaseUserDetailsService(AppUserRepository repository) { this.repository = repository; }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return repository.findByEmailWithAuthorities(email)
            .map(SecurityUser::from)
            // Message must stay generic - never reveal whether the account exists.
            .orElseThrow(() -> new UsernameNotFoundException("bad credentials"));
    }
}

/** The quick builder, for tests and bootstrapping. */
class InMemoryExample {
    UserDetailsService users(org.springframework.security.crypto.password.PasswordEncoder enc) {
        UserDetails admin = User.withUsername("admin")
            .password(enc.encode("admin-pass"))
            .roles("ADMIN", "USER")                  // "roles" adds the ROLE_ prefix
            .build();
        UserDetails service = User.withUsername("svc")
            .password(enc.encode("svc-pass"))
            .authorities("SCOPE_orders:read")        // "authorities" does NOT add a prefix
            .build();
        return new InMemoryUserDetailsManager(admin, service);
    }
}`,
      codeLanguage: "java",
      explanation:
        "UserDetailsService only loads the user; wrap the entity in an immutable UserDetails adapter and remember the ROLE_ prefix convention.",
      followUps: [
        "Why not implement UserDetails directly on the JPA entity?",
        "What is the difference between hasRole and hasAuthority?",
      ],
    },
    {
      id: "b111",
      question: "How should passwords be stored? Explain PasswordEncoder, BCrypt and DelegatingPasswordEncoder.",
      answer:
        "Never store plaintext, never use a plain fast hash (MD5, SHA-256) even with a salt. Password hashing must be **deliberately slow and memory-hard** so an attacker with the leaked database cannot brute-force it.\n\n" +
        "`PasswordEncoder` has three methods: `encode(raw)`, `matches(raw, encoded)`, and `upgradeEncoding(encoded)`.\n\n" +
        "The algorithms:\n\n" +
        "- **BCrypt** — the pragmatic default. Blowfish-based, includes a **random 16-byte salt inside the output string** (`$2a$10$<22-char salt><31-char hash>`), so no separate salt column. Cost factor is a power of two (`2^strength` iterations); **10–12** is current practice. Note the **72-byte input limit** — anything longer is silently truncated, which matters if you pre-hash.\n" +
        "- **Argon2id** — the modern winner (Password Hashing Competition 2015). Tunable in **memory**, time and parallelism, which defeats GPU and ASIC attacks in a way BCrypt cannot. Needs BouncyCastle on the classpath.\n" +
        "- **SCrypt** — also memory-hard, a reasonable alternative.\n" +
        "- **PBKDF2** — FIPS-approved, but only CPU-hard; acceptable when compliance demands it.\n" +
        "- `NoOpPasswordEncoder` — **tests only**, and it is deprecated for a reason.\n\n" +
        "**`DelegatingPasswordEncoder`** is the Spring Boot default (`PasswordEncoderFactories.createDelegatingPasswordEncoder()`). It prefixes the hash with an **id in braces** — `{bcrypt}$2a$10$...`, `{argon2}$argon2id$...` — and dispatches `matches` by that prefix. This gives you:\n\n" +
        "- **Multiple algorithms coexisting** in one column.\n" +
        "- **Seamless migration**: keep verifying old `{bcrypt}` hashes while encoding new ones with `{argon2}`, and re-encode on successful login via `upgradeEncoding`.\n\n" +
        "Beyond hashing, mention: rate limiting and lockout after N failures, breached-password checks (Have I Been Pwned k-anonymity API), a minimum length of 12 with no silly composition rules (NIST 800-63B), MFA, and constant-time comparison — which `matches` already does.",
      code: `import org.springframework.context.annotation.*;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.*;
import org.springframework.security.crypto.scrypt.SCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Configuration
class PasswordConfig {

    /**
     * DelegatingPasswordEncoder: encodes with the chosen default, but can still
     * verify every legacy format. This is what lets you migrate without a reset.
     */
    @Bean
    PasswordEncoder passwordEncoder() {
        String idForEncode = "argon2";
        Map<String, PasswordEncoder> encoders = new HashMap<>();
        encoders.put("argon2", Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8());
        encoders.put("bcrypt", new BCryptPasswordEncoder(12));
        encoders.put("scrypt", SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8());
        encoders.put("pbkdf2", Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8());

        DelegatingPasswordEncoder encoder =
            new DelegatingPasswordEncoder(idForEncode, encoders);
        // Legacy rows with no {id} prefix: fall back to bcrypt instead of failing.
        encoder.setDefaultPasswordEncoderForMatches(new BCryptPasswordEncoder(10));
        return encoder;
    }
}

@Service
class PasswordService {

    private final PasswordEncoder encoder;
    private final AppUserRepository repository;

    PasswordService(PasswordEncoder encoder, AppUserRepository repository) {
        this.encoder = encoder; this.repository = repository;
    }

    /** Store only the encoded form. Output: {argon2}$argon2id$v=19$m=16384,t=2,p=1$... */
    public String hash(String rawPassword) {
        if (rawPassword.length() < 12) throw new IllegalArgumentException("too short");
        return encoder.encode(rawPassword);
    }

    /**
     * Transparent re-hash on login: verify with the old algorithm, then upgrade.
     * The user never notices, and the database migrates itself.
     */
    public boolean verifyAndUpgrade(AppUser user, String rawPassword) {
        if (!encoder.matches(rawPassword, user.passwordHash)) return false;
        if (encoder.upgradeEncoding(user.passwordHash)) {
            user.passwordHash = encoder.encode(rawPassword);   // now {argon2}
            repository.save(user);
        }
        return true;
    }

    /** BCrypt embeds its own salt - two encodes of the same password differ. */
    public void demonstrateSalting() {
        BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder(10);
        String a = bcrypt.encode("same-password");
        String b = bcrypt.encode("same-password");
        System.out.println(a);                    // $2a$10$<salt><hash>
        System.out.println(b);                    // different string...
        System.out.println(a.equals(b));          // false
        System.out.println(bcrypt.matches("same-password", a)   // ...but both verify
                        && bcrypt.matches("same-password", b)); // true
    }

    /** BCrypt truncates at 72 bytes - pre-hash with SHA-512 if you must allow longer. */
    public void bcryptLimit() {
        String longPassword = "x".repeat(100);
        BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder(10);
        String encoded = bcrypt.encode(longPassword);
        System.out.println(bcrypt.matches("x".repeat(72), encoded));   // true (!)
    }
}`,
      codeLanguage: "java",
      explanation:
        "Use a slow, salted, memory-hard hash; DelegatingPasswordEncoder's {id} prefix lets several algorithms coexist and migrate on login.",
      followUps: [
        "Why is Argon2id preferred over BCrypt today?",
        "How does upgradeEncoding migrate a password database with no reset?",
      ],
    },
    {
      id: "b112",
      question: "How do you configure Spring Security 6 with the lambda DSL, and what changed from version 5?",
      answer:
        "Spring Security 6 (Spring Boot 3) removed a lot of long-deprecated API. The migration questions come up constantly.\n\n" +
        "What was removed or changed:\n\n" +
        "1. **`WebSecurityConfigurerAdapter` is gone.** Expose a **`SecurityFilterChain` bean** instead. Component-based configuration, so you can have several chains with `@Order` and `securityMatcher`.\n" +
        "2. **The lambda DSL is mandatory** — the old `and()` chaining is removed. `http.csrf(csrf -> csrf.disable())`, not `http.csrf().disable()`.\n" +
        "3. **`authorizeRequests` → `authorizeHttpRequests`**, backed by the new `AuthorizationManager` API rather than the old voter/`AccessDecisionManager` model.\n" +
        "4. **`antMatchers`/`mvcMatchers`/`regexMatchers` → `requestMatchers`**, which picks the right matcher automatically (and closes the trailing-slash bypass class of bugs).\n" +
        "5. **`WebSecurityCustomizer.ignoring()` is discouraged** — prefer a dedicated permit-all chain so headers still apply.\n" +
        "6. **`@EnableGlobalMethodSecurity` → `@EnableMethodSecurity`**, and `prePostEnabled` now defaults to **true**.\n" +
        "7. **The `SecurityContext` is no longer saved automatically** by authentication filters; `SecurityContextHolderFilter` replaced `SecurityContextPersistenceFilter`.\n" +
        "8. **`AuthenticationManager`** is now built by exposing an `AuthenticationConfiguration`-derived bean, or simply by declaring a `UserDetailsService` + `PasswordEncoder` and letting Boot wire it.\n" +
        "9. `RequestCache` now requires the `continue` parameter for saved-request replay; `PathRequest`/`EndpointRequest` are the idiomatic matchers for static resources and actuator.\n\n" +
        "**The authorization rules themselves** (in evaluation order — first match wins, so put specifics first): `permitAll`, `denyAll`, `authenticated`, `anonymous`, `hasRole`, `hasAnyRole`, `hasAuthority`, `access(AuthorizationManager)`. Always finish with **`.anyRequest().authenticated()`** so a new endpoint is secure by default rather than open.",
      code: `import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.*;
import org.springframework.security.config.annotation.web.configuration.*;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity            // prePostEnabled = true by default in 6.x
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    SecurityConfig(JwtAuthenticationFilter jwtFilter) { this.jwtFilter = jwtFilter; }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            // ---- CSRF: off for stateless token APIs, ON for cookie/session apps ----
            .csrf(csrf -> csrf.disable())

            // ---- CORS: delegate to the CorsConfigurationSource bean below ----
            .cors(Customizer.withDefaults())

            // ---- no session at all ----
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ---- authorization rules: SPECIFIC FIRST, catch-all LAST ----
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/api/public/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/products/**").hasRole("SELLER")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/actuator/**").hasRole("OPS")
                .anyRequest().authenticated())          // secure by default

            // ---- security headers ----
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"))
                .frameOptions(frame -> frame.deny())
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true).maxAgeInSeconds(31_536_000))
                .referrerPolicy(r -> r.policy(
                    org.springframework.security.web.header.writers
                        .ReferrerPolicyHeaderWriter.ReferrerPolicy.SAME_ORIGIN)))

            // ---- 401 vs 403 ----
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) ->
                    res.sendError(401, "Authentication required"))
                .accessDeniedHandler((req, res, e) ->
                    res.sendError(403, "Access denied")))

            // ---- our filter runs BEFORE the username/password filter ----
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("https://app.example.com"));  // never "*" with creds
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setExposedHeaders(List.of("X-Total-Count"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    /** Expose the AuthenticationManager for a custom /login endpoint. */
    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Discouraged in 6.x: ignoring() skips the chain entirely, so no security
     * headers are written. Prefer a dedicated permitAll chain.
     */
    @Bean
    WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.ignoring().requestMatchers("/favicon.ico");
    }
}`,
      codeLanguage: "java",
      explanation:
        "SecurityFilterChain beans replace WebSecurityConfigurerAdapter, the lambda DSL is mandatory, and requestMatchers replaces antMatchers.",
      followUps: [
        "Why is WebSecurity.ignoring() discouraged in Spring Security 6?",
        "What order should authorization rules be declared in?",
      ],
    },
    {
      id: "b113",
      question: "Explain method-level security: @PreAuthorize, @PostAuthorize, @Secured and SpEL.",
      answer:
        "URL-based rules protect endpoints; **method security protects the service layer**, which also covers messaging listeners, scheduled jobs and anything else that never touches a controller. Defence in depth.\n\n" +
        "Enable with **`@EnableMethodSecurity`** (Spring Security 6; `prePostEnabled` is true by default, `securedEnabled` and `jsr250Enabled` are opt-in).\n\n" +
        "The annotations:\n\n" +
        "- **`@PreAuthorize`** — evaluated **before** the call, with full SpEL and access to arguments via `#paramName`. The workhorse.\n" +
        "- **`@PostAuthorize`** — evaluated **after**, with the result available as `returnObject`. Use it when the decision depends on what was returned (`returnObject.ownerId == authentication.name`). The caveat: **the method already ran**, so any side effects have happened and the data was loaded.\n" +
        "- **`@PreFilter` / `@PostFilter`** — filter elements out of a collection argument or return value using `filterObject`. Convenient but **do not use for large result sets** — filtering in memory after loading 10,000 rows is a performance and correctness disaster; filter in the query instead.\n" +
        "- **`@Secured(\"ROLE_ADMIN\")`** — legacy, role list only, no SpEL.\n" +
        "- **`@RolesAllowed`** — the JSR-250 equivalent, portable across Jakarta EE.\n\n" +
        "SpEL vocabulary: `hasRole`, `hasAnyRole`, `hasAuthority`, `hasPermission(id, type, perm)`, `authentication`, `principal`, `permitAll`, `denyAll`, `isAnonymous()`, `#arg`, `returnObject`, and **`@beanName.method(...)`** — the cleanest approach, because it moves the logic into a testable bean instead of a string.\n\n" +
        "**The critical caveat:** method security is **proxy-based**, exactly like `@Transactional`. **Self-invocation bypasses it**, private and final methods are not advised, and the annotation must be on a Spring bean. Also remember that annotations on an interface method are not inherited by default with CGLIB proxies — put them on the implementation or use interface-based proxies consistently.",
      code: `import org.springframework.security.access.prepost.*;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.*;

import java.util.List;

@Service
public class DocumentService {

    /** Simple role check - the most common form. */
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAll() { }

    /** Several authorities. */
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR') and isAuthenticated()")
    public void publish(Long id) { }

    /** Argument-based: the caller may only read their own documents. */
    @PreAuthorize("#ownerId == authentication.name or hasRole('ADMIN')")
    public List<Document> findByOwner(String ownerId) { return List.of(); }

    /** Principal property access. */
    @PreAuthorize("principal.username == #username")
    public void updateProfile(String username, String bio) { }

    /**
     * Result-based. NOTE: the method has already executed - fine for a read,
     * wrong for anything with side effects.
     */
    @PostAuthorize("returnObject.ownerId == authentication.name or hasRole('AUDITOR')")
    public Document findById(Long id) { return new Document(id, "alice", false); }

    /** Filter the RETURN value. Only for small collections. */
    @PostFilter("filterObject.ownerId == authentication.name or filterObject.publicDoc")
    public List<Document> findAll() { return List.of(); }

    /** Filter an ARGUMENT before the method sees it. */
    @PreFilter("filterObject.ownerId == authentication.name")
    public void bulkUpdate(List<Document> documents) { }

    /**
     * BEST PRACTICE: delegate to a bean. Testable, debuggable, refactor-safe -
     * far better than a long SpEL string.
     */
    @PreAuthorize("@documentPermissions.canEdit(#id, authentication)")
    public void edit(Long id, String content) { }

    /** Legacy forms. */
    @Secured({"ROLE_ADMIN", "ROLE_OPS"})          // needs securedEnabled = true
    public void legacyAdminOnly() { }

    @jakarta.annotation.security.RolesAllowed("ADMIN")   // needs jsr250Enabled = true
    public void jsr250AdminOnly() { }

    /** BROKEN: self-invocation bypasses the proxy, so no check runs. */
    public void brokenCaller() {
        this.deleteAll();                          // NOT secured
    }

    record Document(Long id, String ownerId, boolean publicDoc) { }
}

/** The bean referenced from SpEL - plain Java, fully unit-testable. */
@Component("documentPermissions")
class DocumentPermissions {

    public boolean canEdit(Long documentId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return false;
        boolean admin = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (admin) return true;
        // return repository.isOwner(documentId, authentication.getName());
        return true;
    }
}

/** Controllers can inject the principal directly instead of reaching for the holder. */
@RestController
class DocumentController {

    @org.springframework.web.bind.annotation.GetMapping("/api/documents/me")
    @PreAuthorize("isAuthenticated()")
    public String mine(@AuthenticationPrincipal
                       org.springframework.security.core.userdetails.UserDetails user) {
        return user.getUsername();
    }
}

@org.springframework.context.annotation.Configuration
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity(
    prePostEnabled = true, securedEnabled = true, jsr250Enabled = true)
class MethodSecurityConfig { }`,
      codeLanguage: "java",
      explanation:
        "@PreAuthorize with SpEL is the workhorse; @PostAuthorize runs after the method, filters are memory-bound, and self-invocation bypasses all of it.",
      followUps: [
        "Why is @PostFilter dangerous on a large result set?",
        "Why does @PreAuthorize not fire on a self-invoked method?",
      ],
    },
    {
      id: "b114",
      question: "What is CSRF, how does Spring Security protect against it, and when may you disable it?",
      answer:
        "**CSRF (Cross-Site Request Forgery)** exploits the fact that browsers attach cookies **automatically** to any request to a domain, regardless of which site initiated it. If `evil.com` contains a form that POSTs to `bank.com/transfer`, the victim's session cookie rides along and the bank cannot tell the request was not intended.\n\n" +
        "The key insight: CSRF works because the attacker can **cause** an authenticated request, not because they can **read** the response. So the defence is to require something the attacker cannot guess or read.\n\n" +
        "**Spring Security's synchronizer token pattern:** `CsrfFilter` generates a random token per session, exposes it to the server-rendered page, and requires it back in a header (`X-CSRF-TOKEN`) or parameter (`_csrf`) on every **state-changing** request (POST, PUT, PATCH, DELETE — GET/HEAD/OPTIONS/TRACE are exempt as they should be safe). The token is compared in constant time; mismatch → `403 InvalidCsrfTokenException`.\n\n" +
        "Repositories: `HttpSessionCsrfTokenRepository` (default) or **`CookieCsrfTokenRepository.withHttpOnlyFalse()`** for SPAs, which implements the **double-submit cookie** pattern — JavaScript reads the `XSRF-TOKEN` cookie and echoes it in a header; the attacker's site cannot read the cookie because of the same-origin policy.\n\n" +
        "In Spring Security 6 you usually also need `CsrfTokenRequestAttributeHandler` with `setCsrfRequestAttributeName(null)` to opt out of the new BREACH-protection deferred loading for SPAs.\n\n" +
        "**When you may disable it:** only when **no browser-managed credential** is used — a stateless API authenticated purely by an `Authorization: Bearer` header, or a service-to-service API. The reasoning to state: 'the attacker cannot make the browser attach a header it does not know'. \n\n" +
        "**When you must not:** any cookie or session-based authentication, including a JWT stored in a cookie. Layer on `SameSite=Lax/Strict` cookies as defence in depth — but SameSite alone is not sufficient for older browsers or for cross-subdomain setups.",
      code: `import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.*;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;

@Configuration
public class CsrfConfiguration {

    /** Browser app with sessions: CSRF protection stays ON. */
    @Bean
    SecurityFilterChain sessionChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf
                .csrfTokenRepository(new HttpSessionCsrfTokenRepository())
                // Webhooks authenticated by signature need no CSRF token.
                .ignoringRequestMatchers("/webhooks/**"))
            .formLogin(org.springframework.security.config.Customizer.withDefaults())
            .build();
    }

    /** SPA + cookie session: double-submit cookie so JavaScript can read the token. */
    @Bean
    SecurityFilterChain spaChain(HttpSecurity http) throws Exception {
        CsrfTokenRequestAttributeHandler handler = new CsrfTokenRequestAttributeHandler();
        handler.setCsrfRequestAttributeName(null);     // opt out of deferred loading

        return http
            .securityMatcher("/spa/**")
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(handler))
            .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilterMarker.class)
            .build();
    }

    /**
     * Stateless bearer-token API: disabling CSRF is CORRECT here, because the
     * browser never attaches the Authorization header automatically.
     */
    @Bean
    SecurityFilterChain statelessApiChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/api/**")
            .csrf(CsrfConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(
                org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
            .build();
    }

    /** SameSite as defence in depth - not a replacement for CSRF tokens. */
    @Bean
    org.springframework.boot.web.servlet.server.CookieSameSiteSupplier sameSiteSupplier() {
        return org.springframework.boot.web.servlet.server.CookieSameSiteSupplier
            .ofLax().whenHasName("JSESSIONID");
    }
}

/** Forces the deferred CSRF token to be materialised into the response cookie. */
class CsrfCookieFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        CsrfToken token = (CsrfToken) request.getAttribute("_csrf");
        if (token != null) token.getToken();          // render it -> Set-Cookie: XSRF-TOKEN
        chain.doFilter(request, response);
    }
}

class BasicAuthenticationFilterMarker
    extends org.springframework.security.web.authentication.www.BasicAuthenticationFilter {
    BasicAuthenticationFilterMarker() { super(auth -> auth); }
}

/*
Thymeleaf injects the hidden field automatically:
    <form method="post" th:action="@{/transfer}">   ->   <input type="hidden"
        name="_csrf" value="...">

A SPA reads the cookie and echoes it:
    const token = document.cookie.split('; ')
        .find(c => c.startsWith('XSRF-TOKEN='))?.split('=')[1];
    fetch('/spa/transfer', {
        method: 'POST',
        headers: { 'X-XSRF-TOKEN': token },
        credentials: 'include'
    });
*/`,
      codeLanguage: "java",
      explanation:
        "Cookies ride along automatically, so require an unguessable token on state-changing requests; disable CSRF only for header-based stateless auth.",
      followUps: [
        "Why is a JWT in a cookie still vulnerable to CSRF?",
        "How does the double-submit cookie pattern work?",
      ],
    },
    {
      id: "b115",
      question: "Explain CORS: the preflight flow, how to configure it in Spring, and how it differs from CSRF.",
      answer:
        "**CORS (Cross-Origin Resource Sharing)** is a **browser** mechanism that relaxes the same-origin policy. An *origin* is scheme + host + port; any difference makes it cross-origin. Without CORS headers the browser **blocks the JavaScript from reading the response** — note the request may still have reached the server.\n\n" +
        "**Simple requests** (GET/HEAD/POST with only 'CORS-safelisted' headers and a content type of `text/plain`, `application/x-www-form-urlencoded` or `multipart/form-data`) go straight out; the browser checks `Access-Control-Allow-Origin` on the response.\n\n" +
        "**Preflight** is triggered by anything else — `Content-Type: application/json`, an `Authorization` header, PUT/PATCH/DELETE:\n\n" +
        "1. Browser sends `OPTIONS` with `Origin`, `Access-Control-Request-Method`, `Access-Control-Request-Headers`.\n" +
        "2. Server answers with `Access-Control-Allow-Origin`, `-Allow-Methods`, `-Allow-Headers`, optionally `-Allow-Credentials`, `-Expose-Headers` and **`Access-Control-Max-Age`** (cache the preflight; without it every request costs two round trips).\n" +
        "3. Only then does the real request go out.\n\n" +
        "Configuring in Spring:\n\n" +
        "- `@CrossOrigin` on a controller or method — fine for simple cases.\n" +
        "- `WebMvcConfigurer.addCorsMappings` — global MVC-level config.\n" +
        "- **With Spring Security you must also enable `http.cors(...)`** and supply a `CorsConfigurationSource` bean, otherwise the `AuthorizationFilter` rejects the unauthenticated `OPTIONS` preflight with a 401 and the browser reports a confusing CORS error. This is the single most common CORS-plus-Security bug.\n\n" +
        "**Hard rule:** `allowCredentials(true)` **cannot** be combined with `allowedOrigins(\"*\")` — the spec forbids it. Use `allowedOriginPatterns` or an explicit list.\n\n" +
        "**CORS vs CSRF:** CORS *relaxes* a browser restriction so a trusted frontend can read your responses; CSRF protection *adds* a restriction so an untrusted site cannot forge state changes. CORS is not a security control for your server — a non-browser client ignores it entirely.",
      code: `import org.springframework.context.annotation.*;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.cors.*;
import org.springframework.web.servlet.config.annotation.*;

import java.util.List;

@Configuration
public class CorsConfiguration_ {

    /** The source Spring Security uses. This is the one that matters. */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // NEVER "*" together with credentials - the spec forbids it.
        config.setAllowedOrigins(List.of(
            "https://app.example.com",
            "https://admin.example.com"));
        // For dynamic subdomains use patterns instead:
        // config.setAllowedOriginPatterns(List.of("https://*.example.com"));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-Id"));
        config.setExposedHeaders(List.of("X-Total-Count", "Location"));  // readable by JS
        config.setAllowCredentials(true);                                // cookies allowed
        config.setMaxAge(3600L);                     // cache preflight for an hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    /**
     * Without .cors(...) here, the unauthenticated OPTIONS preflight is rejected
     * by the AuthorizationFilter and the browser reports a CORS failure.
     */
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .cors(Customizer.withDefaults())          // uses the bean above
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .anyRequest().authenticated())
            .build();
    }
}

/** MVC-level configuration (applies when Spring Security is not in play). */
@Configuration
class WebCorsConfig implements WebMvcConfigurer {
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/public/**")
            .allowedOrigins("https://app.example.com")
            .allowedMethods("GET", "POST")
            .allowedHeaders("*")
            .maxAge(3600);
    }
}

/** Per-controller annotation - convenient, but easy to forget on a new controller. */
@RestController
@CrossOrigin(origins = "https://app.example.com", maxAge = 3600)
class ProductController {

    @GetMapping("/api/products")
    List<String> list() { return List.of("a", "b"); }

    @CrossOrigin(origins = "https://partner.example.com",
                 methods = RequestMethod.GET,
                 allowedHeaders = "Authorization")
    @GetMapping("/api/products/partner")
    List<String> partnerList() { return List.of("a"); }
}

/*
The preflight exchange
----------------------
OPTIONS /api/products HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization, content-type

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Request-Id
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
Vary: Origin                      <- essential, or a cache will poison responses
*/`,
      codeLanguage: "java",
      explanation:
        "Preflight OPTIONS must be answered before the real request; enable http.cors() with a CorsConfigurationSource, and never mix credentials with a wildcard origin.",
      followUps: [
        "Why does the Vary: Origin header matter?",
        "Does CORS protect your server from a non-browser client?",
      ],
    },
    {
      id: "b116",
      question: "How does session management work in Spring Security, and what is session fixation?",
      answer:
        "**`SessionCreationPolicy`** has four values:\n\n" +
        "- **`ALWAYS`** — create a session even if unused.\n" +
        "- **`IF_REQUIRED`** (default) — create one only when needed.\n" +
        "- **`NEVER`** — do not create one, but use an existing session if present.\n" +
        "- **`STATELESS`** — never create **and never use** one. The correct setting for token APIs; it also disables `HttpSessionSecurityContextRepository` and the request cache.\n\n" +
        "**Session fixation** is the attack to explain precisely: the attacker obtains a valid session id (often by simply visiting the site), tricks the victim into authenticating **with that same id** (via a crafted URL, a subdomain cookie or an XSS write), and because the server keeps the id across login, the attacker's session is now authenticated.\n\n" +
        "Spring Security defends automatically via `SessionManagementFilter` / `SessionAuthenticationStrategy`:\n\n" +
        "- **`changeSessionId()`** — the default on Servlet 3.1+. Keeps the session data, changes only the id.\n" +
        "- **`migrateSession()`** — creates a new session and copies attributes.\n" +
        "- **`newSession()`** — new session, attributes discarded.\n" +
        "- **`none()`** — no protection. Never use it.\n\n" +
        "**Concurrent session control:** `maximumSessions(n)` with `maxSessionsPreventsLogin(true)` (reject the new login) or `false` (expire the oldest). This needs an `HttpSessionEventPublisher` bean to be registered, or the registry never learns about session destruction — a classic silent misconfiguration.\n\n" +
        "Other essentials: `invalidSessionUrl` for expired sessions, logout that calls `invalidateHttpSession(true)` and `deleteCookies(\"JSESSIONID\")`, cookies marked **`HttpOnly`, `Secure`, `SameSite=Lax`**, a sensible `server.servlet.session.timeout`, and **Spring Session** (Redis/JDBC) when you need sessions shared across instances instead of sticky sessions.\n\n" +
        "**Stateless vs stateful trade-off:** sessions are instantly revocable and keep the token small, but need shared storage; JWTs scale horizontally but cannot be revoked without a denylist.",
      code: `import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.*;
import org.springframework.security.web.session.HttpSessionEventPublisher;

@Configuration
public class SessionConfiguration {

    /** Stateful browser app: fixation protection + concurrency control. */
    @Bean
    SecurityFilterChain webChain(HttpSecurity http, SessionRegistry registry) throws Exception {
        return http
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)

                // Fixation protection - changeSessionId() is the default.
                .sessionFixation(fixation -> fixation.changeSessionId())

                // One active session per user; a second login kicks out the first.
                .maximumSessions(1)
                    .maxSessionsPreventsLogin(false)
                    .sessionRegistry(registry)
                    .expiredUrl("/login?expired")
                .and()

                .invalidSessionUrl("/login?invalid"))

            .logout(logout -> logout
                .logoutUrl("/logout")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID"))
            .build();
    }

    /** Stateless API: no session is created or consulted at all. */
    @Bean
    SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/api/**")
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable())
            .build();
    }

    @Bean
    SessionRegistry sessionRegistry() { return new SessionRegistryImpl(); }

    /**
     * REQUIRED for concurrent session control: without it the registry never
     * hears about HttpSessionDestroyedEvent and "maximumSessions" leaks.
     */
    @Bean
    HttpSessionEventPublisher httpSessionEventPublisher() {
        return new HttpSessionEventPublisher();
    }

    /** Custom strategy: log every fixation-protection event. */
    @Bean
    SessionAuthenticationStrategy sessionAuthenticationStrategy() {
        ChangeSessionIdAuthenticationStrategy strategy =
            new ChangeSessionIdAuthenticationStrategy();
        return (authentication, request, response) -> {
            String before = request.getSession(false) == null
                ? "none" : request.getSession(false).getId();
            strategy.onAuthentication(authentication, request, response);
            System.out.println("session id " + before + " -> " + request.getSession().getId());
        };
    }
}

/** Administrative view of who is logged in - useful for forced logout. */
@org.springframework.stereotype.Service
class SessionAdminService {
    private final SessionRegistry registry;
    SessionAdminService(SessionRegistry registry) { this.registry = registry; }

    public void forceLogout(String username) {
        registry.getAllPrincipals().stream()
            .filter(p -> p.toString().contains(username))
            .flatMap(p -> registry.getAllSessions(p, false).stream())
            .forEach(org.springframework.security.core.session.SessionInformation::expireNow);
    }
}

/*
application.yml
---------------
server.servlet.session:
  timeout: 30m
  cookie:
    http-only: true        # JavaScript cannot read it -> blunts XSS session theft
    secure: true           # HTTPS only
    same-site: lax         # defence in depth against CSRF
    name: SESSIONID        # do not advertise the servlet container

# Shared sessions across instances - no sticky load balancing required:
spring.session.store-type: redis
spring.session.redis.namespace: myapp:sessions
*/`,
      codeLanguage: "java",
      explanation:
        "changeSessionId on login defeats fixation; STATELESS for token APIs, and concurrent session control needs HttpSessionEventPublisher.",
      followUps: [
        "Walk through a session fixation attack step by step.",
        "What breaks if you forget the HttpSessionEventPublisher bean?",
      ],
    },
    {
      id: "b117",
      question: "Explain OAuth2 and OpenID Connect: roles, grant types, and resource server vs client.",
      answer:
        "**OAuth2 is an authorization framework, not an authentication protocol.** It lets a user grant a third-party app limited access to their resources **without sharing their password**. **OpenID Connect (OIDC)** is a thin identity layer on top that *does* do authentication, by adding the **ID token** (a JWT about the user), a `/userinfo` endpoint and the `openid` scope.\n\n" +
        "The four roles: **Resource Owner** (the user), **Client** (the app), **Authorization Server** (issues tokens — Keycloak, Auth0, Okta, Cognito), **Resource Server** (your API, which validates tokens).\n\n" +
        "Grant types, with current guidance:\n\n" +
        "- **Authorization Code + PKCE** — the default for everything today, including SPAs and mobile. The client gets a short-lived `code` via the browser redirect, then exchanges it server-side for tokens. **PKCE** (`code_challenge`/`code_verifier`) stops an attacker who intercepts the code from redeeming it.\n" +
        "- **Client Credentials** — machine-to-machine. No user involved.\n" +
        "- **Refresh Token** — obtain a new access token without re-authenticating. Should be rotated and one-time-use.\n" +
        "- **Device Code** — TVs and CLIs.\n" +
        "- **Implicit** and **Resource Owner Password Credentials** are **deprecated** by OAuth 2.1 — implicit leaked tokens in the URL fragment; ROPC requires the app to handle the password, defeating the point.\n\n" +
        "Token types: **access token** (sent to the API, usually a JWT, short-lived — 5–15 minutes), **refresh token** (long-lived, stored securely, revocable), **ID token** (OIDC, for the client only — **never** send it to an API).\n\n" +
        "In Spring: **`spring-boot-starter-oauth2-resource-server`** for an API that validates tokens (`.oauth2ResourceServer(oauth -> oauth.jwt(...))` with just `issuer-uri`, which discovers the JWK set), and **`spring-boot-starter-oauth2-client`** for an app that logs users in (`.oauth2Login()`) or calls other APIs on their behalf. Validation is either **JWT-local** (fast, but revocation-blind) or **opaque-token introspection** (a network call per request, instantly revocable).",
      code: `import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.*;
import org.springframework.security.web.SecurityFilterChain;

import java.util.*;
import java.util.stream.*;

@Configuration
public class OAuth2ResourceServerConfig {

    /** RESOURCE SERVER: validate incoming JWTs, map claims to authorities. */
    @Bean
    SecurityFilterChain resourceServer(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/api/**")
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(
                org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/orders/**").hasAuthority("SCOPE_orders:read")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth -> oauth
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
            .build();
    }

    /** Keycloak puts roles under realm_access.roles - map them to ROLE_*. */
    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
        scopes.setAuthorityPrefix("SCOPE_");
        scopes.setAuthoritiesClaimName("scope");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities =
                new ArrayList<>(scopes.convert(jwt));
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> roles) {
                roles.stream()
                    .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                    .forEach(authorities::add);
            }
            return authorities;
        });
        converter.setPrincipalClaimName("preferred_username");
        return converter;
    }

    /** Extra validation beyond signature + expiry: audience and issuer. */
    @Bean
    JwtDecoder jwtDecoder(
            @org.springframework.beans.factory.annotation.Value("\${app.issuer-uri}") String issuer) {
        NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuer);
        OAuth2TokenValidator<Jwt> audience = new JwtClaimValidator<List<String>>(
            "aud", aud -> aud != null && aud.contains("orders-api"));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefaultWithIssuer(issuer), audience));
        return decoder;
    }
}

@Configuration
class OAuth2ClientConfig {

    /** CLIENT: log users in via the authorization server (OIDC). */
    @Bean
    SecurityFilterChain uiChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/error").permitAll()
                .anyRequest().authenticated())
            .oauth2Login(login -> login
                .defaultSuccessUrl("/dashboard", true)
                .userInfoEndpoint(u -> u.userAuthoritiesMapper(authorities -> authorities)))
            .logout(logout -> logout.logoutSuccessUrl("/"))
            .build();
    }
}

/*
application.yml
---------------
spring.security.oauth2:

  # RESOURCE SERVER - issuer-uri discovers /.well-known/openid-configuration
  resourceserver.jwt:
    issuer-uri: https://auth.example.com/realms/prod
    audiences: orders-api
    # or opaque tokens (revocable, but a network call per request):
    # opaquetoken: { introspection-uri: ..., client-id: ..., client-secret: ... }

  # CLIENT - authorization code with PKCE
  client:
    registration.keycloak:
      client-id: web-app
      client-secret: \${OAUTH_SECRET}
      authorization-grant-type: authorization_code
      scope: openid,profile,email,orders:read
      redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
    registration.internal-api:
      client-id: batch-job
      client-secret: \${BATCH_SECRET}
      authorization-grant-type: client_credentials   # machine-to-machine
      scope: orders:write
    provider.keycloak:
      issuer-uri: https://auth.example.com/realms/prod
*/`,
      codeLanguage: "java",
      explanation:
        "OAuth2 authorizes, OIDC authenticates; use authorization code with PKCE, and pick resource-server JWT validation or opaque introspection.",
      followUps: [
        "Why were the implicit and password grants deprecated?",
        "When would you choose opaque tokens over JWTs?",
      ],
    },
    {
      id: "b118",
      question: "How do you write a custom authentication filter and where do you place it in the chain?",
      answer:
        "Three options, in increasing order of control:\n\n" +
        "1. **A custom `AuthenticationProvider`** — when the *credential type* is new but the flow is standard. Plug it into `ProviderManager`.\n" +
        "2. **Extend `AbstractAuthenticationProcessingFilter`** — when you need a dedicated *login endpoint*. You get success/failure handlers, session strategy and event publishing for free.\n" +
        "3. **Extend `OncePerRequestFilter`** — for **per-request** token validation (the JWT case). Simplest and most common.\n\n" +
        "Rules for a `OncePerRequestFilter`-based authenticator:\n\n" +
        "- **Always call `chain.doFilter`** — even when no credential is present. Never short-circuit; let the `AuthorizationFilter` at the end of the chain make the decision. Rejecting here produces confusing behaviour for `permitAll` endpoints.\n" +
        "- Do **not** overwrite an existing authentication: `if (SecurityContextHolder.getContext().getAuthentication() != null) { chain.doFilter(...); return; }`.\n" +
        "- Build the context with `SecurityContextHolder.createEmptyContext()` (not `getContext().setAuthentication(...)`) and set it, so concurrent requests are isolated.\n" +
        "- Attach `WebAuthenticationDetails` via `WebAuthenticationDetailsSource` for IP/session auditing.\n" +
        "- Handle failures by **clearing the context** and delegating to an `AuthenticationEntryPoint`, not by writing ad-hoc JSON.\n" +
        "- Override `shouldNotFilter` to skip public paths cheaply.\n\n" +
        "**Placement** with `addFilterBefore` / `addFilterAfter` / `addFilterAt`: token filters go **before `UsernamePasswordAuthenticationFilter`**; anything needing an already-established context goes **after** it. Placement relative to `ExceptionTranslationFilter` matters — filters registered before it get their exceptions translated into 401/403 responses.\n\n" +
        "**The trap:** if you also declare the filter as a `@Component`, Spring Boot **auto-registers it with the servlet container**, so it runs twice — once outside the security chain (where it has no access to the security config). Fix with a `FilterRegistrationBean` that sets `setEnabled(false)`, or simply do not annotate it as a bean.",
      code: `import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.*;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.*;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** Per-request token authentication - the standard JWT filter shape. */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final UserDetailsService userDetailsService;
    private final AuthenticationEntryPoint entryPoint;
    private final WebAuthenticationDetailsSource detailsSource =
        new WebAuthenticationDetailsSource();

    public JwtAuthenticationFilter(TokenService tokenService,
                                   UserDetailsService userDetailsService,
                                   AuthenticationEntryPoint entryPoint) {
        this.tokenService = tokenService;
        this.userDetailsService = userDetailsService;
        this.entryPoint = entryPoint;
    }

    /** Skip the filter entirely for public paths. */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/auth/") || path.startsWith("/actuator/health");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        // Never clobber an authentication established earlier in the chain.
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(request, response);
            return;
        }

        String header = request.getHeader(HttpHeaders_AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);       // ALWAYS continue - let
            return;                                  // AuthorizationFilter decide
        }

        try {
            String token = header.substring(7);
            String username = tokenService.validateAndExtractSubject(token);
            UserDetails user = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
            authentication.setDetails(detailsSource.buildDetails(request));

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            chain.doFilter(request, response);
        } catch (AuthenticationException ex) {
            SecurityContextHolder.clearContext();
            entryPoint.commence(request, response, ex);   // consistent 401 body
        } finally {
            SecurityContextHolder.clearContext();         // never leak to the next request
        }
    }

    private static final String HttpHeaders_AUTHORIZATION = "Authorization";
}

/** A dedicated login endpoint: extend AbstractAuthenticationProcessingFilter. */
class OtpAuthenticationFilter extends AbstractAuthenticationProcessingFilter {

    OtpAuthenticationFilter(AuthenticationManager manager) {
        super(new org.springframework.security.web.util.matcher.AntPathRequestMatcher(
            "/api/auth/otp", "POST"));
        setAuthenticationManager(manager);
        setAuthenticationSuccessHandler((req, res, auth) -> res.setStatus(200));
        setAuthenticationFailureHandler((req, res, ex) -> res.sendError(401));
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request,
                                                HttpServletResponse response)
            throws AuthenticationException {
        String phone = request.getParameter("phone");
        String code  = request.getParameter("code");
        if (phone == null || code == null) throw new BadCredentialsException("missing otp");
        return getAuthenticationManager().authenticate(
            new UsernamePasswordAuthenticationToken(phone, code));
    }
}

@Configuration
class FilterRegistrationConfig {
    /**
     * CRITICAL: if the filter is a @Component, Boot also registers it with the
     * servlet container and it runs twice. Disable the container registration.
     */
    @Bean
    FilterRegistrationBean<JwtAuthenticationFilter> disableContainerRegistration(
            JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration =
            new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}

interface TokenService { String validateAndExtractSubject(String token); }`,
      codeLanguage: "java",
      explanation:
        "Extend OncePerRequestFilter, always call chain.doFilter, never overwrite an existing context, and disable the duplicate container registration.",
      followUps: [
        "Why must the filter continue the chain even without a token?",
        "How does a @Component filter end up running twice?",
      ],
    },
    {
      id: "b119",
      question: "How do you handle security exceptions — AuthenticationEntryPoint vs AccessDeniedHandler?",
      answer:
        "`ExceptionTranslationFilter` wraps the downstream chain in a try/catch and routes exactly two exception types:\n\n" +
        "- **`AuthenticationException`** → **`AuthenticationEntryPoint`** → **401 Unauthorized**. Meaning: *I do not know who you are*. Subtypes: `BadCredentialsException`, `UsernameNotFoundException`, `CredentialsExpiredException`, `AccountExpiredException`, `LockedException`, `DisabledException`, `InsufficientAuthenticationException`.\n" +
        "- **`AccessDeniedException`** → **`AccessDeniedHandler`** → **403 Forbidden**. Meaning: *I know who you are, and you are not allowed*.\n\n" +
        "There is an important subtlety: if the current user is **anonymous** and an `AccessDeniedException` is thrown, `ExceptionTranslationFilter` converts it into a **401** via the entry point instead of 403 — because an anonymous user might succeed after logging in. That is why an unauthenticated call to a protected endpoint returns 401, not 403.\n\n" +
        "Defaults: a browser chain redirects to the login page (`LoginUrlAuthenticationEntryPoint`); Basic auth sends `WWW-Authenticate: Basic realm=\"Realm\"`; a REST API should send a **machine-readable body**, ideally RFC 7807 `ProblemDetail`, with no stack trace, no internal messages and a correlation id.\n\n" +
        "Points that separate a strong answer:\n\n" +
        "- **`@ControllerAdvice` does not catch filter exceptions.** The filter chain runs *before* `DispatcherServlet`, so an exception in a security filter never reaches your `@ExceptionHandler`. You must supply an entry point/handler, or forward the exception to a `HandlerExceptionResolver`.\n" +
        "- **`AccessDeniedException` thrown by method security** *does* reach the dispatcher, so `@ControllerAdvice` can handle that one — which is why behaviour differs between URL rules and `@PreAuthorize`.\n" +
        "- **Do not leak information**: use one generic message for all authentication failures (never 'user not found' vs 'wrong password'), and log the detail server-side with a request id the client can quote.\n" +
        "- Always add `WWW-Authenticate: Bearer error=\"invalid_token\"` for OAuth2 resource servers — RFC 6750 requires it.",
      code: `import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.*;
import org.springframework.context.annotation.*;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.*;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URI;
import java.time.Instant;

@Configuration
public class SecurityExceptionConfig {

    @Bean
    SecurityFilterChain chain(HttpSecurity http, ObjectMapper mapper) throws Exception {
        return http
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(entryPoint(mapper))    // 401
                .accessDeniedHandler(accessDeniedHandler(mapper)))  // 403
            .build();
    }

    /** 401: we do not know who you are. */
    @Bean
    AuthenticationEntryPoint entryPoint(ObjectMapper mapper) {
        return (request, response, authException) -> {
            String requestId = request.getHeader("X-Request-Id");
            // Log the REAL reason server-side only.
            System.out.println("auth failure requestId=" + requestId
                + " reason=" + authException.getClass().getSimpleName());

            ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
            problem.setType(URI.create("https://api.example.com/errors/unauthenticated"));
            problem.setTitle("Authentication required");
            problem.setDetail("Provide a valid bearer token.");   // deliberately generic
            problem.setProperty("timestamp", Instant.now());
            problem.setProperty("requestId", requestId);

            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.setHeader(HttpHeaders.WWW_AUTHENTICATE,
                "Bearer error=\\"invalid_token\\"");               // RFC 6750
            mapper.writeValue(response.getOutputStream(), problem);
        };
    }

    /** 403: we know who you are, and you may not do this. */
    @Bean
    AccessDeniedHandler accessDeniedHandler(ObjectMapper mapper) {
        return (request, response, deniedException) -> {
            var auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
            System.out.println("access denied user=" + (auth == null ? "?" : auth.getName())
                + " uri=" + request.getRequestURI());

            ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
            problem.setType(URI.create("https://api.example.com/errors/forbidden"));
            problem.setTitle("Access denied");
            problem.setDetail("You do not have permission to perform this action.");
            problem.setProperty("timestamp", Instant.now());

            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            mapper.writeValue(response.getOutputStream(), problem);
        };
    }
}

/**
 * @ControllerAdvice CANNOT see exceptions thrown inside the filter chain,
 * but it DOES see AccessDeniedException raised by @PreAuthorize, because
 * method security runs inside the dispatcher.
 */
@RestControllerAdvice
class SecurityControllerAdvice {

    @ExceptionHandler(AccessDeniedException.class)
    ProblemDetail onAccessDenied(AccessDeniedException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        problem.setTitle("Access denied");
        problem.setDetail("Insufficient privileges for this operation.");
        return problem;
    }

    @ExceptionHandler(AuthenticationException.class)
    ProblemDetail onAuthentication(AuthenticationException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        problem.setTitle("Authentication failed");
        problem.setDetail("Invalid credentials.");     // never distinguish the cause
        return problem;
    }
}

/** Bridging filter exceptions into @ControllerAdvice, if you want one place. */
class SecurityExceptionBridgeFilter extends org.springframework.web.filter.OncePerRequestFilter {
    private final org.springframework.web.servlet.HandlerExceptionResolver resolver;
    SecurityExceptionBridgeFilter(org.springframework.web.servlet.HandlerExceptionResolver r) {
        this.resolver = r;
    }
    @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                              jakarta.servlet.FilterChain chain)
            throws IOException, jakarta.servlet.ServletException {
        try { chain.doFilter(req, res); }
        catch (AuthenticationException | AccessDeniedException ex) {
            resolver.resolveException(req, res, null, (Exception) ex);
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "401 from AuthenticationEntryPoint, 403 from AccessDeniedHandler — and @ControllerAdvice cannot see exceptions thrown inside the filter chain.",
      followUps: [
        "Why does an anonymous user get 401 instead of 403?",
        "How do you return a consistent error body for both filter and controller failures?",
      ],
    },
    {
      id: "b120",
      question: "Roles vs authorities, role hierarchy, and RBAC vs ABAC — how do you model authorization?",
      answer:
        "**Authority** is the general concept: a single `String` the framework can check. **Role** is a convention — an authority prefixed with `ROLE_`. That is the entire technical difference, and it explains the API split: `hasRole(\"ADMIN\")` **prepends the prefix**, `hasAuthority(\"ROLE_ADMIN\")` does not. Mixing them is the most common authorization bug in Spring apps. You can change the prefix with a `GrantedAuthorityDefaults` bean, but do not — every library assumes `ROLE_`.\n\n" +
        "**Design guidance:** model **roles coarsely** (`ADMIN`, `MANAGER`, `USER`) and **permissions finely** (`order:read`, `order:refund`). Grant roles to users, map roles to permissions, and **check permissions** in code. Then adding a permission does not require a code change, and role explosion is avoided.\n\n" +
        "**`RoleHierarchy`** removes repetition: declare `ROLE_ADMIN > ROLE_MANAGER > ROLE_USER` once, and a user with `ROLE_ADMIN` implicitly satisfies `hasRole('USER')`. Wire it into both the web `AuthorizationManager` and the method-security expression handler — forgetting the second one is a classic partial configuration.\n\n" +
        "**RBAC vs ABAC:**\n\n" +
        "- **RBAC** — permissions attach to roles. Simple, auditable, and enough for most systems. Weakness: it cannot express *'only their own records'*, *'only during business hours'* or *'only under 10,000 euros'* without exploding the role count.\n" +
        "- **ABAC** — decisions are a function of attributes of the subject, the resource, the action and the environment. Far more expressive, harder to audit and to test.\n" +
        "- In Spring, ABAC arrives via a **custom `AuthorizationManager`**, a `PermissionEvaluator` (`hasPermission(#doc, 'edit')`), or SpEL calling a bean. **`AclService`** offers full per-object ACLs but is heavyweight.\n\n" +
        "**In practice:** RBAC for coarse gates at the endpoint, plus attribute checks for ownership and tenancy in the service layer — and remember to enforce **multi-tenancy in the query**, not only in an `if`, so a missing check cannot leak another tenant's rows.",
      code: `import org.springframework.context.annotation.*;
import org.springframework.security.access.hierarchicalroles.*;
import org.springframework.security.authorization.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.*;

import java.time.*;
import java.util.function.Supplier;

@Configuration
@EnableMethodSecurity
public class AuthorizationModel {

    /** Declare the hierarchy once instead of repeating hasAnyRole everywhere. */
    @Bean
    static RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.withDefaultRolePrefix()
            .role("ADMIN").implies("MANAGER")
            .role("MANAGER").implies("USER")
            .role("USER").implies("GUEST")
            .build();
    }

    /** Wire the hierarchy into WEB authorization. */
    @Bean
    static org.springframework.security.web.access.expression.DefaultHttpSecurityExpressionHandler
            webExpressionHandler(RoleHierarchy roleHierarchy) {
        var handler = new org.springframework.security.web.access.expression
            .DefaultHttpSecurityExpressionHandler();
        handler.setRoleHierarchy(roleHierarchy);
        return handler;
    }

    /** ...and into METHOD security. Forgetting this half is a common bug. */
    @Bean
    static org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler
            methodExpressionHandler(RoleHierarchy roleHierarchy) {
        var handler = new org.springframework.security.access.expression.method
            .DefaultMethodSecurityExpressionHandler();
        handler.setRoleHierarchy(roleHierarchy);
        return handler;
    }

    /** ABAC: a custom AuthorizationManager evaluating environment attributes. */
    @Bean
    AuthorizationManager<RequestAuthorizationContext> businessHoursOnly() {
        return (Supplier<Authentication> authentication, RequestAuthorizationContext context) -> {
            Authentication auth = authentication.get();
            if (auth == null || !auth.isAuthenticated()) return new AuthorizationDecision(false);
            boolean admin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (admin) return new AuthorizationDecision(true);
            LocalTime now = LocalTime.now(ZoneId.of("UTC"));
            boolean withinHours = !now.isBefore(LocalTime.of(8, 0))
                               && !now.isAfter(LocalTime.of(20, 0));
            return new AuthorizationDecision(withinHours);
        };
    }

    @Bean
    SecurityFilterChain chain(HttpSecurity http,
                              AuthorizationManager<RequestAuthorizationContext> businessHoursOnly)
            throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                // ROLE check - hasRole adds the ROLE_ prefix for you.
                .requestMatchers("/admin/**").hasRole("ADMIN")
                // AUTHORITY check - the exact string, no prefix added.
                .requestMatchers("/api/orders/refund").hasAuthority("order:refund")
                // Hierarchy: ROLE_ADMIN satisfies this automatically.
                .requestMatchers("/api/reports/**").hasRole("MANAGER")
                // ABAC.
                .requestMatchers("/api/batch/**").access(businessHoursOnly)
                .anyRequest().authenticated())
            .build();
    }
}

/** Permission-based checks: roles map to permissions, code checks permissions. */
@Service
class OrderService {

    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('order:read')")
    public Order find(Long id) { return new Order(id, "tenant-1", "alice", 500); }

    @org.springframework.security.access.prepost.PreAuthorize(
        "hasAuthority('order:refund') and @orderRules.canRefund(#id, authentication)")
    public void refund(Long id) { }

    /**
     * Multi-tenancy MUST be enforced in the query, not only in an if-statement.
     * A Hibernate filter or a mandatory tenantId parameter is the safe pattern.
     */
    public java.util.List<Order> findForCurrentTenant(String tenantId) {
        // return repository.findByTenantId(tenantId);
        return java.util.List.of();
    }

    record Order(Long id, String tenantId, String owner, long amount) { }
}

@Component("orderRules")
class OrderRules {
    /** ABAC in a testable bean: owner, amount limit and role combined. */
    public boolean canRefund(Long orderId, Authentication auth) {
        boolean manager = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));
        long amount = 500;                        // loaded from the repository
        return manager || amount < 1_000;
    }
}`,
      codeLanguage: "java",
      explanation:
        "Roles are just ROLE_-prefixed authorities; model roles coarsely and permissions finely, add a RoleHierarchy, and use ABAC for ownership rules.",
      followUps: [
        "Why must RoleHierarchy be wired into both web and method security?",
        "How do you stop a missing tenant check from leaking data?",
      ],
    },
    {
      id: "b121",
      question: "How do you test Spring Security configuration?",
      answer:
        "Security is exactly the kind of code that must be tested, because a misconfiguration is silent until it is a breach.\n\n" +
        "**The dependency:** `spring-security-test`, which provides the annotations and the `SecurityMockMvcRequestPostProcessors`.\n\n" +
        "Layers:\n\n" +
        "1. **Slice tests with `@WebMvcTest`** — fast, loads the web layer plus your `SecurityFilterChain`. Note that `@WebMvcTest` does **not** pick up a `@Configuration` in another package automatically; `@Import(SecurityConfig.class)` it.\n" +
        "2. **Full `@SpringBootTest` + `@AutoConfigureMockMvc`** — exercises the whole chain, correct when the config spans several beans.\n\n" +
        "Setting up a principal:\n\n" +
        "- **`@WithMockUser(username, roles, authorities)`** — the quick one. Remember: `roles = \"ADMIN\"` becomes `ROLE_ADMIN`, while `authorities = \"ROLE_ADMIN\"` must include the prefix yourself.\n" +
        "- **`@WithAnonymousUser`** — verify the unauthenticated path.\n" +
        "- **`@WithUserDetails(\"alice\")`** — loads through your real `UserDetailsService`, so it tests the actual authority mapping.\n" +
        "- **`@WithSecurityContext` + a custom annotation** — the right tool when your principal is a custom type.\n" +
        "- **Request post-processors** — `with(user(\"alice\").roles(\"ADMIN\"))`, `with(jwt().authorities(...))`, `with(httpBasic(...))`, `with(csrf())`, `with(oauth2Login())`. Prefer these when the principal varies per test method.\n\n" +
        "**What to assert — and this is the part candidates forget:**\n\n" +
        "- Not only that an admin **can** reach `/admin`, but that a normal user gets **403** and an anonymous user gets **401**.\n" +
        "- That POST without `with(csrf())` is **rejected** when CSRF is enabled.\n" +
        "- That method security fires (`@PreAuthorize` on a service, called directly in a `@SpringBootTest`).\n" +
        "- That the JWT is rejected when expired, when the signature is wrong, and when the audience does not match.\n" +
        "- That security headers are present.\n\n" +
        "A good habit: a **parameterised matrix test** of (endpoint × role → expected status). It documents the policy and catches accidental exposure of a new endpoint.",
      code: `import org.junit.jupiter.api.*;
import org.junit.jupiter.params.*;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.*;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request
    .SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;

@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)               // slice tests do NOT auto-import it
class SecurityWebTest {

    @Autowired MockMvc mvc;

    @Test
    void anonymousGets401() throws Exception {
        mvc.perform(get("/api/orders"))
           .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "alice", roles = "USER")     // becomes ROLE_USER
    void userCanRead() throws Exception {
        mvc.perform(get("/api/orders")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void userCannotReachAdmin() throws Exception {
        mvc.perform(get("/api/admin/stats"))
           .andExpect(status().isForbidden());            // 403, not 401
    }

    @Test
    @WithMockUser(authorities = "SCOPE_orders:write")     // authorities: no prefix added
    void scopeBasedAccess() throws Exception {
        mvc.perform(post("/api/orders").with(csrf()).contentType("application/json")
                .content("{}"))
           .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "USER")
    void postWithoutCsrfTokenIsRejected() throws Exception {
        mvc.perform(post("/api/orders").contentType("application/json").content("{}"))
           .andExpect(status().isForbidden());            // proves CSRF is active
    }

    @Test
    void jwtResourceServer() throws Exception {
        mvc.perform(get("/api/orders")
                .with(jwt().jwt(j -> j.claim("sub", "alice"))
                           .authorities(new org.springframework.security.core.authority
                               .SimpleGrantedAuthority("SCOPE_orders:read"))))
           .andExpect(status().isOk());
    }

    @Test
    void securityHeadersArePresent() throws Exception {
        mvc.perform(get("/api/public/ping"))
           .andExpect(header().string("X-Content-Type-Options", "nosniff"))
           .andExpect(header().exists("X-Frame-Options"));
    }

    /** The policy matrix: documents the rules AND catches accidental exposure. */
    @ParameterizedTest(name = "{0} as {1} -> {2}")
    @CsvSource({
        "/api/orders,        USER,  200",
        "/api/orders,        ADMIN, 200",
        "/api/admin/stats,   USER,  403",
        "/api/admin/stats,   ADMIN, 200",
        "/api/public/ping,   ,      200"
    })
    void authorizationMatrix(String path, String role, int expected) throws Exception {
        var request = get(path);
        if (role != null && !role.isBlank()) request = request.with(user("u").roles(role));
        mvc.perform(request).andExpect(status().is(expected));
    }
}

/** Method security must be tested where it lives - in the service layer. */
@SpringBootTest
class MethodSecurityTest {

    @Autowired OrderService orders;

    @Test
    @WithMockUser(roles = "USER")
    void refundRequiresPermission() {
        assertThatThrownBy(() -> orders.refund(1L))
            .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    @WithMockUser(authorities = {"order:refund", "ROLE_MANAGER"})
    void managerCanRefund() {
        assertThatCode(() -> orders.refund(1L)).doesNotThrowAnyException();
    }

    @Test
    @WithUserDetails(value = "alice@example.com",
                     userDetailsServiceBeanName = "databaseUserDetailsService")
    void realUserDetailsAreLoaded() {
        assertThatCode(() -> orders.find(1L)).doesNotThrowAnyException();
    }
}

/** Custom principal: a @WithSecurityContext factory. */
@java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithTenantUserSecurityContextFactory.class)
@interface WithTenantUser {
    String username() default "alice";
    String tenant() default "tenant-1";
    String[] roles() default {"USER"};
}

class WithTenantUserSecurityContextFactory
        implements WithSecurityContextFactory<WithTenantUser> {
    @Override
    public org.springframework.security.core.context.SecurityContext createSecurityContext(
            WithTenantUser annotation) {
        var authorities = java.util.Arrays.stream(annotation.roles())
            .map(r -> new org.springframework.security.core.authority
                .SimpleGrantedAuthority("ROLE_" + r))
            .toList();
        var auth = new org.springframework.security.authentication
            .UsernamePasswordAuthenticationToken(annotation.username(), null, authorities);
        var context = org.springframework.security.core.context.SecurityContextHolder
            .createEmptyContext();
        context.setAuthentication(auth);
        return context;
    }
}`,
      codeLanguage: "java",
      explanation:
        "Use spring-security-test with @WithMockUser or post-processors, and assert the negative cases — 403, 401 and CSRF rejection — not just the happy path.",
      followUps: [
        "Why does @WebMvcTest need an explicit @Import of the security config?",
        "What does a parameterised authorization matrix catch that individual tests miss?",
      ],
    },
    {
      id: "b122",
      question: "Walk through the OWASP Top 10 and how a Spring Boot application mitigates each.",
      answer:
        "The 2021 list, with the Spring-specific answer for each:\n\n" +
        "**A01 Broken Access Control** — the number one risk. Enforce `anyRequest().authenticated()` as the last rule, add method security in the service layer, and always **check ownership and tenancy in the query**, never only in the URL. Never trust a client-supplied id (IDOR).\n\n" +
        "**A02 Cryptographic Failures** — TLS everywhere with HSTS; Argon2/BCrypt for passwords; AES-GCM (never ECB) for data; secrets in Vault or a secrets manager, never in `application.yml`; `@Column` encryption or Jasypt for sensitive fields.\n\n" +
        "**A03 Injection** — parameter binding for **SQL** (JPA/`@Param`, never string concatenation; note that `@Query` with `nativeQuery` and concatenation is still injectable, and `Sort`/`Pageable` property names can be an injection vector too). For **XSS**, Thymeleaf escapes by default (`th:utext` does not); add a Content Security Policy. For **command injection**, avoid `Runtime.exec` with user input. Validate everything with Bean Validation.\n\n" +
        "**A04 Insecure Design** — threat modelling, rate limiting (Bucket4j/Resilience4j), a deny-by-default posture, and business-logic limits.\n\n" +
        "**A05 Security Misconfiguration** — do not expose all actuator endpoints; disable stack traces (`server.error.include-stacktrace: never`); change default credentials; turn off H2 console in production; set security headers; keep CORS tight.\n\n" +
        "**A06 Vulnerable Components** — OWASP Dependency-Check or Snyk in CI, Dependabot, and keep Spring Boot current (remember Log4Shell and Spring4Shell).\n\n" +
        "**A07 Identification and Authentication Failures** — MFA, lockout with exponential backoff, session fixation protection, secure session cookies, generic error messages.\n\n" +
        "**A08 Software and Data Integrity Failures** — **never deserialize untrusted data** with Java serialization; disable Jackson's default typing; sign artifacts; pin dependency checksums.\n\n" +
        "**A09 Logging and Monitoring Failures** — log authentication successes and failures and authorization denials, **never log secrets or tokens**, centralise logs, and alert on spikes.\n\n" +
        "**A10 SSRF** — validate and allowlist outbound URLs, block link-local `169.254.169.254` (cloud metadata), disable redirect following, and use network egress rules.",
      code: `import jakarta.validation.constraints.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.*;
import java.util.List;

/** A01: ownership enforced in the QUERY, not in an if-statement. */
interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    // SAFE: parameter binding.
    @Query("select i from Invoice i where i.id = :id and i.ownerId = :ownerId")
    java.util.Optional<Invoice> findOwned(Long id, String ownerId);

    // A03 UNSAFE: never concatenate, even in a native query.
    // @Query(value = "select * from invoice where status = '" + status + "'",
    //        nativeQuery = true)

    // SAFE native query.
    @Query(value = "select * from invoice where status = :status", nativeQuery = true)
    List<Invoice> byStatus(@org.springframework.data.repository.query.Param("status") String status);
}

record Invoice(Long id, String ownerId, String status) { }

@RestController
@RequestMapping("/api/invoices")
class InvoiceController {

    private final InvoiceRepository repository;
    InvoiceController(InvoiceRepository repository) { this.repository = repository; }

    /** A01: IDOR prevented - the owner is taken from the token, not the request. */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    Invoice get(@PathVariable Long id,
                @org.springframework.security.core.annotation.AuthenticationPrincipal
                org.springframework.security.core.userdetails.UserDetails principal) {
        return repository.findOwned(id, principal.getUsername())
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND));   // 404, not 403
    }

    /** A03: Bean Validation on every input. */
    @PostMapping
    Invoice create(@RequestBody @jakarta.validation.Valid CreateInvoice request) {
        return new Invoice(1L, "alice", "NEW");
    }

    record CreateInvoice(
        @NotBlank @Size(max = 100) String reference,
        @Positive @Max(1_000_000) long amountCents,
        @Pattern(regexp = "^[A-Z]{3}$") String currency) { }
}

/** A10: SSRF defence - allowlist the host and block internal ranges. */
@org.springframework.stereotype.Service
class SafeUrlFetcher {

    private static final java.util.Set<String> ALLOWED_HOSTS =
        java.util.Set.of("api.partner.com", "cdn.example.com");

    public String fetch(String rawUrl) throws Exception {
        URI uri = URI.create(rawUrl);
        if (!"https".equals(uri.getScheme())) throw new IllegalArgumentException("https only");
        if (!ALLOWED_HOSTS.contains(uri.getHost())) throw new IllegalArgumentException("host");

        InetAddress address = InetAddress.getByName(uri.getHost());
        if (address.isLoopbackAddress() || address.isLinkLocalAddress()
                || address.isSiteLocalAddress() || address.isAnyLocalAddress()) {
            throw new IllegalArgumentException("internal address blocked");  // 169.254.169.254
        }

        var client = java.net.http.HttpClient.newBuilder()
            .followRedirects(java.net.http.HttpClient.Redirect.NEVER)   // no redirect pivot
            .connectTimeout(java.time.Duration.ofSeconds(2))
            .build();
        return client.send(java.net.http.HttpRequest.newBuilder(uri).build(),
            java.net.http.HttpResponse.BodyHandlers.ofString()).body();
    }
}

/*
A05: application.yml hardening
------------------------------
server:
  error:
    include-stacktrace: never
    include-message: never
    include-exception: false
  servlet.session.cookie: { http-only: true, secure: true, same-site: lax }

management:
  endpoints.web.exposure.include: health,info,prometheus   # never "*"
  endpoint.health.show-details: when-authorized

spring:
  h2.console.enabled: false
  jackson.deserialization.fail-on-unknown-properties: true   # A08
  datasource.password: \${DB_PASSWORD}                        # A02: never inline

logging.level.org.springframework.security: INFO             # A09
*/`,
      codeLanguage: "java",
      explanation:
        "Broken access control is number one: enforce ownership in the query, bind every parameter, harden actuator and error output, and allowlist outbound URLs.",
      followUps: [
        "Why return 404 rather than 403 for another user's resource?",
        "How does Jackson default typing enable an A08 deserialization attack?",
      ],
    },
    {
      id: "b123",
      question: "How do you secure service-to-service communication in a microservices architecture?",
      answer:
        "The starting principle is **zero trust**: the network is hostile, so every call is authenticated and authorised regardless of where it comes from.\n\n" +
        "**Edge vs internal.** At the edge, an API gateway terminates TLS, validates the user token, applies rate limiting and strips client-supplied internal headers. Internally, services must still verify — **never** trust a header like `X-User-Id` that the gateway 'promises' to set, unless the network genuinely prevents anything else from reaching the service.\n\n" +
        "Options for the internal hop, roughly in order of maturity:\n\n" +
        "1. **OAuth2 client credentials** — each service is a client with its own credentials and scopes; tokens are cached until expiry. Spring's `OAuth2AuthorizedClientManager` handles this, and `ServletBearerExchangeFilterFunction`/`ServerOAuth2AuthorizedClientExchangeFilterFunction` attach the token to `WebClient` calls.\n" +
        "2. **Token relay** — propagate the *user's* token downstream so the callee can enforce user-level authorization. Preserves identity end to end, but every service must be a resource server and the token audience must allow it.\n" +
        "3. **mTLS** — mutual TLS, where each service presents a certificate. Strong, but certificate rotation is operationally heavy unless a **service mesh** (Istio, Linkerd) manages it — which is why meshes are popular: mTLS plus policy without touching application code.\n" +
        "4. **SPIFFE/SPIRE** — workload identity as a standard, typically under a mesh.\n\n" +
        "Do not forget:\n\n" +
        "- **Trace context propagation** (`traceparent`, or Sleuth/Micrometer Tracing) so a security event can be followed across services.\n" +
        "- **Token exchange** (RFC 8693) when a service needs to act on behalf of a user with reduced scope.\n" +
        "- **Secrets management** — Vault or the cloud secret manager, with short-lived dynamic credentials, never environment variables baked into an image.\n" +
        "- **Resilience**: timeouts, circuit breakers and retries with **idempotency keys**, because a retried POST must not double-charge.\n" +
        "- **Defence in depth**: network policies, private subnets, and per-service least-privilege database users.",
      code: `import org.springframework.context.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.client.*;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.*;
import org.springframework.security.oauth2.client.web.reactive.function.client
    .ServletOAuth2AuthorizedClientExchangeFilterFunction;
import org.springframework.security.oauth2.server.resource.web.reactive.function.client
    .ServletBearerExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Configuration
public class ServiceToServiceSecurity {

    /** 1. CLIENT CREDENTIALS: this service authenticates as itself. */
    @Bean
    OAuth2AuthorizedClientManager authorizedClientManager(
            ClientRegistrationRepository registrations,
            OAuth2AuthorizedClientRepository clients) {
        OAuth2AuthorizedClientProvider provider =
            OAuth2AuthorizedClientProviderBuilder.builder()
                .clientCredentials()
                .refreshToken()
                .build();
        DefaultOAuth2AuthorizedClientManager manager =
            new DefaultOAuth2AuthorizedClientManager(registrations, clients);
        manager.setAuthorizedClientProvider(provider);
        return manager;
    }

    @Bean
    WebClient inventoryClient(OAuth2AuthorizedClientManager manager) {
        var oauth = new ServletOAuth2AuthorizedClientExchangeFilterFunction(manager);
        oauth.setDefaultClientRegistrationId("inventory-service");   // client_credentials
        return WebClient.builder()
            .baseUrl("https://inventory.internal")
            .apply(oauth.oauth2Configuration())
            .filter(correlationId())
            .build();
    }

    /** 2. TOKEN RELAY: forward the caller's token so user context survives the hop. */
    @Bean
    WebClient billingClient() {
        return WebClient.builder()
            .baseUrl("https://billing.internal")
            .filter(new ServletBearerExchangeFilterFunction())   // relays the bearer token
            .filter(correlationId())
            .build();
    }

    /** Propagate the trace/correlation id on every internal call. */
    private static org.springframework.web.reactive.function.client.ExchangeFilterFunction
            correlationId() {
        return (request, next) -> {
            String id = org.slf4j.MDC.get("traceId");
            return next.exchange(
                org.springframework.web.reactive.function.client.ClientRequest.from(request)
                    .header("X-Correlation-Id", id == null ? "unknown" : id)
                    .build());
        };
    }

    /** 3. mTLS: present a client certificate on outbound calls. */
    @Bean
    WebClient mutualTlsClient() throws Exception {
        var keyStore = java.security.KeyStore.getInstance("PKCS12");
        try (var in = getClass().getResourceAsStream("/certs/service.p12")) {
            keyStore.load(in, System.getenv("KEYSTORE_PASSWORD").toCharArray());
        }
        var keyManagerFactory = javax.net.ssl.KeyManagerFactory.getInstance(
            javax.net.ssl.KeyManagerFactory.getDefaultAlgorithm());
        keyManagerFactory.init(keyStore, System.getenv("KEYSTORE_PASSWORD").toCharArray());

        var sslContext = reactor.netty.http.client.HttpClient.create()
            .secure(spec -> spec.sslContext(
                io.netty.handler.ssl.SslContextBuilder.forClient()
                    .keyManager(keyManagerFactory).build()))
            .responseTimeout(Duration.ofSeconds(3));

        return WebClient.builder()
            .clientConnector(new org.springframework.http.client.reactive
                .ReactorClientHttpConnector(sslContext))
            .build();
    }
}

/** Never trust an identity header from the network - verify the token instead. */
@org.springframework.stereotype.Component
class HeaderStrippingFilter extends org.springframework.web.filter.OncePerRequestFilter {
    @Override protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request,
                                              jakarta.servlet.http.HttpServletResponse response,
                                              jakarta.servlet.FilterChain chain)
            throws jakarta.servlet.ServletException, java.io.IOException {
        // Wrap the request so spoofed internal headers are invisible downstream.
        var wrapped = new jakarta.servlet.http.HttpServletRequestWrapper(request) {
            @Override public String getHeader(String name) {
                if ("X-User-Id".equalsIgnoreCase(name) || "X-Roles".equalsIgnoreCase(name)) {
                    return null;                       // client-supplied: drop it
                }
                return super.getHeader(name);
            }
        };
        chain.doFilter(wrapped, response);
    }
}

/*
application.yml - this service as both resource server and client
-----------------------------------------------------------------
spring.security.oauth2:
  resourceserver.jwt.issuer-uri: https://auth.internal/realms/services
  client:
    registration.inventory-service:
      client-id: orders-service
      client-secret: \${CLIENT_SECRET}          # from Vault, not the image
      authorization-grant-type: client_credentials
      scope: inventory:read,inventory:reserve
    provider.inventory-service.token-uri: https://auth.internal/oauth2/token
*/`,
      codeLanguage: "java",
      explanation:
        "Zero trust: client credentials or token relay for identity, mTLS or a mesh for transport, and never trust client-supplied identity headers.",
      followUps: [
        "When would you relay the user token instead of using client credentials?",
        "Why is a service mesh attractive for mTLS?",
      ],
    },
    {
      id: "b124",
      question: "Explain rate limiting, brute-force protection and account lockout in Spring Boot.",
      answer:
        "Authentication endpoints are the highest-value target in any application, so throttling is a security control, not just a capacity one.\n\n" +
        "**Rate-limiting algorithms** — know the trade-offs:\n\n" +
        "- **Fixed window** — simplest, but allows a 2× burst at the window boundary.\n" +
        "- **Sliding window log** — exact, but stores every timestamp.\n" +
        "- **Sliding window counter** — a good approximation, the usual production choice.\n" +
        "- **Token bucket** — allows a controlled burst then a steady refill. This is what **Bucket4j** implements and what most APIs want.\n" +
        "- **Leaky bucket** — smooths output to a constant rate.\n\n" +
        "**Where to enforce it:** ideally at the edge (API gateway, nginx, Cloudflare) *and* in the application for business-level limits. In-memory limiting breaks with multiple instances, so back it with **Redis** (Bucket4j has a Redis/Hazelcast backend) — otherwise N instances means N× the limit.\n\n" +
        "**Brute-force protection on login**, layered:\n\n" +
        "1. **Per-username counter** — after N failures, lock the account temporarily with **exponential backoff** (1 s, 2 s, 4 s …). Watch out: a pure per-username lock is itself a **denial-of-service vector** — an attacker can lock out real users on purpose.\n" +
        "2. **Per-IP counter** — catches credential stuffing across many accounts. Combine both.\n" +
        "3. **CAPTCHA after a few failures** — raises the cost without locking anyone out.\n" +
        "4. **MFA** — the real fix; it makes a stolen password insufficient.\n" +
        "5. **Breached-credential checks** via the Have I Been Pwned k-anonymity API.\n\n" +
        "Implementation in Spring: listen for `AuthenticationFailureBadCredentialsEvent` and `AuthenticationSuccessEvent` to maintain the counters, and reflect the lock through `UserDetails.isAccountNonLocked()` so `DaoAuthenticationProvider` throws `LockedException` for you.\n\n" +
        "**Response hygiene:** return **429 Too Many Requests** with a `Retry-After` header, keep the message identical for locked and unknown accounts (no enumeration), and emit metrics and alerts on the failure rate.",
      code: `import io.github.bucket4j.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.event.*;
import org.springframework.stereotype.*;
import org.springframework.web.filter.OncePerRequestFilter;

import java.time.*;
import java.util.*;
import java.util.concurrent.*;

/** Token bucket: 100 requests/minute with a burst of 20. */
@Component
class RateLimitFilter extends OncePerRequestFilter {

    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket newBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1))))
            .addLimit(Bandwidth.classic(20,  Refill.intervally(20,  Duration.ofSeconds(1))))
            .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, java.io.IOException {
        String key = clientKey(request);
        Bucket bucket = buckets.computeIfAbsent(key, k -> newBucket());
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            response.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
            chain.doFilter(request, response);
        } else {
            long waitSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000;
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(waitSeconds));
            response.setContentType("application/problem+json");
            response.getWriter().write(
                "{\\"title\\":\\"Too many requests\\",\\"status\\":429}");
        }
    }

    /** Prefer the authenticated principal; fall back to IP. */
    private String clientKey(HttpServletRequest request) {
        var auth = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return "user:" + auth.getName();
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        return "ip:" + (forwarded != null ? forwarded.split(",")[0].trim()
                                          : request.getRemoteAddr());
    }
}

/** Brute-force protection: per-username AND per-IP, with exponential backoff. */
@Service
class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private final ConcurrentMap<String, Attempt> attempts = new ConcurrentHashMap<>();

    record Attempt(int count, Instant lockedUntil) { }

    public void onFailure(String key) {
        attempts.compute(key, (k, existing) -> {
            int count = existing == null ? 1 : existing.count() + 1;
            Instant until = count >= MAX_ATTEMPTS
                // exponential backoff: 1s, 2s, 4s, 8s ... capped at 15 minutes
                ? Instant.now().plusSeconds(Math.min(900, 1L << (count - MAX_ATTEMPTS)))
                : Instant.EPOCH;
            return new Attempt(count, until);
        });
    }

    public void onSuccess(String key) { attempts.remove(key); }

    public boolean isBlocked(String key) {
        Attempt attempt = attempts.get(key);
        return attempt != null && attempt.lockedUntil().isAfter(Instant.now());
    }
}

/** Wire the counters to Spring Security's authentication events. */
@Component
class AuthenticationAttemptListener {

    private final LoginAttemptService service;
    AuthenticationAttemptListener(LoginAttemptService service) { this.service = service; }

    @EventListener
    public void onFailure(AuthenticationFailureBadCredentialsEvent event) {
        String username = event.getAuthentication().getName();
        Object details = event.getAuthentication().getDetails();
        String ip = details instanceof org.springframework.security.web.authentication
            .WebAuthenticationDetails d ? d.getRemoteAddress() : "unknown";
        service.onFailure("user:" + username);     // targeted attack
        service.onFailure("ip:" + ip);             // credential stuffing
    }

    @EventListener
    public void onSuccess(AuthenticationSuccessEvent event) {
        service.onSuccess("user:" + event.getAuthentication().getName());
    }
}

/**
 * Reflect the lock through UserDetails so DaoAuthenticationProvider raises
 * LockedException for you - no special-casing in the controller.
 */
@Service
class LockAwareUserDetailsService
        implements org.springframework.security.core.userdetails.UserDetailsService {

    private final org.springframework.security.core.userdetails.UserDetailsService delegate;
    private final LoginAttemptService attempts;

    LockAwareUserDetailsService(
            org.springframework.security.core.userdetails.UserDetailsService delegate,
            LoginAttemptService attempts) {
        this.delegate = delegate; this.attempts = attempts;
    }

    @Override
    public org.springframework.security.core.userdetails.UserDetails loadUserByUsername(
            String username) {
        if (attempts.isBlocked("user:" + username)) {
            throw new org.springframework.security.authentication.LockedException(
                "Account temporarily locked");     // same generic message either way
        }
        return delegate.loadUserByUsername(username);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Token-bucket limiting backed by Redis, plus per-username and per-IP failure counters with exponential backoff surfaced as LockedException.",
      followUps: [
        "Why is per-username lockout alone a denial-of-service risk?",
        "What breaks if the rate limiter is in-memory across three instances?",
      ],
    },
  ],
  meta: {
    b107: { difficulty: "hard", priority: "very-high", tags: ["filter-chain", "architecture", "spring-security"], readMinutes: 6 },
    b108: { difficulty: "medium", priority: "very-high", tags: ["authentication", "provider", "authorization"], readMinutes: 6 },
    b109: { difficulty: "medium", priority: "very-high", tags: ["securitycontext", "threadlocal", "async"], readMinutes: 5 },
    b110: { difficulty: "medium", priority: "very-high", tags: ["userdetails", "authorities", "jpa"], readMinutes: 5 },
    b111: { difficulty: "medium", priority: "very-high", tags: ["password", "bcrypt", "argon2"], readMinutes: 5 },
    b112: { difficulty: "medium", priority: "very-high", tags: ["configuration", "spring-security-6", "migration"], readMinutes: 6 },
    b113: { difficulty: "medium", priority: "very-high", tags: ["method-security", "preauthorize", "spel"], readMinutes: 5 },
    b114: { difficulty: "medium", priority: "very-high", tags: ["csrf", "tokens", "cookies"], readMinutes: 5 },
    b115: { difficulty: "medium", priority: "high", tags: ["cors", "preflight", "browser"], readMinutes: 5 },
    b116: { difficulty: "medium", priority: "high", tags: ["session", "fixation", "concurrency"], readMinutes: 5 },
    b117: { difficulty: "hard", priority: "very-high", tags: ["oauth2", "oidc", "grants"], readMinutes: 6 },
    b118: { difficulty: "hard", priority: "high", tags: ["custom-filter", "onceperrequestfilter", "chain"], readMinutes: 5 },
    b119: { difficulty: "medium", priority: "high", tags: ["401", "403", "exception-handling"], readMinutes: 5 },
    b120: { difficulty: "medium", priority: "high", tags: ["rbac", "abac", "role-hierarchy"], readMinutes: 5 },
    b121: { difficulty: "medium", priority: "high", tags: ["testing", "withmockuser", "mockmvc"], readMinutes: 5 },
    b122: { difficulty: "hard", priority: "very-high", tags: ["owasp", "vulnerabilities", "hardening"], readMinutes: 6 },
    b123: { difficulty: "hard", priority: "high", tags: ["microservices", "mtls", "client-credentials"], readMinutes: 6 },
    b124: { difficulty: "medium", priority: "high", tags: ["rate-limiting", "brute-force", "lockout"], readMinutes: 5 },
  },
});
