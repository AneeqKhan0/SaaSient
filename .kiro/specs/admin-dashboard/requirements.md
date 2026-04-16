# Requirements Document

## Introduction

This document defines the requirements for a comprehensive admin dashboard that enables platform administrators to monitor, manage, and analyze all companies (tenants) in the multi-tenant lead generation SaaS platform. The admin dashboard provides centralized oversight of company usage, revenue metrics, system health, and customer success indicators.

## Glossary

- **Admin_Dashboard**: The administrative interface accessible only to platform administrators
- **Company**: A tenant organization in the multi-tenant system with its own isolated data
- **Lead**: A potential customer contact stored in lead_store or whatsapp_conversations tables
- **Plan**: A subscription tier (starter, pro, enterprise) with associated limits
- **Usage_Limit**: The maximum number of leads (max_leads) a company can store
- **MRR**: Monthly Recurring Revenue calculated from company plan subscriptions
- **Company_Member**: A user associated with a company via the company_members table
- **Lead_Source**: The origin of a lead (Voice Agent, WhatsApp Agent, WhatsApp Conversations)
- **Lead_Category**: The qualification level of a lead (HOT, WARM, COLD)
- **Capacity_Percentage**: The ratio of current leads to max_leads expressed as a percentage

## Requirements

### Requirement 1: Admin Authentication and Access Control

**User Story:** As a platform administrator, I want secure access to the admin dashboard, so that I can manage all companies without compromising security.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL be accessible only at the /admin/dashboard route
2. WHEN an unauthenticated user attempts to access /admin/dashboard, THE System SHALL redirect to /admin/login
3. THE Admin_Dashboard SHALL bypass company membership checks for authenticated admin users
4. WHEN an admin user successfully authenticates, THE System SHALL grant access to all company data across the platform
5. THE Admin_Dashboard SHALL display an admin badge or indicator to distinguish it from regular user dashboards

### Requirement 2: Company Overview Dashboard

**User Story:** As a platform administrator, I want to see high-level metrics for all companies, so that I can understand platform health at a glance.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display the total count of companies in the system
2. THE Admin_Dashboard SHALL calculate and display total MRR based on company plans
3. THE Admin_Dashboard SHALL show the count of companies at 90% or higher capacity
4. THE Admin_Dashboard SHALL show the count of companies at 100% capacity
5. THE Admin_Dashboard SHALL display total leads across all companies
6. THE Admin_Dashboard SHALL show growth trends for total companies over time
7. THE Admin_Dashboard SHALL calculate and display the distribution of companies by plan type

### Requirement 3: Company List and Search

**User Story:** As a platform administrator, I want to view and search all companies, so that I can quickly find specific companies to manage.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a searchable list of all companies
2. THE Admin_Dashboard SHALL show company name, plan, current leads, max_leads, and capacity percentage for each company
3. WHEN an administrator enters a search term, THE Admin_Dashboard SHALL filter companies by name or slug
4. THE Admin_Dashboard SHALL support filtering companies by plan type
5. THE Admin_Dashboard SHALL support filtering companies by capacity status (under 75%, 75-89%, 90-99%, 100%)
6. THE Admin_Dashboard SHALL display companies in a sortable table with columns for key metrics
7. THE Admin_Dashboard SHALL paginate the company list when more than 50 companies exist

### Requirement 4: Individual Company Drill-Down

**User Story:** As a platform administrator, I want to view detailed information for a specific company, so that I can understand their usage patterns and provide support.

#### Acceptance Criteria

1. WHEN an administrator clicks on a company in the list, THE Admin_Dashboard SHALL display detailed company information
2. THE Company_Detail_View SHALL show company name, slug, plan, created date, and contact information
3. THE Company_Detail_View SHALL display current leads count from both lead_store and whatsapp_conversations
4. THE Company_Detail_View SHALL show lead breakdown by source (Voice Agent, WhatsApp Agent, WhatsApp Conversations)
5. THE Company_Detail_View SHALL show lead breakdown by category (HOT, WARM, COLD)
6. THE Company_Detail_View SHALL display time-based metrics (leads today, this week, this month)
7. THE Company_Detail_View SHALL show the list of company members with their roles
8. THE Company_Detail_View SHALL display recent lead activity with timestamps

