'use client';
import { useState } from 'react';
import { login } from '../../lib/api';
import { setToken } from '../../lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'finza_dev_bot';

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const data = await login(form.email, form.password);
      setToken(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <button onClick={() => router.push('/landing')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <h1 className="text-5xl font-display font-extrabold tracking-tight" style={{ color: 'var(--green)' }}>
              finza
            </h1>
          </button>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            controle financeiro pessoal
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex flex-col gap-4">
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="rounded-lg px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <input
              name="password"
              type="password"
              placeholder="Senha"
              value={form.password}
              onChange={handleChange}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="rounded-lg px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />

            {error && (
              <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: loading ? 'var(--border)' : 'var(--green)',
                color: '#0a0f0d',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            {/* Divisor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>ou</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Botão Telegram */}
            
            <a  href={`https://t.me/${BOT_USERNAME}?start=begin`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                border: '1px solid rgba(74,222,128,0.3)',
                background: 'rgba(74,222,128,0.05)',
                color: 'var(--green)',
                textDecoration: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617 5.32 12.69c-.656-.204-.669-.656.136-.975l10.37-3.997c.546-.196 1.023.131.868.973l-.8-.47z"/>
              </svg>
              Criar conta pelo Telegram
            </a>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Não tem conta?{' '}
          <a href={`https://t.me/${BOT_USERNAME}?start=begin`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)' }}>
            Crie pelo Telegram
          </a>
        </p>
      </div>
    </main>
  );
}