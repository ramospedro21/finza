-- ============================================================
-- finza — schema inicial
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- ENUM: formas de pagamento
-- ------------------------------------------------------------
CREATE TYPE forma_pagamento_enum AS ENUM (
  'cartao_credito',
  'cartao_debito',
  'pix',
  'boleto',
  'dinheiro',
  'outro'
);

-- ------------------------------------------------------------
-- TABELA: users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            VARCHAR(100) NOT NULL,
  whatsapp_id     VARCHAR(50)  NOT NULL UNIQUE,
  renda_mensal    DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABELA: cartoes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cartoes (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome                VARCHAR(100)  NOT NULL,
  limite              DECIMAL(10,2) NOT NULL DEFAULT 0,
  vencimento_fatura   INTEGER       NOT NULL CHECK (vencimento_fatura BETWEEN 1 AND 31),
  ativo               BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABELA: categorias
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome            VARCHAR(100)  NOT NULL,
  limite_mensal   DECIMAL(10,2),
  icone           VARCHAR(10)   DEFAULT '💰',
  created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABELA: gastos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gastos (
  id                  UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID                  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  valor               DECIMAL(10,2)         NOT NULL CHECK (valor > 0),
  descricao           VARCHAR(255)          NOT NULL,
  categoria_id        UUID                  REFERENCES categorias(id) ON DELETE SET NULL,
  forma_pagamento     forma_pagamento_enum  NOT NULL,
  cartao_id           UUID                  REFERENCES cartoes(id) ON DELETE SET NULL,
  data                DATE                  NOT NULL DEFAULT CURRENT_DATE,
  mensagem_original   TEXT,
  created_at          TIMESTAMP             NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP             NOT NULL DEFAULT NOW(),

  -- cartao_id só pode ser preenchido quando forma_pagamento é cartão
  CONSTRAINT chk_cartao_forma CHECK (
    (forma_pagamento IN ('cartao_credito', 'cartao_debito') AND cartao_id IS NOT NULL)
    OR (forma_pagamento NOT IN ('cartao_credito', 'cartao_debito'))
  )
);

-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_gastos_user_data     ON gastos (user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria      ON gastos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_gastos_cartao         ON gastos (cartao_id);
CREATE INDEX IF NOT EXISTS idx_gastos_forma          ON gastos (forma_pagamento);
CREATE INDEX IF NOT EXISTS idx_cartoes_user          ON cartoes (user_id);
CREATE INDEX IF NOT EXISTS idx_categorias_user       ON categorias (user_id);

-- ------------------------------------------------------------
-- FUNÇÃO: atualiza updated_at automaticamente
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cartoes_updated_at
  BEFORE UPDATE ON cartoes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_gastos_updated_at
  BEFORE UPDATE ON gastos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- VIEWS úteis
-- ------------------------------------------------------------

-- Resumo de gastos por mês e categoria
CREATE OR REPLACE VIEW vw_gastos_por_categoria AS
SELECT
  g.user_id,
  DATE_TRUNC('month', g.data)   AS mes,
  c.nome                         AS categoria,
  c.icone,
  c.limite_mensal,
  COUNT(*)                       AS qtd_gastos,
  SUM(g.valor)                   AS total_gasto
FROM gastos g
LEFT JOIN categorias c ON c.id = g.categoria_id
GROUP BY g.user_id, DATE_TRUNC('month', g.data), c.nome, c.icone, c.limite_mensal;

-- Fatura atual por cartão (mês corrente)
CREATE OR REPLACE VIEW vw_faturas_mes_atual AS
SELECT
  ca.id             AS cartao_id,
  ca.user_id,
  ca.nome           AS cartao,
  ca.limite,
  ca.vencimento_fatura,
  COALESCE(SUM(g.valor), 0)                        AS fatura_atual,
  ROUND(COALESCE(SUM(g.valor), 0) / ca.limite * 100, 2) AS percentual_limite
FROM cartoes ca
LEFT JOIN gastos g
  ON g.cartao_id = ca.id
  AND g.forma_pagamento = 'cartao_credito'
  AND DATE_TRUNC('month', g.data) = DATE_TRUNC('month', CURRENT_DATE)
WHERE ca.ativo = TRUE
GROUP BY ca.id, ca.user_id, ca.nome, ca.limite, ca.vencimento_fatura;

-- Resumo mensal por forma de pagamento
CREATE OR REPLACE VIEW vw_gastos_por_forma AS
SELECT
  user_id,
  DATE_TRUNC('month', data) AS mes,
  forma_pagamento,
  COUNT(*)                   AS qtd_gastos,
  SUM(valor)                 AS total_gasto
FROM gastos
GROUP BY user_id, DATE_TRUNC('month', data), forma_pagamento;

-- ------------------------------------------------------------
-- SEED: categorias padrão (ajuste o user_id ao criar o usuário)
-- Inserção feita via aplicação após criar o primeiro usuário.
-- ------------------------------------------------------------