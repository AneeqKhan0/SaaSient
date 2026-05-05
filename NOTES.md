# Project Notes

## Email OTP Multi-Factor Authentication (MFA)

### Overview
Implemented email-based OTP (One-Time Password) MFA for the user dashboard login flow.
Uses Supabase's built-in OTP system — no third-party email services, no custom token storage.

---

### How It Works

#### Full Login Flow
```
User enters email + password
        ↓
supabase.auth.signInWithPassword()
        ↓
Company membership check (company_members table)
        ↓
Email saved to sessionStorage
        ↓
Redirect to /auth/mfa
        ↓
7-day localStorage check
  → Valid: skip OTP → /dashboard
  → Expired/missing: proceed with OTP
        ↓
POST /api/auth/mfa/send
  → supabaseAdmin.auth.signInWithOtp({ email, shouldCreateUser: false })
  → Supabase generates token, sends email via {{ .Token }} template
        ↓
User enters 6-digit code
        ↓
POST /api/auth/mfa/verify
  → supabaseAdmin.auth.verifyOtp({ email, token, type: 'email' })
  → Supabase verifies its own token
        ↓
localStorage.setItem('mfa_verified_until_<userId>', <7-day timestamp>)
        ↓
Redirect to /dashboard
```

#### Sign Out Flow
```
supabase.auth.signOut()
localStorage.removeItem('mfa_verified_until_<userId>')
Redirect to /login
```

---

### Key Design Decisions

1. **Supabase-only approach** — `signInWithOtp` + `verifyOtp` handles token generation,
   storage, expiry, and email delivery. No custom OTP table needed.

2. **7-day session persistence** — After successful OTP verification, a timestamp is stored
   in `localStorage` keyed by `userId`. For 7 days, the OTP step is skipped on login.
   After 7 days or on sign-out, OTP is required again.

3. **Email passed via sessionStorage** — Login page stores the user's email in
   `sessionStorage` so the MFA page can pass it to `signInWithOtp` and `verifyOtp`.
   Falls back to `session.user.email` if sessionStorage is unavailable.

4. **No third-party email** — Resend was tested but removed. Supabase's built-in SMTP
   handles all email delivery via the Magic Link email template.

---

### Files Modified / Created

| File | Change |
|------|--------|
| `app/login/page.tsx` | Removed aal2 check; added sessionStorage email save; redirect to /auth/mfa |
| `app/auth/mfa/page.tsx` | New — OTP verification page with 7-day check, send/verify flow, resend with cooldown |
| `app/api/auth/mfa/send/route.ts` | New — calls `signInWithOtp` |
| `app/api/auth/mfa/verify/route.ts` | New — calls `verifyOtp` |
| `app/dashboard/layout.tsx` | Sign-out clears `mfa_verified_until_<userId>` from localStorage |
| `lib/otp.ts` | Kept only `isValidOtpFormat()` helper |
| `.env.local` | Added `RESEND_API_KEY` (unused now), all Supabase keys present |

---

### Environment Variables Required

```env
NEXT_PUBLIC_COMPANY_ID=<company-uuid>
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
```

---

### Supabase Dashboard Configuration

**Authentication → Email Templates → Magic Link**

Subject:
```
Your verification code
```

Body:
```html
<h2>Your verification code</h2>
<p>Enter this code to complete your login. It expires in <strong>10 minutes</strong>.</p>
<div style="font-size:40px;font-weight:bold;letter-spacing:12px;text-align:center;
            padding:24px;background:#f4f4f5;border-radius:8px;">
  {{ .Token }}
</div>
<p style="color:#888;font-size:13px;">
  If you did not request this code, you can safely ignore this email.
</p>
```

---

### What Was NOT Implemented (Future Work)

- MFA for admin login (`/admin/login`) — same approach can be applied
- Rate limiting on OTP attempts (Supabase handles this internally)
- `mfa_otp_codes` custom table — was created but is no longer needed, can be dropped

---

### Packages

- `resend` — installed but no longer used (can be removed with `npm uninstall resend`)
- `@supabase/supabase-js` — handles all auth including OTP

---

### Notes on 7-Day Session Logic

```typescript
// Key format: mfa_verified_until_<userId>
// Value: Unix timestamp (milliseconds) of expiry

// Set after successful OTP verification:
localStorage.setItem(`mfa_verified_until_${userId}`, String(Date.now() + 7 * 24 * 60 * 60 * 1000))

// Check on MFA page load:
const raw = localStorage.getItem(`mfa_verified_until_${userId}`)
const isValid = raw && Date.now() < parseInt(raw, 10)

// Clear on sign-out:
localStorage.removeItem(`mfa_verified_until_${userId}`)
```

This is per-user (keyed by userId) so multiple users on the same browser
each have their own independent 7-day window.
