'use client';
import { useState } from 'react';
import { login, register } from '../../lib/api';
import { setToken } from '../../lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nome: '', email: '', password: '', renda_mensal: 3000 });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const data = mode === 'login'
        ? await login(form.email, form.password)
        : await register({ nome: form.nome, email: form.email, password: form.password, renda_mensal: Number(form.renda_mensal) });

      setToken(data.token, data.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-display font-extrabold tracking-tight" style={{ color: 'var(--green)' }}>
            finza
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            controle financeiro pessoal
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden mb-8" style={{ background: 'var(--surface-2)' }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 text-sm font-medium transition-all"
                style={{
                  background: mode === m ? 'var(--green)' : 'transparent',
                  color: mode === m ? '#0a0f0d' : 'var(--text-muted)',
                }}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {/* Campos */}
          <div className="flex flex-col gap-4">
            {mode === 'register' && (
              <input
                name="nome"
                placeholder="Seu nome"
                value={form.nome}
                onChange={handleChange}
                className="rounded-lg px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            )}

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
              className="rounded-lg px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />

            {mode === 'register' && (
              <input
                name="renda_mensal"
                type="number"
                placeholder="Renda mensal (R$)"
                value={form.renda_mensal}
                onChange={handleChange}
                className="rounded-lg px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            )}

            {error && (
              <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-2 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: loading ? 'var(--border)' : 'var(--green)',
                color: '#0a0f0d',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}