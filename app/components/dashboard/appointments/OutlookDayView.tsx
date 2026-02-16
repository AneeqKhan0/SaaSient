import { LeadAppointmentRow } from './types';
import { ymd } from '@/app/components/shared/utils';
import { colors, borderRadius, spacing } from '@/app/components/shared/constants';

type OutlookDayViewProps = {
    cursor: Date;
    byDay: Record<string, LeadAppointmentRow[]>;
    setActive: (a: LeadAppointmentRow) => void;
    loading: boolean;
};

export function OutlookDayView({ cursor, byDay, setActive, loading }: OutlookDayViewProps) {
    const key = ymd(cursor);
    const appointments = byDay[key] || [];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const appointmentsByHour: Record<number, LeadAppointmentRow[]> = {};
    appointments.forEach((apt) => {
        if (apt.appointment_time) {
            const hour = new Date(apt.appointment_time).getHours();
            (appointmentsByHour[hour] ||= []).push(apt);
        }
    });

    return (
        <div style={styles.container}>
            {/* Date header */}
            <div style={styles.header}>
                <div style={styles.headerDate}>
                    {cursor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <div style={styles.headerCount}>
                    {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
                </div>
            </div>

            {/* Timeline */}
            <div style={styles.scrollContainer}>
                {loading ? (
                    <div style={styles.loadingText}>Loading...</div>
                ) : appointments.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>📅</div>
                        <div style={styles.emptyText}>No appointments</div>
                    </div>
                ) : (
                    <div style={styles.timeline}>
                        {hours.map((hour) => {
                            const hourAppointments = appointmentsByHour[hour] || [];
                            const timeLabel = new Date(2000, 0, 1, hour).toLocaleTimeString([], { 
                                hour: 'numeric', 
                                hour12: true 
                            });

                            return (
                                <div key={hour} style={styles.timeSlot}>
                                    <div style={styles.timeLabel}>{timeLabel}</div>
                                    <div style={styles.slotContent}>
                                        {hourAppointments.length === 0 ? (
                                            <div style={styles.emptySlot}></div>
                                        ) : (
                                            hourAppointments.map((apt) => (
                                                <div
                                                    key={String(apt.id)}
                                                    style={styles.appointmentCard}
                                                    onClick={() => setActive(apt)}
                                                >
                                                    <div style={styles.appointmentHeader}>
                                                        <div style={styles.appointmentTime}>
                                                            {apt.appointment_time ? new Date(apt.appointment_time).toLocaleTimeString([], { 
                                                                hour: 'numeric', 
                                                                minute: '2-digit',
                                                                hour12: true 
                                                            }) : ''}
                                                        </div>
                                                        {apt.lead_score && (
                                                            <div style={styles.leadScore}>
                                                                {apt.lead_score}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={styles.appointmentTitle}>
                                                        {apt.customer_name?.trim() || 'Unknown Lead'}
                                                    </div>
                                                    {apt.requirements && (
                                                        <div style={styles.appointmentRequirements}>
                                                            {apt.requirements.substring(0, 80)}{apt.requirements.length > 80 ? '...' : ''}
                                                        </div>
                                                    )}
                                                    {(apt.phone || apt.email) && (
                                                        <div style={styles.appointmentContact}>
                                                            {apt.phone && <span>📞 {apt.phone}</span>}
                                                            {apt.email && <span>✉️ {apt.email}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
        overflow: 'hidden',
    },
    header: {
        padding: spacing.md,
        borderBottom: `1px solid ${colors.card.border}`,
        background: 'rgba(0,0,0,0.20)',
    },
    headerDate: {
        fontSize: 18,
        fontWeight: 900,
        color: colors.text.primary,
        marginBottom: 4,
    },
    headerCount: {
        fontSize: 13,
        fontWeight: 700,
        color: colors.text.secondary,
    },
    scrollContainer: {
        flex: '1 1 auto',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch' as const,
    },
    timeline: {
        display: 'flex',
        flexDirection: 'column' as const,
    },
    timeSlot: {
        display: 'flex',
        minHeight: 60,
        borderBottom: `1px solid ${colors.card.border}`,
    },
    timeLabel: {
        width: 70,
        padding: spacing.sm,
        fontSize: 12,
        fontWeight: 700,
        color: colors.text.tertiary,
        textAlign: 'right' as const,
        flex: '0 0 auto',
    },
    slotContent: {
        flex: '1 1 auto',
        padding: spacing.xs,
        background: 'rgba(0,0,0,0.10)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: spacing.xs,
    },
    emptySlot: {
        minHeight: 40,
    },
    appointmentCard: {
        background: 'rgba(0,153,249,0.15)',
        border: `1px solid rgba(0,153,249,0.35)`,
        borderLeft: `4px solid ${colors.accent}`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        cursor: 'pointer',
    },
    appointmentHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    appointmentTime: {
        fontSize: 13,
        fontWeight: 900,
        color: colors.accent,
    },
    leadScore: {
        fontSize: 11,
        fontWeight: 900,
        padding: '4px 8px',
        borderRadius: borderRadius.xs,
        background: 'rgba(255,255,255,0.10)',
        border: `1px solid ${colors.card.border}`,
        color: colors.text.secondary,
    },
    appointmentTitle: {
        fontSize: 15,
        fontWeight: 900,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    appointmentRequirements: {
        fontSize: 13,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
        lineHeight: 1.4,
    },
    appointmentContact: {
        display: 'flex',
        gap: spacing.md,
        fontSize: 12,
        color: colors.text.tertiary,
        flexWrap: 'wrap' as const,
    },
    loadingText: {
        padding: spacing.lg,
        textAlign: 'center' as const,
        color: colors.text.secondary,
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        height: '100%',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: 700,
        color: colors.text.secondary,
    },
};
