import { CSSProperties, ReactNode } from 'react';
import { colors, borderRadius } from './constants';

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: CSSProperties;
};

export function Button({ children, onClick, type = 'button', variant = 'primary', disabled, style }: ButtonProps) {
  const baseStyle: CSSProperties = {
    padding: '14px 24px',
    borderRadius: borderRadius.sm,
    fontWeight: 750,
    fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'opacity 160ms ease',
    opacity: disabled ? 0.5 : 1,
  };

  const variantStyle: CSSProperties =
    variant === 'primary'
      ? {
          background: colors.accent,
          color: '#fff',
        }
      : {
          background: 'rgba(255,255,255,0.08)',
          color: colors.text.primary,
        };

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...baseStyle, ...variantStyle, ...style }}>
      {children}
    </button>
  );
}
