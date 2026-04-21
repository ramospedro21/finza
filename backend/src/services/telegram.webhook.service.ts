import { extrairGasto } from './ai.service.ts';
import { sendTelegramMessage, formatarRespostaGasto } from './telegram.service.ts';
import { findUserByWhatsappId, createUser } from '../repositories/users.repository.ts';
import { findCartaoByNome, createCartao, getFaturasMesAtual } from '../repositories/cartoes.repository.ts';
import { findCategoriaByNome, createCategoria, seedCategoriasDefault } from '../repositories/categorias.repository.ts';
import { createGasto, getTotalMes, getTotalSemana } from '../repositories/gastos.repository.ts';
import { verificarAlertas } from './alertas.service.ts';
import { config } from '../config.ts';
import { logger } from '../utils/logger.ts';
import type { FormaPagamento } from '../types/index.ts';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
    };
    date: number;
    text?: string;
  };
}

export async function processarMensagemTelegram(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message?.text) return;

  const chatId = String(message.chat.id);
  const texto = message.text.trim();

  // Filtra apenas o grupo configurado
  if (chatId !== config.TELEGRAM_GROUP_ID) {
    logger.debug({ chatId, expected: config.TELEGRAM_GROUP_ID }, 'Mensagem ignorada - chat diferente');
    return;
  }

  // Ignora comandos
  if (texto.startsWith('/')) return;

  const telegramUserId = String(message.from.id);
  const nomeRemetente = message.from.first_name;

  logger.info({ texto, telegramUserId }, 'Mensagem recebida no grupo Telegram');

  // Busca ou cria usuário
  let user = await findUserByWhatsappId(telegramUserId);
  if (!user) {
    user = await createUser({
      nome: nomeRemetente,
      whatsapp_id: telegramUserId,
      renda_mensal: 3000,
    });
    await seedCategoriasDefault(user.id);
    logger.info({ userId: user.id }, 'Novo usuário criado');
  }

  // Extrai intenção com IA
  const extracao = await extrairGasto(texto);

  switch (extracao.intencao) {
    case 'gasto': {
      if (!extracao.gasto) return;
      const { valor, descricao, categoria_sugerida, forma_pagamento, cartao_nome, data: dataGasto } = extracao.gasto;

      // Resolve cartão
      let cartaoId: string | null = null;
      let cartaoNome: string | null = null;
      let faturaAtual: number | undefined;
      let limiteCartao: number | undefined;

      if (cartao_nome && (forma_pagamento === 'cartao_credito' || forma_pagamento === 'cartao_debito')) {
        const cartao = await findCartaoByNome(user.id, cartao_nome);
        if (cartao) {
          cartaoId = cartao.id;
          cartaoNome = cartao.nome;
          limiteCartao = cartao.limite;
        } else {
          await sendTelegramMessage(
            config.TELEGRAM_GROUP_ID,
            `⚠️ Não encontrei o cartão "${cartao_nome}". Cadastre com: _adicionar cartão [nome] limite [valor] vencimento dia [dia]_`,
          );
          return;
        }
      }

      // Resolve categoria
      let categoriaId: string | null = null;
      const categoria = await findCategoriaByNome(user.id, categoria_sugerida);
      if (categoria) {
        categoriaId = categoria.id;
      } else {
        const novaCategoria = await createCategoria({ user_id: user.id, nome: categoria_sugerida });
        categoriaId = novaCategoria.id;
      }

      // Salva gasto
      await createGasto({
        user_id: user.id,
        valor,
        descricao,
        categoria_id: categoriaId,
        forma_pagamento: forma_pagamento as FormaPagamento,
        cartao_id: cartaoId,
        data: dataGasto,
        mensagem_original: texto,
      });

      // Busca fatura atualizada se for cartão
      if (cartaoId) {
        const faturas = await getFaturasMesAtual(user.id);
        const fatura = faturas.find((f) => f.cartao_id === cartaoId);
        if (fatura) faturaAtual = fatura.fatura_atual;
      }

      await sendTelegramMessage(
        config.TELEGRAM_GROUP_ID,
        formatarRespostaGasto({ valor, categoria: categoria_sugerida, formaPagamento: forma_pagamento, cartaoNome, faturaAtual, limite: limiteCartao }),
      );

      await verificarAlertas(user, config.TELEGRAM_GROUP_ID);
      break;
    }

    case 'cadastro_cartao': {
      if (!extracao.cadastro_cartao) return;
      const { nome, limite, vencimento_fatura } = extracao.cadastro_cartao;
      const cartao = await createCartao({ user_id: user.id, nome, limite, vencimento_fatura });
      const limiteStr = limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      await sendTelegramMessage(
        config.TELEGRAM_GROUP_ID,
        `✅ Cartão *${cartao.nome}* cadastrado!\n💳 Limite: *${limiteStr}* | Vencimento: dia *${vencimento_fatura}*`,
      );
      break;
    }

    case 'consulta': {
      if (!extracao.consulta) return;
      const mes = new Date().toISOString().slice(0, 7);

      switch (extracao.consulta.tipo) {
        case 'resumo_semana': {
          const total = await getTotalSemana(user.id);
          const totalStr = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          await sendTelegramMessage(config.TELEGRAM_GROUP_ID, `📊 Você gastou *${totalStr}* essa semana.`);
          break;
        }
        case 'resumo_mes': {
          const { total, qtd } = await getTotalMes(user.id, mes);
          const totalStr = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const rendaStr = user.renda_mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const pct = Math.round((total / user.renda_mensal) * 100);
          const saldo = user.renda_mensal - total;
          const saldoStr = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          await sendTelegramMessage(
            config.TELEGRAM_GROUP_ID,
            `📊 *Resumo do mês:*\n💸 Gasto: *${totalStr}* (${qtd} lançamentos)\n📈 ${pct}% da renda (${rendaStr})\n💰 Saldo estimado: *${saldoStr}*`,
          );
          break;
        }
        case 'fatura_cartao': {
          const faturas = await getFaturasMesAtual(user.id);
          if (faturas.length === 0) {
            await sendTelegramMessage(config.TELEGRAM_GROUP_ID, `Nenhum cartão cadastrado ainda.`);
            break;
          }
          const linhas = faturas.map((f) => {
            const faturaStr = f.fatura_atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const limiteStr = f.limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return `💳 *${f.cartao}*: ${faturaStr} / ${limiteStr} (${f.percentual_limite}%) — vence dia ${f.vencimento_fatura}`;
          });
          await sendTelegramMessage(config.TELEGRAM_GROUP_ID, `📋 *Faturas do mês:*\n${linhas.join('\n')}`);
          break;
        }
      }
      break;
    }

    default:
      logger.debug({ texto }, 'Mensagem não reconhecida, ignorando');
  }
}