'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardTitle } from './ui/Card.tsx';

const LABEL: Record<string, string> = {
  cartao_credito: '💳 Crédito',
  cartao_debito:  '💳 Débito',
  pix:            '⚡ PIX',
  boleto:         '📄 Boleto',
  dinheiro:       '💵 Dinheiro',
  outro:          '💸 Outro',
};
const COLORS: Record<string, string> = {
  cartao_credito: '#818cf8',
  cartao_debito:  '#60a5fa',
  pix:            '#4ade80',
  boleto:         '#facc15',
  dinheiro:       '#34d399',
  outro:          '#94a3b8',
};

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function GraficoForma({ dados }: { dados: any[] }) {
  const data = dados.map((d) => ({
    name: LABEL[d.forma_pagamento] ?? d.forma_pagamento,
    value: Number(d.total),
    forma: d.forma_pagamento,
  }));

  return (
    <Card>
      <CardTitle>Por Forma de Pagamento</CardTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4 }}>
          <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis hide />
          <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={COLORS[d.forma] ?? '#4ade80'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}