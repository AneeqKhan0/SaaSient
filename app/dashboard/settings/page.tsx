'use client';

import { useEffect, useState, CSSProperties } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/app/components/shared/Button';
import { Input } from '@/app/components/shared/Input';
import { PasswordInput } from '@/app/components/auth/PasswordInput';
import { colors, borderRadius, spacing } from '@/app/components/shared/constants';

type User = {
  id: string;
  email: string;
  created_at: string;
};

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  // Add user form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  // Update password state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      // Fetch users
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Load users error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newUserEmail || !newUserPassword) {
      setError('Email and password are required');
      return;
    }

    // Check user limit
    if (users.length >= 3) {
      setError('Maximum 3 users allowed');
      return;
    }

    try {
      setAddingUser(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user');
      }

      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setShowAddUser(false);

      // Reload users
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) {
      return;
    }

    try {
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove user');
      }

      // Reload users
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdatePassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setUpdatingPassword(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId, password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      // Reset form
      setEditingUserId(null);
      setNewPassword('');
      alert('Password updated successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div style={styles.shell}>
      <div style={styles.scrollContainer}>
        <div style={styles.container}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Settings</h1>
              <p style={styles.subtitle}>Manage your team (max 3 users)</p>
            </div>
          </div>

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          {/* Team Management Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>👥 Team Members ({users.length}/3)</h2>
              {users.length < 3 && (
                <Button
                  variant="primary"
                  onClick={() => setShowAddUser(!showAddUser)}
                >
                  {showAddUser ? 'Cancel' : '+ Add User'}
                </Button>
              )}
            </div>

            {/* Add User Form */}
            {showAddUser && (
              <form onSubmit={handleAddUser} style={styles.addUserForm}>
                <div style={styles.formGrid}>
                  <Input
                    id="email"
                    type="email"
                    label="Email Address"
                    value={newUserEmail}
                    onChange={setNewUserEmail}
                    placeholder="user@example.com"
                    required
                  />
                  <PasswordInput
                    id="password"
                    label="Password"
                    value={newUserPassword}
                    onChange={setNewUserPassword}
                    show={showPassword}
                    onToggleShow={() => setShowPassword(!showPassword)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={addingUser}
                >
                  {addingUser ? 'Adding...' : 'Add User'}
                </Button>
              </form>
            )}

            {/* Users Table */}
            {loading ? (
              <div style={styles.loading}>Loading team members...</div>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.tableHeader}>Email</th>
                      <th style={styles.tableHeader}>Added</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <>
                        <tr key={user.id} style={styles.tableRow}>
                          <td style={styles.tableCell}>{user.email}</td>
                          <td style={styles.tableCell}>
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td style={styles.tableCell}>
                            <div style={styles.actionButtons}>
                              <button
                                onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                                style={styles.updateButton}
                              >
                                {editingUserId === user.id ? 'Cancel' : 'Update Password'}
                              </button>
                              <button
                                onClick={() => handleRemoveUser(user.id)}
                                style={styles.removeButton}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                        {editingUserId === user.id && (
                          <tr key={`${user.id}-password`} style={styles.passwordRow}>
                            <td colSpan={3} style={styles.passwordCell}>
                              <div style={styles.passwordForm}>
                                <PasswordInput
                                  id={`password-${user.id}`}
                                  label="New Password"
                                  value={newPassword}
                                  onChange={setNewPassword}
                                  show={showNewPassword}
                                  onToggleShow={() => setShowNewPassword(!showNewPassword)}
                                />
                                <Button
                                  variant="primary"
                                  onClick={() => handleUpdatePassword(user.id)}
                                  disabled={updatingPassword}
                                >
                                  {updatingPassword ? 'Updating...' : 'Save Password'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
    overflow: 'auto',
    padding: spacing.md,
    paddingBottom: spacing.xl,
    minHeight: 0,
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 950,
    color: colors.text.primary,
    margin: 0,
    letterSpacing: -0.4,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: 600,
    color: colors.text.secondary,
    margin: 0,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: colors.text.primary,
    margin: 0,
    letterSpacing: -0.2,
  },
  addUserForm: {
    background: colors.card.background,
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  tableContainer: {
    background: colors.card.background,
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    background: 'rgba(0,0,0,0.3)',
    borderBottom: `1px solid ${colors.card.border}`,
  },
  tableHeader: {
    padding: spacing.md,
    textAlign: 'left',
    fontSize: 13,
    fontWeight: 700,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    borderBottom: `1px solid ${colors.card.border}`,
  },
  tableCell: {
    padding: spacing.md,
    fontSize: 14,
    fontWeight: 600,
    color: colors.text.primary,
  },
  actionButtons: {
    display: 'flex',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  updateButton: {
    background: 'rgba(0,153,249,0.15)',
    border: '1px solid rgba(0,153,249,0.3)',
    borderRadius: borderRadius.sm,
    padding: '6px 12px',
    color: colors.accent,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  removeButton: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: borderRadius.sm,
    padding: '6px 12px',
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  passwordRow: {
    background: 'rgba(0,153,249,0.05)',
    borderBottom: `1px solid ${colors.card.border}`,
  },
  passwordCell: {
    padding: spacing.md,
  },
  passwordForm: {
    display: 'flex',
    gap: spacing.md,
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  loading: {
    textAlign: 'center',
    padding: spacing.xl,
    fontSize: 15,
    fontWeight: 600,
    color: colors.text.secondary,
  },
  error: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: spacing.md,
  },
};
