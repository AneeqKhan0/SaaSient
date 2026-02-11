import { CSSProperties } from 'react';
import { colors, borderRadius } from './constants';

type InputProps = {
  id?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  autoComplete?: string;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function Input({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  required,
  autoComplete,
  onFocus,
  onBlur,
}: InputProps) {
  return (
    <div style={styles.wrapper}>
      {label && (
        <label htmlFor={id} style={styles.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        onFocus={onFocus}
        onBlur={onBlur}
        style={styles.input}
      />
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
  input: {
    height: 46,
    width: '100%',
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.22)',
    color: colors.text.primary,
    padding: '0 12px',
    outline: 'none',
    fontSize: 15,
    fontWeight: 700,
  },
};
