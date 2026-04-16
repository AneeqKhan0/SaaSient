'use client';

import { CSSProperties, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { colors, borderRadius, spacing } from '../shared/constants';

type UsageStatsProps = {
  onLimitReached?: () => void;
};

type CompanyUsage = {
  plan: string;
  maxLeads: number;
  currentLeads: number;
};

export function UsageStats({ onLimitReached }: UsageStatsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<CompanyUsage | null>(null);

  const loadUsageStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID!;
      if (!COMPANY_ID) {
        throw new Error('COMPANY_ID is not configured');
      }

      // Get company plan and limits
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('plan, max_leads')
        .eq('id', COMPANY_ID)
        .single();

      if (companyError) {
        throw new Error(`Failed to fetch company data: ${companyError.message}`);
      }

      // Count unique leads from both sources
      // 1. Get leads from lead_store (both WhatsApp agent and Voice Agent)
      const { data: leadStoreData, error: leadStoreError } = await supabase
        .from('lead_store')
        .select('phone, email, Full_name, First_Name, Last_Name')
        .eq('company_id', COMPANY_ID);

      if (leadStoreError) {
        throw new Error(`Failed to fetch lead_store data: ${leadStoreError.message}`);
      }

      // 2. Get leads from whatsapp_conversations
      const { data: whatsappData, error: whatsappError } = await supabase
        .from('whatsapp_conversations')
        .select('phone_number, name')
        .eq('company_id', COMPANY_ID);

      if (whatsappError) {
        throw new Error(`Failed to fetch whatsapp_conversations data: ${whatsappError.message}`);
      }

      // 3. Create a Set to track unique leads (using phone as primary identifier)
      const uniqueLeads = new Set<string>();

      // Add leads from lead_store
      (leadStoreData || []).forEach(lead => {
        const phone = lead.phone?.replace(/\D/g, ''); // Remove non-digits for comparison
        if (phone && phone.length >= 10) { // Valid phone number
          uniqueLeads.add(phone);
        } else if (lead.email) { // Fallback to email if no valid phone
          uniqueLeads.add(lead.email.toLowerCase());
        } else if (lead.Full_name) { // Use Full_name
          uniqueLeads.add(lead.Full_name.toLowerCase());
        } else if (lead.First_Name || lead.Last_Name) { // Construct from First/Last
          uniqueLeads.add(`${lead.First_Name || ''} ${lead.Last_Name || ''}`.trim().toLowerCase());
        }
      });

      // Add leads from whatsapp_conversations
      (whatsappData || []).forEach(lead => {
        const phone = lead.phone_number?.replace(/\D/g, ''); // Remove non-digits for comparison
        if (phone && phone.length >= 10) { // Valid phone number
          uniqueLeads.add(phone);
        } else if (lead.name) { // Fallback to name
          uniqueLeads.add(lead.name.toLowerCase());
        }
      });

      const currentLeads = uniqueLeads.size;

      const usageData: CompanyUsage = {
        plan: company.plan,
        maxLeads: company.max_leads,
        currentLeads: currentLeads || 0,
      };

      setUsage(usageData);

      // Check if leads limit is reached and trigger callback
      if (usageData.currentLeads >= usageData.maxLeads && onLimitReached) {
        onLimitReached();
      }

    } catch (err: any) {
      console.error('Usage stats error:', err);
      setError(err.message || 'Failed to load usage stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsageStats();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Plan Usage</h3>
        </div>
        <div style={styles.loading}>Loading usage stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Plan Usage</h3>
        </div>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const leadsPercentage = Math.min((usage.currentLeads / usage.maxLeads) * 100, 100);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#ef4444'; // Red
    if (percentage >= 90) return '#f59e0b'; // Orange  
    if (percentage >= 75) return '#eab308'; // Yellow
    return colors.accent; // Blue
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return 'Limit reached';
    if (percentage >= 90) return 'Nearly full';
    if (percentage >= 75) return 'Getting full';
    return 'Available';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Plan Usage</h3>
        <div style={styles.planBadge}>
          {usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)}
        </div>
      </div>

      <div style={styles.usageGrid}>
        {/* Leads Usage */}
        <div style={styles.usageItem}>
          <div style={styles.usageHeader} className="usage-header">
            <div style={styles.usageHeaderLeft}>
              <span style={styles.usageLabel} className="usage-label">📞 Voice & Chat Leads</span>
              <span className="status-badge" style={{
                ...styles.statusBadge,
                backgroundColor: leadsPercentage >= 100 ? 'rgba(239,68,68,0.15)' : 
                                leadsPercentage >= 90 ? 'rgba(245,158,11,0.15)' :
                                leadsPercentage >= 75 ? 'rgba(234,179,8,0.15)' : 'rgba(0,153,249,0.15)',
                color: leadsPercentage >= 100 ? '#ef4444' : 
                       leadsPercentage >= 90 ? '#f59e0b' :
                       leadsPercentage >= 75 ? '#eab308' : colors.accent,
              }}>
                {getStatusText(leadsPercentage)}
              </span>
            </div>
            <span style={styles.usageCount} className="usage-count">
              <span style={styles.currentCount}>{usage.currentLeads.toLocaleString()}</span>
              <span style={styles.separator}> / </span>
              <span style={styles.maxCount}>{usage.maxLeads.toLocaleString()}</span>
            </span>
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${leadsPercentage}%`,
                backgroundColor: getProgressColor(leadsPercentage),
              }}
            />
          </div>
          <div style={styles.usageFooter} className="usage-footer">
            <span style={styles.percentage}>
              {leadsPercentage.toFixed(1)}% used
            </span>
            {leadsPercentage >= 90 && (
              <span style={styles.warningText}>
                {leadsPercentage >= 100 ? 'Contact support' : 'Upgrade soon'}
              </span>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 480px) {
          .usage-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .usage-label {
            font-size: 14px !important;
          }
          .status-badge {
            font-size: 9px !important;
          }
          .usage-count {
            font-size: 13px !important;
          }
          .usage-footer {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    background: colors.card.background,
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 900,
    color: colors.text.primary,
    margin: 0,
    letterSpacing: -0.3,
  },
  planBadge: {
    padding: '4px 12px',
    borderRadius: 20,
    background: 'rgba(0,153,249,0.15)',
    border: '1px solid rgba(0,153,249,0.35)',
    color: colors.accent,
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  usageGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  usageItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  usageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  usageHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  usageLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text.primary,
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    whiteSpace: 'nowrap',
  },
  usageCount: {
    fontSize: 14,
    fontWeight: 900,
    color: colors.text.primary,
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  currentCount: {
    color: colors.text.primary,
  },
  separator: {
    color: colors.text.tertiary,
    margin: '0 2px',
  },
  maxCount: {
    color: colors.text.secondary,
  },
  progressBar: {
    height: 10,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.5s ease, background-color 0.3s ease',
    borderRadius: 6,
  },
  usageFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  percentage: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text.secondary,
  },
  warningText: {
    fontSize: 11,
    fontWeight: 700,
    color: '#f59e0b',
    whiteSpace: 'nowrap',
  },
  loading: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: spacing.md,
  },
  error: {
    fontSize: 14,
    fontWeight: 600,
    color: '#ef4444',
    textAlign: 'center',
    padding: spacing.md,
  },
};