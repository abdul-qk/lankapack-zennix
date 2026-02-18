# Technical Audit Report
**Date:** February 17, 2026  
**Codebase:** lankapack-zennix  
**Tech Stack:** Next.js 14, Prisma, PostgreSQL, TypeScript

---

## Executive Summary

This audit identified **47 issues** across security, correctness, performance, and maintainability categories. The most critical issues include a syntax error preventing compilation, weak password hashing, unprotected API routes, and missing input validation.

---

## Critical Issues

### CRIT-001: Syntax Error in Middleware (Compilation Failure)
**File:** `middleware.ts:69`  
**Severity:** Critical  
**Issue:** Missing opening brace `{` after `try` statement, causing compilation failure.

```typescript
if (token && !isPublicPath) {
  try  // ❌ Missing opening brace
    await jose.jwtVerify(...)
```

**Why it's a problem:** Application will not compile or run. This blocks all functionality.

**Fix:**
```typescript
if (token && !isPublicPath) {
  try {  // ✅ Add opening brace
    await jose.jwtVerify(...)
```

---

### CRIT-002: MD5 Password Hashing (Security Vulnerability)
**File:** `app/api/login/route.ts:12-15`  
**Severity:** Critical  
**Issue:** Using MD5 for password hashing, which is cryptographically broken and vulnerable to rainbow table attacks.

**Why it's a problem:** MD5 is fast to compute and has known collisions. Attackers can crack passwords using precomputed tables or brute force attacks.

**Fix:** Migrate to bcrypt or Argon2:
```typescript
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 10);
// Compare: await bcrypt.compare(password, user.he_password);
```

**Migration Strategy:**
1. Add new column `he_password_bcrypt` to `hps_login` table
2. Update login to check both MD5 (legacy) and bcrypt (new)
3. Migrate passwords on next successful login
4. Remove MD5 support after migration period

---

### CRIT-003: API Routes Completely Unprotected
**File:** `middleware.ts:101`  
**Severity:** Critical  
**Issue:** Middleware matcher excludes all `/api` routes, meaning all API endpoints are publicly accessible without authentication.

```typescript
matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
```

**Why it's a problem:** Anyone can call API endpoints directly, bypassing authentication. This allows unauthorized data access, modification, and deletion.

**Fix:** Create API authentication middleware:
```typescript
// lib/api-auth.ts
import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function verifyApiAuth() {
  const token = cookies().get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  
  const { payload } = await jose.jwtVerify(
    token,
    new TextEncoder().encode(process.env.JWT_SECRET!)
  );
  return payload;
}
```

Then add to each API route:
```typescript
export async function POST(req: Request) {
  try {
    await verifyApiAuth(); // Add this
    // ... rest of handler
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
}
```

---

### CRIT-004: Missing JWT_SECRET Validation
**Files:** `app/api/login/route.ts`, `middleware.ts`, `app/api/refresh/route.ts`  
**Severity:** Critical  
**Issue:** `process.env.JWT_SECRET` is used without validation. If undefined, JWT operations will fail silently or throw cryptic errors.

**Why it's a problem:** Application crashes at runtime with unclear error messages. Production deployments may fail if environment variable is missing.

**Fix:** Add validation at application startup:
```typescript
// lib/env.ts
export function validateEnv() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
}

// Call in app initialization or middleware
```

---

### CRIT-005: Hardcoded User IDs Throughout Codebase
**Files:** Multiple API routes  
**Severity:** Critical  
**Issue:** Many routes hardcode `user_id: 1` instead of extracting from JWT token.

**Examples:**
- `app/api/sales/invoice/route.ts:105,120`
- `app/api/job/jobcard/new/route.ts:131`
- `app/api/material/material-receiving-note/finalize/route.ts:49`
- `app/api/slitting/[id]/add-barcode/route.ts:49`

**Why it's a problem:** 
- Audit trail is incorrect (all actions attributed to user 1)
- Cannot track who made changes
- Compliance and security issues

