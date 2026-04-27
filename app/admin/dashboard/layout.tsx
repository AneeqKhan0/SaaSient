'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NavItem } from '@/app/components/dashboard/NavItem';
import { AdminMobileMenu } from '@/app/components/admin/AdminMobileMenu';
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

      {/* Mobile hamburger menu — hidden on desktop via CSS */}
      <AdminMobileMenu email={email} onSignOut={signOut} />

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

        /* ── Mobile responsive ── */
        @media (max-width: 768px) {
          .adminShell {
            display: block !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            height: 100vh !important;
            height: 100dvh !important;
            width: 100vw !important;
            max-width: 100vw !important;
          }
          .adminSidebar {
            display: none !important;
          }
          .adminMobileTopBar {
            display: flex !important;
          }
          .adminMain {
            padding: 8px !important;
            min-width: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            box-sizing: border-box !important;
            height: auto !important;
            display: block !important;
          }
          .adminContent {
            min-height: auto !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            border-radius: 12px !important;
            padding: 12px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            display: block !important;
            flex-direction: unset !important;
          }
          /* Page shell inside adminContent */
          .adminContent > div {
            min-height: auto !important;
            height: auto !important;
            overflow: visible !important;
            padding-bottom: 120px !important;
            display: block !important;
          }
        }

        /* Desktop: dropdown options dark background */
        @media (min-width: 769px) {
          .adminContent > div {
            overflow: auto !important;
          }
          select option {
            background: #0a0c10 !important;
            color: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
