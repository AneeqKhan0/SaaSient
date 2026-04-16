'use client';

import { CSSProperties } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';

export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface AdminDataTableProps {
  data: any[];
  columns: ColumnDef[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  sortable?: boolean;
  pagination?: PaginationConfig;
}

export function AdminDataTable({
  data,
  columns,
  loading = false,
  onRowClick,
  sortable = false,
  pagination,
}: AdminDataTableProps) {
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>No data available</div>
      </div>
    );
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div style={styles.container}>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              {columns.map((column) => (
                <th key={column.key} style={styles.headerCell}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                style={{
                  ...styles.row,
                  ...(onRowClick ? styles.rowClickable : {}),
                }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} style={styles.cell}>
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={{
              ...styles.paginationButton,
              ...(pagination.page === 1 ? styles.paginationButtonDisabled : {}),
            }}
            onClick={() => pagination.onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </button>

          <div style={styles.paginationInfo}>
            Page {pagination.page} of {totalPages}
          </div>

          <button
            style={{
              ...styles.paginationButton,
              ...(pagination.page === totalPages ? styles.paginationButtonDisabled : {}),
            }}
            onClick={() => pagination.onPageChange(pagination.page + 1)}
            disabled={pagination.page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    background: colors.card.background,
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  headerRow: {
    background: 'rgba(0,0,0,0.3)',
    borderBottom: `1px solid ${colors.card.border}`,
  },
  headerCell: {
    padding: spacing.md,
    textAlign: 'left',
    fontSize: 13,
    fontWeight: 700,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    borderBottom: `1px solid ${colors.card.border}`,
    transition: 'background 0.2s ease',
  },
  rowClickable: {
    cursor: 'pointer',
  },
  cell: {
    padding: spacing.md,
    fontSize: 14,
    fontWeight: 600,
    color: colors.text.primary,
  },
  loading: {
    padding: spacing.xl,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 600,
    color: colors.text.secondary,
  },
  empty: {
    padding: spacing.xl,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 600,
    color: colors.text.tertiary,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderTop: `1px solid ${colors.card.border}`,
  },
  paginationButton: {
    padding: `${spacing.xs}px ${spacing.md}px`,
    background: 'rgba(0,153,249,0.15)',
    border: '1px solid rgba(0,153,249,0.3)',
    borderRadius: borderRadius.sm,
    color: colors.accent,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  paginationInfo: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text.secondary,
  },
};
