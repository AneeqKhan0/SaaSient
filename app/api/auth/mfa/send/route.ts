import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/mfa/send
 *
 * Triggers Supabase's built-in email OTP flow.
 * Supabase generates the 6-digit token, stores it internally, and sends
 * it via email using the {{ .Token }} template variable.
 *
 * No custom OTP generation, no custom DB storage, no third-party email.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Use service role client — bypasses RLS, works server-side
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // signInWithOtp sends a 6-digit code to the user's email.
    // shouldCreateUser: false — only works for existing users.
    // Supabase handles token generation, storage, expiry, and email delivery.
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error('signInWithOtp error:', error.message);
      // Don't reveal if email exists or not
      return NextResponse.json(
        { error: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('MFA send route error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
