export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${className}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-mono uppercase tracking-widest mb-4"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </p>
  );
}