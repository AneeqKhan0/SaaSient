import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase service role credentials');
}

// Admin client with service role key - bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper functions for common admin queries

/**
 * Get all companies with basic info
 */
export async function getAllCompanies() {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

/**
 * Get company by ID with full details
 */
export async function getCompanyById(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Update company settings
 */
export async function updateCompany(companyId: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(log: {
  admin_id: string;
  company_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_value?: any;
  after_value?: any;
  ip_address?: string;
  user_agent?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .insert(log)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get lead count for a company
 */
export async function getCompanyLeadCount(companyId: string) {
  // Count from lead_store
  const { count: leadStoreCount, error: leadStoreError } = await supabaseAdmin
    .from('lead_store')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);
  
  if (leadStoreError) throw leadStoreError;
  
  // Count from whatsapp_conversations
  const { count: whatsappCount, error: whatsappError } = await supabaseAdmin
    .from('whatsapp_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);
  
  if (whatsappError) throw whatsappError;
  
  return (leadStoreCount || 0) + (whatsappCount || 0);
}
