import { AppointmentCard } from '@/app/components/dashboard/AppointmentCard';
import { ymd } from '@/app/components/shared/utils';
import { LeadAppointmentRow } from './types';
import { appointmentStyles as styles } from './styles';

type MonthViewProps = {
    gridDays: Date[];
    cursor: Date;
    byDay: Record<string, LeadAppointmentRow[]>;
    setActive: (a: LeadAppointmentRow) => void;
    loading: boolean;
    formatTime: (ts: string) => string;
};

export function MonthView({ gridDays, cursor, byDay, setActive, loading, formatTime }: MonthViewProps) {
    return (
        <div style={styles.monthView} className="monthView">
            <style jsx global>{`
                @media (max-width: 768px) {
                    .monthView .weekdayHeader {
                        display: none !important;
                    }
                    .monthGrid {
                        grid-template-columns: repeat(3, 1fr) !important;
                    }
                    .monthCell {
                        min-height: 80px !important;
                        padding: 8px !important;
                    }
                }
                @media (max-width: 480px) {
                    .monthGrid {
                        grid-template-columns: 1fr !important;
                    }
                    .monthCell {
                        min-height: auto !important;
                    }
                }
            `}</style>
            <div style={styles.weekdayHeader} className="weekdayHeader">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <div key={d} style={styles.weekdayCell}>
                        {d}
                    </div>
                ))}
            </div>

            <div style={styles.monthGrid} className="monthGrid">
                {gridDays.map((d) => {
                    const key = ymd(d);
                    const inMonth = d.getMonth() === cursor.getMonth();
                    const isToday = key === ymd(new Date());
                    const items = byDay[key] || [];

                    return (
                        <div
                            key={key}
                            style={{
                                ...styles.monthCell,
                                ...(inMonth ? {} : styles.monthCellMuted),
                                ...(isToday ? styles.monthCellToday : {}),
                            }}
                            className="monthCell"
                        >
                            <div style={styles.monthCellDate}>{d.getDate()}</div>
                            <div style={styles.monthCellBody}>
                                {items.slice(0, 3).map((a) => (
                                    <AppointmentCard
                                        key={String(a.id)}
                                        time={formatTime(a.appointment_time || '')}
                                        title={a.customer_name?.trim() || 'Unknown'}
                                        onClick={() => setActive(a)}
                                    />
                                ))}
                                {items.length > 3 && (
                                    <div style={styles.moreLink} onClick={() => items[3] && setActive(items[3])}>
                                        +{items.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
