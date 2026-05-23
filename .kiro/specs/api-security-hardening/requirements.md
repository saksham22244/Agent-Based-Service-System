# Requirements Document

## Introduction

This feature hardens the security and reliability of the Next.js 16 Agent-Based Service System across five areas: JWT-based API route protection, Zod input validation to prevent field injection, correct `findOneAndUpdate` result handling for MongoDB driver v5+, OTP retry limits to replace destructive account deletion on wrong attempts, and general reliability fixes (idempotent super-admin seeding and dead-code cleanup).

The system serves three actor types — regular users, agents, and a super-admin — each with distinct API surface areas that must be protected and validated consistently.

---

## Glossary

- **API_Router**: The Next.js 16 App Router layer that handles all `app/api/**` route handlers.
- **Auth_Middleware**: The module (`lib/auth.js` and `lib/admin-middleware.js`) responsible for verifying identity on incoming requests.
- **JWT**: A JSON Web Token signed with `NEXTAUTH_SECRET`, issued on login and verified on every protected request.
- **Protected_Route**: Any API route that requires a valid JWT before processing the request.
- **Admin_Route**: Any API route under `app/api/admin/**` that requires a `superadmin` role claim in the JWT.
- **Agent_Route**: Any API route under `app/api/agent/**` that requires an `agent` role claim in the JWT.
- **User_Route**: Any API route under `app/api/user/**` that requires a `user` role claim in the JWT.
- **Input_Validator**: The Zod-based validation layer applied to request bodies before any database write.
- **Schema**: A Zod schema object that defines the exact set of allowed fields and their types for a given entity.
- **Model**: A MongoDB data-access module in `lib/models/` (userModel, agentModel, serviceModel, noticeModel, applicationModel, transactionModel).
- **OTP**: A 6-digit one-time password sent by email for registration verification.
- **OTP_Record**: A document in the `otps` collection containing a hashed OTP, a `userId`, a `purpose`, and an `attempts` counter.
- **Retry_Limit**: The maximum number of incorrect OTP submissions allowed before the signup is cancelled (value: 3).
- **Super_Admin**: The single privileged user with `role: 'superadmin'` seeded at `admin@example.com`.
- **Seeder**: The `initializeSuperAdmin()` function in `lib/models/userModel.js` that ensures the super-admin record exists.
- **findOneAndUpdate**: The MongoDB driver v5+ method that returns the updated document directly (not wrapped in `{ value: doc }`).
- **userServiceModel**: The `lib/models/userServiceModel.js` module that manages user-to-service assignments.

---

## Requirements

### Requirement 1: JWT Middleware for API Route Protection

**User Story:** As a system operator, I want every protected API route to verify a JWT before processing the request, so that unauthenticated or unauthorised callers cannot access or mutate data.

#### Acceptance Criteria

1. THE Auth_Middleware SHALL export a `verifyJWT(request)` function that extracts the `Authorization: Bearer <token>` header, verifies the token using `NEXTAUTH_SECRET`, and returns the decoded payload on success.
2. WHEN a request reaches a Protected_Route and the `Authorization` header is absent or malformed, THE Auth_Middleware SHALL return a `401 Unauthorized` response with the message `"Authentication required"`.
3. WHEN a request reaches a Protected_Route and the JWT signature is invalid or the token is expired, THE Auth_Middleware SHALL return a `401 Unauthorized` response with the message `"Invalid or expired token"`.
4. WHEN a request reaches an Admin_Route, THE Auth_Middleware SHALL verify that the decoded JWT payload contains `role: 'superadmin'`; IF it does not, THEN THE Auth_Middleware SHALL return a `403 Forbidden` response with the message `"Admin access required"`.
5. WHEN a request reaches an Agent_Route, THE Auth_Middleware SHALL verify that the decoded JWT payload contains `role: 'agent'`; IF it does not, THEN THE Auth_Middleware SHALL return a `403 Forbidden` response with the message `"Agent access required"`.
6. WHEN a request reaches a User_Route, THE Auth_Middleware SHALL verify that the decoded JWT payload contains `role: 'user'`; IF it does not, THEN THE Auth_Middleware SHALL return a `403 Forbidden` response with the message `"User access required"`.
7. THE Auth_Middleware SHALL NOT use module-level variables to store session state.
8. THE `isAdminRequest()` function in `lib/admin-middleware.js` SHALL be replaced by the `verifyJWT`-based middleware and SHALL NOT return `true` unconditionally.

---

### Requirement 2: Zod Input Validation for API Write Endpoints

**User Story:** As a system operator, I want all API write endpoints to validate and strip request bodies against a strict schema before any database operation, so that malicious clients cannot inject arbitrary fields such as `role: 'superadmin'` into MongoDB documents.

#### Acceptance Criteria

