'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID;
        
        // Get current session
        const { data: sessionData } = await supabase.auth.getSession();
        
        let membershipData = null;
        let companiesData = null;
        let userCompanies = null;
        
        if (sessionData.session?.user) {
          // Check membership for this specific company
          const { data: membership, error: memberError } = await supabase
            .from('company_members')
            .select('*')
            .eq('user_id', sessionData.session.user.id)
            .eq('company_id', COMPANY_ID);
          
          membershipData = { data: membership, error: memberError };
          
          // Get all companies this user belongs to
          const { data: allMemberships, error: allMemberError } = await supabase
            .from('company_members')
            .select(`
              *,
              companies (
                id,
                name,
                slug
              )
            `)
            .eq('user_id', sessionData.session.user.id);
          
          userCompanies = { data: allMemberships, error: allMemberError };
          
          // Get company details for the configured company
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', COMPANY_ID)
            .single();
          
          companiesData = { data: company, error: companyError };
        }
        
        setDebugInfo({
          environment: {
            COMPANY_ID,
            NODE_ENV: process.env.NODE_ENV,
            SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          },
          session: sessionData,
          membership: membershipData,
          company: companiesData,
          userCompanies: userCompanies,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading debug info...</div>;
  }

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', background: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
      <h1>Authentication Debug Page</h1>
      <pre style={{ background: '#2a2a2a', padding: 20, borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      
      <div style={{ marginTop: 20 }}>
        <button 
          onClick={() => window.location.href = '/login'}
          style={{ padding: '10px 20px', marginRight: 10 }}
        >
          Go to Login
        </button>
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
          style={{ padding: '10px 20px' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}