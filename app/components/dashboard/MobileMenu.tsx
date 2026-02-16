'use client';

import { useState, useEffect, CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colors, borderRadius } from '@/app/components/shared/constants';

type MobileMenuProps = {
  email: string | null;
  onSignOut: () => void;
};

export function MobileMenu({ email, onSignOut }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navItems = [
    { href: '/dashboard', label: 'Overview', active: pathname === '/dashboard' },
    { href: '/dashboard/leads', label: 'Qualified Leads', active: pathname.startsWith('/dashboard/leads') },
    { href: '/dashboard/whatsapp', label: 'WhatsApp', active: pathname.startsWith('/dashboard/whatsapp') },
    { href: '/dashboard/appointments', label: 'Appointments', active: pathname.startsWith('/dashboard/appointments') },
  ];

  return (
    <>
      <style jsx global>{`
        @media (max-width: 980px) {
          .mobileMenuHamburger {
            display: flex !important;
          }
          .mobileMenuOverlay {
            display: block !important;
          }
          .mobileMenuContainer {
            display: flex !important;
          }
        }
      `}</style>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.hamburger}
        className="mobileMenuHamburger"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <span style={{ ...styles.hamburgerLine, ...(isOpen ? styles.hamburgerLineOpen1 : {}) }} />
        <span style={{ ...styles.hamburgerLine, ...(isOpen ? styles.hamburgerLineOpen2 : {}) }} />
        <span style={{ ...styles.hamburgerLine, ...(isOpen ? styles.hamburgerLineOpen3 : {}) }} />
      </button>

      {isOpen && <div style={styles.overlay} className="mobileMenuOverlay" onClick={() => setIsOpen(false)} />}

      <div style={{ ...styles.menu, ...(isOpen ? styles.menuOpen : {}) }} className="mobileMenuContainer">
        <div style={styles.menuHeader}>
          <div style={styles.brand}>
            <div style={styles.logoWrap}>
              <div style={styles.logoInner}>S</div>
            </div>
            <div>
              <div style={styles.brandTitle}>SaaSient</div>
              <div style={styles.brandSub}>Dashboard</div>
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.navItem,
                ...(item.active ? styles.navItemActive : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={styles.menuFooter}>
          <div style={styles.userRow}>
            <div style={styles.avatar}>{(email?.[0] ?? 'U').toUpperCase()}</div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={styles.userEmail}>{email ?? '...'}</div>
              <div style={styles.userRole}>Admin</div>
            </div>
          </div>
          <button onClick={onSignOut} style={styles.signOut}>
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  hamburger: {
    display: 'none',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: 32,
    height: 32,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    zIndex: 1001,
  },
  hamburgerLine: {
    width: '100%',
    height: 2,
    background: colors.text.primary,
    borderRadius: 2,
    transition: 'all 0.3s ease',
    transformOrigin: 'center',
  },
  hamburgerLineOpen1: {
    transform: 'rotate(45deg) translateY(8px)',
  },
  hamburgerLineOpen2: {
    opacity: 0,
  },
  hamburgerLineOpen3: {
    transform: 'rotate(-45deg) translateY(-8px)',
  },
  overlay: {
    display: 'none',
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 999,
  },
  menu: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: '-100%',
    width: '280px',
    maxWidth: '85vw',
    height: '100vh',
    background: 'rgba(10,12,16,0.98)',
    backdropFilter: 'blur(20px)',
    borderRight: `1px solid ${colors.card.border}`,
    transition: 'left 0.3s ease',
    zIndex: 1000,
    flexDirection: 'column',
    padding: 16,
    gap: 16,
    overflowY: 'auto',
  },
  menuOpen: {
    left: 0,
  },
  menuHeader: {
    paddingBottom: 12,
    borderBottom: `1px solid ${colors.card.border}`,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    background: 'rgba(0,153,249,0.12)',
    border: '1px solid rgba(0,153,249,0.28)',
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 18px 40px rgba(0,153,249,0.12)',
  },
  logoInner: {
    width: 32,
    height: 32,
    borderRadius: 12,
    display: 'grid',
    placeItems: 'center',
    background: colors.accent,
    color: '#001018',
    fontWeight: 950,
    letterSpacing: -0.2,
  },
  brandTitle: {
    fontWeight: 900,
    fontSize: 16,
    lineHeight: 1.1,
  },
  brandSub: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
  },
  navItem: {
    padding: '12px 14px',
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.22)',
    color: colors.text.primary,
    textDecoration: 'none',
    fontWeight: 750,
    fontSize: 15,
    transition: 'all 0.2s ease',
  },
  navItemActive: {
    background: 'rgba(0,153,249,0.16)',
    borderColor: 'rgba(0,153,249,0.35)',
    color: colors.text.primary,
    boxShadow: '0 10px 30px rgba(0,153,249,0.14)',
  },
  menuFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingTop: 12,
    borderTop: `1px solid ${colors.card.border}`,
  },
  userRow: {
    display: 'grid',
    gridTemplateColumns: '36px 1fr',
    gap: 10,
    alignItems: 'center',
    padding: 10,
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.md,
    background: 'rgba(0,0,0,0.22)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(255,255,255,0.08)',
    border: `1px solid ${colors.card.border}`,
    fontWeight: 900,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: 750,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  signOut: {
    height: 40,
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.22)',
    color: colors.text.primary,
    fontWeight: 850,
    cursor: 'pointer',
    fontSize: 15,
  },
};