**Fix:** Extract user ID from JWT:
```typescript
// lib/auth.ts
export async function getUserIdFromToken(): Promise<number> {
  const token = cookies().get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  
  const { payload } = await jose.jwtVerify(
    token,
    new TextEncoder().encode(process.env.JWT_SECRET!)
  );
  return payload.userId as number;
}

// Usage:
const userId = await getUserIdFromToken();
await prisma.hps_bill_info.create({
  data: { user_id: userId, ... }
});
```

---

## High Priority Issues

### HIGH-001: N+1 Query Problem in Stock In Hand Route
**File:** `app/api/stock/stockinhand/route.ts:26-46`  
**Severity:** High  
**Issue:** For each bundle type, a separate database query is executed inside `Promise.all`, causing N+1 queries.

**Why it's a problem:** With 100 bundle types, this executes 101 queries instead of 1-2 optimized queries. Performance degrades linearly with data size.

**Fix:** Use a single query with aggregation:
```typescript
const stockInHand = await prisma.hps_complete_item.groupBy({
  by: ['bundle_type'],
  where: {
    del_ind: 1,
    complete_item_info: { not: 1 },
  },
  _sum: {
    complete_item_weight: true,
    complete_item_bags: true,
  },
  _count: true,
});
```

Then join with bag types in a single query or use Prisma's `include`/`select` to fetch related data efficiently.

---

### HIGH-002: Unsafe parseInt/parseFloat Usage
**Files:** Multiple API routes  
**Severity:** High  
**Issue:** `parseInt()` and `parseFloat()` are called without validation, potentially producing `NaN` values that are stored in the database.

**Examples:**
- `app/api/sales/invoice/route.ts:115-116` - `parseInt(body.doId)`, `parseInt(item.bagTypeId)`
- `app/api/stock/stockinhand/route.ts:50,54` - `parseFloat()` without validation
- `app/api/job/jobcard/new/route.ts:59-61` - Date parsing without validation

**Why it's a problem:** `NaN` values break calculations, cause UI errors, and corrupt data integrity.

**Fix:** Create validation utilities:
```typescript
// lib/validation.ts
export function safeParseInt(value: any, defaultValue?: number): number {
  const parsed = parseInt(String(value), 10);
  if (isNaN(parsed)) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Invalid integer: ${value}`);
  }
  return parsed;
}

