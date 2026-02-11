'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DataTable } from '@/app/components/dashboard/DataTable';
import { LeadItem } from '@/app/components/dashboard/LeadItem';
import { DetailPanel } from '@/app/components/dashboard/DetailPanel';
import { KeyValueGrid } from '@/app/components/dashboard/KeyValueGrid';
import { useFormatters } from '@/app/components/shared/hooks';

type Tab = 'whatsapp' | 'voice';

const WHATSAPP_COLUMNS: string[] = [
  'customer_name',
  'phone',
  'email',
  'property_type',
  'requirements',
  'location',
  'timeline',
  'budget',
  'price_estimate',
  'property_address',
  'lead_score',
  'star_rating',
  'current_presence',
  'appointment_time',
  'conversation_summary',
  'GDPR_Consent',
  'Lead Category',
];

const TAB_TO_SOURCE: Record<Tab, string> = {
  whatsapp: 'WhatsApp Agent',
  voice: 'Voice Agent',
};

export default function LeadsPage() {
  const [tab, setTab] = useState<Tab>('whatsapp');
  const [rows, setRows] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { formatTime } = useFormatters();
  const sourceValue = useMemo(() => TAB_TO_SOURCE[tab], [tab]);

  const columnsToRender = useMemo(() => {
    if (tab === 'whatsapp') return WHATSAPP_COLUMNS;
    if (!rows || rows.length === 0) return [];
    const keys = Object.keys(rows[0] || {});
    return keys.includes('id') ? ['id', ...keys.filter((k) => k !== 'id')] : keys;
  }, [rows, tab]);

  // Fetch data
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('lead_store')
        .select('*')
        .eq('Source', sourceValue)
        .limit(1000);

      if (error) {
        setError(error.message);
        setRows([]);
        setActiveId(null);
        setLoading(false);
        return;
      }

      const fetched = (data || []) as any[];
      fetched.sort((a: any, b: any) => {
        const aKey = a.appointment_time ?? a.date ?? a.id ?? '';
        const bKey = b.appointment_time ?? b.date ?? b.id ?? '';
        const aD = new Date(aKey);
        const bD = new Date(bKey);
        if (!isNaN(aD.getTime()) && !isNaN(bD.getTime())) {
          return bD.getTime() - aD.getTime();
        }
        return String(bKey).localeCompare(String(aKey));
      });

      setRows(fetched);
      setLoading(false);
      if (fetched.length > 0) setActiveId(getItemId(fetched[0]));
      else setActiveId(null);
    })();
  }, [sourceValue]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const searchText = [
        getNiceTitle(r),
        r?.phone,
        r?.email,
        r?.['Lead Category'],
        r?.location,
        r?.property_type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchText.includes(q);
    });
  }, [rows, search]);

  // Auto-select first item when search changes
  useEffect(() => {
    if (!activeId || !filteredRows.some((r) => getItemId(r) === activeId)) {
      setActiveId(filteredRows[0] ? getItemId(filteredRows[0]) : null);
    }
  }, [search, tab, filteredRows.length, activeId]);

  function getItemId(item: any): string {
    return String(item?.id ?? item?.phone ?? item?.email ?? '0');
  }

  function getNiceTitle(row: any): string {
    const name = (row?.customer_name ?? row?.name ?? '').trim();
    if (name) return name;
    const phone = (row?.phone ?? row?.phone_number ?? '').trim();
    if (phone) return phone;
    const email = (row?.email ?? '').trim();
    if (email) return email;
    return `Lead ${row?.id ?? ''}`.trim();
  }

  function getBadgeText(row: any): string {
    const cat = (row?.['Lead Category'] ?? row?.lead_category ?? '').toString().trim();
    return cat || 'Lead';
  }

  function getScoreText(row: any): string {
    const s = row?.lead_score ?? row?.score ?? '';
    if (s === null || s === undefined || s === '') return '—';
    return String(s);
  }

  function downloadCSV() {
    try {
      setDownloading(true);
      const cols = columnsToRender.length ? columnsToRender : WHATSAPP_COLUMNS;
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const filename = `saasient-leads-${tab}-${stamp}.csv`;

      const header = cols.map(csvEscape).join(',');
      const lines = filteredRows.map((r) => cols.map((c) => csvEscape(r?.[c])).join(','));
      const csv = [header, ...lines].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function csvEscape(value: any): string {
    const s = value === null || value === undefined ? '' : 
              typeof value === 'object' ? JSON.stringify(value) : String(value);
    return `"${s.replace(/"/g, '""')}"`;
  }

  const tabs = [
    {
      id: 'whatsapp',
      label: 'WhatsApp Agent',
      active: tab === 'whatsapp',
      onClick: () => setTab('whatsapp'),
    },
    {
      id: 'voice',
      label: 'Voice Agent',
      active: tab === 'voice',
      onClick: () => setTab('voice'),
    },
  ];

  return (
    <DataTable
      title="Qualified Leads"
      subtitle={`Source = ${sourceValue}`}
      data={filteredRows}
      loading={loading}
      error={error}
      searchValue={search}
      onSearchChange={setSearch}
      onDownload={downloadCSV}
      downloading={downloading}
      tabs={tabs}
      activeId={activeId}
      onActiveChange={setActiveId}
      getItemId={getItemId}
      emptyMessage="No leads found."
      note={
        tab === 'whatsapp'
          ? 'WhatsApp tab is restricted to the exact columns you requested.'
          : 'Voice tab shows all columns automatically (based on returned row keys).'
      }
      renderItem={(item, isActive, onClick) => (
        <LeadItem
          title={getNiceTitle(item)}
          badge={getBadgeText(item)}
          score={getScoreText(item)}
          timestamp={formatTime(item?.appointment_time ?? item?.date ?? item?.created_at)}
          active={isActive}
          onClick={onClick}
        />
      )}
      renderDetail={(item) => (
        <DetailPanel
          title={getNiceTitle(item)}
          subtitle={`${getBadgeText(item)} • Score: ${getScoreText(item)}`}
        >
          <KeyValueGrid data={item} columns={columnsToRender} />
        </DetailPanel>
      )}
    />
  );
}