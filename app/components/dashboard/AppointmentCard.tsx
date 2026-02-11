import { colors, borderRadius } from '../shared/constants';

type AppointmentCardProps = {
  time: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
  style?: React.CSSProperties;
};

export function AppointmentCard({ time, title, subtitle, onClick, style }: AppointmentCardProps) {
  return (
    <button
      type="button"
      className="appointmentCard"
      onClick={onClick}
      style={style}
    >
      <style jsx>{`
        .appointmentCard {
          padding: 8px 10px;
          border-left: 3px solid ${colors.accent};
          background: rgba(0,153,249,0.12);
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          color: ${colors.text.primary};
          margin-bottom: 2px;
          transition: all 0.15s ease;
          border: 1px solid rgba(0,153,249,0.25);
          text-align: left;
          width: 100%;
        }
        .appointmentCard:hover {
          background: rgba(0,153,249,0.20);
          border-color: rgba(0,153,249,0.40);
          transform: translateX(2px);
        }
      `}</style>
      
      <div style={{ fontWeight: 600 }}>
        {time} {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
          {subtitle}
        </div>
      )}
    </button>
  );
}