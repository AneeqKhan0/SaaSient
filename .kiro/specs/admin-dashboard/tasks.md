# Implementation Plan: Admin Dashboard

## Overview

This implementation plan creates a comprehensive admin dashboard for platform administrators to monitor and manage all companies (tenants) in the multi-tenant SaaS platform. The implementation follows a bottom-up approach: database schema → API routes → shared components → page components → testing.

The admin dashboard will be built using TypeScript, Next.js 16, React 19, and Supabase, following the existing design patterns from the regular dashboard while introducing admin-specific functionality.

## Tasks

- [x] 1. Set up database schema and admin infrastructure
  - [x] 1.1 Create admin_users table with authentication fields
    - Create migration file for admin_users table with id, email, password_hash, name, created_at, last_login_at, is_active
    - Add indexes on email column for fast lookups
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.2 Create audit_logs table for tracking admin actions
    - Create migration file for audit_logs table with admin_id, company_id, action, entity_type, entity_id, before_value, after_value, ip_address, user_agent, created_at
    - Add indexes on admin_id, company_id, created_at, and action columns
    - Make table immutable with RLS policies
    - _Requirements: 5.5, 6.7, 14.1, 14.2, 14.3, 14.4, 14.5, 14.7_
  
  - [x] 1.3 Add status column to companies table
    - Create migration to add status column with CHECK constraint for 'active' or 'suspended'
    - Set default value to 'active'
    - Add index on status column
    - _Requirements: 6.1, 6.2, 6.5_
  
  - [x] 1.4 Create Supabase admin client with service role
    - Create lib/supabase-admin.ts if it doesn't exist or verify it uses service role key
    - Ensure it bypasses RLS for admin operations
    - Add helper functions for common admin queries
    - _Requirements: 1.3, 1.4_

- [x] 2. Implement core TypeScript interfaces and types
  - [x] 2.1 Create admin dashboard type definitions
    - Create types file at app/types/admin.ts with Company, CompanyWithMetrics, CompanyDetail, CompanyMember, LeadActivity, PlatformMetrics, AuditLog, AdminUser, CompanyFilters, PaginationConfig interfaces
    - Add API response types: ApiResponse<T>, PaginatedResponse<T>
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 4.1, 4.2_
  
  - [ ]* 2.2 Write property test for type definitions
    - **Property 14: Company Detail Completeness**
    - **Validates: Requirements 4.2**

- [x] 3. Implement admin authentication API routes
  - [x] 3.1 Create POST /api/admin/auth/login route
    - Implement admin login with email/password validation
    - Query admin_users table and verify password hash
    - Set secure HTTP-only session cookie on success
    - Update last_login_at timestamp
    - Return admin user info (excluding password_hash)
    - _Requirements: 1.2_
  
  - [x] 3.2 Create POST /api/admin/auth/logout route
    - Clear admin session cookie
    - Return success response
    - _Requirements: 1.2_
  
  - [x] 3.3 Create GET /api/admin/auth/session route
    - Verify admin session cookie
    - Return current admin user or 401 if not authenticated
    - _Requirements: 1.2, 1.4_
  
  - [ ]* 3.4 Write property tests for authentication
    - **Property 1: Unauthenticated Admin Redirect**
    - **Validates: Requirements 1.2**

