# Security Plan — Coding Interview Preparation Platform

## 1. Authentication & Authorization (Existing, Enhanced)

### Current (Preserved)
```typescript
// JWT-based authentication with 7-day expiry
// Role-based access: learner | admin
// Password hashing with bcrypt (10 rounds)
// HTTP-only cookie for token storage
```

### Enhancements
```typescript
// Add CSRF protection via Next.js built-in
// Add login rate limiting (5 attempts per minute per IP)
// Add account lockout after 10 failed attempts
// Add session invalidation on password change
// Add 2FA support (optional, post-MVP)
```

---

## 2. Code Execution Security (Critical)

### Architecture for Safe Code Execution

```
User Code → [Next.js API] → [Piston API / Judge0 Docker] → [Sandboxed Container]
                │                                                      │
                │  (no direct execution)                                │
                └────────────── Results ────────────────────────────────┘
```

**NEVER execute user code on the Next.js server.**

### Sandbox Restrictions
- **No network access** — containers have no outbound internet
- **Time limit** — 2-5 seconds per test case
- **Memory limit** — 256-512 MB per execution
- **Process limit** — max 10 processes
- **No filesystem writes** — read-only root filesystem
- **No root access** — runs as non-root user
- **No privileged operations**
- **Cgroup isolation** for resource limits

### Piston API Security
- Piston (public) provides sandboxed execution
- Rate limit: 5 requests/second (free tier)
- Queue submissions to stay within limits

### Input Sanitization
```typescript
// Sanitize test case inputs
function sanitizeInput(input: string): string {
  return input
    .replace(/[\0\n\r]/g, '') // Remove null bytes and control chars
    .substring(0, 10000); // Limit input length
}

// Sanitize code to prevent injection
function sanitizeCode(code: string): string {
  // Remove any null bytes
  return code.replace(/\0/g, '');
}
```

---

## 3. API Security

### Rate Limiting
```typescript
// Implement per-route rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// Rate limits per route:
// Auth routes: 10 requests/minute per IP
// Submission routes: 30 requests/minute per user
// Search routes: 60 requests/minute per user
// AI routes: 10 requests/minute per user
// General API: 100 requests/minute per user
```

### Input Validation
```typescript
// Validate all inputs on every API route
import { z } from 'zod'; // (add to dependencies)

const submitSchema = z.object({
  code: z.string().min(1).max(50000),
  language: z.enum(['java', 'python', 'cpp', 'c', 'javascript', 'typescript', 'go', 'rust']),
  problemId: z.string().cuid(),
});
```

### SQL Injection Protection
- Already protected by Prisma ORM (parameterized queries)
- Still sanitize any raw SQL queries
- Use Prisma's `$queryRaw` with template literals (type-safe)

### XSS Protection
- React/Next.js automatically escapes output
- Use `dangerouslySetInnerHTML` sparingly (never with user input)
- Sanitize any HTML content (for problem descriptions) with DOMPurify

### CSRF Protection
- Next.js Server Actions have built-in CSRF protection
- For API routes: Validate Origin/Referer headers
- Use SameSite=Strict cookie attribute (already set)

### Security Headers
```typescript
// In next.config.ts or middleware
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://piston.api; font-src 'self' data:;" },
];
```

---

## 4. Data Security

### Password Storage
- bcrypt with 10 salt rounds (existing, preserved)
- Passwords never logged or returned in API responses

### JWT Security
- Token expiry: 7 days (existing)
- Secret rotation capability
- No sensitive data in JWT payload
- HTTP-only, Secure, SameSite cookies

### Data Encryption
- HTTPS enforced (Vercel/Next.js handles)
- Database connection encrypted (PostgreSQL SSL)
- No plaintext secrets in code (all via environment variables)

---

## 5. Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
JWT_SECRET=<random-64-char-string>

# Judge
PISTON_API_URL=https://piston.api
JUDGE0_API_KEY=<key>

# AI
OPENAI_API_KEY=<key>
ANTHROPIC_API_KEY=<key>  # Optional fallback

# Rate Limiting
REDIS_URL=redis://...  # Optional, for distributed rate limiting
```

---

## 6. Monitoring & Incident Response

### Logging
```typescript
// Log all security-relevant events
console.warn('Security event:', {
  type: 'FAILED_LOGIN',
  userId: attempt.userId,
  ip: request.ip,
  timestamp: new Date().toISOString(),
  path: request.url,
});
```

### Events to Log
- Failed login attempts
- Unauthorized access attempts
- Rate limit exceeded
- Suspicious code submissions
- Admin actions (problem create/delete/approve)
- Password reset attempts

### Incident Response Plan
1. **Detect**: Automated monitoring of error rates and security events
2. **Contain**: Disable suspect accounts, block IPs
3. **Assess**: Review logs to determine scope
4. **Remediate**: Fix vulnerability, rotate secrets if needed
5. **Notify**: Inform affected users (if data breach)
6. **Document**: Post-mortem analysis

---

## 7. Compliance

- GDPR-ready: User data export and account deletion support
- No tracking cookies (only functional cookies)
- No third-party analytics (privacy-first approach)
- User consent for data processing
- 14-day log retention policy for non-essential logs
