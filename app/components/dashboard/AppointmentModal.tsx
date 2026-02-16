import { colors, borderRadius, spacing } from '../shared/constants';

type AppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    customer_name?: string | null;
    appointment_time?: string | null;
    requirements?: string | null;
    email?: string | null;
    phone?: string | null;
    lead_score?: string | number | null;
  };
  formatFull: (date: string) => string;
};

export function AppointmentModal({ isOpen, onClose, appointment, formatFull }: AppointmentModalProps) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onMouseDown={onClose} className="appointmentModalOverlay">
      <style jsx global>{`
        @media (max-width: 768px) {
          .appointmentModal {
            max-width: 95vw !important;
            width: 95vw !important;
            max-height: 90vh !important;
          }
          .appointmentModalHeader {
            padding: 16px !important;
          }
          .appointmentModalTitle {
            font-size: 16px !important;
          }
          .appointmentModalBody {
            padding: 16px !important;
          }
          .appointmentModalRow {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .appointmentModalIcon {
            font-size: 24px !important;
          }
          .appointmentModalTitle {
            font-size: 15px !important;
          }
        }
      `}</style>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()} className="appointmentModal">
        <div style={styles.header} className="appointmentModalHeader">
          <div style={styles.headerContent}>
            <div style={styles.icon} className="appointmentModalIcon">📅</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={styles.title} className="appointmentModalTitle">
                {appointment.customer_name?.trim() || 'Unknown Lead'}
              </div>
              <div style={styles.subtitle}>
                {appointment.appointment_time ? formatFull(appointment.appointment_time) : 'No date specified'}
              </div>
            </div>
          </div>
          <button
            type="button"
            style={styles.closeButton}
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div style={styles.body} className="appointmentModalBody">
          {appointment.requirements && (
            <div style={styles.section}>
              <div style={styles.label}>Requirements</div>
              <div style={styles.value}>{appointment.requirements.trim()}</div>
            </div>
          )}

          <div style={styles.row} className="appointmentModalRow">
            {appointment.email && (
              <div style={styles.section}>
                <div style={styles.label}>Email</div>
                <div style={styles.value}>
                  <a href={`mailto:${appointment.email}`} style={styles.link}>
                    {appointment.email}
                  </a>
                </div>
              </div>
            )}
            {appointment.phone && (
              <div style={styles.section}>
                <div style={styles.label}>Phone</div>
                <div style={styles.value}>
                  <a href={`tel:${appointment.phone}`} style={styles.link}>
                    {appointment.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {appointment.lead_score && (
            <div style={styles.section}>
              <div style={styles.label}>Lead Score</div>
              <div style={styles.value}>{appointment.lead_score}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: 520,
    maxWidth: '90vw',
    maxHeight: '80vh',
    background: 'rgba(18,24,38,0.95)',
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.card.border}`,
    boxShadow: '0 30px 120px rgba(0,0,0,0.70)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.card.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    background: 'rgba(0,0,0,0.20)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  icon: {
    fontSize: 28,
    flex: '0 0 auto',
  },
  title: {
    fontSize: 18,
    fontWeight: 950,
    color: colors.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
    fontWeight: 600,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
    background: colors.card.background,
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 900,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 auto',
  },
  body: {
    padding: 20,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    flex: 1,
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.xs,
    padding: spacing.md,
    background: 'rgba(0,0,0,0.20)',
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
  },
  label: {
    fontSize: 11,
    fontWeight: 900,
    color: colors.text.tertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 1.5,
    fontWeight: 600,
    wordBreak: 'break-word' as const,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.sm,
  },
  link: {
    color: colors.accent,
    textDecoration: 'none',
    fontWeight: 700,
  },
};