import { ReactNode } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';
import { SearchInput } from './SearchInput';

type ChatInterfaceProps = {
  title: string;
  subtitle: string;
  conversations: any[];
  activeConversation: any;
  onConversationSelect: (conversation: any) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  error?: string | null;
  renderConversationItem: (conversation: any, isActive: boolean) => ReactNode;
  renderChatHeader: (conversation: any) => ReactNode;
  renderMessages: (conversation: any) => ReactNode;
  getConversationId: (conversation: any) => string;
  emptyMessage?: string;
};

export function ChatInterface({
  title,
  subtitle,
  conversations,
  activeConversation,
  onConversationSelect,
  searchValue,
  onSearchChange,
  loading,
  error,
  renderConversationItem,
  renderChatHeader,
  renderMessages,
  getConversationId,
  emptyMessage = 'No conversations found.',
}: ChatInterfaceProps) {
  return (
    <div style={styles.shell}>
      <style jsx global>{`
        @media (max-width: 980px) {
          .chatShell {
            grid-template-columns: 1fr !important;
          }
          .chatLeft {
            height: 42vh !important;
          }
          .chatRight {
            height: calc(100vh - 60px - 12px - 42vh) !important;
          }
        }
        @media (max-width: 640px) {
          .chatShell {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
          }
          .chatLeft {
            height: 35vh !important;
            border-radius: 10px !important;
          }
          .chatRight {
            height: calc(100vh - 50px - 6px - 35vh) !important;
            border-radius: 10px !important;
          }
          .chatHeaderRow {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .chatMetaPill {
            display: none !important;
          }
          .chatFontControls {
            position: absolute;
            top: 8px;
            right: 8px;
          }
        }
      `}</style>

      {/* Left Panel - Conversations */}
      <aside style={styles.left} className="chatLeft">
        <div style={styles.leftHeader}>
          <div style={{ minWidth: 0 }}>
            <div style={styles.title}>{title}</div>
            <div style={styles.subtitle}>{subtitle}</div>
          </div>

          <div style={styles.pill}>
            <span style={styles.pillDot} />
            <span style={styles.pillText}>Live</span>
          </div>
        </div>

        <div style={styles.searchWrap}>
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Search conversations..."
          />
        </div>

        {error && (
          <div style={styles.alert}>
            <b>Error:</b> {error}
          </div>
        )}

        <div style={styles.list}>
          {loading ? (
            <div style={styles.muted}>Loading conversations…</div>
          ) : conversations.length === 0 ? (
            <div style={styles.muted}>{emptyMessage}</div>
          ) : (
            conversations.map((conversation) => {
              const id = getConversationId(conversation);
              const isActive = activeConversation && getConversationId(activeConversation) === id;

              return (
                <div
                  key={id}
                  onClick={() => onConversationSelect(conversation)}
                  style={{
                    ...styles.item,
                    ...(isActive ? styles.itemActive : {}),
                  }}
                >
                  {renderConversationItem(conversation, isActive)}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Panel - Chat */}
      <section style={styles.right} className="chatRight">
        {!activeConversation ? (
          <div style={styles.emptyState}>Select a conversation to view messages.</div>
        ) : (
          <>
            <div style={styles.chatHeader}>
              {renderChatHeader(activeConversation)}
            </div>
            <div style={styles.chatBody}>
              {renderMessages(activeConversation)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

const styles = {
  shell: {
    display: 'grid',
    gridTemplateColumns: '360px 1fr',
    gap: spacing.sm,
    height: 'calc(100vh - 60px)',
    overflow: 'hidden',
    minHeight: 0,
  },
  left: {
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.card.border}`,
    background: colors.card.background,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    boxShadow: '0 14px 55px rgba(0,0,0,0.40)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: 0,
  },
  right: {
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.card.border}`,
    background: colors.card.background,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    boxShadow: '0 14px 55px rgba(0,0,0,0.40)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: 0,
  },
  leftHeader: {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.card.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flex: '0 0 auto',
  },
  title: { fontSize: 16, fontWeight: 950, letterSpacing: -0.2 },
  subtitle: { fontSize: 12, color: colors.text.tertiary, marginTop: 4 },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 999,
    padding: '8px 10px',
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.18)',
    flex: '0 0 auto',
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: colors.accent,
    boxShadow: `0 0 0 6px rgba(0,153,249,0.12)`,
  },
  pillText: { fontSize: 12, fontWeight: 900, color: colors.text.secondary },
  searchWrap: { padding: spacing.sm, flex: '0 0 auto' },
  alert: {
    margin: `0 ${spacing.sm}px ${spacing.sm}px`,
    padding: 10,
    borderRadius: borderRadius.sm,
    border: '1px solid rgba(255,90,90,0.35)',
    background: 'rgba(255,60,60,0.08)',
    color: '#ffb4b4',
    fontSize: 13,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    flex: '0 0 auto',
  },
  list: {
    padding: spacing.sm,
    display: 'grid',
    gap: 10,
    overflow: 'auto',
    minHeight: 0,
    flex: '1 1 auto',
  },
  muted: { color: colors.text.tertiary, padding: spacing.sm },
  item: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.20)',
    color: colors.text.primary,
    cursor: 'pointer',
  },
  itemActive: {
    border: `1px solid ${colors.card.borderAccent}`,
    boxShadow: '0 0 0 1px rgba(0,153,249,0.18), 0 14px 45px rgba(0,0,0,0.35)',
  },
  emptyState: { padding: spacing.lg, color: colors.text.tertiary },
  chatHeader: {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.card.border}`,
    flex: '0 0 auto',
  },
  chatBody: {
    padding: spacing.md,
    overflow: 'auto',
    background: 'rgba(0,0,0,0.18)',
    flex: '1 1 auto',
    minHeight: 0,
  },
};