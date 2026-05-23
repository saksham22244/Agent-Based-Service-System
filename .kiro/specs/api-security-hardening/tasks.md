# Implementation Plan: API Security Hardening

## Overview

Harden the Next.js 16 Agent-Based Service System across six coordinated areas: replace the broken module-level session in `lib/auth.js` with stateless JWT middleware; add Zod input validation on all write endpoints; fix `findOneAndUpdate` result handling for MongoDB driver v7; add OTP retry limits; make the super-admin seeder idempotent; and remove the always-true `isAdminRequest` dead code. Tasks are ordered by dependency — shared infrastructure first, then route-level consumers.

---

## Tasks

- [ ] 1. Install `zod` production dependency
  - Run `npm install zod` to add Zod as a production dependency in `package.json`
  - Verify `zod` appears under `"dependencies"` in `package.json`
  - _Requirements: 2.9_

- [ ] 2. Create `lib/schemas.js` with all Zod validation schemas
  - [ ] 2.1 Implement `UserSchema`, `AgentSchema`, `ServiceSchema`, `NoticeSchema`, `ApplicationSchema`, `TransactionSchema`, and `UserServiceAssignSchema`
    - Create `lib/schemas.js` with all seven schemas as named exports
    - `UserSchema`: fields `name`, `email` (`.email()`), `phoneNumber`, `address`, `password` (optional), `role` (enum `'user'`, optional), `verified` (boolean, optional)
    - `AgentSchema`: fields `name`, `email`, `phoneNumber`, `address`, `paymentDetails`, `photoUrl`, `password`, `approved`, `totalEarnings` (number), `bio` — all optional except `name`, `email`, `phoneNumber`, `address`
    - `ServiceSchema`: fields `name`, `price` (number), `description`, `icon`, `formFields` (array), `active` (boolean), `approvalStatus` — `name` and `price` required
    - `NoticeSchema`: fields `title`, `message`, `recipientType` (enum `'user'|'agent'|'all'`), `recipientId`, `recipientName`, `status`, `read` (boolean) — `title`, `message`, `recipientType` required
    - `ApplicationSchema`: fields `userId`, `serviceId`, `formData` (record), `status`, `paymentDetails` — `userId` and `serviceId` required
    - `TransactionSchema`: fields `amount` (number), `product_id`, `userId`, `type` (enum `'service_payment'|'direct_payment'`), `status` — `amount`, `product_id`, `userId`, `type` required
    - `UserServiceAssignSchema`: fields `userId`, `serviceId`, `assignedBy` (optional) — `userId` and `serviceId` required
    - All schemas use Zod default strip behaviour (unknown keys silently removed)
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 2.2 Write property test for Zod schema field stripping (Property 5)
    - **Property 5: Zod schemas strip all extra fields**
    - For each of the seven schemas, generate a valid base object plus a random set of extra key-value pairs; merge them; parse through the schema; assert the output contains none of the extra keys
    - Use `fast-check` arbitraries: `fc.record` for base objects, `fc.dictionary(fc.string(), fc.anything())` for extra fields
    - Tag: `// Feature: api-security-hardening, Property 5: Zod schemas strip all extra fields`
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 2.3 Write property test for invalid body always yielding 400 (Property 6)
    - **Property 6: Invalid request body always yields 400**
    - For each write endpoint, generate objects with missing required fields or wrong types; call the route handler with a mocked `Request`; assert HTTP 400 is returned and no DB function was called (mock `lib/db` and verify it was not invoked)
    - Tag: `// Feature: api-security-hardening, Property 6: Invalid request body always yields 400`
    - _Requirements: 2.3_

