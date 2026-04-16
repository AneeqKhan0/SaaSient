# Admin Dashboard - Technical Design Document

## Overview

The Admin Dashboard is a comprehensive administrative interface that enables platform administrators to monitor, manage, and analyze all companies (tenants) in the multi-tenant lead generation SaaS platform. This feature provides centralized oversight of company usage, revenue metrics, system health, and customer success indicators.

The admin dashboard will be built as a separate section of the application accessible at `/admin/dashboard` with its own authentication flow at `/admin/login`. It will leverage the existing design system and component library while introducing new admin-specific components for data visualization and management.

### Key Capabilities

- Real-time monitoring of all companies across the platform
- Company-level drill-down with detailed usage analytics
- Revenue tracking and plan management
- Usage alerts and capacity monitoring
- Company settings and status management
- Audit logging for all administrative actions
- Data export capabilities for offline analysis

### Design Principles

1. **Security First**: Admin access is strictly controlled with separate authentication
2. **Real-time Data**: Leverage Supabase real-time subscriptions for live updates
3. **Performance**: Efficient queries with pagination and caching for scalability
4. **Consistency**: Use existing design system and component patterns
5. **Auditability**: Log all administrative actions for accountability

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard UI                       │
│  (/admin/dashboard, /admin/login, /admin/dashboard/[id])   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Routes Layer                           │
│  /api/admin/companies, /api/admin/metrics, /api/admin/audit │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Admin Client                           │
│         (Service Role Key - Bypasses RLS)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Tables                             │
│  companies, company_members, lead_store,                     │
│  whatsapp_conversations, admin_users, audit_logs            │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
User → /admin/dashboard
  │
  ├─ Not Authenticated → Redirect to /admin/login
  │                          │
  │                          ▼
  │                    Admin Login Form
  │                          │
  │                          ▼
  │                    Verify admin_users table
  │                          │
  │                          ▼
  │                    Set admin session cookie
  │                          │
  │                          └─→ Redirect to /admin/dashboard
  │
  └─ Authenticated → Verify admin session
                          │
                          ├─ Valid → Allow access
                          └─ Invalid → Redirect to /admin/login
