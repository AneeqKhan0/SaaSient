'use client';

import { ReactNode, useState, useEffect } from 'react';
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
  getNickname,
}: ChatInterfaceProps & { getNickname?: (conversation: any) => string | undefined }) {
  const [showChat, setShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 980);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && activeConversation) {
      setShowChat(true);
    }
  }, [activeConversation, isMobile]);

  const handleConversationSelect = (conversation: any) => {
    onConversationSelect(conversation);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleBackToList = () => {
    setShowChat(false);
  };

  return (
    <div style={styles.shell} className="chatShell">
      <style jsx global>{`
        @media (max-width: 980px) {
          .chatShell {
            grid-template-columns: 1fr !important;
            height: 100% !important;
          }
          .chatLeft {
            display: ${showChat ? 'none' : 'flex'} !important;
            height: 100% !important;
          }
          .chatRight {
            display: ${showChat ? 'flex' : 'none'} !important;
            height: 100% !important;
          }
          .chatMobileHeader {
            display: flex !important;
            align-items: flex-start !important;
          }
          .chatHeaderDesktop {
            display: none !important;
          }
        }
        @media (min-width: 981px) {
          .chatMobileHeader {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .chatShell {
            gap: 8px !important;
          }
          .chatLeft {
            border-radius: 12px !important;
          }
          .chatRight {
            border-radius: 12px !important;
          }
        }
      `}</style>

      {/* Left Panel - Conversations */}
      <aside style={styles.left} className="chatLeft chatSidebar">
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
                  onClick={() => handleConversationSelect(conversation)}
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
      <section style={styles.right} className="chatRight chatMain">
        {!activeConversation ? (
          <div style={styles.emptyState}>Select a conversation to view messages.</div>
        ) : (
          <>
            {isMobile && (
              <div style={styles.mobileHeader} className="chatMobileHeader">
                <button onClick={handleBackToList} style={styles.backBtn}>
                  ← 
                </button>
                <div style={styles.mobileHeaderContent}>
                  <div style={styles.mobileHeaderInfo}>
                    <div style={styles.mobileHeaderName}>
                      {activeConversation.name?.trim() || activeConversation.phone_number || 'Unknown'}
                    </div>
                    {activeConversation.phone_number && (
                      <div style={styles.mobileHeaderPhone}>
                        {activeConversation.phone_number}
                      </div>
                    )}
                  </div>
                  {getNickname?.(activeConversation) && (
                    <div style={styles.mobileHeaderTag}>
                      🏷️ {getNickname(activeConversation)}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div style={styles.chatHeader} className={isMobile ? 'chatHeaderDesktop' : ''}>
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
    height: '100%',
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
  emptyState: { 
    padding: spacing.lg, 
    color: colors.text.tertiary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  mobileHeader: {
    display: 'none',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    padding: spacing.md,
    borderBottom: `1px solid ${colors.card.border}`,
    background: 'rgba(12,18,32,0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    alignItems: 'flex-start',
    gap: spacing.md,
    flex: '0 0 auto',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.30)',
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 900,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 auto',
  },
  mobileHeaderContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  mobileHeaderInfo: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  mobileHeaderName: {
    fontSize: 16,
    fontWeight: 950,
    color: colors.text.primary,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  mobileHeaderPhone: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: 600,
    marginTop: 2,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  mobileHeaderTag: {
    fontSize: 11,
    color: 'rgba(0,180,255,0.9)',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: borderRadius.sm,
    border: `1px solid rgba(0,153,249,0.35)`,
    background: 'rgba(0,153,249,0.12)',
    whiteSpace: 'nowrap' as const,
    flex: '0 0 auto',
    maxWidth: '100px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
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
    WebkitOverflowScrolling: 'touch' as const,
  },
};