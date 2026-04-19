import { Card, CardTitle } from './ui/Card.tsx';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function Projecao({ projecao }: { projecao: any }) {
  const azul = projecao.fechara_no_azul;

  return (
    <Card>
      <CardTitle>Projeção do Mês</CardTitle>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{azul ? '📈' : '📉'}</span>
        <div>
          <p className="text-sm font-medium" style={{ color: azul ? '#4ade80' : '#f87171' }}>
            {azul ? 'Você vai fechar no azul!' : 'Risco de fechar no vermelho'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Baseado na média dos últimos {projecao.dias_passados} dias
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Gasto até hoje', value: brl(projecao.total_ate_hoje) },
          { label: 'Média diária', value: brl(projecao.media_diaria) },
          { label: 'Projeção total', value: brl(projecao.projecao_mes) },
          { label: 'Saldo projetado', value: brl(projecao.saldo_projetado), highlight: true, positive: azul },
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
            <p
              className="text-lg font-display font-semibold"
              style={item.highlight ? { color: item.positive ? '#4ade80' : '#f87171' } : undefined}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}