import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get admin session cookie
    const cookieStore = await cookies();
    const adminSessionId = cookieStore.get('admin_session')?.value;

    if (!adminSessionId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify admin user exists and is active
    const { data: adminUser, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, name, is_active, created_at, last_login_at')
      .eq('id', adminSessionId)
      .eq('is_active', true)
      .single();

    if (error || !adminUser) {
      // Invalid session - clear cookie
      cookieStore.delete('admin_session');
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        admin: adminUser,
      },
    });
  } catch (error: any) {
    console.error('Admin session check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
