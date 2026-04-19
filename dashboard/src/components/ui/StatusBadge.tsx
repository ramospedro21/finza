const statusMap = {
  tranquilo: { label: '● Tranquilo', color: '#4ade80' },
  atencao:   { label: '● Atenção',   color: '#facc15' },
  apertado:  { label: '● Apertado',  color: '#f87171' },
};

export function StatusBadge({ status }: { status: 'tranquilo' | 'atencao' | 'apertado' }) {
  const s = statusMap[status];
  return (
    <span
      className="text-xs font-mono px-3 py-1 rounded-full border"
      style={{ color: s.color, borderColor: s.color + '40', background: s.color + '15' }}
    >
      {s.label}
    </span>
  );
}