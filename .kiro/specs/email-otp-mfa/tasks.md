# Implementation Plan: Email OTP MFA

## Overview

Implement Email OTP-based Multi-Factor Authentication for the SaaSient user dashboard login flow. The implementation proceeds in four phases: (1) the core OTP utility library, (2) the two server-side API routes, (3) the `/auth/mfa` verification page, and (4) the login page modifications and session guards. Each phase builds directly on the previous one, ending with all pieces wired together.

The `mfa_otp_codes` table has already been created in Supabase — no migration tasks are needed.

## Tasks

- [x] 1. Create `lib/otp.ts` — OTP utility library
  - [x] 1.1 Implement `generateOtp()` and `isValidOtpFormat()`
    - Create `lib/otp.ts` with `generateOtp()` using `crypto.randomInt(0, 1_000_000)` zero-padded to 6 digits
    - Implement `isValidOtpFormat(code: string): boolean` — returns `true` only for strings matching `/^\d{6}$/`
    - Export the `MfaOtpRecord` TypeScript interface matching the `mfa_otp_codes` table schema
    - _Requirements: 1.5, 1.6, 7.4_

  - [ ]* 1.2 Write property test for `generateOtp()` — Property 2
    - **Property 2: OTP format invariant** — for any call to `generateOtp()`, the result is exactly 6 decimal digit characters representing a value in `[0, 999999]`
    - Use `fc.integer({ min: 0, max: 999999 })` to seed the generator and verify output format
    - **Validates: Requirements 1.6**

  - [x] 1.3 Implement `ServerRateLimiter` class
    - Add `ServerRateLimiter` class to `lib/otp.ts` with `constructor(maxAttempts: number, windowMs: number)`, `canAttempt(userId: string): boolean`, and `reset(userId: string): void`
    - Use an in-memory `Map<string, number[]>` keyed by `user_id` storing attempt timestamps; filter out entries older than `windowMs` on each call
    - Export two module-level singleton instances: `verifyRateLimiter` (max 5 / 10 min) and `resendRateLimiter` (max 3 / 10 min)
    - _Requirements: 4.1, 5.3_

  - [ ]* 1.4 Write property tests for `ServerRateLimiter` — Properties 10, 11, 12
    - **Property 10: Verification rate limit enforced** — after exactly 5 failed attempts within the window, the next attempt returns `false`
      - Use `fc.integer({ min: 1, max: 20 })` for attempt counts
      - **Validates: Requirements 4.1, 4.2**
    - **Property 11: Resend rate limit enforced** — after exactly 3 resend requests within the window, the next request returns `false`
      - Use `fc.integer({ min: 1, max: 10 })` for resend counts
      - **Validates: Requirements 5.3, 5.4**
    - **Property 12: Successful verification resets the rate-limit counter** — after N failed attempts (N < 5) followed by `reset()`, subsequent calls to `canAttempt()` return `true`
      - Use `fc.integer({ min: 1, max: 4 })` for prior failed attempt counts
      - **Validates: Requirements 4.3**

  - [ ]* 1.5 Write unit tests for `generateOtp()` and `isValidOtpFormat()`
    - `generateOtp()` returns a string of exactly 6 digits
    - `isValidOtpFormat()` returns `true` for `"000000"`, `"123456"`, `"999999"`
    - `isValidOtpFormat()` returns `false` for `""`, `"12345"`, `"1234567"`, `"12345a"`, `"123 45"`
    - _Requirements: 1.6, 7.4_

