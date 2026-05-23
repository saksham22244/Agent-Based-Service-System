# Design Document: API Security Hardening

## Overview

This document describes the technical design for hardening the security and reliability of the Next.js 16 Agent-Based Service System. The work spans six areas: stateless JWT middleware replacing the broken module-level session in `lib/auth.js` and the always-true `isAdminRequest` in `lib/admin-middleware.js`; Zod input validation on all write endpoints; correct `findOneAndUpdate` result handling for MongoDB driver v7; OTP retry limits replacing destructive account deletion; idempotent super-admin seeding; and dead-code cleanup of `userServiceModel`.

The system serves three actor types — regular users, agents, and a super-admin — each with a distinct API surface area. All six areas are addressed as coordinated changes to shared infrastructure (`lib/`) and the route handlers that depend on it.

---

## Architecture

The hardening changes follow a layered approach:

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js App Router                      │
│          app/api/admin/** | agent/** | user/**           │
└────────────────────┬────────────────────────────────────┘
                     │ every request
                     ▼
┌─────────────────────────────────────────────────────────┐
│              lib/auth.js  (NEW: verifyJWT)               │
│   extracts Bearer token → jwt.verify → decoded payload   │
│   requireRole(role) → 403 if payload.role ≠ expected     │
└────────────────────┬────────────────────────────────────┘
                     │ validated payload
                     ▼
┌─────────────────────────────────────────────────────────┐
│           lib/schemas.js  (NEW: Zod schemas)             │
│   UserSchema | AgentSchema | ServiceSchema | ...         │
│   schema.parse(body) → strips extra fields → 400 on fail │
└────────────────────┬────────────────────────────────────┘
                     │ clean, typed body
                     ▼
┌─────────────────────────────────────────────────────────┐
│              lib/models/*  (FIXED)                       │
│   findOneAndUpdate returns doc directly (driver v7)      │
│   otpDb.incrementAttempts — atomic counter               │
│   initializeSuperAdmin — idempotent, env-var password    │
└─────────────────────────────────────────────────────────┘
```

No Next.js `middleware.ts` file is introduced. All guards are applied inline at the top of each route handler using helper functions imported from `lib/auth.js`. This keeps the approach compatible with the existing project structure and avoids the edge-runtime constraints of Next.js middleware.

---

## Components and Interfaces

### 1. `lib/auth.js` — Stateless JWT Middleware

The existing `lib/auth.js` exports a module-level `currentSession` variable and a `login/logout` API. This is broken in a serverless/edge environment because module state is not shared across requests. The entire file is replaced with stateless helpers.

**New exports:**

```js
// Verifies the Authorization: Bearer <token> header.
// Returns the decoded JWT payload on success.
// Returns a NextResponse (401) on failure — caller must check and return early.
export function verifyJWT(request)

// Wraps verifyJWT and additionally checks payload.role === requiredRole.
// Returns { payload } on success.
// Returns a NextResponse (401 or 403) on failure.
export function requireRole(request, requiredRole)

// Convenience wrappers
export const requireAdmin = (req) => requireRole(req, 'superadmin')
export const requireAgent = (req) => requireRole(req, 'agent')
export const requireUser  = (req) => requireRole(req, 'user')
```

**Usage pattern in a route handler:**

```js
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth; // 401 or 403
  // auth.payload is now available
  ...
}
```

The `auth.login()` helper used by the login routes is retained but refactored to not write to a module-level variable — it simply returns the session object for the caller to use when signing the JWT.

### 2. `lib/admin-middleware.js` — Removal

`isAdminRequest()` (always returns `true`) and `verifyAdmin()` (checks `x-admin-email` header) are both removed. All admin route protection is handled by `requireAdmin` from `lib/auth.js`. The file is either deleted or reduced to a re-export shim if any legacy import exists.

### 3. `lib/schemas.js` — Zod Validation Schemas

A new file centralises all Zod schemas. Each schema uses `.strict()` or `.strip()` (default) to drop unknown fields, preventing field injection.

```js
import { z } from 'zod';

export const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phoneNumber: z.string(),
  address: z.string(),
  password: z.string().optional(),
  role: z.enum(['user']).optional(),
  verified: z.boolean().optional(),
});

export const AgentSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phoneNumber: z.string(),
  address: z.string(),
  paymentDetails: z.string().optional(),
  photoUrl: z.string().optional(),
  password: z.string().optional(),
  approved: z.boolean().optional(),
  totalEarnings: z.number().optional(),
  bio: z.string().optional(),
});

export const ServiceSchema = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string().optional(),
  icon: z.string().optional(),
  formFields: z.array(z.any()).optional(),
  active: z.boolean().optional(),
  approvalStatus: z.string().optional(),
});

export const NoticeSchema = z.object({
  title: z.string(),
  message: z.string(),
  recipientType: z.enum(['user', 'agent', 'all']),
  recipientId: z.string().optional(),
  recipientName: z.string().optional(),
  status: z.string().optional(),
  read: z.boolean().optional(),
});

export const ApplicationSchema = z.object({
  userId: z.string(),
  serviceId: z.string(),
  formData: z.record(z.any()).optional(),
  status: z.string().optional(),
  paymentDetails: z.any().optional(),
});

export const TransactionSchema = z.object({
  amount: z.number(),
  product_id: z.string(),
  userId: z.string(),
  type: z.enum(['service_payment', 'direct_payment']),
  status: z.string().optional(),
});

export const UserServiceAssignSchema = z.object({
  userId: z.string(),
  serviceId: z.string(),
  assignedBy: z.string().optional(),
});
```

All schemas use Zod's default `.strip()` behaviour — unknown keys are silently removed from the parsed output. Routes call `schema.safeParse(body)` and return 400 with `result.error.format()` on failure.

### 4. Model Layer — `findOneAndUpdate` Fix

MongoDB driver v7 changed `findOneAndUpdate` to return the document directly instead of `{ value: doc }`. The existing models use the pattern `result.value || result`, which is fragile. All models are updated to use the return value directly:

**Before (broken pattern):**
```js
const result = await collection.findOneAndUpdate(...);
const doc = result.value || result;  // REMOVE THIS
```

**After (correct for driver v7):**
```js
const doc = await collection.findOneAndUpdate(...);
if (!doc) return null;
return { ...doc, id: doc._id.toString(), _id: undefined };
```

Affected files: `userModel.js`, `agentModel.js`, `serviceModel.js`, `noticeModel.js`, `applicationModel.js`, `transactionModel.js`, `userServiceModel.js`.

Note: `applicationModel.js` already uses the direct pattern correctly. `noticeModel.js` uses `result.value` in `update` and `markAsRead`. `agentModel.js`, `serviceModel.js`, `transactionModel.js`, and `userServiceModel.js` use the `result.value || result` guard. `userModel.js` uses the same guard. All are normalised to the direct pattern.

### 5. `lib/models/otpModel.js` — Retry Counter

The OTP model gains an `attempts` field and an atomic increment function:

```js
// New field in otpDb.create():
attempts: 0,

// New function:
incrementAttempts: async (userId, purpose) => {
  const doc = await otpCollection.findOneAndUpdate(
    { userId, purpose, expiresAt: { $gt: new Date() } },
    { $inc: { attempts: 1 } },
    { returnDocument: 'after' }
  );
  if (!doc) return null;
  return { ...doc, id: doc._id.toString(), _id: undefined };
}
```

### 6. `app/api/auth/verify-otp/route.js` — Retry Logic

The current route deletes the account on the first wrong OTP. The new logic:

1. Call `otpDb.incrementAttempts(userId, 'registration')` to get the updated record.
2. If `updatedOtp.attempts < RETRY_LIMIT (3)`: return 400 with `"Invalid OTP. X attempt(s) remaining."` — do NOT delete the account.
3. If `updatedOtp.attempts >= RETRY_LIMIT`: delete the OTP record, delete the account, return 400 with `"Maximum OTP attempts exceeded. Signup cancelled."`.

### 7. `lib/models/userModel.js` — Idempotent Seeder

```js
export async function initializeSuperAdmin() {
  const db = await getDb();
  const superAdmin = await db.collection('users').findOne({ email: 'admin@example.com' });

  if (superAdmin?.password) return; // Already seeded — skip bcrypt entirely

  const rawPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin@123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10); // Called at most once

  if (!superAdmin) {
    await db.collection('users').insertOne({ /* full document */ });
  } else {
    await db.collection('users').updateOne(
      { _id: superAdmin._id },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );
  }
}
```

### 8. Route Guard Application Map

| Route group | Guard function | Applied to |
|---|---|---|
| `app/api/admin/**` (except `/login`) | `requireAdmin` | All HTTP methods |
| `app/api/agent/**` | `requireAgent` | All HTTP methods |
| `app/api/user/**` | `requireUser` | All HTTP methods |
| `app/api/auth/**` | None | Public (login, OTP) |
| `app/api/agents` (public signup) | None | POST only |

---

## Data Models

### OTP Document (updated)

```js
{
  _id: ObjectId,
  userId: String,        // references users or agents collection
  otp: String,           // bcrypt hash of the 6-digit code
  purpose: String,       // 'registration'
  email: String,
  attempts: Number,      // NEW — initialised to 0, max 3
  createdAt: Date,
  expiresAt: Date,       // createdAt + 10 minutes
}
```

### JWT Payload Shape

```js
{
  userId: String,   // MongoDB _id as string
  email: String,
  role: 'user' | 'agent' | 'superadmin',
  iat: Number,
  exp: Number,      // 1 day from issue
}
```

### Zod-Validated Write Shapes

Each schema defines the exact fields accepted at the API boundary. The MongoDB model layer receives only the stripped output of `schema.parse()`, so no extra fields ever reach the database.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: JWT round-trip preserves payload

*For any* valid payload object `{ userId, email, role }`, signing it with `NEXTAUTH_SECRET` and then calling `verifyJWT` with the resulting Bearer token SHALL return a decoded object containing the same `userId`, `email`, and `role` values.

**Validates: Requirements 1.1**

---

### Property 2: Absent or malformed Authorization header yields 401

*For any* request where the `Authorization` header is absent, empty, does not start with `"Bearer "`, or contains a non-JWT string, `verifyJWT` SHALL return a response with HTTP status 401 and body message `"Authentication required"`.

**Validates: Requirements 1.2**

---

### Property 3: Invalid or expired token yields 401

*For any* JWT that was signed with a secret other than `NEXTAUTH_SECRET`, or whose `exp` claim is in the past, `verifyJWT` SHALL return a response with HTTP status 401 and body message `"Invalid or expired token"`.

**Validates: Requirements 1.3**

---

### Property 4: Role enforcement rejects all non-matching roles

*For any* valid JWT whose `role` field is not equal to `requiredRole`, calling `requireRole(request, requiredRole)` SHALL return a response with HTTP status 403 and the appropriate role-specific message (`"Admin access required"` / `"Agent access required"` / `"User access required"`). Only a token whose `role` exactly equals `requiredRole` SHALL pass through.

**Validates: Requirements 1.4, 1.5, 1.6**

---

### Property 5: Zod schemas strip all extra fields

*For any* input object that contains the required fields of a schema plus one or more additional fields not listed in that schema, parsing through the corresponding Zod schema SHALL produce an output object that contains none of the extra fields, regardless of what those extra fields are named or what values they hold.

**Validates: Requirements 2.1, 2.4, 2.5, 2.6, 2.7**

---

### Property 6: Invalid request body always yields 400

*For any* POST or PUT/PATCH request body that fails Zod schema validation (missing required fields, wrong types, or structurally invalid), the route handler SHALL return HTTP status 400 containing the Zod validation error details, and SHALL NOT proceed to any database operation.

**Validates: Requirements 2.3**

---

### Property 7: Model update round-trip returns correct document shape

*For any* existing document and any valid partial update payload, calling the model's `update()` function SHALL return an object where: (a) the updated fields reflect the supplied payload, (b) `id` is a non-empty string equal to the document's `_id.toString()`, and (c) `_id` is `undefined`. The function SHALL NOT return `result.value` — it SHALL use the document returned directly by `findOneAndUpdate`.

**Validates: Requirements 3.1, 3.2, 3.5**

---

### Property 8: OTP record is created with attempts initialised to zero

*For any* call to `otpDb.create()` with any valid OTP data, the returned OTP record SHALL have an `attempts` field equal to `0`.

**Validates: Requirements 4.1**

---

### Property 9: incrementAttempts atomically increments by exactly one

*For any* existing OTP record with `attempts` value `n` (where `n < 3`), calling `otpDb.incrementAttempts(userId, purpose)` SHALL return an OTP record with `attempts` equal to `n + 1`, and SHALL NOT modify any other field of the record.

**Validates: Requirements 4.2, 4.7**

---

### Property 10: Incorrect OTP below retry limit preserves the account

*For any* unverified user or agent account and any OTP record whose `attempts` counter is less than 3, submitting an incorrect OTP to `verify-otp` SHALL leave the user/agent document in the database unchanged and SHALL return HTTP status 400 with a message containing the number of remaining attempts.

**Validates: Requirements 4.3, 4.6**

---

### Property 11: Super-admin seeder is idempotent when password exists

*For any* invocation of `initializeSuperAdmin()` when the super-admin record already exists with a non-null `password` field, the function SHALL return without calling `bcrypt.hash` and without performing any database write. Calling it any number of times in this state SHALL produce the same database state as calling it once.

**Validates: Requirements 5.1, 5.4**

---

## Error Handling

### JWT Verification Errors

| Condition | HTTP Status | Response body |
|---|---|---|
| No `Authorization` header | 401 | `{ error: "Authentication required" }` |
| Header present but no `Bearer ` prefix | 401 | `{ error: "Authentication required" }` |
| Token signature invalid | 401 | `{ error: "Invalid or expired token" }` |
| Token expired (`exp` in past) | 401 | `{ error: "Invalid or expired token" }` |
| Valid token, wrong role for route | 403 | `{ error: "Admin/Agent/User access required" }` |

`verifyJWT` catches `JsonWebTokenError` and `TokenExpiredError` from the `jsonwebtoken` library and maps them to the appropriate 401 response. Any unexpected error is re-thrown to the route handler's catch block, which returns 500.

### Zod Validation Errors

When `schema.safeParse(body)` returns `success: false`, the route immediately returns:

```json
{ "error": "Validation failed", "details": <result.error.format()> }
```

with HTTP 400. The route does not proceed to any database call.

### `findOneAndUpdate` Null Returns

When `findOneAndUpdate` returns `null` (document not found), the model function returns `null` to the caller. Route handlers that receive `null` from a model update return 404:

```json
{ "error": "Resource not found" }
```

No exception is thrown for a null result — only for genuine driver errors.

### OTP Retry Errors

| Condition | HTTP Status | Response body |
|---|---|---|
| Wrong OTP, attempts 1 remaining | 400 | `{ error: "Invalid OTP. 2 attempt(s) remaining." }` |
| Wrong OTP, attempts 2 remaining | 400 | `{ error: "Invalid OTP. 1 attempt(s) remaining." }` |
| Wrong OTP, attempts exhausted (3) | 400 | `{ error: "Maximum OTP attempts exceeded. Signup cancelled." }` |
| OTP not found or expired | 400 | `{ error: "OTP not found or expired. Please request a new OTP." }` |

### Seeder Errors

`initializeSuperAdmin()` wraps all operations in a try/catch and logs errors to `console.error`. It does not throw — a seeder failure is non-fatal to server startup, consistent with the existing behaviour.

---

## Testing Strategy

### Dependency

Add `zod` as a production dependency and a property-based testing library as a dev dependency. The recommended choice for this JavaScript/TypeScript project is **fast-check** (`npm install --save-dev fast-check`), which integrates well with Jest/Vitest and supports arbitrary generators for strings, objects, and numbers.

### Unit Tests (example-based)

- `lib/auth.js`: happy-path login returning a JWT; admin login returning `superadmin` role in token.
- `lib/schemas.js`: each schema accepts a valid minimal object; each schema rejects a body missing a required field.
- `app/api/auth/verify-otp`: correct OTP verifies account and deletes OTP record; exhausted attempts deletes account.
- `initializeSuperAdmin`: no-op when password exists; inserts when no record; updates when record has no password.
- Model `update()` functions: returns null for non-existent ID without throwing.

### Property-Based Tests (fast-check)

Each property test runs a minimum of **100 iterations**. Each test is tagged with a comment in the format:
`// Feature: api-security-hardening, Property N: <property text>`

**Property 1 — JWT round-trip:**
Generate random `{ userId, email, role }` objects. Sign with test secret. Call `verifyJWT`. Assert decoded payload matches.

**Property 2 — Malformed header → 401:**
Generate random strings that are not valid `Bearer <jwt>` headers (empty, no prefix, random ASCII). Assert 401 with `"Authentication required"`.

**Property 3 — Invalid/expired token → 401:**
Generate valid payloads, sign with a wrong secret or set `exp` to `Date.now() - 1`. Assert 401 with `"Invalid or expired token"`.

**Property 4 — Role enforcement:**
Generate valid JWTs with random role strings. For each of the three `requireRole` guards, assert that only the exact matching role passes and all others return 403.

**Property 5 — Schema field stripping:**
For each schema, generate a valid base object and a random set of extra key-value pairs. Merge them. Parse through the schema. Assert the output contains none of the extra keys.

**Property 6 — Invalid body → 400:**
For each write endpoint, generate objects with missing required fields or wrong types. Call the route handler with a mocked request. Assert 400 is returned before any DB call is made (verify DB mock was not called).

**Property 7 — Model update round-trip:**
For each model, insert a document, generate a random partial update, call `model.update()`. Assert the returned object has `id` as a string, `_id` as `undefined`, and the updated fields match the input.

**Property 8 — OTP created with attempts = 0:**
Generate random OTP creation payloads. Call `otpDb.create()`. Assert `attempts === 0`.

**Property 9 — incrementAttempts increments by 1:**
Generate OTP records with `attempts` in `[0, 1, 2]`. Call `otpDb.incrementAttempts()`. Assert returned `attempts === original + 1`.

**Property 10 — Account survives incorrect OTP below limit:**
For `attempts` in `{0, 1, 2}`, submit a wrong OTP. Assert the user/agent document still exists in the DB and the response is 400 with remaining count.

**Property 11 — Seeder idempotency:**
Spy on `bcrypt.hash`. Insert a super-admin with a non-null password. Call `initializeSuperAdmin()` N times (generate N in [2, 10]). Assert `bcrypt.hash` was never called and the password field is unchanged.

### Integration Tests

- End-to-end: POST to a protected admin route without a token → 401.
- End-to-end: POST to a protected admin route with a `user` role token → 403.
- End-to-end: POST to a protected admin route with a valid `superadmin` token → 200/201.
- OTP flow: full signup → send-otp → wrong OTP × 2 → correct OTP → account verified.
- OTP flow: full signup → send-otp → wrong OTP × 3 → account deleted.
