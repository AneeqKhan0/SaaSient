'use client';

import { useRouter } from 'next/navigation';
import { CSSProperties } from 'react';
import { colors, borderRadius } from '@/app/components/shared/constants';

export function MobileBackButton() {
  const router = useRouter();

  return (
    <>
      <style jsx global>{`
        @media (min-width: 981px) {
          .mobileBackButton {
            display: none !important;
          }
        }
      `}</style>
      <button
        onClick={() => router.back()}
        style={styles.button}
        className="mobileBackButton"
        aria-label="Go back"
      >
        ← Back
      </button>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  button: {
    display: 'none',
    padding: '8px 16px',
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
    background: colors.card.background,
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 12,
  },
};
