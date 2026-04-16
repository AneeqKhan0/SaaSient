import { CSSProperties } from 'react';
import { colors } from '../shared/constants';

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
};

export function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div style={styles.container}>
      <label style={styles.label}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.text.tertiary,
  },
  select: {
    height: 46,
    width: '100%',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.22)',
    color: colors.text.primary,
    padding: '0 14px',
    outline: 'none',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
