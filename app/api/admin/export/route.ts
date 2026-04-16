import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

// Helper to escape CSV values
function csvEscape(value: any): string {
  const s = value === null || value === undefined ? '' : 
            typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

// Helper to calculate unique leads for a company
async function calculateCompanyLeads(companyId: string) {
  const { data: leadStoreData } = await supabaseAdmin
    .from('lead_store')
    .select('phone, email, Full_name, First_Name, Last_Name')
    .eq('company_id', companyId);

  const { data: whatsappData } = await supabaseAdmin
    .from('whatsapp_conversations')
    .select('phone_number, name')
    .eq('company_id', companyId);

  const uniqueLeads = new Set<string>();

  (leadStoreData || []).forEach(lead => {
    const phone = lead.phone?.replace(/\D/g, '');
    if (phone && phone.length >= 10) {
      uniqueLeads.add(phone);
    } else if (lead.email) {
      uniqueLeads.add(lead.email.toLowerCase());
    } else if (lead.Full_name) {
      uniqueLeads.add(lead.Full_name.toLowerCase());
    } else if (lead.First_Name || lead.Last_Name) {
      uniqueLeads.add(`${lead.First_Name || ''} ${lead.Last_Name || ''}`.trim().toLowerCase());
    }
  });

  (whatsappData || []).forEach(conv => {
    const phone = conv.phone_number?.replace(/\D/g, '');
    if (phone && phone.length >= 10) {
      uniqueLeads.add(phone);
    } else if (conv.name) {
      uniqueLeads.add(conv.name.toLowerCase());
    }
  });

  return uniqueLeads.size;
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { type, filters } = body;

    if (!type || !['companies', 'revenue', 'usage_alerts'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid export type' },
        { status: 400 }
      );
    }

    // Get companies with optional filters
    let query = supabaseAdmin.from('companies').select('*');

    if (filters?.plan) {
      query = query.eq('plan', filters.plan);
    }
    if (filters?.date_range?.start) {
      query = query.gte('created_at', filters.date_range.start);
    }
    if (filters?.date_range?.end) {
      query = query.lte('created_at', filters.date_range.end);
    }

    const { data: companies, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    let csvContent = '';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Generate CSV based on export type
    if (type === 'companies') {
      // Companies export
      const header = ['Name', 'Slug', 'Plan', 'Max Leads', 'Current Leads', 'Capacity %', 'Status', 'Created At'];
      csvContent = header.map(csvEscape).join(',') + '\n';

      for (const company of companies || []) {
        const currentLeads = await calculateCompanyLeads(company.id);
        const capacityPercent = Math.min((currentLeads / company.max_leads) * 100, 100).toFixed(1);

        const row = [
          company.name,
          company.slug,
          company.plan,
          company.max_leads,
          currentLeads,
          capacityPercent,
          company.status || 'active',
          company.created_at,
        ];
        csvContent += row.map(csvEscape).join(',') + '\n';
      }
    } else if (type === 'revenue') {
      // Revenue export
      const PLAN_PRICING = { starter: 29, pro: 99, enterprise: 299 };
      const header = ['Company Name', 'Plan', 'MRR', 'ARR', 'Status', 'Created At'];
      csvContent = header.map(csvEscape).join(',') + '\n';

      for (const company of companies || []) {
        const mrr = PLAN_PRICING[company.plan as keyof typeof PLAN_PRICING] || 0;
        const arr = mrr * 12;

        const row = [
          company.name,
          company.plan,
          mrr,
          arr,
          company.status || 'active',
          company.created_at,
        ];
        csvContent += row.map(csvEscape).join(',') + '\n';
      }
    } else if (type === 'usage_alerts') {
      // Usage alerts export
      const header = ['Company Name', 'Plan', 'Current Leads', 'Max Leads', 'Capacity %', 'Status', 'Alert Level'];
      csvContent = header.map(csvEscape).join(',') + '\n';

      for (const company of companies || []) {
        const currentLeads = await calculateCompanyLeads(company.id);
        const capacityPercent = (currentLeads / company.max_leads) * 100;

        // Apply capacity filter if specified
        if (filters?.capacity) {
          const meetsFilter = 
            (filters.capacity === 'under_75' && capacityPercent < 75) ||
            (filters.capacity === '75_89' && capacityPercent >= 75 && capacityPercent < 90) ||
            (filters.capacity === '90_99' && capacityPercent >= 90 && capacityPercent < 100) ||
            (filters.capacity === '100' && capacityPercent >= 100);

          if (!meetsFilter) continue;
        }

        let alertLevel = 'Normal';
        if (capacityPercent >= 100) alertLevel = 'Critical';
        else if (capacityPercent >= 90) alertLevel = 'Warning';
        else if (capacityPercent >= 75) alertLevel = 'Caution';

        const row = [
          company.name,
          company.plan,
          currentLeads,
          company.max_leads,
          capacityPercent.toFixed(1),
          company.status || 'active',
          alertLevel,
        ];
        csvContent += row.map(csvEscape).join(',') + '\n';
      }
    }

    // Generate filename
    const filename = `${type}_export_${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
