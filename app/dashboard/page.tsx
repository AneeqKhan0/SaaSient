'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ACCENT = '#0099f9';

function toISOStartOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.toISOString();
}

function addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}

function formatNum(n: number) {
    return new Intl.NumberFormat().format(n);
}

function ymd(d: Date) {
    return d.toISOString().slice(0, 10);
}

export default function DashboardHome() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // headline metrics
    const [leadsToday, setLeadsToday] = useState(0);
    const [messagesToday, setMessagesToday] = useState(0);
    const [activeConvos, setActiveConvos] = useState(0);
    const [hotLeads, setHotLeads] = useState(0);
    const [warmLeads, setWarmLeads] = useState(0);
    const [coldLeads, setColdLeads] = useState(0);

    const todayStartISO = useMemo(() => toISOStartOfDay(new Date()), []);
    const activeWindowStartISO = useMemo(() => toISOStartOfDay(addDays(new Date(), -1)), []);

    async function loadMetrics() {
        setError(null);

        try {
            setLoading(true);

            const todayDateStr = ymd(new Date());

            const leadsA = await supabase
                .from('lead_store')
                .select('id', { count: 'exact', head: true })
                .gte('appointment_time', todayStartISO);

            const leadsCount =
                leadsA.error
                    ? (
                        await supabase
                            .from('lead_store')
                            .select('id', { count: 'exact', head: true })
                            .eq('date', todayDateStr)
                    ).count ?? 0
                    : leadsA.count ?? 0;

            setLeadsToday(leadsCount);

            const active = await supabase
                .from('whatsapp_conversations')
                .select('whatsapp_user_id', { count: 'exact', head: true })
                .gte('updated_at', activeWindowStartISO);

            setActiveConvos(active.count ?? 0);

            const [hot, warm, cold] = await Promise.all([
                supabase.from('lead_store').select('id', { count: 'exact', head: true }).eq('Lead Category', 'HOT'),
                supabase.from('lead_store').select('id', { count: 'exact', head: true }).eq('Lead Category', 'WARM'),
                supabase.from('lead_store').select('id', { count: 'exact', head: true }).eq('Lead Category', 'COLD'),
            ]);

            setHotLeads(hot.count ?? 0);
            setWarmLeads(warm.count ?? 0);
            setColdLeads(cold.count ?? 0);

            const msgTry1 = await supabase
                .from('Conversations')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', todayStartISO)
                .eq('type', 'user');

            if (!msgTry1.error) {
                setMessagesToday(msgTry1.count ?? 0);
            } else {
                const msgFallback = await supabase
                    .from('whatsapp_conversations')
                    .select('whatsapp_user_id', { count: 'exact', head: true })
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

                {/* Improved LIVE pill */}
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

            <div style={styles.statsGrid}>
                <StatCard title="Leads contacted today" value={loading ? '—' : formatNum(leadsToday)} hint="From lead_store" icon="☎" />
                <StatCard title="Messages received today" value={loading ? '—' : formatNum(messagesToday)} hint="WhatsApp activity" icon="💬" accent />
                <StatCard title="Active conversations" value={loading ? '—' : formatNum(activeConvos)} hint="Last 24 hours" icon="🟢" />
                <StatCard title="HOT leads" value={loading ? '—' : formatNum(hotLeads)} hint="Lead Category" icon="🔥" accent />
                <StatCard title="WARM leads" value={loading ? '—' : formatNum(warmLeads)} hint="Lead Category" icon="✨" />
                <StatCard title="COLD leads" value={loading ? '—' : formatNum(coldLeads)} hint="Lead Category" icon="❄" />
            </div>

            <div style={styles.actions}>
                <Link href="/dashboard/leads" style={styles.actionCard}>
                    <div style={styles.actionTop}>
                        <div style={styles.actionTitle}>Qualified Leads</div>
                        <div style={styles.actionBadge}>Open</div>
                    </div>
                    <div style={styles.actionText}>View WhatsApp Agent &amp; Voice Agent leads.</div>
                </Link>

                <Link href="/dashboard/whatsapp" style={styles.actionCard}>
                    <div style={styles.actionTop}>
                        <div style={styles.actionTitle}>WhatsApp Conversations</div>
                        <div style={styles.actionBadge}>Open</div>
                    </div>
                    <div style={styles.actionText}>Read-only WhatsApp-style threads.</div>
                </Link>



            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    hint,
    icon,
    accent,
}: {
    title: string;
    value: string;
    hint: string;
    icon: string;
    accent?: boolean;
}) {
    return (
        <div style={{ ...styles.card, ...(accent ? styles.cardAccent : {}) }}>
            {/* FIX: consistent top row alignment across ALL cards */}
            <div style={styles.cardTop}>
                <div style={styles.iconWrap} aria-hidden="true">
                    {icon}
                </div>

                <div style={styles.cardTopText}>
                    <div style={styles.cardTitle}>{title}</div>
                    <div style={styles.cardHint}>{hint}</div>
                </div>
            </div>

            {/* FIX: remove those highlighted dots completely (spark removed) */}
            <div style={styles.valueRow}>
                <div style={styles.cardValue}>{value}</div>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    shell: {
        position: 'relative',
        minHeight: 'calc(100vh - 60px)',
        padding: 18,
        borderRadius: 24,
        overflow: 'hidden',
        background:
            'radial-gradient(900px 420px at 18% 0%, rgba(0,153,249,0.22), transparent 60%), radial-gradient(700px 320px at 88% 15%, rgba(0,153,249,0.12), transparent 65%), linear-gradient(180deg, #060606, #050505)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 30px 120px rgba(0,0,0,0.65)',
    },

    noise: {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.06,
        backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27120%27 height=%27120%27 filter=%27url(%23n)%27 opacity=%270.55%27/%3E%3C/svg%3E")',
    },

    headerRow: {
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 14,
        paddingBottom: 14,
    },

    h1: { fontSize: 26, fontWeight: 980, letterSpacing: -0.4 },
    sub: { color: 'rgba(255,255,255,0.62)', marginTop: 6, fontSize: 13 },

    // ===== Improved LIVE pill =====
    livePill: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 999,
        padding: '10px 12px',
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(0,0,0,0.20)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 14px 60px rgba(0,0,0,0.35)',
    },
    liveDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        background: ACCENT,
        boxShadow: `0 0 0 8px rgba(0,153,249,0.14)`,
        flex: '0 0 auto',
    },
    liveTextCol: { display: 'flex', flexDirection: 'column', lineHeight: 1.1 },
    liveTitle: { fontWeight: 950, fontSize: 13 },
    liveSub: { fontSize: 12, color: 'rgba(255,255,255,0.60)', marginTop: 2 },

    alert: {
        position: 'relative',
        border: '1px solid rgba(255,90,90,0.35)',
        background: 'rgba(255,60,60,0.08)',
        color: '#ffb4b4',
        padding: 12,
        borderRadius: 16,
        marginBottom: 14,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
    },

    statsGrid: {
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 12,
    },

    card: {
        borderRadius: 18,
        padding: 14,
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 14px 55px rgba(0,0,0,0.40)',

        // ✅ key: enforce consistent internal spacing
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 120,
    },

    cardAccent: {
        border: `1px solid rgba(0,153,249,0.30)`,
        background: 'linear-gradient(180deg, rgba(0,153,249,0.12), rgba(255,255,255,0.06))',
    },

    // ===== Consistent card header alignment across all cards =====
    cardTop: {
        display: 'grid',
        gridTemplateColumns: '44px 1fr',
        gap: 12,
        alignItems: 'center',
    },

    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.10)',
        flex: '0 0 auto',
    },

    cardTopText: {
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },

    cardTitle: { fontSize: 13, fontWeight: 950, color: 'rgba(255,255,255,0.92)', lineHeight: 1.25 },
    cardHint: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 1.2 },

    valueRow: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: 12,
        gap: 10,
    },

    cardValue: { fontSize: 32, fontWeight: 980, letterSpacing: -0.6 },

    actions: {
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 12,
        marginTop: 12,
    },

    actionCard: {
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 14px 55px rgba(0,0,0,0.40)',
        padding: 14,
        color: '#fff',
        textDecoration: 'none',
    },

    actionTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    actionTitle: { fontWeight: 980, fontSize: 15, letterSpacing: -0.2 },
    actionBadge: {
        fontSize: 12,
        fontWeight: 950,
        padding: '6px 12px',
        borderRadius: 999,
        color: '#001018',
        background: ACCENT,
        boxShadow: `0 10px 30px rgba(0,153,249,0.25)`,
    },
    actionText: { color: 'rgba(255,255,255,0.65)', marginTop: 8, fontSize: 13 },
};
