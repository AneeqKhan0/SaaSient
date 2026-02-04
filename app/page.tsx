'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setSessionEmail(sessionData.session?.user?.email ?? null);

      const { data, error } = await supabase.from('lead_store').select('*').limit(5);
      if (error) setError(error.message);
      setRows(data || []);
    })();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Auth + lead_store test</h1>
      <p>Logged in as: {sessionEmail ?? 'NOT LOGGED IN'}</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <pre>{JSON.stringify(rows, null, 2)}</pre>
    </main>
  );
}