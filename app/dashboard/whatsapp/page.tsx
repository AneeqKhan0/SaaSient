'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ACCENT = '#0099f9';

type ConversationRow = {
    whatsapp_user_id: string;
    name: string | null;
    phone_number: string | null;
    label: string | null;
    content: string | null;
    updated_at: string | null;
};

type ChatMessage = {
    id: string;
    sender: 'bot' | 'user' | 'system';
    text: string;
    timestamp?: string | null;
};

function formatTime(ts: string | null | undefined) {
    if (!ts) return '';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
}

/**
 * Parse stored transcript lines like:
 * "bot: Hi..., timestamp: 2026-01-26 09:23:03+00"
 * "user: Buyer, timestamp: 2026-01-26 09:37:39+00"
 */
function parseTranscript(content: string | null): ChatMessage[] {
    if (!content || !content.trim()) {
        return [{ id: 'empty', sender: 'system', text: 'No messages found in this conversation.' }];
    }

    const lines = content
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

    const msgs: ChatMessage[] = [];

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const lower = raw.toLowerCase();

        let sender: ChatMessage['sender'] = 'system';
        if (lower.startsWith('bot:')) sender = 'bot';
        else if (lower.startsWith('user:')) sender = 'user';

        let body = raw;
        if (sender === 'bot') body = raw.slice(4).trim();
        if (sender === 'user') body = raw.slice(5).trim();

        let text = body;
        let timestamp: string | null = null;

        const marker = ', timestamp:';
        const idx = body.toLowerCase().lastIndexOf(marker);
        if (idx !== -1) {
            text = body.slice(0, idx).trim();
            timestamp = body.slice(idx + marker.length).trim() || null;
        }

        if (!text) text = '(empty)';

        msgs.push({
            id: `${i}`,
            sender,
            text,
            timestamp,
        });
    }

    return msgs;
}

