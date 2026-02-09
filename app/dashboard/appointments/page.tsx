'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ACCENT = '#0099f9'; // Original blue

type LeadAppointmentRow = {
    id: string | number;
    customer_name: string | null;
    requirements: string | null;
    appointment_time: string | null;
    phone: string | null;
    email: string | null;
    lead_score: string | number | null;
};

type ViewMode = 'day' | 'week' | 'month';

function pad2(n: number) {
    return String(n).padStart(2, '0');
}
function ymd(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function formatTime(ts: string) {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function formatFull(ts: string) {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfWeek(d: Date) {
    const x = new Date(d);
    const day = x.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    x.setHours(0, 0, 0, 0);
    return x;
}
function addDays(d: Date, n: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}
function addMonths(d: Date, n: number) {
    const x = new Date(d);
    x.setMonth(x.getMonth() + n);
    return x;
}
function isSameDay(d1: Date, d2: Date) {
    return ymd(d1) === ymd(d2);
}
function previewText(s: string | null, max = 48) {
    if (!s) return '';
    const t = String(s).replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return t.slice(0, max - 1) + '…';
}

export default function AppointmentsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rows, setRows] = useState<LeadAppointmentRow[]>([]);
    const [active, setActive] = useState<LeadAppointmentRow | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('month');

    const [cursor, setCursor] = useState<Date>(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
    const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
    const gridStart = useMemo(() => startOfWeek(monthStart), [monthStart]);
    const gridDays = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    // Load appointments based on view
    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);

            let startISO: Date, endISO: Date;

            if (viewMode === 'day') {
                startISO = new Date(cursor);
                startISO.setHours(0, 0, 0, 0);
                endISO = new Date(cursor);
                endISO.setHours(23, 59, 59, 999);
            } else if (viewMode === 'week') {
                startISO = new Date(weekStart);
                startISO.setHours(0, 0, 0, 0);
                endISO = addDays(weekStart, 6);
                endISO.setHours(23, 59, 59, 999);
            } else {
                const gridEnd = addDays(gridStart, 41);
                startISO = new Date(gridStart);
                startISO.setHours(0, 0, 0, 0);
                endISO = new Date(gridEnd);
                endISO.setHours(23, 59, 59, 999);
            }

            const { data, error } = await supabase
                .from('lead_store')
                .select('id, customer_name, requirements, appointment_time, phone, email, lead_score')
                .not('appointment_time', 'is', null)
                .gte('appointment_time', startISO.toISOString())
                .lte('appointment_time', endISO.toISOString())
                .limit(2000);

            if (error) {
                setError(error.message);
                setRows([]);
                setActive(null);
                setLoading(false);
                return;
            }

            const fetched = (data || []) as LeadAppointmentRow[];
            fetched.sort((a, b) => {
                const aT = a.appointment_time ? new Date(a.appointment_time).getTime() : 0;
                const bT = b.appointment_time ? new Date(b.appointment_time).getTime() : 0;
                return aT - bT;
            });

            setRows(fetched);
            setLoading(false);
        })();
    }, [cursor, viewMode, gridStart, weekStart]);

    const byDay = useMemo(() => {
        const map: Record<string, LeadAppointmentRow[]> = {};
        for (const r of rows) {
            if (!r.appointment_time) continue;
            const key = r.appointment_time.slice(0, 10);
            (map[key] ||= []).push(r);
        }
        return map;
    }, [rows]);

    const monthLabel = useMemo(
        () => cursor.toLocaleString([], { month: 'long', year: 'numeric' }),
        [cursor]
    );

    const weekLabel = useMemo(() => {
        const end = addDays(weekStart, 6);
        return `${weekStart.toLocaleString([], { month: 'short', day: 'numeric' })} - ${end.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }, [weekStart]);

    const dayLabel = useMemo(
        () => cursor.toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
        [cursor]
    );

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActive(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const goToday = () => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        setCursor(t);
    };

    const goNext = () => {
        if (viewMode === 'day') setCursor((d) => addDays(d, 1));
        else if (viewMode === 'week') setCursor((d) => addDays(d, 7));
        else setCursor((d) => addMonths(d, 1));
    };

    const goPrev = () => {
        if (viewMode === 'day') setCursor((d) => addDays(d, -1));
        else if (viewMode === 'week') setCursor((d) => addDays(d, -7));
        else setCursor((d) => addMonths(d, -1));
    };

    return (
        <div style={styles.shell}>
            {/* MS365-style toolbar */}
            <div style={styles.toolbar}>
                <div style={styles.toolbarLeft}>
                    <button type="button" className="ms365Btn primary" onClick={goToday}>
                        Today
                    </button>
                    <div style={styles.navGroup}>
                        <button type="button" className="ms365Btn icon" onClick={goPrev} title="Previous">
                            ‹
                        </button>
                        <button type="button" className="ms365Btn icon" onClick={goNext} title="Next">
                            ›
                        </button>
                    </div>
                    <div style={styles.dateLabel}>
                        {viewMode === 'month' && monthLabel}
                        {viewMode === 'week' && weekLabel}
                        {viewMode === 'day' && dayLabel}
                    </div>
                </div>

                <div style={styles.viewToggle}>
                    <button
                        type="button"
                        className={`ms365Toggle ${viewMode === 'day' ? 'active' : ''}`}
                        onClick={() => setViewMode('day')}
                    >
                        Day
                    </button>
                    <button
                        type="button"
                        className={`ms365Toggle ${viewMode === 'week' ? 'active' : ''}`}
                        onClick={() => setViewMode('week')}
                    >
                        Week
                    </button>
                    <button
                        type="button"
                        className={`ms365Toggle ${viewMode === 'month' ? 'active' : ''}`}
                        onClick={() => setViewMode('month')}
                    >
                        Month
                    </button>
                </div>
            </div>

            {error && (
                <div style={styles.alert}>
                    <b>Error:</b> {error}
                </div>
            )}

            {/* Calendar view */}
            <div style={styles.calendarContainer}>
                {viewMode === 'month' && <MonthView gridDays={gridDays} cursor={cursor} byDay={byDay} setActive={setActive} loading={loading} />}
                {viewMode === 'week' && <WeekView weekDays={weekDays} byDay={byDay} setActive={setActive} loading={loading} />}
                {viewMode === 'day' && <DayView cursor={cursor} byDay={byDay} setActive={setActive} loading={loading} />}
            </div>

            {/* MS365-style detail modal */}
            {active && (
                <div style={styles.modalOverlay} onMouseDown={() => setActive(null)}>
                    <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div style={styles.modalHeaderContent}>
                                <div style={styles.modalIcon}>📅</div>
                                <div>
                                    <div style={styles.modalTitle}>{active.customer_name?.trim() || 'Unknown Lead'}</div>
                                    <div style={styles.modalSubtitle}>
                                        {active.appointment_time ? formatFull(active.appointment_time) : 'No date specified'}
                                    </div>
                                </div>
                            </div>
                            <button type="button" className="ms365Btn icon" onClick={() => setActive(null)} title="Close">
                                ✕
                            </button>
                        </div>

                        <div style={styles.modalBody}>
                            {active.requirements && (
                                <div style={styles.detailSection}>
                                    <div style={styles.detailLabel}>Requirements</div>
                                    <div style={styles.detailValue}>{active.requirements.trim()}</div>
                                </div>
                            )}

                            <div style={styles.detailRow}>
                                {active.email && (
                                    <div style={styles.detailSection}>
                                        <div style={styles.detailLabel}>Email</div>
                                        <div style={styles.detailValue}>
                                            <a href={`mailto:${active.email}`} style={styles.link}>
                                                {active.email}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {active.phone && (
                                    <div style={styles.detailSection}>
                                        <div style={styles.detailLabel}>Phone</div>
                                        <div style={styles.detailValue}>
                                            <a href={`tel:${active.phone}`} style={styles.link}>
                                                {active.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {active.lead_score && (
                                <div style={styles.detailSection}>
                                    <div style={styles.detailLabel}>Lead Score</div>
                                    <div style={styles.detailValue}>{active.lead_score}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .ms365Btn {
                    height: 36px;
                    padding: 0 16px;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.12);
                    background: rgba(255,255,255,0.06);
                    color: #fff;
                    font-size: 13px;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .ms365Btn:hover {
                    background: rgba(255,255,255,0.10);
                    border-color: rgba(255,255,255,0.20);
                }
                .ms365Btn.primary {
                    background: ${ACCENT};
                    border-color: ${ACCENT};
                    color: #ffffff;
                    font-weight: 950;
                }
                .ms365Btn.primary:hover {
                    background: #0088e0;
                    border-color: #0088e0;
                    box-shadow: 0 4px 12px rgba(0,153,249,0.25);
                }
                .ms365Btn.icon {
                    width: 36px;
                    padding: 0;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .ms365Toggle {
                    height: 36px;
                    padding: 0 20px;
                    border: none;
                    background: transparent;
                    color: rgba(255,255,255,0.70);
                    font-size: 13px;
                    font-weight: 900;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.15s ease;
                    border-radius: 6px;
                }
                .ms365Toggle:hover {
                    background: rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.90);
                }
                .ms365Toggle.active {
                    color: ${ACCENT};
                    background: rgba(0,153,249,0.12);
                }
               
                .ms365ApptCard {
                    padding: 8px 10px;
                    border-left: 3px solid ${ACCENT};
                    background: rgba(0,153,249,0.12);
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    color: #fff;
                    margin-bottom: 2px;
                    transition: all 0.15s ease;
                    border: 1px solid rgba(0,153,249,0.25);
                    text-align: left;
                }
                .ms365ApptCard:hover {
                    background: rgba(0,153,249,0.20);
                    border-color: rgba(0,153,249,0.40);
                    transform: translateX(2px);
                }
            `}</style>
        </div>
    );
}

