'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // If already logged in, go straight to dashboard
    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) router.replace('/dashboard');
        })();
    }, [router]);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        setLoading(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        router.replace('/dashboard');
    }

    return (
        <main style={styles.page}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.title}>SaaSient Dashboard</h1>
                    <p style={styles.subtitle}>Sign in to continue</p>
                </div>

                <form onSubmit={onSubmit} style={styles.form}>
                    <label style={styles.label}>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            autoComplete="email"
                            required
                            style={styles.input}
                        />
                    </label>

                    <label style={styles.label}>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                            style={styles.input}
                        />
                    </label>

                    {message && <p style={styles.error}>{message}</p>}

                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <p style={styles.footerNote}>
                    If you don’t have a user yet, create one in Supabase → Authentication → Users.
                </p>
            </div>
        </main>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#0b0b0b',
        color: '#fff',
        fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    },
    card: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 16,
        padding: 20,
        background: '#111',
        border: '1px solid #222',
    },
    header: { marginBottom: 16 },
    title: { margin: 0, fontSize: 22, fontWeight: 700 },
    subtitle: { margin: '6px 0 0 0', color: '#bdbdbd', fontSize: 14 },
    form: { display: 'grid', gap: 12, marginTop: 14 },
    label: { display: 'grid', gap: 6, fontSize: 13, color: '#d8d8d8' },
    input: {
        height: 42,
        borderRadius: 10,
        border: '1px solid #2a2a2a',
        background: '#0c0c0c',
        color: '#fff',
        padding: '0 12px',
        outline: 'none',
    },
    button: {
        height: 44,
        borderRadius: 10,
        border: '1px solid #2a2a2a',
        background: '#fff',
        color: '#000',
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: 6,
    },
    error: {
        margin: 0,
        color: '#ff6b6b',
        fontSize: 13,
        lineHeight: 1.4,
    },
    footerNote: {
        marginTop: 14,
        color: '#9e9e9e',
        fontSize: 12,
        lineHeight: 1.4,
    },
};