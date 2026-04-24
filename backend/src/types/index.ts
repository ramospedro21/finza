export type FormaPagamento =
  | 'cartao_credito'
  | 'cartao_debito'
  | 'pix'
  | 'boleto'
  | 'dinheiro'
  | 'outro';

export interface User {
  id: string;
  nome: string;
  whatsapp_id: string;
  email: string | null;
  password_hash: string | null;
  telegram_id: string | null;
  renda_mensal: number;
  created_at: Date;
  updated_at: Date;
}

export interface Cartao {
  id: string;
  user_id: string;
  nome: string;
  limite: number;
  vencimento_fatura: number;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Categoria {
  id: string;
  user_id: string;
  nome: string;
  limite_mensal: number | null;
  icone: string;
  created_at: Date;
}

export interface Gasto {
  id: string;
  user_id: string;
  valor: number;
  descricao: string;
  categoria_id: string | null;
  forma_pagamento: FormaPagamento;
  cartao_id: string | null;
  data: Date;
  mensagem_original: string | null;
  created_at: Date;
  updated_at: Date;
}

// Payload extraído pela IA de uma mensagem do WhatsApp
export interface ExtracaoGasto {
  intencao: 'gasto' | 'cadastro_cartao' | 'consulta' | 'desconhecido';
  gasto?: {
    valor: number;
    descricao: string;
    categoria_sugerida: string;
    forma_pagamento: FormaPagamento;
    cartao_nome?: string;
    data: string; // ISO date string
  };
  cadastro_cartao?: {
    nome: string;
    limite: number;
    vencimento_fatura: number;
  };
  consulta?: {
    tipo: 'resumo_semana' | 'resumo_mes' | 'fatura_cartao' | 'saldo';
    cartao_nome?: string;
  };
}

export type OnboardingStep =
  | 'nome'
  | 'tipo_renda'
  | 'valor_renda'
  | 'dia_recebimento'
  | 'email'
  | 'concluido';

export type TipoRenda = 'fixa' | 'variavel' | 'quinzenal' | 'semanal' | 'multipla';

export interface OnboardingSession {
  id: string;
  telegram_id: string;
  step: OnboardingStep;
  data: {
    nome?: string;
    tipo_renda?: TipoRenda;
    valor_renda?: number;
    dia_recebimento?: number;
    email?: string;
  };
  created_at: Date;
  updated_at: Date;
}

// Atualiza User
export interface User {
  id: string;
  nome: string;
  whatsapp_id: string;
  email: string | null;
  password_hash: string | null;
  telegram_id: string | null;
  setup_token: string | null;
  setup_token_expires_at: Date | null;
  renda_mensal: number;
  created_at: Date;
  updated_at: Date;
}

// Views do banco
export interface GastoPorCategoria {
  user_id: string;
  mes: Date;
  categoria: string;
  icone: string;
  limite_mensal: number | null;
  qtd_gastos: number;
  total_gasto: number;
}

export interface FaturaCartao {
  cartao_id: string;
  user_id: string;
  cartao: string;
  limite: number;
  vencimento_fatura: number;
  fatura_atual: number;
  percentual_limite: number;
}