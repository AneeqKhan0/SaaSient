'use client';

import { ReactNode, useState, useEffect } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';
import { SearchInput } from './SearchInput';
import { Button } from '../shared/Button';

type DataTableProps = {
  title: string;
  subtitle?: string;
  data: any[];
  loading: boolean;
  error?: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onDownload?: () => void;
  downloading?: boolean;
  tabs?: Array<{ id: string; label: string; active: boolean; onClick: () => void }>;
  renderItem: (item: any, isActive: boolean, onClick: () => void) => ReactNode;
  renderDetail: (item: any) => ReactNode;
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
  getItemId: (item: any) => string;
  emptyMessage?: string;
  note?: string;
};

export function DataTable({
  title,
  subtitle,
  data,
  loading,
  error,
  searchValue,
  onSearchChange,
  onDownload,
  downloading,
  tabs,
  renderItem,
  renderDetail,
  activeId,
  onActiveChange,
  getItemId,
  emptyMessage = 'No items found.',
  note,
}: DataTableProps) {
  const [showDetail, setShowDetail] = useState(false);
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
    if (isMobile && activeId) {
      setShowDetail(true);
    }
  }, [activeId, isMobile]);

  const activeItem = data.find((item) => getItemId(item) === activeId) || null;

  const handleItemClick = (id: string) => {
    onActiveChange(id);
    if (isMobile) {
      setShowDetail(true);
    }
  };

  const handleBackToList = () => {
    setShowDetail(false);
  };

  const getItemTitle = (item: any): string => {
    return item?.customer_name || item?.name || item?.phone || item?.email || 'Item';
  };

  return (
    <div style={styles.shell} className="dataTableShell">
      <style jsx global>{`
        @media (max-width: 980px) {
          .dataTableShell {
            height: 100% !important;
          }
          .dataTableSplit {
            grid-template-columns: 1fr !important;
          }
          .dataTableLeft {
            display: ${showDetail ? 'none' : 'grid'} !important;
            max-height: none !important;
            height: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.10) !important;
          }
          .dataTableRight {
            display: ${showDetail ? 'flex' : 'none'} !important;
            height: 100% !important;
          }
          .dataTableHeader {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .dataTableHeaderRight {
            width: 100%;
            justify-content: flex-start !important;
          }
          .dataTableMobileHeader {
            display: flex !important;
          }
        }
        @media (min-width: 981px) {
          .dataTableMobileHeader {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .dataTableShell {
            gap: 8px !important;
          }
          .dataTableContent {
            border-radius: 12px !important;
          }
          .dataTableSegment {
            width: 100%;
          }
          .dataTableSegment button {
            flex: 1;
            font-size: 13px !important;
          }
          .dataTableSearchRow {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .dataTableCountPill {
            width: 100%;
            justify-content: center !important;
          }
        }
      `}</style>
      {/* Header */}
      <div style={styles.header} className="dataTableHeader">
        <div style={{ minWidth: 0 }}>
          <div style={styles.h1}>{title}</div>
          {subtitle && <div style={styles.sub}>{subtitle}</div>}
        </div>

        <div style={styles.headerRight} className="dataTableHeaderRight">
          {tabs && (
            <div style={styles.segment} className="dataTableSegment">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={tab.onClick} style={segBtn(tab.active)}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {onDownload && (
            <Button
              onClick={onDownload}
              disabled={loading || downloading || data.length === 0}
              variant="primary"
            >
              {downloading ? 'Preparing…' : 'Download CSV'}
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchRow} className="dataTableSearchRow">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Search..."
        />

        <div style={styles.countPill} className="dataTableCountPill">
          <span style={styles.countDot} />
          <span style={{ fontWeight: 950 }}>
            {loading ? 'Loading…' : `${data.length} items`}
          </span>
        </div>
      </div>

      {error && (
        <div style={styles.alert}>
          <b>Error:</b> {error}
        </div>
      )}

      {/* Content */}
      <div style={styles.content} className="dataTableContent">
        <div style={styles.split} className="dataTableSplit">
          {/* Left List */}
          <aside style={styles.left} className="dataTableLeft">
            {loading ? (
              <div style={styles.muted}>Loading...</div>
            ) : data.length === 0 ? (
              <div style={styles.muted}>{emptyMessage}</div>
            ) : (
              data.map((item) => {
                const id = getItemId(item);
                const isActive = activeId === id;
                return (
                  <div key={id}>
                    {renderItem(item, isActive, () => handleItemClick(id))}
                  </div>
                );
              })
            )}
          </aside>

          {/* Right Detail */}
          <section style={styles.right} className="dataTableRight">
            {!activeItem ? (
              <div style={styles.emptyState}>Select an item to view details.</div>
            ) : (
              <>
                {isMobile && (
                  <div style={styles.mobileHeader} className="dataTableMobileHeader">
                    <button onClick={handleBackToList} style={styles.backBtn}>
                      ←
                    </button>
                    <div style={styles.mobileHeaderTitle}>
                      {getItemTitle(activeItem)}
                    </div>
                  </div>
                )}
                {renderDetail(activeItem)}
              </>
            )}
          </section>
        </div>
      </div>

      {note && <div style={styles.note}>{note}</div>}
    </div>
  );
}

function segBtn(active: boolean) {
  return {
    height: 38,
    padding: '0 12px',
    borderRadius: borderRadius.sm,
    border: active ? `1px solid ${colors.card.borderAccent}` : `1px solid ${colors.card.border}`,
    background: active ? 'rgba(0,153,249,0.16)' : 'rgba(0,0,0,0.18)',
    color: colors.text.primary,
    fontWeight: 900,
    cursor: 'pointer',
  };
}

const styles = {
  shell: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.sm,
    minHeight: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  h1: { fontSize: 26, fontWeight: 980, letterSpacing: -0.4 },
  sub: { color: colors.text.secondary, marginTop: 6, fontSize: 13 },
  headerRight: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
    justifyContent: 'flex-end' as const,
    alignItems: 'center',
  },
  segment: {
    display: 'flex',
    gap: spacing.xs,
    padding: 6,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.card.border}`,
    background: colors.card.background,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  searchRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    borderRadius: 999,
    padding: '10px 12px',
    border: `1px solid ${colors.card.border}`,
    background: colors.card.background,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    flex: '0 0 auto',
  },
  countDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: colors.accent,
    boxShadow: `0 0 0 7px rgba(0,153,249,0.14)`,
  },
  alert: {
    border: '1px solid rgba(255,90,90,0.35)',
    background: 'rgba(255,60,60,0.08)',
    color: '#ffb4b4',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  content: {
    flex: '1 1 auto',
    minHeight: 0,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.card.border}`,
    background: colors.card.background,
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
    borderRight: `1px solid ${colors.card.border}`,
    padding: spacing.sm,
    overflow: 'auto',
    minHeight: 0,
    display: 'grid',
    gap: 10,
    background: 'rgba(0,0,0,0.14)',
  },
  right: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: 0,
  },
  muted: { color: colors.text.secondary, padding: spacing.sm },
  emptyState: { 
    padding: spacing.lg, 
    color: colors.text.secondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  mobileHeader: {
    display: 'none',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    padding: spacing.md,
    borderBottom: `1px solid ${colors.card.border}`,
    background: 'rgba(12,18,32,0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    alignItems: 'center',
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
  mobileHeaderTitle: {
    fontSize: 16,
    fontWeight: 950,
    color: colors.text.primary,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  note: { color: colors.text.tertiary, fontSize: 12 },
};