- [ ] 3. Replace `lib/auth.js` with stateless JWT middleware
  - [ ] 3.1 Rewrite `lib/auth.js` — add `verifyJWT`, `requireRole`, `requireAdmin`, `requireAgent`, `requireUser`
    - Remove the module-level `currentSession` variable and `auth.getSession()` / `auth.logout()` / `auth.isSuperAdmin()` exports
    - Add `export function verifyJWT(request)`: extract `Authorization: Bearer <token>` header; call `jwt.verify(token, process.env.NEXTAUTH_SECRET)`; return decoded payload on success; return `NextResponse.json({ error: 'Authentication required' }, { status: 401 })` when header is absent or malformed; return `NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })` for `JsonWebTokenError` / `TokenExpiredError`
    - Add `export function requireRole(request, requiredRole)`: call `verifyJWT`; if result is a `NextResponse` return it; check `payload.role === requiredRole`; return `NextResponse.json({ error: '<Role> access required' }, { status: 403 })` on mismatch; return `{ payload }` on success
    - Add `export const requireAdmin = (req) => requireRole(req, 'superadmin')`
    - Add `export const requireAgent = (req) => requireRole(req, 'agent')`
    - Add `export const requireUser  = (req) => requireRole(req, 'user')`
    - Retain `auth.login(email, password)` as a stateless helper that returns the session object without writing to any module-level variable
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 3.2 Write property test for JWT round-trip (Property 1)
    - **Property 1: JWT round-trip preserves payload**
    - Generate random `{ userId, email, role }` objects; sign with test secret; construct a mock `Request` with `Authorization: Bearer <token>`; call `verifyJWT`; assert decoded payload contains the same `userId`, `email`, `role`
    - Use `fc.record({ userId: fc.string(), email: fc.emailAddress(), role: fc.constantFrom('user', 'agent', 'superadmin') })`
    - Tag: `// Feature: api-security-hardening, Property 1: JWT round-trip preserves payload`
    - _Requirements: 1.1_

  - [ ]* 3.3 Write property test for absent/malformed Authorization header yielding 401 (Property 2)
    - **Property 2: Absent or malformed Authorization header yields 401**
    - Generate random strings that are not valid `Bearer <jwt>` headers (empty string, no `Bearer ` prefix, random ASCII, `null`); construct mock requests; call `verifyJWT`; assert HTTP 401 with body `{ error: 'Authentication required' }`
    - Tag: `// Feature: api-security-hardening, Property 2: Absent or malformed Authorization header yields 401`
    - _Requirements: 1.2_

  - [ ]* 3.4 Write property test for invalid/expired token yielding 401 (Property 3)
    - **Property 3: Invalid or expired token yields 401**
    - Generate valid payloads; sign with a wrong secret OR set `exp` to `Math.floor(Date.now() / 1000) - 1`; call `verifyJWT`; assert HTTP 401 with body `{ error: 'Invalid or expired token' }`
    - Tag: `// Feature: api-security-hardening, Property 3: Invalid or expired token yields 401`
    - _Requirements: 1.3_

  - [ ]* 3.5 Write property test for role enforcement (Property 4)
    - **Property 4: Role enforcement rejects all non-matching roles**
    - Generate valid JWTs with random role strings from `['user', 'agent', 'superadmin', 'hacker', '']`; for each of the three `requireRole` guards, assert only the exact matching role returns `{ payload }` and all others return HTTP 403 with the appropriate message
    - Tag: `// Feature: api-security-hardening, Property 4: Role enforcement rejects all non-matching roles`
    - _Requirements: 1.4, 1.5, 1.6_

- [ ] 4. Fix `findOneAndUpdate` result handling in all model files
  - [ ] 4.1 Fix `userModel.js` — `userDb.update()`
    - Replace the `result.value || result` guard in `userDb.update()` with direct use of the returned value: `const doc = await usersCollection.findOneAndUpdate(...); if (!doc) return null; return { ...doc, id: doc._id.toString(), _id: undefined };`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 4.2 Fix `agentModel.js` — `agentDb.update()`
    - Replace the `result.value || result` guard in `agentDb.update()` with the direct pattern
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 4.3 Fix `serviceModel.js` — `serviceDb.update()`
    - Replace the `result.value || result` guard in `serviceDb.update()` with the direct pattern
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 4.4 Fix `noticeModel.js` — `noticeDb.update()` and `noticeDb.markAsRead()`
    - Replace `result.value` references in both `update()` and `markAsRead()` with the direct pattern
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 4.5 Fix `transactionModel.js` — `transactionDb.updateStatus()`
    - Replace the `result.value || result` guard in `transactionDb.updateStatus()` with the direct pattern
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 4.6 Fix `userServiceModel.js` — `userServiceDb.updateStatus()`
    - Replace the `result.value || result` guard in `userServiceDb.updateStatus()` with the direct pattern
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.7 Write property test for model update round-trip (Property 7)
    - **Property 7: Model update round-trip returns correct document shape**
    - For each of the six fixed models, insert a document, generate a random partial update payload, call `model.update()`, assert: (a) updated fields match the payload, (b) `id` is a non-empty string equal to `_id.toString()`, (c) `_id` is `undefined`
    - Use an in-memory MongoDB instance (e.g., `mongodb-memory-server`) or mock `getDb`
    - Tag: `// Feature: api-security-hardening, Property 7: Model update round-trip returns correct document shape`
    - _Requirements: 3.1, 3.2, 3.5_

