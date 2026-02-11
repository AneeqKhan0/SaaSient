import { CSSProperties } from 'react';
import { colors, borderRadius } from '../shared/constants';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({ value, onChange, placeholder = 'Search...' }: SearchInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={styles.input}
    />
  );
}

const styles: Record<string, CSSProperties> = {
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(255,255,255,0.04)',
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 700,
    outline: 'none',
    transition: 'border-color 160ms ease',
  },
};
