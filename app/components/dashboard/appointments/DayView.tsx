import { AppointmentCard } from '@/app/components/dashboard/AppointmentCard';
import { ymd } from '@/app/components/shared/utils';
import { LeadAppointmentRow } from './types';
import { appointmentStyles as styles } from './styles';

type DayViewProps = {
    cursor: Date;
    byDay: Record<string, LeadAppointmentRow[]>;
    setActive: (a: LeadAppointmentRow) => void;
    loading: boolean;
    formatTime: (ts: string) => string;
    previewText: (s: string | null, max?: number) => string;
};

export function DayView({ cursor, byDay, setActive, loading, formatTime, previewText }: DayViewProps) {
    const key = ymd(cursor);
    const items = byDay[key] || [];

    const hours = Array.from({ length: 24 }, (_, i) => i);

    const appointmentsByHour: Record<number, LeadAppointmentRow[]> = {};
    items.forEach((item) => {
        if (item.appointment_time) {
            const hour = new Date(item.appointment_time).getHours();
            (appointmentsByHour[hour] ||= []).push(item);
        }
    });

    return (
        <div style={styles.dayView} className="dayView">
            <style jsx global>{`
                @media (max-width: 640px) {
                    .dayView .timeLabel {
                        width: 60px !important;
                        font-size: 11px !important;
                        padding: 8px !important;
                    }
                    .dayView .timeSlotContent {
                        padding: 6px !important;
                    }
                }
            `}</style>
            <div style={styles.dayHeader}>
                <div style={styles.dayHeaderDate}>
                    {cursor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={styles.dayHeaderCount}>
                    {loading ? 'Loading...' : `${items.length} ${items.length === 1 ? 'appointment' : 'appointments'}`}
                </div>
            </div>

            {loading ? (
                <div style={styles.loadingState}>
                    <div style={styles.loadingText}>Loading appointments...</div>
                </div>
            ) : items.length === 0 ? (
                <div style={styles.emptyDayState}>
                    <div style={styles.emptyDayIcon}>📅</div>
                    <div style={styles.emptyDayText}>No appointments scheduled for this day</div>
                    <div style={styles.emptyDayHint}>Select a different date or add a new appointment</div>
                </div>
            ) : (
                <div style={styles.dayBody}>
                    <div style={styles.timeGrid}>
                        {hours.map((hour) => {
                            const hourAppointments = appointmentsByHour[hour] || [];
                            const timeLabel = new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: 'numeric', hour12: true });

                            return (
                                <div key={hour} style={styles.timeSlot} className="timeSlot">
                                    <div style={styles.timeLabel} className="timeLabel">{timeLabel}</div>
                                    <div style={styles.timeSlotContent} className="timeSlotContent">
                                        {hourAppointments.length === 0 ? (
                                            <div style={styles.emptySlot}></div>
                                        ) : (
                                            hourAppointments.map((a) => (
                                                <AppointmentCard
                                                    key={String(a.id)}
                                                    time={formatTime(a.appointment_time || '')}
                                                    title={a.customer_name?.trim() || 'Unknown Lead'}
                                                    subtitle={a.requirements ? previewText(a.requirements, 60) : undefined}
                                                    onClick={() => setActive(a)}
                                                    style={{ padding: 12, marginBottom: 4, width: '100%' }}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
