'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Partículas de fundo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    let raf: number;
    function animate() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas!.width;
        if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74, 222, 128, ${p.alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', handleResize); };
  }, []);

  const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'finza_dev_bot';

  return (
    <main style={{ background: '#0a0f0d', minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Canvas de partículas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Grade decorativa */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Glow central */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none',
      }} />

      {/* Conteúdo */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Nav */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#4ade80', letterSpacing: '-0.5px' }}>
            finza
          </span>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(74,222,128,0.3)',
              background: 'transparent', color: '#4ade80', fontSize: 13, fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(74,222,128,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Entrar
          </button>
        </nav>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '80px 24px 60px' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 100,
            border: '1px solid rgba(74,222,128,0.2)',
            background: 'rgba(74,222,128,0.05)',
            marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#7aab87', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}>
              controle financeiro via Telegram
            </span>
          </div>

          {/* Título */}
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 'clamp(48px, 10vw, 96px)',
            fontWeight: 800, color: '#e8f5ec', lineHeight: 1.0,
            letterSpacing: '-3px', marginBottom: 24,
          }}>
            seu dinheiro,<br />
            <span style={{ color: '#4ade80' }}>sob controle.</span>
          </h1>

          {/* Subtítulo */}
          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)', color: '#7aab87',
            fontFamily: 'DM Sans, sans-serif', maxWidth: 480,
            margin: '0 auto 48px', lineHeight: 1.6,
          }}>
            Registre gastos em linguagem natural pelo Telegram e visualize tudo num dashboard inteligente.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            
            <a href={`https://t.me/${BOT_USERNAME}?start=begin`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 28px', borderRadius: 12,
                background: '#4ade80', color: '#0a0f0d',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 15,
                textDecoration: 'none', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(74,222,128,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617 5.32 12.69c-.656-.204-.669-.656.136-.975l10.37-3.997c.546-.196 1.023.131.868.973l-.8-.47z"/>
              </svg>
              Começar no Telegram
            </a>
            <button
              onClick={() => router.push('/login')}
              style={{
                padding: '14px 28px', borderRadius: 12,
                border: '1px solid rgba(74,222,128,0.2)',
                background: 'rgba(74,222,128,0.05)', color: '#e8f5ec',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: 15,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)'; e.currentTarget.style.background = 'rgba(74,222,128,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(74,222,128,0.2)'; e.currentTarget.style.background = 'rgba(74,222,128,0.05)'; }}
            >
              Acessar dashboard
            </button>
          </div>
        </section>

        {/* Demo do bot */}
        <section style={{ maxWidth: 420, margin: '0 auto 80px', padding: '0 24px' }}>
          <div style={{
            borderRadius: 20, border: '1px solid rgba(74,222,128,0.15)',
            background: 'rgba(17,26,20,0.8)', backdropFilter: 'blur(12px)',
            overflow: 'hidden',
          }}>
            {/* Header do chat */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid rgba(74,222,128,0.1)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(74,222,128,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>🪙</div>
              <div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: '#e8f5ec', fontSize: 14, margin: 0 }}>
                  Finza
                </p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#4ade80', margin: 0 }}>
                  online
                </p>
              </div>
            </div>

            {/* Mensagens */}
            <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { from: 'user', text: 'gastei 85 reais no mercado pix' },
                { from: 'bot', text: '✅ Gasto de R$ 85,00 em Alimentação registrado!\n💸 via PIX' },
                { from: 'user', text: 'comprei um celular 12x de 250 no nubank' },
                { from: 'bot', text: '✅ Parcelamento registrado!\n📱 Celular — 12x de R$ 250,00\n💳 Nubank | Parcela 1/12' },
                { from: 'user', text: 'quanto gastei esse mês?' },
                { from: 'bot', text: '📊 Resumo do mês:\n💸 Gasto: R$ 1.240,00\n📈 41% da renda\n💰 Saldo: R$ 1.760,00' },
              ].map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.from === 'user' ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${msg.from === 'user' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    fontSize: 13, color: '#e8f5ec', fontFamily: 'DM Sans, sans-serif',
                    lineHeight: 1.5, whiteSpace: 'pre-line',
                    animationDelay: `${i * 0.15}s`,
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ maxWidth: 960, margin: '0 auto 100px', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { icon: '💬', title: 'Linguagem natural', desc: 'Registre gastos como fala: "gastei 50 no mercado pix"' },
              { icon: '🤖', title: 'IA integrada', desc: 'Claude entende e categoriza automaticamente cada gasto' },
              { icon: '📊', title: 'Dashboard completo', desc: 'Gráficos, faturas, projeções e histórico em tempo real' },
              { icon: '💳', title: 'Controle de cartões', desc: 'Acompanhe fatura e limite de cada cartão separadamente' },
              { icon: '🎯', title: 'Metas por categoria', desc: 'Defina limites e receba alertas antes de estourar' },
              { icon: '📅', title: 'Parcelamentos', desc: 'Registre uma vez, o bot controla todas as parcelas' },
            ].map((f, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: 16,
                border: '1px solid rgba(74,222,128,0.1)',
                background: 'rgba(17,26,20,0.5)', backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(74,222,128,0.3)'; e.currentTarget.style.background = 'rgba(17,26,20,0.8)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(74,222,128,0.1)'; e.currentTarget.style.background = 'rgba(17,26,20,0.5)'; }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ec', fontSize: 16, marginBottom: 8 }}>
                  {f.title}
                </h3>
                <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#7aab87', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section style={{ textAlign: 'center', padding: '0 24px 100px' }}>
          <div style={{
            maxWidth: 560, margin: '0 auto', padding: '48px 40px',
            borderRadius: 24, border: '1px solid rgba(74,222,128,0.2)',
            background: 'rgba(17,26,20,0.8)', backdropFilter: 'blur(12px)',
          }}>
            <h2 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 800, color: '#e8f5ec', marginBottom: 16, letterSpacing: '-1px',
            }}>
              Comece agora,<br />é gratuito.
            </h2>
            <p style={{ color: '#7aab87', fontFamily: 'DM Sans, sans-serif', marginBottom: 32, fontSize: 15 }}>
              Crie sua conta pelo Telegram em menos de 2 minutos.
            </p>
            
            <a  href={`https://t.me/${BOT_USERNAME}?start=begin`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 32px', borderRadius: 12,
                background: '#4ade80', color: '#0a0f0d',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 16,
                textDecoration: 'none', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(74,222,128,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617 5.32 12.69c-.656-.204-.669-.656.136-.975l10.37-3.997c.546-.196 1.023.131.868.973l-.8-.47z"/>
              </svg>
              Abrir no Telegram
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: 'center', padding: '24px',
          borderTop: '1px solid rgba(74,222,128,0.08)',
        }}>
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#7aab87' }}>
            © 2026 finza — controle financeiro pessoal
          </p>
        </footer>
      </div>
    </main>
  );
}