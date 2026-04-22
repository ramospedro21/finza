'use client';
import { useState } from 'react';
import { Card, CardTitle } from './ui/Card';
import { deleteGasto } from '../lib/api';

const FORMA_LABEL: Record<string, string> = {
  cartao_credito: '💳 Crédito',
  cartao_debito:  '💳 Débito',
  pix:            '⚡ PIX',
  boleto:         '📄 Boleto',
  dinheiro:       '💵 Dinheiro',
  outro:          '💸 Outro',
};

function brl(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function HistoricoGastos({ gastos, onDelete }: { gastos: any[]; onDelete: () => void }) {
  const [busca, setBusca] = useState('');
  const [filtroForma, setFiltroForma] = useState('');

  const filtrados = gastos.filter((g) => {
    const matchBusca = g.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchForma = filtroForma ? g.forma_pagamento === filtroForma : true;
    return matchBusca && matchForma;
  });

  async function handleDelete(id: string) {
    if (!confirm('Remover este gasto?')) return;
    await deleteGasto(id);
    onDelete();
  }

  return (
    <Card>
      <CardTitle>Histórico de Gastos</CardTitle>

      {/* Filtros */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row">
        <input
          type="text"
          placeholder="Buscar..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <select
          value={filtroForma}
          onChange={(e) => setFiltroForma(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="">Todas as formas</option>
          {Object.entries(FORMA_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Tabela — scroll horizontal no mobile */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr style={{ color: 'var(--text-muted)' }}>
              {['Data', 'Descrição', 'Categoria', 'Forma', 'Valor', ''].map((h) => (
                <th key={h} className="text-left pb-3 font-mono text-xs uppercase tracking-wider pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((g) => (
              <tr
                key={g.id}
                className="border-t transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--border)' }}
              >
                <td className="py-3 pr-4 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(g.data).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 pr-4">{g.descricao}</td>
                <td className="py-3 pr-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {g.categoria_nome ?? '—'}
                </td>
                <td className="py-3 pr-4 text-xs">{FORMA_LABEL[g.forma_pagamento] ?? g.forma_pagamento}</td>
                <td className="py-3 pr-4 font-mono font-medium" style={{ color: 'var(--green)' }}>
                  {brl(g.valor)}
                </td>
                <td className="py-3">
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-xs px-2 py-1 rounded opacity-40 hover:opacity-100 transition-opacity"
                    style={{ color: '#f87171' }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhum gasto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}