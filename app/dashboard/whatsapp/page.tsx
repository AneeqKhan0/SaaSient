'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

function makePreviewFromContent(content: string | null) {
    if (!content) return '';
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return '';
    return lines[lines.length - 1].slice(0, 90);
}

/**
 * Your content looks like:
 * "bot: Hi..., timestamp: 2026-01-26 09:23:03+00"
 * "user: Buyer, timestamp: 2026-01-26 09:37:39+00"
 *
 * We parse line-by-line.
 */
function parseTranscript(content: string | null): ChatMessage[] {
    if (!content || !content.trim()) {
        return [
            {
                id: 'empty',
                sender: 'system',
                text: 'No messages found in this conversation.',
            },
        ];
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

        // remove "bot:" / "user:" prefix if present
        let body = raw;
        if (sender === 'bot') body = raw.slice(4).trim();
        if (sender === 'user') body = raw.slice(5).trim();

        // Try to extract timestamp from the LAST occurrence of ", timestamp:"
        // (message text might contain commas)
        let text = body;
        let timestamp: string | null = null;

        const marker = ', timestamp:';
        const idx = body.toLowerCase().lastIndexOf(marker);
        if (idx !== -1) {
            text = body.slice(0, idx).trim();
            timestamp = body.slice(idx + marker.length).trim() || null;
        }

        // Handle accidental empty text
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
            const phone = (c.phone_number ?? '').toLowerCase();
            const label = (c.label ?? '').toLowerCase();
            const preview = makePreviewFromContent(c.content).toLowerCase();
            return (
                name.includes(q) || phone.includes(q) || label.includes(q) || preview.includes(q)
            );
        });
    }, [convos, search]);

    const messages = useMemo(() => parseTranscript(active?.content ?? null), [active]);

    return (
        <div style={styles.shell}>
            {/* LEFT LIST */}
            <aside style={styles.left}>
                <div style={styles.leftHeader}>
                    <div>
                        <div style={styles.title}>WhatsApp</div>
                        <div style={styles.subtitle}>Read-only conversations</div>
                    </div>
                </div>

                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, phone, label..."
                    style={styles.search}
                />

                {errorList && <div style={styles.alert}>Error: {errorList}</div>}

                <div style={styles.list}>
                    {loadingList ? (
                        <div style={styles.muted}>Loading conversations…</div>
                    ) : filteredConvos.length === 0 ? (
                        <div style={styles.muted}>No conversations found.</div>
                    ) : (
                        filteredConvos.map((c) => {
                            const isActive = active?.whatsapp_user_id === c.whatsapp_user_id;

                            const title =
                                c.name?.trim() ||
                                c.phone_number?.trim() ||
                                c.whatsapp_user_id.slice(0, 8) + '…';

                            const preview = makePreviewFromContent(c.content);
                            const ts = formatTime(c.updated_at);

                            return (
                                <button
                                    key={c.whatsapp_user_id}
                                    onClick={() => setActive(c)}
                                    style={{
                                        ...styles.item,
                                        ...(isActive ? styles.itemActive : {}),
                                    }}
                                >
                                    <div style={styles.itemTop}>
                                        <div style={styles.itemTitle}>{title}</div>
                                        <div style={styles.itemTime}>{ts}</div>
                                    </div>

                                    <div style={styles.itemMid}>
                                        <div style={styles.itemSub}>
                                            {c.phone_number ? `+${c.phone_number}` : ''}
                                            {c.label ? ` • ${c.label}` : ''}
                                        </div>
                                    </div>

                                    <div style={styles.itemPreview}>{preview || '—'}</div>
                                </button>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* RIGHT THREAD */}
            <section style={styles.right}>
                {!active ? (
                    <div style={styles.emptyState}>Select a conversation to view messages.</div>
                ) : (
                    <>
                        <div style={styles.threadHeader}>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={styles.threadTitle}>
                                    {active.name?.trim() || active.phone_number || active.whatsapp_user_id}
                                </div>
                                <div style={styles.threadSub}>
                                    {active.phone_number ? `+${active.phone_number}` : ''}
                                    {active.label ? ` • ${active.label}` : ''}
                                </div>
                            </div>
                            <div style={styles.threadMeta}>
                                <div style={styles.threadMetaLabel}>Updated</div>
                                <div style={styles.threadMetaValue}>{formatTime(active.updated_at)}</div>
                            </div>
                        </div>

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
                                        <div
                                            style={{
                                                ...styles.bubble,
                                                ...(isUser ? styles.bubbleUser : styles.bubbleBot),
                                            }}
                                        >
                                            <div style={styles.msgText}>{m.text}</div>
                                            {m.timestamp && (
                                                <div style={styles.msgTime}>{formatTime(m.timestamp)}</div>
                                            )}
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
    shell: {
        display: 'grid',
        gridTemplateColumns: '360px 1fr',
        gap: 14,
        minHeight: 'calc(100vh - 60px)',
    },

    left: {
        border: '1px solid #1f1f1f',
        borderRadius: 14,
        background: '#0b0b0b',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    leftHeader: {
        padding: 14,
        borderBottom: '1px solid #1f1f1f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: { fontSize: 16, fontWeight: 900 },
    subtitle: { fontSize: 12, color: '#9e9e9e', marginTop: 4 },

    search: {
        margin: 12,
        height: 40,
        borderRadius: 10,
        border: '1px solid #1f1f1f',
        background: '#0f0f0f',
        color: '#fff',
        padding: '0 12px',
        outline: 'none',
    },

    alert: {
        margin: '0 12px 12px',
        padding: 10,
        borderRadius: 10,
        border: '1px solid #3a1f1f',
        background: '#140b0b',
        color: '#ffb4b4',
        fontSize: 13,
    },

    list: { padding: 12, display: 'grid', gap: 10, overflow: 'auto' },
    muted: { color: '#9e9e9e', padding: 12 },

    item: {
        textAlign: 'left',
        padding: 12,
        borderRadius: 12,
        border: '1px solid #1f1f1f',
        background: '#0f0f0f',
        color: '#fff',
        cursor: 'pointer',
    },
    itemActive: { border: '1px solid #fff' },

    itemTop: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 10,
    },
    itemTitle: { fontWeight: 900, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis' },
    itemTime: { fontSize: 11, color: '#9e9e9e', whiteSpace: 'nowrap' },
    itemMid: { marginTop: 6 },
    itemSub: { fontSize: 12, color: '#bdbdbd' },
    itemPreview: { marginTop: 8, fontSize: 12, color: '#9e9e9e', lineHeight: 1.35 },

    right: {
        border: '1px solid #1f1f1f',
        borderRadius: 14,
        background: '#0b0b0b',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    emptyState: { padding: 18, color: '#9e9e9e' },

    threadHeader: {
        padding: 14,
        borderBottom: '1px solid #1f1f1f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    threadTitle: { fontWeight: 950, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden' },
    threadSub: { fontSize: 12, color: '#bdbdbd', marginTop: 4 },

    threadMeta: { textAlign: 'right' },
    threadMetaLabel: { fontSize: 11, color: '#9e9e9e' },
    threadMetaValue: { fontSize: 12, color: '#d8d8d8', marginTop: 4 },

    threadBody: {
        padding: 14,
        overflow: 'auto',
        display: 'grid',
        gap: 10,
        background: '#0f0f0f',
        flex: 1,
    },

    msgRow: { display: 'flex' },
    bubble: {
        maxWidth: 720,
        borderRadius: 14,
        padding: 12,
        border: '1px solid #1f1f1f',
    },
    bubbleBot: { background: '#0b0b0b', color: '#fff' },
    bubbleUser: { background: '#ffffff', color: '#000', border: '1px solid #ffffff' },

    msgText: { fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap' },
    msgTime: { fontSize: 11, opacity: 0.7, marginTop: 8 },

    systemWrap: { display: 'flex', justifyContent: 'center' },
    systemMsg: {
        fontSize: 12,
        color: '#9e9e9e',
        border: '1px dashed #2a2a2a',
        padding: '8px 10px',
        borderRadius: 12,
        background: '#0b0b0b',
    },
};