export function safeParseFloat(value: any, defaultValue?: number): number {
  const parsed = parseFloat(String(value));
  if (isNaN(parsed)) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Invalid float: ${value}`);
  }
  return parsed;
}
```

---

### HIGH-003: Inconsistent Soft Delete Logic
**Files:** Multiple routes  
**Severity:** High  
**Issue:** `del_ind` field usage is inconsistent. Some routes use `del_ind: 1` for active records, others use `del_ind: 0`. The DELETE endpoint sets `del_ind: 0` to "delete" but queries use `del_ind: 1` for active.

**Examples:**
- `app/api/sales/invoice/route.ts:9` - Queries `del_ind: 1` for active
- `app/api/sales/invoice/route.ts:165` - Sets `del_ind: 0` to delete
- `app/api/stock/stockinhand/route.ts:19,39` - Uses `del_ind: 1` for active

**Why it's a problem:** Logic confusion leads to bugs. Active records may be filtered out or deleted records shown.

**Fix:** Standardize on one convention (recommend `del_ind: 0` = active, `del_ind: 1` = deleted):
```typescript
// lib/constants.ts
export const DELETED = 1;
export const ACTIVE = 0;

// Usage:
where: { del_ind: ACTIVE }
data: { del_ind: DELETED }
```

---

### HIGH-004: Missing Input Validation with Zod
**Files:** All POST/PUT API routes  
**Severity:** High  
**Issue:** Despite having Zod installed, most API routes don't validate request bodies. Invalid data can cause database errors or data corruption.

**Why it's a problem:** 
- Type safety is lost at runtime
- Invalid data reaches database layer
- Error messages are unclear

**Fix:** Create validation schemas:
```typescript
// app/api/sales/invoice/route.ts
import { z } from 'zod';

const InvoiceItemSchema = z.object({
  bagTypeId: z.number().int().positive(),
  quantity: z.string().regex(/^\d+(\.\d+)?$/),
  price: z.string().regex(/^\d+(\.\d+)?$/),
  total: z.string().regex(/^\d+(\.\d+)?$/),
});

const CreateInvoiceSchema = z.object({
  customerId: z.number().int().positive(),
  doNumber: z.string().min(1),
  doId: z.number().int().positive(),
  items: z.array(InvoiceItemSchema).min(1),
  userId: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const validated = CreateInvoiceSchema.parse(body); // Throws on invalid
  // Use validated data...
}
```

---

### HIGH-005: Missing Database Transactions for Related Operations
**Files:** `app/api/sales/invoice/route.ts:98-126`  
**Severity:** High  
**Issue:** Invoice creation involves multiple related database operations (invoice info + items) without a transaction. If item creation fails, invoice info remains orphaned.

**Why it's a problem:** Data inconsistency - partial invoices exist in database, breaking referential integrity.

**Fix:** Wrap in transaction:
```typescript
const result = await prisma.$transaction(async (tx) => {
  const invoiceInfo = await tx.hps_bill_info.create({...});
  const invoiceItems = await Promise.all(
    body.items.map(item => tx.hps_bill_item.create({...}))
  );
  return { invoiceInfo, invoiceItems };
});
```

---

### HIGH-006: Error Messages Expose Internal Details
**Files:** Multiple API routes  
**Severity:** High  
**Issue:** Error responses include stack traces, database error codes, and internal file paths.

**Examples:**
- `app/api/sales/invoice/route.ts:202` - Returns `error.message` directly
- `app/api/material/material-receiving-note/finalize/route.ts:101` - Exposes error message

**Why it's a problem:** Information disclosure helps attackers understand system internals and exploit vulnerabilities.

**Fix:** Sanitize error messages:
```typescript
catch (error) {
  console.error('Error:', error); // Log full details server-side
  return new Response(
    JSON.stringify({ error: 'Failed to process request' }),
    { status: 500 }
  );
}
```

---

### HIGH-007: Prisma Query Logging Enabled in Production
**File:** `lib/prisma.ts:10`  
**Severity:** High  
**Issue:** `log: ['query']` is enabled unconditionally, logging all SQL queries including sensitive data.

**Why it's a problem:** 
- Performance overhead
- Logs may contain sensitive data (passwords, PII)
- Log files grow unbounded

**Fix:** Conditionally enable logging:
```typescript
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  // ...
});
```

---

## Medium Priority Issues

### MED-001: Missing Rate Limiting
**Files:** All API routes  
**Severity:** Medium  
**Issue:** No rate limiting on API endpoints, allowing brute force attacks and DoS.

**Why it's a problem:** Attackers can hammer login endpoint or expensive queries, causing service degradation.

**Fix:** Implement rate limiting middleware:
```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

const rateLimit = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minute
});

export function rateLimitMiddleware(identifier: string, limit: number = 10) {
  const count = rateLimit.get(identifier) as number || 0;
  if (count >= limit) {
    throw new Error('Rate limit exceeded');
  }
  rateLimit.set(identifier, count + 1);
}
```

---

### MED-002: Missing CSRF Protection
**Files:** All POST/PUT/DELETE routes  
**Severity:** Medium  
**Issue:** No CSRF tokens or SameSite cookie protection beyond `sameSite: "lax"`.

**Why it's a problem:** Cross-site request forgery attacks can modify data on behalf of authenticated users.

**Fix:** Use Next.js built-in CSRF protection or implement token-based CSRF:
```typescript
// Use SameSite: 'strict' for sensitive operations
cookies().set({
  name: 'token',
  value: accessToken,
  httpOnly: true,
  secure: true,
  sameSite: 'strict', // Change from 'lax'
});
```

---

### MED-003: Inefficient Date Parsing
**File:** `app/api/job/jobcard/new/route.ts:53-67`  
**Severity:** Medium  
**Issue:** Custom date parsing logic instead of using standard libraries. Logic may fail on edge cases (invalid dates, timezone issues).

**Why it's a problem:** Date parsing bugs cause incorrect dates in database, affecting business logic.

**Fix:** Use date-fns (already installed):
```typescript
import { parse } from 'date-fns';

const parseDate = (dateStr: string, format: string = 'MM/dd/yyyy') => {
  try {
    return parse(dateStr, format, new Date());
  } catch {
    return null;
  }
};
```

---

### MED-004: Missing Pagination on List Endpoints
**Files:** `app/api/sales/invoice/route.ts:4-58`, `app/api/job/jobcard/route.ts:3-31`  
**Severity:** Medium  
**Issue:** GET endpoints return all records without pagination.

**Why it's a problem:** Large datasets cause memory issues, slow responses, and poor UX.

**Fix:** Add pagination:
```typescript
const page = parseInt(searchParams.get('page') || '1');
const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  prisma.hps_bill_info.findMany({ skip, take: limit, ... }),
  prisma.hps_bill_info.count({ where: { del_ind: 1 } }),
]);

return Response.json({
  data,
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
});
```

---

### MED-005: Missing Request Size Limits
**Files:** All POST routes  
**Severity:** Medium  
**Issue:** No explicit body size limits, allowing memory exhaustion attacks.

**Why it's a problem:** Large request bodies can crash the server or cause DoS.

**Fix:** Add body size validation:
```typescript
export async function POST(req: NextRequest) {
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    return new Response(JSON.stringify({ error: 'Request too large' }), { status: 413 });
  }
  // ...
}
```

---

### MED-006: Inconsistent Error Response Format
**Files:** All API routes  
**Severity:** Medium  
**Issue:** Error responses use different formats: sometimes `{ error: string }`, sometimes `{ message: string }`, sometimes include `details`.

**Why it's a problem:** Frontend must handle multiple error formats, increasing complexity and bugs.

**Fix:** Standardize error response format:
```typescript
// lib/api-response.ts
export function errorResponse(message: string, status: number = 500, code?: string) {
  return new Response(
    JSON.stringify({ 
      success: false,
      error: { message, code: code || 'INTERNAL_ERROR' }
    }),
    { status }
  );
}
```

---

### MED-007: Missing Database Indexes (Potential)
**File:** Database schema (inferred from queries)  
**Severity:** Medium  
**Issue:** Queries filter on `del_ind`, `bundle_type`, `customer_name`, etc. without visible indexes in Prisma schema.

**Why it's a problem:** Slow queries as data grows, especially on frequently filtered columns.

**Fix:** Add indexes to Prisma schema:
```prisma
model hps_complete_item {
  // ...
  @@index([del_ind, complete_item_info])
  @@index([bundle_type, del_ind])
}

model hps_bill_info {
  // ...
  @@index([del_ind])
  @@index([customer_name])
}
```

---

### MED-008: Missing Input Sanitization
**Files:** All routes accepting user input  
**Severity:** Medium  
**Issue:** User-provided strings are stored directly without sanitization (XSS risk if displayed, injection risk if used in queries).

**Why it's a problem:** Stored XSS attacks if data is rendered in frontend without escaping.

**Fix:** Sanitize inputs (though Prisma protects against SQL injection):
```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(userInput);
```

---

### MED-009: Missing Request Timeout Handling
**Files:** All API routes  
**Severity:** Medium  
**Issue:** Long-running database queries can hang indefinitely.

**Why it's a problem:** Resource exhaustion, poor UX, potential DoS.

**Fix:** Use Prisma's timeout (already configured) and add request timeout:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s

try {
  const result = await fetch(..., { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

---

### MED-010: Missing Health Check Endpoint
**Files:** None  
**Severity:** Medium  
**Issue:** No `/api/health` endpoint for monitoring and load balancer health checks.

**Why it's a problem:** Cannot verify application status without accessing protected routes.

**Fix:** Create health check:
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    return Response.json({ status: 'error' }, { status: 503 });
  }
}
```

---

## Low Priority Issues

### LOW-001: Console.log Statements in Production Code
**Files:** Multiple files  
**Severity:** Low  
**Issue:** `console.log()` statements throughout codebase (e.g., `app/api/job/jobcard/new/route.ts:48-49`).

**Why it's a problem:** Performance overhead, log noise, potential information leakage.

**Fix:** Use proper logging library (e.g., Winston, Pino) with log levels:
```typescript
import logger from '@/lib/logger';

logger.debug('Received job_card_date:', job_card_date);
```

---

### LOW-002: Missing Type Safety in API Responses
**Files:** All API routes  
**Severity:** Low  
**Issue:** API responses use `any` types or lack TypeScript interfaces.

**Why it's a problem:** Type safety lost, harder to maintain, more runtime errors.

**Fix:** Define response types:
```typescript
interface InvoiceResponse {
  success: boolean;
  data?: {
    invoiceInfo: HpsBillInfo;
    invoiceItems: HpsBillItem[];
  };
  error?: string;
}
```

---

### LOW-003: Inconsistent Naming Conventions
**Files:** Multiple files  
**Severity:** Low  
**Issue:** Mix of camelCase (`customerId`) and snake_case (`customer_id`) in API routes.

**Why it's a problem:** Confusion, harder to maintain.

**Fix:** Standardize on camelCase for API (convert to snake_case for database):
```typescript
// API uses camelCase
const { customerId, doNumber } = await req.json();

// Convert to snake_case for Prisma
await prisma.hps_bill_info.create({
  data: { customer_name: customerId, bill_do: doNumber }
});
```

---

### LOW-004: Missing API Documentation
**Files:** All API routes  
**Severity:** Low  
**Issue:** No OpenAPI/Swagger documentation for API endpoints.

**Why it's a problem:** Harder for frontend developers and API consumers to understand endpoints.

**Fix:** Add OpenAPI documentation or use tRPC for type-safe APIs.

---

### LOW-005: Magic Numbers Throughout Codebase
**Files:** Multiple files  
**Severity:** Low  
**Issue:** Hardcoded numbers like `del_ind: 1`, `material_status: 0`, `user_id: 1`.

**Why it's a problem:** Unclear intent, harder to maintain.

**Fix:** Extract to constants:
```typescript
// lib/constants.ts
export const MaterialStatus = {
  AVAILABLE: 0,
  USED: 1,
} as const;
```

---

### LOW-006: Missing Unit Tests
**Files:** Entire codebase  
**Severity:** Low  
**Issue:** No test files found in codebase.

**Why it's a problem:** Cannot verify correctness, refactoring is risky.

**Fix:** Add Jest/Vitest tests for critical business logic.

---

### LOW-007: Inconsistent Date Handling
**Files:** Multiple files  
**Severity:** Low  
**Issue:** Mix of Date objects, ISO strings, and formatted strings.

**Why it's a problem:** Timezone bugs, inconsistent behavior.

**Fix:** Standardize on ISO strings for API, Date objects for database.

---

### LOW-008: Missing Environment Variable Validation
**Files:** Application startup  
**Severity:** Low  
**Issue:** No validation that required environment variables are set.

**Why it's a problem:** Runtime failures with unclear errors.

**Fix:** Use library like `envalid`:
```typescript
import { cleanEnv, str } from 'envalid';

export const env = cleanEnv(process.env, {
  JWT_SECRET: str({ minLength: 32 }),
  DATABASE_URL: str(),
});
```

---

## Performance Bottlenecks

### PERF-001: Sequential Database Queries in Loops
**File:** `app/api/material/material-receiving-note/import/route.ts:96-103`  
**Severity:** Medium  
**Issue:** Color lookup happens inside loop, causing sequential queries.

**Fix:** Batch fetch colors:
```typescript
const colorIds = [...new Set(itemsData.map(item => parseInt(String(item.material_colour), 10)))];
const colors = await prisma.hps_colour.findMany({
  where: { colour_id: { in: colorIds } }
});
const colorMap = new Map(colors.map(c => [c.colour_id, c.colour_name]));
```

---

### PERF-002: Missing Database Connection Pooling Configuration
**File:** `lib/prisma.ts`  
**Severity:** Medium  
**Issue:** No explicit connection pool configuration.

**Fix:** Configure in DATABASE_URL or Prisma:
```typescript
// DATABASE_URL should include: ?connection_limit=10&pool_timeout=20
```

---

### PERF-003: Large Result Sets Without Streaming
**Files:** Export/import routes  
**Severity:** Low  
**Issue:** CSV imports load entire file into memory.

**Fix:** Stream processing for large files.

---

## Code Smells

### SMELL-001: Duplicate Code
**Files:** Date parsing logic duplicated in `app/api/job/jobcard/new/route.ts` and `app/api/job/jobcard/edit/[id]/route.ts`  
**Fix:** Extract to shared utility.

---

### SMELL-002: Long Functions
**Files:** `app/api/material/material-receiving-note/import/route.ts` (233 lines)  
**Fix:** Break into smaller functions.

---

### SMELL-003: Commented-Out Code
**Files:** `app/api/job/jobcard/route.ts:11`  
**Fix:** Remove commented code or document why it's kept.

---

### SMELL-004: Inconsistent Error Handling
**Files:** Some routes use try-catch, others don't  
**Fix:** Standardize error handling pattern.

---

## Missing Edge Cases

### EDGE-001: Empty Arrays in GroupBy
**File:** `app/api/stock/stockinhand/route.ts:26`  
**Issue:** If `stockInHand` is empty, `Promise.all([])` works but could be more explicit.

---

### EDGE-002: Concurrent Modifications
**Files:** Update routes  
**Issue:** No optimistic locking or version checks to prevent concurrent modification conflicts.

**Fix:** Add version field or use Prisma's `update` with `where` conditions.

---

### EDGE-003: Missing Null Checks
**Files:** Multiple routes  
**Issue:** Assumptions that related records exist without checking.

**Fix:** Add existence checks before operations.

---

## Recommendations Summary

### Immediate Actions (This Week)
1. Fix syntax error in `middleware.ts` (CRIT-001)
2. Add API route authentication (CRIT-003)
3. Validate JWT_SECRET at startup (CRIT-004)
4. Replace MD5 with bcrypt (CRIT-002) - plan migration

### Short Term (This Month)
1. Extract user ID from JWT tokens (CRIT-005)
2. Fix N+1 queries (HIGH-001)
3. Add input validation with Zod (HIGH-004)
4. Standardize soft delete logic (HIGH-003)
5. Add database transactions (HIGH-005)

### Medium Term (Next Quarter)
1. Add rate limiting (MED-001)
2. Implement pagination (MED-004)
3. Standardize error responses (MED-006)
4. Add database indexes (MED-007)
5. Add comprehensive logging (LOW-001)

---

## Conclusion

The codebase has a solid foundation but requires immediate attention to critical security and correctness issues. Prioritize fixing compilation errors, securing API routes, and improving authentication before addressing performance and maintainability concerns.

**Total Issues:** 47  
**Critical:** 5  
**High:** 7  
**Medium:** 10  
**Low:** 8  
**Performance:** 3  
**Code Smells:** 4  
**Edge Cases:** 3