```

### Data Flow

1. **Initial Load**: Fetch paginated company list with aggregate metrics
2. **Real-time Updates**: Subscribe to changes in companies, lead_store, whatsapp_conversations
3. **Drill-down**: Lazy-load detailed company data on selection
4. **Actions**: Update operations trigger audit log entries
5. **Export**: Generate CSV files server-side and stream to client

## Components and Interfaces

### Page Components

#### 1. AdminLoginPage (`/app/admin/login/page.tsx`)

Admin authentication page with separate credential system.

**Props**: None (page component)

**State**:
- `email: string` - Admin email
- `password: string` - Admin password
- `loading: boolean` - Login in progress
- `error: string | null` - Error message

**Key Methods**:
- `handleLogin()` - Authenticate admin user
- `validateCredentials()` - Client-side validation

#### 2. AdminDashboardPage (`/app/admin/dashboard/page.tsx`)

Main admin dashboard with company overview and metrics.

**Props**: None (page component)

**State**:
- `companies: Company[]` - List of all companies
- `metrics: PlatformMetrics` - Aggregate platform metrics
- `loading: boolean` - Data loading state
- `searchQuery: string` - Search filter
- `filterPlan: string | null` - Plan filter
- `filterCapacity: string | null` - Capacity filter
- `selectedCompanyId: string | null` - Active company for drill-down
- `currentPage: number` - Pagination state

**Key Methods**:
- `loadCompanies()` - Fetch paginated company list
- `loadMetrics()` - Calculate platform-wide metrics
- `handleSearch()` - Filter companies by search query
- `handleFilter()` - Apply plan/capacity filters
- `handleCompanySelect()` - Show company detail view
- `handleExport()` - Generate CSV export

#### 3. CompanyDetailPanel (`/app/components/admin/CompanyDetailPanel.tsx`)

Detailed view of a single company with usage analytics and management controls.

**Props**:
```typescript
{
  companyId: string;
  onClose: () => void;
}
```

**State**:
- `company: CompanyDetail | null` - Full company data
- `leads: LeadSummary` - Lead counts and breakdown
- `members: CompanyMember[]` - Company users
- `recentActivity: Activity[]` - Recent lead activity
- `loading: boolean`
- `editMode: boolean` - Settings edit mode

**Key Methods**:
- `loadCompanyDetail()` - Fetch complete company data
- `handleUpdateSettings()` - Update company settings
- `handleSuspend()` - Suspend company access
- `handleActivate()` - Restore company access

### Shared Components

#### 4. AdminDataTable (`/app/components/admin/AdminDataTable.tsx`)

Reusable table component for displaying company data with sorting, filtering, and pagination.

**Props**:
```typescript
{
  data: any[];
  columns: ColumnDef[];
  loading: boolean;
  onRowClick?: (row: any) => void;
  sortable?: boolean;
  pagination?: PaginationConfig;
}
```

#### 5. MetricCard (`/app/components/admin/MetricCard.tsx`)

Display card for key metrics with trend indicators.

**Props**:
```typescript
{
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  status?: 'normal' | 'warning' | 'critical';
}
```

#### 6. CompanyStatusBadge (`/app/components/admin/CompanyStatusBadge.tsx`)

Visual indicator for company status and capacity.

**Props**:
```typescript
{
  status: 'active' | 'suspended';
  capacityPercent: number;
}
```

#### 7. AuditLogViewer (`/app/components/admin/AuditLogViewer.tsx`)

Searchable audit log interface.

**Props**:
```typescript
{
  companyId?: string; // Optional filter by company
  adminId?: string;   // Optional filter by admin
  startDate?: Date;
  endDate?: Date;
}
```

### API Routes

#### 1. GET `/api/admin/companies`

Fetch paginated list of companies with basic metrics.

**Query Parameters**:
- `page: number` - Page number (default: 1)
- `limit: number` - Items per page (default: 50)
- `search: string` - Search by name or slug
- `plan: string` - Filter by plan type
- `capacity: string` - Filter by capacity range

**Response**:
```typescript
{
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    max_leads: number;
    current_leads: number;
    capacity_percent: number;
    status: 'active' | 'suspended';
    created_at: string;
  }>;
  total: number;
  page: number;
  limit: number;
}
```

#### 2. GET `/api/admin/companies/[id]`

Fetch detailed information for a specific company.

**Response**:
```typescript
{
  company: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    max_leads: number;
    max_documents: number;
    status: 'active' | 'suspended';
    created_at: string;
    contact_email: string;
    contact_phone: string;
  };
  leads: {
    total: number;
    voice_agent: number;
    whatsapp_agent: number;
    whatsapp_conversations: number;
    hot: number;
    warm: number;
    cold: number;
    today: number;
    this_week: number;
    this_month: number;
  };
  members: Array<{
    user_id: string;
    email: string;
    role: string;
    created_at: string;
  }>;
  recent_activity: Array<{
    id: string;
    customer_name: string;
    source: string;
    category: string;
    created_at: string;
  }>;
}
```

#### 3. GET `/api/admin/metrics`

Fetch platform-wide aggregate metrics.

**Response**:
```typescript
{
  total_companies: number;
  total_mrr: number;
  total_arr: number;
  total_leads: number;
  companies_at_capacity: number;
  companies_near_capacity: number;
  plan_distribution: {
    starter: number;
    pro: number;
    enterprise: number;
  };
  growth_trends: {
    companies_this_month: number;
    companies_last_month: number;
    leads_this_month: number;
    leads_last_month: number;
  };
}
```

#### 4. PATCH `/api/admin/companies/[id]`

Update company settings.

**Request Body**:
```typescript
{
  name?: string;
  slug?: string;
  plan?: string;
  max_leads?: number;
  status?: 'active' | 'suspended';
}
```

**Response**:
```typescript
{
  success: boolean;
  company: Company;
  audit_log_id: string;
}
```

#### 5. GET `/api/admin/audit-logs`

Fetch audit log entries.

**Query Parameters**:
- `company_id: string` - Filter by company
- `admin_id: string` - Filter by admin
- `action: string` - Filter by action type
- `start_date: string` - Start date filter
- `end_date: string` - End date filter
- `page: number`
- `limit: number`

**Response**:
```typescript
{
  logs: Array<{
    id: string;
    admin_id: string;
    admin_email: string;
    company_id: string;
    company_name: string;
    action: string;
    before_value: any;
    after_value: any;
    created_at: string;
  }>;
  total: number;
}
```

#### 6. POST `/api/admin/export`

Generate CSV export of company data.

**Request Body**:
```typescript
{
  type: 'companies' | 'revenue' | 'usage_alerts';
  filters?: {
    plan?: string;
    capacity?: string;
    date_range?: { start: string; end: string };
  };
}
```

**Response**: CSV file stream

## Data Models

### Database Schema Changes

#### New Table: `admin_users`

Stores admin user credentials separate from regular users.

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
```

