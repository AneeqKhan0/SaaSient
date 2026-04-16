import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

// Simple in-memory cache
let metricsCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds

// Plan pricing (monthly)
const PLAN_PRICING = {
  starter: 29,
  pro: 99,
  enterprise: 299,
};

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

    // Check cache
    const now = Date.now();
    if (metricsCache && (now - metricsCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: metricsCache.data,
        cached: true,
      });
    }

    // Get all companies
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('*');

    if (companiesError) {
      throw companiesError;
    }

    // Calculate metrics
    const totalCompanies = companies?.length || 0;
    const activeCompanies = companies?.filter(c => c.status === 'active') || [];
    
    // Calculate MRR and ARR
    const totalMRR = activeCompanies.reduce((sum, company) => {
      return sum + (PLAN_PRICING[company.plan as keyof typeof PLAN_PRICING] || 0);
    }, 0);
    const totalARR = totalMRR * 12;

    // Calculate plan distribution
    const planDistribution: Record<string, number> = {
      starter: 0,
      pro: 0,
      enterprise: 0,
    };
    companies?.forEach(company => {
      if (planDistribution[company.plan] !== undefined) {
        planDistribution[company.plan]++;
      }
    });

    // Calculate lead metrics for all companies
    let totalLeads = 0;
    let companiesAtCapacity = 0;
    let companiesNearCapacity = 0;
    let inactiveCompanies = 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const company of companies || []) {
      // Get leads from lead_store
      const { data: leadStoreData } = await supabaseAdmin
        .from('lead_store')
        .select('phone, email, Full_name, First_Name, Last_Name, created_at, appointment_time, date')
        .eq('company_id', company.id);

      // Get leads from whatsapp_conversations
      const { data: whatsappData } = await supabaseAdmin
        .from('whatsapp_conversations')
        .select('phone_number, name, updated_at')
        .eq('company_id', company.id);

      // Calculate unique leads
      const uniqueLeads = new Set<string>();
      let hasRecentActivity = false;

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

        // Check for recent activity
        const leadDate = new Date(lead.appointment_time || lead.date || lead.created_at);
        if (leadDate >= thirtyDaysAgo) {
          hasRecentActivity = true;
        }
      });

      (whatsappData || []).forEach(conv => {
        const phone = conv.phone_number?.replace(/\D/g, '');
        if (phone && phone.length >= 10) {
          uniqueLeads.add(phone);
        } else if (conv.name) {
          uniqueLeads.add(conv.name.toLowerCase());
        }

        const convDate = new Date(conv.updated_at);
        if (convDate >= thirtyDaysAgo) {
          hasRecentActivity = true;
        }
      });

      const currentLeads = uniqueLeads.size;
      totalLeads += currentLeads;

      // Check capacity
      const capacityPercent = (currentLeads / company.max_leads) * 100;
      if (capacityPercent >= 100) {
        companiesAtCapacity++;
      } else if (capacityPercent >= 90) {
        companiesNearCapacity++;
      }

      // Check for inactive companies
      if (!hasRecentActivity) {
        inactiveCompanies++;
      }
    }

    const avgLeadsPerCompany = totalCompanies > 0 ? totalLeads / totalCompanies : 0;
    const avgRevenuePerCompany = totalCompanies > 0 ? totalMRR / totalCompanies : 0;

    const metrics = {
      total_companies: totalCompanies,
      total_mrr: totalMRR,
      total_arr: totalARR,
      total_leads: totalLeads,
      companies_at_capacity: companiesAtCapacity,
      companies_near_capacity: companiesNearCapacity,
      inactive_companies: inactiveCompanies,
      plan_distribution: planDistribution,
      avg_leads_per_company: Math.round(avgLeadsPerCompany * 10) / 10,
      avg_revenue_per_company: Math.round(avgRevenuePerCompany * 100) / 100,
    };

    // Update cache
    metricsCache = {
      data: metrics,
      timestamp: now,
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      cached: false,
    });
  } catch (error: any) {
    console.error('Get metrics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
