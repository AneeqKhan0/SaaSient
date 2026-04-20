'use client';

import { ReactNode, useState } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';

type DetailPanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode | ((detailSearch: string) => ReactNode);
  searchable?: boolean;
};

export function DetailPanel({ title, subtitle, children, searchable = false }: DetailPanelProps) {
  const [detailSearch, setDetailSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div style={styles.container}>
      <style jsx>{`
        @media (max-width: 980px) {
          .detail-panel-container {
            height: 100vh !important;
            max-height: 100vh !important;
          }
          .detail-panel-body {
            max-height: calc(100vh - 120px) !important;
            -webkit-overflow-scrolling: touch !important;
          }
        }
        @media (max-width: 640px) {
          .detail-panel-body {
            max-height: calc(100vh - 140px) !important;
          }
        }
      `}</style>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={styles.title}>{title}</div>
            {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
          </div>

          {searchable && (
            <button
              onClick={() => { setShowSearch((v) => !v); if (showSearch) setDetailSearch(''); }}
              style={{
                ...styles.searchToggleBtn,
                ...(showSearch ? styles.searchToggleBtnActive : {}),
              }}
              title="Search in details"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search
            </button>
          )}
        </div>

        {searchable && showSearch && (
          <div style={styles.searchRow}>
            <div style={styles.searchInner}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                autoFocus
                type="text"
                value={detailSearch}
                onChange={(e) => setDetailSearch(e.target.value)}
                placeholder="Search fields…"
                style={styles.searchInput}
              />
              {detailSearch && (
                <button onClick={() => setDetailSearch('')} style={styles.clearBtn}>✕</button>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={styles.body} className="detail-panel-body">
        {typeof children === 'function' ? children(detailSearch) : children}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    minHeight: 0,
    maxHeight: '100%',
  },
  header: {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.12)',
    flex: '0 0 auto',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 980,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: colors.text.secondary,
  },
  searchToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(255,255,255,0.04)',
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    flex: '0 0 auto',
    transition: 'all 150ms ease',
    whiteSpace: 'nowrap' as const,
  },
  searchToggleBtnActive: {
    border: `1px solid rgba(0,153,249,0.40)`,
    background: 'rgba(0,153,249,0.12)',
    color: 'rgba(0,180,255,0.9)',
  },
  searchRow: {
    marginTop: 10,
  },
  searchInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(0,0,0,0.25)',
    border: `1px solid rgba(0,153,249,0.30)`,
    borderRadius: borderRadius.md,
    padding: '7px 10px',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: 500,
    minWidth: 0,
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: colors.text.secondary,
    fontSize: 12,
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: 4,
    flex: '0 0 auto',
  },
  body: {
    padding: spacing.md,
    overflow: 'auto',
    minHeight: 0,
    flex: '1 1 auto',
    maxHeight: '65vh',
    WebkitOverflowScrolling: 'touch' as const,
  },
};
