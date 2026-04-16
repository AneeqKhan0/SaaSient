'use client';

import { useEffect, useState, CSSProperties } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { StatCard } from '@/app/components/dashboard/StatCard';
import { Button } from '@/app/components/shared/Button';
import { colors, borderRadius, spacing } from '@/app/components/shared/constants';
import { useFormatters } from '@/app/components/shared/hooks';

type UsageData = {
  // Company Info
  companyName: string;
  plan: string;
  maxLeads: number;
  maxDocuments: number;
  
  // Lead Counts
  totalUniqueLeads: number;
  voiceAgentLeads: number;
  whatsappAgentLeads: number;
  whatsappConversations: number;
  duplicateLeads: number;
  
  // Usage Percentages
  leadsUsagePercent: number;
  documentsUsagePercent: number;
  
  // Lead Categories
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  
  // Time-based Stats
  leadsToday: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
  
  // Recent Activity
  lastLeadDate: string | null;
  avgLeadsPerDay: number;
  
  // Plan Status
  daysUntilLimit: number | null;
  isNearLimit: boolean;
  isAtLimit: boolean;
};

export default function UsagePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const { formatNum } = useFormatters();

  const loadUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID!;
      if (!COMPANY_ID) {
        throw new Error('COMPANY_ID is not configured');
      }

      // Get company info
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('name, plan, max_leads, max_documents')
        .eq('id', COMPANY_ID)
        .single();

      if (companyError) throw new Error(`Company data error: ${companyError.message}`);

      // Get leads from lead_store
      const { data: leadStoreData, error: leadStoreError } = await supabase
        .from('lead_store')
        .select('phone, email, Full_name, First_Name, Last_Name, Source, "Lead Category", date, appointment_time')
        .eq('company_id', COMPANY_ID);

      if (leadStoreError) throw new Error(`Lead store error: ${leadStoreError.message}`);

      // Get whatsapp conversations
      const { data: whatsappData, error: whatsappError } = await supabase
        .from('whatsapp_conversations')
        .select('phone_number, name, updated_at')
        .eq('company_id', COMPANY_ID);

      if (whatsappError) throw new Error(`WhatsApp data error: ${whatsappError.message}`);

      // Process data
      const uniqueLeads = new Set<string>();
      const leadSources = { voice: 0, whatsappAgent: 0, whatsappConv: 0 };
      const leadCategories = { hot: 0, warm: 0, cold: 0 };
      const timeStats = { today: 0, thisWeek: 0, thisMonth: 0 };
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      let lastLeadDate: Date | null = null;
      let totalLeadsFromStore = 0;

      // Process lead_store data
      (leadStoreData || []).forEach(lead => {
        totalLeadsFromStore++;
        
        // Create unique identifier
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
        if (lead.Source === 'Voice Agent') {
          leadSources.voice++;
        } else if (lead.Source === 'WhatsApp agent') {
          leadSources.whatsappAgent++;
        }

        // Count by category
        const category = lead['Lead Category']?.toLowerCase();
        if (category === 'hot') leadCategories.hot++;
        else if (category === 'warm') leadCategories.warm++;
        else if (category === 'cold') leadCategories.cold++;

        // Time-based counting - use date or appointment_time
        let leadDate: Date | null = null;
        
        // Try appointment_time first, then date
        if (lead.appointment_time) {
          leadDate = new Date(lead.appointment_time);
        } else if (lead.date) {
          // date is stored as text, try different formats
          const dateStr = lead.date;
          leadDate = new Date(dateStr);
          
          // If invalid, try parsing as YYYY-MM-DD format
          if (isNaN(leadDate.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            leadDate = new Date(dateStr + 'T00:00:00');
          }
        }
        
        if (leadDate && !isNaN(leadDate.getTime())) {
          if (leadDate >= todayStart) timeStats.today++;
          if (leadDate >= weekStart) timeStats.thisWeek++;
          if (leadDate >= monthStart) timeStats.thisMonth++;
          
          if (lastLeadDate === null || leadDate > lastLeadDate) {
            lastLeadDate = leadDate;
          }
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
          if (wasNew) {
            leadSources.whatsappConv++;
          }
        }

        // Check for recent activity
        const convDate = new Date(conv.updated_at || '');
        if (!isNaN(convDate.getTime())) {
          if (convDate >= todayStart) timeStats.today++;
          if (convDate >= weekStart) timeStats.thisWeek++;
          if (convDate >= monthStart) timeStats.thisMonth++;
          
          if (lastLeadDate === null || convDate > lastLeadDate) {
            lastLeadDate = convDate;
          }
        }
      });

      // Calculate metrics
      const totalUniqueLeads = uniqueLeads.size;
      const duplicateLeads = totalLeadsFromStore + (whatsappData?.length || 0) - totalUniqueLeads;
      const leadsUsagePercent = (totalUniqueLeads / company.max_leads) * 100;
      const documentsUsagePercent = 0; // Placeholder for documents
      
      // Calculate average leads per day
      const currentDayOfMonth = now.getDate();
      const avgLeadsPerDay = currentDayOfMonth > 0 ? timeStats.thisMonth / currentDayOfMonth : 0;
      
      // Calculate days until limit (if current trend continues)
      const remainingLeads = company.max_leads - totalUniqueLeads;
      const daysUntilLimit = avgLeadsPerDay > 0 ? Math.ceil(remainingLeads / avgLeadsPerDay) : null;

      const usageData: UsageData = {
        companyName: company.name,
        plan: company.plan,
        maxLeads: company.max_leads,
        maxDocuments: company.max_documents,
        totalUniqueLeads,
        voiceAgentLeads: leadSources.voice,
        whatsappAgentLeads: leadSources.whatsappAgent,
        whatsappConversations: leadSources.whatsappConv,
        duplicateLeads: Math.max(0, duplicateLeads),
        leadsUsagePercent: Math.min(100, leadsUsagePercent),
        documentsUsagePercent,
        hotLeads: leadCategories.hot,
        warmLeads: leadCategories.warm,
        coldLeads: leadCategories.cold,
        leadsToday: timeStats.today,
        leadsThisWeek: timeStats.thisWeek,
        leadsThisMonth: timeStats.thisMonth,
        lastLeadDate: (lastLeadDate as Date | null)?.toISOString() || null,
        avgLeadsPerDay: Math.round(avgLeadsPerDay * 10) / 10,
        daysUntilLimit,
        isNearLimit: leadsUsagePercent >= 80,
        isAtLimit: leadsUsagePercent >= 100,
      };

      setUsage(usageData);

    } catch (err: any) {
      console.error('Usage data error:', err);
      setError(err.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsageData();
  }, []);

  if (loading) {
    return (
      <div style={styles.shell} className="usage-page-shell">
        <div style={styles.scrollContainer} className="usage-page-scroll">
          <div style={styles.container}>
            <div style={styles.header}>
              <h1 style={styles.title}>Plan Usage Details</h1>
              <p style={styles.subtitle}>Loading comprehensive usage statistics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.shell} className="usage-page-shell">
        <div style={styles.scrollContainer} className="usage-page-scroll">
          <div style={styles.container}>
            <div style={styles.header}>
              <h1 style={styles.title}>Plan Usage Details</h1>
            </div>
            <div style={styles.error}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!usage) return null;

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return '#ef4444';
    if (percentage >= 90) return '#f59e0b';
    if (percentage >= 75) return '#eab308';
    return colors.accent;
  };

  return (
    <div style={styles.shell} className="usage-page-shell">
      <div style={styles.scrollContainer} className="usage-page-scroll">
        <div style={styles.container}>
          <div style={styles.header} className="usage-header">
            <div>
              <h1 style={styles.title}>Plan Usage Details</h1>
              <p style={styles.subtitle}>
                Comprehensive analytics for {usage.companyName} • {usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)} Plan
              </p>
            </div>
            <div style={styles.planBadge}>
              {usage.plan.toUpperCase()}
            </div>
          </div>

          {/* Plan Limits Overview */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📊 Plan Limits & Usage</h2>
            <div style={styles.limitsGrid} className="usage-limits-grid">
              <div style={styles.limitCard}>
                <div style={styles.limitHeader}>
                  <span style={styles.limitLabel}>Leads Limit</span>
                  <span style={{
                    ...styles.limitStatus,
                    color: getStatusColor(usage.leadsUsagePercent)
                  }}>
                    {usage.isAtLimit ? 'LIMIT REACHED' : usage.isNearLimit ? 'NEAR LIMIT' : 'AVAILABLE'}
                  </span>
                </div>
                <div style={styles.limitNumbers}>
                  <span style={styles.currentNumber}>{formatNum(usage.totalUniqueLeads)}</span>
                  <span style={styles.separator}> / </span>
                  <span style={styles.maxNumber}>{formatNum(usage.maxLeads)}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${usage.leadsUsagePercent}%`,
                    backgroundColor: getStatusColor(usage.leadsUsagePercent)
                  }} />
                </div>
                <div style={styles.limitFooter}>
                  <span>{usage.leadsUsagePercent.toFixed(1)}% used</span>
                  {usage.daysUntilLimit && usage.daysUntilLimit > 0 && !usage.isAtLimit && (
                    <span style={styles.projection}>
                      ~{usage.daysUntilLimit} days until limit
                    </span>
                  )}
                </div>
              </div>

              <div style={styles.limitCard}>
                <div style={styles.limitHeader}>
                  <span style={styles.limitLabel}>Documents Limit</span>
                  <span style={styles.limitStatus}>AVAILABLE</span>
                </div>
                <div style={styles.limitNumbers}>
                  <span style={styles.currentNumber}>0</span>
                  <span style={styles.separator}> / </span>
                  <span style={styles.maxNumber}>{formatNum(usage.maxDocuments)}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: '0%',
                    backgroundColor: colors.accent
                  }} />
                </div>
                <div style={styles.limitFooter}>
                  <span>0% used</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Sources Breakdown */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🤖 Lead Sources Breakdown</h2>
            <div style={styles.statsGrid} className="usage-stats-grid">
              <StatCard 
                icon="🎯" 
                title="Total Unique Leads" 
                value={formatNum(usage.totalUniqueLeads)} 
                subtitle="Deduplicated across all sources" 
              />
              <StatCard 
                icon="📞" 
                title="Voice Agent Leads" 
                value={formatNum(usage.voiceAgentLeads)} 
                subtitle="From voice conversations" 
              />
              <StatCard 
                icon="💬" 
                title="WhatsApp Agent Leads" 
                value={formatNum(usage.whatsappAgentLeads)} 
                subtitle="From WhatsApp bot" 
              />
              <StatCard 
                icon="💭" 
                title="WhatsApp Conversations" 
                value={formatNum(usage.whatsappConversations)} 
                subtitle="Direct conversations" 
              />
            </div>
          </div>

          {/* Lead Quality & Categories */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🌡️ Lead Quality Distribution</h2>
            <div style={styles.statsGrid} className="usage-stats-grid">
              <StatCard 
                icon="🔥" 
                title="HOT Leads" 
                value={formatNum(usage.hotLeads)} 
                subtitle="High conversion potential" 
              />
              <StatCard 
                icon="✨" 
                title="WARM Leads" 
                value={formatNum(usage.warmLeads)} 
                subtitle="Moderate interest" 
              />
              <StatCard 
                icon="❄️" 
                title="COLD Leads" 
                value={formatNum(usage.coldLeads)} 
                subtitle="Low engagement" 
              />
              <StatCard 
                icon="🔄" 
                title="Duplicate Leads" 
                value={formatNum(usage.duplicateLeads)} 
                subtitle="Filtered out automatically" 
              />
            </div>
          </div>

          {/* Time-based Analytics */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📈 Lead Generation Trends</h2>
            <div style={styles.statsGrid} className="usage-stats-grid">
              <StatCard 
                icon="📅" 
                title="Leads Today" 
                value={formatNum(usage.leadsToday)} 
                subtitle="New leads acquired today" 
              />
              <StatCard 
                icon="📊" 
                title="Leads This Week" 
                value={formatNum(usage.leadsThisWeek)} 
                subtitle="Last 7 days" 
              />
              <StatCard 
                icon="📈" 
                title="Leads This Month" 
                value={formatNum(usage.leadsThisMonth)} 
                subtitle="Current month total" 
              />
              <StatCard 
                icon="⚡" 
                title="Daily Average" 
                value={usage.avgLeadsPerDay.toString()} 
                subtitle="Leads per day this month" 
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🕒 Recent Activity</h2>
            <div style={styles.limitsGrid} className="usage-limits-grid">
              <div style={styles.activityCard}>
                <div style={styles.activityHeader}>
                  <span style={styles.activityCardTitle}>Last Activity</span>
                </div>
                <div style={styles.activityItem}>
                  <span style={styles.activityLabel}>Last Lead Generated:</span>
                  <span style={styles.activityValue}>
                    {usage.lastLeadDate ? 
                      new Date(usage.lastLeadDate).toLocaleString() : 
                      'No recent activity'
                    }
                  </span>
                </div>
                {usage.daysUntilLimit && usage.daysUntilLimit > 0 && !usage.isAtLimit && (
                  <div style={styles.activityItem}>
                    <span style={styles.activityLabel}>Projected Limit Date:</span>
                    <span style={styles.activityValue}>
                      {new Date(Date.now() + usage.daysUntilLimit * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      {' '}({usage.daysUntilLimit} days)
                    </span>
                  </div>
                )}
              </div>

              <div style={styles.activityCard}>
                <div style={styles.activityHeader}>
                  <span style={styles.activityCardTitle}>Usage Status</span>
                </div>
                <div style={styles.activityItem}>
                  <span style={styles.activityLabel}>Current Status:</span>
                  <span style={{
                    ...styles.activityValue,
                    color: getStatusColor(usage.leadsUsagePercent)
                  }}>
                    {usage.isAtLimit ? 'At Limit - Contact Support' : 
                     usage.isNearLimit ? 'Near Limit - Consider Upgrade' : 
                     'Within Limits'}
                  </span>
                </div>
                <div style={styles.activityItem}>
                  <span style={styles.activityLabel}>Plan Utilization:</span>
                  <span style={styles.activityValue}>
                    {usage.leadsUsagePercent.toFixed(1)}% of {usage.plan} plan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Recommendation */}
          {usage.isNearLimit && (
            <div style={styles.section}>
              <div style={styles.upgradeCard} className="usage-upgrade-card">
                <div style={styles.upgradeIcon}>⚠️</div>
                <div style={styles.upgradeContent}>
                  <h3 style={styles.upgradeTitle}>
                    {usage.isAtLimit ? 'Plan Limit Reached' : 'Approaching Plan Limit'}
                  </h3>
                  <p style={styles.upgradeText}>
                    {usage.isAtLimit ? 
                      'You have reached your plan limit. Contact support to upgrade and continue adding leads.' :
                      `You're using ${usage.leadsUsagePercent.toFixed(1)}% of your plan. Consider upgrading to avoid interruptions.`
                    }
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => window.open('mailto:support@saasient.ai?subject=Plan Upgrade Request', '_blank')}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Contact Support for Upgrade
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .usage-page-shell {
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }
        .usage-page-scroll {
          flex: 1 !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          min-height: 0 !important;
        }
        
        /* Custom scrollbar for webkit browsers */
        .usage-page-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .usage-page-scroll::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
        }
        .usage-page-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }
        .usage-page-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
        
        @media (max-width: 768px) {
          .usage-limits-grid {
            grid-template-columns: 1fr !important;
          }
          .usage-stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
          }
          .usage-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .usage-upgrade-card {
            flex-direction: column !important;
            text-align: center !important;
            align-items: center !important;
          }
        }
        @media (max-width: 600px) {
          .usage-limits-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .usage-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .usage-activity-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
    overflow: 'auto',
    padding: spacing.md,
    paddingBottom: spacing.xl,
    minHeight: 0, // Important for flex child to be scrollable
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
    paddingBottom: spacing.xl, // Extra padding at bottom
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 950,
    color: colors.text.primary,
    margin: 0,
    letterSpacing: -0.4,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: 600,
    color: colors.text.secondary,
    margin: 0,
    marginTop: spacing.xs,
    lineHeight: 1.4,
  },
  planBadge: {
    padding: '6px 14px',
    borderRadius: 16,
    background: 'rgba(0,153,249,0.15)',
    border: '1px solid rgba(0,153,249,0.35)',
    color: colors.accent,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.8,
    flexShrink: 0,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: colors.text.primary,
    marginBottom: spacing.md,
    letterSpacing: -0.2,
  },
  limitsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.lg,
  },
  limitCard: {
    background: colors.card.background,
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  limitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  limitLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text.primary,
  },
  limitStatus: {
    fontSize: 10,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.accent,
  },
  limitNumbers: {
    fontSize: 24,
    fontWeight: 900,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  currentNumber: {
    color: colors.text.primary,
  },
  separator: {
    color: colors.text.tertiary,
    fontSize: 18,
    margin: '0 4px',
  },
  maxNumber: {
    color: colors.text.secondary,
  },
  progressBar: {
    height: 10,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.5s ease',
    borderRadius: 5,
  },
  limitFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: colors.text.secondary,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  projection: {
    color: colors.text.tertiary,
    fontSize: 11,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: spacing.md,
  },
  activityCard: {
    background: colors.card.background,
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  activityHeader: {
    paddingBottom: spacing.sm,
    borderBottom: `1px solid rgba(255,255,255,0.05)`,
    marginBottom: spacing.xs,
  },
  activityCardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text.primary,
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: `${spacing.xs} 0`,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  activityLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text.secondary,
    minWidth: 'fit-content',
  },
  activityValue: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.text.primary,
    textAlign: 'right',
    wordBreak: 'break-word',
  },
  upgradeCard: {
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: spacing.md,
    alignItems: 'start',
  },
  upgradeIcon: {
    fontSize: 32,
    flexShrink: 0,
    width: 48,
    textAlign: 'center',
  },
  upgradeContent: {
    flex: 1,
    minWidth: 250,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: colors.text.primary,
    margin: 0,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text.secondary,
    margin: 0,
    marginBottom: spacing.md,
    lineHeight: 1.4,
  },
  error: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: 600,
    textAlign: 'center',
    padding: spacing.lg,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: borderRadius.lg,
    margin: spacing.lg,
  },
};