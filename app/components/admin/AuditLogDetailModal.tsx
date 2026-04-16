import { CSSProperties } from 'react';
import { colors } from '../shared/constants';
import type { AuditLog } from '@/app/types/admin';

type AuditLogDetailModalProps = {
  log: AuditLog;
  onClose: () => void;
};

export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span style={{ color: colors.text.tertiary, fontStyle: 'italic' }}>null</span>;
    }
    if (typeof value === 'object') {
      return <pre style={styles.jsonValue}>{JSON.stringify(value, null, 2)}</pre>;
    }
    return <span style={styles.value}>{String(value)}</span>;
  };

  const getActionColor = (action: string) => {
    if (action.includes('suspended')) return '#fca5a5';
    if (action.includes('activated')) return '#86efac';
    if (action.includes('updated')) return '#93c5fd';
    if (action.includes('deleted')) return '#fca5a5';
    if (action.includes('created')) return '#86efac';
    return colors.text.primary;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.content} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.title}>Audit Log Details</div>
            <div style={styles.subtitle}>
              {new Date(log.created_at).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'long',
              })}
            </div>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Action Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Action</div>
            <div style={{ 
              ...styles.actionBadge, 
              color: getActionColor(log.action),
              borderColor: getActionColor(log.action) + '40',
              background: getActionColor(log.action) + '15',
            }}>
              {log.action}
            </div>
          </div>

          {/* Admin & Company Section */}
          <div style={styles.grid}>
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Administrator</div>
              <div style={styles.infoCard}>
                <div style={styles.label}>Email</div>
                <div style={styles.value}>{log.admin_email || 'Unknown'}</div>
              </div>
            </div>

            {log.company_name && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Company</div>
                <div style={styles.infoCard}>
                  <div style={styles.label}>Name</div>
                  <div style={styles.value}>{log.company_name}</div>
                </div>
              </div>
            )}
          </div>

          {/* Entity Section */}
          {log.entity_type && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Entity</div>
              <div style={styles.grid}>
                <div style={styles.infoCard}>
                  <div style={styles.label}>Type</div>
                  <div style={styles.value}>{log.entity_type}</div>
                </div>
                {log.entity_id && (
                  <div style={styles.infoCard}>
                    <div style={styles.label}>ID</div>
                    <div style={styles.valueSmall}>{log.entity_id}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Changes Section */}
          {(log.before_value || log.after_value) && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Changes</div>
              <div style={styles.changesGrid}>
                {/* Before Value */}
                <div style={styles.changeCard}>
                  <div style={styles.changeHeader}>
                    <span style={styles.changeLabel}>Before</span>
                    {!log.before_value && (
                      <span style={styles.changeNote}>(New Record)</span>
                    )}
                  </div>
                  <div style={styles.changeContent}>
                    {formatValue(log.before_value)}
                  </div>
                </div>

                {/* Arrow */}
                <div style={styles.arrow}>→</div>

                {/* After Value */}
                <div style={styles.changeCard}>
                  <div style={styles.changeHeader}>
                    <span style={styles.changeLabel}>After</span>
                    {!log.after_value && (
                      <span style={styles.changeNote}>(Deleted)</span>
                    )}
                  </div>
                  <div style={styles.changeContent}>
                    {formatValue(log.after_value)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Metadata</div>
            <div style={styles.grid}>
              {log.ip_address && (
                <div style={styles.infoCard}>
                  <div style={styles.label}>IP Address</div>
                  <div style={styles.valueSmall}>{log.ip_address}</div>
                </div>
              )}
              {log.user_agent && (
                <div style={styles.infoCard}>
                  <div style={styles.label}>User Agent</div>
                  <div style={styles.valueSmall}>{log.user_agent}</div>
                </div>
              )}
              <div style={styles.infoCard}>
                <div style={styles.label}>Log ID</div>
                <div style={styles.valueSmall}>{log.id}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.closeButtonBottom} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
    overflowY: 'auto',
  },
  content: {
    background: 'rgba(12,18,32,0.95)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    maxWidth: 900,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 40px 140px rgba(0,0,0,0.75)',
    margin: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    position: 'sticky',
    top: 0,
    background: 'rgba(12,18,32,0.98)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 900,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  closeButton: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10,
    color: colors.text.secondary,
    fontSize: 20,
    cursor: 'pointer',
    padding: 0,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  body: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 900,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  actionBadge: {
    display: 'inline-block',
    padding: '10px 18px',
    borderRadius: 12,
    border: '1px solid',
    fontSize: 15,
    fontWeight: 850,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 12,
  },
  infoCard: {
    padding: 14,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: 900,
    color: colors.text.primary,
    wordBreak: 'break-word',
  },
  valueSmall: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.text.primary,
    wordBreak: 'break-all',
    fontFamily: 'monospace',
  },
  changesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: 16,
    alignItems: 'start',
  },
  changeCard: {
    padding: 16,
    background: 'rgba(0,0,0,0.30)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
  },
  changeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: 900,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  changeNote: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  changeContent: {
    minHeight: 60,
  },
  jsonValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.text.primary,
    background: 'rgba(0,0,0,0.40)',
    padding: 12,
    borderRadius: 8,
    overflow: 'auto',
    margin: 0,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  arrow: {
    fontSize: 24,
    color: colors.text.tertiary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  footer: {
    padding: 24,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'flex-end',
    position: 'sticky',
    bottom: 0,
    background: 'rgba(12,18,32,0.98)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  closeButtonBottom: {
    padding: '12px 24px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 750,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
