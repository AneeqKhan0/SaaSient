'use client';

import React, { useEffect, useState } from 'react';
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
  const [showDetail, setShowDetail] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const scrollPosRef = React.useRef(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile && showDetail) {
      const shell = document.querySelector('.adminShell');
      if (shell) shell.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }, [isMobile, showDetail]);

  useEffect(() => { loadData(true); }, []);

  async function loadData(isInitial = false) {
    try {
      if (isInitial) setInitialLoading(true);
      const metricsRes = await fetch('/api/admin/metrics');
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data);
      }
      const params = new URLSearchParams({
        page: page.toString(), limit: '50',
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
      if (isInitial) setInitialLoading(false);
    }
  }

  useEffect(() => { if (!initialLoading) loadData(false); }, [searchQuery, planFilter, capacityFilter, page]);

  useEffect(() => {
    const interval = setInterval(() => loadData(false), 30000);
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
    } catch (error) { console.error('Export error:', error); }
  }

  function handleCompanyClick(company: CompanyWithMetrics) {
    const shell = document.querySelector('.adminShell');
    scrollPosRef.current = shell ? shell.scrollTop : window.scrollY;
    setSelectedCompany(company);
    setShowDetail(true);
  }

  function handleClose() {
    setShowDetail(false);
    setSelectedCompany(null);
    setTimeout(() => {
      const shell = document.querySelector('.adminShell');
      if (shell) shell.scrollTop = scrollPosRef.current;
      window.scrollTo(0, scrollPosRef.current);
    }, 10);
  }

  const columns: ColumnDef[] = [
    {
      key: 'name', label: 'Company Name',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 900, marginBottom: 4 }}>{value}</div>
          <div style={{ fontSize: 12, color: colors.text.tertiary }}>{row.slug}</div>
        </div>
      ),
    },
    { key: 'plan', label: 'Plan', render: (value) => <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{value}</span> },
    {
      key: 'current_leads', label: 'Leads',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 900 }}>{value} / {row.max_leads}</div>
          <div style={{ fontSize: 11, color: colors.text.tertiary }}>{row.capacity_percent.toFixed(0)}% used</div>
        </div>
      ),
    },
    { key: 'status', label: 'Status', render: (value, row) => <CompanyStatusBadge status={value || 'active'} capacityPercent={row.capacity_percent} /> },
    { key: 'created_at', label: 'Created', render: (value) => new Date(value).toLocaleDateString() },
  ];

  if (initialLoading) {
    return (
      <div style={styles.shell}>
        <div style={styles.noise} aria-hidden="true" />
        <div style={{ padding: 40, textAlign: 'center', color: colors.text.secondary }}>Loading admin dashboard...</div>
      </div>
    );
  }

  // Mobile detail view — full screen
  if (isMobile && showDetail && selectedCompany) {
    return (
      <div style={{ position: 'relative', minHeight: '100%' }}>
        <div style={mobileStyles.backHeader}>
          <button onClick={handleClose} style={mobileStyles.backBtn}>←</button>
          <div style={mobileStyles.backTitle}>{selectedCompany.name}</div>
        </div>
        <div style={{ padding: '0 0 80px 0' }}>
          <CompanyDetailPanel company={selectedCompany} onClose={handleClose} onUpdate={() => { handleClose(); loadData(); }} inline />
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
          <MetricCard icon="🏢" title="Total Companies" value={metrics.total_companies} status="normal" />
          <MetricCard icon="📊" title="Total Leads" value={metrics.total_leads.toLocaleString()} status="normal" />
          <MetricCard icon="⚠️" title="At Capacity" value={metrics.companies_at_capacity} status={metrics.companies_at_capacity > 0 ? 'critical' : 'normal'} />
          <MetricCard icon="🔶" title="Near Capacity" value={metrics.companies_near_capacity} status={metrics.companies_near_capacity > 0 ? 'warning' : 'normal'} />
          <MetricCard icon="😴" title="Inactive" value={metrics.inactive_companies} status={metrics.inactive_companies > 0 ? 'warning' : 'normal'} />
        </div>
      )}

      {/* Filters — compact inline, wrap naturally */}
      <div style={styles.filtersSection}>
        <div style={filterRowStyle}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={compactInputStyle}
          />
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} style={compactSelectStyle}>
            <option value="">All Plans</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select value={capacityFilter} onChange={(e) => setCapacityFilter(e.target.value)} style={compactSelectStyle}>
            <option value="">All Capacity</option>
            <option value="under_75">Under 75%</option>
            <option value="75_89">75-89%</option>
            <option value="90_99">90-99%</option>
            <option value="100">100% Full</option>
          </select>
        </div>
        <div style={exportRowStyle}>
          <button style={compactExportBtn} onClick={() => handleExport('companies')}>📊 Export Companies</button>
          <button style={compactExportBtn} onClick={() => handleExport('revenue')}>💰 Export Revenue</button>
          <button style={compactExportBtn} onClick={() => handleExport('usage_alerts')}>⚠️ Export Alerts</button>
        </div>
      </div>

      {/* Companies — table on desktop, cards on mobile */}
      <div style={{ ...styles.tableSection, paddingBottom: 80 }}>
        <div style={styles.sectionTitle}>Companies ({total})</div>

        {isMobile ? (
          <div style={mobileStyles.cardList}>
            {companies.length === 0 ? (
              <div style={mobileStyles.muted}>No companies found.</div>
            ) : (
              companies.map((company) => (
                <div key={company.id} style={mobileStyles.card} onClick={() => handleCompanyClick(company)}>
                  <div style={mobileStyles.cardTop}>
                    <div style={mobileStyles.cardName}>{company.name}</div>
                    <CompanyStatusBadge status={company.status || 'active'} capacityPercent={company.capacity_percent} />
                  </div>
                  <div style={mobileStyles.cardSlug}>{company.slug}</div>
                  <div style={mobileStyles.cardMeta}>
                    <span style={mobileStyles.metaChip}>{company.plan.charAt(0).toUpperCase() + company.plan.slice(1)}</span>
                    <span style={mobileStyles.metaChip}>{company.current_leads} / {company.max_leads} leads</span>
                    <span style={mobileStyles.metaChip}>{company.capacity_percent.toFixed(0)}% used</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <AdminDataTable
            data={companies}
            columns={columns}
            loading={false}
            onRowClick={handleCompanyClick}
            pagination={{ page, limit: 50, total, onPageChange: setPage }}
          />
        )}
      </div>

      {/* Desktop modal only */}
      {!isMobile && selectedCompany && (
        <CompanyDetailPanel
          company={selectedCompany}
          onClose={handleClose}
          onUpdate={() => { handleClose(); loadData(); }}
        />
      )}
    </div>
  );
}

const filterRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  alignItems: 'center',
  marginBottom: 10,
};

const exportRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const compactInputStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10,
  color: 'rgba(255,255,255,0.92)',
  fontSize: 13,
  fontWeight: 600,
  outline: 'none',
  minWidth: 0,
  flex: '1 1 120px',
  maxWidth: 220,
};

