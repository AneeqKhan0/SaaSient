'use client';

import { CSSProperties } from 'react';
import { colors } from '../shared/constants';

interface CompanyStatusBadgeProps {
  status: 'active' | 'suspended';
  capacityPercent: number;
}

export function CompanyStatusBadge({ status, capacityPercent }: CompanyStatusBadgeProps) {
  const getCapacityColor = () => {
    if (capacityPercent >= 100) return '#ef4444'; // Red
    if (capacityPercent >= 90) return '#f59e0b'; // Orange
    if (capacityPercent >= 75) return '#eab308'; // Yellow
    return '#10b981'; // Green
  };

  const getCapacityLabel = () => {
    if (capacityPercent >= 100) return 'Full';
    if (capacityPercent >= 90) return 'Near Limit';
    if (capacityPercent >= 75) return 'High';
    return 'Available';
  };

  return (
    <div style={styles.container}>
      {/* Status Badge */}
      <div
        style={{
          ...styles.badge,
          backgroundColor: status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          color: status === 'active' ? '#10b981' : '#ef4444',
        }}
      >
        {status === 'active' ? '● Active' : '● Suspended'}
      </div>

      {/* Capacity Badge */}
      <div
        style={{
          ...styles.badge,
          backgroundColor: `${getCapacityColor()}20`,
          color: getCapacityColor(),
        }}
      >
        {capacityPercent.toFixed(0)}% • {getCapacityLabel()}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
    whiteSpace: 'nowrap',
  },
};
