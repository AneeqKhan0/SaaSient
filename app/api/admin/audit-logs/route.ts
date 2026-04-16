import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = await cookies();
    const adminSessionId = cookieStore.get('admin_session')?.value;

    if (!adminSessionId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const companyId = searchParams.get('company_id') || '';
    const adminId = searchParams.get('admin_id') || '';
    const action = searchParams.get('action') || '';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    // Build query
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (adminId) {
      query = query.eq('admin_id', adminId);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Get audit logs with pagination
    const { data: auditLogs, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw error;
    }

    // Enrich audit logs with admin and company details
    const enrichedLogs = await Promise.all(
      (auditLogs || []).map(async (log) => {
        // Get admin details
        const { data: admin } = await supabaseAdmin
          .from('admin_users')
          .select('email')
          .eq('id', log.admin_id)
          .single();

        // Get company details if company_id exists
        let companyName = null;
        if (log.company_id) {
          const { data: company } = await supabaseAdmin
            .from('companies')
            .select('name')
            .eq('id', log.company_id)
            .single();
          companyName = company?.name || null;
        }

        return {
          ...log,
          admin_email: admin?.email || 'Unknown',
          company_name: companyName,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        logs: enrichedLogs,
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > page * limit,
      },
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