- [x] 4. Implement company data API routes
  - [x] 4.1 Create GET /api/admin/companies route
    - Implement pagination with page and limit query params (default: page=1, limit=50)
    - Implement search filtering by company name or slug (case-insensitive)
    - Implement plan filter (starter, pro, enterprise)
    - Implement capacity filter (under_75, 75_89, 90_99, 100)
    - Implement status filter (active, suspended)
    - Calculate current_leads by counting from lead_store and whatsapp_conversations
    - Calculate capacity_percent as (current_leads / max_leads) * 100
    - Return paginated response with companies array, total count, page, limit, has_more
    - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.7_
  
  - [ ]* 4.2 Write property tests for company list API
    - **Property 3: Company Count Accuracy**
    - **Property 9: Search Filtering**
    - **Property 10: Plan Filter**
    - **Property 11: Capacity Range Filter**
    - **Property 12: Pagination Boundaries**
    - **Validates: Requirements 2.1, 3.3, 3.4, 3.5, 3.7, 15.2**
  
  - [x] 4.3 Create GET /api/admin/companies/[id] route
    - Fetch complete company details from companies table
    - Calculate lead counts: total, voice_agent, whatsapp_agent, whatsapp_conversations
    - Calculate lead breakdown by category: hot, warm, cold
    - Calculate time-based metrics: leads today, this week, this month
    - Fetch company members from company_members table with user details
    - Fetch recent activity (last 20 leads) ordered by created_at DESC
    - Return CompanyDetail object
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [ ]* 4.4 Write property tests for company detail API
    - **Property 15: Lead Count Aggregation**
    - **Property 16: Lead Categorization**
    - **Property 17: Time-Based Lead Filtering**
    - **Property 18: Company Members Retrieval**
    - **Property 19: Recent Activity Ordering**
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**
  
  - [x] 4.5 Create PATCH /api/admin/companies/[id] route
    - Validate request body for allowed fields: name, slug, plan, max_leads, status
    - Validate max_leads > 0 if provided
    - Fetch current company values (before_value)
    - Update companies table with new values
    - Create audit log entry with admin_id, company_id, action, before_value, after_value
    - Return updated company and audit_log_id
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 6.1, 6.2_
  
  - [ ]* 4.6 Write property tests for company update API
    - **Property 20: Max Leads Validation**
    - **Property 21: Settings Update Persistence**
    - **Property 23: Status Transition**
    - **Property 44: Audit Log Creation**
    - **Validates: Requirements 5.3, 5.4, 5.5, 6.1, 6.2, 14.1**

- [x] 5. Implement platform metrics API route
  - [x] 5.1 Create GET /api/admin/metrics route
    - Calculate total_companies count
    - Calculate total_mrr by summing plan values for active companies
    - Calculate total_arr as total_mrr * 12
    - Calculate total_leads across all companies
    - Count companies_at_capacity (100%)
    - Count companies_near_capacity (90-99%)
    - Count inactive_companies (no leads in 30 days)
    - Calculate plan_distribution (count by plan type)
    - Calculate avg_leads_per_company
    - Calculate avg_revenue_per_company
    - Implement 30-second caching for metrics
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 7.1, 7.2, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.4, 10.5, 15.4_
  
  - [ ]* 5.2 Write property tests for metrics API
    - **Property 4: MRR Calculation Accuracy**
    - **Property 5: ARR Calculation**
    - **Property 6: Capacity Filtering Accuracy**
    - **Property 7: Total Leads Aggregation**
    - **Property 8: Plan Distribution Accuracy**
    - **Property 32: Average Revenue Per Company**
    - **Property 35: Average Leads Per Company**
    - **Property 47: Metrics Caching**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.7, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.4, 15.4**

- [x] 6. Implement audit log API route
  - [x] 6.1 Create GET /api/admin/audit-logs route
    - Implement pagination with page and limit query params
    - Implement filtering by company_id, admin_id, action, start_date, end_date
    - Join with admin_users to get admin_email
    - Join with companies to get company_name
    - Order by created_at DESC
    - Return paginated audit log entries
    - _Requirements: 14.5, 14.6_
  
  - [ ]* 6.2 Write property tests for audit log API
    - **Property 45: Audit Log Search**
    - **Property 46: Audit Log Immutability**
    - **Validates: Requirements 14.6, 14.7**

- [x] 7. Implement data export API route
  - [x] 7.1 Create POST /api/admin/export route
    - Accept export type: 'companies', 'revenue', 'usage_alerts'
    - Accept optional filters (plan, capacity, date_range)
    - Generate CSV with proper headers and UTF-8 encoding
    - For companies export: include name, slug, plan, max_leads, current_leads, capacity_percent, created_at
    - For revenue export: include company name, plan, mrr, arr, status
    - For usage_alerts export: include company name, capacity_percent, days_until_limit, status
    - Include timestamp in filename (e.g., companies_export_2024-01-15T10-30-00.csv)
    - Stream CSV file to client with proper Content-Type and Content-Disposition headers
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_
  
  - [ ]* 7.2 Write property tests for export API
    - **Property 42: CSV Export Structure**
    - **Property 43: Export Filename Format**
    - **Validates: Requirements 13.1, 13.2, 13.6, 13.7**

