import { useState, CSSProperties } from 'react';
import { CompanyStatusBadge } from './CompanyStatusBadge';
import { Select } from './Select';
import { colors } from '../shared/constants';
import type { CompanyWithMetrics } from '@/app/types/admin';

type CompanyDetailPanelProps = {
  company: CompanyWithMetrics;
  onClose: () => void;
  onUpdate: () => void;
  inline?: boolean; // when true, renders inline (no overlay) for mobile
};

export function CompanyDetailPanel({ company, onClose, onUpdate, inline = false }: CompanyDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: company.name,
    slug: company.slug,
    plan: company.plan,
    max_leads: company.max_leads,
    status: company.status || 'active',
  });

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update company');
      }

      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: 'active' | 'suspended') {
    if (!confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} ${company.name}?`)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      setFormData({ ...formData, status: newStatus });
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const showCapacityWarning = formData.max_leads < company.current_leads;

  return (
    <div style={inline ? styles.inlineWrapper : styles.overlay} onClick={inline ? undefined : onClose}>
      <div style={inline ? styles.inlineContent : styles.content} onClick={(e) => e.stopPropagation()}>
        {/* Header — hidden in inline mode, back button handled by parent */}
        {!inline && (
          <div style={styles.header}>
            <div>
              <div style={styles.title}>{company.name}</div>
              <div style={styles.subtitle}>{company.slug}</div>
            </div>
            <button style={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div style={styles.body}>
          {error && (
            <div style={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Status Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Status</div>
            <div style={styles.statusRow}>
              <CompanyStatusBadge 
                status={formData.status} 
                capacityPercent={company.capacity_percent} 
              />
              {!isEditing && (
                <div style={styles.statusButtons}>
                  {formData.status === 'active' ? (
                    <button 
                      style={styles.dangerButton} 
                      onClick={() => handleStatusChange('suspended')}
                      disabled={saving}
                    >
                      🚫 Suspend Company
                    </button>
                  ) : (
                    <button 
                      style={styles.successButton} 
                      onClick={() => handleStatusChange('active')}
                      disabled={saving}
                    >
                      ✅ Activate Company
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Company Details</div>
            
            {isEditing ? (
              <div style={styles.form}>
                <div style={styles.formField}>
                  <label style={styles.label}>Company Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.label}>Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formField}>
                  <Select
                    label="Plan"
                    value={formData.plan}
                    onChange={(value) => setFormData({ ...formData, plan: value })}
                    options={[
                      { value: 'starter', label: 'Starter' },
                      { value: 'pro', label: 'Pro' },
                      { value: 'enterprise', label: 'Enterprise' },
                    ]}
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.label}>Max Leads</label>
                  <input
                    type="number"
                    value={formData.max_leads}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                      setFormData({ ...formData, max_leads: value });
                    }}
                    style={styles.input}
                    min={1}
                  />
                  {showCapacityWarning && (
                    <div style={styles.warning}>
                      ⚠️ Warning: Max leads ({formData.max_leads}) is less than current leads ({company.current_leads})
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={styles.grid}>
                <div style={styles.field}>
                  <div style={styles.label}>Plan</div>
                  <div style={styles.value}>{formData.plan}</div>
                </div>
                <div style={styles.field}>
                  <div style={styles.label}>Max Leads</div>
                  <div style={styles.value}>{formData.max_leads}</div>
                </div>
                <div style={styles.field}>
                  <div style={styles.label}>Current Leads</div>
                  <div style={styles.value}>{company.current_leads}</div>
                </div>
                <div style={styles.field}>
                  <div style={styles.label}>Capacity</div>
                  <div style={styles.value}>{company.capacity_percent.toFixed(1)}%</div>
                </div>
                <div style={styles.field}>
                  <div style={styles.label}>Created</div>
                  <div style={styles.value}>
                    {new Date(company.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          {isEditing ? (
            <>
              <button 
                style={styles.secondaryButton} 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: company.name,
                    slug: company.slug,
                    plan: company.plan,
                    max_leads: company.max_leads,
                    status: company.status || 'active',
                  });
                  setError(null);
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                style={styles.primaryButton} 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button style={styles.secondaryButton} onClick={onClose}>
                Close
              </button>
              <button style={styles.primaryButton} onClick={() => setIsEditing(true)}>
                ✏️ Edit Company
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  content: {
    background: 'rgba(12,18,32,0.95)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    maxWidth: 800,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 40px 140px rgba(0,0,0,0.75)',
  },
  inlineWrapper: {
    width: '100%',
  },
  inlineContent: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    overflow: 'visible',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 22,
    fontWeight: 900,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  closeButton: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10,
    color: colors.text.secondary,
    fontSize: 20,
    cursor: 'pointer',
    padding: 0,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  body: {
    padding: 24,
  },
  error: {
    padding: 12,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 12,
    color: '#fca5a5',
    fontSize: 14,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusButtons: {
    display: 'flex',
    gap: 10,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
  field: {
    padding: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.text.tertiary,
    marginBottom: 6,
    display: 'block',
  },
  value: {
    fontSize: 15,
    fontWeight: 900,
    color: colors.text.primary,
  },
  form: {
    display: 'grid',
    gap: 16,
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  input: {
    height: 46,
    width: '100%',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.22)',
    color: colors.text.primary,
    padding: '0 14px',
    outline: 'none',
    fontSize: 15,
    fontWeight: 700,
  },
  warning: {
    padding: 10,
    background: 'rgba(251,146,60,0.1)',
    border: '1px solid rgba(251,146,60,0.3)',
    borderRadius: 10,
    color: '#fdba74',
    fontSize: 13,
    fontWeight: 600,
  },
  footer: {
    padding: 24,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
  },
  primaryButton: {
    padding: '12px 24px',
    background: 'rgba(0,153,249,0.15)',
    border: '1px solid rgba(0,153,249,0.35)',
    borderRadius: 12,
    color: '#0099f9',
    fontSize: 14,
    fontWeight: 850,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  secondaryButton: {
    padding: '12px 24px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 750,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dangerButton: {
    padding: '10px 18px',
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.30)',
    borderRadius: 10,
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: 750,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  successButton: {
    padding: '10px 18px',
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.30)',
    borderRadius: 10,
    color: '#86efac',
    fontSize: 13,
    fontWeight: 750,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
