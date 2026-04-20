'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DataTable } from '@/app/components/dashboard/DataTable';
import { LeadItem } from '@/app/components/dashboard/LeadItem';
import { DetailPanel } from '@/app/components/dashboard/DetailPanel';
import { KeyValueGrid } from '@/app/components/dashboard/KeyValueGrid';
import { useFormatters } from '@/app/components/shared/hooks';

type Tab = 'whatsapp' | 'voice';
type CategoryFilter = 'all' | 'hot' | 'warm' | 'cold';

const WHATSAPP_COLUMNS: string[] = [
  'First_Name',
  'Last_Name',
  'Full_name',
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

const FONT_SIZES = [11, 13, 15, 17] as const;

const TAB_TO_SOURCE: Record<Tab, string> = {
  whatsapp: 'WhatsApp agent',  // Changed from 'WhatsApp Agent' to match database
  voice: 'Voice Agent',
};

export default function LeadsPage() {
  const [tab, setTab] = useState<Tab>('whatsapp');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [rows, setRows] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [fontSizeIdx, setFontSizeIdx] = useState(1); // default 13px
  const [isMobile, setIsMobile] = useState(false);

  const { formatTime } = useFormatters();
  const sourceValue = useMemo(() => TAB_TO_SOURCE[tab], [tab]);
  const currentFontSize = FONT_SIZES[fontSizeIdx];

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 980);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

      const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID!;
      if (!COMPANY_ID) {
        setError('COMPANY_ID is not configured');
        setRows([]);
        setActiveId(null);
        setLoading(false);
        return;
      }

      console.log('Fetching leads with:', { COMPANY_ID, sourceValue });

      // First, let's check what Source values actually exist
      const { data: allData, error: allError } = await supabase
        .from('lead_store')
        .select('Source, First_Name, Last_Name, Full_name, id')
        .eq('company_id', COMPANY_ID)
        .limit(20);

      console.log('All leads with Sources:', allData, 'Error:', allError);
      
      // Get unique source values
      const uniqueSources = [...new Set(allData?.map(item => item.Source) || [])];
      console.log('Unique Source values found:', uniqueSources);

      // TEMPORARY: Show all leads regardless of source for debugging
      const { data, error } = await supabase
        .from('lead_store')
        .select('*')
        .eq('company_id', COMPANY_ID)
        .eq('Source', sourceValue)  // Re-enabled source filtering
        .limit(1000);

      console.log('Filtered leads for source:', sourceValue, 'Data:', data, 'Error:', error);

      if (error) {
        console.error('Supabase error:', error);
        setError(error.message);
        setRows([]);
        setActiveId(null);
        setLoading(false);
        return;
      }

      const fetched = (data || []) as any[];
      console.log('Fetched leads:', fetched.length, 'leads');
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
      // Only auto-select first item on desktop, not on mobile
      if (fetched.length > 0) {
        // Use window.innerWidth directly to avoid dependency on isMobile state
        const isCurrentlyMobile = window.innerWidth <= 980;
        if (!isCurrentlyMobile) {
          setActiveId(getItemId(fetched[0]));
        } else {
          setActiveId(null);
        }
      } else {
        setActiveId(null);
      }
    })();
  }, [sourceValue]);

  const filteredRows = useMemo(() => {
    let result = rows;

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter((r) => {
        const cat = (r?.['Lead Category'] ?? r?.lead_category ?? '').toString().trim().toUpperCase();
        return cat === categoryFilter.toUpperCase();
      });
    }

    // Apply search filter
    const q = search.trim().toLowerCase();
    if (!q) return result;

    return result.filter((r) => {
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
  }, [rows, search, categoryFilter]);

  // Auto-select first item when search changes (desktop only)
  useEffect(() => {
    if (!isMobile && (!activeId || !filteredRows.some((r) => getItemId(r) === activeId))) {
      setActiveId(filteredRows[0] ? getItemId(filteredRows[0]) : null);
    } else if (isMobile && activeId && !filteredRows.some((r) => getItemId(r) === activeId)) {
      // On mobile, only clear activeId if current selection is not in filtered results
      setActiveId(null);
    }
  }, [search, tab, filteredRows.length, activeId, isMobile]);

  function getItemId(item: any): string {
    return String(item?.id ?? item?.phone ?? item?.email ?? '0');
  }

  function getNiceTitle(row: any): string {
    const name = (row?.Full_name ?? row?.customer_name ?? row?.name ?? '').trim();
    if (name) return name;
    
    // Try to construct from First_Name and Last_Name
    const firstName = (row?.First_Name ?? '').trim();
    const lastName = (row?.Last_Name ?? '').trim();
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
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
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      active: tab === 'whatsapp',
      onClick: () => { setTab('whatsapp'); setCategoryFilter('all'); },
    },
    {
      id: 'voice',
      label: 'Voice Agent',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M12 2a2 2 0 012 2v1h1a3 3 0 013 3v2a3 3 0 01-3 3h-1v1a2 2 0 01-4 0v-1H9a3 3 0 01-3-3V8a3 3 0 013-3h1V4a2 2 0 012-2zm0 2v3H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V8a1 1 0 00-1-1h-3V4zM8 17a1 1 0 011-1h6a1 1 0 011 1v1a4 4 0 01-8 0v-1zm2 1v1a2 2 0 004 0v-1H10z"/>
          <circle cx="9.5" cy="9" r="1"/>
          <circle cx="14.5" cy="9" r="1"/>
          <path d="M10 11.5a2 2 0 004 0"/>
        </svg>
      ),
      active: tab === 'voice',
      onClick: () => { setTab('voice'); setCategoryFilter('all'); },
    },
  ];

  const categoryTabs: Array<{ id: CategoryFilter; label: string; color: string }> = [
    { id: 'all',  label: 'All',  color: 'rgba(255,255,255,0.55)' },
    { id: 'hot',  label: '🔥 Hot',  color: '#ff6b6b' },
    { id: 'warm', label: '✨ Warm', color: '#f5a623' },
    { id: 'cold', label: '❄️ Cold', color: '#4fc3f7' },
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
      categoryTabs={categoryTabs}
      activeCategoryTab={categoryFilter}
      onCategoryTabChange={(id) => setCategoryFilter(id as CategoryFilter)}
      activeId={activeId}
      onActiveChange={setActiveId}
      getItemId={getItemId}
      emptyMessage="No leads found."
      fontSize={currentFontSize}
      onFontSizeDecrease={() => setFontSizeIdx((i) => Math.max(0, i - 1))}
      onFontSizeIncrease={() => setFontSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
      canDecrease={fontSizeIdx > 0}
      canIncrease={fontSizeIdx < FONT_SIZES.length - 1}
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
          searchable
        >
          {(detailSearch) => (
            <KeyValueGrid data={item} columns={columnsToRender} fontSize={currentFontSize} searchQuery={detailSearch} />
          )}
        </DetailPanel>
      )}
    />
  );
}