'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type AdminMobileMenuProps = {
  email: string | null;
  onSignOut: () => void;
};

export function AdminMobileMenu({ email, onSignOut }: AdminMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const navItems = [
    { href: '/admin/dashboard',            label: '📊 Dashboard',  active: pathname === '/admin/dashboard' },
    { href: '/admin/dashboard/companies',  label: '🏢 Companies',  active: pathname.startsWith('/admin/dashboard/companies') },
    { href: '/admin/dashboard/audit-logs', label: '📋 Audit Logs', active: pathname.startsWith('/admin/dashboard/audit-logs') },
  ];

  return (
    <>
      {/* Top bar — shown only on mobile via CSS */}
      <div style={styles.topBar} className="adminMobileTopBar">
        <img src="/SAASIENT-LOGO.png" alt="SaaSient" style={styles.topBarLogo} />
        <div style={styles.topBarRight}>
          <span style={styles.adminBadge}>Admin</span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={styles.hamburger}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <span style={{ ...styles.line, ...(isOpen ? styles.line1Open : {}) }} />
            <span style={{ ...styles.line, ...(isOpen ? styles.line2Open : {}) }} />
            <span style={{ ...styles.line, ...(isOpen ? styles.line3Open : {}) }} />
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && <div style={styles.overlay} onClick={() => setIsOpen(false)} />}

      {/* Slide-in drawer */}
      <div style={{ ...styles.drawer, ...(isOpen ? styles.drawerOpen : {}) }}>
        <div style={styles.drawerHeader}>
          <img src="/SAASIENT-LOGO.png" alt="SaaSient" style={styles.drawerLogo} />
          <div style={styles.drawerBadge}>Admin Portal</div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ ...styles.navItem, ...(item.active ? styles.navItemActive : {}) }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={styles.footer}>
          <div style={styles.userRow}>
            <div style={styles.avatar}>{(email?.[0] ?? 'A').toUpperCase()}</div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={styles.userEmail}>{email ?? '...'}</div>
              <div style={styles.userRole}>Administrator</div>
            </div>
          </div>
          <button onClick={onSignOut} style={styles.signOut}>Sign out</button>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'rgba(10,12,16,0.95)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    width: '100%',
    boxSizing: 'border-box',
  },
  topBarLogo: { height: 36, width: 'auto', objectFit: 'contain' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: 10 },
  adminBadge: {
    fontSize: 10,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#0099f9',
    background: 'rgba(0,153,249,0.12)',
    border: '1px solid rgba(0,153,249,0.30)',
    padding: '4px 8px',
    borderRadius: 20,
  },
  hamburger: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: 32,
    height: 32,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  line: {
    width: '100%',
    height: 2,
    background: 'rgba(255,255,255,0.9)',
    borderRadius: 2,
    transition: 'all 0.3s ease',
    transformOrigin: 'center',
    display: 'block',
  },
  line1Open: { transform: 'rotate(45deg) translateY(8px)' },
  line2Open: { opacity: 0 },
  line3Open: { transform: 'rotate(-45deg) translateY(-8px)' },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 999,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    left: '-100%',
    width: 280,
    maxWidth: '85vw',
    height: '100vh',
    background: 'rgba(10,12,16,0.98)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    transition: 'left 0.3s ease',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
    gap: 16,
    overflowY: 'auto',
  },
  drawerOpen: { left: 0 },
  drawerHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  drawerLogo: { height: 40, width: 'auto', objectFit: 'contain' },
  drawerBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: 20,
    background: 'rgba(0,153,249,0.15)',
    border: '1px solid rgba(0,153,249,0.35)',
    color: '#0099f9',
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    width: 'fit-content',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  navItem: {
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.22)',
    color: 'rgba(255,255,255,0.85)',
    textDecoration: 'none',
    fontWeight: 750,
    fontSize: 15,
    transition: 'all 0.2s ease',
    display: 'block',
  },
  navItemActive: {
    background: 'rgba(0,153,249,0.16)',
    border: '1px solid rgba(0,153,249,0.35)',
    color: '#fff',
    boxShadow: '0 10px 30px rgba(0,153,249,0.14)',
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 20,
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  userRow: {
    display: 'grid',
    gridTemplateColumns: '36px 1fr',
    gap: 10,
    alignItems: 'center',
    padding: 10,
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 14,
    background: 'rgba(0,0,0,0.22)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(0,153,249,0.15)',
    border: '1px solid rgba(0,153,249,0.25)',
    fontWeight: 900,
    fontSize: 14,
    color: '#fff',
  },
  userEmail: {
    fontSize: 13,
    fontWeight: 750,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#fff',
  },
  userRole: { fontSize: 12, color: 'rgba(255,255,255,0.60)' },
  signOut: {
    height: 40,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.22)',
    color: 'rgba(255,255,255,0.92)',
    fontWeight: 850,
    cursor: 'pointer',
    width: '100%',
    fontSize: 14,
  },
};
