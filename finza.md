# Design Spec — WhatsApp Finance Bot + Dashboard

**Data:** 2026-04-19  
**Status:** Aprovado  
**Autor:** Claude (brainstorming colaborativo)

---

## 1. Visão Geral

Sistema pessoal de controle financeiro onde o usuário registra gastos via mensagens em linguagem natural num grupo do WhatsApp. Um bot interpreta as mensagens com IA (Claude API), armazena os dados estruturados e os exibe num dashboard web com visão completa de gastos, faturas, categorias e projeções mensais.

**Renda de referência:** até R$ 3.000/mês  
**Usuário:** desenvolvedor com experiência técnica

---

## 2. Arquitetura

```
WhatsApp
   ↓
Evolution API (webhook)
   ↓
Backend Node.ts + Express
   ├── Claude API (interpretação de linguagem natural)
   ├── PostgreSQL (persistência)
   └── API REST (consumida pelo dashboard)
         ↓
   Dashboard Next.ts + Tailwind + Recharts
```

### Fluxo principal

1. Usuário manda mensagem no grupo WhatsApp
2. Evolution API dispara webhook para o backend
3. Backend envia mensagem para Claude API com prompt de extração
4. Claude retorna JSON estruturado com os dados do gasto
5. Backend valida e persiste no PostgreSQL
6. Dashboard consome API REST e exibe dados em tempo real

---

## 3. Modelo de Dados

### `users`
| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID PK | Identificador |
| nome | VARCHAR | Nome do usuário |
| renda_mensal | DECIMAL | Renda de referência |
| whatsapp_id | VARCHAR | ID do número no WhatsApp |
| created_at | TIMESTAMP | Data de criação |

### `cartoes`
| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID PK | Identificador |
| user_id | UUID FK | Referência ao usuário |
| nome | VARCHAR | Nome do cartão (ex: "Nubank") |
| limite | DECIMAL | Limite total do cartão |
| vencimento_fatura | INTEGER | Dia do mês (1–31) |
| ativo | BOOLEAN | Se o cartão está em uso |
| created_at | TIMESTAMP | Data de criação |

### `categorias`
| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID PK | Identificador |
| user_id | UUID FK | Referência ao usuário |
| nome | VARCHAR | Ex: "Alimentação", "Transporte" |
| limite_mensal | DECIMAL | Limite opcional por categoria |
| icone | VARCHAR | Emoji ou nome de ícone |

### `gastos`
| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID PK | Identificador |
| user_id | UUID FK | Referência ao usuário |
| valor | DECIMAL | Valor do gasto |
| descricao | VARCHAR | Descrição livre |
| categoria_id | UUID FK | Categoria classificada |
| forma_pagamento | ENUM | `cartao_credito`, `cartao_debito`, `pix`, `boleto`, `dinheiro`, `outro` |
| cartao_id | UUID FK (nullable) | Cartão usado (se aplicável) |
| data | DATE | Data do gasto |
| mensagem_original | TEXT | Mensagem bruta do WhatsApp |
| created_at | TIMESTAMP | Data de registro |

---

## 4. Bot WhatsApp

### 4.1 Intenções reconhecidas

| Intenção | Exemplo de mensagem |
|---|---|
| Registrar gasto | "gastei 120 no nubank no restaurante ontem" |
| Registrar gasto simples | "mercado 85.50 pix" |
| Adicionar cartão | "adicionar cartão Nubank limite 2000 vencimento dia 10" |
| Consultar resumo | "quanto gastei essa semana?" |
| Consultar fatura | "qual o total do Nubank esse mês?" |
| Listar cartões | "meus cartões" |

### 4.2 Prompt de extração (Claude API)

O backend envia a mensagem do usuário para Claude com um system prompt que instrui a retornar **exclusivamente JSON** no formato:

```json
{
  "intencao": "gasto | cadastro_cartao | consulta | desconhecido",
  "gasto": {
    "valor": 120.00,
    "descricao": "restaurante",
    "categoria_sugerida": "alimentação",
    "forma_pagamento": "cartao_credito",
    "cartao_nome": "Nubank",
    "data": "2026-04-18"
  }
}
```

### 4.3 Respostas do bot

