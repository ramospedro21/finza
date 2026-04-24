import { extrairGasto } from './ai.service.ts';
import { sendTelegramMessage, formatarRespostaGasto, sendTelegramMessageGetId, editTelegramMessage } from './telegram.service.ts';
import { findUserByWhatsappId, createUser, findUserByEmail, linkTelegramToUser, findUserByTelegramId } from '../repositories/users.repository.ts';
import { findCartaoByNome, createCartao, getFaturasMesAtual } from '../repositories/cartoes.repository.ts';
import { findCategoriaByNome, createCategoria, seedCategoriasDefault } from '../repositories/categorias.repository.ts';
import { createGasto, getTotalMes, getTotalSemana } from '../repositories/gastos.repository.ts';
import { verificarAlertas } from './alertas.service.ts';
import { processarOnboarding } from './onboarding.service.ts';
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

  // Apenas conversas privadas
  if (message.chat.type !== 'private') return;

  const chatId = String(message.chat.id);
  const texto = message.text.trim();
  const telegramUserId = chatId; // em privado, chat.id === user.id
  console.log(`Mensagem recebida do Telegram: ${texto} (de ${telegramUserId})`);

  const processingMsgId = await sendTelegramMessageGetId(
    chatId,
    '⏳ _Processando..._'
  );

  // Tenta processar onboarding primeiro
  const emOnboarding = await processarOnboarding(telegramUserId, texto);
  if (emOnboarding) return;

  // Ignora comandos não reconhecidos
  if (texto.startsWith('/')) {
    if (texto.startsWith('/vincular')) {
      const email = texto.split(' ')[1]?.trim();
      if (!email) {
        await sendTelegramMessage(chatId, '❌ Use: /vincular seu@email.com');
        return;
      }

      const userByEmail = await findUserByEmail(email);
      if (!userByEmail) {
        await sendTelegramMessage(chatId, `❌ Email *${email}* não encontrado. Crie sua conta no dashboard primeiro.`);
        return;
      }

      await linkTelegramToUser(userByEmail.id, telegramUserId);
      await sendTelegramMessage(chatId, `✅ Telegram vinculado com sucesso à conta *${userByEmail.nome}*!`);
      return;
    }
    return;
  }

  // Busca usuário já cadastrado
  let user = await findUserByTelegramId(telegramUserId);
  if (!user) {
    await sendTelegramMessage(chatId, '👋 Para começar, mande /start para criar sua conta!');
    return;
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
            chatId,
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

      const resposta = formatarRespostaGasto({
        valor,
        categoria: categoria_sugerida,
        formaPagamento: forma_pagamento,
        cartaoNome,
        faturaAtual,
        limite: limiteCartao,
      });

      // Edita a mensagem de processando com a resposta final
      if (processingMsgId) {
        await editTelegramMessage(chatId, processingMsgId, resposta);
      } else {
        await sendTelegramMessage(chatId, resposta);
      }

      await verificarAlertas(user, chatId);
      break;
    }

    case 'cadastro_cartao': {
      if (!extracao.cadastro_cartao) return;

      const { nome, limite, vencimento_fatura } = extracao.cadastro_cartao;
      const cartao = await createCartao({ user_id: user.id, nome, limite, vencimento_fatura });
      const limiteStr = limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const resposta = `✅ Cartão *${cartao.nome}* cadastrado!\n💳 Limite: *${limiteStr}* | Vencimento: dia *${vencimento_fatura}*`;
      
      if (processingMsgId) {
        await editTelegramMessage(chatId, processingMsgId, resposta);
      } else {
        await sendTelegramMessage(chatId, resposta);
      }

      break;
    }

    case 'consulta': {
      if (!extracao.consulta) return;
      const mes = new Date().toISOString().slice(0, 7);

      switch (extracao.consulta.tipo) {
        case 'resumo_semana': {
          const total = await getTotalSemana(user.id);
          const totalStr = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const resposta = `📊 Você gastou *${totalStr}* essa semana.`

          if (processingMsgId) {
            await editTelegramMessage(chatId, processingMsgId, resposta);
          } else {
            await sendTelegramMessage(chatId, resposta);
          }

          break;
        }
        case 'resumo_mes': {
          const { total, qtd } = await getTotalMes(user.id, mes);
          const totalStr = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const rendaStr = user.renda_mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const pct = Math.round((total / user.renda_mensal) * 100);
          const saldo = user.renda_mensal - total;
          const saldoStr = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const resposta = `📊 *Resumo do mês:*\n💸 Gasto: *${totalStr}* (${qtd} lançamentos)\n📈 ${pct}% da renda (${rendaStr})\n💰 Saldo estimado: *${saldoStr}*`;

          if (processingMsgId) {
            await editTelegramMessage(chatId, processingMsgId, resposta);
          } else {
            await sendTelegramMessage(chatId, resposta);
          }

          break;
        }
        case 'fatura_cartao': {
          const faturas = await getFaturasMesAtual(user.id);
          if (faturas.length === 0) {
            await sendTelegramMessage(chatId, `Nenhum cartão cadastrado ainda.`);
            break;
          }
          const linhas = faturas.map((f) => {
            const faturaStr = f.fatura_atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const limiteStr = f.limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return `💳 *${f.cartao}*: ${faturaStr} / ${limiteStr} (${f.percentual_limite}%) — vence dia ${f.vencimento_fatura}`;
          });

          const resposta = `📋 *Faturas do mês:*\n${linhas.join('\n')}`;

          if (processingMsgId) {
            await editTelegramMessage(chatId, processingMsgId, resposta);
          } else {
            await sendTelegramMessage(chatId, resposta);
          }

          break;
        }
      }
      break;
    }

  default: 
    if (processingMsgId) {
      await editTelegramMessage(chatId, processingMsgId, '🤔 _Não entendi. Tente: "gastei 50 reais no mercado pix"_');
    }
  }
}