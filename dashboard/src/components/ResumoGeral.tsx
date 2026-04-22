import { Card, CardTitle } from './ui/Card';
import { StatusBadge } from './ui/StatusBadge';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ResumoGeral({ resumo }: { resumo: any }) {
  const pct = resumo.percentual_renda ?? 0;
  const barColor = pct >= 90 ? '#f87171' : pct >= 70 ? '#facc15' : '#4ade80';

  return (
    <Card>
      <div className="flex items-start justify-between mb-6">
        <CardTitle>Visão Geral — {resumo.mes}</CardTitle>
        <StatusBadge status={resumo.status} />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Gasto total</p>
          <p className="text-3xl font-display font-bold" style={{ color: 'var(--green)' }}>
            {brl(resumo.total_gasto)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {resumo.qtd_gastos} lançamentos
          </p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Renda mensal</p>
          <p className="text-3xl font-display font-bold">{brl(resumo.renda_mensal)}</p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Saldo estimado</p>
          <p
            className="text-3xl font-display font-bold"
            style={{ color: resumo.saldo_estimado >= 0 ? 'var(--green)' : '#f87171' }}
          >
            {brl(resumo.saldo_estimado)}
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div>
        <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          <span>Consumo da renda</span>
          <span className="font-mono">{pct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
          />
        </div>
      </div>
    </Card>
  );
}