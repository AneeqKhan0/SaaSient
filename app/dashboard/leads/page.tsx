'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Tab = 'whatsapp' | 'voice';

const ACCENT = '#0099f9';

// ✅ WhatsApp tab must show ONLY these columns (exactly as you wrote)
const WHATSAPP_COLUMNS: string[] = [
    'customer_name',
    'phone',
    'email',
    'property_type',
    'requirements',
    'location',
    'timeline',
    'budget',
    'price_estimate',
    'property_address',
    'lead_score',
    'star_rating',
    'current_presence',
    'appointment_time',
    'conversation_summary',
    'GDPR_Consent',
    'Lead Category',
];

// Your Supabase table has "Source" (capital S)
const TAB_TO_SOURCE: Record<Tab, string> = {
    whatsapp: 'WhatsApp Agent',
    voice: 'Voice Agent',
};

function fmt(v: any) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
}

function safeDate(v: any) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
}

function formatTime(ts: any) {
    const d = safeDate(ts);
    if (!d) return '';
    return d.toLocaleString();
}

function niceTitle(row: any) {
    const n = (row?.customer_name ?? row?.name ?? '').trim();
    if (n) return n;
    const p = (row?.phone ?? row?.phone_number ?? '').trim();
    if (p) return p;
    const e = (row?.email ?? '').trim();
    if (e) return e;
    return `Lead ${row?.id ?? ''}`.trim();
}

function badgeText(row: any) {
    const cat = (row?.['Lead Category'] ?? row?.lead_category ?? '').toString().trim();
    return cat || 'Lead';
}

function scoreText(row: any) {
    const s = row?.lead_score ?? row?.score ?? '';
    if (s === null || s === undefined || s === '') return '—';
    return String(s);
}

function makeRowId(r: any) {
    return String(r?.id ?? r?.phone ?? r?.email ?? '0');
}

function csvEscape(value: any) {
    const s = fmt(value);
    // Wrap in quotes, escape quotes -> ""
    return `"${s.replace(/"/g, '""')}"`;
}