- [x] 2. Implement `POST /api/auth/mfa/send` route
  - [x] 2.1 Create `app/api/auth/mfa/send/route.ts`
    - Extract the Bearer token from the `Authorization` header; call `supabaseAdmin.auth.getUser(token)` to validate — return 401 if invalid or missing
    - Check `resendRateLimiter.canAttempt(userId)` — return 429 with `{ "error": "Too many resend requests. Please wait before trying again." }` if exceeded
    - Invalidate existing unexpired, unused OTPs: `UPDATE mfa_otp_codes SET used = true WHERE user_id = $1 AND used = false AND expires_at > now()`
    - Generate OTP via `generateOtp()`, compute `expires_at` as `new Date(Date.now() + 600_000).toISOString()`, insert into `mfa_otp_codes` using `supabaseAdmin`
    - Send OTP email via `supabaseAdmin.auth.admin.generateLink` or Supabase's email service with the OTP code and a "expires in 10 minutes" notice
    - If email send fails, return 500 with `{ "error": "Failed to send OTP email. Please try again." }` — do not proceed
    - Return 200 `{ "success": true }` on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.2, 7.1, 7.3, 7.5_

  - [ ]* 2.2 Write property test for OTP expiry offset — Property 1
    - **Property 1: OTP expiry offset is always exactly 10 minutes** — for any creation timestamp, `expires_at` equals creation time plus exactly 600 seconds
    - Use `fc.date()` for arbitrary creation timestamps and verify `expires_at - created_at === 600_000` ms
    - **Validates: Requirements 1.2**

  - [ ]* 2.3 Write property test for OTP user association — Property 3
    - **Property 3: OTP user association round-trip** — for any `user_id`, the inserted `mfa_otp_codes` record's `user_id` field equals the input `user_id`
    - Use `fc.uuid()` for arbitrary user IDs
    - **Validates: Requirements 1.4**

  - [ ]* 2.4 Write property test for previous OTP invalidation — Property 4
    - **Property 4: Previous OTPs are invalidated on new generation** — after a new OTP is generated for a user, all previously existing OTP records for that user have `used = true`
    - Use `fc.array(fc.record({ id: fc.uuid(), user_id: fc.uuid(), code: fc.string(), used: fc.boolean(), expires_at: fc.date() }))` for existing records
    - **Validates: Requirements 2.2, 5.2**

  - [ ]* 2.5 Write property test for unauthenticated requests — Property 8
    - **Property 8: Unauthenticated requests to `/api/auth/mfa/send` return 401** — for any request lacking a valid session token (missing, malformed, or expired), the endpoint returns HTTP 401
    - Use `fc.string()` for invalid token values (including empty string)
    - **Validates: Requirements 7.3**

  - [ ]* 2.6 Write property test for email body content — Property 13
    - **Property 13: Email body contains OTP code and expiry notice** — for any valid 6-digit OTP, the generated email body contains the exact 6-digit code string and a reference to the 10-minute expiry
    - Use `fc.integer({ min: 0, max: 999999 })` for OTP values, zero-pad, and verify email template output
    - **Validates: Requirements 2.4**

- [ ] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement `POST /api/auth/mfa/verify` route
  - [x] 4.1 Create `app/api/auth/mfa/verify/route.ts`
    - Extract and validate the Bearer token via `supabaseAdmin.auth.getUser(token)` — return 401 if invalid
    - Validate `code` from request body using `isValidOtpFormat()` — return 400 with `{ "error": "Code must be exactly 6 digits." }` if invalid
    - Check `verifyRateLimiter.canAttempt(userId)` — return 429 with `{ "error": "Too many attempts. Please request a new code." }` if exceeded
    - Query `mfa_otp_codes` for the most recent record matching `user_id`, `used = false`, `expires_at > now()` using `supabaseAdmin`
    - Compare submitted code to stored code using `timingSafeEqual` (via `crypto.timingSafeEqual` on `Buffer.from(code)` vs `Buffer.from(record.code)`) to prevent timing attacks
    - On match: update record `used = true`, call `verifyRateLimiter.reset(userId)`, return 200 `{ "success": true }`
    - On no match or no valid OTP: increment attempt counter (already done by `canAttempt`), return 200 `{ "success": false, "error": "Invalid or expired code. Please try again." }`
    - _Requirements: 1.3, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 4.2 Write property test for valid OTP verification — Property 5
    - **Property 5: Valid OTP verification marks it as used** — for any valid (unexpired, unused, correctly formatted) OTP record, submitting the correct code returns `{ success: true }` and sets `used = true`
    - Use `fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s))` for valid codes
    - **Validates: Requirements 1.3, 3.2**

  - [ ]* 4.3 Write property test for invalid code rejection — Property 6
    - **Property 6: Invalid code submission is always rejected** — for any code that does not exactly match the stored, unexpired, unused OTP (wrong code, expired, already used), the endpoint returns `{ success: false }` and does not mark any OTP as used
    - Use `fc.string()` filtered to not match the stored code
    - **Validates: Requirements 3.3, 3.4, 3.5**

  - [ ]* 4.4 Write property test for invalid code format — Property 9
    - **Property 9: Invalid code format returns 400** — for any code value that is not exactly 6 decimal digit characters, the endpoint returns HTTP 400
    - Use `fc.string()` filtered to not match `/^\d{6}$/`
    - **Validates: Requirements 7.4**

  - [ ]* 4.5 Write unit tests for the verify route
    - Correct code + valid session → 200 `{ success: true }`, OTP marked used
    - Wrong code + valid session → 200 `{ success: false }`
    - Expired OTP → 200 `{ success: false }`
    - Already-used OTP → 200 `{ success: false }`
    - Missing/invalid token → 401
    - Non-6-digit code → 400
    - 6th attempt within window → 429
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 7.2, 7.3, 7.4_