1. THE Input_Validator SHALL define a Zod Schema for each entity: `UserSchema`, `AgentSchema`, `ServiceSchema`, `NoticeSchema`, `ApplicationSchema`, and `TransactionSchema`.
2. WHEN a POST or PUT/PATCH request body is received on any write endpoint, THE Input_Validator SHALL parse the body against the corresponding Schema using `schema.parse()` or `schema.safeParse()`.
3. IF the request body fails schema validation, THEN THE API_Router SHALL always return a `400 Bad Request` response containing the Zod validation error details, regardless of whether the underlying operation could otherwise succeed.
4. THE `UserSchema` SHALL allow only the fields: `name`, `email`, `phoneNumber`, `address`, `password`, `role` (enum: `'user'`), and `verified`; any additional fields SHALL be stripped.
5. THE `AgentSchema` SHALL allow only the fields: `name`, `email`, `phoneNumber`, `address`, `paymentDetails`, `photoUrl`, `password`, `approved`, `totalEarnings`, and `bio`; any additional fields SHALL be stripped.
6. THE `ServiceSchema` SHALL allow only the fields: `name`, `price`, `description`, `icon`, `formFields`, `active`, and `approvalStatus`; any additional fields SHALL be stripped.
7. THE `NoticeSchema` SHALL allow only the fields: `title`, `message`, `recipientType`, `recipientId`, `recipientName`, `status`, and `read`; any additional fields SHALL be stripped.
8. WHEN the `send-otp` route creates a new user during signup, THE Input_Validator SHALL validate the body against `UserSchema` before calling `userDb.create()`.
9. THE Input_Validator SHALL be implemented using the `zod` npm package, which SHALL be added as a production dependency.

---

### Requirement 3: Correct `findOneAndUpdate` Result Handling

**User Story:** As a developer, I want all model update functions to correctly extract the returned document from `findOneAndUpdate`, so that update operations do not silently return `null` when running against MongoDB driver v5+.

#### Acceptance Criteria

1. THE Model for each of `userModel`, `agentModel`, `serviceModel`, `noticeModel`, `applicationModel`, `transactionModel`, and `userServiceModel` SHALL handle the return value of `findOneAndUpdate` as a direct document reference, not as `result.value`.
2. WHEN `findOneAndUpdate` returns a non-null object, THE Model SHALL use that object directly as the updated document.
3. IF `findOneAndUpdate` returns `null`, THEN THE Model SHALL return `null` to the caller without throwing.
4. THE `result.value || result` pattern SHALL be removed from all Model update functions and replaced with direct use of the returned value.
5. WHEN an update succeeds, THE Model SHALL return the updated document with `_id` converted to a string `id` field and `_id` set to `undefined`, consistent with the existing read methods.

---

### Requirement 4: OTP Retry Limits

**User Story:** As a user or agent completing email verification, I want to have multiple attempts to enter the correct OTP before my signup is cancelled, so that a single typo does not permanently delete my account.

#### Acceptance Criteria

1. THE OTP_Record SHALL include an `attempts` field initialised to `0` when the OTP is created.
2. WHEN a user submits an incorrect OTP, THE API_Router SHALL increment the `attempts` counter on the OTP_Record by 1.
3. WHEN a user submits an incorrect OTP and the `attempts` counter on the OTP_Record is less than the Retry_Limit (3), THE API_Router SHALL increment the counter, return a `400 Bad Request` response with the message `"Invalid OTP. X attempt(s) remaining."` where X is the remaining attempts, and SHALL NOT delete the user or agent account.
4. WHEN the `attempts` counter on an OTP_Record reaches the Retry_Limit (3), THE API_Router SHALL delete the OTP_Record, delete the associated unverified user or agent account, and return a `400 Bad Request` response with the message `"Maximum OTP attempts exceeded. Signup cancelled."`.
5. WHEN a user submits a correct OTP before reaching the Retry_Limit, THE API_Router SHALL verify the account, delete the OTP_Record, and return a success response as currently defined.
6. THE `verify-otp` route SHALL NOT delete the user or agent account on the first incorrect OTP attempt.
7. THE `otpDb` model SHALL expose an `incrementAttempts(userId, purpose)` function that atomically increments the `attempts` field and returns the updated OTP_Record.

---

### Requirement 5: Super-Admin Seeding Idempotency

**User Story:** As a system operator, I want the super-admin initialisation to skip bcrypt hashing when the admin account already has a password, so that server startup is not wasteful and the password is not unnecessarily re-hashed on every cold start.

#### Acceptance Criteria

1. WHEN `initializeSuperAdmin()` is called and the super-admin record already exists with a non-null `password` field, THE Seeder SHALL return without performing any database write or bcrypt operation.
2. WHEN `initializeSuperAdmin()` is called and no super-admin record exists, THE Seeder SHALL hash the configured admin password once using `bcrypt.hash` and insert the super-admin document.
3. WHEN `initializeSuperAdmin()` is called and the super-admin record exists but has a `null` or missing `password` field, THE Seeder SHALL hash the configured admin password once and update only the `password` and `updatedAt` fields.
4. THE Seeder SHALL NOT call `bcrypt.hash` more than once per invocation of `initializeSuperAdmin()`.
5. THE configured admin password SHALL be read from an environment variable `ADMIN_DEFAULT_PASSWORD`; IF the variable is not set, THE Seeder SHALL fall back to the current hardcoded value.

---

### Requirement 6: Dead Code Cleanup — `userServiceModel`

**User Story:** As a developer, I want the `userServiceModel.js` to be either actively used or explicitly removed, so that the codebase does not contain misleading dead code.

#### Acceptance Criteria

1. THE system SHALL audit all import sites of `userServiceDb` across the codebase to confirm whether the model is actively used.
2. WHERE `userServiceDb` is imported and called in active API routes (`app/api/admin/users/[id]/services/route.js`, `app/api/admin/user-services/bulk/route.js`, `app/api/admin/statistics/route.js`, `app/api/admin/services/[id]/users/route.js`), THE system SHALL retain `userServiceModel.js` and apply the `findOneAndUpdate` fix from Requirement 3 to its `updateStatus` function.
3. THE `userServiceModel.js` SHALL also have Zod validation applied to its `assign` and `bulkAssign` write paths consistent with Requirement 2.
4. THE `lib/db.js` export of `userServiceDb` SHALL remain if the model is retained, ensuring no import breakage across the codebase.