function downloadCSV(filename: string, columns: string[], rows: any[]) {
    const header = columns.map(csvEscape).join(',');
    const lines = rows.map((r) => columns.map((c) => csvEscape(r?.[c])).join(','));
    const csv = [header, ...lines].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

export default function LeadsPage() {
    const [tab, setTab] = useState<Tab>('whatsapp');

    const [rows, setRows] = useState<any[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');

    const sourceValue = useMemo(() => TAB_TO_SOURCE[tab], [tab]);

    // Columns for export + detail view
    const columnsToRender = useMemo(() => {
        if (tab === 'whatsapp') return WHATSAPP_COLUMNS;
        if (!rows || rows.length === 0) return [];
        const keys = Object.keys(rows[0] || {});
        const idFirst = keys.includes('id') ? ['id', ...keys.filter((k) => k !== 'id')] : keys;
        return idFirst;
    }, [rows, tab]);

    // Fetch
    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('lead_store')
                .select('*')
                .eq('Source', sourceValue)
                .limit(1000);

            if (error) {
                setError(error.message);
                setRows([]);
                setActiveId(null);
                setLoading(false);
                return;
            }

            const fetched = (data || []) as any[];

            // Safe JS sort
            fetched.sort((a: any, b: any) => {
                const aKey = a.appointment_time ?? a.date ?? a.id ?? '';
                const bKey = b.appointment_time ?? b.date ?? b.id ?? '';
                const aD = safeDate(aKey);
                const bD = safeDate(bKey);
                if (aD && bD) return bD.getTime() - aD.getTime();
                return String(bKey).localeCompare(String(aKey));
            });

            setRows(fetched);
            setLoading(false);

            if (fetched.length > 0) setActiveId(makeRowId(fetched[0]));
            else setActiveId(null);
        })();
    }, [sourceValue]);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((r) => {
            const hay = [
                niceTitle(r),
                fmt(r?.phone),
                fmt(r?.email),
                fmt(r?.['Lead Category']),
                fmt(r?.location),
                fmt(r?.property_type),
            ]
                .join(' ')
                .toLowerCase();

            return hay.includes(q);
        });
    }, [rows, search]);

    useEffect(() => {
        // If active lead disappears after search filter, switch to first match
        if (!activeId) return;
        const stillExists = filteredRows.some((r) => makeRowId(r) === activeId);
        if (!stillExists) setActiveId(filteredRows[0] ? makeRowId(filteredRows[0]) : null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, tab, filteredRows.length]);

    const activeRow = useMemo(() => {
        if (!activeId) return null;
        return filteredRows.find((r) => makeRowId(r) === activeId) ?? null;
    }, [filteredRows, activeId]);

    function onDownload() {
        try {
            setDownloading(true);
            const cols = columnsToRender.length ? columnsToRender : tab === 'whatsapp' ? WHATSAPP_COLUMNS : [];
            const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            const filename = `saasient-leads-${tab}-${stamp}.csv`;

            // Export the currently filtered rows (search applied)
            downloadCSV(filename, cols, filteredRows);
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div style={styles.shell}>
            {/* Header */}
            <div style={styles.header}>
                <div style={{ minWidth: 0 }}>
                    <div style={styles.h1}>Qualified Leads</div>
                    <div style={styles.sub}>
                        Source = <b>{sourceValue}</b>
                    </div>
                </div>

                <div style={styles.headerRight}>
                    <div style={styles.segment}>
                        <button onClick={() => setTab('whatsapp')} style={segBtn(tab === 'whatsapp')}>
                            WhatsApp Agent
                        </button>
                        <button onClick={() => setTab('voice')} style={segBtn(tab === 'voice')}>
                            Voice Agent
                        </button>
                    </div>

                    <button onClick={onDownload} disabled={loading || downloading || filteredRows.length === 0} style={styles.downloadBtn}>
                        {downloading ? 'Preparing…' : 'Download CSV'}
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={styles.searchRow}>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, phone, email, category…"
                    style={styles.search}
                />

                <div style={styles.countPill}>
                    <span style={styles.countDot} />
                    <span style={{ fontWeight: 950 }}>{loading ? 'Loading…' : `${filteredRows.length} leads`}</span>
                </div>
            </div>

            {error && (
                <div style={styles.alert}>
                    <b>Error:</b> {error}
                </div>
            )}

            {/* CONTENT: internal scrolling only */}
            <div style={styles.content}>
                <div style={styles.split}>
                    {/* LEFT LIST (scrolls) */}
                    <aside style={styles.left}>
                        {loading ? (
                            <div style={styles.muted}>Loading leads…</div>
                        ) : filteredRows.length === 0 ? (
                            <div style={styles.muted}>No leads found.</div>
                        ) : (
                            filteredRows.map((r) => {
                                const id = makeRowId(r);
                                const active = activeId === id;

                                const title = niceTitle(r);
                                const badge = badgeText(r);
                                const score = scoreText(r);
                                const when = formatTime(r?.appointment_time ?? r?.date ?? r?.created_at);

                                return (
                                    <button
                                        key={id}
                                        onClick={() => setActiveId(id)}
                                        style={{ ...styles.leadItem, ...(active ? styles.leadItemActive : {}) }}
                                        title={title}
                                    >
                                        <div style={styles.leadTop}>
                                            <div style={styles.leadTitle}>{title}</div>
                                            <div style={styles.scorePill}>
                                                <span style={styles.scoreDot} />
                                                <span style={{ fontWeight: 950 }}>{score}</span>
                                            </div>
                                        </div>

                                        <div style={styles.leadBottom}>
                                            <div style={styles.badge}>{badge}</div>
                                            <div style={styles.when}>{when || '—'}</div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </aside>

                    {/* RIGHT DETAILS (scrolls) */}
                    <section style={styles.right}>
                        {!activeRow ? (
                            <div style={styles.emptyState}>Select a lead to view details.</div>
                        ) : (
                            <>
                                <div style={styles.detailHeader}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={styles.detailTitle}>{niceTitle(activeRow)}</div>
                                        <div style={styles.detailSub}>
                                            {badgeText(activeRow)} • Score: {scoreText(activeRow)}
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.detailBody}>
                                    <div style={styles.kvGrid}>
                                        {columnsToRender.map((col) => (
                                            <KV key={col} label={col} value={activeRow?.[col]} />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>

            {/* Notes */}
            {tab === 'whatsapp' && (
                <div style={styles.note}>WhatsApp tab is restricted to the exact columns you requested.</div>
            )}
            {tab === 'voice' && (
                <div style={styles.note}>Voice tab shows all columns automatically (based on returned row keys).</div>
            )}
        </div>
    );
}

function KV({ label, value }: { label: string; value: any }) {
    const str = fmt(value);
    const isLong = str.length > 140;

    return (
        <div style={styles.kv}>
            <div style={styles.k}>{label}</div>
            <div style={{ ...styles.v, ...(isLong ? styles.vLong : {}) }} title={isLong ? str : undefined}>
                {str || '—'}
            </div>
        </div>
    );
}

function segBtn(active: boolean): React.CSSProperties {
    return {
        height: 38,
        padding: '0 12px',
        borderRadius: 12,
        border: active ? '1px solid rgba(0,153,249,0.45)' : '1px solid rgba(255,255,255,0.10)',
        background: active ? 'rgba(0,153,249,0.16)' : 'rgba(0,0,0,0.18)',
        color: '#fff',
        fontWeight: 900,
        cursor: 'pointer',
    };
}

const styles: Record<string, React.CSSProperties> = {
    // ✅ outer wrapper: NO page scroll, internal scroll only
    shell: {
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 0,
    },

    header: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
    },
    h1: { fontSize: 26, fontWeight: 980, letterSpacing: -0.4 },
    sub: { color: 'rgba(255,255,255,0.62)', marginTop: 6, fontSize: 13 },

    headerRight: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' },

    segment: {
        display: 'flex',
        gap: 8,
        padding: 6,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
    },

    downloadBtn: {
        height: 38,
        padding: '0 14px',
        borderRadius: 12,
        border: '1px solid rgba(0,153,249,0.45)',
        background: 'rgba(0,153,249,0.16)',
        color: '#fff',
        fontWeight: 950,
        cursor: 'pointer',
    },

    searchRow: { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' },

    search: {
        flex: 1,
        height: 42,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.22)',
        color: '#fff',
        padding: '0 12px',
        outline: 'none',
        minWidth: 200,
    },

    countPill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 999,
        padding: '10px 12px',
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        flex: '0 0 auto',
    },
    countDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: ACCENT,
        boxShadow: `0 0 0 7px rgba(0,153,249,0.14)`,
    },

    alert: {
        border: '1px solid rgba(255,90,90,0.35)',
        background: 'rgba(255,60,60,0.08)',
        color: '#ffb4b4',
        padding: 12,
        borderRadius: 16,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
    },

    // ✅ internal scrolling container
    content: {
        flex: '1 1 auto',
        minHeight: 0,
        overflow: 'hidden',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 14px 55px rgba(0,0,0,0.40)',
    },

    split: {
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '360px 1fr',
        minHeight: 0,
    },

    left: {
        borderRight: '1px solid rgba(255,255,255,0.10)',
        padding: 12,
        overflow: 'auto',
        minHeight: 0,
        display: 'grid',
        gap: 10,
        background: 'rgba(0,0,0,0.14)',
    },

    right: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
    },

    muted: { color: 'rgba(255,255,255,0.62)', padding: 12 },

    leadItem: {
        textAlign: 'left',
        padding: 12,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(0,0,0,0.18)',
        color: '#fff',
        cursor: 'pointer',
    },
    leadItemActive: {
        border: '1px solid rgba(0,153,249,0.55)',
        boxShadow: '0 0 0 1px rgba(0,153,249,0.18), 0 14px 45px rgba(0,0,0,0.35)',
    },

    leadTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    leadTitle: {
        fontWeight: 980,
        fontSize: 14,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },

    scorePill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.06)',
        flex: '0 0 auto',
    },
    scoreDot: {
        width: 7,
        height: 7,
        borderRadius: 999,
        background: ACCENT,
        boxShadow: `0 0 0 6px rgba(0,153,249,0.12)`,
    },

    leadBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10 },

    badge: {
        fontSize: 12,
        fontWeight: 950,
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(0,0,0,0.18)',
        color: 'rgba(255,255,255,0.85)',
    },

    when: { fontSize: 12, color: 'rgba(255,255,255,0.60)', whiteSpace: 'nowrap' },

    detailHeader: {
        padding: 14,
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(0,0,0,0.12)',
        flex: '0 0 auto',
    },

    detailTitle: { fontSize: 16, fontWeight: 980, letterSpacing: -0.2 },
    detailSub: { marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.62)' },

    detailBody: {
        padding: 14,
        overflow: 'auto',
        minHeight: 0,
        flex: '1 1 auto',
    },

    kvGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 12,
    },

    kv: {
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(0,0,0,0.18)',
        padding: 12,
        minWidth: 0,
    },

    k: { fontSize: 12, fontWeight: 950, color: 'rgba(255,255,255,0.70)' },

    v: {
        marginTop: 8,
        fontSize: 13,
        color: 'rgba(255,255,255,0.92)',
        lineHeight: 1.5,
        wordBreak: 'break-word',
    },

    vLong: {
        whiteSpace: 'pre-wrap',
    },

    emptyState: { padding: 18, color: 'rgba(255,255,255,0.62)' },

    note: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
};
