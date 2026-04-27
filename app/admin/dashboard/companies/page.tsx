'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable, ColumnDef } from '@/app/components/admin/AdminDataTable';
import { CompanyStatusBadge } from '@/app/components/admin/CompanyStatusBadge';
import { CompanyDetailPanel } from '@/app/components/admin/CompanyDetailPanel';
import { colors, borderRadius, spacing } from '@/app/components/shared/constants';
import { adminHomeStyles as styles } from '@/app/components/admin/styles/adminDashboardHome';
import type { CompanyWithMetrics } from '@/app/types/admin';

export default function CompaniesPage() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyWithMetrics[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithMetrics | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  // Mobile detail view — full screen
  if (isMobile && showDetail && selectedCompany) {
    return (
      <div style={{ position: 'relative', minHeight: '100%' }}>
        {/* Mobile back header */}
        <div style={mobileStyles.backHeader}>
          <button onClick={handleClose} style={mobileStyles.backBtn}>←</button>
          <div style={mobileStyles.backTitle}>{selectedCompany.name}</div>
        </div>
        <div style={{ padding: '0 0 80px 0' }}>
          <CompanyDetailPanel
            company={selectedCompany}
            onClose={handleClose}
            onUpdate={() => { handleClose(); loadCompanies(); }}
            inline
          />
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
          <div style={styles.h1}>Companies</div>
          <div style={styles.sub}>Manage all platform companies</div>
        </div>
      </div>

      {/* Filters */}
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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={compactSelectStyle}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Companies — table on desktop, cards on mobile */}
      <div style={styles.tableSection}>
        <div style={styles.sectionTitle}>All Companies ({total})</div>

        {isMobile ? (
          /* Mobile card list */
          <div style={mobileStyles.cardList}>
            {loading ? (
              <div style={mobileStyles.muted}>Loading...</div>
            ) : companies.length === 0 ? (
              <div style={mobileStyles.muted}>No companies found.</div>
            ) : (
              companies.map((company) => (
                <div
                  key={company.id}
                  style={mobileStyles.card}
                  onClick={() => handleCompanyClick(company)}
                >
                  <div style={mobileStyles.cardTop}>
                    <div style={mobileStyles.cardName}>{company.name}</div>
                    <CompanyStatusBadge status={company.status || 'active'} capacityPercent={company.capacity_percent} />
                  </div>
                  <div style={mobileStyles.cardSlug}>{company.slug}</div>
                  <div style={mobileStyles.cardMeta}>
                    <span style={mobileStyles.metaChip}>
                      {company.plan.charAt(0).toUpperCase() + company.plan.slice(1)}
                    </span>
                    <span style={mobileStyles.metaChip}>
                      {company.current_leads} / {company.max_leads} leads
                    </span>
                    <span style={mobileStyles.metaChip}>
                      {company.capacity_percent.toFixed(0)}% used
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Desktop table */
          <AdminDataTable
            data={companies}
            columns={columns}
            loading={loading}
            onRowClick={handleCompanyClick}
            pagination={{ page, limit: 50, total, onPageChange: setPage }}
          />
        )}
      </div>

      {/* Desktop modal */}
      {!isMobile && selectedCompany && (
        <CompanyDetailPanel
          company={selectedCompany}
          onClose={handleClose}
          onUpdate={() => { handleClose(); loadCompanies(); }}
        />
      )}
    </div>
  );
}

// Compact filter styles — inline, wrap, not full width
const filterRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  alignItems: 'center',
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

const mobileStyles: Record<string, React.CSSProperties> = {
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.22)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  cardName: {
    fontWeight: 900,
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
  },
  cardSlug: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 10,
  },
  cardMeta: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaChip: {
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.70)',
  },
  muted: {
    color: 'rgba(255,255,255,0.45)',
    padding: 16,
    fontSize: 14,
  },
  backHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0 16px 0',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    marginBottom: 16,
    position: 'sticky' as const,
    top: 0,
    background: 'rgba(12,18,32,0.95)',
    backdropFilter: 'blur(10px)',
    zIndex: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.30)',
    color: 'rgba(255,255,255,0.90)',
    fontSize: 18,
    fontWeight: 900,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 auto',
  },
  backTitle: {
    fontSize: 16,
    fontWeight: 950,
    color: 'rgba(255,255,255,0.95)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
};

import React from 'react';