### Requirement 5: Company Settings Management

**User Story:** As a platform administrator, I want to modify company settings, so that I can adjust limits and plans as needed.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL provide an interface to edit company max_leads value
2. THE Admin_Dashboard SHALL provide an interface to change company plan
3. WHEN an administrator updates max_leads, THE System SHALL validate the value is greater than zero
4. WHEN an administrator changes a company plan, THE System SHALL update the companies table
5. THE Admin_Dashboard SHALL log all changes to company settings with administrator identification and timestamp
6. WHEN an administrator attempts to set max_leads below current lead count, THE System SHALL display a warning message
7. THE Admin_Dashboard SHALL provide an interface to edit company name and slug

### Requirement 6: Company Status Management

**User Story:** As a platform administrator, I want to suspend or activate companies, so that I can manage access for billing or policy reasons.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL provide a mechanism to mark a company as suspended
2. THE Admin_Dashboard SHALL provide a mechanism to mark a company as active
3. WHEN a company is suspended, THE System SHALL prevent all company members from accessing the dashboard
4. WHEN a company is reactivated, THE System SHALL restore access for all company members
5. THE Admin_Dashboard SHALL display suspension status prominently in the company list
6. THE Admin_Dashboard SHALL require confirmation before suspending a company
7. THE Admin_Dashboard SHALL log suspension and activation events with administrator identification

### Requirement 7: Usage Monitoring and Alerts

**User Story:** As a platform administrator, I want to identify companies approaching their limits, so that I can proactively reach out for upsells or support.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a list of companies at 90% or higher capacity
2. THE Admin_Dashboard SHALL display a list of companies at 100% capacity
3. THE Admin_Dashboard SHALL calculate days until limit for each company based on current growth rate
4. THE Admin_Dashboard SHALL highlight companies with negative growth trends
5. THE Admin_Dashboard SHALL identify companies with zero activity in the last 7 days
6. THE Admin_Dashboard SHALL provide filtering to show only companies requiring attention
7. THE Admin_Dashboard SHALL display average leads per day for each company

### Requirement 8: Revenue Analytics

**User Story:** As a platform administrator, I want to analyze revenue metrics, so that I can understand business performance.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL calculate total MRR by summing plan values across all active companies
2. THE Admin_Dashboard SHALL calculate ARR as MRR multiplied by 12
3. THE Admin_Dashboard SHALL display revenue breakdown by plan type
4. THE Admin_Dashboard SHALL show the count of companies on each plan tier
5. THE Admin_Dashboard SHALL calculate average revenue per company
6. THE Admin_Dashboard SHALL track plan upgrades and downgrades over time
7. THE Admin_Dashboard SHALL display revenue growth trends month over month

### Requirement 9: System Health Monitoring

**User Story:** As a platform administrator, I want to monitor overall system health, so that I can identify issues before they impact customers.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display total lead count across all companies
2. THE Admin_Dashboard SHALL show total message volume trends
3. THE Admin_Dashboard SHALL display total appointment count across all companies
4. THE Admin_Dashboard SHALL calculate average leads per company
5. THE Admin_Dashboard SHALL show database growth metrics
6. THE Admin_Dashboard SHALL display API error rates if available
7. THE Admin_Dashboard SHALL show system-wide lead generation trends over time

### Requirement 10: Customer Success Metrics

**User Story:** As a platform administrator, I want to track customer success indicators, so that I can identify at-risk customers and expansion opportunities.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL calculate average lead quality distribution across all companies
2. THE Admin_Dashboard SHALL identify companies with declining lead generation trends
3. THE Admin_Dashboard SHALL show companies with high HOT lead percentages
4. THE Admin_Dashboard SHALL calculate average appointment conversion rates per company
5. THE Admin_Dashboard SHALL identify inactive companies with no leads in 30 days
6. THE Admin_Dashboard SHALL display customer tenure for each company
7. THE Admin_Dashboard SHALL show engagement metrics based on login frequency

