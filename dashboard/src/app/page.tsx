'use client';
import { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard.ts';
import { ResumoGeral } from '../components/ResumoGeral.tsx';
import { GraficoCategoria } from '../components/GraficoCategoria.tsx';
import { GraficoForma } from '../components/GraficoForma.tsx';
import { FaturasCartao } from '../components/FaturasCartao.tsx';
import { Projecao } from '../components/Projecao.tsx';
import { HistoricoGastos } from '../components/HistoricoGastos.tsx';

function getMesAtual() {
  return new Date().toISOString().slice(0, 7);
}

export default function Home() {
  const [mes, setMes] = useState(getMesAtual);
  const { resumo, projecao, gastos, loading, error, reload } = useDashboard(mes);

  return (
    <main className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight" style={{ color: 'var(--green)' }}>
            finza
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            controle financeiro pessoal
          </p>
        </div>

        {/* Seletor de mês */}
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="rounded-lg px-4 py-2 text-sm font-mono outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      </div>

      {/* Estados */}
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
          {/* Linha 1: Resumo geral */}
          <ResumoGeral resumo={resumo} />

          {/* Linha 2: Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GraficoCategoria dados={resumo.por_categoria ?? []} />
            <GraficoForma dados={resumo.por_forma ?? []} />
          </div>

          {/* Linha 3: Faturas + Projeção */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FaturasCartao faturas={resumo.faturas ?? []} />
            {projecao && <Projecao projecao={projecao} />}
          </div>

          {/* Linha 4: Histórico */}
          <HistoricoGastos gastos={gastos} onDelete={reload} />
        </div>
      )}
    </main>
  );
}