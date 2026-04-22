'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Card, CardTitle } from './ui/Card';

const COLORS = ['#4ade80','#34d399','#22d3ee','#818cf8','#f472b6','#fb923c','#facc15','#a78bfa','#60a5fa'];

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function GraficoCategoria({ dados }: { dados: any[] }) {
  const data = dados.map((d) => ({ name: `${d.icone} ${d.categoria}`, value: Number(d.total_gasto), limite: Number(d.limite_mensal ?? 0) }));

  return (
    <Card>
      <CardTitle>Gastos por Categoria</CardTitle>
      <div className="flex gap-6">
        <ResponsiveContainer width="40%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
          </PieChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="60%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={130} />
            <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}