- [-] 8. Create shared admin components
  - [x] 8.1 Create AdminDataTable component
    - Create app/components/admin/AdminDataTable.tsx
    - Accept props: data, columns, loading, onRowClick, sortable, pagination
    - Implement sortable column headers
    - Implement row click handler
    - Display loading skeleton when loading=true
    - Display pagination controls if pagination provided
    - Use existing design system colors and styles
    - _Requirements: 3.6, 3.7_
  
  - [x] 8.2 Create MetricCard component
    - Create app/components/admin/MetricCard.tsx
    - Accept props: title, value, icon, trend (direction, value), status
    - Display metric with large value text
    - Display trend indicator with up/down arrow and color
    - Display status badge (normal, warning, critical)
    - Use existing StatCard as reference for styling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 8.3 Create CompanyStatusBadge component
    - Create app/components/admin/CompanyStatusBadge.tsx
    - Accept props: status ('active' | 'suspended'), capacityPercent
    - Display status badge with color coding
    - Display capacity indicator with color: green (<75%), yellow (75-89%), orange (90-99%), red (100%)
    - _Requirements: 2.3, 2.4, 6.5_
  
  - [ ] 8.4 Create CompanyDetailPanel component
    - Create app/components/admin/CompanyDetailPanel.tsx
    - Accept props: companyId, onClose
    - Fetch company detail data from /api/admin/companies/[id]
    - Display company info: name, slug, plan, status, created_at, contact info
    - Display lead metrics: total, by source, by category, time-based
    - Display company members list with roles
    - Display recent activity list
    - Implement edit mode for settings (name, slug, plan, max_leads)
    - Implement suspend/activate buttons with confirmation
    - Call PATCH /api/admin/companies/[id] on save
    - Show warning if max_leads < current_leads
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.6, 6.1, 6.2, 6.6_
  
  - [ ] 8.5 Create AuditLogViewer component
    - Create app/components/admin/AuditLogViewer.tsx
    - Accept props: companyId (optional), adminId (optional), startDate (optional), endDate (optional)
    - Fetch audit logs from /api/admin/audit-logs with filters
    - Display logs in table: timestamp, admin, company, action, before/after values
    - Implement pagination
    - Implement date range filter
    - Implement action type filter
    - _Requirements: 14.5, 14.6_

- [-] 9. Create admin authentication pages
  - [x] 9.1 Create admin login page
    - Create app/admin/login/page.tsx
    - Implement login form with email and password fields
    - Call POST /api/admin/auth/login on submit
    - Display error messages for invalid credentials
    - Redirect to /admin/dashboard on success
    - Use existing AuthForm and AuthLayout components as reference
    - _Requirements: 1.2_
  
  - [ ] 9.2 Create admin layout with auth check
    - Create app/admin/layout.tsx
    - Check admin session on mount by calling GET /api/admin/auth/session
    - Redirect to /admin/login if not authenticated
    - Display admin badge/indicator in header
    - Provide sign out functionality
    - _Requirements: 1.1, 1.2, 1.5_

- [-] 10. Create main admin dashboard page
  - [x] 10.1 Implement admin dashboard overview page
    - Create app/admin/dashboard/page.tsx
    - Fetch platform metrics from /api/admin/metrics
    - Display metric cards: total companies, total MRR, total ARR, total leads, companies at capacity, companies near capacity
    - Display plan distribution chart/stats
    - Fetch company list from /api/admin/companies with pagination
    - Display company list using AdminDataTable
    - Implement search input with debouncing
    - Implement plan filter dropdown
    - Implement capacity filter dropdown
    - Implement status filter dropdown
    - Handle row click to show CompanyDetailPanel
    - Display live indicator showing real-time connection status
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1_
  
  - [ ] 10.2 Implement real-time subscriptions
    - Subscribe to companies table changes
    - Subscribe to lead_store table changes
    - Subscribe to whatsapp_conversations table changes
    - Refresh company list and metrics on changes
    - Display connection status indicator
    - Implement reconnection logic with exponential backoff
    - Show warning when connection is lost
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [ ]* 10.3 Write property tests for real-time updates
    - **Property 48: Lazy Loading Company Details**
    - **Validates: Requirements 11.4, 15.7**

