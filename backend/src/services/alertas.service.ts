import { getTotalMes, getGastosPorCategoria } from '../repositories/gastos.repository.ts';
import { getFaturasMesAtual } from '../repositories/cartoes.repository.ts';
import { sendWhatsAppMessage, formatarAlerta } from './whatsapp.service.ts';
import { logger } from '../utils/logger.ts';
import type { User } from '../types/index.ts';

export async function verificarAlertas(user: User, whatsappGroupId: string): Promise<void> {
  const mes = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  try {
    // 1. Alerta de gasto mensal alto
    const { total } = await getTotalMes(user.id, mes);
    const percentualRenda = Math.round((total / user.renda_mensal) * 100);

    if (percentualRenda >= 90) {
      await sendWhatsAppMessage(
        whatsappGroupId,
        formatarAlerta('gasto_alto', {
          percentual: percentualRenda,
          totalGasto: total,
          renda: user.renda_mensal,
        }),
      );
    } else if (percentualRenda >= 70) {
      await sendWhatsAppMessage(
        whatsappGroupId,
        formatarAlerta('gasto_alto', {
          percentual: percentualRenda,
          totalGasto: total,
          renda: user.renda_mensal,
        }),
      );
    }

    // 2. Alertas de fatura de cartão
    const faturas = await getFaturasMesAtual(user.id);
    for (const fatura of faturas) {
      if (fatura.percentual_limite >= 70) {
        await sendWhatsAppMessage(
          whatsappGroupId,
          formatarAlerta('limite_cartao', {
            cartaoNome: fatura.cartao,
            percentual: fatura.percentual_limite,
          }),
        );
      }
    }

    // 3. Alertas de categoria estourada
    const categorias = await getGastosPorCategoria(user.id, mes);
    for (const cat of categorias) {
      if (cat.limite_mensal && cat.total_gasto > cat.limite_mensal) {
        await sendWhatsAppMessage(
          whatsappGroupId,
          formatarAlerta('categoria', { categoria: cat.categoria }),
        );
      }
    }
  } catch (err) {
    logger.error({ err }, 'Erro ao verificar alertas');
  }
}