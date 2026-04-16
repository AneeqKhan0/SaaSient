'use client';

import { CSSProperties } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  status?: 'normal' | 'warning' | 'critical';
}

export function MetricCard({ title, value, icon, trend, status = 'normal' }: MetricCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return colors.accent;
    }
  };

  const getTrendColor = () => {
    if (!trend) return colors.text.tertiary;
    switch (trend.direction) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      default:
        return colors.text.tertiary;
    }
  };

  const getTrendIcon = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.icon}>{icon}</span>
        {status !== 'normal' && (
          <div
            style={{
              ...styles.statusBadge,
              backgroundColor: `${getStatusColor()}20`,
              color: getStatusColor(),
            }}
          >
            {status === 'critical' ? 'Critical' : 'Warning'}
          </div>
        )}
      </div>

      <div style={styles.value}>{value}</div>
      <div style={styles.title}>{title}</div>

      {trend && (
        <div style={{ ...styles.trend, color: getTrendColor() }}>
          <span style={styles.trendIcon}>{getTrendIcon()}</span>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    background: colors.card.background,
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 24,
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 32,
    fontWeight: 900,
    color: colors.text.primary,
    letterSpacing: -0.5,
    lineHeight: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text.secondary,
    lineHeight: 1.3,
  },
  trend: {
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  trendIcon: {
    fontSize: 14,
  },
};
