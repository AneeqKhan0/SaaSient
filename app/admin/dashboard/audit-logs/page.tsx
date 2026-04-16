'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable, ColumnDef } from '@/app/components/admin/AdminDataTable';
import { AuditLogDetailModal } from '@/app/components/admin/AuditLogDetailModal';
import { colors } from '@/app/components/shared/constants';
import { adminHomeStyles as styles } from '@/app/components/admin/styles/adminDashboardHome';
import type { AuditLog } from '@/app/types/admin';

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    company_id: '',
    action: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadLogs();
  }, [page, filters]);

  async function loadLogs() {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(filters.company_id && { company_id: filters.company_id }),
        ...(filters.action && { action: filters.action }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data.logs);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Load logs error:', error);
    } finally {
      setLoading(false);
    }
  }

  const columns: ColumnDef[] = [
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (value) => (
        <div>
          <div style={{ fontWeight: 900, fontSize: 13 }}>
            {new Date(value).toLocaleDateString()}
          </div>
          <div style={{ fontSize: 11, color: colors.text.tertiary }}>
            {new Date(value).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'admin_email',
      label: 'Admin',
      render: (value) => (
        <span style={{ fontWeight: 700, color: colors.text.primary }}>{value}</span>
      ),
    },
    {
      key: 'company_name',
      label: 'Company',
      render: (value) => value || <span style={{ color: colors.text.tertiary }}>-</span>,
    },
    {
      key: 'action',
      label: 'Action',
      render: (value) => (
        <span style={{ 
          padding: '4px 10px', 
          borderRadius: 8, 
          background: 'rgba(0,153,249,0.12)',
          border: '1px solid rgba(0,153,249,0.25)',
          fontSize: 12,
          fontWeight: 750,
        }}>
          {value}
        </span>
      ),
    },
    {
      key: 'entity_type',
      label: 'Entity',
      render: (value) => value || <span style={{ color: colors.text.tertiary }}>-</span>,
    },
    {
      key: 'id',
      label: 'Details',
      render: () => (
        <span style={{ 
          fontSize: 12,
          color: colors.text.tertiary,
          fontStyle: 'italic',
        }}>
          Click to view →
        </span>
      ),
    },
  ];

  return (
    <div style={styles.shell}>
      <div style={styles.noise} aria-hidden="true" />

      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <div style={styles.adminBadge}>Admin Portal</div>
          <div style={styles.h1}>Audit Logs</div>
          <div style={styles.sub}>Track all administrative actions</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersSection}>
        <div style={styles.filtersRow}>
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            style={styles.select}
          >
            <option value="">All Actions</option>
            <option value="company_updated">Company Updated</option>
            <option value="company_suspended">Company Suspended</option>
            <option value="company_activated">Company Activated</option>
            <option value="settings_changed">Settings Changed</option>
          </select>

          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            style={styles.searchInput}
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            style={styles.searchInput}
            placeholder="End Date"
          />

          <button
            onClick={() => setFilters({ company_id: '', action: '', start_date: '', end_date: '' })}
            style={styles.exportButton}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div style={styles.tableSection}>
        <div style={styles.sectionTitle}>Audit Trail ({total})</div>
        <AdminDataTable
          data={logs}
          columns={columns}
          loading={loading}
          onRowClick={(log) => setSelectedLog(log)}
          pagination={{
            page,
            limit: 50,
            total,
            onPageChange: setPage,
          }}
        />
      </div>

      {/* Audit Log Detail Modal */}
      {selectedLog && (
        <AuditLogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
