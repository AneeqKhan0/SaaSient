'use client';

import { useEffect, useMemo, useState, CSSProperties } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChatInterface } from '@/app/components/dashboard/ChatInterface';
import { ConversationItem } from '@/app/components/dashboard/ConversationItem';
import { ChatMessage } from '@/app/components/dashboard/ChatMessage';
import { useFormatters } from '@/app/components/shared/hooks';
import { colors, borderRadius } from '@/app/components/shared/constants';

type ConversationRow = {
  whatsapp_user_id: string;
  name: string | null;
  phone_number: string | null;
  label: string | null;
  content: string | null;
  updated_at: string | null;
};

/** Create a unique key per conversation (phone_number is unique per contact) */
function getConvoKey(c: ConversationRow): string {
  return c.phone_number?.trim() || c.name?.trim() || c.whatsapp_user_id;
}

type ChatMessageType = {
  id: string;
  sender: 'bot' | 'user' | 'system';
  text: string;
  timestamp?: string | null;
};

const FONT_SIZES = [11, 13, 15, 17] as const;
const NICKNAMES_PREFIX = 'saasient_wa_nicknames_';

function loadNicknames(userId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(NICKNAMES_PREFIX + userId);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNicknames(userId: string, nicknames: Record<string, string>) {
  try {
    localStorage.setItem(NICKNAMES_PREFIX + userId, JSON.stringify(nicknames));
  } catch { /* ignore */ }
}

export default function WhatsAppPage() {
  const [convos, setConvos] = useState<ConversationRow[]>([]);
  const [active, setActive] = useState<ConversationRow | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [fontSizeIdx, setFontSizeIdx] = useState(1); // default 13px
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);

  const { formatTime } = useFormatters();

  // Load user ID and nicknames from localStorage on mount
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setNicknames(loadNicknames(user.id));
      }
    })();
  }, []);

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
      const nick = (nicknames[getConvoKey(c)] ?? '').toLowerCase();
      return name.includes(q) || label.includes(q) || phone.includes(q) || nick.includes(q);
    });
  }, [convos, search, nicknames]);

  const messages = useMemo(() => parseTranscript(active?.content ?? null), [active]);

  function parseTranscript(content: string | null): ChatMessageType[] {
    if (!content || !content.trim()) {
      return [{ id: 'empty', sender: 'system', text: 'No messages found in this conversation.' }];
    }

    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const msgs: ChatMessageType[] = [];

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const lower = raw.toLowerCase();

      let sender: ChatMessageType['sender'] = 'system';
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
        timestamp: timestamp ? formatTime(timestamp) : null,
      });
    }

    return msgs;
  }

  function getDisplayName(conversation: ConversationRow): string {
    return (
      conversation.name?.trim() ||
      conversation.phone_number?.trim() ||
      conversation.whatsapp_user_id.slice(0, 8) + '…'
    );
  }

  function handleNicknameChange(contactId: string, newNickname: string) {
    const updated = { ...nicknames };
    if (newNickname) {
      updated[contactId] = newNickname;
    } else {
      delete updated[contactId];
    }
    setNicknames(updated);
    if (userId) saveNicknames(userId, updated);
  }

  const currentFontSize = FONT_SIZES[fontSizeIdx];

  return (
    <div className="chatShell">
      <ChatInterface
        title="WhatsApp"
        subtitle="Read-only conversations"
        conversations={filteredConvos}
        activeConversation={active}
        onConversationSelect={setActive}
        searchValue={search}
        onSearchChange={setSearch}
        loading={loadingList}
        error={errorList}
        getConversationId={(c) => getConvoKey(c)}
        getNickname={(c) => nicknames[getConvoKey(c)]}
        emptyMessage="No conversations found."
        renderConversationItem={(conversation, isActive) => (
          <ConversationItem
            name={getDisplayName(conversation)}
            label={conversation.label?.trim()}
            isActive={isActive}
            nickname={nicknames[getConvoKey(conversation)]}
            onNicknameChange={(nn) => handleNicknameChange(getConvoKey(conversation), nn)}
          />
        )}
        renderChatHeader={(conversation) => {
          const currentNickname = nicknames[getConvoKey(conversation)];
          return (
            <div style={styles.chatHeader} className="chatHeaderRow">
              <div style={{ overflow: 'hidden', minWidth: 0, flex: '1 1 auto' }}>
                <div style={styles.chatTitle}>
                  {conversation.name?.trim() || conversation.phone_number || conversation.whatsapp_user_id}
                </div>

                {/* Phone number + label + custom tag under name */}
                <div style={styles.contactInfo}>
                  {conversation.phone_number && (
                    <span style={styles.contactChip}>
                      📞 {conversation.phone_number}
                    </span>
                  )}
                  {conversation.label && (
                    <span style={styles.contactChip}>
                      {conversation.label}
                    </span>
                  )}
                  {currentNickname && (
                    <span style={styles.tagChip}>
                      🏷️ {currentNickname}
                    </span>
                  )}
                </div>
              </div>

              {/* Font size controls */}
              <div style={styles.fontControls} className="chatFontControls">
                <button
                  onClick={() => setFontSizeIdx((i) => Math.max(0, i - 1))}
                  disabled={fontSizeIdx === 0}
                  style={{
                    ...styles.fontBtn,
                    opacity: fontSizeIdx === 0 ? 0.3 : 1,
                  }}
                  title="Decrease font size"
                >
                  A−
                </button>
                <span style={styles.fontLabel}>{currentFontSize}px</span>
                <button
                  onClick={() => setFontSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
                  disabled={fontSizeIdx === FONT_SIZES.length - 1}
                  style={{
                    ...styles.fontBtn,
                    opacity: fontSizeIdx === FONT_SIZES.length - 1 ? 0.3 : 1,
                  }}
                  title="Increase font size"
                >
                  A+
                </button>
              </div>

              <div style={styles.metaPill} className="chatMetaPill">
                <div style={styles.metaLabel}>Updated</div>
                <div style={styles.metaValue}>{formatTime(conversation.updated_at)}</div>
              </div>
            </div>
          );
        }}
        renderMessages={(conversation) => (
          <div style={styles.messagesContainer}>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                sender={message.sender}
                text={message.text}
                timestamp={message.timestamp}
                fontSize={currentFontSize}
              />
            ))}
          </div>
        )}
      />

      <style jsx global>{`
        @media (max-width: 768px) {
          .chatShell {
            grid-template-columns: 1fr !important;
          }
          .chatSidebar {
            display: none !important;
          }
          .chatMain {
            border-left: none !important;
          }
          .chatHeaderRow {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .chatFontControls {
            order: 3;
            width: 100%;
          }
          .chatMetaPill {
            min-width: auto !important;
            flex: 1 1 auto !important;
          }
        }
        @media (max-width: 480px) {
          .chatHeaderRow {
            font-size: 13px !important;
          }
          .chatFontControls {
            padding: 6px 8px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chatTitle: {
    fontWeight: 980,
    fontSize: 15,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  contactInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  contactChip: {
    fontSize: 11,
    color: colors.text.secondary,
    padding: '2px 8px',
    borderRadius: borderRadius.xs,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(255,255,255,0.04)',
    whiteSpace: 'nowrap',
  },
  tagChip: {
    fontSize: 11,
    color: 'rgba(0,180,255,0.9)',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: borderRadius.xs,
    border: `1px solid rgba(0,153,249,0.35)`,
    background: 'rgba(0,153,249,0.12)',
    whiteSpace: 'nowrap',
  },
  fontControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flex: '0 0 auto',
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.18)',
    padding: '4px 6px',
  },
  fontBtn: {
    background: 'none',
    border: 'none',
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: borderRadius.xs,
    transition: 'background 0.15s',
  },
  fontLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    minWidth: 30,
    textAlign: 'center',
  },
  chatSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  metaPill: {
    textAlign: 'right',
    borderRadius: 12,
    padding: '8px 10px',
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.18)',
    minWidth: 170,
    flex: '0 0 auto',
  },
  metaLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
  },
  metaValue: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 4,
  },
  messagesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
};