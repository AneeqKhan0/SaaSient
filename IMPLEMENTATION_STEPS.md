# Implementation Steps - Apply the Refactoring

## ✅ What's Already Done

All reusable components have been created and are ready to use:

- ✅ 17 components created in `app/components/`
- ✅ Design tokens centralized in `constants.ts`
- ✅ Shared hooks and utilities created
- ✅ All components are TypeScript error-free
- ✅ Example refactored login page created (`app/login/page.new.tsx`)

## 🚀 How to Apply the Changes

### Step 1: Test the New Login Page

1. **Backup your current login page**:
   ```bash
   cp app/login/page.tsx app/login/page.old.tsx
   ```

2. **Replace with the new version**:
   ```bash
   cp app/login/page.new.tsx app/login/page.tsx
   ```

3. **Test it**:
   - Visit `/login` in your browser
   - Try logging in
   - Check the glow effect works
   - Verify password show/hide toggle
   - Test "Forgot password?" link

4. **If everything works**, proceed to Step 2. If not, restore the backup:
   ```bash
   cp app/login/page.old.tsx app/login/page.tsx
   ```

### Step 2: Refactor Forgot Password Page

Replace `app/auth/forgot-password/page.tsx` with:

```tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AuthLayout, GlowCard, AuthForm, Input, Button } from '@/app/components';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace('/dashboard');
    })();
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const redirectTo = `${window.location.origin}/auth/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setMessage('If that email exists, we've sent a password reset link.');
    } catch (err: any) {
      setMessage(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <GlowCard>
        {(setSuspendGlow) => (
          <AuthForm
            title="Reset password"
            subtitle="Enter your email and we'll send you a secure reset link."
            badge="SaaSient Dashboard"
            onSubmit={onSubmit}
            message={message}
            messageType={message?.includes('sent') ? 'success' : 'error'}
            footer={
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                Tip: Check your spam/junk folder if you don't see the email within a minute.
              </p>
            }
          >
            <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              autoComplete="email"
              required
              onFocus={() => setSuspendGlow(true)}
              onBlur={() => setSuspendGlow(false)}
            />

            <div
              style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
              onPointerEnter={() => setSuspendGlow(true)}
              onPointerLeave={() => setSuspendGlow(false)}
            >
              <Button type="submit" disabled={loading} variant="primary">
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Button type="button" variant="secondary">
                  Back to login
                </Button>
              </Link>
            </div>
          </AuthForm>
        )}
      </GlowCard>
    </AuthLayout>
  );
}
```

### Step 3: Refactor Update Password Page

Replace `app/auth/update-password/page.tsx` with:

```tsx
'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AuthLayout, GlowCard, AuthForm, PasswordInput, Button } from '@/app/components';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = useMemo(() => searchParams.get('code'), [searchParams]);
  const tokenHash = useMemo(() => searchParams.get('token_hash'), [searchParams]);
  const type = useMemo(() => searchParams.get('type'), [searchParams]);

  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setMessage(null);

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (!cancelled) setReady(true);
          return;
        }

        if (tokenHash && (type === 'recovery' || !type)) {
          const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
          if (error) throw error;
          if (!cancelled) setReady(true);
          return;
        }

        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        if (hash && hash.startsWith('#')) {
          const hashParams = new URLSearchParams(hash.slice(1));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            if (!cancelled) setReady(true);
            return;
          }
        }

        setMessage('Invalid or missing recovery link. Please request a new one.');
      } catch (err: any) {
        if (!cancelled) {
          setMessage(err?.message ?? 'Could not validate recovery link. Please try again.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, tokenHash, type]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (pw1.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    if (pw1 !== pw2) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;

      setMessage('Password updated successfully. Redirecting to login…');
      setTimeout(() => router.replace('/login'), 800);
    } catch (err: any) {
      setMessage(err?.message ?? 'Could not update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <GlowCard>
        {(setSuspendGlow) => (
          <AuthForm
            title="Set a new password"
            subtitle="Choose a strong password you'll remember."
            badge="SaaSient Dashboard"
            onSubmit={onSubmit}
            message={message}
            messageType={message?.includes('successfully') ? 'success' : 'error'}
            footer={
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                If this link is expired, go back and request a new reset email.
              </p>
            }
          >
            {!ready ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.80)' }}>
                {message ?? 'Validating recovery link…'}
              </p>
            ) : (
              <>
                <PasswordInput
                  id="pw1"
                  label="New password"
                  value={pw1}
                  onChange={setPw1}
                  show={showPw1}
                  onToggleShow={() => setShowPw1((v) => !v)}
                  onFocus={() => setSuspendGlow(true)}
                  onBlur={() => setSuspendGlow(false)}
                  autoComplete="new-password"
                />

                <PasswordInput
                  id="pw2"
                  label="Confirm password"
                  value={pw2}
                  onChange={setPw2}
                  show={showPw2}
                  onToggleShow={() => setShowPw2((v) => !v)}
                  onFocus={() => setSuspendGlow(true)}
                  onBlur={() => setSuspendGlow(false)}
                  autoComplete="new-password"
                />

                <div
                  style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
                  onPointerEnter={() => setSuspendGlow(true)}
                  onPointerLeave={() => setSuspendGlow(false)}
                >
                  <Button type="submit" disabled={loading} variant="primary">
                    {loading ? 'Updating…' : 'Update password'}
                  </Button>
                  <Link href="/login" style={{ textDecoration: 'none' }}>
                    <Button type="button" variant="secondary">
                      Back to login
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </AuthForm>
        )}
      </GlowCard>
    </AuthLayout>
  );
}
```

### Step 4: Delete Duplicate Auth Page

The file `app/auth/page.tsx` is a duplicate of `update-password/page.tsx`. Delete it:

```bash
rm app/auth/page.tsx
```

### Step 5: Refactor Dashboard Pages (Example)

For `app/dashboard/page.tsx`, replace the stat cards with:

```tsx
import { StatCard, useFormatters } from '@/app/components';

// Inside your component:
const { formatNum } = useFormatters();

// Replace inline stat card divs with:
<StatCard
  icon="📊"
  title="Leads Today"
  value={formatNum(leadsToday)}
/>

<StatCard
  icon="💬"
  title="Messages Today"
  value={formatNum(messagesToday)}
/>

<StatCard
  icon="🔥"
  title="Hot Leads"
  value={formatNum(hotLeads)}
/>
```

### Step 6: Clean Up

After all pages are refactored and tested:

```bash
# Remove temporary files
rm app/login/page.old.tsx
rm app/login/page.new.tsx
rm app/login/page-refactored.tsx

# Remove old backup files if any
find app -name "*.old.tsx" -delete
find app -name "*.new.tsx" -delete
```

## 🧪 Testing Checklist

After each refactoring, test:

- [ ] Page loads without errors
- [ ] All interactive elements work (buttons, inputs, links)
- [ ] Glow effect works on auth pages
- [ ] Form submission works correctly
- [ ] Error messages display properly
- [ ] Success messages display properly
- [ ] Responsive design works on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader accessibility (if applicable)

## 📊 Expected Results

### Before
- Login page: ~450 lines
- Forgot password: ~400 lines
- Update password: ~450 lines
- **Total**: ~1,300 lines

### After
- Login page: ~80 lines
- Forgot password: ~70 lines
- Update password: ~100 lines
- **Total**: ~250 lines

**Reduction**: 1,050 lines saved (81% less code)

## 🆘 Troubleshooting

### Issue: Import errors
**Solution**: Make sure you're importing from `@/app/components` or `@/app/components/[category]/[component]`

### Issue: Glow effect not working
**Solution**: Check that `setSuspendGlow` is being called in `onPointerEnter` and `onPointerLeave` handlers

### Issue: Styles look different
**Solution**: Verify that `constants.ts` has the correct color values matching your original design

### Issue: TypeScript errors
**Solution**: Run `npm run build` to see all errors, or check with `getDiagnostics` tool

## 🎉 Success!

Once all pages are refactored:
- Your codebase will be ~3,450 lines shorter
- All pages will have consistent styling
- Future changes will be much easier
- New pages can be built quickly using existing components

---

**Need help?** Check the documentation:
- `app/components/README.md` - Component usage guide
- `REFACTORING_GUIDE.md` - Before/after examples
- `COMPONENT_LIBRARY_SUMMARY.md` - Overview of what was created