- [ ] 11. Implement usage monitoring features
  - [ ] 11.1 Add usage monitoring calculations to metrics API
    - Calculate days_until_limit for each company: (max_leads - current_leads) / avg_leads_per_day
    - Identify companies with negative growth (leads_this_month < leads_last_month)
    - Identify companies with zero activity in last 7 days
    - Calculate avg_leads_per_day for each company
    - _Requirements: 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [ ] 11.2 Create usage alerts section in dashboard
    - Add section to admin dashboard page showing companies requiring attention
    - Display companies at 90%+ capacity with warning styling
    - Display companies at 100% capacity with critical styling
    - Display inactive companies (no activity in 7 days)
    - Display companies with negative growth trends
    - Show days_until_limit for each company
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [ ]* 11.3 Write property tests for usage monitoring
    - **Property 27: Days Until Limit Calculation**
    - **Property 28: Negative Growth Identification**
    - **Property 29: Inactive Company Identification**
    - **Property 30: Average Leads Per Day Calculation**
    - **Validates: Requirements 7.3, 7.4, 7.5, 7.7**

- [ ] 12. Implement customer success metrics
  - [ ] 12.1 Add customer success calculations to metrics API
    - Calculate average lead quality distribution (HOT, WARM, COLD percentages)
    - Identify companies with declining lead generation (compare month-over-month)
    - Identify companies with high HOT lead percentages (>50%)
    - Calculate appointment conversion rates per company
    - Calculate customer tenure for each company
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_
  
  - [ ] 12.2 Create customer success section in dashboard
    - Add section showing customer success indicators
    - Display companies with high lead quality
    - Display companies with declining trends
    - Display average conversion rates
    - Highlight expansion opportunities
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6, 10.7_
  
  - [ ]* 12.3 Write property tests for customer success metrics
    - **Property 37: Lead Quality Distribution**
    - **Property 38: High Quality Lead Identification**
    - **Property 39: Appointment Conversion Rate**
    - **Property 40: Inactive Company Identification (30 days)**
    - **Property 41: Customer Tenure Calculation**
    - **Validates: Requirements 10.1, 10.3, 10.4, 10.5, 10.6**

- [ ] 13. Implement revenue analytics features
  - [ ] 13.1 Add revenue tracking to metrics API
    - Track plan upgrades and downgrades over time
    - Calculate month-over-month revenue growth
    - Store historical revenue data for trend analysis
    - _Requirements: 8.6, 8.7_
  
  - [ ] 13.2 Create revenue analytics section in dashboard
    - Display revenue breakdown by plan type
    - Show revenue growth trends with chart
    - Display plan upgrade/downgrade history
    - Show average revenue per company
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [ ]* 13.3 Write property tests for revenue analytics
    - **Property 31: Revenue Breakdown by Plan**
    - **Property 33: Plan Change Tracking**
    - **Property 34: Revenue Growth Calculation**
    - **Validates: Requirements 8.3, 8.6, 8.7**

- [ ] 14. Implement system health monitoring
  - [ ] 14.1 Add system health metrics to metrics API
    - Calculate total message volume trends
    - Calculate total appointment count
    - Calculate database growth metrics
    - Track system-wide lead generation trends
    - _Requirements: 9.2, 9.3, 9.5, 9.6, 9.7_
  
  - [ ] 14.2 Create system health section in dashboard
    - Display total leads across all companies
    - Show message volume trends
    - Display appointment counts
    - Show database growth metrics
    - Display system-wide trends
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [ ]* 14.3 Write property tests for system health monitoring
    - **Property 36: System-Wide Aggregation**
    - **Validates: Requirements 9.2, 9.3, 9.7**

- [ ] 15. Implement data export functionality
  - [ ] 15.1 Add export buttons to dashboard
    - Add "Export Companies" button to company list section
    - Add "Export Revenue" button to revenue section
    - Add "Export Usage Alerts" button to usage alerts section
    - Call POST /api/admin/export with appropriate type and filters
    - Trigger file download on response
    - Show loading indicator during export
    - Display success/error messages
    - _Requirements: 13.1, 13.3, 13.4, 13.5_
  
  - [ ] 15.2 Add audit log viewer page
    - Create app/admin/dashboard/audit-logs/page.tsx
    - Use AuditLogViewer component
    - Add navigation link in admin layout
    - _Requirements: 14.5, 14.6_

