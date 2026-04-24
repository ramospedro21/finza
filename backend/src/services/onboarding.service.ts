import { findSession, upsertSession, deleteSession } from '../repositories/onboarding.repository.ts';
import { findUserByTelegramId, findUserByEmail, createUserFromTelegram } from '../repositories/users.repository.ts';
import { seedCategoriasDefault } from '../repositories/categorias.repository.ts';
import { sendTelegramMessage } from './telegram.service.ts';
import { sendSetupEmail } from './email.service.ts';
import { logger } from '../utils/logger.ts';
import type { TipoRenda } from '../types/index.ts';

const TIPO_RENDA_LABEL: Record<string, string> = {
  fixa: 'Mensal fixa',
  variavel: 'Mensal variável',
  quinzenal: 'Quinzenal',
  semanal: 'Semanal',
  multipla: 'Múltiplas rendas',
};

export async function processarOnboarding(
  telegramId: string,
  texto: string,
): Promise<boolean> {
  // Verifica se já tem conta
  const userExistente = await findUserByTelegramId(telegramId);
  if (userExistente) return false; // não está em onboarding

  // Busca ou inicia sessão
  let session = await findSession(telegramId);

  // Comando /start — inicia ou reinicia onboarding
  if (texto.startsWith('/start') || !session) {
    await upsertSession(telegramId, 'nome', {});
    await sendTelegramMessage(
      telegramId,
      `👋 Bem-vindo ao *Finza*! Vou te ajudar a controlar suas finanças.\n\nPrimeiro, qual é o seu nome?`,
    );
    return true;
  }

  switch (session.step) {
    case 'nome': {
      const nome = texto.trim();
      if (nome.length < 2) {
        await sendTelegramMessage(telegramId, '❌ Nome muito curto. Tente novamente:');
        return true;
      }
      await upsertSession(telegramId, 'tipo_renda', { ...session.data, nome });
      await sendTelegramMessage(
        telegramId,
        `Prazer, *${nome}*! 😊\n\nComo você recebe sua renda?\n\n1️⃣ Mensal fixa\n2️⃣ Mensal variável\n3️⃣ Quinzenal (2x por mês)\n4️⃣ Semanal\n5️⃣ Múltiplas rendas`,
      );
      return true;
    }

    case 'tipo_renda': {
      const opcoes: Record<string, TipoRenda> = {
        '1': 'fixa', '2': 'variavel', '3': 'quinzenal', '4': 'semanal', '5': 'multipla',
      };
      const tipo = opcoes[texto.trim()];
      if (!tipo) {
        await sendTelegramMessage(telegramId, '❌ Opção inválida. Digite 1, 2, 3, 4 ou 5:');
        return true;
      }
      await upsertSession(telegramId, 'valor_renda', { ...session.data, tipo_renda: tipo });
      await sendTelegramMessage(
        telegramId,
        `*${TIPO_RENDA_LABEL[tipo]}* ✅\n\nQual é o valor total da sua renda mensal?\nEx: *3500*`,
      );
      return true;
    }

    case 'valor_renda': {
      const valor = parseFloat(texto.replace(',', '.').replace(/[^0-9.]/g, ''));
      if (isNaN(valor) || valor <= 0) {
        await sendTelegramMessage(telegramId, '❌ Valor inválido. Digite apenas números. Ex: *3500*');
        return true;
      }

      const tipo = session.data.tipo_renda;

      // Quinzenal — pergunta os dois valores separados
      if (tipo === 'quinzenal') {
        await upsertSession(telegramId, 'valor_renda_2', { ...session.data, valor_renda: valor });
        await sendTelegramMessage(
          telegramId,
          `💰 Primeiro recebimento: *R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* ✅\n\nQual o valor do segundo recebimento?\nEx: *1500*`,
        );
        return true;
      }

      await upsertSession(telegramId, 'dia_recebimento', { ...session.data, valor_renda: valor });

      const perguntaDia = tipo === 'multipla'
        ? `💰 R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ✅\n\nEm quais dias do mês você recebe?\nEx: *5 e 20* ou *5, 15, 25*`
        : `💰 R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ✅\n\nEm qual dia do mês você recebe?\nEx: *5*`;

      await sendTelegramMessage(telegramId, perguntaDia);
      return true;
    }

    case 'valor_renda_2': {
      const valor2 = parseFloat(texto.replace(',', '.').replace(/[^0-9.]/g, ''));
      if (isNaN(valor2) || valor2 <= 0) {
        await sendTelegramMessage(telegramId, '❌ Valor inválido. Ex: *1500*');
        return true;
      }
      await upsertSession(telegramId, 'dia_recebimento', { ...session.data, valor_renda_2: valor2 });
      await sendTelegramMessage(
        telegramId,
        `💰 Segundo recebimento: *R$ ${valor2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* ✅\n\nEm quais dias você recebe?\nEx: *5 e 20*`,
      );
      return true;
    }

    case 'dia_recebimento': {
      const tipo = session.data.tipo_renda;

      // Extrai todos os números da mensagem
      const dias = texto.match(/\d+/g)?.map(Number).filter(d => d >= 1 && d <= 31);

      if (!dias || dias.length === 0) {
        await sendTelegramMessage(telegramId, '❌ Dia inválido. Ex: *5* ou *5 e 20*');
        return true;
      }

      // Quinzenal precisa de exatamente 2 dias
      if (tipo === 'quinzenal' && dias.length !== 2) {
        await sendTelegramMessage(telegramId, '❌ Para renda quinzenal informe exatamente 2 dias. Ex: *5 e 20*');
        return true;
      }

      await upsertSession(telegramId, 'email', { ...session.data, dias_recebimento: dias });

      // Monta resumo
      const valor1 = session.data.valor_renda!;
      const valor2 = session.data.valor_renda_2;
      let resumo = '';

      if (tipo === 'quinzenal' && valor2) {
        resumo = `📅 Dia *${dias[0]}*: R$ ${valor1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n📅 Dia *${dias[1]}*: R$ ${valor2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else {
        resumo = dias.map(d => `📅 Dia *${d}*`).join('\n');
      }

      await sendTelegramMessage(
        telegramId,
        `${resumo}\n\n✅ Perfeito! Qual é o seu email para acessar o dashboard?`,
      );
      return true;
    }

    case 'email': {
      const email = texto.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        await sendTelegramMessage(telegramId, '❌ Email inválido. Tente novamente:');
        return true;
      }

      const emailExistente = await findUserByEmail(email);
      if (emailExistente) {
        await sendTelegramMessage(
          telegramId,
          `❌ Este email já está cadastrado. Use outro email ou acesse o dashboard diretamente.`,
        );
        return true;
      }

      const { nome, valor_renda } = session.data;

      // Cria o usuário
      const user = await createUserFromTelegram({
        nome: nome!,
        email,
        telegram_id: telegramId,
        renda_mensal: valor_renda!,
      });

      await seedCategoriasDefault(user.id);
      await deleteSession(telegramId);

      // Envia email de setup
      await sendSetupEmail(email, nome!, user.setup_token!);

      await sendTelegramMessage(
        telegramId,
        `🎉 *Conta criada com sucesso, ${nome}!*\n\n📧 Enviamos um link para *${email}*\nAcesse o link para definir sua senha e entrar no dashboard.\n\n_O link expira em 24 horas._\n\nEnquanto isso, já pode começar a registrar seus gastos aqui! 💰\n\nEx: _"gastei 50 reais no mercado pix"_`,
      );

      logger.info({ userId: user.id }, 'Onboarding concluído');
      return true;
    }

    default:
      return false;
  }
}