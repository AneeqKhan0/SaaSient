# Requirements Document

## Introduction

This feature adds Email OTP-based Multi-Factor Authentication (MFA) to the SaaSient user dashboard login flow. After a user successfully authenticates with their email and password, a 6-digit one-time passcode (OTP) is sent to their registered email address. The user must enter the correct, non-expired OTP on a dedicated verification page to gain access to the dashboard. OTP codes expire after 10 minutes and are stored in a dedicated Supabase table. This feature applies only to the user dashboard login — not the admin login.

## Glossary

- **MFA_System**: The server-side logic responsible for generating, storing, sending, and verifying OTP codes.
- **OTP**: A 6-digit one-time passcode used as the second authentication factor.
- **OTP_Store**: The Supabase database table (`mfa_otp_codes`) that persists OTP records with their associated user, code, expiry timestamp, and used status.
- **Email_Service**: Supabase's built-in email service (the same service used for forgot-password flows).
- **Verification_Page**: The Next.js page at `/auth/mfa` where users enter their OTP.
- **Login_Page**: The existing Next.js page at `/app/login/page.tsx`.
- **Session**: A Supabase authentication session established after successful password authentication.
- **AAL**: Authentication Assurance Level — a Supabase concept indicating the strength of the current session (`aal1` = password only, `aal2` = MFA verified).
- **Rate_Limiter**: A client-side utility that restricts the number of attempts within a time window to prevent abuse.
- **Company_Member**: A user who belongs to a company via the `company_members` table.

---

## Requirements

### Requirement 1: OTP Storage

**User Story:** As a system administrator, I want OTP codes to be stored securely in the database, so that they can be validated server-side and expire automatically.

#### Acceptance Criteria

1. THE OTP_Store SHALL contain a record for each issued OTP with the fields: `id`, `user_id`, `code`, `expires_at`, `used`, and `created_at`.
2. THE OTP_Store SHALL set `expires_at` to exactly 10 minutes after the OTP is created.
3. THE OTP_Store SHALL set `used` to `false` upon creation and `true` upon successful verification.
4. WHEN an OTP record is created, THE OTP_Store SHALL associate it with the authenticated user's `user_id`.
5. THE MFA_System SHALL generate OTP codes using a cryptographically secure random number generator.
6. THE MFA_System SHALL generate OTP codes that are exactly 6 decimal digits (000000–999999), zero-padded.

---

### Requirement 2: OTP Generation and Delivery

**User Story:** As a user, I want to receive a one-time passcode by email after entering my password, so that I can complete the second factor of authentication.

#### Acceptance Criteria

1. WHEN a user successfully authenticates with a valid email and password and is confirmed as a Company_Member, THE MFA_System SHALL generate a new OTP and store it in the OTP_Store.
2. WHEN a new OTP is generated for a user who already has an unexpired, unused OTP, THE MFA_System SHALL invalidate the previous OTP by marking it as `used` before inserting the new one.
3. WHEN an OTP is generated, THE MFA_System SHALL send it to the user's registered email address via the Email_Service within the same request.
4. THE Email_Service SHALL send an email containing the 6-digit OTP code and a clear statement that the code expires in 10 minutes.
5. IF the Email_Service fails to send the OTP email, THEN THE MFA_System SHALL return an error response and SHALL NOT redirect the user to the Verification_Page.
6. WHEN an OTP is generated, THE Login_Page SHALL redirect the user to the Verification_Page at `/auth/mfa`.

---

### Requirement 3: OTP Verification

**User Story:** As a user, I want to enter my OTP on a dedicated page to complete login, so that my account is protected by a second factor.

#### Acceptance Criteria

