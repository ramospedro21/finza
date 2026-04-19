import { pool } from '../utils/db.ts';
import type { FormaPagamento, Gasto, GastoPorCategoria } from '../types/index.ts';

export interface CreateGastoData {
  user_id: string;
  valor: number;
  descricao: string;
  categoria_id?: string | null;
  forma_pagamento: FormaPagamento;
  cartao_id?: string | null;
  data: string; // ISO date
  mensagem_original?: string | null;
}

export async function createGasto(data: CreateGastoData): Promise<Gasto> {
  const { rows } = await pool.query<Gasto>(
    `INSERT INTO gastos
       (user_id, valor, descricao, categoria_id, forma_pagamento, cartao_id, data, mensagem_original)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.user_id,
      data.valor,
      data.descricao,
      data.categoria_id ?? null,
      data.forma_pagamento,
      data.cartao_id ?? null,
      data.data,
      data.mensagem_original ?? null,
    ],
  );
  return rows[0]!;
}

export async function findGastosByMes(userId: string, mes: string): Promise<Gasto[]> {
  const { rows } = await pool.query<Gasto>(
    `SELECT g.*, c.nome AS categoria_nome, ca.nome AS cartao_nome
     FROM gastos g
     LEFT JOIN categorias c ON c.id = g.categoria_id
     LEFT JOIN cartoes ca ON ca.id = g.cartao_id
     WHERE g.user_id = $1 AND TO_CHAR(g.data, 'YYYY-MM') = $2
     ORDER BY g.data DESC, g.created_at DESC`,
    [userId, mes],
  );
  return rows;
}

export async function getTotalMes(
  userId: string,
  mes: string,
): Promise<{ total: number; qtd: number }> {
  const { rows } = await pool.query<{ total: string; qtd: string }>(
    `SELECT COALESCE(SUM(valor), 0) AS total, COUNT(*) AS qtd
     FROM gastos
     WHERE user_id = $1 AND TO_CHAR(data, 'YYYY-MM') = $2`,
    [userId, mes],
  );
  return { total: parseFloat(rows[0]!.total), qtd: parseInt(rows[0]!.qtd) };
}

export async function getTotalSemana(userId: string): Promise<number> {
  const { rows } = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(valor), 0) AS total
     FROM gastos
     WHERE user_id = $1
       AND data >= DATE_TRUNC('week', CURRENT_DATE)
       AND data <= CURRENT_DATE`,
    [userId],
  );
  return parseFloat(rows[0]!.total);
}

export async function getGastosPorForma(
  userId: string,
  mes: string,
): Promise<{ forma_pagamento: FormaPagamento; total: number; qtd: number }[]> {
  const { rows } = await pool.query(
    `SELECT forma_pagamento, SUM(valor) AS total, COUNT(*) AS qtd
     FROM gastos
     WHERE user_id = $1 AND TO_CHAR(data, 'YYYY-MM') = $2
     GROUP BY forma_pagamento`,
    [userId, mes],
  );
  return rows.map((r) => ({
    forma_pagamento: r.forma_pagamento,
    total: parseFloat(r.total),
    qtd: parseInt(r.qtd),
  }));
}

export async function updateGasto(
  id: string,
  userId: string,
  data: Partial<CreateGastoData>,
): Promise<Gasto | null> {
  const fields = Object.keys(data) as (keyof typeof data)[];
  const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
  const values = fields.map((f) => data[f]);

  const { rows } = await pool.query<Gasto>(
    `UPDATE gastos SET ${sets} WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, ...values],
  );
  return rows[0] ?? null;
}

export async function deleteGasto(id: string, userId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    'DELETE FROM gastos WHERE id = $1 AND user_id = $2',
    [id, userId],
  );
  return (rowCount ?? 0) > 0;
}

export async function getGastosPorCategoria(
  userId: string,
  mes: string, // 'YYYY-MM'
): Promise<GastoPorCategoria[]> {
  const { rows } = await pool.query<GastoPorCategoria>(
    `SELECT * FROM vw_gastos_por_categoria
     WHERE user_id = $1 AND TO_CHAR(mes, 'YYYY-MM') = $2`,
    [userId, mes],
  );
  return rows;
}