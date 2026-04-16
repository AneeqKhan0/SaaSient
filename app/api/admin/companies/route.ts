import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

// Helper function to calculate unique leads for a company
async function calculateCompanyLeads(companyId: string) {
  // Get leads from lead_store
  const { data: leadStoreData } = await supabaseAdmin
    .from('lead_store')
    .select('phone, email, Full_name, First_Name, Last_Name')
    .eq('company_id', companyId);

  // Get leads from whatsapp_conversations
  const { data: whatsappData } = await supabaseAdmin
    .from('whatsapp_conversations')
    .select('phone_number, name')
    .eq('company_id', companyId);

  // Create a Set to track unique leads
  const uniqueLeads = new Set<string>();

  // Add leads from lead_store
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

  // Add leads from whatsapp_conversations
  (whatsappData || []).forEach(lead => {
    const phone = lead.phone_number?.replace(/\D/g, '');
    if (phone && phone.length >= 10) {
      uniqueLeads.add(phone);
    } else if (lead.name) {
      uniqueLeads.add(lead.name.toLowerCase());
    }
  });

  return uniqueLeads.size;
}

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
    const search = searchParams.get('search') || '';
    const planFilter = searchParams.get('plan') || '';
    const capacityFilter = searchParams.get('capacity') || '';
    const statusFilter = searchParams.get('status') || '';

    // Build query
    let query = supabaseAdmin
      .from('companies')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    // Apply plan filter
    if (planFilter) {
      query = query.eq('plan', planFilter);
    }

    // Apply status filter
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // Get total count and companies
    const { data: companies, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw error;
    }

    // Calculate metrics for each company
    const companiesWithMetrics = await Promise.all(
      (companies || []).map(async (company) => {
        const currentLeads = await calculateCompanyLeads(company.id);
        const capacityPercent = (currentLeads / company.max_leads) * 100;

        return {
          ...company,
          current_leads: currentLeads,
          capacity_percent: Math.min(capacityPercent, 100),
        };
      })
    );

    // Apply capacity filter after calculation
    let filteredCompanies = companiesWithMetrics;
    if (capacityFilter) {
      filteredCompanies = companiesWithMetrics.filter((company) => {
        const capacity = company.capacity_percent;
        switch (capacityFilter) {
          case 'under_75':
            return capacity < 75;
          case '75_89':
            return capacity >= 75 && capacity < 90;
          case '90_99':
            return capacity >= 90 && capacity < 100;
          case '100':
            return capacity >= 100;
          default:
            return true;
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        companies: filteredCompanies,
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > page * limit,
      },
    });
  } catch (error: any) {
    console.error('Get companies error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
