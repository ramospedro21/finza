'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser, clearToken } from '../../lib/auth';
import { useDashboard } from '../../hooks/useDashboard';
import { ResumoGeral } from '../../components/ResumoGeral';
import { GraficoCategoria } from '../../components/GraficoCategoria';
import { GraficoForma } from '../../components/GraficoForma';
import { FaturasCartao } from '../../components/FaturasCartao';
import { Projecao } from '../../components/Projecao';
import { HistoricoGastos } from '../../components/HistoricoGastos';

function getMesAtual() {
  return new Date().toISOString().slice(0, 7);
}

export default function Home() {
  const router = useRouter();
  const [mes, setMes] = useState(getMesAtual);
  const [user, setUser] = useState<any>(null);
  const { resumo, projecao, gastos, loading, error, reload } = useDashboard(mes);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  if (!user) return null;

  return (
    <main className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex flex-col gap-3 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight" style={{ color: 'var(--green)' }}>
            finza
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            olá, {user.nome} 👋
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="flex-1 rounded-lg px-4 py-2 text-sm font-mono outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-2 rounded-lg transition-opacity opacity-60 hover:opacity-100 whitespace-nowrap"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Sair
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <p className="font-mono text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>
            carregando dados...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: '#f871711a', border: '1px solid #f8717140', color: '#f87171' }}>
          {error}
        </div>
      )}

      {!loading && resumo && (
        <div className="flex flex-col gap-6">
          <ResumoGeral resumo={resumo} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GraficoCategoria dados={resumo.por_categoria ?? []} />
            <GraficoForma dados={resumo.por_forma ?? []} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FaturasCartao faturas={resumo.faturas ?? []} />
            {projecao && <Projecao projecao={projecao} />}
          </div>
          <HistoricoGastos gastos={gastos} onDelete={reload} />
        </div>
      )}
    </main>
  );
}