// TypeScript interfaces and types for Admin Dashboard

// Core Company Types
export interface Company {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'enterprise';
  max_leads: number;
  max_documents: number;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface CompanyWithMetrics extends Company {
  current_leads: number;
  capacity_percent: number;
  leads_today: number;
  leads_this_week: number;
  leads_this_month: number;
  avg_leads_per_day: number;
  days_until_limit: number | null;
}

export interface CompanyDetail extends CompanyWithMetrics {
  contact_email: string;
  contact_phone: string;
  lead_breakdown: {
    voice_agent: number;
    whatsapp_agent: number;
    whatsapp_conversations: number;
    hot: number;
    warm: number;
    cold: number;
  };
  members: CompanyMember[];
  recent_activity: LeadActivity[];
}

// Company Member Types
export interface CompanyMember {
  user_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  last_login_at: string | null;
}

// Lead Activity Types
export interface LeadActivity {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  source: string;
  category: string;
  created_at: string;
}

// Platform Metrics Types
export interface PlatformMetrics {
  total_companies: number;
  total_mrr: number;
  total_arr: number;
  total_leads: number;
  companies_at_capacity: number;
  companies_near_capacity: number;
  inactive_companies: number;
  plan_distribution: Record<string, number>;
  avg_leads_per_company: number;
  avg_revenue_per_company: number;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  company_id: string | null;
  company_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_value: any;
  after_value: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// Admin User Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

// Filter and Pagination Types
export interface CompanyFilters {
  search?: string;
  plan?: 'starter' | 'pro' | 'enterprise';
  capacity?: 'under_75' | '75_89' | '90_99' | '100';
  status?: 'active' | 'suspended';
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Export Types for specific API responses
export interface CompaniesListResponse extends PaginatedResponse<CompanyWithMetrics> {}

export interface CompanyDetailResponse {
  company: CompanyDetail;
}

export interface MetricsResponse {
  metrics: PlatformMetrics;
}

export interface AuditLogsResponse extends PaginatedResponse<AuditLog> {}

// Update Request Types
export interface UpdateCompanyRequest {
  name?: string;
  slug?: string;
  plan?: 'starter' | 'pro' | 'enterprise';
  max_leads?: number;
  status?: 'active' | 'suspended';
}

// Export Request Types
export type ExportType = 'companies' | 'revenue' | 'usage_alerts';

export interface ExportRequest {
  type: ExportType;
  filters?: {
    plan?: string;
    capacity?: string;
    date_range?: {
      start: string;
      end: string;
    };
  };
}
