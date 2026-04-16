import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: companyId } = await params;

    // Get company details
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Calculate lead metrics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get leads from lead_store
    const { data: leadStoreData } = await supabaseAdmin
      .from('lead_store')
      .select('*')
      .eq('company_id', companyId);

    // Get leads from whatsapp_conversations
    const { data: whatsappData } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('*')
      .eq('company_id', companyId);

    // Calculate unique leads and breakdowns
    const uniqueLeads = new Set<string>();
    let voiceAgent = 0, whatsappAgent = 0, whatsappConversations = 0;
    let hot = 0, warm = 0, cold = 0;
    let today = 0, thisWeek = 0, thisMonth = 0;

    // Process lead_store data
    (leadStoreData || []).forEach(lead => {
      const phone = lead.phone?.replace(/\D/g, '');
      let identifier = '';
      if (phone && phone.length >= 10) {
        identifier = phone;
      } else if (lead.email) {
        identifier = lead.email.toLowerCase();
      } else if (lead.Full_name) {
        identifier = lead.Full_name.toLowerCase();
      } else if (lead.First_Name || lead.Last_Name) {
        identifier = `${lead.First_Name || ''} ${lead.Last_Name || ''}`.trim().toLowerCase();
      }
      
      if (identifier) {
        uniqueLeads.add(identifier);
      }

      // Count by source
      if (lead.Source === 'Voice Agent') voiceAgent++;
      else if (lead.Source === 'WhatsApp agent') whatsappAgent++;

      // Count by category
      const category = lead['Lead Category']?.toLowerCase();
      if (category === 'hot') hot++;
      else if (category === 'warm') warm++;
      else if (category === 'cold') cold++;

      // Time-based counting
      const leadDate = new Date(lead.appointment_time || lead.date || lead.created_at);
      if (!isNaN(leadDate.getTime())) {
        if (leadDate >= todayStart) today++;
        if (leadDate >= weekStart) thisWeek++;
        if (leadDate >= monthStart) thisMonth++;
      }
    });

    // Process whatsapp_conversations data
    (whatsappData || []).forEach(conv => {
      const phone = conv.phone_number?.replace(/\D/g, '');
      let identifier = '';
      if (phone && phone.length >= 10) {
        identifier = phone;
      } else if (conv.name) {
        identifier = conv.name.toLowerCase();
      }
      
      if (identifier) {
        const wasNew = !uniqueLeads.has(identifier);
        uniqueLeads.add(identifier);
        if (wasNew) whatsappConversations++;
      }

      const convDate = new Date(conv.updated_at || '');
      if (!isNaN(convDate.getTime())) {
        if (convDate >= todayStart) today++;
        if (convDate >= weekStart) thisWeek++;
        if (convDate >= monthStart) thisMonth++;
      }
    });

    // Get company members
    const { data: members } = await supabaseAdmin
      .from('company_members')
      .select('user_id, role, created_at')
      .eq('company_id', companyId);

    const membersWithDetails = await Promise.all(
      (members || []).map(async (member) => {
        const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(member.user_id);
        return {
          user_id: member.user_id,
          email: authUser?.email || 'Unknown',
          role: member.role,
          created_at: member.created_at,
          last_login_at: authUser?.last_sign_in_at || null,
        };
      })
    );

    // Get recent activity (last 20 leads)
    const recentActivity = (leadStoreData || [])
      .sort((a, b) => {
        const aDate = new Date(a.appointment_time || a.date || a.created_at || 0);
        const bDate = new Date(b.appointment_time || b.date || b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 20)
      .map(lead => ({
        id: lead.id,
        customer_name: lead.Full_name || `${lead.First_Name || ''} ${lead.Last_Name || ''}`.trim() || 'Unknown',
        phone: lead.phone || '',
        email: lead.email || '',
        source: lead.Source || '',
        category: lead['Lead Category'] || '',
        created_at: lead.appointment_time || lead.date || lead.created_at,
      }));

    return NextResponse.json({
      success: true,
      data: {
        company: {
          ...company,
          current_leads: uniqueLeads.size,
          capacity_percent: Math.min((uniqueLeads.size / company.max_leads) * 100, 100),
          contact_email: membersWithDetails[0]?.email || '',
          contact_phone: '',
        },
        leads: {
          total: uniqueLeads.size,
          voice_agent: voiceAgent,
          whatsapp_agent: whatsappAgent,
          whatsapp_conversations: whatsappConversations,
          hot,
          warm,
          cold,
          today,
          this_week: thisWeek,
          this_month: thisMonth,
        },
        members: membersWithDetails,
        recent_activity: recentActivity,
      },
    });
  } catch (error: any) {
    console.error('Get company detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: companyId } = await params;
    const body = await request.json();
    const { name, slug, plan, max_leads, status } = body;

    // Validate max_leads if provided
    if (max_leads !== undefined && max_leads <= 0) {
      return NextResponse.json(
        { success: false, error: 'Max leads must be greater than 0' },
        { status: 400 }
      );
    }

    // Get current company values (before_value)
    const { data: currentCompany, error: fetchError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (fetchError || !currentCompany) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (plan !== undefined) updates.plan = plan;
    if (max_leads !== undefined) updates.max_leads = max_leads;
    if (status !== undefined) updates.status = status;

    // Update company
    const { data: updatedCompany, error: updateError } = await supabaseAdmin
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create audit log entry
    const { data: auditLog } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        admin_id: adminSessionId,
        company_id: companyId,
        action: 'update_company',
        entity_type: 'company',
        entity_id: companyId,
        before_value: currentCompany,
        after_value: updatedCompany,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        user_agent: request.headers.get('user-agent') || '',
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      data: {
        company: updatedCompany,
        audit_log_id: auditLog?.id,
      },
    });
  } catch (error: any) {
    console.error('Update company error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