- **Gasto registrado com sucesso:**  
  > ✅ Gasto de R$ 120,00 em *Alimentação* (Nubank) registrado!  
  > 💳 Fatura Nubank: R$ 340,00 / R$ 2.000,00 (17%)

- **Cartão não encontrado:**  
  > ⚠️ Não encontrei o cartão "Nubank". Seus cartões cadastrados: Inter, C6. Quer cadastrar um novo?

- **Alerta de limite:**  
  > 🚨 Atenção! Você já gastou R$ 2.500,00 este mês (83% da sua renda). Cuidado com os próximos gastos!

---

## 5. API REST (Backend)

### Endpoints principais

```
POST   /webhook                    → recebe eventos do Evolution API
GET    /gastos?mes=2026-04         → lista gastos do mês
POST   /gastos                     → cadastro manual de gasto
PUT    /gastos/:id                 → edição de gasto
DELETE /gastos/:id                 → remoção de gasto

GET    /cartoes                    → lista cartões
POST   /cartoes                    → cadastra cartão
PUT    /cartoes/:id                → edita cartão

GET    /dashboard/resumo?mes=...   → dados agregados para o dashboard
GET    /dashboard/projecao         → projeção de fechamento do mês
GET    /dashboard/faturas          → faturas por cartão no mês atual
```

---

## 6. Dashboard (Next.ts)

### 6.1 Painéis

**Visão Geral (topo)**
- Gasto total do mês vs renda mensal (barra de progresso + valor)
- Saldo disponível estimado
- Indicador visual: 🟢 tranquilo / 🟡 atenção / 🔴 apertado

**Por Categoria**
- Gráfico de pizza com distribuição
- Barras com limite vs gasto por categoria
- Destaque para categorias que estouraram o limite

**Por Forma de Pagamento**
- Distribuição entre crédito, débito, pix, boleto, dinheiro
- Gráfico de barras empilhadas por semana

**Faturas dos Cartões**
- Card por cartão: nome, fatura atual, limite, % usado, vencimento
- Alerta visual quando acima de 70% do limite

**Projeção do Mês**
- Com base na média diária de gastos até agora
- Estimativa de gasto total ao fim do mês
- Indicação se vai fechar no azul ou no vermelho

**Histórico**
- Tabela com todos os gastos
- Filtros por categoria, forma de pagamento, cartão, período
- Edição e remoção inline

### 6.2 Período de navegação
- Seletor de mês/ano no topo
- Comparativo com mês anterior (opcional, fase 2)

---

## 7. Alertas Inteligentes

O backend roda verificações após cada gasto registrado e envia mensagem de volta ao WhatsApp quando:

| Condição | Alerta |
|---|---|
| Gasto mensal > 70% da renda | ⚠️ Atenção nos gastos |
| Gasto mensal > 90% da renda | 🚨 Mês muito apertado |
| Fatura de cartão > 70% do limite | ⚠️ Limite do cartão próximo |
| Categoria ultrapassa limite definido | 🔴 Limite de categoria estourado |
| Projeção indica fechar no vermelho | 📉 Projeção negativa para o mês |

---

## 8. Infra e Deploy

| Componente | Sugestão |
|---|---|
| Backend Node.ts | Railway ou Render (free tier suficiente para início) |
| PostgreSQL | Railway PostgreSQL ou Supabase |
| Evolution API | Docker em VPS barata (ex: Hostinger VPS R$ 30/mês) ou Evolution Cloud |
| Dashboard Next.ts | Vercel (gratuito) |

---

## 9. Fora do Escopo (por agora)

- Multi-usuário / contas compartilhadas
- Integração com Open Finance / dados bancários reais
- App mobile nativo
- Relatórios exportáveis em PDF/Excel
- Comparativo histórico entre meses (fase 2)

---

## 10. Ordem de Implementação Sugerida

1. **Setup do banco** — criar schema PostgreSQL com todas as entidades
2. **Backend base** — Express + conexão DB + endpoints CRUD
3. **Integração Evolution API** — webhook receiver + envio de mensagens
4. **Integração Claude API** — prompt de extração + parser de JSON
5. **Lógica de alertas** — verificações pós-gasto
6. **Dashboard** — Next.ts com todos os painéis
7. **Polimento** — testes, edge cases, UX do bot
