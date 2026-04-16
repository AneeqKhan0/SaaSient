'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NavItem } from '@/app/components/dashboard/NavItem';
import { adminLayoutStyles as styles } from '@/app/components/admin/styles/adminDashboardLayout';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      try {
        const response = await fetch('/api/admin/auth/session', {
          credentials: 'include', // Ensure cookies are sent
        });
        
        if (!mounted) return;
        
        if (!response.ok) {
          console.log('Session check failed:', response.status);
          router.replace('/admin/login');
          return;
        }

        const data = await response.json();
        
        if (!mounted) return;
        
        if (data.success && data.data?.admin) {
          setEmail(data.data.admin.email);
          setLoading(false);
        } else {
          console.log('Invalid session data:', data);
          router.replace('/admin/login');
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted) {
          router.replace('/admin/login');
        }
      }
    })();
    
    return () => {
      mounted = false;
    };
  }, [router]);

  async function signOut() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  if (loading) {
    return (
      <div style={styles.shell}>
        <div style={styles.bg} aria-hidden="true" />
        <div style={styles.noise} aria-hidden="true" />
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.62)' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.shell} className="adminShell">
      <div style={styles.bg} aria-hidden="true" />
      <div style={styles.noise} aria-hidden="true" />

      <aside style={styles.sidebar} className="adminSidebar">
        <div style={styles.brand}>
          <img 
            src="/SAASIENT-LOGO.png" 
            alt="SaaSient Logo" 
            style={styles.logo}
          />
        </div>

        <div style={styles.adminBadge}>Admin Portal</div>

        <nav style={styles.nav} className="adminNav">
          <NavItem 
            href="/admin/dashboard" 
            label="📊 Dashboard" 
            active={pathname === '/admin/dashboard'} 
          />
          <NavItem
            href="/admin/dashboard/companies"
            label="🏢 Companies"
            active={pathname.startsWith('/admin/dashboard/companies')}
          />
          <NavItem
            href="/admin/dashboard/audit-logs"
            label="📋 Audit Logs"
            active={pathname.startsWith('/admin/dashboard/audit-logs')}
          />
        </nav>

        <div style={styles.sidebarFooter} className="adminFooter">
          <div style={styles.userRow}>
            <div style={styles.avatar}>{(email?.[0] ?? 'A').toUpperCase()}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={styles.userEmail}>{email ?? '...'}</div>
              <div style={styles.userRole}>Administrator</div>
            </div>
          </div>
          <button onClick={signOut} style={styles.signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={styles.main} className="adminMain">
        <div style={styles.content} className="adminContent">{children}</div>
      </main>

      <style jsx global>{`
        @keyframes bgFloat {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-24px, 16px, 0) scale(1.02); }
          100% { transform: translate3d(24px, -16px, 0) scale(1.04); }
        }

        .navItemHoverable {
          transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
        }
        .navItemHoverable:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .navItemActive {
          background: rgba(0, 153, 249, 0.16) !important;
          border-color: rgba(0, 153, 249, 0.35) !important;
          color: rgba(255, 255, 255, 0.95) !important;
          box-shadow: 0 10px 30px rgba(0, 153, 249, 0.14);
        }
        .navItemHoverable:focus-visible {
          outline: 2px solid rgba(0, 153, 249, 0.75);
          outline-offset: 3px;
          border-radius: 12px;
        }

        @media (prefers-reduced-motion: reduce) {
          .navItemHoverable { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
