import { Card, CardTitle } from './ui/Card.tsx';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function FaturasCartao({ faturas }: { faturas: any[] }) {
  return (
    <Card>
      <CardTitle>Faturas dos Cartões</CardTitle>
      {faturas.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum cartão cadastrado.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {faturas.map((f) => {
            const pct = Number(f.percentual_limite);
            const color = pct >= 90 ? '#f87171' : pct >= 70 ? '#facc15' : '#4ade80';
            return (
              <div key={f.cartao_id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">💳 {f.cartao}</span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    vence dia {f.vencimento_fatura}
                  </span>
                </div>
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  <span>{brl(f.fatura_atual)}</span>
                  <span>{pct}% de {brl(f.limite)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(pct, 100)}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}