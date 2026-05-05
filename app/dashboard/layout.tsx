'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { NavItem } from '@/app/components/dashboard/NavItem';
import { MobileMenu } from '@/app/components/dashboard/MobileMenu';
import { layoutStyles as styles } from '@/app/components/dashboard/styles/dashboardLayout';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID;

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        await supabase.auth.signOut();
        router.replace('/login');
        return;
      }

      // Secondary check: Verify user belongs to this company and get role
      if (COMPANY_ID) {
        const { data: membership, error: memberError } = await supabase
          .from('company_members')
          .select('company_id, role')
          .eq('user_id', data.session.user.id)
          .eq('company_id', COMPANY_ID)
          .single();

        if (memberError || !membership) {
          // User doesn't belong to this company - sign them out
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }

        setUserRole(membership.role);
        
        // Redirect non-admin users away from settings
        if (membership.role !== 'admin' && pathname.startsWith('/dashboard/settings')) {
          router.replace('/dashboard');
          return;
        }
      }

      setEmail(data.session.user.email ?? null);
    })();
  }, [router, pathname]);

  async function signOut() {
    // Clear the 7-day MFA verified flag so the next login requires OTP again
    if (typeof window !== 'undefined') {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;
      if (userId) {
        localStorage.removeItem(`mfa_verified_until_${userId}`);
      }
    }
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <div style={styles.shell} className="dashShell">
      <div style={styles.bg} aria-hidden="true" />
      <div style={styles.noise} aria-hidden="true" />

      <div style={styles.mobileHeader} className="dashMobileHeader">
        <img 
          src="/SAASIENT-LOGO.png" 
          alt="SaaSient Logo" 
          style={styles.mobileLogo}
        />
        <MobileMenu email={email} onSignOut={signOut} />
      </div>

      <aside style={styles.sidebar} className="dashSidebar">
        <div style={styles.brand}>
          <img 
            src="/SAASIENT-LOGO.png" 
            alt="SaaSient Logo" 
            style={styles.logo}
          />
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
          <NavItem
            href="/dashboard/usage"
            label="Plan Usage"
            active={pathname.startsWith('/dashboard/usage')}
          />
        </nav>

        <div style={styles.sidebarFooter} className="dashFooter">
          {userRole === 'admin' && (
            <NavItem
              href="/dashboard/settings"
              label="⚙️ Settings"
              active={pathname.startsWith('/dashboard/settings')}
            />
          )}
          <div style={styles.userRow}>
            <div style={styles.avatar}>{(email?.[0] ?? 'U').toUpperCase()}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={styles.userEmail}>{email ?? '...'}</div>
              {userRole && (
                <div style={styles.userRole}>
                  {userRole === 'admin' ? '👑 Admin' : '👤 Member'}
                </div>
              )}
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
            overflow: hidden !important;
          }
          .dashMobileHeader {
            display: flex !important;
          }
          .dashMobileHeader button {
            display: flex !important;
          }
          .dashMobileHeader .mobileMenuContainer {
            display: flex !important;
          }
          .dashSidebar {
            display: none !important;
          }
          .dashMain { 
            padding: 14px !important;
            overflow: hidden !important;
          }
          .dashContent {
            height: calc(100vh - 80px) !important;
            min-height: calc(100vh - 80px) !important;
            max-height: calc(100vh - 80px) !important;
            padding: 14px !important;
            overflow: auto !important;
          }
        }

        @media (max-width: 640px) {
          .dashMain {
            padding: 10px !important;
          }
          .dashContent {
            height: calc(100vh - 70px) !important;
            border-radius: 12px !important;
            padding: 12px !important;
            min-height: calc(100vh - 70px) !important;
            max-height: calc(100vh - 70px) !important;
          }
          .dashMobileHeader {
            padding: 10px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
