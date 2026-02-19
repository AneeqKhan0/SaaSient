import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

type OnboardRequest = {
  companyName: string;
  email: string;
  password: string;
  plan: string;
  phone?: string;
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export async function POST(request: NextRequest) {
  try {
    const body: OnboardRequest = await request.json();
    const { companyName, email, password, plan, phone } = body;

    // Validate required fields
    if (!companyName || !email || !password || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Generate slug from company name
    const slug = generateSlug(companyName);

    // Step 1: Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      // Check for duplicate email
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: authError.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Step 2: Insert into companies table
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName,
        slug,
        plan,
      })
      .select('id')
      .single();

    if (companyError) {
      console.error('Company creation error:', companyError);
      
      // Rollback: Delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      // Check for duplicate slug
      if (companyError.message.includes('unique') || companyError.code === '23505') {
        return NextResponse.json(
          { error: 'Company name already exists (slug conflict)' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: companyError.message || 'Failed to create company' },
        { status: 500 }
      );
    }

    if (!companyData) {
      // Rollback: Delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      );
    }

    const companyId = companyData.id;

    // Step 3: Insert into company_members table
    const { error: memberError } = await supabaseAdmin
      .from('company_members')
      .insert({
        company_id: companyId,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      
      // Rollback: Delete company and auth user
      await supabaseAdmin.from('companies').delete().eq('id', companyId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { error: memberError.message || 'Failed to create company member' },
        { status: 500 }
      );
    }

    // Success! Return the details
    return NextResponse.json({
      success: true,
      data: {
        companyId,
        companyName,
        email,
        slug,
      },
    });

  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
