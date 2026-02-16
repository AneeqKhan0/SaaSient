import { LeadAppointmentRow } from './types';
import { ymd } from '@/app/components/shared/utils';
import { colors, borderRadius, spacing } from '@/app/components/shared/constants';

type OutlookWeekViewProps = {
    weekDays: Date[];
    byDay: Record<string, LeadAppointmentRow[]>;
    setActive: (a: LeadAppointmentRow) => void;
    loading: boolean;
};

export function OutlookWeekView({ weekDays, byDay, setActive, loading }: OutlookWeekViewProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div style={styles.container}>
            {/* Day headers */}
            <div style={styles.headerRow}>
                <div style={styles.timeColumn}></div>
                {weekDays.map((date) => {
                    const isToday = ymd(date) === ymd(today);
                    return (
                        <div key={ymd(date)} style={styles.dayHeader}>
                            <div style={styles.dayName}>
                                {date.toLocaleDateString([], { weekday: 'short' })}
                            </div>
                            <div style={{
                                ...styles.dayDate,
                                ...(isToday ? styles.dayDateToday : {})
                            }}>
                                {date.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Timeline grid */}
            <div style={styles.scrollContainer}>
                {loading ? (
                    <div style={styles.loadingText}>Loading...</div>
                ) : (
                    <div style={styles.timelineGrid}>
                        {hours.map((hour) => {
                            const timeLabel = new Date(2000, 0, 1, hour).toLocaleTimeString([], { 
                                hour: 'numeric', 
                                hour12: true 
                            });

                            return (
                                <div key={hour} style={styles.timeRow}>
                                    <div style={styles.timeLabel}>{timeLabel}</div>
                                    {weekDays.map((date) => {
                                        const key = ymd(date);
                                        const appointments = byDay[key] || [];
                                        const hourAppointments = appointments.filter((apt) => {
                                            if (!apt.appointment_time) return false;
                                            return new Date(apt.appointment_time).getHours() === hour;
                                        });

                                        return (
                                            <div key={key} style={styles.timeCell}>
                                                {hourAppointments.map((apt) => (
                                                    <div
                                                        key={String(apt.id)}
                                                        style={styles.appointmentBlock}
                                                        onClick={() => setActive(apt)}
                                                    >
                                                        <div style={styles.appointmentTime}>
                                                            {apt.appointment_time ? new Date(apt.appointment_time).toLocaleTimeString([], { 
                                                                hour: 'numeric', 
                                                                minute: '2-digit',
                                                                hour12: true 
                                                            }) : ''}
                                                        </div>
                                                        <div style={styles.appointmentName}>
                                                            {apt.customer_name?.trim() || 'Unknown'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
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
    headerRow: {
        display: 'grid',
        gridTemplateColumns: '60px repeat(7, 1fr)',
        gap: 1,
        borderBottom: `1px solid ${colors.card.border}`,
        background: 'rgba(0,0,0,0.20)',
        position: 'sticky' as const,
        top: 0,
        zIndex: 10,
    },
    timeColumn: {
        width: 60,
    },
    dayHeader: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        padding: spacing.sm,
        minWidth: 0,
    },
    dayName: {
        fontSize: 11,
        fontWeight: 700,
        color: colors.text.secondary,
        textTransform: 'uppercase' as const,
    },
    dayDate: {
        fontSize: 20,
        fontWeight: 900,
        color: colors.text.primary,
        marginTop: 2,
    },
    dayDateToday: {
        color: colors.accent,
        background: 'rgba(0,153,249,0.15)',
        borderRadius: '50%',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContainer: {
        flex: '1 1 auto',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch' as const,
    },
    timelineGrid: {
        display: 'flex',
        flexDirection: 'column' as const,
    },
    timeRow: {
        display: 'grid',
        gridTemplateColumns: '60px repeat(7, 1fr)',
        gap: 1,
        minHeight: 60,
        borderBottom: `1px solid ${colors.card.border}`,
    },
    timeLabel: {
        fontSize: 11,
        fontWeight: 700,
        color: colors.text.tertiary,
        padding: spacing.xs,
        textAlign: 'right' as const,
        paddingRight: spacing.sm,
    },
    timeCell: {
        background: 'rgba(0,0,0,0.10)',
        padding: 2,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 2,
    },
    appointmentBlock: {
        background: 'rgba(0,153,249,0.20)',
        border: `1px solid rgba(0,153,249,0.40)`,
        borderRadius: borderRadius.xs,
        padding: 4,
        cursor: 'pointer',
        minHeight: 40,
        overflow: 'hidden',
    },
    appointmentTime: {
        fontSize: 10,
        fontWeight: 900,
        color: colors.accent,
        marginBottom: 2,
    },
    appointmentName: {
        fontSize: 11,
        fontWeight: 700,
        color: colors.text.primary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    loadingText: {
        padding: spacing.lg,
        textAlign: 'center' as const,
        color: colors.text.secondary,
    },
};