- [ ] 5. Add `attempts` field and `incrementAttempts` to `otpModel.js`
  - [ ] 5.1 Add `attempts: 0` to `otpDb.create()` and add `otpDb.incrementAttempts(userId, purpose)`
    - In `otpDb.create()`, add `attempts: 0` to the `newOtp` object before `insertOne`
    - Add new function `incrementAttempts: async (userId, purpose)` that calls `otpCollection.findOneAndUpdate({ userId, purpose, expiresAt: { $gt: new Date() } }, { $inc: { attempts: 1 } }, { returnDocument: 'after' })` and returns the document directly (no `result.value` pattern)
    - _Requirements: 4.1, 4.7_

  - [ ]* 5.2 Write property test for OTP created with attempts = 0 (Property 8)
    - **Property 8: OTP record is created with attempts initialised to zero**
    - Generate random OTP creation payloads (varying `userId`, `purpose`, `email`, `otp`); call `otpDb.create()`; assert `result.attempts === 0`
    - Tag: `// Feature: api-security-hardening, Property 8: OTP record is created with attempts initialised to zero`
    - _Requirements: 4.1_

  - [ ]* 5.3 Write property test for `incrementAttempts` atomically incrementing by one (Property 9)
    - **Property 9: incrementAttempts atomically increments by exactly one**
    - Generate OTP records with `attempts` in `[0, 1, 2]`; call `otpDb.incrementAttempts(userId, purpose)`; assert returned `attempts === original + 1` and no other field changed
    - Tag: `// Feature: api-security-hardening, Property 9: incrementAttempts atomically increments by exactly one`
    - _Requirements: 4.2, 4.7_

- [ ] 6. Update `app/api/auth/verify-otp/route.js` with retry logic
  - [ ] 6.1 Replace destructive first-attempt deletion with retry counter logic
    - On incorrect OTP: call `otpDb.incrementAttempts(userId, 'registration')` to get the updated record
    - If `updatedOtp` is `null` (expired or not found): return 400 `{ error: 'OTP not found or expired. Please request a new OTP.' }`
    - If `updatedOtp.attempts < 3`: return 400 `{ error: 'Invalid OTP. X attempt(s) remaining.' }` where `X = 3 - updatedOtp.attempts`; do NOT delete the user/agent account
    - If `updatedOtp.attempts >= 3`: delete the OTP record, delete the user/agent account, return 400 `{ error: 'Maximum OTP attempts exceeded. Signup cancelled.' }`
    - Remove the existing block that deletes the account on the first wrong OTP
    - _Requirements: 4.2, 4.3, 4.4, 4.6_

  - [ ]* 6.2 Write property test for incorrect OTP below retry limit preserving the account (Property 10)
    - **Property 10: Incorrect OTP below retry limit preserves the account**
    - For `attempts` in `{0, 1, 2}`, submit a wrong OTP to the route handler with a mocked `otpDb`; assert the user/agent document still exists (mock `userDb.delete` / `agentDb.delete` and verify they were NOT called); assert response is HTTP 400 with remaining count in the message
    - Tag: `// Feature: api-security-hardening, Property 10: Incorrect OTP below retry limit preserves the account`
    - _Requirements: 4.3, 4.6_

- [ ] 7. Fix `initializeSuperAdmin` seeder idempotency in `userModel.js`
  - [ ] 7.1 Rewrite `initializeSuperAdmin()` to skip `bcrypt.hash` when password already exists
    - Move `bcrypt.hash` call inside the `if (!superAdmin)` and `else` branches so it is only called when needed
    - Add early-return guard: `if (superAdmin?.password) return;` before any bcrypt or DB write
    - Read admin password from `process.env.ADMIN_DEFAULT_PASSWORD` with fallback to `'admin@123'`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.2 Write property test for seeder idempotency (Property 11)
    - **Property 11: Super-admin seeder is idempotent when password exists**
    - Spy on `bcrypt.hash`; insert a super-admin document with a non-null `password`; generate `N` in `[2, 10]` using `fc.integer({ min: 2, max: 10 })`; call `initializeSuperAdmin()` N times; assert `bcrypt.hash` was never called and the password field is unchanged after all calls
    - Tag: `// Feature: api-security-hardening, Property 11: Super-admin seeder is idempotent when password exists`
    - _Requirements: 5.1, 5.4_

