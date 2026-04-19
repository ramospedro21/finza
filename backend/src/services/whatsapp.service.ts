import { config } from '../config.ts';
import { logger } from '../utils/logger.ts';

const BASE_URL = `${config.EVOLUTION_API_URL}/message/sendText/${config.EVOLUTION_INSTANCE}`;

export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: to,
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error({ status: response.status, body }, 'Erro ao enviar mensagem WhatsApp');
    }
  } catch (err) {
    logger.error({ err }, 'Falha na chamada à Evolution API');
  }
}

export function formatarRespostaGasto(params: {
  valor: number;
  categoria: string;
  formaPagamento: string;
  cartaoNome?: string | null;
  faturaAtual?: number;
  limite?: number;
}): string {
  const { valor, categoria, formaPagamento, cartaoNome, faturaAtual, limite } = params;
  const valorStr = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  let msg = `✅ Gasto de *${valorStr}* em *${categoria}* registrado!`;

  if (cartaoNome && faturaAtual !== undefined && limite !== undefined) {
    const faturaStr = faturaAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const limiteStr = limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const pct = Math.round((faturaAtual / limite) * 100);
    msg += `\n💳 Fatura ${cartaoNome}: *${faturaStr}* / ${limiteStr} (${pct}%)`;
  } else if (formaPagamento === 'pix') {
    msg += `\n💸 via PIX`;
  }

  return msg;
}

export function formatarAlerta(tipo: 'gasto_alto' | 'limite_cartao' | 'categoria', params: {
  percentual?: number;
  cartaoNome?: string;
  categoria?: string;
  totalGasto?: number;
  renda?: number;
}): string {
  switch (tipo) {
    case 'gasto_alto':
      return `🚨 *Atenção!* Você já gastou ${params.percentual}% da sua renda este mês (${params.totalGasto?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de ${params.renda?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}). Tome cuidado com os próximos gastos!`;
    case 'limite_cartao':
      return `⚠️ O cartão *${params.cartaoNome}* está em *${params.percentual}%* do limite. Fique atento!`;
    case 'categoria':
      return `🔴 Você ultrapassou o limite da categoria *${params.categoria}* este mês!`;
    default:
      return '';
  }
}