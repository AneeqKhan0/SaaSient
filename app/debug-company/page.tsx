'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DebugCompanyPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkData() {
      const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID;
      
      const results: any = {
        companyId: COMPANY_ID || 'NOT SET',
        tables: {}
      };

      // Check lead_store
      const { data: allLeads, error: allLeadsError } = await supabase
        .from('lead_store')
        .select('id, company_id, customer_name')
        .limit(5);
      
      results.tables.lead_store = {
        total: allLeads?.length || 0,
        sample: allLeads,
        error: allLeadsError?.message,
        hasCompanyIdColumn: allLeads && allLeads.length > 0 ? 'company_id' in allLeads[0] : 'unknown'
      };

      if (COMPANY_ID) {
        const { data: filteredLeads, error: filteredError } = await supabase
          .from('lead_store')
          .select('id, company_id, customer_name')
          .eq('company_id', COMPANY_ID)
          .limit(5);
        
        results.tables.lead_store.filteredByCompanyId = filteredLeads?.length || 0;
        results.tables.lead_store.filteredError = filteredError?.message;
      }

      // Check whatsapp_conversations
      const { data: allConvos, error: allConvosError } = await supabase
        .from('whatsapp_conversations')
        .select('whatsapp_user_id, company_id, name')
        .limit(5);
      
      results.tables.whatsapp_conversations = {
        total: allConvos?.length || 0,
        sample: allConvos,
        error: allConvosError?.message,
        hasCompanyIdColumn: allConvos && allConvos.length > 0 ? 'company_id' in allConvos[0] : 'unknown'
      };

      if (COMPANY_ID) {
        const { data: filteredConvos, error: filteredConvosError } = await supabase
          .from('whatsapp_conversations')
          .select('whatsapp_user_id, company_id, name')
          .eq('company_id', COMPANY_ID)
          .limit(5);
        
        results.tables.whatsapp_conversations.filteredByCompanyId = filteredConvos?.length || 0;
        results.tables.whatsapp_conversations.filteredError = filteredConvosError?.message;
      }

      // Check Conversations
      const { data: allMessages, error: allMessagesError } = await supabase
        .from('Conversations')
        .select('id, company_id')
        .limit(5);
      
      results.tables.Conversations = {
        total: allMessages?.length || 0,
        sample: allMessages,
        error: allMessagesError?.message,
        hasCompanyIdColumn: allMessages && allMessages.length > 0 ? 'company_id' in allMessages[0] : 'unknown'
      };

      if (COMPANY_ID) {
        const { data: filteredMessages, error: filteredMessagesError } = await supabase
          .from('Conversations')
          .select('id, company_id')
          .eq('company_id', COMPANY_ID)
          .limit(5);
        
        results.tables.Conversations.filteredByCompanyId = filteredMessages?.length || 0;
        results.tables.Conversations.filteredError = filteredMessagesError?.message;
      }

      setResults(results);
      setLoading(false);
    }

    checkData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, fontFamily: 'monospace' }}>
        <h1>Loading diagnostic data...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', background: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ color: '#0099ff' }}>Company ID Debug Page</h1>
      
      <div style={{ background: '#2a2a2a', padding: 20, borderRadius: 8, marginTop: 20 }}>
        <h2>Environment</h2>
        <p><strong>NEXT_PUBLIC_COMPANY_ID:</strong> {results.companyId}</p>
      </div>

      {Object.entries(results.tables).map(([tableName, tableData]: [string, any]) => (
        <div key={tableName} style={{ background: '#2a2a2a', padding: 20, borderRadius: 8, marginTop: 20 }}>
          <h2 style={{ color: '#0099ff' }}>{tableName}</h2>
          
          <p><strong>Total rows (unfiltered):</strong> {tableData.total}</p>
          <p><strong>Has company_id column:</strong> {String(tableData.hasCompanyIdColumn)}</p>
          
          {tableData.error && (
            <p style={{ color: '#ff4444' }}><strong>Error:</strong> {tableData.error}</p>
          )}

          {results.companyId !== 'NOT SET' && (
            <>
              <p><strong>Rows matching company_id:</strong> {tableData.filteredByCompanyId}</p>
              {tableData.filteredError && (
                <p style={{ color: '#ff4444' }}><strong>Filter Error:</strong> {tableData.filteredError}</p>
              )}
            </>
          )}

          {tableData.sample && tableData.sample.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', color: '#0099ff' }}>View sample data</summary>
              <pre style={{ background: '#1a1a1a', padding: 10, borderRadius: 4, overflow: 'auto', marginTop: 10 }}>
                {JSON.stringify(tableData.sample, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ))}

      <div style={{ background: '#2a2a2a', padding: 20, borderRadius: 8, marginTop: 20 }}>
        <h2 style={{ color: '#ff9900' }}>Next Steps</h2>
        <ol>
          <li>Check if company_id column exists in all tables</li>
          <li>If column exists but no data matches, you need to populate the company_id values</li>
          <li>If column doesn't exist, you need to add it to your Supabase tables</li>
        </ol>
      </div>
    </div>
  );
}
