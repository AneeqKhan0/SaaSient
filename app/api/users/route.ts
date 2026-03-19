import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

// GET - List all users for a company
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create client with user's token
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: membership } = await supabaseAdmin
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    // Get all company members
    const { data: members, error } = await supabaseAdmin
      .from('company_members')
      .select(`
        user_id,
        created_at
      `)
      .eq('company_id', membership.company_id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Get user details from auth
    const membersWithDetails = await Promise.all(
      (members || []).map(async (member) => {
        const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(member.user_id);
        return {
          id: member.user_id,
          email: authUser?.email || 'Unknown',
          created_at: member.created_at,
        };
      })
    );

    return NextResponse.json({ users: membersWithDetails });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add new user to company
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: membership } = await supabaseAdmin
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    // Check user limit (max 3 users)
    const { count } = await supabaseAdmin
      .from('company_members')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', membership.company_id);

    if (count && count >= 3) {
      return NextResponse.json({ error: 'Maximum 3 users allowed' }, { status: 400 });
    }

    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Create auth user
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
      throw authError;
    }

    if (!newUser.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Add to company_members (all users are admins)
    const { error: memberError } = await supabaseAdmin
      .from('company_members')
      .insert({
        user_id: newUser.user.id,
        company_id: membership.company_id,
        role: 'admin',
      });

    if (memberError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw memberError;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
      },
    });
  } catch (error: any) {
    console.error('Add user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove user from company
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('userId');

    if (!userIdToRemove) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Can't remove yourself
    if (userIdToRemove === user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
    }

    // Get user's company
    const { data: membership } = await supabaseAdmin
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    // Remove from company_members
    const { error: removeError } = await supabaseAdmin
      .from('company_members')
      .delete()
      .eq('user_id', userIdToRemove)
      .eq('company_id', membership.company_id);

    if (removeError) {
      throw removeError;
    }

    // Delete the auth user completely
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userIdToRemove);
    
    if (deleteAuthError) {
      console.error('Failed to delete auth user:', deleteAuthError);
      // Don't throw - company_members already removed
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Remove user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update user password
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return NextResponse.json({ error: 'User ID and password required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update password error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