### Requirement 11: Real-Time Data Updates

**User Story:** As a platform administrator, I want real-time data updates, so that I can see current system status without manual refreshes.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL subscribe to real-time updates for the companies table
2. THE Admin_Dashboard SHALL subscribe to real-time updates for the lead_store table
3. THE Admin_Dashboard SHALL subscribe to real-time updates for the whatsapp_conversations table
4. WHEN a company's data changes, THE Admin_Dashboard SHALL update the display within 5 seconds
5. THE Admin_Dashboard SHALL display a live indicator showing connection status
6. WHEN real-time connection is lost, THE Admin_Dashboard SHALL display a warning and attempt reconnection
7. THE Admin_Dashboard SHALL refresh aggregate metrics every 30 seconds

### Requirement 12: Mobile Responsive Design

**User Story:** As a platform administrator, I want to access the admin dashboard on mobile devices, so that I can monitor the system while away from my desk.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL render correctly on screens with width 320px or greater
2. THE Admin_Dashboard SHALL use responsive grid layouts that adapt to screen size
3. WHEN viewed on mobile devices, THE Admin_Dashboard SHALL display company lists in a single column
4. THE Admin_Dashboard SHALL provide touch-friendly controls with minimum 44px touch targets
5. THE Admin_Dashboard SHALL maintain readability of all text on mobile screens
6. THE Admin_Dashboard SHALL use the existing design system from app/components/shared/
7. THE Admin_Dashboard SHALL follow the same visual style as existing dashboard pages

### Requirement 13: Data Export Capabilities

**User Story:** As a platform administrator, I want to export company data, so that I can perform offline analysis and reporting.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL provide a mechanism to export company list data to CSV format
2. THE Exported_CSV SHALL include company name, plan, max_leads, current_leads, capacity_percentage, and created_date
3. THE Admin_Dashboard SHALL provide a mechanism to export revenue metrics to CSV format
4. THE Admin_Dashboard SHALL provide a mechanism to export usage alerts to CSV format
5. WHEN an administrator requests an export, THE System SHALL generate the file within 10 seconds
6. THE Exported_Files SHALL use UTF-8 encoding to support international characters
7. THE Admin_Dashboard SHALL include export timestamp in the filename

### Requirement 14: Audit Logging

**User Story:** As a platform administrator, I want all admin actions logged, so that we can maintain accountability and track changes.

#### Acceptance Criteria

1. THE System SHALL log all company setting changes with administrator user_id and timestamp
2. THE System SHALL log all company suspension and activation events
3. THE System SHALL log all plan changes with before and after values
4. THE System SHALL log all max_leads changes with before and after values
5. THE Audit_Log SHALL be stored in a dedicated audit_logs table
6. THE Admin_Dashboard SHALL provide a view to search and filter audit logs
7. THE Audit_Log_Entries SHALL be immutable and cannot be deleted by administrators

### Requirement 15: Performance and Scalability

**User Story:** As a platform administrator, I want the admin dashboard to perform well with many companies, so that I can efficiently manage a growing platform.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL load the company list page within 2 seconds for up to 1000 companies
2. THE Admin_Dashboard SHALL use pagination to limit initial data load to 50 companies
3. THE Admin_Dashboard SHALL use database indexes on frequently queried columns
4. THE Admin_Dashboard SHALL cache aggregate metrics for 30 seconds to reduce database load
5. WHEN filtering or searching, THE Admin_Dashboard SHALL return results within 1 second
6. THE Admin_Dashboard SHALL use efficient SQL queries with proper joins to minimize database round trips
7. THE Admin_Dashboard SHALL lazy-load detailed company data only when drill-down is requested
