import { CSSProperties, ReactNode } from 'react';
import { colors, borderRadius } from './constants';

type BadgeProps = {
  children: ReactNode;
  variant?: 'default' | 'hot' | 'warm' | 'cold';
  style?: CSSProperties;
};

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const variantColors = {
    default: { bg: 'rgba(255,255,255,0.10)', color: colors.text.secondary },
    hot: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    warm: { bg: 'rgba(251,146,60,0.15)', color: '#fb923c' },
    cold: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  };

  const { bg, color } = variantColors[variant];

  const badgeStyle: CSSProperties = {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: borderRadius.sm,
    background: bg,
    color,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    ...style,
  };

  return <span style={badgeStyle}>{children}</span>;
}
