'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { NavItem } from '@/app/components/dashboard/NavItem';
import { layoutStyles as styles } from '@/app/components/dashboard/styles/dashboardLayout';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/login');
        return;
      }
      setEmail(data.session.user.email ?? null);
    })();
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <div style={styles.shell} className="dashShell">
      <div style={styles.bg} aria-hidden="true" />
      <div style={styles.noise} aria-hidden="true" />

      <aside style={styles.sidebar} className="dashSidebar">
        <div style={styles.brand}>
          <div style={styles.logoWrap} aria-hidden="true">
            <div style={styles.logoInner}>S</div>
          </div>
          <div style={{ lineHeight: 1.05 }}>
            <div style={styles.brandTitle}>SaaSient</div>
            <div style={styles.brandSub}>Dashboard</div>
          </div>
        </div>

        <nav style={styles.nav} className="dashNav">
          <NavItem href="/dashboard" label="Overview" active={pathname === '/dashboard'} />
          <NavItem
            href="/dashboard/leads"
            label="Qualified Leads"
            active={pathname.startsWith('/dashboard/leads')}
          />
          <NavItem
            href="/dashboard/whatsapp"
            label="WhatsApp Conversations"
            active={pathname.startsWith('/dashboard/whatsapp')}
          />
          <NavItem
            href="/dashboard/appointments"
            label="Appointments"
            active={pathname.startsWith('/dashboard/appointments')}
          />
        </nav>

        <div style={styles.sidebarFooter} className="dashFooter">
          <div style={styles.userRow}>
            <div style={styles.avatar}>{(email?.[0] ?? 'U').toUpperCase()}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={styles.userEmail}>{email ?? '...'}</div>
              <div style={styles.userRole}>Admin</div>
            </div>
          </div>
          <button onClick={signOut} style={styles.signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={styles.main} className="dashMain">
        <div style={styles.content} className="dashContent">{children}</div>
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

        @media (max-width: 980px) {
          .dashShell {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto 1fr !important;
          }
          .dashSidebar {
            position: sticky;
            top: 0;
            z-index: 10;
            border-right: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
            padding: 12px !important;
            background: rgba(10, 12, 16, 0.8) !important;
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
          }
          .dashNav {
            grid-auto-flow: column;
            grid-auto-columns: 1fr;
            overflow-x: auto;
            gap: 10px !important;
            padding-bottom: 6px;
            scrollbar-width: none;
          }
          .dashNav::-webkit-scrollbar { display: none; }
          .dashMain { padding: 14px !important; }
          .dashContent { min-height: auto !important; }
          .dashFooter { display: none !important; }
        }

        @media (max-width: 640px) {
          .dashShell {
            grid-template-rows: auto 1fr !important;
          }
          .dashSidebar {
            padding: 8px !important;
          }
          .dashNav {
            gap: 6px !important;
          }
          .dashMain {
            padding: 8px !important;
          }
          .dashContent {
            border-radius: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
