import { defineBackendChunk } from "./contract";

/**
 * JWT — complete theory and production practice (b125–b138).
 */
export const chunk09Jwt = defineBackendChunk({
  topic: "jwt",
  questions: [
    {
      id: "b125",
      question: "What is a JWT? Break down its structure byte by byte.",
      answer:
        "A **JSON Web Token** (RFC 7519) is a compact, URL-safe way to transmit **claims** between two parties. The form you see in practice is a **JWS** (JSON Web Signature, RFC 7515): three **Base64URL**-encoded parts separated by dots.\n\n" +
        "`header.payload.signature`\n\n" +
        "**1. Header** — JSON describing how the token is protected:\n\n" +
        "- `alg` — the signing algorithm (`HS256`, `RS256`, `ES256`).\n" +
        "- `typ` — conventionally `JWT`; RFC 8725 recommends an explicit type such as `at+jwt` for access tokens so one token type cannot be substituted for another.\n" +
        "- `kid` — key id, so the verifier can select the right key from a JWKS during rotation.\n\n" +
        "**2. Payload** — the claims. Three categories: **registered** (`iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti`), **public** (namespaced, registered in the IANA registry) and **private** (whatever you and the consumer agree on).\n\n" +
        "**3. Signature** — computed over `base64url(header) + \".\" + base64url(payload)`. For HS256 it is an HMAC with a shared secret; for RS256 an RSA signature with a private key, verified with the public key.\n\n" +
        "The critical properties to state plainly:\n\n" +
        "- **Base64URL is encoding, not encryption.** Anyone can read the payload — paste it into jwt.io. **Never put secrets, passwords or PII in a JWT.**\n" +
        "- The signature guarantees **integrity and authenticity**, not confidentiality. If you need confidentiality you need **JWE** (encryption) or plain TLS plus an opaque token.\n" +
        "- Base64URL replaces `+` with `-`, `/` with `_` and drops `=` padding, so the token is safe in a URL or a header.\n" +
        "- It is **self-contained**: the resource server can validate it with no database call, which is the whole selling point — and also the source of the revocation problem.",
      code: `import com.fasterxml.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/** Building and dissecting a JWS by hand - no library - to show the mechanics. */
public class JwtAnatomy {

    private static final Base64.Encoder ENC = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DEC = Base64.getUrlDecoder();
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        String secret = "a-string-of-at-least-256-bits-for-hs256-signing!!";

        Map<String, Object> header = Map.of(
            "alg", "HS256",
            "typ", "at+jwt",              // explicit type (RFC 8725)
            "kid", "key-2026-01");        // which key signed it

        long now = System.currentTimeMillis() / 1000;
        Map<String, Object> payload = Map.of(
            "iss", "https://auth.example.com",
            "sub", "user-12345",
            "aud", "orders-api",
            "exp", now + 900,             // 15 minutes
            "iat", now,
            "jti", java.util.UUID.randomUUID().toString(),
            "scope", "orders:read orders:write",
            "roles", java.util.List.of("USER"));

        String encodedHeader  = ENC.encodeToString(MAPPER.writeValueAsBytes(header));
        String encodedPayload = ENC.encodeToString(MAPPER.writeValueAsBytes(payload));
        String signingInput   = encodedHeader + "." + encodedPayload;

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String signature = ENC.encodeToString(
            mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8)));

        String jwt = signingInput + "." + signature;
        System.out.println("token:\\n" + jwt + "\\n");

        // ---- Decoding: NO key needed. This is the point people miss. ----
        String[] parts = jwt.split("\\\\.");
        System.out.println("header : " + new String(DEC.decode(parts[0])));
        System.out.println("payload: " + new String(DEC.decode(parts[1])));
        System.out.println("=> anyone can read the payload; it is encoded, NOT encrypted");

        // ---- Verifying: recompute the MAC and compare in constant time. ----
        byte[] expected = mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
        byte[] actual   = DEC.decode(parts[2]);
        boolean valid = java.security.MessageDigest.isEqual(expected, actual);
        System.out.println("\\nsignature valid: " + valid);

        // ---- Tampering: change one character of the payload ----
        String tamperedPayload = ENC.encodeToString(MAPPER.writeValueAsBytes(
            Map.of("sub", "user-99999", "exp", now + 900)));
        String tampered = encodedHeader + "." + tamperedPayload + "." + signature;
        String[] tamperedParts = tampered.split("\\\\.");
        byte[] recomputed = mac.doFinal(
            (tamperedParts[0] + "." + tamperedParts[1]).getBytes(StandardCharsets.UTF_8));
        System.out.println("tampered token valid: " + java.security.MessageDigest.isEqual(
            recomputed, DEC.decode(tamperedParts[2])));    // false

        // Base64URL vs standard Base64.
        byte[] raw = {(byte) 0xfb, (byte) 0xff, (byte) 0xbe};
        System.out.println("\\nbase64     : " + Base64.getEncoder().encodeToString(raw));
        System.out.println("base64url  : " + ENC.encodeToString(raw));   // - and _ , no =
    }
}`,
      codeLanguage: "java",
      explanation:
        "Three Base64URL parts: header, payload, signature — the payload is readable by anyone, so it must never carry secrets.",
      followUps: [
        "Why does RFC 8725 recommend an explicit typ such as at+jwt?",
        "What does the signature protect and what does it not protect?",
      ],
    },
    {
      id: "b126",
      question: "What are the registered JWT claims and why does each one matter for security?",
      answer:
        "The seven registered claims from RFC 7519 — each exists to block a specific attack:\n\n" +
        "- **`iss` (issuer)** — who minted the token. **Must be validated**, otherwise a token from a different (perhaps attacker-controlled) authorization server would be accepted. The value is normally a URL from which the JWKS is discovered.\n" +
        "- **`sub` (subject)** — who the token is about. Should be an **opaque, stable, non-reassignable** identifier — a UUID, not an email address, because emails change and get reused.\n" +
        "- **`aud` (audience)** — who the token is *for*. **Validating this is essential.** Without it, a token issued for a low-value service can be **replayed** against a high-value one — the classic 'confused deputy'. May be a string or an array.\n" +
        "- **`exp` (expiration time)** — a NumericDate (seconds since epoch, **not** milliseconds). Enforced with a small **clock skew** allowance, conventionally 30–60 seconds. Access tokens should be short: 5–15 minutes.\n" +
        "- **`nbf` (not before)** — the token is invalid before this time. Useful for pre-issued or scheduled tokens.\n" +
        "- **`iat` (issued at)** — when it was minted. Lets a verifier reject tokens that are too old regardless of `exp`, and supports the 'invalidate everything issued before the password change' pattern.\n" +
        "- **`jti` (JWT ID)** — a unique id. The hook for **replay detection** and for a **revocation denylist**: store the `jti` with a TTL equal to the remaining lifetime.\n\n" +
        "Frequently seen non-registered claims: `scope`/`scp` (OAuth2 scopes, space-delimited), `azp` (authorized party), `client_id`, `auth_time`, `acr`/`amr` (authentication context and methods, i.e. was MFA used), `nonce` (OIDC replay protection), and provider-specific role claims such as Keycloak's `realm_access.roles`.\n\n" +
        "**The validation checklist to recite:** signature → `alg` is expected → `iss` matches → `aud` contains me → `exp`/`nbf` with skew → `jti` not revoked → required claims present. Skipping `aud` or accepting any `alg` are the two most common real-world failures.",
      code: `import com.nimbusds.jwt.JWTClaimsSet;
import io.jsonwebtoken.*;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

public class ClaimsValidation {

    /** Minting a token with every claim that matters. */
    static String mint(javax.crypto.SecretKey key, String userId, Set<String> scopes) {
        Instant now = Instant.now();
        return Jwts.builder()
            .header().keyId("key-2026-01").type("at+jwt").and()
            .issuer("https://auth.example.com")            // iss
            .subject(userId)                               // sub - opaque, stable
            .audience().add("orders-api").and()            // aud - blocks replay elsewhere
            .issuedAt(Date.from(now))                      // iat
            .notBefore(Date.from(now))                     // nbf
            .expiration(Date.from(now.plus(15, ChronoUnit.MINUTES)))   // exp - short
            .id(UUID.randomUUID().toString())              // jti - revocation hook
            .claim("scope", String.join(" ", scopes))
            .claim("acr", "mfa")                           // authentication context
            .signWith(key, Jwts.SIG.HS256)
            .compact();
    }

    /** Parsing with every check enabled - jjwt style. */
    static Jws<Claims> verify(javax.crypto.SecretKey key, String token) {
        return Jwts.parser()
            .verifyWith(key)
            .requireIssuer("https://auth.example.com")     // iss
            .requireAudience("orders-api")                 // aud - do NOT skip this
            .require("acr", "mfa")                         // custom required claim
            .clockSkewSeconds(60)                          // tolerate clock drift
            .build()
            .parseSignedClaims(token);                     // throws on exp/nbf/signature
    }

    /** Spring Security: compose validators instead of hand-rolling checks. */
    static JwtDecoder decoder(String issuer, String audience) {
        NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuer);

        OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuer);

        OAuth2TokenValidator<Jwt> audienceValidator = jwt -> {
            List<String> aud = jwt.getAudience();
            return aud != null && aud.contains(audience)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error(
                    "invalid_token", "required audience missing", null));
        };

        OAuth2TokenValidator<Jwt> maxAgeValidator = jwt -> {
            Instant issuedAt = jwt.getIssuedAt();
            return issuedAt != null && issuedAt.isAfter(Instant.now().minus(24, ChronoUnit.HOURS))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"));
        };

        OAuth2TokenValidator<Jwt> typeValidator = jwt ->
            "at+jwt".equals(jwt.getHeaders().get("typ"))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"));

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            withIssuer, audienceValidator, maxAgeValidator, typeValidator));
        return decoder;
    }

    /** exp is SECONDS, not milliseconds - a classic off-by-1000 bug. */
    static void numericDateTrap() {
        long wrong = System.currentTimeMillis();            // ~1.7e12 -> year 55000
        long right = System.currentTimeMillis() / 1000;     // ~1.7e9  -> correct
        System.out.println("wrong exp " + wrong + " right exp " + right);
    }

    /** Invalidate every token issued before a security event, without a denylist. */
    static boolean issuedBeforePasswordChange(Claims claims, Instant passwordChangedAt) {
        return claims.getIssuedAt().toInstant().isBefore(passwordChangedAt);
    }

    static void nimbusExample() throws Exception {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
            .issuer("https://auth.example.com")
            .audience(List.of("orders-api", "reports-api"))   // aud may be an array
            .subject("c0ffee-uuid")
            .expirationTime(Date.from(Instant.now().plusSeconds(900)))
            .jwtID(UUID.randomUUID().toString())
            .build();
        System.out.println(claims.toJSONObject());
    }
}`,
      codeLanguage: "java",
      explanation:
        "iss, aud, exp, nbf, iat, sub and jti each block a specific attack — skipping aud allows cross-service replay, the confused-deputy problem.",
      followUps: [
        "How does an attacker exploit a missing aud check?",
        "Why should sub be opaque rather than an email address?",
      ],
    },
    {
      id: "b127",
      question: "Compare HS256, RS256 and ES256, and explain the alg:none and key-confusion attacks.",
      answer:
        "**HS256 — HMAC with SHA-256.** Symmetric: the same secret signs and verifies.\n\n" +
        "- Fast, small tokens, simple.\n" +
        "- **Every verifier can also mint tokens**, so it only works when issuer and verifier are the same trust domain. With five microservices sharing the secret, any one of them (or any one leak) can forge tokens for all.\n" +
        "- The secret must be **at least 256 bits** of real entropy. A short or dictionary secret is brute-forceable offline from a single captured token — `hashcat` does this in seconds.\n\n" +
        "**RS256 — RSA PKCS#1 v1.5 with SHA-256.** Asymmetric.\n\n" +
        "- The auth server holds the **private** key; every resource server verifies with the **public** key, which can be published freely via **JWKS**. This is why RS256 is the default for OAuth2/OIDC.\n" +
        "- Larger keys (2048+ bits) and larger signatures; signing is comparatively slow, verification is fast.\n" +
        "- `PS256` (RSA-PSS) is the modern, provably-secure padding — prefer it if both sides support it.\n\n" +
        "**ES256 — ECDSA with P-256 and SHA-256.** Asymmetric, elliptic curve.\n\n" +
        "- Same trust model as RS256 but with **much smaller keys and signatures** (64 bytes vs 256) and faster signing. Best choice for mobile and high-volume.\n" +
        "- Caveat: ECDSA needs a unique random nonce per signature; a repeated nonce leaks the private key (the PlayStation 3 failure). Use a vetted library. `EdDSA`/Ed25519 is deterministic and avoids this class of bug entirely.\n\n" +
        "**The `alg: none` attack:** the spec defines an 'unsecured JWT' with `alg: none` and an empty signature. A naive verifier that *reads `alg` from the token* and dispatches on it will accept anything an attacker writes. **Fix: never trust the token's own `alg` — pin the expected algorithm(s) in the verifier.**\n\n" +
        "**The key-confusion (algorithm substitution) attack:** the server expects RS256 and the public key is, by design, public. The attacker re-signs the token with **HS256 using the RSA public key as the HMAC secret**. A verifier that selects the algorithm from the header will happily HMAC-verify it. **Fix: pin the algorithm, and use a key type that only supports the expected algorithm.**",
      code: `import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.security.*;
import java.security.interfaces.*;
import java.security.spec.ECGenParameterSpec;
import java.util.Date;

public class SigningAlgorithms {

    public static void main(String[] args) throws Exception {

        // ---------- HS256: symmetric, >= 256-bit secret ----------
        SecretKey hmacKey = Keys.hmacShaKeyFor(
            "this-secret-must-be-at-least-32-bytes-long!!".getBytes());
        String hs256 = Jwts.builder().subject("alice")
            .expiration(new Date(System.currentTimeMillis() + 900_000))
            .signWith(hmacKey, Jwts.SIG.HS256).compact();

        // ---------- RS256: asymmetric, publish the public key via JWKS ----------
        KeyPairGenerator rsaGen = KeyPairGenerator.getInstance("RSA");
        rsaGen.initialize(2048);
        KeyPair rsa = rsaGen.generateKeyPair();
        String rs256 = Jwts.builder().subject("alice")
            .expiration(new Date(System.currentTimeMillis() + 900_000))
            .signWith(rsa.getPrivate(), Jwts.SIG.RS256).compact();

        // ---------- ES256: smaller and faster, same trust model ----------
        KeyPairGenerator ecGen = KeyPairGenerator.getInstance("EC");
        ecGen.initialize(new ECGenParameterSpec("secp256r1"));
        KeyPair ec = ecGen.generateKeyPair();
        String es256 = Jwts.builder().subject("alice")
            .expiration(new Date(System.currentTimeMillis() + 900_000))
            .signWith(ec.getPrivate(), Jwts.SIG.ES256).compact();

        System.out.println("HS256 length " + hs256.length());
        System.out.println("RS256 length " + rs256.length());
        System.out.println("ES256 length " + es256.length());   // noticeably shorter

        // ================= ATTACK 1: alg:none =================
        // The attacker crafts {"alg":"none"} with an empty signature.
        String header  = java.util.Base64.getUrlEncoder().withoutPadding()
            .encodeToString("{\\"alg\\":\\"none\\",\\"typ\\":\\"JWT\\"}".getBytes());
        String payload = java.util.Base64.getUrlEncoder().withoutPadding()
            .encodeToString(("{\\"sub\\":\\"admin\\",\\"exp\\":"
                + (System.currentTimeMillis() / 1000 + 9999) + "}").getBytes());
        String forged = header + "." + payload + ".";

        // SAFE: the parser is pinned to a key, so an unsecured JWT is rejected.
        try {
            Jwts.parser().verifyWith(hmacKey).build().parseSignedClaims(forged);
            System.out.println("ACCEPTED - vulnerable!");
        } catch (JwtException e) {
            System.out.println("alg:none rejected -> " + e.getClass().getSimpleName());
        }

        // UNSAFE pattern to avoid: reading alg from the token and dispatching on it.
        //   String alg = decodeHeader(token).get("alg");
        //   if (alg.equals("none")) return claims;     // <-- never do this

        // ============ ATTACK 2: RS256 -> HS256 key confusion ============
        // The attacker HMAC-signs using the PUBLIC key bytes as the secret.
        RSAPublicKey publicKey = (RSAPublicKey) rsa.getPublic();
        SecretKey confused = Keys.hmacShaKeyFor(
            java.util.Arrays.copyOf(publicKey.getEncoded(), 64));
        String attackToken = Jwts.builder().subject("admin")
            .expiration(new Date(System.currentTimeMillis() + 900_000))
            .signWith(confused, Jwts.SIG.HS256).compact();

        // SAFE: verifying with an RSAPublicKey cannot accept an HMAC signature.
        try {
            Jwts.parser().verifyWith(publicKey).build().parseSignedClaims(attackToken);
            System.out.println("ACCEPTED - vulnerable!");
        } catch (JwtException e) {
            System.out.println("key confusion rejected -> " + e.getClass().getSimpleName());
        }

        // ============ The correct verification shape ============
        Jws<Claims> verified = Jwts.parser()
            .verifyWith(publicKey)          // key type pins the algorithm family
            .clockSkewSeconds(60)
            .build()
            .parseSignedClaims(rs256);
        System.out.println("verified subject: " + verified.getPayload().getSubject()
            + " alg=" + verified.getHeader().getAlgorithm());
    }
}`,
      codeLanguage: "java",
      explanation:
        "HS256 shares one secret, RS256/ES256 split private signing from public verification — and you must pin the algorithm, never read it from the token.",
      followUps: [
        "Why can't five microservices safely share an HS256 secret?",
        "Explain the RS256-to-HS256 key confusion attack step by step.",
      ],
    },
    {
      id: "b128",
      question: "Walk me through validating a JWT correctly, step by step.",
      answer:
        "The order matters, because each step assumes the previous one succeeded. Cheap checks first, expensive last.\n\n" +
        "1. **Parse the structure.** Exactly three dot-separated Base64URL segments. Reject anything else before touching crypto.\n\n" +
        "2. **Read the header and pin the algorithm.** Check `alg` is in **your** allowlist (typically one value). **Never** let the token choose. Reject `none` explicitly.\n\n" +
        "3. **Select the key** by `kid` from your JWKS cache. If `kid` is unknown, refresh the JWKS **once**, with a rate limit — otherwise an attacker can force unbounded outbound requests by sending random `kid`s.\n\n" +
        "4. **Verify the signature** over `header.payload` using a constant-time comparison.\n\n" +
        "5. **Validate `iss`** — exact string match against the expected issuer.\n\n" +
        "6. **Validate `aud`** — must contain this service's identifier.\n\n" +
        "7. **Validate `exp` and `nbf`** with a small clock skew (30–60 s).\n\n" +
        "8. **Check `typ`** if you issue typed tokens (`at+jwt`), so an ID token cannot be used as an access token.\n\n" +
        "9. **Check revocation** — `jti` against a denylist, or `iat` against the user's `tokensValidAfter` timestamp.\n\n" +
        "10. **Check required claims** are present and well-formed, then **map claims to authorities**.\n\n" +
        "Things that separate a strong answer:\n\n" +
        "- **Use a library.** `nimbus-jose-jwt`, `jjwt`, or simply Spring Security's `NimbusJwtDecoder`. Hand-rolled verification is where the CVEs live.\n" +
        "- **Cache the JWKS** (Spring does, with a 5-minute default) but handle rotation.\n" +
        "- **Fail closed** — any error is a 401, with a generic body and `WWW-Authenticate: Bearer error=\"invalid_token\"`.\n" +
        "- **Do not log the token.** Log the `jti` and `sub` instead.\n" +
        "- Bound the token size; reject absurdly large ones before parsing.",
      code: `import com.nimbusds.jose.*;
import com.nimbusds.jose.jwk.source.*;
import com.nimbusds.jose.proc.*;
import com.nimbusds.jwt.*;
import com.nimbusds.jwt.proc.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.core.*;

import java.net.URL;
import java.time.Instant;
import java.util.*;

public class JwtValidation {

    /** The recommended path: let Spring Security compose the validators. */
    static JwtDecoder springDecoder(String issuer, String audience) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
            .withIssuerLocation(issuer)                    // discovers the JWKS uri
            .jwsAlgorithm(org.springframework.security.oauth2.jose.jws.SignatureAlgorithm.RS256)
            .build();                                      // algorithm PINNED

        OAuth2TokenValidator<Jwt> audienceValidator = jwt ->
            jwt.getAudience() != null && jwt.getAudience().contains(audience)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token", "bad audience", null));

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefaultWithIssuer(issuer),  // iss + exp + nbf
            audienceValidator));
        return decoder;
    }

    /** The same checks with Nimbus directly, so the order is explicit. */
    static JWTClaimsSet validate(String token, URL jwksUrl,
                                 String issuer, String audience,
                                 RevocationStore revoked) throws Exception {

        // 1. Structure + size guard.
        if (token == null || token.length() > 8_192) throw new BadJOSEException("size");
        if (token.chars().filter(c -> c == '.').count() != 2) throw new BadJOSEException("shape");

        ConfigurableJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();

        // 2 + 3. Pin the algorithm and resolve the key by kid from a CACHED JWKS.
        JWKSource<SecurityContext> keySource = JWKSourceBuilder
            .create(jwksUrl)
            .retrying(true)
            .cache(5 * 60 * 1000, 30 * 1000)          // 5 min TTL, 30 s refresh window
            .rateLimited(10)                          // stop kid-flood JWKS hammering
            .build();
        processor.setJWSKeySelector(
            new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource));

        // 8. Reject anything that is not an access token.
        processor.setJWSTypeVerifier(
            new DefaultJOSEObjectTypeVerifier<>(new JOSEObjectType("at+jwt")));

        // 5 + 6 + 7. Required and exact-match claims.
        processor.setJWTClaimsSetVerifier(new DefaultJWTClaimsVerifier<>(
            audience,
            new JWTClaimsSet.Builder().issuer(issuer).build(),
            new HashSet<>(Arrays.asList("sub", "exp", "iat", "jti"))));
        ((DefaultJWTClaimsVerifier<?>) processor.getJWTClaimsSetVerifier())
            .setMaxClockSkew(60);                     // seconds

        // 4. Signature verification happens inside process().
        JWTClaimsSet claims = processor.process(token, null);

        // 9. Revocation - denylist by jti, plus a per-user cutoff.
        if (revoked.contains(claims.getJWTID())) throw new BadJOSEException("revoked");
        Instant cutoff = revoked.tokensValidAfter(claims.getSubject());
        if (cutoff != null && claims.getIssueTime().toInstant().isBefore(cutoff)) {
            throw new BadJOSEException("issued before credential change");
        }

        return claims;
    }

    /** Fail closed, generically, with the RFC 6750 header - and never log the token. */
    static void reject(jakarta.servlet.http.HttpServletResponse response, Exception cause)
            throws java.io.IOException {
        // log.warn("token rejected: {}", cause.getMessage());   // no token, no claims
        response.setStatus(401);
        response.setHeader("WWW-Authenticate",
            "Bearer error=\\"invalid_token\\", error_description=\\"token validation failed\\"");
        response.setContentType("application/problem+json");
        response.getWriter().write("{\\"title\\":\\"Unauthorized\\",\\"status\\":401}");
    }

    interface RevocationStore {
        boolean contains(String jti);
        Instant tokensValidAfter(String subject);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Structure, pinned algorithm, key by kid, signature, iss, aud, exp/nbf with skew, typ, revocation, required claims — in that order, failing closed.",
      followUps: [
        "Why rate-limit JWKS refresh on an unknown kid?",
        "Why validate the typ header?",
      ],
    },
    {
      id: "b129",
      question: "Explain access tokens vs refresh tokens, and how refresh token rotation with reuse detection works.",
      answer:
        "The two tokens exist to resolve a tension: a self-contained token cannot be revoked, so it must be short-lived — but forcing the user to log in every 15 minutes is unacceptable.\n\n" +
        "**Access token** — sent with every API call. Short-lived (**5–15 minutes**), usually a JWT, validated locally with no database hit. If it leaks, the damage window is small.\n\n" +
        "**Refresh token** — sent **only** to the auth server's `/token` endpoint, and only to obtain a new access token. Long-lived (days to months), should be **opaque and stored server-side** (or at least hashed), which makes it **instantly revocable**.\n\n" +
        "**Refresh token rotation** — the important part:\n\n" +
        "1. Every refresh returns a **new** refresh token and **invalidates the old one**.\n" +
        "2. Tokens belonging to one login are grouped into a **family** (a chain).\n" +
        "3. **Reuse detection:** if an *already-used* refresh token is presented, the only explanations are theft or a race. The server **revokes the entire family**, forcing re-authentication, and raises a security alert.\n\n" +
        "This is the OAuth 2.1 / BCP recommendation, and it turns an undetectable long-lived theft into a detectable event: either the attacker or the legitimate user will trigger the reuse.\n\n" +
        "Practical details to mention:\n\n" +
        "- **Absolute vs sliding expiry** — cap the family lifetime (say 30 days) even if it is refreshed daily.\n" +
        "- **Grace window** — a few seconds of tolerance for the old token, because a mobile client with parallel requests may legitimately refresh twice; otherwise you will log users out at random.\n" +
        "- **Storage** — refresh token in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie scoped to the refresh path; access token in memory. Never both in `localStorage`.\n" +
        "- **Binding** — bind the refresh token to the client (and ideally to a device fingerprint or DPoP/mTLS), and hash it at rest exactly like a password.\n" +
        "- Client-side, **serialise concurrent refreshes** behind a single in-flight promise, or a page with six parallel requests will trigger six rotations.",
      code: `import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.*;
import java.util.*;

/** Opaque, hashed, family-tracked refresh tokens with reuse detection. */
@Service
public class RefreshTokenService {

    private static final Duration ACCESS_TTL   = Duration.ofMinutes(15);
    private static final Duration REFRESH_TTL  = Duration.ofDays(14);
    private static final Duration ABSOLUTE_TTL = Duration.ofDays(60);
    private static final Duration GRACE        = Duration.ofSeconds(10);

    private final RefreshTokenRepository repository;
    private final TokenIssuer issuer;
    private final SecureRandom random = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository repository, TokenIssuer issuer) {
        this.repository = repository; this.issuer = issuer;
    }

    /** Issued at login: a brand-new family. */
    @Transactional
    public TokenPair login(String userId, String deviceId) {
        String familyId = UUID.randomUUID().toString();
        String raw = newOpaqueToken();
        repository.save(new RefreshToken(
            hash(raw), familyId, userId, deviceId,
            Instant.now(), Instant.now().plus(REFRESH_TTL),
            Instant.now().plus(ABSOLUTE_TTL), null, false));
        return new TokenPair(issuer.issueAccessToken(userId, ACCESS_TTL), raw);
    }

    /** Rotation + reuse detection. */
    @Transactional
    public TokenPair refresh(String presentedToken, String deviceId) {
        RefreshToken stored = repository.findByHash(hash(presentedToken))
            .orElseThrow(() -> new SecurityException("unknown refresh token"));

        // ---- REUSE DETECTION: this token was already exchanged ----
        if (stored.usedAt() != null) {
            // Allow a tiny grace window for legitimate parallel refreshes.
            if (stored.usedAt().isAfter(Instant.now().minus(GRACE))
                    && Objects.equals(stored.deviceId(), deviceId)) {
                return new TokenPair(
                    issuer.issueAccessToken(stored.userId(), ACCESS_TTL), presentedToken);
            }
            // Otherwise: theft. Kill the whole family and alert.
            repository.revokeFamily(stored.familyId());
            // securityEvents.publish(new RefreshTokenReuseDetected(stored.userId()));
            throw new SecurityException("refresh token reuse detected - family revoked");
        }

        if (stored.revoked()) throw new SecurityException("revoked");
        if (stored.expiresAt().isBefore(Instant.now())) throw new SecurityException("expired");
        if (stored.absoluteExpiry().isBefore(Instant.now())) {
            throw new SecurityException("family lifetime exceeded - re-authenticate");
        }

        // ---- ROTATE: mark the old one used, issue a fresh one in the same family ----
        repository.markUsed(stored.hash(), Instant.now());
        String raw = newOpaqueToken();
        repository.save(new RefreshToken(
            hash(raw), stored.familyId(), stored.userId(), deviceId,
            Instant.now(), Instant.now().plus(REFRESH_TTL),
            stored.absoluteExpiry(), null, false));

        return new TokenPair(issuer.issueAccessToken(stored.userId(), ACCESS_TTL), raw);
    }

    /** Logout: revoke this device's family. Logout-everywhere: all families. */
    @Transactional
    public void logout(String presentedToken) {
        repository.findByHash(hash(presentedToken))
            .ifPresent(t -> repository.revokeFamily(t.familyId()));
    }

    private String newOpaqueToken() {
        byte[] bytes = new byte[32];                    // 256 bits of entropy
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Store only the hash - a database leak must not yield usable tokens. */
    private String hash(String raw) {
        try {
            return HexFormat.of().formatHex(java.security.MessageDigest
                .getInstance("SHA-256").digest(raw.getBytes()));
        } catch (Exception e) { throw new IllegalStateException(e); }
    }

    public record TokenPair(String accessToken, String refreshToken) { }

    public record RefreshToken(String hash, String familyId, String userId, String deviceId,
                               Instant issuedAt, Instant expiresAt, Instant absoluteExpiry,
                               Instant usedAt, boolean revoked) { }

    public interface RefreshTokenRepository {
        Optional<RefreshToken> findByHash(String hash);
        void save(RefreshToken token);
        void markUsed(String hash, Instant at);
        void revokeFamily(String familyId);
    }

    public interface TokenIssuer { String issueAccessToken(String userId, Duration ttl); }
}

/*
Cookie placement for a browser client
-------------------------------------
Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict;
            Path=/api/auth/refresh; Max-Age=1209600

- refresh token in an HttpOnly cookie scoped to the refresh path only
- access token kept in JavaScript memory (never localStorage)
- the client serialises concurrent refreshes behind one in-flight promise
*/`,
      codeLanguage: "java",
      explanation:
        "Short-lived access tokens plus rotating, hashed, family-tracked refresh tokens — presenting a used token revokes the whole family.",
      followUps: [
        "Why is a grace window needed during rotation?",
        "What does reuse detection actually prove?",
      ],
    },
    {
      id: "b130",
      question: "Where should a browser store a JWT — localStorage, sessionStorage or a cookie?",
      answer:
        "This is a trade-off between **XSS** and **CSRF**, and the honest answer names both.\n\n" +
        "**localStorage / sessionStorage**\n\n" +
        "- Accessible to **any JavaScript on the page**. One XSS — including from a compromised npm dependency or a third-party analytics script — and the token is exfiltrated. There is no mitigation: `HttpOnly` does not exist for storage.\n" +
        "- Not sent automatically, so **CSRF is not a concern**.\n" +
        "- Easy for SPAs and cross-domain APIs; survives a page refresh (`localStorage`) or dies with the tab (`sessionStorage`).\n\n" +
        "**Cookies**\n\n" +
        "- With **`HttpOnly`**, JavaScript cannot read them, so XSS cannot *steal* the token. It can still *use* it by making requests from the page — so XSS is still catastrophic, just less portable.\n" +
        "- Sent **automatically**, which is precisely what makes them vulnerable to **CSRF** — so you must add CSRF tokens and/or `SameSite`.\n" +
        "- Attributes that matter: `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`, a narrow `Path`, and the `__Host-` prefix for the strongest binding.\n" +
        "- Complicated for cross-domain APIs (needs CORS with credentials and `SameSite=None; Secure`).\n\n" +
        "**The recommended pattern** — and the one to lead with:\n\n" +
        "- **Access token in JavaScript memory only** (a module variable or React state). Not in any storage. It dies on refresh, which is fine because…\n" +
        "- **Refresh token in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie** scoped to `/api/auth/refresh`. On page load the app silently calls refresh to get a new access token.\n" +
        "- This gives no XSS-readable long-lived credential and no CSRF surface on the API (the access token goes in an `Authorization` header, which is not sent automatically).\n\n" +
        "**The meta-point:** 'if you have XSS you have lost regardless — so invest in CSP, output escaping, Subresource Integrity and dependency hygiene. Token placement limits the blast radius; it does not replace fixing XSS.' Also: **never** put a JWT in a URL — it lands in logs, `Referer` headers and browser history.",
      code: `import jakarta.servlet.http.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthCookieController {

    private final AuthService auth;
    AuthCookieController(AuthService auth) { this.auth = auth; }

    /**
     * Login: access token in the BODY (kept in JS memory),
     * refresh token in an HttpOnly cookie the JavaScript can never read.
     */
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request,
                                               HttpServletResponse response) {
        var pair = auth.login(request.username(), request.password());

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", pair.refreshToken())
            .httpOnly(true)                   // JavaScript cannot read it -> XSS-safe
            .secure(true)                     // HTTPS only
            .sameSite("Strict")               // blunt CSRF
            .path("/api/auth/refresh")        // sent ONLY to the refresh endpoint
            .maxAge(Duration.ofDays(14))
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        // The access token is returned in the body and kept in memory by the SPA.
        return ResponseEntity.ok(new TokenResponse(pair.accessToken(), 900));
    }

    /** Silent refresh on page load - the cookie rides along automatically. */
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {
        if (refreshToken == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var pair = auth.refresh(refreshToken);

        // Rotation: overwrite the cookie with the new refresh token.
        response.addHeader(HttpHeaders.SET_COOKIE,
            ResponseCookie.from("refresh_token", pair.refreshToken())
                .httpOnly(true).secure(true).sameSite("Strict")
                .path("/api/auth/refresh").maxAge(Duration.ofDays(14)).build().toString());

        return ResponseEntity.ok(new TokenResponse(pair.accessToken(), 900));
    }

    /** Logout: revoke server-side AND clear the cookie. */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {
        if (refreshToken != null) auth.logout(refreshToken);
        response.addHeader(HttpHeaders.SET_COOKIE,
            ResponseCookie.from("refresh_token", "")
                .httpOnly(true).secure(true).sameSite("Strict")
                .path("/api/auth/refresh").maxAge(0).build().toString());
        return ResponseEntity.noContent().build();
    }

    record LoginRequest(String username, String password) { }
    record TokenResponse(String accessToken, long expiresInSeconds) { }

    interface AuthService {
        RefreshTokenService.TokenPair login(String username, String password);
        RefreshTokenService.TokenPair refresh(String refreshToken);
        void logout(String refreshToken);
    }
}

/*
The SPA side
------------
let accessToken = null;                 // memory only - never localStorage

async function bootstrap() {            // on page load, silently refresh
  const r = await fetch('/api/auth/refresh', {
    method: 'POST', credentials: 'include' });   // cookie sent automatically
  if (r.ok) accessToken = (await r.json()).accessToken;
}

async function apiCall(path, options = {}) {
  let response = await fetch(path, { ...options,
    headers: { ...options.headers, Authorization: 'Bearer ' + accessToken } });
  if (response.status === 401) {        // access token expired -> refresh once
    await bootstrap();
    response = await fetch(path, { ...options,
      headers: { ...options.headers, Authorization: 'Bearer ' + accessToken } });
  }
  return response;
}

Also required, because token placement is not a substitute for fixing XSS:
  Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
  <script src="..." integrity="sha384-..." crossorigin="anonymous">
And NEVER: /api/orders?token=eyJhbGciOi...   (URLs end up in logs and Referer)
*/`,
      codeLanguage: "java",
      explanation:
        "Access token in memory, refresh token in an HttpOnly SameSite cookie scoped to the refresh path — localStorage is XSS-readable, cookies need CSRF defence.",
      followUps: [
        "Why does HttpOnly not fully solve XSS?",
        "Why must a JWT never appear in a URL?",
      ],
    },
    {
      id: "b131",
      question: "How do you revoke a JWT or implement logout, given that JWTs are stateless?",
      answer:
        "This is **the** fundamental JWT trade-off: a self-contained token is valid until it expires, and the resource server does not consult anything. 'Logout' on the client just deletes the token — the token itself remains valid for anyone who captured it.\n\n" +
        "Strategies, from cheapest to strongest:\n\n" +
        "**1. Short expiry (the primary mitigation).** With a 5–15 minute access token the exposure window is small. Combine with a revocable refresh token and logout is *effectively* immediate: the refresh token is killed server-side, so no new access tokens can be minted. This is what most production systems actually do.\n\n" +
        "**2. Denylist by `jti`.** Store revoked ids in Redis with a **TTL equal to the token's remaining lifetime**, so the list stays small and self-cleaning. Cost: one Redis lookup per request — you have reintroduced state, but a tiny, fast, expiring one.\n\n" +
        "**3. A per-user `tokensValidAfter` timestamp.** Store one value per user; reject any token whose `iat` is earlier. One entry per user instead of per token, and it naturally implements 'log out everywhere' and 'invalidate on password change'. Still a lookup, but cacheable.\n\n" +
        "**4. Token versioning.** Put a `ver` claim in the token and a counter on the user; bump the counter to invalidate everything.\n\n" +
        "**5. Opaque tokens + introspection.** Give up self-containment: the resource server calls the auth server's `/introspect` endpoint (RFC 7662). Fully revocable and instant, at the cost of a network hop per request (cache it briefly).\n\n" +
        "**6. Allowlist** — only tokens present in the store are valid. Maximum control, minimum benefit over sessions.\n\n" +
        "**The senior framing:** 'If your requirement is instant revocation on every request, JWT self-containment is buying you nothing and a session or opaque token is the simpler design. Choose JWT when you can accept a bounded window; choose sessions when you cannot.' Also cover **OIDC RP-initiated logout** and **back-channel logout** for single sign-out across applications.",
      code: `import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.concurrent.TimeUnit;

@Service
public class TokenRevocationService {

    private static final String DENY_PREFIX  = "jwt:denied:";
    private static final String VALID_PREFIX = "jwt:valid-after:";

    private final StringRedisTemplate redis;
    public TokenRevocationService(StringRedisTemplate redis) { this.redis = redis; }

    // ---------- Strategy 2: denylist by jti, TTL = remaining lifetime ----------

    public void revoke(String jti, Instant expiresAt) {
        long ttl = Duration.between(Instant.now(), expiresAt).getSeconds();
        if (ttl > 0) {
            redis.opsForValue().set(DENY_PREFIX + jti, "1", ttl, TimeUnit.SECONDS);
        }   // after exp the entry disappears on its own - the list cannot grow unbounded
    }

    public boolean isRevoked(String jti) {
        return Boolean.TRUE.equals(redis.hasKey(DENY_PREFIX + jti));
    }

    // ---------- Strategy 3: one timestamp per user = "log out everywhere" ----------

    /** Called on logout-all, password change, role change or suspected compromise. */
    public void invalidateAllTokensFor(String userId) {
        redis.opsForValue().set(VALID_PREFIX + userId,
            String.valueOf(Instant.now().getEpochSecond()),
            Duration.ofDays(30));                       // outlive the longest token
    }

    public boolean issuedBeforeCutoff(String userId, Instant issuedAt) {
        String cutoff = redis.opsForValue().get(VALID_PREFIX + userId);
        return cutoff != null && issuedAt.getEpochSecond() < Long.parseLong(cutoff);
    }
}

/** Plugging revocation into the Spring Security validation pipeline. */
@org.springframework.context.annotation.Configuration
class RevocationAwareDecoderConfig {

    @org.springframework.context.annotation.Bean
    org.springframework.security.oauth2.jwt.JwtDecoder jwtDecoder(
            @org.springframework.beans.factory.annotation.Value("\${app.issuer-uri}") String issuer,
            TokenRevocationService revocation) {

        var decoder = org.springframework.security.oauth2.jwt.NimbusJwtDecoder
            .withIssuerLocation(issuer).build();

        org.springframework.security.oauth2.core.OAuth2TokenValidator<
            org.springframework.security.oauth2.jwt.Jwt> notRevoked = jwt -> {
            String jti = jwt.getId();
            if (jti != null && revocation.isRevoked(jti)) {
                return org.springframework.security.oauth2.core.OAuth2TokenValidatorResult
                    .failure(new org.springframework.security.oauth2.core.OAuth2Error(
                        "invalid_token", "token revoked", null));
            }
            if (revocation.issuedBeforeCutoff(jwt.getSubject(), jwt.getIssuedAt())) {
                return org.springframework.security.oauth2.core.OAuth2TokenValidatorResult
                    .failure(new org.springframework.security.oauth2.core.OAuth2Error(
                        "invalid_token", "credentials changed", null));
            }
            return org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.success();
        };

        decoder.setJwtValidator(
            new org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator<>(
                org.springframework.security.oauth2.jwt.JwtValidators
                    .createDefaultWithIssuer(issuer),
                notRevoked));
        return decoder;
    }
}

@org.springframework.web.bind.annotation.RestController
@org.springframework.web.bind.annotation.RequestMapping("/api/auth")
class LogoutController {

    private final TokenRevocationService revocation;
    private final RefreshTokenService refreshTokens;

    LogoutController(TokenRevocationService revocation, RefreshTokenService refreshTokens) {
        this.revocation = revocation; this.refreshTokens = refreshTokens;
    }

    /** Logout on this device: kill the refresh family + denylist the access token. */
    @org.springframework.web.bind.annotation.PostMapping("/logout")
    public void logout(
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            org.springframework.security.oauth2.jwt.Jwt jwt,
            @org.springframework.web.bind.annotation.CookieValue(
                name = "refresh_token", required = false) String refreshToken) {
        if (refreshToken != null) refreshTokens.logout(refreshToken);   // the real fix
        if (jwt.getId() != null) revocation.revoke(jwt.getId(), jwt.getExpiresAt());
    }

    /** Logout everywhere: one timestamp invalidates every outstanding token. */
    @org.springframework.web.bind.annotation.PostMapping("/logout-all")
    public void logoutEverywhere(
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            org.springframework.security.oauth2.jwt.Jwt jwt) {
        revocation.invalidateAllTokensFor(jwt.getSubject());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Short expiry plus a revocable refresh token is the practical answer; add a jti denylist or a per-user tokensValidAfter timestamp when you need faster revocation.",
      followUps: [
        "Why does the denylist TTL equal the token's remaining lifetime?",
        "When should you abandon JWTs for opaque tokens?",
      ],
    },
    {
      id: "b132",
      question: "Implement complete JWT authentication in Spring Boot — walk through every component.",
      answer:
        "A production implementation has six pieces. Being able to name them in order shows you have actually built one.\n\n" +
        "**1. Dependencies** — `spring-boot-starter-security`, plus either `io.jsonwebtoken:jjwt-api/impl/jackson` or, for an OAuth2 setup, `spring-boot-starter-oauth2-resource-server` (which is preferable when an external identity provider exists — do not hand-roll what Spring already does).\n\n" +
        "**2. `JwtService`** — mint and parse. Injects the signing key from configuration (never a hard-coded string), sets `iss`, `sub`, `aud`, `exp`, `iat`, `jti` and the authority claims, and exposes `generateAccessToken`, `generateRefreshToken` and `parse`.\n\n" +
        "**3. `JwtAuthenticationFilter`** — a `OncePerRequestFilter` registered **before `UsernamePasswordAuthenticationFilter`**. Extracts the bearer token, validates it, loads authorities and populates the `SecurityContext`. It must **always call `chain.doFilter`** and must not clobber an existing authentication.\n\n" +
        "**4. `SecurityConfig`** — a `SecurityFilterChain` bean with `csrf.disable()` (safe here: no cookie auth), `SessionCreationPolicy.STATELESS`, the authorization rules, the custom filter, and the entry point/denied handler for consistent 401/403 bodies.\n\n" +
        "**5. `AuthController`** — `/login` (authenticate through `AuthenticationManager`, then mint the pair), `/refresh` (rotate), `/logout` (revoke). Never mint a token without going through `AuthenticationManager`, or you skip account-locked and credential-expired checks.\n\n" +
        "**6. Supporting beans** — `UserDetailsService`, `PasswordEncoder`, the refresh-token store, and the revocation service.\n\n" +
        "The details that distinguish a production implementation: the secret comes from an environment variable or Vault and is **≥256 bits**; the access token TTL is minutes; exceptions produce a consistent `ProblemDetail`; tokens are never logged; every endpoint is deny-by-default; and there are tests for expired, tampered, wrong-audience and revoked tokens.",
      code: `import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.time.*;
import java.util.*;

// ---------- 1. Typed configuration - secret from the environment ----------
@ConfigurationProperties(prefix = "app.jwt")
record JwtProperties(String secret, String issuer, String audience,
                     Duration accessTtl, Duration refreshTtl) { }

// ---------- 2. JwtService: mint and parse ----------
@Service
class JwtService {

    private final SecretKey key;
    private final JwtProperties properties;

    JwtService(JwtProperties properties) {
        this.properties = properties;
        byte[] secret = io.jsonwebtoken.io.Decoders.BASE64.decode(properties.secret());
        if (secret.length < 32) throw new IllegalStateException("secret must be >= 256 bits");
        this.key = Keys.hmacShaKeyFor(secret);
    }

    String generateAccessToken(UserDetails user) {
        Instant now = Instant.now();
        return Jwts.builder()
            .header().type("at+jwt").and()
            .issuer(properties.issuer())
            .subject(user.getUsername())
            .audience().add(properties.audience()).and()
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(properties.accessTtl())))
            .id(UUID.randomUUID().toString())
            .claim("authorities", user.getAuthorities().stream()
                .map(a -> a.getAuthority()).toList())
            .signWith(key, Jwts.SIG.HS256)
            .compact();
    }

    Jws<Claims> parse(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .requireIssuer(properties.issuer())
            .requireAudience(properties.audience())
            .clockSkewSeconds(60)
            .build()
            .parseSignedClaims(token);     // throws Expired/Malformed/SignatureException
    }
}

// ---------- 3. The per-request filter ----------
@Component
class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TokenRevocationService revocation;

    JwtAuthenticationFilter(JwtService jwtService, TokenRevocationService revocation) {
        this.jwtService = jwtService; this.revocation = revocation;
    }

    @Override protected boolean shouldNotFilter(jakarta.servlet.http.HttpServletRequest request) {
        return request.getServletPath().startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request,
                                    jakarta.servlet.http.HttpServletResponse response,
                                    jakarta.servlet.FilterChain chain)
            throws jakarta.servlet.ServletException, java.io.IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")
                || SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(request, response);         // ALWAYS continue the chain
            return;
        }

        try {
            Claims claims = jwtService.parse(header.substring(7)).getPayload();
            if (revocation.isRevoked(claims.getId())) throw new JwtException("revoked");

            @SuppressWarnings("unchecked")
            List<String> authorities = claims.get("authorities", List.class);
            var authentication = new UsernamePasswordAuthenticationToken(
                claims.getSubject(), null,
                authorities.stream().map(SimpleGrantedAuthority::new).toList());

            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            chain.doFilter(request, response);
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
            response.setStatus(401);
            response.setHeader("WWW-Authenticate", "Bearer error=\\"invalid_token\\"");
            response.setContentType("application/problem+json");
            response.getWriter().write("{\\"title\\":\\"Unauthorized\\",\\"status\\":401}");
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}

// ---------- 4. Security configuration ----------
@Configuration
@org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
@org.springframework.boot.context.properties.EnableConfigurationProperties(JwtProperties.class)
class JwtSecurityConfig {

    @Bean
    SecurityFilterChain chain(HttpSecurity http, JwtAuthenticationFilter jwtFilter)
            throws Exception {
        return http
            .csrf(csrf -> csrf.disable())                       // no cookie auth
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/login", "/api/auth/refresh").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated())                  // deny by default
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean AuthenticationManager authenticationManager(
            org.springframework.security.config.annotation.authentication.configuration
                .AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}

// ---------- 5. The auth endpoints ----------
@RestController
@RequestMapping("/api/auth")
class JwtAuthController {

    private final AuthenticationManager manager;
    private final JwtService jwtService;
    private final UserDetailsService users;

    JwtAuthController(AuthenticationManager manager, JwtService jwtService,
                      UserDetailsService users) {
        this.manager = manager; this.jwtService = jwtService; this.users = users;
    }

    @PostMapping("/login")
    ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        // Going through AuthenticationManager applies locked/expired/disabled checks.
        manager.authenticate(new UsernamePasswordAuthenticationToken(
            body.get("username"), body.get("password")));
        UserDetails user = users.loadUserByUsername(body.get("username"));
        return ResponseEntity.ok(Map.of(
            "accessToken", jwtService.generateAccessToken(user),
            "expiresIn", 900));
    }
}

/*
application.yml
---------------
app.jwt:
  secret: \${JWT_SECRET}            # base64, >= 256 bits, from Vault or the environment
  issuer: https://auth.example.com
  audience: orders-api
  access-ttl: PT15M
  refresh-ttl: P14D
*/`,
      codeLanguage: "java",
      explanation:
        "JwtService, a OncePerRequestFilter before the username filter, a stateless SecurityFilterChain, and auth endpoints that always go through AuthenticationManager.",
      followUps: [
        "Why authenticate through AuthenticationManager instead of comparing the password yourself?",
        "When would you use the OAuth2 resource server starter instead of this?",
      ],
    },
    {
      id: "b133",
      question: "What is JWKS and how do you rotate signing keys without downtime?",
      answer:
        "**JWKS (JSON Web Key Set, RFC 7517)** is a JSON document published by the authorization server listing its **public** keys. Resource servers fetch it and verify tokens with no shared secret and no manual key distribution.\n\n" +
        "Discovery: the OIDC well-known document at `<issuer>/.well-known/openid-configuration` contains `jwks_uri`, conventionally `<issuer>/.well-known/jwks.json`. Spring's `NimbusJwtDecoder.withIssuerLocation(issuer)` does all of this for you.\n\n" +
        "Each key (a **JWK**) carries:\n\n" +
        "- `kty` (key type: `RSA`, `EC`, `oct`), `use` (`sig` or `enc`), `alg`, and **`kid`** — the key id.\n" +
        "- For RSA: `n` (modulus) and `e` (exponent), Base64URL encoded. For EC: `crv`, `x`, `y`.\n\n" +
        "**`kid` is the mechanism that makes rotation possible.** The token header names the key; the verifier looks it up in the set. Multiple keys coexist in the JWKS, so old and new tokens both verify.\n\n" +
        "**Zero-downtime rotation, in phases:**\n\n" +
        "1. **Publish** the new key in the JWKS alongside the old. Keep signing with the old one. Wait longer than the JWKS cache TTL (typically 5–15 minutes) so every verifier has seen it.\n" +
        "2. **Switch signing** to the new key (new `kid`). Tokens signed with the old key are still valid and still verifiable.\n" +
        "3. **Wait** for the maximum access-token lifetime so all old tokens have expired.\n" +
        "4. **Remove** the old key from the JWKS.\n\n" +
        "Operational points that matter:\n\n" +
        "- **Cache the JWKS** — do not fetch per request. Spring caches for 5 minutes by default.\n" +
        "- **Rate-limit refresh on unknown `kid`**, or an attacker sends random `kid`s and turns your service into a JWKS flood generator.\n" +
        "- **Fail closed** if the JWKS is unreachable — but keep serving from the cache, because an auth-server blip should not take down every API.\n" +
        "- Rotate on a schedule (quarterly is common) **and** immediately on suspected compromise.\n" +
        "- With HS256 there is no JWKS — rotation means distributing a new shared secret to every service, which is exactly why asymmetric keys win at scale.",
      code: `import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.source.*;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.context.annotation.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;

import java.security.KeyPairGenerator;
import java.security.interfaces.*;
import java.time.Duration;
import java.util.*;

/** AUTHORIZATION SERVER side: publish the key set, sign with the current key. */
@RestController
class JwksEndpoint {

    private final SigningKeyManager keys;
    JwksEndpoint(SigningKeyManager keys) { this.keys = keys; }

    /** GET /.well-known/jwks.json - PUBLIC keys only. */
    @GetMapping("/.well-known/jwks.json")
    public Map<String, Object> jwks() {
        return new JWKSet(keys.allPublicKeys()).toJSONObject();   // toPublicJWKSet by default
    }
}

@org.springframework.stereotype.Component
class SigningKeyManager {

    /** All keys currently published; the FIRST is the active signing key. */
    private final List<RSAKey> keys = new ArrayList<>();

    SigningKeyManager() throws Exception { keys.add(generate("key-2026-01")); }

    static RSAKey generate(String kid) throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        var pair = generator.generateKeyPair();
        return new RSAKey.Builder((RSAPublicKey) pair.getPublic())
            .privateKey((RSAPrivateKey) pair.getPrivate())
            .keyID(kid)                                   // the kid written into the header
            .keyUse(KeyUse.SIGNATURE)
            .algorithm(com.nimbusds.jose.JWSAlgorithm.RS256)
            .issueTime(new Date())
            .build();
    }

    /** PHASE 1: publish the new key but keep signing with the old one. */
    public void stageNewKey(String kid) throws Exception {
        keys.add(generate(kid));                          // appended, not active yet
    }

    /** PHASE 2: promote it to the signing key. */
    public void promote(String kid) {
        keys.stream().filter(k -> kid.equals(k.getKeyID())).findFirst()
            .ifPresent(k -> { keys.remove(k); keys.add(0, k); });
    }

    /** PHASE 4: after the longest token lifetime, retire the old key. */
    public void retire(String kid) {
        keys.removeIf(k -> kid.equals(k.getKeyID()) && !k.equals(keys.get(0)));
    }

    public RSAKey activeKey() { return keys.get(0); }

    public List<JWK> allPublicKeys() {
        return keys.stream().map(k -> (JWK) k.toPublicJWK()).toList();
    }
}

/** RESOURCE SERVER side: fetch, cache and rate-limit the JWKS. */
@Configuration
class JwksConsumerConfig {

    /** The easy path - issuer-uri drives discovery and caching. */
    @Bean
    JwtDecoder springDecoder(
            @org.springframework.beans.factory.annotation.Value("\${app.issuer-uri}") String issuer) {
        return NimbusJwtDecoder.withIssuerLocation(issuer).build();   // 5-minute cache
    }

    /** Explicit control over caching, retry and refresh rate limiting. */
    @Bean
    JWKSource<SecurityContext> jwkSource(
            @org.springframework.beans.factory.annotation.Value("\${app.jwks-uri}") String jwksUri)
            throws Exception {
        return JWKSourceBuilder.create(new java.net.URL(jwksUri))
            .cache(Duration.ofMinutes(10).toMillis(),     // TTL
                   Duration.ofSeconds(30).toMillis())     // refresh-ahead window
            .refreshAheadCache(true)                      // refresh before expiry
            .rateLimited(Duration.ofMinutes(1).toMillis())// unknown-kid flood protection
            .retrying(true)                               // survive a transient blip
            .outageTolerant(Duration.ofHours(1).toMillis())  // serve stale rather than fail all
            .build();
    }
}

/*
A published JWKS document
-------------------------
{
  "keys": [
    { "kty": "RSA", "use": "sig", "alg": "RS256", "kid": "key-2026-02",
      "n": "0vx7agoebGcQSuu...", "e": "AQAB" },
    { "kty": "RSA", "use": "sig", "alg": "RS256", "kid": "key-2026-01",
      "n": "sXchDaQebHnPiGv...", "e": "AQAB" }
  ]
}

Rotation timeline
-----------------
T+0    publish key-2026-02 (still signing with key-2026-01)
T+15m  every verifier has cached the new JWKS  -> promote key-2026-02
T+30m  all tokens signed by key-2026-01 have expired (15m TTL + skew)
T+1h   retire key-2026-01 from the JWKS
*/`,
      codeLanguage: "java",
      explanation:
        "JWKS publishes public keys addressed by kid, so you stage, promote, wait out the token lifetime, then retire — with cached, rate-limited fetches.",
      followUps: [
        "Why must you wait for the JWKS cache TTL before promoting a new key?",
        "Why is key rotation so much harder with HS256?",
      ],
    },
    {
      id: "b134",
      question: "JWT vs server-side sessions — when should you NOT use a JWT?",
      answer:
        "JWTs are frequently chosen by default and frequently the wrong choice. A senior answer starts with the trade-off, not the hype.\n\n" +
        "**Sessions** — a random opaque id in a cookie; all state lives server-side (memory, Redis, database).\n\n" +
        "- **Instantly revocable** — delete the row and the session is gone.\n" +
        "- Tiny cookie (~32 bytes) regardless of how much state you keep.\n" +
        "- State can be updated immediately: change a role and the next request sees it.\n" +
        "- Requires shared storage across instances (Spring Session + Redis), which is a real but well-understood dependency.\n\n" +
        "**JWTs** — self-contained, signed claims.\n\n" +
        "- **No lookup on validation**, so they scale horizontally and across services with no shared session store.\n" +
        "- Good for **cross-domain** and **cross-service** identity, mobile clients, and third-party APIs where cookies are awkward.\n" +
        "- **Cannot be revoked** before expiry without reintroducing state.\n" +
        "- **Stale claims** — a role removed at 10:00 is still in tokens until they expire.\n" +
        "- **Larger** — 500–2000 bytes on every request, which is real bandwidth and header-limit pressure.\n" +
        "- More ways to get it wrong: `alg` confusion, missing `aud`, weak secrets, storage choices.\n\n" +
        "**Do not use a JWT when:**\n\n" +
        "1. You need **instant revocation** — banking, admin consoles, anything with a compliance requirement to kill a session now.\n" +
        "2. It is a **single monolith with one domain** — a session is simpler, smaller and safer. 'We use JWT because we might microservice one day' is not a reason.\n" +
        "3. You need to store **mutable or sensitive** state — a JWT is a readable, frozen snapshot.\n" +
        "4. You would end up checking a database on every request anyway — then the self-containment bought you nothing.\n\n" +
        "**The strongest thing you can say:** 'Many teams use JWTs and then add a Redis denylist, which is a session store with extra steps. If you need the denylist, use sessions.' A common pragmatic hybrid is sessions for first-party web, JWTs for service-to-service and mobile.",
      code: `import org.springframework.context.annotation.*;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;

import java.time.Duration;

/**
 * Sessions done properly: Spring Session + Redis gives you horizontal scaling
 * WITHOUT sticky load balancing, which removes the usual argument against them.
 */
@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800)
class SessionBasedAuth {

    @Bean
    org.springframework.boot.web.servlet.server.CookieSameSiteSupplier sameSite() {
        return org.springframework.boot.web.servlet.server.CookieSameSiteSupplier.ofStrict();
    }

    /** Instant revocation: one call and the user is logged out everywhere, now. */
    @org.springframework.stereotype.Service
    static class SessionAdmin {
        private final org.springframework.session.FindByIndexNameSessionRepository<
            ? extends org.springframework.session.Session> sessions;

        SessionAdmin(org.springframework.session.FindByIndexNameSessionRepository<
                ? extends org.springframework.session.Session> sessions) {
            this.sessions = sessions;
        }

        public void revokeAllSessions(String username) {
            sessions.findByPrincipalName(username).keySet().forEach(sessions::deleteById);
        }   // effective on the very next request - no denylist, no TTL games
    }
}

/**
 * The decision, expressed as code you can reason about.
 */
class AuthStrategyDecision {

    enum Strategy { SESSION, JWT, HYBRID }

    record Requirements(boolean singleDomain, boolean needsInstantRevocation,
                        boolean crossServiceIdentity, boolean mobileClients,
                        boolean mutableUserState, boolean thirdPartyApi) { }

    static Strategy choose(Requirements r) {
        if (r.needsInstantRevocation() && !r.crossServiceIdentity()) return Strategy.SESSION;
        if (r.singleDomain() && !r.mobileClients() && !r.thirdPartyApi()) return Strategy.SESSION;
        if (r.mutableUserState() && !r.crossServiceIdentity()) return Strategy.SESSION;
        if (r.crossServiceIdentity() || r.thirdPartyApi() || r.mobileClients()) {
            return r.needsInstantRevocation() ? Strategy.HYBRID : Strategy.JWT;
        }
        return Strategy.SESSION;
    }

    public static void main(String[] args) {
        // A classic server-rendered monolith: sessions win.
        System.out.println(choose(new Requirements(
            true, true, false, false, true, false)));        // SESSION

        // A public API consumed by mobile apps and partners.
        System.out.println(choose(new Requirements(
            false, false, true, true, false, true)));        // JWT

        // Microservices in a regulated domain: JWT for the hop, sessions at the edge.
        System.out.println(choose(new Requirements(
            false, true, true, true, false, false)));        // HYBRID
    }
}

/*
Side by side
------------
                        Session                  JWT
revocation              instant                  only at expiry (or add state)
storage                 server (Redis)           client
size on the wire        ~32 bytes                500-2000 bytes
validation cost         one lookup               signature check, no IO
horizontal scaling      needs shared store       none needed
cross-domain            awkward                  natural
stale claims            impossible               until expiry
failure mode            store down = all fail    key/JWKS down = all fail
attack surface          session fixation, CSRF   alg confusion, storage, weak secret

The honest summary: if you add a Redis denylist to make JWTs revocable,
you have built a session store with extra cryptography.
*/`,
      codeLanguage: "java",
      explanation:
        "Sessions revoke instantly and stay small; JWTs scale across services but freeze claims — if you need a denylist, you needed sessions.",
      followUps: [
        "Why is 'we might go microservices later' a weak reason to pick JWT?",
        "What does the hybrid approach look like in practice?",
      ],
    },
    {
      id: "b135",
      question: "What are the main JWT vulnerabilities and how do you defend against each?",
      answer:
        "The attack catalogue, each with its defence:\n\n" +
        "**1. `alg: none`** — the token declares no signature and a naive verifier accepts it. **Defence: pin the expected algorithm; never read `alg` from the token.**\n\n" +
        "**2. Algorithm confusion (RS256 → HS256)** — the attacker HMAC-signs with the public key as the secret. **Defence: pin the algorithm and pass a key type that cannot be misused.**\n\n" +
        "**3. Weak HMAC secret** — a short or dictionary secret is cracked offline from one captured token in seconds. **Defence: ≥256 bits from a CSPRNG, stored in a secrets manager.**\n\n" +
        "**4. Missing `aud` validation** — a token minted for a low-value service is replayed against a high-value one. **Defence: always validate `aud`; give each API a distinct identifier.**\n\n" +
        "**5. Missing `exp` validation, or no expiry at all** — a leaked token is valid forever. **Defence: require `exp`, keep it short, and reject tokens without it.**\n\n" +
        "**6. `kid` injection** — the `kid` header is used to build a file path or an SQL query, giving path traversal or SQL injection. **Defence: treat `kid` as an opaque lookup key against a fixed set; never interpolate it.**\n\n" +
        "**7. `jku`/`x5u` header injection** — the token points at an attacker-hosted key set. **Defence: ignore those headers entirely, or allowlist the host.**\n\n" +
        "**8. Sensitive data in the payload** — it is Base64, not encryption. **Defence: never put PII, secrets or internal ids in claims; use JWE if you must.**\n\n" +
        "**9. Token leakage** — in URLs, logs, `Referer` headers, error reports, browser history. **Defence: `Authorization` header only, never log tokens, scrub them in logging filters.**\n\n" +
        "**10. XSS theft from `localStorage`** — **Defence: access token in memory, refresh token in an `HttpOnly` cookie, plus a strict CSP.**\n\n" +
        "**11. No revocation on logout or password change** — **Defence: short TTL, revocable refresh tokens, `tokensValidAfter`.**\n\n" +
        "**12. JSON parsing quirks** — duplicate claim keys resolved differently by different parsers, or a `crit` header that is ignored. **Defence: use a mature library and reject unknown critical headers.**\n\n" +
        "**The unifying rule:** use a well-maintained library, pin everything, validate every claim, and keep the token short-lived.",
      code: `import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.util.*;
import java.util.regex.Pattern;

public class JwtHardening {

    // ---- 3. Generate a strong secret. Never a passphrase, never in source. ----
    static String generateSecret() {
        byte[] bytes = new byte[64];                    // 512 bits
        new SecureRandom().nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }

    // ---- 1 + 2 + 4 + 5: a parser with everything pinned ----
    static Jws<Claims> parseSafely(SecretKey key, String token,
                                   String issuer, String audience) {
        return Jwts.parser()
            .verifyWith(key)                    // key type pins the algorithm family
            .requireIssuer(issuer)              // 4a
            .requireAudience(audience)          // 4b - the one people skip
            .clockSkewSeconds(60)               // 5  - exp/nbf enforced with skew
            .build()
            .parseSignedClaims(token);          // rejects alg:none and unsigned JWTs
    }

    // ---- 6. kid must be an opaque lookup key, never interpolated ----
    private static final Map<String, SecretKey> KEYS_BY_KID = new HashMap<>();
    private static final Pattern SAFE_KID = Pattern.compile("^[A-Za-z0-9_-]{1,64}$");

    static SecretKey resolveKey(String kid) {
        if (kid == null || !SAFE_KID.matcher(kid).matches()) {
            throw new JwtException("invalid kid");
        }
        SecretKey key = KEYS_BY_KID.get(kid);          // fixed map lookup only
        if (key == null) throw new JwtException("unknown kid");
        return key;
        // NEVER: new FileInputStream("/keys/" + kid)          -> path traversal
        // NEVER: "select key from jwks where kid = '" + kid   -> SQL injection
    }

    // ---- 7. Reject attacker-controlled key locations ----
    static void rejectRemoteKeyHeaders(Map<String, ?> header) {
        for (String dangerous : List.of("jku", "jwk", "x5u", "x5c")) {
            if (header.containsKey(dangerous)) {
                throw new JwtException("header not permitted: " + dangerous);
            }
        }
    }

    // ---- 8. Keep the payload free of sensitive data ----
    static Map<String, Object> safeClaims(String userId) {
        return Map.of(
            "sub", userId,                      // an opaque UUID
            "scope", "orders:read",
            "roles", List.of("USER"));
        // NOT: email, phone, address, internal database ids, entitlement details,
        //      anything you would not publish - the payload is world-readable.
    }

    // ---- 9. Scrub tokens before anything reaches a log ----
    private static final Pattern TOKEN_PATTERN =
        Pattern.compile("eyJ[A-Za-z0-9_-]+\\\\.[A-Za-z0-9_-]+\\\\.[A-Za-z0-9_-]+");

    static String scrub(String message) {
        return TOKEN_PATTERN.matcher(message).replaceAll("[REDACTED-JWT]");
    }

    public static void main(String[] args) {
        SecretKey key = Keys.hmacShaKeyFor(
            Base64.getDecoder().decode(generateSecret()));

        String token = Jwts.builder()
            .issuer("https://auth.example.com")
            .audience().add("orders-api").and()
            .subject("2f1c-uuid")
            .expiration(new Date(System.currentTimeMillis() + 900_000))
            .id(UUID.randomUUID().toString())
            .signWith(key, Jwts.SIG.HS256)
            .compact();

        System.out.println(parseSafely(key, token,
            "https://auth.example.com", "orders-api").getPayload().getSubject());

        // Wrong audience -> rejected.
        try {
            parseSafely(key, token, "https://auth.example.com", "billing-api");
        } catch (JwtException e) {
            System.out.println("cross-service replay blocked: " + e.getMessage());
        }

        System.out.println(scrub("request failed with Authorization: Bearer " + token));
    }
}

/*
Checklist to run against any JWT implementation
-----------------------------------------------
[ ] algorithm pinned in the verifier, alg:none impossible
[ ] asymmetric keys across trust boundaries (RS256/ES256), not a shared HS256 secret
[ ] secret >= 256 bits from a CSPRNG, stored in a secrets manager
[ ] iss, aud, exp, nbf all validated; clock skew bounded
[ ] kid used only as an opaque map key
[ ] jku / jwk / x5u / x5c headers rejected
[ ] no PII or secrets in the payload
[ ] tokens never in URLs, never logged
[ ] access token TTL <= 15 minutes; refresh token rotated and revocable
[ ] tokens scrubbed from logs and error reports
[ ] tests for expired, tampered, wrong-audience, wrong-issuer and revoked tokens
*/`,
      codeLanguage: "java",
      explanation:
        "Pin the algorithm, validate every claim, treat kid as an opaque key, reject jku/x5u, keep secrets strong and payloads public-safe.",
      followUps: [
        "How would kid injection lead to path traversal?",
        "Why is the jku header dangerous?",
      ],
    },
    {
      id: "b136",
      question: "What is the difference between JWS and JWE, and when do you need encryption?",
      answer:
        "**JWS (JSON Web Signature, RFC 7515)** is what people mean when they say 'JWT'. Three parts, `header.payload.signature`. It provides **integrity** and **authenticity**: you know the claims were not modified and who issued them. It provides **no confidentiality** — the payload is Base64URL, readable by anyone.\n\n" +
        "**JWE (JSON Web Encryption, RFC 7516)** has **five** parts:\n\n" +
        "`header.encryptedKey.iv.ciphertext.authTag`\n\n" +
        "- **Header** — `alg` here is the **key management** algorithm (`RSA-OAEP-256`, `ECDH-ES+A256KW`, `A256KW`, `dir`) and **`enc`** is the **content encryption** algorithm (`A256GCM`, `A128CBC-HS256`).\n" +
        "- **Encrypted key** — a random content-encryption key (CEK), itself encrypted for the recipient. With `dir` the CEK is a pre-shared key and this part is empty.\n" +
        "- **IV**, **ciphertext**, **authentication tag** — AEAD, so the ciphertext is also integrity-protected.\n\n" +
        "The payload is unreadable without the key. The **header is still plaintext** — it must be, so the recipient knows how to decrypt — and it is covered by the auth tag as Additional Authenticated Data.\n\n" +
        "**Nested JWT** is the full-strength pattern: **sign first, then encrypt** the JWS as the JWE payload (`cty: JWT`). Signing first binds the signature to the plaintext, so the recipient knows both *who* wrote it and that nobody else read it. Encrypt-then-sign is weaker — anyone can strip and re-sign the ciphertext.\n\n" +
        "**When do you actually need JWE?**\n\n" +
        "Honestly, rarely. TLS already encrypts in transit, and the correct fix for sensitive claims is **not to put them in the token**. Use JWE when:\n\n" +
        "- The token passes through an **untrusted intermediary** (a browser, a partner's gateway, a message queue) and must carry confidential data.\n" +
        "- **Regulation** (HIPAA, PCI) demands encryption at rest and the token is persisted.\n" +
        "- OIDC **request objects** or ID tokens carrying sensitive claims.\n\n" +
        "Costs: bigger tokens, slower, key management for *both* signing and encryption, and no debuggability — you cannot paste it into jwt.io. **Default to a JWS with a minimal payload plus an opaque reference to server-side data.**",
      code: `import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.gen.*;
import com.nimbusds.jwt.*;

import java.security.SecureRandom;
import java.util.Date;

public class JwsVersusJwe {

    public static void main(String[] args) throws Exception {

        // ---------- JWS: signed, readable by anyone ----------
        RSAKey signingKey = new RSAKeyGenerator(2048).keyID("sign-1").generate();

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
            .issuer("https://auth.example.com")
            .subject("user-123")
            .audience("orders-api")
            .expirationTime(new Date(System.currentTimeMillis() + 900_000))
            .claim("scope", "orders:read")
            .build();

        SignedJWT signed = new SignedJWT(
            new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(signingKey.getKeyID()).build(),
            claims);
        signed.sign(new RSASSASigner(signingKey));
        String jws = signed.serialize();

        System.out.println("JWS parts: " + jws.split("\\\\.").length);        // 3
        System.out.println("payload is READABLE: "
            + SignedJWT.parse(jws).getJWTClaimsSet().getSubject());        // user-123

        // ---------- JWE: encrypted, unreadable without the key ----------
        RSAKey encryptionKey = new RSAKeyGenerator(2048).keyID("enc-1")
            .keyUse(KeyUse.ENCRYPTION).generate();

        EncryptedJWT encrypted = new EncryptedJWT(
            new JWEHeader.Builder(JWEAlgorithm.RSA_OAEP_256, EncryptionMethod.A256GCM)
                .keyID(encryptionKey.getKeyID()).build(),
            claims);
        encrypted.encrypt(new RSAEncrypter(encryptionKey.toRSAPublicKey()));
        String jwe = encrypted.serialize();

        System.out.println("\\nJWE parts: " + jwe.split("\\\\.").length);      // 5
        // Without the private key the payload is opaque.
        EncryptedJWT parsed = EncryptedJWT.parse(jwe);
        parsed.decrypt(new RSADecrypter(encryptionKey.toRSAPrivateKey()));
        System.out.println("decrypted subject: " + parsed.getJWTClaimsSet().getSubject());

        // ---------- NESTED: sign FIRST, then encrypt ----------
        JWEObject nested = new JWEObject(
            new JWEHeader.Builder(JWEAlgorithm.RSA_OAEP_256, EncryptionMethod.A256GCM)
                .contentType("JWT")                    // signals a nested JWT
                .keyID(encryptionKey.getKeyID())
                .build(),
            new Payload(signed));                      // the SIGNED token is the payload
        nested.encrypt(new RSAEncrypter(encryptionKey.toRSAPublicKey()));
        String nestedToken = nested.serialize();

        // Recipient: decrypt, then verify the inner signature.
        JWEObject received = JWEObject.parse(nestedToken);
        received.decrypt(new RSADecrypter(encryptionKey.toRSAPrivateKey()));
        SignedJWT inner = received.getPayload().toSignedJWT();
        boolean authentic = inner.verify(new RSASSAVerifier(signingKey.toRSAPublicKey()));
        System.out.println("\\nnested: authentic=" + authentic
            + " subject=" + inner.getJWTClaimsSet().getSubject());

        // ---------- Direct encryption with a shared key: smallest and fastest ----------
        byte[] secret = new byte[32];
        new SecureRandom().nextBytes(secret);
        OctetSequenceKey sharedKey = new OctetSequenceKey.Builder(secret)
            .keyID("shared-1").algorithm(JWEAlgorithm.DIR).build();

        EncryptedJWT direct = new EncryptedJWT(
            new JWEHeader.Builder(JWEAlgorithm.DIR, EncryptionMethod.A256GCM)
                .keyID(sharedKey.getKeyID()).build(), claims);
        direct.encrypt(new DirectEncrypter(secret));
        System.out.println("\\ndir JWE length " + direct.serialize().length()
            + " vs RSA-OAEP " + jwe.length() + " vs JWS " + jws.length());
    }
}

/*
Choosing
--------
JWS  (the default)    integrity + authenticity, payload public.
                      Keep the payload minimal; TLS handles transport confidentiality.

JWE                   confidentiality too. Use when the token crosses an untrusted
                      intermediary, is persisted, or regulation requires it.

Nested (JWS in JWE)   both. Always sign first, then encrypt, and set cty: JWT.

Rule of thumb: if you are reaching for JWE because the claims are sensitive,
first ask whether those claims belong in the token at all. An opaque reference
plus a server-side lookup is usually simpler and safer.
*/`,
      codeLanguage: "java",
      explanation:
        "JWS signs (3 parts, readable); JWE encrypts (5 parts, opaque). Sign first then encrypt for nested tokens — but prefer a minimal JWS payload.",
      followUps: [
        "Why must you sign before encrypting rather than the reverse?",
        "Why is JWE rarely necessary when TLS is in place?",
      ],
    },
    {
      id: "b137",
      question: "How do you design JWT claims and map them to Spring Security authorities?",
      answer:
        "Claim design is where token bloat and authorization bugs originate.\n\n" +
        "**Principles:**\n\n" +
        "1. **Minimal.** Every claim is sent on **every request**. A token with 50 permissions, a full profile and a menu tree can exceed 8 KB and hit the default server header limit (`server.max-http-header-size`, 8 KB). Keep it under ~1 KB.\n" +
        "2. **Stable.** Claims are a frozen snapshot until expiry. Put things that rarely change (identity, tenant, coarse roles) in the token; look up volatile things (feature flags, fine-grained permissions, quotas) server-side.\n" +
        "3. **Public-safe.** The payload is readable. No PII, no internal database ids you would not publish, no entitlement detail that reveals your product's structure.\n" +
        "4. **Namespaced.** Custom claims should be namespaced to avoid collisions with registered or provider claims — Auth0 uses `https://myapp.example.com/roles`. Never overwrite a registered claim.\n" +
        "5. **Coarse roles, not fine permissions.** Put `roles: [MANAGER]` in the token and resolve the permission set server-side; otherwise every permission change requires a new token *and* the token grows without bound.\n\n" +
        "**Mapping to authorities in Spring:**\n\n" +
        "- The default `JwtGrantedAuthoritiesConverter` reads `scope` or `scp` and prefixes each with **`SCOPE_`**. So `scope: \"orders:read\"` becomes the authority `SCOPE_orders:read`, checked with `hasAuthority(\"SCOPE_orders:read\")`.\n" +
        "- Roles need a **custom converter** because providers nest them differently: Keycloak uses `realm_access.roles` and `resource_access.<client>.roles`, Auth0 uses a namespaced claim, Cognito uses `cognito:groups`. Map them to `ROLE_*` so `hasRole` works.\n" +
        "- Set `setPrincipalClaimName(\"preferred_username\")` if you want `authentication.getName()` to return something human-readable instead of the `sub` UUID.\n" +
        "- For a **custom principal**, implement `Converter<Jwt, AbstractAuthenticationToken>` and build your own token type carrying the tenant id and whatever else your services need — then `@AuthenticationPrincipal` gives you a typed object rather than raw claims.\n\n" +
        "**Multi-tenancy:** put `tenant_id` in the token, but still **filter by it in the query** — a token claim is an input, not an enforcement mechanism.",
      code: `import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.*;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.*;

/** Handles Keycloak, Auth0 and Cognito claim shapes in one converter. */
@Component
public class MultiProviderAuthoritiesConverter
        implements Converter<Jwt, Collection<GrantedAuthority>> {

    private static final String NAMESPACE = "https://myapp.example.com/";

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();

        // 1. OAuth2 scopes -> SCOPE_* (space-delimited string, or "scp" array)
        Object scope = jwt.getClaim("scope");
        if (scope instanceof String s) {
            Arrays.stream(s.split(" ")).filter(v -> !v.isBlank())
                .map(v -> new SimpleGrantedAuthority("SCOPE_" + v))
                .forEach(authorities::add);
        } else if (jwt.getClaim("scp") instanceof Collection<?> scp) {
            scp.stream().map(v -> new SimpleGrantedAuthority("SCOPE_" + v))
                .forEach(authorities::add);
        }

        // 2. Keycloak realm roles: realm_access.roles
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> roles) {
            roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .forEach(authorities::add);
        }

        // 3. Keycloak client roles: resource_access.<client>.roles
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            resourceAccess.values().stream()
                .filter(Map.class::isInstance).map(Map.class::cast)
                .map(m -> m.get("roles"))
                .filter(Collection.class::isInstance).map(Collection.class::cast)
                .flatMap(Collection::stream)
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .forEach(authorities::add);
        }

        // 4. Auth0 namespaced claim
        if (jwt.getClaim(NAMESPACE + "roles") instanceof Collection<?> auth0Roles) {
            auth0Roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .forEach(authorities::add);
        }

        // 5. Cognito groups
        if (jwt.getClaim("cognito:groups") instanceof Collection<?> groups) {
            groups.stream().map(g -> new SimpleGrantedAuthority("ROLE_" + g))
                .forEach(authorities::add);
        }

        return authorities;
    }
}

/** A typed principal: tenant and user id available without digging into claims. */
record AppPrincipal(String userId, String tenantId, String displayName,
                    Collection<GrantedAuthority> authorities) { }

class AppAuthenticationToken extends AbstractAuthenticationToken {
    private final Jwt jwt;
    private final AppPrincipal principal;

    AppAuthenticationToken(Jwt jwt, AppPrincipal principal) {
        super(principal.authorities());
        this.jwt = jwt; this.principal = principal;
        setAuthenticated(true);
    }
    @Override public Object getCredentials() { return jwt.getTokenValue(); }
    @Override public Object getPrincipal()   { return principal; }
    @Override public String getName()        { return principal.userId(); }
}

@Component
class AppJwtAuthenticationConverter
        implements Converter<Jwt, AbstractAuthenticationToken> {

    private final MultiProviderAuthoritiesConverter authorities;
    AppJwtAuthenticationConverter(MultiProviderAuthoritiesConverter authorities) {
        this.authorities = authorities;
    }

    @Override public AbstractAuthenticationToken convert(Jwt jwt) {
        String tenantId = jwt.getClaimAsString("tenant_id");
        if (tenantId == null) throw new org.springframework.security.oauth2.jwt
            .BadJwtException("tenant_id claim is required");
        return new AppAuthenticationToken(jwt, new AppPrincipal(
            jwt.getSubject(),
            tenantId,
            jwt.getClaimAsString("preferred_username"),
            authorities.convert(jwt)));
    }
}

@org.springframework.web.bind.annotation.RestController
class TenantAwareController {

    /** A typed principal instead of raw claim digging. */
    @org.springframework.web.bind.annotation.GetMapping("/api/orders")
    List<String> orders(
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            AppPrincipal principal) {
        // The tenant comes from the token, but it is still applied IN THE QUERY.
        // return repository.findByTenantId(principal.tenantId());
        return List.of("order-1");
    }
}

/*
A well-designed access token (~450 bytes)
-----------------------------------------
{
  "iss": "https://auth.example.com", "sub": "6f1c9c2e-...", "aud": "orders-api",
  "exp": 1774612800, "iat": 1774611900, "jti": "9b2f...",
  "scope": "orders:read orders:write",
  "realm_access": { "roles": ["USER", "SELLER"] },
  "tenant_id": "acme",
  "preferred_username": "alice"
}

A badly designed one (8 KB, rejected by the server's header limit)
------------------------------------------------------------------
  "permissions": [ ...200 fine-grained strings... ],
  "profile": { full address, phone, date of birth },     <- PII, and it is public
  "menu": [ ...the entire navigation tree... ],
  "featureFlags": { ...40 booleans that change hourly... }   <- stale immediately
*/`,
      codeLanguage: "java",
      explanation:
        "Keep claims minimal, stable and public-safe; map scopes to SCOPE_ and provider-specific role claims to ROLE_ with a custom converter.",
      followUps: [
        "What happens when a token exceeds the server's max header size?",
        "Why keep fine-grained permissions out of the token?",
      ],
    },
    {
      id: "b138",
      question: "A user reports intermittent 401s from your JWT-secured API. How do you debug it?",
      answer:
        "Work from the cheapest, most common cause outward. **'Intermittent'** is the key word — it points at time, caching or a subset of instances.\n\n" +
        "**Step 1 — reproduce and capture.** Get the exact token (from the user's network tab, never from logs), the timestamp, and the response headers. `WWW-Authenticate: Bearer error=\"invalid_token\", error_description=\"...\"` usually names the cause.\n\n" +
        "**Step 2 — decode the token** (no key needed) and check `exp`, `iat`, `iss`, `aud`, `kid`, `alg`. Most 401s are answered here.\n\n" +
        "**Step 3 — the usual suspects for *intermittent* failures:**\n\n" +
        "1. **Clock skew.** One instance's clock drifts and rejects tokens that are still valid elsewhere. Symptom: failures correlate with a specific pod. **Fix: NTP, and a 30–60 s skew allowance.**\n" +
        "2. **Key rotation without overlap.** The auth server started signing with a new `kid` before verifiers refreshed their JWKS cache. Symptom: a burst of failures that clears in ~5 minutes. **Fix: the stage-promote-retire sequence.**\n" +
        "3. **A subset of instances misconfigured** — a different `issuer-uri`, `audience` or secret after a partial deploy. Symptom: roughly 1-in-N requests fail. **Fix: check config per instance; add the config hash to `/actuator/info`.**\n" +
        "4. **Token expiry at the boundary** — a 15-minute token and a client that only refreshes on 401 will always fail one request. **Fix: refresh proactively at ~80% of the lifetime.**\n" +
        "5. **Concurrent refresh races** — six parallel requests each trigger a rotation and five get a revoked token. **Fix: single-flight refresh on the client and a grace window on the server.**\n" +
        "6. **Load balancer or proxy stripping/truncating the `Authorization` header**, or a header size limit being hit by a large token.\n" +
        "7. **JWKS endpoint flaky** — verification fails when the fetch times out. **Fix: cache, retry, outage tolerance.**\n\n" +
        "**Step 4 — instrument.** Log `jti`, `sub`, `kid`, `exp`, the instance id and the precise failure reason (never the token). Add a counter tagged by reason so you can see immediately whether it is expiry, signature, audience or revocation. That single dashboard turns this from a mystery into a five-minute diagnosis.",
      code: `import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.actuate.health.*;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import java.time.*;
import java.util.*;

/** Wrap the decoder so every failure is categorised, counted and logged safely. */
@Component
public class DiagnosticJwtDecoder implements JwtDecoder {

    private final JwtDecoder delegate;
    private final MeterRegistry registry;
    private final String instanceId = UUID.randomUUID().toString().substring(0, 8);

    public DiagnosticJwtDecoder(JwtDecoder delegate, MeterRegistry registry) {
        this.delegate = delegate; this.registry = registry;
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            Jwt jwt = delegate.decode(token);
            registry.counter("jwt.validation", "result", "success").increment();

            // Early warning: tokens arriving close to expiry mean lazy client refresh.
            Duration remaining = Duration.between(Instant.now(), jwt.getExpiresAt());
            if (remaining.toSeconds() < 30) {
                registry.counter("jwt.validation", "result", "near-expiry").increment();
            }
            return jwt;
        } catch (JwtException ex) {
            String reason = classify(ex);
            registry.counter("jwt.validation", "result", "failure", "reason", reason)
                    .increment();

            // Log the DIAGNOSTICS, never the token itself.
            Map<String, Object> context = safeHeaderAndClaims(token);
            System.out.println("jwt rejected reason=" + reason
                + " instance=" + instanceId
                + " kid=" + context.get("kid")
                + " alg=" + context.get("alg")
                + " iss=" + context.get("iss")
                + " aud=" + context.get("aud")
                + " exp=" + context.get("exp")
                + " now=" + Instant.now().getEpochSecond()
                + " jti=" + context.get("jti"));
            throw ex;
        }
    }

    private String classify(JwtException ex) {
        String message = String.valueOf(ex.getMessage()).toLowerCase(Locale.ROOT);
        if (message.contains("expired"))   return "expired";
        if (message.contains("signature")) return "bad-signature";
        if (message.contains("audience"))  return "bad-audience";
        if (message.contains("issuer"))    return "bad-issuer";
        if (message.contains("kid") || message.contains("key")) return "unknown-key";
        if (message.contains("revoked"))   return "revoked";
        return "other";
    }

    /** Decode without verifying, purely for diagnostics. */
    private Map<String, Object> safeHeaderAndClaims(String token) {
        Map<String, Object> out = new LinkedHashMap<>();
        try {
            String[] parts = token.split("\\\\.");
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            var header = mapper.readTree(Base64.getUrlDecoder().decode(parts[0]));
            var payload = mapper.readTree(Base64.getUrlDecoder().decode(parts[1]));
            out.put("kid", header.path("kid").asText(null));
            out.put("alg", header.path("alg").asText(null));
            out.put("iss", payload.path("iss").asText(null));
            out.put("aud", payload.path("aud").toString());
            out.put("exp", payload.path("exp").asLong());
            out.put("jti", payload.path("jti").asText(null));
        } catch (Exception ignored) { out.put("parse", "failed"); }
        return out;
    }
}

/** Detect clock skew and JWKS reachability before users do. */
@Component
class JwtHealthIndicator implements HealthIndicator {

    private final String jwksUri;
    JwtHealthIndicator(
            @org.springframework.beans.factory.annotation.Value("\${app.jwks-uri}") String jwksUri) {
        this.jwksUri = jwksUri;
    }

    @Override public Health health() {
        Health.Builder builder = Health.up();
        try {
            var client = java.net.http.HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2)).build();
            long start = System.currentTimeMillis();
            var response = client.send(
                java.net.http.HttpRequest.newBuilder(java.net.URI.create(jwksUri)).build(),
                java.net.http.HttpResponse.BodyHandlers.ofString());
            builder.withDetail("jwksStatus", response.statusCode())
                   .withDetail("jwksLatencyMs", System.currentTimeMillis() - start);

            // Compare our clock with the auth server's Date header - catches skew.
            response.headers().firstValue("Date").ifPresent(date -> {
                long serverEpoch = java.time.ZonedDateTime
                    .parse(date, java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME)
                    .toEpochSecond();
                long drift = Math.abs(serverEpoch - Instant.now().getEpochSecond());
                builder.withDetail("clockDriftSeconds", drift);
                if (drift > 30) builder.down().withDetail("problem", "clock skew");
            });
            if (response.statusCode() != 200) builder.down();
        } catch (Exception e) {
            return Health.down().withDetail("jwks", "unreachable").build();
        }
        return builder.build();
    }
}

/*
Triage runbook
--------------
1. curl -i -H "Authorization: Bearer <token>" https://api/...   -> read WWW-Authenticate
2. Decode the payload: check exp vs now, iss, aud, kid.
3. Dashboard: jwt.validation{reason=...} - which bucket is spiking?
   expired       -> client refreshes too late, or clock skew
   bad-signature -> key rotation, or a mismatched secret on some instances
   unknown-key   -> JWKS cache stale; check the rotation timeline
   bad-audience  -> the client is calling the wrong service with the wrong token
4. Is it one instance? kubectl logs and compare the config hash across pods.
5. date +%s on every node vs the auth server's Date header -> clock skew.
6. Check the ingress for Authorization header stripping and header size limits.
*/`,
      codeLanguage: "java",
      explanation:
        "Decode the token first, then look for clock skew, stale JWKS after rotation, per-instance config drift and lazy client refresh — instrumented by failure reason.",
      followUps: [
        "Why do intermittent failures often point at one pod?",
        "How does proactive refresh at 80% of the TTL remove a whole class of 401s?",
      ],
    },
  ],
  meta: {
    b125: { difficulty: "easy", priority: "very-high", tags: ["jwt", "structure", "base64url"], readMinutes: 5 },
    b126: { difficulty: "medium", priority: "very-high", tags: ["claims", "validation", "rfc7519"], readMinutes: 5 },
    b127: { difficulty: "hard", priority: "very-high", tags: ["hs256", "rs256", "alg-none"], readMinutes: 6 },
    b128: { difficulty: "medium", priority: "very-high", tags: ["validation", "checklist", "nimbus"], readMinutes: 5 },
    b129: { difficulty: "hard", priority: "very-high", tags: ["refresh-token", "rotation", "reuse-detection"], readMinutes: 6 },
    b130: { difficulty: "medium", priority: "very-high", tags: ["storage", "xss", "cookies"], readMinutes: 5 },
    b131: { difficulty: "hard", priority: "very-high", tags: ["revocation", "logout", "denylist"], readMinutes: 5 },
    b132: { difficulty: "medium", priority: "very-high", tags: ["implementation", "spring-boot", "jjwt"], readMinutes: 7 },
    b133: { difficulty: "hard", priority: "high", tags: ["jwks", "key-rotation", "kid"], readMinutes: 5 },
    b134: { difficulty: "medium", priority: "very-high", tags: ["sessions", "trade-offs", "architecture"], readMinutes: 5 },
    b135: { difficulty: "hard", priority: "very-high", tags: ["vulnerabilities", "hardening", "attacks"], readMinutes: 6 },
    b136: { difficulty: "hard", priority: "medium", tags: ["jws", "jwe", "encryption"], readMinutes: 5 },
    b137: { difficulty: "medium", priority: "high", tags: ["claims-design", "authorities", "converter"], readMinutes: 5 },
    b138: { difficulty: "hard", priority: "high", tags: ["debugging", "401", "observability"], readMinutes: 5 },
  },
});