#### New Table: `audit_logs`

Immutable log of all administrative actions.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  company_id UUID REFERENCES companies(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_value JSONB,
  after_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

#### Modified Table: `companies`

Add status field for suspension capability.

```sql
ALTER TABLE companies 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'));

CREATE INDEX idx_companies_status ON companies(status);
```

### TypeScript Interfaces

```typescript
// Core Types
interface Company {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'enterprise';
  max_leads: number;
  max_documents: number;
  status: 'active' | 'suspended';
  created_at: string;
}

interface CompanyWithMetrics extends Company {
  current_leads: number;
  capacity_percent: number;
  leads_today: number;
  leads_this_week: number;
  leads_this_month: number;
  avg_leads_per_day: number;
  days_until_limit: number | null;
}

interface CompanyDetail extends CompanyWithMetrics {
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

interface CompanyMember {
  user_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  last_login_at: string | null;
}

interface LeadActivity {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  source: string;
  category: string;
  created_at: string;
}

interface PlatformMetrics {
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

interface AuditLog {
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

interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

// Filter and Pagination Types
interface CompanyFilters {
  search?: string;
  plan?: 'starter' | 'pro' | 'enterprise';
  capacity?: 'under_75' | '75_89' | '90_99' | '100';
  status?: 'active' | 'suspended';
}

interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining the correctness properties, I need to analyze the acceptance criteria from the requirements document to determine which are testable as properties, examples, or edge cases.


### Property Reflection

After analyzing all acceptance criteria, I've identified several areas where properties can be consolidated:

**Redundancy Analysis:**

1. **Capacity Filtering (2.3, 2.4, 7.1, 7.2)**: Properties 2.3 and 7.1 both test "companies at 90% capacity", and 2.4 and 7.2 both test "companies at 100% capacity". These can be combined into single properties about capacity filtering.

2. **Aggregation Properties (2.1, 2.5, 9.1, 9.3, 9.4)**: Multiple properties test basic aggregation (total companies, total leads, average leads). These can be consolidated into properties about correct aggregation across the platform.

3. **Audit Logging (5.5, 6.7, 14.1, 14.2, 14.3, 14.4)**: Multiple properties test that audit logs are created for different actions. These can be combined into a single property about audit log creation for any administrative action.

4. **Real-time Subscriptions (11.1, 11.2, 11.3)**: These three properties all test subscription setup for different tables. Can be combined into one property about real-time subscription setup.

5. **Export Functionality (13.1, 13.3, 13.4)**: All three test CSV export for different data types. Can be combined into one property about CSV export generation.

6. **Lead Breakdown (4.4, 4.5)**: Both test categorization of leads. Can be combined into one property about lead categorization.

7. **Status Management (6.1, 6.2)**: Both test status updates. Can be combined into one property about status transitions.

8. **Access Control (6.3, 6.4)**: Both test access control based on company status. Can be combined into one property about status-based access control.

**Consolidated Properties:**

After reflection, I've reduced the testable properties from 80+ to approximately 40 unique, non-redundant properties that provide comprehensive coverage without duplication.

### Correctness Properties

#### Authentication and Access Control

### Property 1: Unauthenticated Admin Redirect

*For any* unauthenticated request to /admin/dashboard or any admin route, the system should redirect to /admin/login.

**Validates: Requirements 1.2**

### Property 2: Admin Bypass Company Membership

*For any* authenticated admin user and any company in the system, the admin should be able to access that company's data without being a member of that company.

**Validates: Requirements 1.3, 1.4**

#### Company List and Metrics

### Property 3: Company Count Accuracy

*For any* database state, the displayed total company count should equal the actual number of companies in the companies table.

**Validates: Requirements 2.1**

### Property 4: MRR Calculation Accuracy

*For any* set of active companies with assigned plans, the total MRR should equal the sum of plan values for all companies where status = 'active'.

**Validates: Requirements 2.2, 8.1**

### Property 5: ARR Calculation

*For any* calculated MRR value, the ARR should equal MRR multiplied by 12.

**Validates: Requirements 8.2**

### Property 6: Capacity Filtering Accuracy

*For any* capacity threshold (90%, 100%, or any percentage), the filtered company list should only include companies where (current_leads / max_leads) * 100 meets the threshold criteria.

**Validates: Requirements 2.3, 2.4, 7.1, 7.2**

### Property 7: Total Leads Aggregation

*For any* set of companies, the total leads count should equal the sum of leads from lead_store and whatsapp_conversations across all companies.

**Validates: Requirements 2.5, 9.1**

### Property 8: Plan Distribution Accuracy

*For any* set of companies, the plan distribution should correctly count the number of companies on each plan type (starter, pro, enterprise).

**Validates: Requirements 2.7, 8.4**

#### Search and Filtering

### Property 9: Search Filtering

*For any* search term, the filtered company list should only include companies where the company name or slug contains the search term (case-insensitive).

**Validates: Requirements 3.3**

### Property 10: Plan Filter

*For any* plan type filter, the filtered company list should only include companies with that specific plan.

**Validates: Requirements 3.4**

### Property 11: Capacity Range Filter

*For any* capacity range filter (under_75, 75_89, 90_99, 100), the filtered company list should only include companies whose capacity percentage falls within that range.

**Validates: Requirements 3.5**

### Property 12: Pagination Boundaries

*For any* page number and limit, the returned companies should be correctly sliced from the full result set with start_index = (page - 1) * limit and end_index = page * limit.

**Validates: Requirements 3.7, 15.2**

### Property 13: Sort Order Correctness

*For any* sort column and direction (ascending/descending), the returned companies should be ordered according to that column's values in the specified direction.

**Validates: Requirements 3.6**

#### Company Detail View

### Property 14: Company Detail Completeness

*For any* company, the detail view should display all required fields: name, slug, plan, created_at, contact_email, contact_phone, max_leads, max_documents, and status.

**Validates: Requirements 4.2**

### Property 15: Lead Count Aggregation

*For any* company, the current leads count should equal the sum of leads from lead_store (where company_id matches) plus unique leads from whatsapp_conversations (where company_id matches).

**Validates: Requirements 4.3**

### Property 16: Lead Categorization

*For any* company, leads should be correctly grouped by source (Voice Agent, WhatsApp Agent, WhatsApp Conversations) and by category (HOT, WARM, COLD), with counts matching the database.

**Validates: Requirements 4.4, 4.5**

### Property 17: Time-Based Lead Filtering

*For any* company and time period (today, this week, this month), the lead count for that period should equal the number of leads where the created_at or appointment_time falls within that period.

**Validates: Requirements 4.6**

### Property 18: Company Members Retrieval

*For any* company, the members list should include all users from company_members table where company_id matches, with their correct roles and email addresses.

**Validates: Requirements 4.7**

### Property 19: Recent Activity Ordering

*For any* company, the recent activity list should be ordered by created_at or appointment_time in descending order (most recent first).

**Validates: Requirements 4.8**

#### Company Settings Management

### Property 20: Max Leads Validation

*For any* max_leads update value, if the value is less than or equal to zero, the update should be rejected with a validation error.

**Validates: Requirements 5.3**

### Property 21: Settings Update Persistence

*For any* company settings update (name, slug, plan, max_leads), after the update completes, querying the companies table should return the new values.

**Validates: Requirements 5.4**

### Property 22: Max Leads Warning

*For any* company, when attempting to set max_leads to a value less than current_leads, the system should display a warning message (but may still allow the update).

**Validates: Requirements 5.6**

#### Company Status Management

### Property 23: Status Transition

*For any* company with status 'active', the system should be able to transition it to 'suspended', and for any company with status 'suspended', the system should be able to transition it to 'active'.

**Validates: Requirements 6.1, 6.2**

### Property 24: Suspended Company Access Control

*For any* company with status 'suspended' and any member of that company, attempts to access the regular dashboard should be denied.

**Validates: Requirements 6.3**

### Property 25: Active Company Access Restoration

*For any* company with status 'active' and any member of that company, access to the regular dashboard should be granted (subject to normal authentication).

**Validates: Requirements 6.4**

### Property 26: Status Display

*For any* company with status 'suspended', the company list view should prominently display the suspended status.

**Validates: Requirements 6.5**

#### Usage Monitoring

### Property 27: Days Until Limit Calculation

*For any* company with positive average daily lead growth, days_until_limit should equal (max_leads - current_leads) / avg_leads_per_day, rounded up to the nearest integer.

**Validates: Requirements 7.3**

### Property 28: Negative Growth Identification

*For any* company where leads_this_month < leads_last_month, the company should be identified as having a negative growth trend.

**Validates: Requirements 7.4**

### Property 29: Inactive Company Identification

*For any* company where the most recent lead created_at is more than 7 days ago (or no leads exist), the company should be identified as having zero activity in the last 7 days.

**Validates: Requirements 7.5**

### Property 30: Average Leads Per Day Calculation

*For any* company, the average leads per day should equal total_leads_this_month / current_day_of_month.

**Validates: Requirements 7.7**

#### Revenue Analytics

### Property 31: Revenue Breakdown by Plan

*For any* set of companies grouped by plan, the revenue for each plan should equal the count of companies on that plan multiplied by the plan's monthly value.

**Validates: Requirements 8.3**

### Property 32: Average Revenue Per Company

*For any* set of companies, the average revenue per company should equal total_mrr / total_companies.

**Validates: Requirements 8.5**

### Property 33: Plan Change Tracking

*For any* plan change operation, an audit log entry should be created with action='plan_change', before_value=old_plan, and after_value=new_plan.

**Validates: Requirements 8.6**

### Property 34: Revenue Growth Calculation

*For any* two consecutive months, the revenue growth percentage should equal ((current_month_mrr - last_month_mrr) / last_month_mrr) * 100.

**Validates: Requirements 8.7**

#### System Health Monitoring

### Property 35: Average Leads Per Company

*For any* set of companies, the average leads per company should equal total_leads / total_companies.

**Validates: Requirements 9.4**

### Property 36: System-Wide Aggregation

*For any* database state, system-wide metrics (total leads, total appointments, total messages) should equal the sum of those metrics across all companies.

**Validates: Requirements 9.2, 9.3, 9.7**

#### Customer Success Metrics

### Property 37: Lead Quality Distribution

*For any* set of companies, the average lead quality distribution should correctly calculate the percentage of HOT, WARM, and COLD leads across all companies.

**Validates: Requirements 10.1**

### Property 38: High Quality Lead Identification

*For any* quality threshold (e.g., 50% HOT leads), companies should be identified where (hot_leads / total_leads) * 100 >= threshold.

**Validates: Requirements 10.3**

### Property 39: Appointment Conversion Rate

*For any* company, the appointment conversion rate should equal (total_appointments / total_leads) * 100.

**Validates: Requirements 10.4**

### Property 40: Inactive Company Identification (30 days)

*For any* company where the most recent lead created_at is more than 30 days ago (or no leads exist), the company should be identified as inactive.

**Validates: Requirements 10.5**

### Property 41: Customer Tenure Calculation

*For any* company, the tenure in days should equal the number of days between created_at and the current date.

**Validates: Requirements 10.6**

#### Data Export

### Property 42: CSV Export Structure

*For any* export type (companies, revenue, usage_alerts), the generated CSV should have a header row followed by data rows, with proper comma separation and UTF-8 encoding.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.6**

### Property 43: Export Filename Format

*For any* export operation, the generated filename should include the export type and a timestamp in ISO format.

**Validates: Requirements 13.7**

#### Audit Logging

### Property 44: Audit Log Creation

*For any* administrative action (settings change, status change, plan change, max_leads change), an audit log entry should be created with admin_id, company_id, action, before_value, after_value, and timestamp.

**Validates: Requirements 5.5, 6.7, 14.1, 14.2, 14.3, 14.4**

### Property 45: Audit Log Search

*For any* audit log filter criteria (company_id, admin_id, action, date_range), the returned logs should only include entries matching all specified criteria.

**Validates: Requirements 14.6**

### Property 46: Audit Log Immutability

*For any* audit log entry, attempts to delete or modify the entry should fail with an error.

**Validates: Requirements 14.7**

#### Performance and Caching

### Property 47: Metrics Caching

*For any* aggregate metrics query, if the same query is made within 30 seconds, the cached result should be returned without querying the database again.

**Validates: Requirements 15.4**

### Property 48: Lazy Loading Company Details

*For any* company in the list view, detailed company data (members, recent activity, lead breakdown) should not be fetched until the company is explicitly selected for drill-down.

**Validates: Requirements 15.7**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid admin credentials
   - Expired session
   - Missing authentication token

2. **Authorization Errors**
   - Non-admin user attempting admin access
   - Insufficient permissions for action

3. **Validation Errors**
   - Invalid max_leads value (≤ 0)
   - Invalid plan type
   - Invalid email format
   - Missing required fields

4. **Database Errors**
   - Connection failures
   - Query timeouts
   - Constraint violations
   - Transaction rollback failures

5. **Real-time Connection Errors**
   - Subscription failures
   - Connection drops
   - Reconnection failures

6. **Export Errors**
   - CSV generation failures
   - File size limits exceeded
   - Encoding errors

### Error Handling Strategies

#### Client-Side Error Handling

```typescript
// API call wrapper with error handling
async function adminApiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (response.status === 401) {
      // Redirect to admin login
      window.location.href = '/admin/login';
      throw new Error('Authentication required');
    }

    if (response.status === 403) {
      throw new Error('Insufficient permissions');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      throw new Error('Network connection failed. Please check your internet connection.');
    }
    throw error;
  }
}
```

#### Server-Side Error Handling

```typescript
// API route error handler
export async function handleAdminRequest<T>(
  handler: () => Promise<T>
): Promise<NextResponse> {
  try {
    const result = await handler();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Admin API error:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { success: false, error: 'Database operation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Real-time Error Handling

```typescript
// Supabase subscription with error handling and reconnection
function setupRealtimeSubscription(table: string, callback: () => void) {
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  const subscribe = () => {
    const channel = supabase
      .channel(`admin-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          reconnectAttempts = 0;
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setTimeout(() => {
              supabase.removeChannel(channel);
              subscribe();
            }, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000));
          } else {
            setConnectionStatus('failed');
            showError('Real-time connection failed. Please refresh the page.');
          }
        }
      });

    return channel;
  };

  return subscribe();
}
```

### Error Messages

All error messages should be:
- **User-friendly**: Avoid technical jargon
- **Actionable**: Suggest next steps when possible
- **Specific**: Clearly indicate what went wrong
- **Logged**: Server-side errors logged for debugging

Example error messages:
- ✅ "Unable to update company settings. Please ensure max leads is greater than 0."
- ✅ "Connection lost. Attempting to reconnect..."
- ✅ "Export failed. The data set is too large. Try filtering to reduce the number of records."
- ❌ "Error: ECONNREFUSED"
- ❌ "Unhandled exception in handler"

## Testing Strategy

### Dual Testing Approach

The admin dashboard will use both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and UI interactions
- **Property tests**: Verify universal properties across all inputs using randomized data

### Property-Based Testing

We will use **fast-check** (for TypeScript/JavaScript) to implement property-based tests. Each correctness property defined above will be implemented as a property test.

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: admin-dashboard, Property {N}: {property_text}`

