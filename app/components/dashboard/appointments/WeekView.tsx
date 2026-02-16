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
        <div style={styles.weekView} className="weekView">
            <style jsx global>{`
                @media (max-width: 768px) {
                    .weekView .weekHeader {
                        grid-template-columns: repeat(3, 1fr) !important;
                    }
                    .weekView .weekGrid {
                        grid-template-columns: repeat(3, 1fr) !important;
                    }
                    .weekView .weekHeaderDay {
                        font-size: 10px !important;
                    }
                    .weekView .weekHeaderDate {
                        font-size: 20px !important;
                    }
                    .weekView .weekColumn {
                        padding: 6px !important;
                    }
                }
                @media (max-width: 640px) {
                    .weekView .weekHeader {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                    .weekView .weekGrid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 480px) {
                    .weekView .weekHeader {
                        grid-template-columns: 1fr !important;
                    }
                    .weekView .weekGrid {
                        grid-template-columns: 1fr !important;
                        gap: 8px !important;
                    }
                    .weekView .weekColumn {
                        min-height: 120px !important;
                    }
                }
            `}</style>
            <div style={styles.weekHeader} className="weekHeader">
                {weekDays.map((d) => {
                    const isToday = isSameDay(d, new Date());
                    return (
                        <div key={ymd(d)} style={styles.weekHeaderCell}>
                            <div style={styles.weekHeaderDay} className="weekHeaderDay">{d.toLocaleDateString([], { weekday: 'short' })}</div>
                            <div style={{ ...styles.weekHeaderDate, ...(isToday ? styles.weekHeaderDateToday : {}) }} className="weekHeaderDate">
                                {d.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={styles.weekGrid} className="weekGrid">
                {weekDays.map((d) => {
                    const key = ymd(d);
                    const items = byDay[key] || [];
                    const isToday = isSameDay(d, new Date());

                    return (
                        <div key={key} style={{ ...styles.weekColumn, ...(isToday ? styles.weekColumnToday : {}) }} className="weekColumn">
                            {items.length === 0 ? (
                                <div style={styles.emptyColumn}>No appointments</div>
                            ) : (
                                items.map((a) => (
                                    <AppointmentCard
                                        key={String(a.id)}
                                        time={formatTime(a.appointment_time || '')}
                                        title={a.customer_name?.trim() || 'Unknown'}
                                        onClick={() => setActive(a)}
                                        style={{ marginBottom: 4 }}
                                    />
                                ))
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