- [ ] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create the `/auth/mfa` verification page
  - [x] 6.1 Create `app/auth/mfa/page.tsx` — session guard and OTP send on mount
    - Create the page as a `'use client'` component importing `AuthLayout`, `GlowCard`, `AuthForm`, `Input`, and `Button` from existing auth components
    - On mount: call `supabase.auth.getSession()` — if no session, `router.replace('/login')`; if `sessionStorage.getItem('mfa_verified') === 'true'`, `router.replace('/dashboard')`
    - On mount (if session valid and OTP not yet sent): call `POST /api/auth/mfa/send` with `Authorization: Bearer <access_token>` — store the result in component state; display an error message if the send fails
    - _Requirements: 6.1, 6.4, 2.1, 2.3_

  - [x] 6.2 Implement the OTP input form and submission handler
    - Render `AuthLayout` > `GlowCard` > `AuthForm` with title "Verify your identity", subtitle "Enter the 6-digit code sent to your email.", badge "SaaSient Dashboard"
    - Add a controlled `<input>` (or use the shared `Input` component) with `inputMode="numeric"`, `maxLength={6}`, `pattern="\d{6}"`, and an `onChange` handler that strips non-digit characters (only retain `[0-9]`) before updating state — satisfies the digit-only constraint without a custom component
    - Disable the submit button unless the OTP field contains exactly 6 digits
    - On submit: call `POST /api/auth/mfa/verify` with the session token and code; on `{ success: true }`, set `sessionStorage.setItem('mfa_verified', 'true')` and `router.replace('/dashboard')`; on failure, display the error message returned by the API
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 6.4_

  - [x] 6.3 Add "Resend code" button with cooldown timer
    - Add a "Resend code" `Button` (variant `"secondary"`) below the submit button
    - On click: call `POST /api/auth/mfa/send`; on success, show a 60-second countdown timer (using `setInterval`) during which the button is disabled; on 429 response, display "Too many resend requests. Please wait before trying again." and disable the button
    - Display the countdown as "Resend code (Xs)" while active
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 6.4 Write property test for OTP input digit filtering — Property 7
    - **Property 7: OTP input field only retains digit characters** — for any string input, the resulting field value contains only the `[0-9]` characters from the input, with all non-digit characters stripped
    - Extract the digit-filter function from the `onChange` handler into a pure helper and test it with `fc.string()` for arbitrary character sequences
    - **Validates: Requirements 3.6**

  - [ ]* 6.5 Write unit tests for the MFA page
    - No session on mount → redirects to `/login`
    - `mfa_verified` flag in sessionStorage on mount → redirects to `/dashboard`
    - Send API failure → error message displayed, no redirect
    - Successful verify → sets `mfa_verified` flag and redirects to `/dashboard`
    - 429 on verify → displays "Too many attempts. Please request a new code."
    - 429 on resend → displays "Too many resend requests. Please wait before trying again." and disables resend button
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.4, 6.1, 6.4_

- [x] 7. Modify `app/login/page.tsx` — redirect to MFA after password auth
  - [x] 7.1 Replace the aal2 check with an unconditional redirect to `/auth/mfa`
    - In `onSubmit`, remove the `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` call and the `if (aal?.nextLevel === 'aal2')` branch
    - Replace with `router.replace('/auth/mfa')` as the final step after successful password auth and company membership check
    - _Requirements: 2.6, 6.2_

  - [x] 7.2 Update the `useEffect` session guard on the login page
    - In the `useEffect` that checks for an existing session, replace the aal2 branch: if a session exists at `aal1`, redirect to `/auth/mfa` instead of `/dashboard`
    - This prevents a user with a valid `aal1` session from landing on the login page and bypassing MFA
    - _Requirements: 6.2_

  - [ ]* 7.3 Write unit tests for the modified login page
    - Existing `aal1` session on mount → redirects to `/auth/mfa` (not `/dashboard`)
    - Successful password auth + company membership → redirects to `/auth/mfa`
    - Failed company membership check → signs out, shows error, no redirect
    - _Requirements: 2.6, 6.2_

- [x] 8. Verify session and navigation guards end-to-end
  - [x] 8.1 Confirm the dashboard layout already guards against unauthenticated access
    - Read `app/dashboard/layout.tsx` to verify it checks for a valid Supabase session and redirects to `/login` if absent
    - If the guard is missing or incomplete, add a `useEffect` (or middleware) that calls `supabase.auth.getSession()` and redirects to `/login` on no session
    - _Requirements: 6.3_

  - [x] 8.2 Verify sign-out invalidates the session and redirects to `/login`
    - Locate the sign-out action in the dashboard (settings page or nav component)
    - Confirm it calls `supabase.auth.signOut()` and then `router.replace('/login')`; add the redirect if missing
    - _Requirements: 6.5_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The `mfa_otp_codes` table is already created in Supabase — no migration is needed
- All OTP database operations use `supabaseAdmin` (service role key) to bypass RLS; the table has no client-accessible RLS policies
- Rate limiters (`verifyRateLimiter`, `resendRateLimiter`) are module-level singletons in `lib/otp.ts` — they reset on server restart, which is acceptable at current scale
- The `sessionStorage` flag `mfa_verified` is used to prevent the MFA page from re-sending an OTP on every navigation; it is cleared automatically when the browser tab closes
- Property-based tests use **fast-check** (`fc`) — install with `npm install --save-dev fast-check` if not already present
- Each property test file should include a comment: `// Feature: email-otp-mfa, Property N: <property text>`
