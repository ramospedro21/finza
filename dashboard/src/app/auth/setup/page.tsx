'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { setToken } from '../../../lib/auth';

function SetupForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      return;
    }
    fetch(`${API}/auth/verify-token?token=${token}`)
      .then(r => setTokenValido(r.ok))
      .catch(() => setTokenValido(false));
  }, [token, API]);

  async function handleSubmit() {
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) throw new Error('Token inválido ou expirado');

      const data = await res.json();
      setToken(data.token, data.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (tokenValido === null) {
    return (
      <p className="font-mono text-sm animate-pulse text-center" style={{ color: 'var(--text-muted)' }}>
        Verificando link...
      </p>
    );
  }

  if (!tokenValido) {
    return (
      <div className="text-center">
        <p className="text-2xl mb-2">😕</p>
        <p className="font-medium mb-1">Link inválido ou expirado</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Inicie o onboarding novamente pelo Telegram enviando /start
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-medium mb-1">Defina sua senha</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Use para acessar o dashboard
        </p>
      </div>

      <input
        type="password"
        placeholder="Senha (mín. 6 caracteres)"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="rounded-lg px-4 py-3 text-sm outline-none"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />

      <input
        type="password"
        placeholder="Confirme a senha"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        className="rounded-lg px-4 py-3 text-sm outline-none"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />

      {error && (
        <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
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
        {loading ? 'Salvando...' : 'Definir senha e entrar'}
      </button>
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-display font-extrabold tracking-tight" style={{ color: 'var(--green)' }}>
            finza
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            configure sua conta
          </p>
        </div>

        <div className="rounded-2xl border p-8" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Suspense fallback={<p style={{ color: 'var(--text-muted)' }}>Carregando...</p>}>
            <SetupForm />
          </Suspense>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Problemas? Mande /start no bot do Telegram
        </p>
      </div>
    </main>
  );
}