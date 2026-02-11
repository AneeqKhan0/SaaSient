import { AppointmentCard } from '@/app/components/dashboard/AppointmentCard';
import { ymd, isSameDay } from '@/app/components/shared/utils';
import { LeadAppointmentRow } from './types';
import { appointmentStyles as styles } from './styles';

type WeekViewProps = {
    weekDays: Date[];
    byDay: Record<string, LeadAppointmentRow[]>;
    setActive: (a: LeadAppointmentRow) => void;
    loading: boolean;
    formatTime: (ts: string) => string;
};

export function WeekView({ weekDays, byDay, setActive, loading, formatTime }: WeekViewProps) {
    return (
        <div style={styles.weekView}>
            <div style={styles.weekHeader}>
                {weekDays.map((d) => {
                    const isToday = isSameDay(d, new Date());
                    return (
                        <div key={ymd(d)} style={styles.weekHeaderCell}>
                            <div style={styles.weekHeaderDay}>{d.toLocaleDateString([], { weekday: 'short' })}</div>
                            <div style={{ ...styles.weekHeaderDate, ...(isToday ? styles.weekHeaderDateToday : {}) }}>
                                {d.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={styles.weekGrid}>
                {weekDays.map((d) => {
                    const key = ymd(d);
                    const items = byDay[key] || [];
                    const isToday = isSameDay(d, new Date());

                    return (
                        <div key={key} style={{ ...styles.weekColumn, ...(isToday ? styles.weekColumnToday : {}) }}>
                            {items.map((a) => (
                                <AppointmentCard
                                    key={String(a.id)}
                                    time={formatTime(a.appointment_time || '')}
                                    title={a.customer_name?.trim() || 'Unknown'}
                                    onClick={() => setActive(a)}
                                    style={{ marginBottom: 4 }}
                                />
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
