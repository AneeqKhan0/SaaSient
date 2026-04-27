'use client';

import { ReactNode, useState, useEffect } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';
import { SearchInput } from './SearchInput';

type CategoryTab = 'all' | 'buyer' | 'seller' | 'voiceagentfollowup';

const CATEGORY_TABS: { id: CategoryTab; label: string }[] = [
  { id: 'all',                label: 'All' },
  { id: 'buyer',              label: 'Buyer' },
  { id: 'seller',             label: 'Seller' },
  { id: 'voiceagentfollowup', label: 'Voice Agent Follow Up' },
];

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
  renderMessages: (conversation: any, chatSearch: string) => ReactNode;
  getConversationId: (conversation: any) => string;
  emptyMessage?: string;
  mobileShowChat?: boolean;
  onMobileBack?: () => void;
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
  mobileShowChat,
  onMobileBack,
}: ChatInterfaceProps & { getNickname?: (conversation: any) => string | undefined }) {
  const isControlled = mobileShowChat !== undefined;
  const [internalShowChat, setInternalShowChat] = useState(false);
  const showChat = isControlled ? mobileShowChat : internalShowChat;
  
  const [isMobile, setIsMobile] = useState(false);
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('all');
  const [chatSearch, setChatSearch] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);

  // Filter conversations by category tab
  const filteredByCategory = categoryTab === 'all'
    ? conversations
    : conversations.filter((c) => {
        const label = (c.label ?? '').toLowerCase().replace(/\s+/g, '');
        const tab = categoryTab.replace(/\s+/g, '');
        return label.includes(tab);
      });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 980);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isControlled && isMobile && activeConversation) {
      setInternalShowChat(true);
    }
  }, [activeConversation, isMobile, isControlled]);

  const handleConversationSelect = (conversation: any) => {
    setChatSearch('');
    onConversationSelect(conversation);
    if (!isControlled && isMobile) {
      setInternalShowChat(true);
    }
  };

  const handleBackToList = () => {
    if (isControlled && onMobileBack) {
      onMobileBack();
    } else {
      setInternalShowChat(false);
    }
  };

  return (
    <div style={styles.shell} className="chatShell">
      <style jsx global>{`
        @media (max-width: 980px) {
          .chatShell {
            grid-template-columns: 1fr !important;
            height: 100vh !important;
            max-height: 100vh !important;
          }
          .chatLeft {
            display: ${showChat ? 'none' : 'flex'} !important;
            height: 100vh !important;
            max-height: 100vh !important;
            overflow: hidden !important;
          }
          .chatRight {
            display: ${showChat ? 'flex' : 'none'} !important;
            height: 100vh !important;
            max-height: 100vh !important;
            overflow: hidden !important;
          }
          .chatMobileHeader {
            display: flex !important;
            align-items: flex-start !important;
            flex: 0 0 auto !important;
          }
          .chatHeaderDesktop {
            display: none !important;
          }
          .chatRight .chatBody {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            max-height: calc(100vh - 140px) !important;
            height: calc(100vh - 140px) !important;
          }
          .chatLeft .list {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            max-height: calc(100vh - 160px) !important;
          }
        }
        @media (min-width: 981px) {
          .chatMobileHeader {
            display: none !important;
          }
          .chatRight .chatBody {
            overflow-y: auto !important;
            max-height: calc(100vh - 250px) !important;
          }
        }
        @media (max-width: 640px) {
          .chatShell {
            gap: 8px !important;
            height: 100vh !important;
            padding: 8px !important;
          }
          .chatLeft {
            border-radius: 12px !important;
            height: calc(100vh - 16px) !important;
          }
          .chatRight {
            border-radius: 12px !important;
            height: calc(100vh - 16px) !important;
          }
          .chatRight .chatBody {
            max-height: calc(100vh - 180px) !important;
            height: calc(100vh - 180px) !important;
          }
          .chatLeft .list {
            max-height: calc(100vh - 200px) !important;
          }
        }

        /* Hover effects for conversation items */
        .chatLeft .conversation-item:hover {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.15) !important;
        }

        /* Smooth scrolling */
        .chatLeft, .chatRight {
          scroll-behavior: smooth;
        }

        /* Ensure chat body scrolls */
        .chatRight {
          overflow: hidden !important;
        }
        .chatRight > div:last-child {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          max-height: calc(100vh - 200px) !important;
        }

        /* Desktop specific scrolling */
        @media (min-width: 981px) {
          .chatRight .chatBody {
            overflow-y: auto !important;
            max-height: calc(100vh - 250px) !important;
          }
        }

        /* Mobile touch scrolling improvements */
        @media (max-width: 980px) {
          .chatBody, .list {
            -webkit-overflow-scrolling: touch !important;
            overflow-scrolling: touch !important;
          }

          /* Prevent body scroll when scrolling chat */
          body.chat-open {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
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

        {/* Category filter tabs */}
        <div style={styles.categoryTabsRow}>
          {CATEGORY_TABS.map((ct) => (
            <button
              key={ct.id}
              onClick={() => setCategoryTab(ct.id)}
              style={catTabBtn(categoryTab === ct.id)}
            >
              {ct.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={styles.alert}>
            <b>Error:</b> {error}
          </div>
        )}

        <div style={styles.list} className="list">
          {loading ? (
            <div style={styles.muted}>Loading conversations…</div>
          ) : filteredByCategory.length === 0 ? (
            <div style={styles.muted}>{emptyMessage}</div>
          ) : (
            filteredByCategory.map((conversation) => {
              const id = getConversationId(conversation);
              const isActive = activeConversation && getConversationId(activeConversation) === id;

              return (
                <div
                  key={id}
                  onClick={() => handleConversationSelect(conversation)}
                  className="conversation-item"
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
            {/* In-chat search */}
            <div style={styles.chatSearchRow}>
              {showChatSearch ? (
                <div style={styles.chatSearchInner}>
                  <span style={styles.chatSearchIcon}>🔍</span>
                  <input
                    autoFocus
                    type="text"
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder="Search in this conversation…"
                    style={styles.chatSearchInput}
                  />
                  {chatSearch && (
                    <button onClick={() => setChatSearch('')} style={styles.chatSearchClear}>✕</button>
                  )}
                  <button
                    onClick={() => { setShowChatSearch(false); setChatSearch(''); }}
                    style={styles.chatSearchClose}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowChatSearch(true)} style={styles.chatSearchToggle}>
                  🔍 Search in chat
                </button>
              )}
            </div>
            <div style={styles.chatBody} className="chatBody">
              {renderMessages(activeConversation, chatSearch)}
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
    maxHeight: '100%',
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
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    overflow: 'auto',
    minHeight: 0,
    maxHeight: '100%',
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
    transition: 'all 150ms ease',
    flex: '0 0 auto',
    minHeight: 'auto',
  },
  itemActive: {
    border: `1px solid ${colors.card.borderAccent}`,
    background: 'rgba(0,153,249,0.08)',
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
    maxHeight: 'calc(100vh - 280px)',
    WebkitOverflowScrolling: 'touch' as const,
    scrollBehavior: 'smooth' as const,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    position: 'relative' as const,
  },
  categoryTabsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    padding: `0 ${spacing.sm}px ${spacing.sm}px`,
    flex: '0 0 auto',
  },
  chatSearchRow: {
    padding: `${spacing.sm}px ${spacing.md}px`,
    flex: '0 0 auto',
    borderBottom: `1px solid ${colors.card.border}`,
    display: 'flex',
    alignItems: 'center',
  },
  chatSearchInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(0,0,0,0.25)',
    border: `1px solid rgba(0,153,249,0.30)`,
    borderRadius: borderRadius.md,
    padding: '6px 10px',
    flex: 1,
  },
  chatSearchIcon: {
    fontSize: 13,
    flex: '0 0 auto',
  },
  chatSearchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: 500,
  },
  chatSearchClear: {
    background: 'none',
    border: 'none',
    color: colors.text.secondary,
    fontSize: 12,
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
    flex: '0 0 auto',
  },
  chatSearchClose: {
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid ${colors.card.border}`,
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: borderRadius.xs,
    flex: '0 0 auto',
  },
  chatSearchToggle: {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${colors.card.border}`,
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: borderRadius.sm,
    transition: 'all 150ms ease',
    width: 'fit-content',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
};

function catTabBtn(active: boolean) {
  return {
    height: 30,
    padding: '0 12px',
    borderRadius: borderRadius.sm,
    border: active ? `1px solid ${colors.card.borderAccent}` : `1px solid ${colors.card.border}`,
    background: active ? 'rgba(0,153,249,0.16)' : 'rgba(0,0,0,0.18)',
    color: active ? colors.text.primary : colors.text.secondary,
    fontWeight: active ? 800 : 600,
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    whiteSpace: 'nowrap' as const,
  };
}
