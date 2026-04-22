import { config } from '../config.ts';
import { logger } from '../utils/logger.ts';

const BASE_URL = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error({ status: response.status, body }, 'Erro ao enviar mensagem Telegram');
    }
  } catch (err) {
    logger.error({ err }, 'Falha na chamada à Telegram API');
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
      return `🚨 *Atenção!* Você já gastou ${params.percentual}% da sua renda este mês (${params.totalGasto?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de ${params.renda?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}). Tome cuidado!`;
    case 'limite_cartao':
      return `⚠️ O cartão *${params.cartaoNome}* está em *${params.percentual}%* do limite. Fique atento!`;
    case 'categoria':
      return `🔴 Você ultrapassou o limite da categoria *${params.categoria}* este mês!`;
    default:
      return '';
  }
}
export async function sendTelegramMessageGetId(chatId: string, text: string): Promise<number | null> {
  try {
    const response = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json() as any;
    return data?.result?.message_id ?? null;
  } catch (err) {
    logger.error({ err }, 'Falha ao enviar mensagem Telegram');
    return null;
  }
}

export async function editTelegramMessage(chatId: string, messageId: number, text: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    logger.error({ err }, 'Falha ao editar mensagem Telegram');
  }
}