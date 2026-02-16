'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { colors, borderRadius, spacing } from '../shared/constants';
import { useFormatters } from '../shared/hooks';

type Appointment = {
  id: string;
  customer_name: string | null;
  appointment_time: string | null;
  requirements: string | null;
  phone: string | null;
  email: string | null;
  lead_score: string | number | null;
  'Lead Category'?: string | null;
};

export function UpcomingAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const router = useRouter();
  const { formatTime, formatFull } = useFormatters();

  useEffect(() => {
    loadUpcomingAppointments();
  }, []);

  async function loadUpcomingAppointments() {
    try {
      const now = new Date();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);

      const { data, error } = await supabase
        .from('lead_store')
        .select('id, customer_name, appointment_time, requirements, phone, email, lead_score, "Lead Category"')
        .not('appointment_time', 'is', null)
        .gte('appointment_time', now.toISOString())
        .lte('appointment_time', endOfWeek.toISOString())
        .order('appointment_time', { ascending: true })
        .limit(5);

      if (error) throw error;

      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  const getCategoryColor = (category: string | null) => {
    switch (category?.toUpperCase()) {
      case 'HOT':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', icon: '🔥' };
      case 'WARM':
        return { bg: 'rgba(251, 146, 60, 0.15)', color: '#fb923c', icon: '✨' };
      case 'COLD':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', icon: '❄️' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', icon: '📋' };
    }
  };

  const getTimeUntil = (appointmentTime: string) => {
    const now = new Date();
    const appt = new Date(appointmentTime);
    const diffMs = appt.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    } else if (diffHours > 0) {
      return `in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
    } else {
      return 'soon';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>📅 Next Steps</div>
            <div style={styles.subtitle}>Loading upcoming appointments...</div>
          </div>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>📅 Next Steps</div>
            <div style={styles.subtitle}>Your upcoming appointments</div>
          </div>
          <button
            onClick={() => router.push('/dashboard/appointments')}
            style={styles.viewAllBtn}
          >
            View Calendar
          </button>
        </div>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🎯</div>
          <div style={styles.emptyText}>No upcoming appointments</div>
          <div style={styles.emptyHint}>You're all caught up for the next 7 days</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media (max-width: 768px) {
          .upcomingAppointmentCard:hover {
            transform: scale(1.01);
            border-color: rgba(0,153,249,0.35);
          }
        }
      `}</style>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>📅 Next Steps</div>
            <div style={styles.subtitle}>Your upcoming appointments this week</div>
          </div>
          <button
            onClick={() => router.push('/dashboard/appointments')}
            style={styles.viewAllBtn}
          >
            View All
          </button>
        </div>

        <div style={styles.appointmentsList}>
          {appointments.map((apt) => {
            const category = getCategoryColor(apt['Lead Category'] ?? null);
            return (
              <div
                key={apt.id}
                style={styles.appointmentCard}
                className="upcomingAppointmentCard"
                onClick={() => setSelectedAppointment(apt)}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardLeft}>
                    <div style={styles.customerName}>
                      {apt.customer_name || 'Unknown Lead'}
                    </div>
                    <div style={styles.timeInfo}>
                      <span style={styles.timeIcon}>🕐</span>
                      {apt.appointment_time && formatTime(apt.appointment_time)}
                      <span style={styles.timeUntil}>
                        • {apt.appointment_time && getTimeUntil(apt.appointment_time)}
                      </span>
                    </div>
                  </div>
                  <div style={{ ...styles.categoryBadge, background: category.bg, color: category.color }}>
                    <span>{category.icon}</span>
                    <span>{apt['Lead Category'] || 'Lead'}</span>
                  </div>
                </div>

                {apt.requirements && (
                  <div style={styles.requirements}>
                    {apt.requirements.length > 100
                      ? apt.requirements.substring(0, 100) + '...'
                      : apt.requirements}
                  </div>
                )}

                <div style={styles.cardFooter}>
                  {apt.phone && (
                    <div style={styles.contactInfo}>
                      <span style={styles.contactIcon}>📞</span>
                      {apt.phone}
                    </div>
                  )}
                  {apt.lead_score && (
                    <div style={styles.scoreInfo}>
                      Score: <span style={styles.scoreValue}>{apt.lead_score}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAppointment && (
        <div style={styles.modalOverlay} onClick={() => setSelectedAppointment(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalTitle}>
                  {selectedAppointment.customer_name || 'Unknown Lead'}
                </div>
                <div style={styles.modalSubtitle}>
                  {selectedAppointment.appointment_time && formatFull(selectedAppointment.appointment_time)}
                </div>
              </div>
              <button onClick={() => setSelectedAppointment(null)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {selectedAppointment.requirements && (
                <div style={styles.modalSection}>
                  <div style={styles.modalLabel}>Requirements</div>
                  <div style={styles.modalValue}>{selectedAppointment.requirements}</div>
                </div>
              )}

              <div style={styles.modalRow}>
                {selectedAppointment.phone && (
                  <div style={styles.modalSection}>
                    <div style={styles.modalLabel}>Phone</div>
                    <div style={styles.modalValue}>
                      <a href={`tel:${selectedAppointment.phone}`} style={styles.link}>
                        {selectedAppointment.phone}
                      </a>
                    </div>
                  </div>
                )}
                {selectedAppointment.email && (
                  <div style={styles.modalSection}>
                    <div style={styles.modalLabel}>Email</div>
                    <div style={styles.modalValue}>
                      <a href={`mailto:${selectedAppointment.email}`} style={styles.link}>
                        {selectedAppointment.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {selectedAppointment.lead_score && (
                <div style={styles.modalSection}>
                  <div style={styles.modalLabel}>Lead Score</div>
                  <div style={styles.modalValue}>{selectedAppointment.lead_score}</div>
                </div>
              )}

              {selectedAppointment['Lead Category'] && (
                <div style={styles.modalSection}>
                  <div style={styles.modalLabel}>Category</div>
                  <div style={styles.modalValue}>
                    {getCategoryColor(selectedAppointment['Lead Category']).icon}{' '}
                    {selectedAppointment['Lead Category']}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  container: {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.sm,
    flexWrap: 'wrap' as const,
  },
  title: {
    fontSize: 20,
    fontWeight: 950,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
    fontWeight: 600,
  },
  viewAllBtn: {
    padding: '8px 16px',
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(0,153,249,0.12)',
    color: colors.accent,
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  appointmentsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.sm,
  },
  appointmentCard: {
    background: 'rgba(0,0,0,0.30)',
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardLeft: {
    flex: 1,
    minWidth: 0,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 900,
    color: colors.text.primary,
    marginBottom: 6,
  },
  timeInfo: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  timeIcon: {
    fontSize: 14,
  },
  timeUntil: {
    color: colors.accent,
    fontWeight: 700,
  },
  categoryBadge: {
    padding: '6px 12px',
    borderRadius: borderRadius.sm,
    fontSize: 12,
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap' as const,
  },
  requirements: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 1.5,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTop: `1px solid ${colors.card.border}`,
    flexWrap: 'wrap' as const,
  },
  contactInfo: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  contactIcon: {
    fontSize: 14,
  },
  scoreInfo: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: 600,
  },
  scoreValue: {
    color: colors.accent,
    fontWeight: 900,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing.md,
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90vh',
    background: 'rgba(18,24,38,0.95)',
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.card.border}`,
    boxShadow: '0 30px 120px rgba(0,0,0,0.70)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  modalHeader: {
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.card.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    background: 'rgba(0,0,0,0.20)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
    fontWeight: 600,
  },
  closeBtn: {
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
  },
  modalBody: {
    padding: spacing.lg,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.md,
  },
  modalSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.xs,
    padding: spacing.md,
    background: 'rgba(0,0,0,0.20)',
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: 900,
    color: colors.text.tertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  modalValue: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 1.5,
    fontWeight: 600,
    wordBreak: 'break-word' as const,
  },
  modalRow: {
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
