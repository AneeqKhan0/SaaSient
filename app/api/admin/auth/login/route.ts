import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Query admin_users table
    const { data: adminUser, error: queryError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (queryError || !adminUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // In production, you should use bcrypt to verify password_hash
    // For now, we'll do a simple comparison (REPLACE THIS IN PRODUCTION)
    // const bcrypt = require('bcrypt');
    // const isValid = await bcrypt.compare(password, adminUser.password_hash);
    
    // Temporary: Direct comparison (NOT SECURE - for development only)
    if (password !== adminUser.password_hash) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last_login_at
    await supabaseAdmin
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminUser.id);

    // Return admin user info (excluding password_hash)
    const { password_hash, ...adminUserInfo } = adminUser;

    // Set secure HTTP-only session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        admin: adminUserInfo,
      },
    });

    // Set cookie on the response
    response.cookies.set('admin_session', adminUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