- [ ] 8. Checkpoint — core infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Apply `requireAdmin` guard to all `app/api/admin/**` routes (except `/login`)
  - [ ] 9.1 Guard `app/api/admin/agents/route.js` and `app/api/admin/agents/[id]/route.js`
    - Import `requireAdmin` from `@/lib/auth`; add `const auth = requireAdmin(request); if (auth instanceof NextResponse) return auth;` at the top of every exported handler (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
    - _Requirements: 1.4, 1.8_

  - [ ] 9.2 Guard `app/api/admin/users/route.js` and `app/api/admin/users/[id]/route.js`
    - Apply `requireAdmin` guard to all handlers in both files
    - _Requirements: 1.4, 1.8_

  - [ ] 9.3 Guard `app/api/admin/users/[id]/services/route.js`
    - Apply `requireAdmin` guard to all handlers
    - _Requirements: 1.4, 1.8_

  - [ ] 9.4 Guard `app/api/admin/services/route.js` and `app/api/admin/services/[id]/route.js`
    - Apply `requireAdmin` guard to all handlers in both files
    - _Requirements: 1.4, 1.8_

  - [ ] 9.5 Guard `app/api/admin/services/[id]/users/route.js`
    - Apply `requireAdmin` guard to all handlers
    - _Requirements: 1.4, 1.8_

  - [ ] 9.6 Guard `app/api/admin/applications/route.js`
    - Apply `requireAdmin` guard to all handlers
    - _Requirements: 1.4, 1.8_

  - [ ] 9.7 Guard `app/api/admin/notices/route.js`, `app/api/admin/notices/[id]/route.js`, `app/api/admin/notices/send/route.js`, and `app/api/admin/notices/bulk/route.js`
    - Apply `requireAdmin` guard to all handlers in all four files
    - _Requirements: 1.4, 1.8_

  - [ ] 9.8 Guard `app/api/admin/agent-payments/route.js` and `app/api/admin/agent-direct-payment/route.js`
    - Apply `requireAdmin` guard to all handlers in both files
    - _Requirements: 1.4, 1.8_

  - [ ] 9.9 Guard `app/api/admin/statistics/route.js`, `app/api/admin/search/route.js`, `app/api/admin/bulk/route.js`, and `app/api/admin/user-services/bulk/route.js`
    - Apply `requireAdmin` guard to all handlers in all four files
    - _Requirements: 1.4, 1.8_

- [ ] 10. Apply `requireAgent` guard to all `app/api/agent/**` routes
  - [ ] 10.1 Guard `app/api/agent/applications/route.js`
    - Import `requireAgent` from `@/lib/auth`; apply guard to all handlers
    - _Requirements: 1.5_

  - [ ] 10.2 Guard `app/api/agent/[id]/payments/route.js`
    - Apply `requireAgent` guard to all handlers
    - _Requirements: 1.5_

  - [ ] 10.3 Guard all route files under `app/api/agent/notices/` (including `[id]` sub-routes if present)
    - Apply `requireAgent` guard to all handlers
    - _Requirements: 1.5_

- [ ] 11. Apply `requireUser` guard to all `app/api/user/**` routes
  - [ ] 11.1 Guard `app/api/user/applications/route.js`
    - Import `requireUser` from `@/lib/auth`; apply guard to all handlers
    - _Requirements: 1.6_

  - [ ] 11.2 Guard all route files under `app/api/user/profile/` (if route files exist)
    - Apply `requireUser` guard to all handlers
    - _Requirements: 1.6_

- [ ] 12. Apply Zod validation to all write endpoints
  - [ ] 12.1 Add `UserSchema` validation to `app/api/auth/send-otp/route.js` user-creation path
    - Import `UserSchema` from `@/lib/schemas`; before calling `userDb.create()`, call `UserSchema.safeParse(body)`; return 400 with `result.error.format()` on failure; pass `result.data` to `userDb.create()` instead of raw `body`
    - _Requirements: 2.2, 2.3, 2.8_

  - [ ] 12.2 Add `AgentSchema` validation to `app/api/agents/route.js` POST handler
    - Import `AgentSchema`; validate the parsed form fields before calling `agentDb.create()`; return 400 on failure; pass stripped data to the model
    - _Requirements: 2.2, 2.3, 2.5_

  - [ ] 12.3 Add `ServiceSchema` validation to `app/api/admin/services/route.js` POST and `app/api/admin/services/[id]/route.js` PUT/PATCH handlers
    - Import `ServiceSchema`; validate request body; return 400 on failure; pass `result.data` to the model
    - _Requirements: 2.2, 2.3, 2.6_

  - [ ] 12.4 Add `NoticeSchema` validation to `app/api/admin/notices/route.js` POST and `app/api/admin/notices/send/route.js` POST handlers
    - Import `NoticeSchema`; validate request body; return 400 on failure; pass `result.data` to the model
    - _Requirements: 2.2, 2.3, 2.7_

  - [ ] 12.5 Add `ApplicationSchema` validation to `app/api/user/applications/route.js` POST handler
    - Import `ApplicationSchema`; validate request body; return 400 on failure; pass `result.data` to the model
    - _Requirements: 2.2, 2.3_

  - [ ] 12.6 Add `TransactionSchema` validation to `app/api/esewa/initiate-payment/route.js` POST handler
    - Import `TransactionSchema`; validate request body; return 400 on failure; pass `result.data` to the model
    - _Requirements: 2.2, 2.3_

  - [ ] 12.7 Add `UserServiceAssignSchema` validation to `app/api/admin/users/[id]/services/route.js` POST and `app/api/admin/user-services/bulk/route.js` POST handlers
    - Import `UserServiceAssignSchema`; validate request body; return 400 on failure; pass `result.data` to the model
    - _Requirements: 2.2, 2.3, 6.3_

- [ ] 13. Remove / replace `lib/admin-middleware.js`
  - [ ] 13.1 Audit all imports of `lib/admin-middleware.js` and replace with `requireAdmin` from `lib/auth.js`
    - Search the codebase for `import.*admin-middleware` and `require.*admin-middleware`; for each import site, replace `isAdminRequest(request)` calls with the `requireAdmin` guard pattern; replace `verifyAdmin(request)` calls with `requireAdmin(request)` and adapt the response handling
    - After all import sites are updated, delete `lib/admin-middleware.js`
    - _Requirements: 1.8_

- [ ] 14. Checkpoint — all guards and validation applied
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Install `fast-check` dev dependency and set up test infrastructure
  - Run `npm install --save-dev fast-check` to add the property-based testing library
  - Create `__tests__/` directory at the project root (or `tests/` if preferred)
  - Verify a test runner is available (check for Jest or Vitest config; if absent, install `jest` and `@jest/globals` as dev dependencies and add a minimal `jest.config.js`)
  - _Requirements: design testing strategy_

- [ ] 16. Write all property-based tests
  - [ ]* 16.1 Consolidate and run all property tests from tasks 2.2, 2.3, 3.2, 3.3, 3.4, 3.5, 4.7, 5.2, 5.3, 6.2, 7.2 into a single test suite file `__tests__/security-properties.test.js`
    - Each test must run a minimum of 100 iterations (`fc.assert(fc.property(...), { numRuns: 100 })`)
    - Each test must be tagged with the comment `// Feature: api-security-hardening, Property N: <property text>`
    - Mock `lib/db` and `lib/models/dbHelper` using Jest module mocking to avoid real DB connections in unit-level property tests
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.3, 3.1, 3.5, 4.1, 4.2, 4.3, 4.6, 5.1, 5.4_

- [ ] 17. Final checkpoint — full test suite passes
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- The `requireAdmin` / `requireAgent` / `requireUser` pattern is identical — import the guard, call it, check `instanceof NextResponse`, return early if so
- `applicationModel.js` already uses the direct `findOneAndUpdate` pattern correctly; no fix needed there
- `lib/admin-middleware.js` must be deleted only after all import sites are updated (task 13.1) to avoid broken imports
- Property tests in tasks 2.2, 2.3, 3.2–3.5, 4.7, 5.2, 5.3, 6.2, 7.2 are written inline as sub-tasks close to their implementation; task 16.1 consolidates them into a single runnable file
- The `app/api/agents` route (public agent signup) and all `app/api/auth/**` routes remain unguarded — they are intentionally public

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "5.1", "7.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "3.4", "3.5", "4.7", "5.2", "5.3", "6.1", "7.2"] },
    { "id": 3, "tasks": ["6.2", "9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8", "9.9", "10.1", "10.2", "10.3", "11.1", "11.2"] },
    { "id": 4, "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "12.7"] },
    { "id": 5, "tasks": ["13.1"] },
    { "id": 6, "tasks": ["15"] },
    { "id": 7, "tasks": ["16.1"] }
  ]
}
```
