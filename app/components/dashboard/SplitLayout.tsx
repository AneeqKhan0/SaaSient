import { CSSProperties, ReactNode } from 'react';
import { spacing } from '../shared/constants';

type SplitLayoutProps = {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: number;
};

export function SplitLayout({ left, right, leftWidth = 360 }: SplitLayoutProps) {
  return (
    <div style={styles.container}>
      <div style={{ ...styles.left, width: leftWidth }}>{left}</div>
      <div style={styles.right}>{right}</div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: spacing.lg,
    height: '100%',
  },
  left: {
    overflow: 'auto',
  },
  right: {
    overflow: 'auto',
  },
};