- [ ] 16. Implement mobile responsive design
  - [ ] 16.1 Add responsive styles to admin dashboard
    - Ensure all components render correctly on screens ≥320px width
    - Use responsive grid layouts that adapt to screen size
    - Display company lists in single column on mobile
    - Ensure touch targets are minimum 44px
    - Maintain text readability on mobile screens
    - Follow existing design system from app/components/shared/
    - Use same visual style as existing dashboard pages
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [ ] 16.2 Test mobile responsiveness
    - Test on various screen sizes (320px, 375px, 768px, 1024px)
    - Verify touch interactions work correctly
    - Verify all content is accessible on mobile
    - Test landscape and portrait orientations
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 17. Implement access control and security
  - [ ] 17.1 Add middleware for admin route protection
    - Create or update middleware.ts to check admin authentication for /admin/* routes
    - Redirect unauthenticated requests to /admin/login
    - Verify admin session validity
    - _Requirements: 1.1, 1.2_
  
  - [ ] 17.2 Implement company access control based on status
    - Update regular dashboard middleware to check company status
    - Block access for members of suspended companies
    - Display appropriate error message
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 17.3 Write property tests for access control
    - **Property 2: Admin Bypass Company Membership**
    - **Property 24: Suspended Company Access Control**
    - **Property 25: Active Company Access Restoration**
    - **Validates: Requirements 1.3, 1.4, 6.3, 6.4**

- [ ] 18. Implement error handling and logging
  - [ ] 18.1 Add comprehensive error handling to API routes
    - Wrap all API handlers with error handling middleware
    - Return appropriate HTTP status codes (400, 401, 403, 500)
    - Log server-side errors with context
    - Return user-friendly error messages
    - _Requirements: All requirements_
  
  - [ ] 18.2 Add client-side error handling
    - Implement error boundaries for React components
    - Display user-friendly error messages
    - Provide retry mechanisms for failed requests
    - Log errors to console for debugging
    - _Requirements: All requirements_
  
  - [ ] 18.3 Add real-time connection error handling
    - Implement reconnection logic with exponential backoff
    - Display connection status indicator
    - Show warning when connection is lost
    - Limit reconnection attempts to 5
    - _Requirements: 11.5, 11.6_

- [ ] 19. Performance optimization
  - [ ] 19.1 Add database indexes
    - Verify indexes exist on companies(status), companies(plan), companies(created_at)
    - Verify indexes exist on lead_store(company_id, created_at), lead_store(company_id, Lead Category)
    - Verify indexes exist on whatsapp_conversations(company_id, updated_at)
    - Verify indexes exist on company_members(company_id, user_id)
    - _Requirements: 15.3_
  
  - [ ] 19.2 Implement query optimization
    - Use efficient SQL queries with proper joins
    - Minimize database round trips by batching queries
    - Use COUNT queries with head: true for performance
    - _Requirements: 15.1, 15.6_
  
  - [ ] 19.3 Implement caching strategy
    - Cache aggregate metrics for 30 seconds
    - Use React state for client-side caching
    - Invalidate cache on real-time updates
    - _Requirements: 15.4_
  
  - [ ]* 19.4 Write performance tests
    - Test dashboard loads within 2 seconds for 1000 companies
    - Test search/filter returns results within 1 second
    - Verify pagination limits initial load to 50 companies
    - **Validates: Requirements 15.1, 15.2, 15.5**

- [ ] 20. Final integration and testing
  - [ ] 20.1 Integration testing
    - Test complete authentication flow (login → dashboard → logout)
    - Test company management flow (view → edit → save → verify)
    - Test suspension flow (suspend → verify access blocked → reactivate)
    - Test export flow (filter → export → download)
    - Test real-time updates (create lead → verify dashboard updates)
    - _Requirements: All requirements_
  
  - [ ] 20.2 Create seed data for testing
    - Create script to seed admin_users table with test admin
    - Create script to seed companies with various plans and capacities
    - Create script to seed leads for testing metrics
    - _Requirements: All requirements_
  
  - [ ]* 20.3 End-to-end testing
    - Test all user workflows from start to finish
    - Test error scenarios and edge cases
    - Test mobile responsiveness
    - Test real-time updates
    - **Validates: All requirements**

- [ ] 21. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- The implementation follows existing patterns from the regular dashboard (app/dashboard)
- All components use TypeScript with strict type checking
- Real-time updates use Supabase subscriptions for live data
- Admin operations bypass RLS using service role key
- All administrative actions are logged in audit_logs table for accountability
