export const appointmentStyles = {
    // Month View
    monthView: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
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
        textAlign: 'center' as const,
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
        flexDirection: 'column' as const,
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
        flexDirection: 'column' as const,
        gap: 4,
        overflow: 'hidden',
    },
    moreLink: {
        fontSize: 11,
        color: '#0099f9',
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
        flexDirection: 'column' as const,
    },
    weekHeader: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.15)',
    },
    weekHeaderCell: {
        padding: 16,
        textAlign: 'center' as const,
        borderRight: '1px solid rgba(255,255,255,0.06)',
    },
    weekHeaderDay: {
        fontSize: 12,
        fontWeight: 900,
        color: 'rgba(255,255,255,0.60)',
        marginBottom: 6,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
    },
    weekHeaderDate: {
        fontSize: 24,
        fontWeight: 950,
        color: 'rgba(255,255,255,0.90)',
    },
    weekHeaderDateToday: {
        color: '#ffffff',
        background: '#0099f9',
        borderRadius: '50%',
        width: 42,
        height: 42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        boxShadow: '0 0 0 8px rgba(0,153,249,0.14)',
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

    emptyColumn: {
        padding: 12,
        fontSize: 12,
        color: 'rgba(255,255,255,0.40)',
        textAlign: 'center' as const,
        fontStyle: 'italic' as const,
    },

    // Day View
    dayView: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
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
        flexDirection: 'column' as const,
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
        textAlign: 'right' as const,
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

    // Empty and loading states
    loadingState: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    loadingText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.60)',
        fontWeight: 600,
    },
    emptyDayState: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        textAlign: 'center' as const,
    },
    emptyDayIcon: {
        fontSize: 48,
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyDayText: {
        fontSize: 18,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.80)',
        marginBottom: 8,
    },
    emptyDayHint: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.50)',
        fontWeight: 500,
    },
};
