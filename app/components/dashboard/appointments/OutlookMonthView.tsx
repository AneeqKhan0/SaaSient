import { LeadAppointmentRow } from './types';
import { ymd } from '@/app/components/shared/utils';
import { colors, borderRadius, spacing } from '@/app/components/shared/constants';

type OutlookMonthViewProps = {
    gridDays: Date[];
    cursor: Date;
    byDay: Record<string, LeadAppointmentRow[]>;
    setActive: (a: LeadAppointmentRow) => void;
    onDayClick: (date: Date) => void;
    loading: boolean;
};

export function OutlookMonthView({ 
    gridDays, 
    cursor, 
    byDay, 
    setActive, 
    onDayClick,
    loading 
}: OutlookMonthViewProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div style={styles.container}>
            {/* Weekday headers */}
            <div style={styles.weekdayRow}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} style={styles.weekdayCell}>{day}</div>
                ))}
            </div>

            {/* Calendar grid */}
            <div style={styles.grid}>
                {gridDays.map((date) => {
                    const key = ymd(date);
                    const inMonth = date.getMonth() === cursor.getMonth();
                    const isToday = ymd(date) === ymd(today);
                    const appointments = byDay[key] || [];
                    const hasAppointments = appointments.length > 0;

                    return (
                        <div
                            key={key}
                            style={{
                                ...styles.dayCell,
                                ...(inMonth ? {} : styles.dayCellMuted),
                                ...(isToday ? styles.dayCellToday : {}),
                            }}
                            onClick={() => onDayClick(date)}
                        >
                            <div style={styles.dayNumber}>{date.getDate()}</div>
                            {hasAppointments && (
                                <div style={styles.dotContainer}>
                                    {appointments.slice(0, 3).map((_, i) => (
                                        <div key={i} style={styles.dot} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Appointments list for selected day */}
            <div style={styles.appointmentsList}>
                <div style={styles.selectedDateHeader}>
                    {cursor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                {loading ? (
                    <div style={styles.loadingText}>Loading...</div>
                ) : (
                    <>
                        {(byDay[ymd(cursor)] || []).length === 0 ? (
                            <div style={styles.emptyText}>No appointments</div>
                        ) : (
                            <div style={styles.appointmentsScroll}>
                                {(byDay[ymd(cursor)] || []).map((apt) => (
                                    <div
                                        key={String(apt.id)}
                                        style={styles.appointmentItem}
                                        onClick={() => setActive(apt)}
                                    >
                                        <div style={styles.appointmentTime}>
                                            {apt.appointment_time ? new Date(apt.appointment_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                                        </div>
                                        <div style={styles.appointmentDetails}>
                                            <div style={styles.appointmentTitle}>
                                                {apt.customer_name?.trim() || 'Unknown'}
                                            </div>
                                            {apt.requirements && (
                                                <div style={styles.appointmentSubtitle}>
                                                    {apt.requirements.substring(0, 50)}{apt.requirements.length > 50 ? '...' : ''}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
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
    weekdayRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 2,
        padding: spacing.sm,
        borderBottom: `1px solid ${colors.card.border}`,
    },
    weekdayCell: {
        textAlign: 'center' as const,
        fontSize: 11,
        fontWeight: 700,
        color: colors.text.secondary,
        padding: spacing.xs,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 2,
        padding: spacing.sm,
        flex: '0 0 auto',
    },
    dayCell: {
        aspectRatio: '1',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.sm,
        border: `1px solid ${colors.card.border}`,
        background: 'rgba(0,0,0,0.20)',
        cursor: 'pointer',
        position: 'relative' as const,
        minHeight: 44,
    },
    dayCellMuted: {
        opacity: 0.4,
    },
    dayCellToday: {
        border: `2px solid ${colors.accent}`,
        background: 'rgba(0,153,249,0.10)',
    },
    dayNumber: {
        fontSize: 14,
        fontWeight: 700,
        color: colors.text.primary,
    },
    dotContainer: {
        display: 'flex',
        gap: 2,
        marginTop: 2,
        position: 'absolute' as const,
        bottom: 4,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: colors.accent,
    },
    appointmentsList: {
        flex: '1 1 auto',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
        borderTop: `1px solid ${colors.card.border}`,
    },
    selectedDateHeader: {
        padding: spacing.md,
        fontSize: 16,
        fontWeight: 900,
        color: colors.text.primary,
        borderBottom: `1px solid ${colors.card.border}`,
        background: 'rgba(0,0,0,0.20)',
    },
    appointmentsScroll: {
        flex: '1 1 auto',
        overflow: 'auto',
        padding: spacing.sm,
    },
    appointmentItem: {
        display: 'flex',
        gap: spacing.sm,
        padding: spacing.md,
        marginBottom: spacing.xs,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.card.border}`,
        background: 'rgba(0,0,0,0.30)',
        cursor: 'pointer',
    },
    appointmentTime: {
        fontSize: 12,
        fontWeight: 900,
        color: colors.accent,
        minWidth: 60,
        flex: '0 0 auto',
    },
    appointmentDetails: {
        flex: '1 1 auto',
        minWidth: 0,
    },
    appointmentTitle: {
        fontSize: 14,
        fontWeight: 700,
        color: colors.text.primary,
        marginBottom: 2,
    },
    appointmentSubtitle: {
        fontSize: 12,
        color: colors.text.secondary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    loadingText: {
        padding: spacing.lg,
        textAlign: 'center' as const,
        color: colors.text.secondary,
    },
    emptyText: {
        padding: spacing.lg,
        textAlign: 'center' as const,
        color: colors.text.tertiary,
        fontSize: 14,
    },
};
