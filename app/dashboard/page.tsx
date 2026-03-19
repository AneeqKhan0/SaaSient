'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { StatCard } from '@/app/components/dashboard/StatCard';
import { ActionCard } from '@/app/components/dashboard/ActionCard';
import { UpcomingAppointments } from '@/app/components/dashboard/UpcomingAppointments';
import { UsageStats } from '@/app/components/dashboard/UsageStats';
import { LimitReachedModal } from '@/app/components/dashboard/LimitReachedModal';
import { useFormatters } from '@/app/components/shared/hooks';
import { toISOStartOfDay, addDays, ymd } from '@/app/components/shared/utils';
import { homeStyles as styles } from '@/app/components/dashboard/styles/dashboardHome';

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const { formatNum } = useFormatters();

  const [leadsToday, setLeadsToday] = useState(0);
  const [messagesToday, setMessagesToday] = useState(0);
  const [activeConvos, setActiveConvos] = useState(0);
  const [hotLeads, setHotLeads] = useState(0);
  const [warmLeads, setWarmLeads] = useState(0);
  const [coldLeads, setColdLeads] = useState(0);

  const todayStartISO = useMemo(() => toISOStartOfDay(new Date()), []);
  const activeWindowStartISO = useMemo(() => toISOStartOfDay(addDays(new Date(), -1)), []);

  const handleLimitReached = () => {
    // Show popup after 5 seconds
    setTimeout(() => {
      setShowLimitModal(true);
    }, 5000);
  };

  async function loadMetrics() {
    setError(null);

    try {
      setLoading(true);

      const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID!;
      if (!COMPANY_ID) {
        throw new Error('COMPANY_ID is not configured');
      }

      const todayDateStr = ymd(new Date());

      const leadsA = await supabase
        .from('lead_store')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', COMPANY_ID)
        .gte('appointment_time', todayStartISO);

      const leadsCount =
        leadsA.error
          ? (await supabase.from('lead_store').select('id', { count: 'exact', head: true }).eq('company_id', COMPANY_ID).eq('date', todayDateStr))
            .count ?? 0
          : leadsA.count ?? 0;

      setLeadsToday(leadsCount);

      const active = await supabase
        .from('whatsapp_conversations')
        .select('whatsapp_user_id', { count: 'exact', head: true })
        .eq('company_id', COMPANY_ID)
        .gte('updated_at', activeWindowStartISO);

      setActiveConvos(active.count ?? 0);

      const [hot, warm, cold] = await Promise.all([
        supabase.from('lead_store').select('id', { count: 'exact', head: true }).eq('company_id', COMPANY_ID).eq('Lead Category', 'HOT'),
        supabase.from('lead_store').select('id', { count: 'exact', head: true }).eq('company_id', COMPANY_ID).eq('Lead Category', 'WARM'),
        supabase.from('lead_store').select('id', { count: 'exact', head: true }).eq('company_id', COMPANY_ID).eq('Lead Category', 'COLD'),
      ]);

      setHotLeads(hot.count ?? 0);
      setWarmLeads(warm.count ?? 0);
      setColdLeads(cold.count ?? 0);

      const msgTry1 = await supabase
        .from('Conversations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', COMPANY_ID)
        .gte('created_at', todayStartISO)
        .eq('type', 'user');

      if (!msgTry1.error) {
        setMessagesToday(msgTry1.count ?? 0);
      } else {
        const msgFallback = await supabase
          .from('whatsapp_conversations')
          .select('whatsapp_user_id', { count: 'exact', head: true })
          .eq('company_id', COMPANY_ID)
          .gte('updated_at', todayStartISO);

        setMessagesToday(msgFallback.count ?? 0);
      }

      setLoading(false);
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
    const t = setInterval(loadMetrics, 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const leadChannel = supabase
      .channel('rt-lead_store')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_store' }, () => loadMetrics())
      .subscribe();

    const waChannel = supabase
      .channel('rt-whatsapp_conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => loadMetrics())
      .subscribe();

    const convoChannel = supabase
      .channel('rt-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Conversations' }, () => loadMetrics())
      .subscribe();

    return () => {
      supabase.removeChannel(leadChannel);
      supabase.removeChannel(waChannel);
      supabase.removeChannel(convoChannel);
    };
  }, []);

  return (
    <div style={styles.shell}>
      <div style={styles.noise} aria-hidden="true" />

      <div style={styles.headerRow}>
        <div>
          <div style={styles.h1}>Overview</div>
          <div style={styles.sub}>Real-time metrics for leads &amp; conversations</div>
        </div>

        <div style={styles.livePill} aria-label="Live status">
          <span style={styles.liveDot} />
          <div style={styles.liveTextCol}>
            <div style={styles.liveTitle}>Live</div>
            <div style={styles.liveSub}>{loading ? 'Syncing…' : 'Updated'}</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={styles.alert}>
          <b>Error:</b> {error}
        </div>
      )}

      <div style={styles.statsGrid} className="statsGrid">
        <StatCard icon="☎️" title="Leads contacted today" value={loading ? '—' : formatNum(leadsToday)} subtitle="From lead_store" />
        <StatCard icon="💬" title="Messages received today" value={loading ? '—' : formatNum(messagesToday)} subtitle="WhatsApp activity" />
        <StatCard icon="🟢" title="Active conversations" value={loading ? '—' : formatNum(activeConvos)} subtitle="Last 24 hours" />
        <StatCard icon="🔥" title="HOT leads" value={loading ? '—' : formatNum(hotLeads)} subtitle="Lead Category" />
        <StatCard icon="✨" title="WARM leads" value={loading ? '—' : formatNum(warmLeads)} subtitle="Lead Category" />
        <StatCard icon="❄️" title="COLD leads" value={loading ? '—' : formatNum(coldLeads)} subtitle="Lead Category" />
      </div>

      <div style={styles.usageSection}>
        <UsageStats onLimitReached={handleLimitReached} />
      </div>

      <div style={styles.upcomingSection}>
        <UpcomingAppointments />
      </div>

      <div style={styles.actions} className="actions">
        <ActionCard href="/dashboard/leads" title="Qualified Leads" description="View WhatsApp Agent &amp; Voice Agent leads." />
        <ActionCard href="/dashboard/whatsapp" title="WhatsApp Conversations" description="Read-only WhatsApp-style threads." />
        <ActionCard href="/dashboard/appointments" title="Appointments" description="View scheduled appointments calendar." />
        <ActionCard href="/dashboard/usage" title="Plan Usage Details" description="Comprehensive usage analytics and limits." />
      </div>

      <LimitReachedModal 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
      />

      <style jsx>{`
        @media (max-width: 768px) {
          .statsGrid {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important;
          }
          .actions {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .statsGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
