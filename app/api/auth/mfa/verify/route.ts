import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidOtpFormat } from '@/lib/otp';

/**
 * POST /api/auth/mfa/verify
 *
 * Verifies the 6-digit OTP using Supabase's built-in verifyOtp.
 * Supabase checks its own internally stored token — no custom DB lookup needed.
 *
 * Body: { email: string, token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, token } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (!token || typeof token !== 'string' || !isValidOtpFormat(token)) {
      return NextResponse.json(
        { error: 'Code must be exactly 6 digits.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // verifyOtp checks Supabase's own token — same one sent in the email.
    // type: 'email' matches the signInWithOtp flow.
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error || !data.session) {
      console.error('verifyOtp error:', error?.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired code. Please try again.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('MFA verify route error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
