'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable, ColumnDef } from '@/app/components/admin/AdminDataTable';
import { CompanyStatusBadge } from '@/app/components/admin/CompanyStatusBadge';
import { CompanyDetailPanel } from '@/app/components/admin/CompanyDetailPanel';
import { colors } from '@/app/components/shared/constants';
import { adminHomeStyles as styles } from '@/app/components/admin/styles/adminDashboardHome';
import type { CompanyWithMetrics } from '@/app/types/admin';

export default function CompaniesPage() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyWithMetrics[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCompanies();
  }, [searchQuery, planFilter, capacityFilter, statusFilter, page]);

  async function loadCompanies() {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(searchQuery && { search: searchQuery }),
        ...(planFilter && { plan: planFilter }),
        ...(capacityFilter && { capacity: capacityFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/companies?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.data.companies);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Load companies error:', error);
    } finally {
      setLoading(false);
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

  return (
    <div style={styles.shell}>
      <div style={styles.noise} aria-hidden="true" />

      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <div style={styles.adminBadge}>Admin Portal</div>
          <div style={styles.h1}>Companies</div>
          <div style={styles.sub}>Manage all platform companies</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersSection}>
        <div style={styles.filtersRow}>
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div style={styles.tableSection}>
        <div style={styles.sectionTitle}>All Companies ({total})</div>
        <AdminDataTable
          data={companies}
          columns={columns}
          loading={loading}
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
            loadCompanies();
          }}
        />
      )}
    </div>
  );
}