**Example Property Test**:

```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Feature: admin-dashboard, Property 4: MRR Calculation Accuracy', () => {
  it('should calculate MRR as sum of active company plan values', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            plan: fc.constantFrom('starter', 'pro', 'enterprise'),
            status: fc.constantFrom('active', 'suspended'),
          })
        ),
        (companies) => {
          const planValues = {
            starter: 29,
            pro: 99,
            enterprise: 299,
          };

          const expectedMRR = companies
            .filter(c => c.status === 'active')
            .reduce((sum, c) => sum + planValues[c.plan], 0);

          const actualMRR = calculateMRR(companies);

          expect(actualMRR).toBe(expectedMRR);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

Unit tests will focus on:

1. **Component Rendering**: Verify components render without errors
2. **User Interactions**: Test button clicks, form submissions, navigation
3. **Edge Cases**: Empty states, maximum values, boundary conditions
4. **Error Handling**: Verify error messages display correctly
5. **API Integration**: Mock API responses and test data flow

**Example Unit Test**:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminDashboardPage } from './page';

describe('AdminDashboardPage', () => {
  it('should redirect to login when not authenticated', async () => {
    const mockPush = vi.fn();
    vi.mock('next/navigation', () => ({
      useRouter: () => ({ push: mockPush }),
    }));

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('should display company list when authenticated', async () => {
    const mockCompanies = [
      { id: '1', name: 'Company A', plan: 'pro', current_leads: 50, max_leads: 100 },
      { id: '2', name: 'Company B', plan: 'starter', current_leads: 20, max_leads: 50 },
    ];

    vi.mock('./api', () => ({
      fetchCompanies: vi.fn().mockResolvedValue(mockCompanies),
    }));

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Company A')).toBeInTheDocument();
      expect(screen.getByText('Company B')).toBeInTheDocument();
    });
  });

  it('should filter companies by search term', async () => {
    render(<AdminDashboardPage />);

    const searchInput = screen.getByPlaceholderText('Search companies...');
    fireEvent.change(searchInput, { target: { value: 'Company A' } });

    await waitFor(() => {
      expect(screen.getByText('Company A')).toBeInTheDocument();
      expect(screen.queryByText('Company B')).not.toBeInTheDocument();
    });
  });
});
```

