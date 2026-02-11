'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CalendarView } from '@/app/components/dashboard/CalendarView';
import { AppointmentModal } from '@/app/components/dashboard/AppointmentModal';
import { useFormatters } from '@/app/components/shared/hooks';
import {
  startOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  ymd,
} from '@/app/components/shared/utils';
import { LeadAppointmentRow, ViewMode } from '@/app/components/dashboard/appointments/types';
import { MonthView } from '@/app/components/dashboard/appointments/MonthView';
import { WeekView } from '@/app/components/dashboard/appointments/WeekView';
import { DayView } from '@/app/components/dashboard/appointments/DayView';

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

  const { formatTime, formatFull, previewText } = useFormatters();

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
      // Use local date to match ymd() which also uses local-aware toISOString
      const key = ymd(new Date(r.appointment_time));
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

  const getDateLabel = () => {
    if (viewMode === 'month') return monthLabel;
    if (viewMode === 'week') return weekLabel;
    return dayLabel;
  };

  return (
    <>
      <CalendarView
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        dateLabel={getDateLabel()}
        onToday={goToday}
        onNext={goNext}
        onPrev={goPrev}
        error={error}
      >
        {viewMode === 'month' && (
          <MonthView
            gridDays={gridDays}
            cursor={cursor}
            byDay={byDay}
            setActive={setActive}
            loading={loading}
            formatTime={formatTime}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            weekDays={weekDays}
            byDay={byDay}
            setActive={setActive}
            loading={loading}
            formatTime={formatTime}
          />
        )}
        {viewMode === 'day' && (
          <DayView
            cursor={cursor}
            byDay={byDay}
            setActive={setActive}
            loading={loading}
            formatTime={formatTime}
            previewText={previewText}
          />
        )}
      </CalendarView>

      <AppointmentModal
        isOpen={!!active}
        onClose={() => setActive(null)}
        appointment={active || {}}
        formatFull={formatFull}
      />
    </>
  );
}