'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from '@/app/components/admin/MetricCard';
import { AdminDataTable, ColumnDef } from '@/app/components/admin/AdminDataTable';
import { CompanyStatusBadge } from '@/app/components/admin/CompanyStatusBadge';
import { CompanyDetailPanel } from '@/app/components/admin/CompanyDetailPanel';
import { colors } from '@/app/components/shared/constants';
import { adminHomeStyles as styles } from '@/app/components/admin/styles/adminDashboardHome';
import type { CompanyWithMetrics, PlatformMetrics } from '@/app/types/admin';

export default function AdminDashboardPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [companies, setCompanies] = useState<CompanyWithMetrics[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData(true);
  }, []);

  async function loadData(isInitial = false) {
    try {
      // Only show loading state on initial load
      if (isInitial) {
        setInitialLoading(true);
      }

      // Load metrics
      const metricsRes = await fetch('/api/admin/metrics');
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data);
      }

      // Load companies
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(searchQuery && { search: searchQuery }),
        ...(planFilter && { plan: planFilter }),
        ...(capacityFilter && { capacity: capacityFilter }),
      });

      const companiesRes = await fetch(`/api/admin/companies?${params}`);
      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData.data.companies);
        setTotal(companiesData.data.total);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!initialLoading) {
      loadData(false);
    }
  }, [searchQuery, planFilter, capacityFilter, page]);

  // Real-time updates - refresh data without showing loading state
  useEffect(() => {
    const interval = setInterval(() => loadData(false), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [searchQuery, planFilter, capacityFilter, page]);

  async function handleExport(type: 'companies' | 'revenue' | 'usage_alerts') {
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  }

  const columns: ColumnDef[] = [
    {
      key: 'name',
      label: 'Company Name',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 900, marginBottom: 4 }}>{value}</div>
          <div style={{ fontSize: 12, color: colors.text.tertiary }}>{row.slug}</div>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (value) => (
        <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{value}</span>
      ),
    },
    {
      key: 'current_leads',
      label: 'Leads',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 900 }}>{value} / {row.max_leads}</div>
          <div style={{ fontSize: 11, color: colors.text.tertiary }}>
            {row.capacity_percent.toFixed(0)}% used
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => (
        <CompanyStatusBadge status={value || 'active'} capacityPercent={row.capacity_percent} />
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  if (initialLoading) {
    return (
      <div style={styles.shell}>
        <div style={styles.noise} aria-hidden="true" />
        <div style={{ padding: 40, textAlign: 'center', color: colors.text.secondary }}>
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      <div style={styles.noise} aria-hidden="true" />

      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <div style={styles.adminBadge}>Admin Portal</div>
          <div style={styles.h1}>Platform Dashboard</div>
          <div style={styles.sub}>Monitor and manage all companies</div>
        </div>

        <div style={styles.livePill} aria-label="Live status">
          <span style={styles.liveDot} />
          <div style={styles.liveTextCol}>
            <div style={styles.liveTitle}>Live</div>
            <div style={styles.liveSub}>Updated</div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div style={styles.metricsGrid}>
          <MetricCard
            icon="🏢"
            title="Total Companies"
            value={metrics.total_companies}
            status="normal"
          />
          <MetricCard
            icon="📊"
            title="Total Leads"
            value={metrics.total_leads.toLocaleString()}
            status="normal"
          />
          <MetricCard
            icon="⚠️"
            title="At Capacity"
            value={metrics.companies_at_capacity}
            status={metrics.companies_at_capacity > 0 ? 'critical' : 'normal'}
          />
          <MetricCard
            icon="🔶"
            title="Near Capacity"
            value={metrics.companies_near_capacity}
            status={metrics.companies_near_capacity > 0 ? 'warning' : 'normal'}
          />
          <MetricCard
            icon="😴"
            title="Inactive"
            value={metrics.inactive_companies}
            status={metrics.inactive_companies > 0 ? 'warning' : 'normal'}
          />
        </div>
      )}

      {/* Filters */}
      <div style={styles.filtersSection}>
        <div style={styles.filtersRow} className="filtersRow">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Plans</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Capacity</option>
            <option value="under_75">Under 75%</option>
            <option value="75_89">75-89%</option>
            <option value="90_99">90-99%</option>
            <option value="100">100% (Full)</option>
          </select>
        </div>

        <div style={styles.exportButtons} className="exportButtons">
          <button style={styles.exportButton} onClick={() => handleExport('companies')}>
            📊 Export Companies
          </button>
          <button style={styles.exportButton} onClick={() => handleExport('revenue')}>
            💰 Export Revenue
          </button>
          <button style={styles.exportButton} onClick={() => handleExport('usage_alerts')}>
            ⚠️ Export Alerts
          </button>
        </div>
      </div>

      {/* Companies Table */}
      <div style={styles.tableSection}>
        <div style={styles.sectionTitle}>Companies ({total})</div>
        <AdminDataTable
          data={companies}
          columns={columns}
          loading={false}
          onRowClick={(company) => setSelectedCompany(company)}
          pagination={{
            page,
            limit: 50,
            total,
            onPageChange: setPage,
          }}
        />
      </div>

      {/* Company Detail Modal */}
      {selectedCompany && (
        <CompanyDetailPanel
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onUpdate={() => {
            setSelectedCompany(null);
            loadData();
          }}
        />
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          :global(.filtersRow) {
            flex-direction: column !important;
          }
          :global(.filtersRow) > * {
            width: 100% !important;
          }
          :global(.exportButtons) {
            flex-direction: column !important;
          }
          :global(.exportButtons) > * {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