export default function WhatsAppPage() {
    const [convos, setConvos] = useState<ConversationRow[]>([]);
    const [active, setActive] = useState<ConversationRow | null>(null);

    const [loadingList, setLoadingList] = useState(true);
    const [errorList, setErrorList] = useState<string | null>(null);

    const [search, setSearch] = useState('');

    // Load conversation list
    useEffect(() => {
        (async () => {
            setLoadingList(true);
            setErrorList(null);

            const { data, error } = await supabase
                .from('whatsapp_conversations')
                .select('whatsapp_user_id,name,phone_number,label,content,updated_at')
                .order('updated_at', { ascending: false })
                .limit(200);

            if (error) {
                setErrorList(error.message);
                setConvos([]);
                setActive(null);
                setLoadingList(false);
                return;
            }

            const rows = (data || []) as ConversationRow[];
            setConvos(rows);
            setLoadingList(false);

            if (rows.length > 0) setActive(rows[0]);
        })();
    }, []);

    const filteredConvos = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return convos;

        return convos.filter((c) => {
            const name = (c.name ?? '').toLowerCase();
            const label = (c.label ?? '').toLowerCase();
            const phone = (c.phone_number ?? '').toLowerCase();
            return name.includes(q) || label.includes(q) || phone.includes(q);
        });
    }, [convos, search]);

    const messages = useMemo(() => parseTranscript(active?.content ?? null), [active]);

    return (
        <div style={styles.shell} className="waShell">
            {/* IMPORTANT:
         - Outer page DOES NOT scroll
         - Only left list + right messages scroll
      */}
            <style jsx global>{`
        /* Prevent the entire page from scrolling on this screen */
        html,
        body {
          height: 100%;
        }

        /* Desktop: two columns. Mobile: stack. */
        @media (max-width: 980px) {
          .waShell {
            grid-template-columns: 1fr !important;
          }
          .waLeft {
            height: 42vh !important;
          }
          .waRight {
            height: calc(100vh - 60px - 12px - 42vh) !important;
          }
        }
      `}</style>

            {/* LEFT LIST */}
            <aside style={styles.left} className="waLeft">
                <div style={styles.leftHeader}>
                    <div style={{ minWidth: 0 }}>
                        <div style={styles.title}>WhatsApp</div>
                        <div style={styles.subtitle}>Read-only conversations</div>
                    </div>

                    <div style={styles.pill}>
                        <span style={styles.pillDot} />
                        <span style={styles.pillText}>Live</span>
                    </div>
                </div>

                <div style={styles.searchWrap}>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or label..."
                        style={styles.search}
                    />
                </div>

                {errorList && (
                    <div style={styles.alert}>
                        <b>Error:</b> {errorList}
                    </div>
                )}

                {/* ONLY THIS AREA SCROLLS ON THE LEFT */}
                <div style={styles.list}>
                    {loadingList ? (
                        <div style={styles.muted}>Loading conversations…</div>
                    ) : filteredConvos.length === 0 ? (
                        <div style={styles.muted}>No conversations found.</div>
                    ) : (
                        filteredConvos.map((c) => {
                            const isActive = active?.whatsapp_user_id === c.whatsapp_user_id;

                            const displayName =
                                c.name?.trim() ||
                                c.phone_number?.trim() ||
                                c.whatsapp_user_id.slice(0, 8) + '…';

                            const label = c.label?.trim() || '—';

                            return (
                                <button
                                    key={c.whatsapp_user_id}
                                    onClick={() => setActive(c)}
                                    style={{ ...styles.item, ...(isActive ? styles.itemActive : {}) }}
                                    title={`${displayName}${c.label ? ` • ${c.label}` : ''}`}
                                >
                                    {/* ✅ ONLY NAME */}
                                    <div style={styles.itemNameRow}>
                                        <div style={styles.itemName}>{displayName}</div>
                                    </div>

                                    {/* ✅ ONLY LABEL */}
                                    <div style={styles.itemLabel}>{label}</div>
                                </button>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* RIGHT THREAD */}
            <section style={styles.right} className="waRight">
                {!active ? (
                    <div style={styles.emptyState}>Select a conversation to view messages.</div>
                ) : (
                    <>
                        {/* Fixed header (does NOT scroll) */}
                        <div style={styles.threadHeader}>
                            <div style={{ overflow: 'hidden', minWidth: 0 }}>
                                <div style={styles.threadTitle}>
                                    {active.name?.trim() || active.phone_number || active.whatsapp_user_id}
                                </div>
                                <div style={styles.threadSub}>
                                    {active.label ? active.label : '—'}
                                </div>
                            </div>

                            <div style={styles.threadMetaPill}>
                                <div style={styles.threadMetaLabel}>Updated</div>
                                <div style={styles.threadMetaValue}>{formatTime(active.updated_at)}</div>
                            </div>
                        </div>

                        {/* ✅ ONLY THIS SCROLLS on the right (WhatsApp style) */}
                        <div style={styles.threadBody}>
                            {messages.map((m) => {
                                if (m.sender === 'system') {
                                    return (
                                        <div key={m.id} style={styles.systemWrap}>
                                            <div style={styles.systemMsg}>{m.text}</div>
                                        </div>
                                    );
                                }

                                const isUser = m.sender === 'user';

                                return (
                                    <div
                                        key={m.id}
                                        style={{
                                            ...styles.msgRow,
                                            justifyContent: isUser ? 'flex-end' : 'flex-start',
                                        }}
                                    >
                                        <div style={{ ...styles.bubble, ...(isUser ? styles.bubbleUser : styles.bubbleBot) }}>
                                            <div style={styles.msgText}>{m.text}</div>
                                            {m.timestamp && <div style={styles.msgTime}>{formatTime(m.timestamp)}</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    // ✅ Outer container: fixed height + no overflow so page doesn't scroll
    shell: {
        display: 'grid',
        gridTemplateColumns: '360px 1fr',
        gap: 12,
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
        minHeight: 0,
    },

    left: {
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 14px 55px rgba(0,0,0,0.40)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
    },

    right: {
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 14px 55px rgba(0,0,0,0.40)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
    },

    leftHeader: {
        padding: 14,
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flex: '0 0 auto',
    },

    title: { fontSize: 16, fontWeight: 950, letterSpacing: -0.2 },
    subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.60)', marginTop: 4 },

    pill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        padding: '8px 10px',
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(0,0,0,0.18)',
        flex: '0 0 auto',
    },
    pillDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: ACCENT,
        boxShadow: `0 0 0 6px rgba(0,153,249,0.12)`,
    },
    pillText: { fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.85)' },

    searchWrap: { padding: 12, flex: '0 0 auto' },
    search: {
        width: '100%',
        height: 42,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.22)',
        color: '#fff',
        padding: '0 12px',
        outline: 'none',
    },

    alert: {
        margin: '0 12px 12px',
        padding: 10,
        borderRadius: 12,
        border: '1px solid rgba(255,90,90,0.35)',
        background: 'rgba(255,60,60,0.08)',
        color: '#ffb4b4',
        fontSize: 13,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        flex: '0 0 auto',
    },

    // ✅ Left list scrolls
    list: {
        padding: 12,
        display: 'grid',
        gap: 10,
        overflow: 'auto',
        minHeight: 0,
        flex: '1 1 auto',
    },

    muted: { color: 'rgba(255,255,255,0.60)', padding: 12 },

    // ✅ Left item: ONLY name + label
    item: {
        textAlign: 'left',
        padding: 12,
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(0,0,0,0.20)',
        color: '#fff',
        cursor: 'pointer',
    },

    itemActive: {
        border: '1px solid rgba(0,153,249,0.55)',
        boxShadow: '0 0 0 1px rgba(0,153,249,0.18), 0 14px 45px rgba(0,0,0,0.35)',
    },

    itemNameRow: { minWidth: 0 },
    itemName: {
        fontWeight: 950,
        fontSize: 14,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },

    itemLabel: {
        marginTop: 6,
        fontSize: 12,
        color: 'rgba(255,255,255,0.65)',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },

    emptyState: { padding: 18, color: 'rgba(255,255,255,0.60)' },

    // ✅ Right header fixed, body scrolls
    threadHeader: {
        padding: 14,
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flex: '0 0 auto',
    },

    threadTitle: {
        fontWeight: 980,
        fontSize: 15,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },

    threadSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

    threadMetaPill: {
        textAlign: 'right',
        borderRadius: 12,
        padding: '8px 10px',
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(0,0,0,0.18)',
        minWidth: 170,
        flex: '0 0 auto',
    },

    threadMetaLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
    threadMetaValue: { fontSize: 12, color: 'rgba(255,255,255,0.86)', marginTop: 4 },

    // ✅ ONLY this area scrolls on the right (WhatsApp feel)
    threadBody: {
        padding: 14,
        overflow: 'auto',
        display: 'grid',
        gap: 10,
        background: 'rgba(0,0,0,0.18)',
        flex: '1 1 auto',
        minHeight: 0,
    },

    msgRow: { display: 'flex' },

    bubble: {
        maxWidth: 720,
        borderRadius: 16,
        padding: 12,
        border: '1px solid rgba(255,255,255,0.10)',
    },

    bubbleBot: { background: 'rgba(0,0,0,0.20)', color: '#fff' },

    bubbleUser: {
        background: ACCENT,
        color: '#001018',
        border: '1px solid rgba(0,153,249,0.55)',
        boxShadow: '0 10px 30px rgba(0,153,249,0.18)',
    },

    msgText: { fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap' },
    msgTime: { fontSize: 11, opacity: 0.75, marginTop: 8 },

    systemWrap: { display: 'flex', justifyContent: 'center' },

    systemMsg: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.65)',
        border: '1px dashed rgba(255,255,255,0.18)',
        padding: '8px 10px',
        borderRadius: 12,
        background: 'rgba(0,0,0,0.20)',
    },
};