1. THE Verification_Page SHALL display a form with a single 6-digit OTP input field and a submit button.
2. WHEN a user submits a valid, unexpired, unused OTP that matches the stored code for their `user_id`, THE MFA_System SHALL mark the OTP as `used` and redirect the user to `/dashboard`.
3. WHEN a user submits an OTP that does not match the stored code for their `user_id`, THE Verification_Page SHALL display the message "Invalid or expired code. Please try again." and SHALL NOT redirect the user.
4. WHEN a user submits an OTP whose `expires_at` timestamp is in the past, THE Verification_Page SHALL display the message "Invalid or expired code. Please try again." and SHALL NOT redirect the user.
5. WHEN a user submits an OTP that has already been marked as `used`, THE Verification_Page SHALL display the message "Invalid or expired code. Please try again." and SHALL NOT redirect the user.
6. THE Verification_Page SHALL accept only numeric input in the OTP field and SHALL reject non-numeric characters.
7. THE Verification_Page SHALL accept only inputs of exactly 6 digits before allowing form submission.

---

### Requirement 4: Rate Limiting on OTP Verification

**User Story:** As a system administrator, I want OTP verification attempts to be rate-limited, so that brute-force attacks against the 6-digit code space are prevented.

#### Acceptance Criteria

1. THE MFA_System SHALL allow a maximum of 5 OTP verification attempts per user within any 10-minute window.
2. WHEN a user exceeds 5 verification attempts within 10 minutes, THE Verification_Page SHALL display the message "Too many attempts. Please request a new code." and SHALL NOT process further verification attempts until the window resets.
3. WHEN a user successfully verifies an OTP, THE MFA_System SHALL reset the rate-limit counter for that user.

---

### Requirement 5: OTP Resend

**User Story:** As a user, I want to be able to request a new OTP if I did not receive the first one or if it expired, so that I am not permanently locked out.

#### Acceptance Criteria

1. THE Verification_Page SHALL display a "Resend code" action that allows the user to request a new OTP.
2. WHEN a user requests a resend, THE MFA_System SHALL generate a new OTP, invalidate any existing unexpired OTP for that user, and send the new code to the user's email — subject to the same delivery requirements as Requirement 2.
3. THE MFA_System SHALL allow a maximum of 3 resend requests per user within any 10-minute window.
4. WHEN a user exceeds 3 resend requests within 10 minutes, THE Verification_Page SHALL display the message "Too many resend requests. Please wait before trying again." and SHALL disable the resend action until the window resets.

---

### Requirement 6: Session and Navigation Guards

**User Story:** As a user, I want the application to correctly manage my session state during the MFA flow, so that I cannot bypass the OTP step or access stale pages.

#### Acceptance Criteria

1. WHEN a user navigates to the Verification_Page without an active Supabase Session, THE Verification_Page SHALL redirect the user to `/login`.
2. WHEN a user navigates to the Login_Page and already has an active Session with `aal1` assurance, THE Login_Page SHALL redirect the user to the Verification_Page at `/auth/mfa` rather than to `/dashboard`.
3. WHEN a user navigates to `/dashboard` without a valid Session, THE MFA_System SHALL redirect the user to `/login`.
4. WHEN a user has completed OTP verification and holds a valid Session, THE Verification_Page SHALL redirect the user to `/dashboard` rather than displaying the OTP form again.
5. WHEN a user signs out from the dashboard, THE MFA_System SHALL invalidate the Session and redirect the user to `/login`.

---

### Requirement 7: API Endpoint for OTP Operations

**User Story:** As a developer, I want a dedicated server-side API route to handle OTP generation and verification, so that sensitive operations are not exposed to the client.

#### Acceptance Criteria

1. THE MFA_System SHALL expose a POST endpoint at `/api/auth/mfa/send` that accepts a valid Supabase session token and generates and sends an OTP for the authenticated user.
2. THE MFA_System SHALL expose a POST endpoint at `/api/auth/mfa/verify` that accepts a valid Supabase session token and a 6-digit code, and returns a success or failure response.
3. WHEN a request to `/api/auth/mfa/send` or `/api/auth/mfa/verify` is made without a valid Supabase session token, THE MFA_System SHALL return HTTP 401.
4. WHEN a request to `/api/auth/mfa/verify` contains a `code` value that is not exactly 6 decimal digits, THE MFA_System SHALL return HTTP 400 with a descriptive error message.
5. THE MFA_System SHALL use the Supabase Admin client for all OTP_Store read and write operations to enforce server-side access control.