### Integration Testing

Integration tests will verify:

1. **API Routes**: Test full request/response cycle
2. **Database Operations**: Test queries with test database
3. **Authentication Flow**: Test login and session management
4. **Real-time Subscriptions**: Test Supabase real-time updates
5. **Audit Logging**: Verify logs are created for actions

**Example Integration Test**:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, cleanupTestDatabase } from './test-utils';
import { POST as updateCompanySettings } from './api/admin/companies/[id]/route';

describe('Company Settings Update Integration', () => {
  let testDb;

  beforeEach(async () => {
    testDb = await createTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase(testDb);
  });

  it('should update company settings and create audit log', async () => {
    // Create test company
    const company = await testDb.companies.create({
      name: 'Test Company',
      plan: 'starter',
      max_leads: 50,
    });

    // Create test admin
    const admin = await testDb.adminUsers.create({
      email: 'admin@test.com',
    });

    // Update company settings
    const request = new Request('http://localhost/api/admin/companies/' + company.id, {
      method: 'PATCH',
      body: JSON.stringify({ max_leads: 100 }),
      headers: { 'x-admin-id': admin.id },
    });

    const response = await updateCompanySettings(request, { params: { id: company.id } });
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.company.max_leads).toBe(100);

    // Verify audit log was created
    const auditLog = await testDb.auditLogs.findFirst({
      where: { company_id: company.id, action: 'update_max_leads' },
    });

    expect(auditLog).toBeDefined();
    expect(auditLog.admin_id).toBe(admin.id);
    expect(auditLog.before_value).toBe(50);
    expect(auditLog.after_value).toBe(100);
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 48 correctness properties implemented
- **Integration Test Coverage**: All API routes and critical user flows
- **E2E Test Coverage**: Key admin workflows (login, company management, export)

### Testing Tools

- **Unit Testing**: Vitest + React Testing Library
- **Property Testing**: fast-check
- **Integration Testing**: Vitest + Supabase test client
- **E2E Testing**: Playwright
- **Coverage**: Vitest coverage reporter