// Month View Component
function MonthView({
    gridDays,
    cursor,
    byDay,
    setActive,
    loading,
}: {
    gridDays: Date[];
    cursor: Date;
    byDay: Record<string, LeadAppointmentRow[]>;
    setActive: (a: LeadAppointmentRow) => void;
    loading: boolean;
}) {
    return (
        <div style={styles.monthView}>
            <div style={styles.weekdayHeader}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <div key={d} style={styles.weekdayCell}>
                        {d}
                    </div>
                ))}
            </div>

            <div style={styles.monthGrid}>
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
                        >
                            <div style={styles.monthCellDate}>{d.getDate()}</div>
                            <div style={styles.monthCellBody}>
                                {items.slice(0, 3).map((a) => (
                                    <button
                                        key={String(a.id)}
                                        type="button"
                                        className="ms365ApptCard"
                                        onClick={() => setActive(a)}
                                    >
                                        <div style={{ fontWeight: 600 }}>
                                            {formatTime(a.appointment_time || '')} {a.customer_name?.trim() || 'Unknown'}
                                        </div>
                                    </button>
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

// Week View Component
function WeekView({
    weekDays,
    byDay,
    setActive,
    loading,
}: {
    weekDays: Date[];
    byDay: Record<string, LeadAppointmentRow[]>;
    setActive: (a: LeadAppointmentRow) => void;
    loading: boolean;
}) {
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
                                <button
                                    key={String(a.id)}
                                    type="button"
                                    className="ms365ApptCard"
                                    onClick={() => setActive(a)}
                                    style={{ marginBottom: 4 }}
                                >
                                    <div style={{ fontWeight: 600 }}>{formatTime(a.appointment_time || '')}</div>
                                    <div>{a.customer_name?.trim() || 'Unknown'}</div>
                                </button>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Day View Component
function DayView({
    cursor,
    byDay,
    setActive,
    loading,
}: {
    cursor: Date;
    byDay: Record<string, LeadAppointmentRow[]>;
    setActive: (a: LeadAppointmentRow) => void;
    loading: boolean;
}) {
    const key = ymd(cursor);
    const items = byDay[key] || [];

    // Generate 24 hours (0-23)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Group appointments by hour
    const appointmentsByHour: Record<number, LeadAppointmentRow[]> = {};
    items.forEach((item) => {
        if (item.appointment_time) {
            const hour = new Date(item.appointment_time).getHours();
            (appointmentsByHour[hour] ||= []).push(item);
        }
    });

    return (
        <div style={styles.dayView}>
            <div style={styles.dayHeader}>
                <div style={styles.dayHeaderDate}>{cursor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                <div style={styles.dayHeaderCount}>
                    {items.length} {items.length === 1 ? 'appointment' : 'appointments'}
                </div>
            </div>

            <div style={styles.dayBody}>
                <div style={styles.timeGrid}>
                    {hours.map((hour) => {
                        const hourAppointments = appointmentsByHour[hour] || [];
                        const timeLabel = new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: 'numeric', hour12: true });

                        return (
                            <div key={hour} style={styles.timeSlot}>
                                <div style={styles.timeLabel}>{timeLabel}</div>
                                <div style={styles.timeSlotContent}>
                                    {hourAppointments.length === 0 ? (
                                        <div style={styles.emptySlot}></div>
                                    ) : (
                                        hourAppointments.map((a) => (
                                            <button
                                                key={String(a.id)}
                                                type="button"
                                                className="ms365ApptCard"
                                                onClick={() => setActive(a)}
                                                style={{ padding: 12, marginBottom: 4, width: '100%' }}
                                            >
                                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                                                    {formatTime(a.appointment_time || '')} - {a.customer_name?.trim() || 'Unknown Lead'}
                                                </div>
                                                {a.requirements && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{previewText(a.requirements, 60)}</div>}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    shell: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)',
        fontFamily: "'Segoe UI', 'Segoe UI Web', Tahoma, Arial, sans-serif",
        color: '#fff',
    },

    toolbar: {
        height: 56,
        background: 'rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: 16,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
    },

    toolbarLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },

    navGroup: {
        display: 'flex',
        gap: 4,
    },

    dateLabel: {
        fontSize: 20,
        fontWeight: 600,
        color: '#fff',
        marginLeft: 8,
    },

    viewToggle: {
        display: 'flex',
        gap: 4,
        borderRadius: 8,
        background: 'rgba(0,0,0,0.20)',
        border: '1px solid rgba(255,255,255,0.12)',
        overflow: 'hidden',
        padding: 4,
    },

    alert: {
        margin: 16,
        padding: 12,
        background: 'rgba(255,60,60,0.08)',
        border: '1px solid rgba(255,90,90,0.35)',
        borderRadius: 12,
        color: '#ffb4b4',
    },

    calendarContainer: {
        flex: 1,
        overflow: 'auto',
        background: 'rgba(255,255,255,0.04)',
        margin: 12,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.10)',
    },

    // Month View
    monthView: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },

    weekdayHeader: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.15)',
    },

    weekdayCell: {
        padding: 12,
        fontSize: 13,
        fontWeight: 900,
        color: 'rgba(255,255,255,0.70)',
        textAlign: 'center',
        borderRight: '1px solid rgba(255,255,255,0.06)',
    },

    monthGrid: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridAutoRows: '1fr',
        minHeight: 0,
    },

    monthCell: {
        borderRight: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.02)',
        minHeight: 100,
    },

    monthCellMuted: {
        background: 'rgba(0,0,0,0.10)',
        opacity: 0.6,
    },

    monthCellToday: {
        background: 'rgba(0,153,249,0.08)',
        outline: '1px solid rgba(0,153,249,0.35)',
        outlineOffset: -1,
    },

    monthCellDate: {
        fontSize: 14,
        fontWeight: 950,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 6,
    },

    monthCellBody: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        overflow: 'hidden',
    },

    moreLink: {
        fontSize: 11,
        color: ACCENT,
        cursor: 'pointer',
        padding: '4px 6px',
        fontWeight: 900,
        borderRadius: 6,
        background: 'rgba(0,153,249,0.12)',
    },

    // Week View
    weekView: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },

    weekHeader: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.15)',
    },

    weekHeaderCell: {
        padding: 16,
        textAlign: 'center',
        borderRight: '1px solid rgba(255,255,255,0.06)',
    },

    weekHeaderDay: {
        fontSize: 12,
        fontWeight: 900,
        color: 'rgba(255,255,255,0.60)',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    weekHeaderDate: {
        fontSize: 24,
        fontWeight: 950,
        color: 'rgba(255,255,255,0.90)',
    },

    weekHeaderDateToday: {
        color: '#ffffff',
        background: ACCENT,
        borderRadius: '50%',
        width: 42,
        height: 42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        boxShadow: `0 0 0 8px rgba(0,153,249,0.14)`,
    },

    weekGrid: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        minHeight: 0,
    },

    weekColumn: {
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: 10,
        overflow: 'auto',
        background: 'rgba(255,255,255,0.02)',
    },

    weekColumnToday: {
        background: 'rgba(0,153,249,0.06)',
    },

    // Day View
    dayView: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },

    dayHeader: {
        padding: 20,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.15)',
    },

    dayHeaderDate: {
        fontSize: 22,
        fontWeight: 950,
        color: 'rgba(255,255,255,0.95)',
        marginBottom: 6,
    },

    dayHeaderCount: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.65)',
        fontWeight: 600,
    },

    dayBody: {
        flex: 1,
        overflow: 'auto',
    },

    timeGrid: {
        display: 'flex',
        flexDirection: 'column',
    },

    timeSlot: {
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        minHeight: 60,
    },

    timeLabel: {
        width: 80,
        padding: 12,
        fontSize: 12,
        fontWeight: 900,
        color: 'rgba(255,255,255,0.50)',
        textAlign: 'right',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flex: '0 0 auto',
    },

    timeSlotContent: {
        flex: 1,
        padding: 8,
        background: 'rgba(255,255,255,0.02)',
    },

    emptySlot: {
        height: '100%',
        minHeight: 44,
    },

    dayEmpty: {
        textAlign: 'center',
        padding: 48,
        fontSize: 16,
        color: 'rgba(255,255,255,0.35)',
    },

    // Modal
    modalOverlay: {
        position: 'fixed',
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
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 30px 120px rgba(0,0,0,0.70)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },

    modalHeader: {
        padding: 18,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        background: 'rgba(0,0,0,0.20)',
    },

    modalHeaderContent: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minWidth: 0,
    },

    modalIcon: {
        fontSize: 28,
        flex: '0 0 auto',
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: 950,
        color: 'rgba(255,255,255,0.95)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },

    modalSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.65)',
        marginTop: 4,
        fontWeight: 600,
    },

    modalBody: {
        padding: 20,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },

    detailSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 14,
        background: 'rgba(0,0,0,0.20)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
    },

    detailLabel: {
        fontSize: 11,
        fontWeight: 900,
        color: 'rgba(255,255,255,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    detailValue: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.90)',
        lineHeight: 1.5,
        fontWeight: 600,
    },

    detailRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
    },

    link: {
        color: ACCENT,
        textDecoration: 'none',
        fontWeight: 700,
    },
};