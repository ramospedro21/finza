import { extrairGasto } from './ai.service.ts';
import { sendWhatsAppMessage, formatarRespostaGasto } from './whatsapp.service.ts';
import { verificarAlertas } from './alertas.service.ts';
import { findUserByWhatsappId, createUser } from '../repositories/users.repository.ts';
import { findCartaoByNome, createCartao, getFaturasMesAtual } from '../repositories/cartoes.repository.ts';
import { findCategoriaByNome, createCategoria, seedCategoriasDefault } from '../repositories/categorias.repository.ts';
import { createGasto, getTotalMes, getTotalSemana } from '../repositories/gastos.repository.ts';
import { config } from '../config.ts';
import { logger } from '../utils/logger.ts';
import type { FormaPagamento } from '../types/index.ts';

// Payload do webhook da Evolution API
export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
    };
    pushName?: string;
  };
}

export async function processarWebhook(payload: EvolutionWebhookPayload): Promise<void> {
  const { event, data } = payload;

  // Só processa mensagens recebidas (não enviadas pelo bot)
  if (event !== 'messages.upsert' || data.key.fromMe) return;

  const remoteJid = data.key.remoteJid;

  // Só processa mensagens do grupo configurado
  if (remoteJid !== config.WHATSAPP_GROUP_ID) return;

  const texto =
    data.message?.conversation ??
    data.message?.extendedTextMessage?.text;

  if (!texto?.trim()) return;

  const remetenteId = data.key.id; // fallback — idealmente usar participant
  const nomeRemetente = data.pushName ?? 'Usuário';

  logger.info({ texto, remetenteId }, 'Mensagem recebida no grupo');

  // Busca ou cria usuário
  let user = await findUserByWhatsappId(remetenteId);
  if (!user) {
    user = await createUser({
      nome: nomeRemetente,
      whatsapp_id: remetenteId,
      renda_mensal: 3000,
    });
    await seedCategoriasDefault(user.id);
    logger.info({ userId: user.id }, 'Novo usuário criado');
  }

  // Extrai intenção com IA
  const extracao = await extrairGasto(texto);
  logger.debug({ extracao }, 'Intenção extraída');

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
          await sendWhatsAppMessage(
            config.WHATSAPP_GROUP_ID,
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
        if (fatura) {
          faturaAtual = fatura.fatura_atual;
        }
      }

      // Responde no grupo
      await sendWhatsAppMessage(
        config.WHATSAPP_GROUP_ID,
        formatarRespostaGasto({
          valor,
          categoria: categoria_sugerida,
          formaPagamento: forma_pagamento,
          cartaoNome,
          faturaAtual,
          limite: limiteCartao,
        }),
      );

      // Verifica alertas
      await verificarAlertas(user, config.WHATSAPP_GROUP_ID);
      break;
    }

    case 'cadastro_cartao': {
      if (!extracao.cadastro_cartao) return;
      const { nome, limite, vencimento_fatura } = extracao.cadastro_cartao;

      const cartao = await createCartao({ user_id: user.id, nome, limite, vencimento_fatura });
      const limiteStr = limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      await sendWhatsAppMessage(
        config.WHATSAPP_GROUP_ID,
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
          await sendWhatsAppMessage(config.WHATSAPP_GROUP_ID, `📊 Você gastou *${totalStr}* essa semana.`);
          break;
        }
        case 'resumo_mes': {
          const { total, qtd } = await getTotalMes(user.id, mes);
          const totalStr = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const rendaStr = user.renda_mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const pct = Math.round((total / user.renda_mensal) * 100);
          const saldo = user.renda_mensal - total;
          const saldoStr = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          await sendWhatsAppMessage(
            config.WHATSAPP_GROUP_ID,
            `📊 *Resumo do mês:*\n💸 Gasto: *${totalStr}* (${qtd} lançamentos)\n📈 ${pct}% da renda (${rendaStr})\n💰 Saldo estimado: *${saldoStr}*`,
          );
          break;
        }
        case 'fatura_cartao': {
          const faturas = await getFaturasMesAtual(user.id);
          if (faturas.length === 0) {
            await sendWhatsAppMessage(config.WHATSAPP_GROUP_ID, `Nenhum cartão cadastrado ainda.`);
            break;
          }
          const linhas = faturas.map((f) => {
            const faturaStr = f.fatura_atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const limiteStr = f.limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return `💳 *${f.cartao}*: ${faturaStr} / ${limiteStr} (${f.percentual_limite}%) — vence dia ${f.vencimento_fatura}`;
          });
          await sendWhatsAppMessage(config.WHATSAPP_GROUP_ID, `📋 *Faturas do mês:*\n${linhas.join('\n')}`);
          break;
        }
      }
      break;
    }

    default:
      logger.debug({ texto }, 'Mensagem não reconhecida, ignorando');
  }
}