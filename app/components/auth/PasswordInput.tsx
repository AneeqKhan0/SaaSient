import { CSSProperties } from 'react';
import { colors, borderRadius } from '../shared/constants';

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  show: boolean;
  onToggleShow: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoComplete?: string;
  label?: string;
  id?: string;
};

export function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter password',
  show,
  onToggleShow,
  onFocus,
  onBlur,
  autoComplete = 'current-password',
  label,
  id,
}: PasswordInputProps) {
  return (
    <div style={styles.wrapper}>
      {label && (
        <label htmlFor={id} style={styles.label}>
          {label}
        </label>
      )}
      <div style={styles.inputWrapper}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={onFocus}
          onBlur={onBlur}
          style={styles.input}
        />
        <button type="button" onClick={onToggleShow} style={styles.eyeBtn} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '14px 48px 14px 16px',
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(255,255,255,0.04)',
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: 700,
    outline: 'none',
    transition: 'border-color 160ms ease',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 18,
    padding: 4,
    opacity: 0.7,
    transition: 'opacity 160ms ease',
  },
};
