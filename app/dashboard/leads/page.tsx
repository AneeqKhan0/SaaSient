'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Tab = 'whatsapp' | 'voice';

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

export default function LeadsPage() {
    const [tab, setTab] = useState<Tab>('whatsapp');
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const sourceValue = useMemo(() => TAB_TO_SOURCE[tab], [tab]);

    // Columns to display per tab
    const visibleColumns = useMemo(() => {
        if (tab === 'whatsapp') return WHATSAPP_COLUMNS;
        // Voice Agent: show all columns (auto from returned data)
        // We'll compute later from the first row.
        return [];
    }, [tab]);

    // Voice columns: computed from first row keys
    const voiceColumns = useMemo(() => {
        if (tab !== 'voice') return [];
        if (!rows || rows.length === 0) return [];
        // Keep "id" first if exists, then the rest alphabetically (stable)
        const keys = Object.keys(rows[0] || {});
        const idFirst = keys.includes('id') ? ['id', ...keys.filter((k) => k !== 'id')] : keys;
        return idFirst;
    }, [rows, tab]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);

            // ✅ DO NOT use updated_at (it doesn't exist)
            // We'll order by appointment_time (if any), else date, else id.
            // Ordering by a column that doesn't exist causes the error you saw.
            // So we do a safe approach:
            // 1) Fetch data filtered by Source
            // 2) Sort in JS by appointment_time/date/id

            const { data, error } = await supabase.from('lead_store').select('*').eq('Source', sourceValue).limit(500);

            if (error) {
                setError(error.message);
                setRows([]);
                setLoading(false);
                return;
            }

            const fetched = data || [];

            // JS sort (safe even if columns missing)
            fetched.sort((a: any, b: any) => {
                const aKey = a.appointment_time ?? a.date ?? a.id ?? '';
                const bKey = b.appointment_time ?? b.date ?? b.id ?? '';
                // Sort newest first when date-like; otherwise descending string
                const aD = new Date(aKey);
                const bD = new Date(bKey);
                const aValid = !Number.isNaN(aD.getTime());
                const bValid = !Number.isNaN(bD.getTime());
                if (aValid && bValid) return bD.getTime() - aD.getTime();
                return String(bKey).localeCompare(String(aKey));
            });

            setRows(fetched);
            setLoading(false);
        })();
    }, [sourceValue]);

    const columnsToRender = tab === 'whatsapp' ? visibleColumns : voiceColumns;

    return (
        <div>
            <h1 style={{ marginTop: 0 }}>Qualified Leads</h1>
            <p style={{ color: '#bdbdbd', marginTop: 6 }}>
                Showing <b>{tab === 'whatsapp' ? 'WhatsApp Agent' : 'Voice Agent'}</b> leads (Source = “{sourceValue}”)
            </p>

            <div style={{ display: 'flex', gap: 8, margin: '12px 0 16px', flexWrap: 'wrap' }}>
                <button onClick={() => setTab('whatsapp')} style={tabButtonStyle(tab === 'whatsapp')}>
                    WhatsApp Agent
                </button>
                <button onClick={() => setTab('voice')} style={tabButtonStyle(tab === 'voice')}>
                    Voice Agent
                </button>
            </div>

            {error && (
                <div style={alertStyle}>
                    <b>Error:</b> {error}
                </div>
            )}

            <div style={tableWrap}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            {columnsToRender.map((col) => (
                                <th key={col} style={th}>
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td style={td} colSpan={Math.max(columnsToRender.length, 1)}>
                                    Loading…
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td style={td} colSpan={Math.max(columnsToRender.length, 1)}>
                                    No leads found.
                                </td>
                            </tr>
                        ) : (
                            rows.map((r: any, idx: number) => (
                                <tr key={`${r.id ?? r.phone ?? 'row'}-${idx}`}>
                                    {columnsToRender.map((col) => (
                                        <td key={`${col}-${idx}`} style={td}>
                                            <Cell value={r?.[col]} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {tab === 'whatsapp' && (
                <p style={{ color: '#9e9e9e', marginTop: 12, fontSize: 12 }}>
                    WhatsApp Agent tab is restricted to the exact columns you requested.
                </p>
            )}

            {tab === 'voice' && (
                <p style={{ color: '#9e9e9e', marginTop: 12, fontSize: 12 }}>
                    Voice Agent tab shows all columns automatically (based on returned row keys).
                </p>
            )}
        </div>
    );
}

function Cell({ value }: { value: any }) {
    const str = fmt(value);

    // Make long text readable but not huge
    if (str.length > 140) {
        return (
            <div title={str} style={{ maxWidth: 520, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {str}
            </div>
        );
    }

    return <span>{str || '-'}</span>;
}

function tabButtonStyle(active: boolean): React.CSSProperties {
    return {
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid #1f1f1f',
        background: active ? '#fff' : '#0b0b0b',
        color: active ? '#000' : '#fff',
        cursor: 'pointer',
        fontWeight: 800,
    };
}

const alertStyle: React.CSSProperties = {
    border: '1px solid #3a1f1f',
    background: '#140b0b',
    color: '#ffb4b4',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
};

const tableWrap: React.CSSProperties = {
    border: '1px solid #1f1f1f',
    background: '#0b0b0b',
    borderRadius: 14,
    overflow: 'auto',
};

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
};

const th: React.CSSProperties = {
    textAlign: 'left',
    fontSize: 12,
    letterSpacing: 0.2,
    padding: '12px 12px',
    borderBottom: '1px solid #1f1f1f',
    color: '#bdbdbd',
    whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
    padding: '12px 12px',
    borderBottom: '1px solid #141414',
    fontSize: 13,
    verticalAlign: 'top',
};