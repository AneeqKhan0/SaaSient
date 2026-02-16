import { AppointmentCard } from '@/app/components/dashboard/AppointmentCard';
import { LeadAppointmentRow } from './types';
import { colors, borderRadius, spacing } from '@/app/components/shared/constants';

type MobileAppointmentListProps = {
    appointments: LeadAppointmentRow[];
    setActive: (a: LeadAppointmentRow) => void;
    formatTime: (ts: string) => string;
    formatDate: (ts: string) => string;
    loading: boolean;
};

export function MobileAppointmentList({ 
    appointments, 
    setActive, 
    formatTime, 
    formatDate,
    loading 
}: MobileAppointmentListProps) {
    if (loading) {
        return (
            <div style={styles.loading}>
                <div style={styles.loadingText}>Loading appointments...</div>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div style={styles.empty}>
                <div style={styles.emptyIcon}>📅</div>
                <div style={styles.emptyText}>No appointments found</div>
                <div style={styles.emptyHint}>Try selecting a different date range</div>
            </div>
        );
    }

    // Group appointments by date
    const groupedByDate: Record<string, LeadAppointmentRow[]> = {};
    appointments.forEach((apt) => {
        if (apt.appointment_time) {
            const dateKey = formatDate(apt.appointment_time);
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = [];
            }
            groupedByDate[dateKey].push(apt);
        }
    });

    const sortedDates = Object.keys(groupedByDate).sort();

    return (
        <div style={styles.container}>
            {sortedDates.map((dateKey) => (
                <div key={dateKey} style={styles.dateGroup}>
                    <div style={styles.dateHeader}>
                        <div style={styles.dateLabel}>{dateKey}</div>
                        <div style={styles.dateCount}>
                            {groupedByDate[dateKey].length} {groupedByDate[dateKey].length === 1 ? 'appointment' : 'appointments'}
                        </div>
                    </div>
                    <div style={styles.appointmentList}>
                        {groupedByDate[dateKey].map((apt) => (
                            <AppointmentCard
                                key={String(apt.id)}
                                time={formatTime(apt.appointment_time || '')}
                                title={apt.customer_name?.trim() || 'Unknown Lead'}
                                subtitle={apt.requirements ? apt.requirements.substring(0, 80) + (apt.requirements.length > 80 ? '...' : '') : undefined}
                                onClick={() => setActive(apt)}
                                style={{ marginBottom: 8 }}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

const styles = {
    container: {
        padding: spacing.sm,
        overflow: 'auto',
        height: '100%',
    },
    dateGroup: {
        marginBottom: spacing.lg,
    },
    dateHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${spacing.sm}px ${spacing.md}px`,
        background: 'rgba(0,0,0,0.30)',
        borderRadius: borderRadius.sm,
        border: `1px solid ${colors.card.border}`,
        marginBottom: spacing.sm,
        position: 'sticky' as const,
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
    },
    dateLabel: {
        fontSize: 15,
        fontWeight: 900,
        color: colors.text.primary,
    },
    dateCount: {
        fontSize: 12,
        fontWeight: 700,
        color: colors.text.secondary,
    },
    appointmentList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: spacing.xs,
    },
    loading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: spacing.xl,
    },
    loadingText: {
        fontSize: 16,
        color: colors.text.secondary,
        fontWeight: 600,
    },
    empty: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: spacing.xl,
        textAlign: 'center' as const,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 700,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    emptyHint: {
        fontSize: 14,
        color: colors.text.secondary,
        fontWeight: 500,
    },
};
