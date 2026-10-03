import { defineBackendChunk } from "./contract";

/**
 * Application Security Hardening (b255–b257).
 *
 * Fills the Chapter 7 gaps the Spring Security/JWT banks miss: transport
 * security (TLS/HTTPS), security logging & auditing, and input validation /
 * path traversal defenses.
 */
export const chunk19SecurityHardening = defineBackendChunk({
  topic: "security-hardening",
  questions: [
    {
      id: "b255",
      question: "How does TLS/HTTPS work, and how do you use it in a backend?",
      answer:
        "**TLS** gives three guarantees over TCP: **confidentiality** (encryption), **integrity** (tamper detection), and **authentication** (the server proves its identity via a certificate). HTTPS is HTTP over TLS.\n\n" +
        "**Handshake (simplified):** client and server agree on a cipher suite; the server presents its **certificate** (a public key signed by a CA); the client validates the cert chain up to a trusted root and checks the hostname/expiry; they derive a shared **session key** (modern TLS 1.3 uses ephemeral Diffie-Hellman for forward secrecy) and switch to fast symmetric encryption. Asymmetric crypto is used only to bootstrap the symmetric key.\n\n" +
        "**Backend practice:** usually **terminate TLS at the load balancer / ingress / API gateway** and run the app on HTTP inside a trusted network — simpler cert management. For **zero-trust / service-to-service**, use **mTLS** (both sides present certs) so services mutually authenticate. Enforce **HSTS**, redirect HTTP→HTTPS, keep TLS ≥ 1.2 (prefer 1.3), rotate certs (automate with cert-manager/ACME), and never disable certificate validation in HTTP clients ('trust all' is a real, common vulnerability).",
      code: `# Spring Boot serving TLS directly (often TLS is terminated at the LB instead)
server:
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-type: PKCS12
    key-store-password: \${KEYSTORE_PASSWORD}
  port: 8443

# Enforce HTTPS + HSTS (SecurityFilterChain)
# http.requiresChannel(c -> c.anyRequest().requiresSecure())
#     .headers(h -> h.httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000)));
# For service-to-service zero trust: enable mutual TLS (client-auth: need)`,
      codeLanguage: "yaml",
      explanation:
        "Transport security basics — TLS confidentiality/integrity/authentication, the handshake, LB termination vs mTLS, and never disabling cert validation.",
      followUps: [
        "Why is asymmetric crypto only used during the handshake?",
        "When would you use mTLS?",
        "What does HSTS protect against?",
      ],
    },
    {
      id: "b256",
      question: "How do you do security logging and auditing properly?",
      answer:
        "Security/audit logs answer 'who did what, when, from where' — for forensics, compliance (SOX, GDPR, PCI) and detection. Log the **security-relevant events**: authentication success/failure, authorization denials, privilege/role changes, password resets, access to sensitive data, and admin actions. Capture actor id, timestamp, source IP, action, target, and outcome — ideally correlated by a trace id.\n\n" +
        "**Critical rules:**\n\n" +
        "- **Never log secrets or sensitive data** — no passwords, tokens, full card numbers, or PII in plaintext. **Mask/redact** them; logging a JWT or password is itself a breach. This is OWASP's 'sensitive data exposure' via logs.\n" +
        "- **Tamper-evidence / integrity** — audit logs should be append-only, shipped off-box to a central store (SIEM), and access-controlled so an attacker can't erase their tracks.\n" +
        "- **Retention** — keep per policy, then delete (GDPR).\n" +
        "- **Don't log-and-throw** duplicate noise; log at the boundary with enough context.\n\n" +
        "Keep the **audit trail** (business/compliance record, structured, durable) separate from ordinary application logs. Alert on patterns (repeated auth failures → brute force).",
      code: `// Structured audit event: actor, action, target, outcome, source — NO secrets
auditLog.info("event=LOGIN_FAILED user={} ip={} reason={} traceId={}",
        maskEmail(username), request.getRemoteAddr(), "BAD_CREDENTIALS",
        MDC.get("traceId"));

// Redact sensitive fields before they ever reach a log
String masked = card.replaceAll("\\\\d(?=\\\\d{4})", "*"); // ************1234
// NEVER: log.info("token={}", jwt);  // logging a token = credential leak`,
      codeLanguage: "java",
      explanation:
        "Forensics & compliance awareness — log security events with context, never log secrets/PII, keep the audit trail tamper-evident and separate.",
      followUps: [
        "What must never appear in logs?",
        "Why keep audit logs separate and append-only?",
        "Which events belong in a security audit trail?",
      ],
    },
    {
      id: "b257",
      question: "How do you defend against injection and path traversal via input validation?",
      answer:
        "Treat **all client input as untrusted** and validate at the boundary. Two complementary ideas: **validate/allowlist** on the way in, and **encode/parameterize** on the way out (context-specific).\n\n" +
        "- **Bean Validation** (`@Valid`, `@NotNull`, `@Size`, `@Pattern`, `@Email`) on request DTOs rejects malformed input early with a clean 400. Prefer **allowlists** (what's permitted) over blocklists (what's banned) — blocklists are always bypassable.\n" +
        "- **Injection** — parameterize everything: `PreparedStatement`/JPA parameters for SQL, never build queries by concatenation; the same principle for OS commands (avoid shelling out; if unavoidable, no string interpolation) and LDAP.\n" +
        "- **XSS** — output-encode data for the context (HTML/JS/URL) when rendering; for APIs, ensure JSON is served as `application/json` and don't reflect unencoded input.\n" +
        "- **Path traversal** — a `../../etc/passwd` filename escapes the intended directory. **Never** concatenate user input into a file path. Canonicalize the resolved path and verify it stays **within** the allowed base directory; better, don't accept file paths at all — use an id that maps to a known location.\n\n" +
        "Also relevant: deserialization of untrusted data (avoid Java native serialization), and mass assignment (bind to explicit DTOs, not entities).",
      code: `// Validate at the boundary (allowlist pattern) -> clean 400 on bad input
public record CreateUser(@Email String email,
                         @Pattern(regexp = "[A-Za-z0-9_]{3,20}") String username) {}
@PostMapping("/users")
User create(@Valid @RequestBody CreateUser req) { ... }

// Path traversal defense: resolve then confirm it's inside the base dir
Path base = Paths.get("/data/uploads").toRealPath();
Path target = base.resolve(userFilename).normalize();
if (!target.startsWith(base)) {                 // blocks ../../ escapes
    throw new SecurityException("Invalid path");
}`,
      codeLanguage: "java",
      explanation:
        "Common attack surface — validate/allowlist input, parameterize to stop injection, output-encode for XSS, and canonicalize+contain file paths.",
      followUps: [
        "Why allowlist over blocklist?",
        "How exactly does a path-traversal check work?",
        "What is mass assignment and how do DTOs prevent it?",
      ],
    },
  ],
  meta: {
    b255: { difficulty: "medium", priority: "high", tags: ["tls", "https", "mtls"], readMinutes: 5 },
    b256: { difficulty: "medium", priority: "high", tags: ["audit", "security-logging", "compliance"], readMinutes: 4 },
    b257: { difficulty: "medium", priority: "very-high", tags: ["input-validation", "path-traversal", "injection"], readMinutes: 5 },
  },
});
