import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.ts';
import { logger } from '../utils/logger.ts';
import type { ExtracaoGasto } from '../types/index.ts';

const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Você é um assistente financeiro pessoal. Analise mensagens em português brasileiro e extraia informações financeiras.

Retorne APENAS um JSON válido, sem texto adicional, markdown ou explicações.

Formas de pagamento válidas: cartao_credito, cartao_debito, pix, boleto, dinheiro, outro

Formato esperado:
{
  "intencao": "gasto" | "cadastro_cartao" | "consulta" | "desconhecido",
  "gasto": {
    "valor": number,
    "descricao": string,
    "categoria_sugerida": string,
    "forma_pagamento": string,
    "cartao_nome": string | null,
    "data": "YYYY-MM-DD"
  },
  "cadastro_cartao": {
    "nome": string,
    "limite": number,
    "vencimento_fatura": number
  },
  "consulta": {
    "tipo": "resumo_semana" | "resumo_mes" | "fatura_cartao" | "saldo",
    "cartao_nome": string | null
  }
}

Regras:
- Se não mencionar data, use a data atual: ${new Date().toISOString().split('T')[0]}
- Se não mencionar forma de pagamento, infira pelo contexto ou use "outro"
- Se mencionar nome de cartão, preencha cartao_nome
- Categorias sugeridas: Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Vestuário, Assinaturas, Outros
- Preencha apenas os campos relevantes para a intenção identificada`;

export async function extrairGasto(mensagem: string): Promise<ExtracaoGasto> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: mensagem }],
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(clean) as ExtracaoGasto;

    logger.debug({ mensagem, parsed }, 'IA extraiu dados da mensagem');
    return parsed;
  } catch (err) {
    logger.error({ err, mensagem }, 'Erro ao extrair dados com IA');
    return { intencao: 'desconhecido' };
  }
}