const compactSelectStyle: React.CSSProperties = {
  padding: '8px 10px',
  background: '#0a0c10',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10,
  color: 'rgba(255,255,255,0.92)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  outline: 'none',
  flex: '0 0 auto',
};

const compactExportBtn: React.CSSProperties = {
  padding: '7px 12px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  color: 'rgba(255,255,255,0.85)',
  fontSize: 12,
  fontWeight: 750,
  cursor: 'pointer',
  flex: '0 0 auto',
  whiteSpace: 'nowrap',
};

const mobileStyles: Record<string, React.CSSProperties> = {
  cardList: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    padding: 14,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.22)',
    cursor: 'pointer',
  },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  cardName: { fontWeight: 900, fontSize: 15, color: 'rgba(255,255,255,0.95)' },
  cardSlug: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 10 },
  cardMeta: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  metaChip: {
    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.70)',
  },
  muted: { color: 'rgba(255,255,255,0.45)', padding: 16, fontSize: 14 },
  backHeader: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 16,
    position: 'sticky', top: 0, background: 'rgba(12,18,32,0.95)', backdropFilter: 'blur(10px)', zIndex: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.30)', color: 'rgba(255,255,255,0.90)', fontSize: 18, fontWeight: 900,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
  },
  backTitle: { fontSize: 16, fontWeight: 950, color: 'rgba(255,255,255,0.95)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
