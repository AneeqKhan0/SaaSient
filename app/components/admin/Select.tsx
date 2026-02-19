import { CSSProperties } from 'react';
import { colors, borderRadius } from '../shared/constants';

type SelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  required?: boolean;
};

export function Select({ id, value, onChange, options, label, required }: SelectProps) {
  return (
    <div style={styles.wrapper}>
      {label && (
        <label htmlFor={id} style={styles.label}>
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={styles.select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
  select: {
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
    cursor: 'pointer',
  },
};
