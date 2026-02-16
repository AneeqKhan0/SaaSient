import { ReactNode } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';
import { Button } from '../shared/Button';

type ViewMode = 'day' | 'week' | 'month';

type CalendarViewProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  dateLabel: string;
  onToday: () => void;
  onNext: () => void;
  onPrev: () => void;
  children: ReactNode;
  error?: string | null;
};

export function CalendarView({
  viewMode,
  onViewModeChange,
  dateLabel,
  onToday,
  onNext,
  onPrev,
  children,
  error,
}: CalendarViewProps) {
  return (
    <div style={styles.shell} className="calendarShell">
      <style jsx global>{`
        .calendarBtn {
          height: 36px;
          padding: 0 16px;
          border-radius: 8px;
          border: 1px solid ${colors.card.border};
          background: ${colors.card.background};
          color: ${colors.text.primary};
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .calendarBtn:hover {
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.20);
        }
        .calendarBtn.primary {
          background: ${colors.accent};
          border-color: ${colors.accent};
          color: #ffffff;
          font-weight: 950;
        }
        .calendarBtn.primary:hover {
          background: #0088e0;
          border-color: #0088e0;
          box-shadow: 0 4px 12px rgba(0,153,249,0.25);
        }
        .calendarBtn.icon {
          width: 36px;
          padding: 0;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .calendarToggle {
          height: 36px;
          padding: 0 20px;
          border: none;
          background: transparent;
          color: ${colors.text.secondary};
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          position: relative;
          transition: all 0.15s ease;
          border-radius: 6px;
        }
        .calendarToggle:hover {
          background: rgba(255,255,255,0.08);
          color: ${colors.text.primary};
        }
        .calendarToggle.active {
          color: ${colors.accent};
          background: rgba(0,153,249,0.12);
        }
        @media (max-width: 768px) {
          .calendarShell {
            height: 100% !important;
          }
          .calendarToolbar {
            flex-direction: column !important;
            height: auto !important;
            padding: 12px !important;
            gap: 12px !important;
          }
          .calendarToolbarLeft {
            width: 100%;
            justify-content: space-between !important;
          }
          .calendarDateLabel {
            font-size: 16px !important;
            margin-left: 0 !important;
          }
          .calendarViewToggle {
            width: 100%;
          }
          .calendarToggle {
            flex: 1;
            padding: 0 12px !important;
          }
          .calendarContainer {
            margin: 8px !important;
          }
        }
        @media (max-width: 480px) {
          .calendarBtn {
            height: 32px !important;
            padding: 0 12px !important;
            font-size: 12px !important;
          }
          .calendarBtn.icon {
            width: 32px !important;
            font-size: 16px !important;
          }
          .calendarToggle {
            height: 32px !important;
            font-size: 12px !important;
          }
          .calendarDateLabel {
            font-size: 14px !important;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div style={styles.toolbar} className="calendarToolbar">
        <div style={styles.toolbarLeft} className="calendarToolbarLeft">
          <button type="button" className="calendarBtn primary" onClick={onToday}>
            Today
          </button>
          <div style={styles.navGroup}>
            <button type="button" className="calendarBtn icon" onClick={onPrev} title="Previous">
              ‹
            </button>
            <button type="button" className="calendarBtn icon" onClick={onNext} title="Next">
              ›
            </button>
          </div>
          <div style={styles.dateLabel} className="calendarDateLabel">{dateLabel}</div>
        </div>

        <div style={styles.viewToggle} className="calendarViewToggle">
          <button
            type="button"
            className={`calendarToggle ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => onViewModeChange('day')}
          >
            Day
          </button>
          <button
            type="button"
            className={`calendarToggle ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => onViewModeChange('week')}
          >
            Week
          </button>
          <button
            type="button"
            className={`calendarToggle ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => onViewModeChange('month')}
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

      {/* Calendar Content */}
      <div style={styles.calendarContainer} className="calendarContainer">{children}</div>
    </div>
  );
}

const styles = {
  shell: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)',
    fontFamily: "'Segoe UI', 'Segoe UI Web', Tahoma, Arial, sans-serif",
    color: colors.text.primary,
    overflow: 'hidden',
  },
  toolbar: {
    height: 56,
    background: colors.card.background,
    borderBottom: `1px solid ${colors.card.border}`,
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
    gap: spacing.sm,
  },
  navGroup: {
    display: 'flex',
    gap: 4,
  },
  dateLabel: {
    fontSize: 20,
    fontWeight: 600,
    color: colors.text.primary,
    marginLeft: spacing.xs,
  },
  viewToggle: {
    display: 'flex',
    gap: 4,
    borderRadius: borderRadius.xs,
    background: 'rgba(0,0,0,0.20)',
    border: `1px solid ${colors.card.border}`,
    overflow: 'hidden',
    padding: 4,
  },
  alert: {
    margin: 16,
    padding: spacing.sm,
    background: 'rgba(255,60,60,0.08)',
    border: '1px solid rgba(255,90,90,0.35)',
    borderRadius: borderRadius.sm,
    color: '#ffb4b4',
  },
  calendarContainer: {
    flex: 1,
    overflow: 'auto',
    background: 'rgba(255,255,255,0.04)',
    margin: spacing.sm,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.card.border}`,
    minHeight: 0,
  },
};