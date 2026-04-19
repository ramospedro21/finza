import { pool } from '../utils/db.ts';
import type { Cartao, FaturaCartao } from '../types/index.ts';

export async function findCartoesByUserId(userId: string): Promise<Cartao[]> {
  const { rows } = await pool.query<Cartao>(
    'SELECT * FROM cartoes WHERE user_id = $1 AND ativo = TRUE ORDER BY nome',
    [userId],
  );
  return rows;
}

export async function findCartaoByNome(userId: string, nome: string): Promise<Cartao | null> {
  const { rows } = await pool.query<Cartao>(
    `SELECT * FROM cartoes
     WHERE user_id = $1 AND ativo = TRUE AND LOWER(nome) LIKE LOWER($2)
     LIMIT 1`,
    [userId, `%${nome}%`],
  );
  return rows[0] ?? null;
}

export async function createCartao(data: {
  user_id: string;
  nome: string;
  limite: number;
  vencimento_fatura: number;
}): Promise<Cartao> {
  const { rows } = await pool.query<Cartao>(
    `INSERT INTO cartoes (user_id, nome, limite, vencimento_fatura)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.user_id, data.nome, data.limite, data.vencimento_fatura],
  );
  return rows[0]!;
}

export async function updateCartao(
  id: string,
  data: Partial<Pick<Cartao, 'nome' | 'limite' | 'vencimento_fatura' | 'ativo'>>,
): Promise<Cartao> {
  const fields = Object.keys(data) as (keyof typeof data)[];
  const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const values = fields.map((f) => data[f]);

  const { rows } = await pool.query<Cartao>(
    `UPDATE cartoes SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...values],
  );
  return rows[0]!;
}

export async function getFaturasMesAtual(userId: string): Promise<FaturaCartao[]> {
  const { rows } = await pool.query<FaturaCartao>(
    'SELECT * FROM vw_faturas_mes_atual WHERE user_id = $1',
    [userId],
  );
  return rows;
}