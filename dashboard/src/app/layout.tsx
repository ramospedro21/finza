import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Finza — Controle Financeiro',
  description: 'Seu dashboard financeiro pessoal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}