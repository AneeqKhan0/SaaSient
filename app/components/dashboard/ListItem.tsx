import { CSSProperties, ReactNode } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';

type ListItemProps = {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
};

export function ListItem({ children, active, onClick }: ListItemProps) {
  return (
    <div
      style={{
        ...styles.item,
        ...(active ? styles.itemActive : {}),
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  item: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${colors.card.border}`,
    cursor: 'pointer',
    transition: 'background 160ms ease, border-color 160ms ease',
  },
  itemActive: {
    background: 'rgba(0,153,249,0.10)',
    borderColor: colors.card.borderAccent,
  },
};
