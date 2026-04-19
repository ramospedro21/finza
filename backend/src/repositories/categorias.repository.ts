import { pool } from '../utils/db.ts';
import type { Categoria } from '../types/index.ts';

export async function findCategoriasByUserId(userId: string): Promise<Categoria[]> {
  const { rows } = await pool.query<Categoria>(
    'SELECT * FROM categorias WHERE user_id = $1 ORDER BY nome',
    [userId],
  );
  return rows;
}

export async function findCategoriaByNome(
  userId: string,
  nome: string,
): Promise<Categoria | null> {
  const { rows } = await pool.query<Categoria>(
    `SELECT * FROM categorias
     WHERE user_id = $1 AND LOWER(nome) LIKE LOWER($2)
     LIMIT 1`,
    [userId, `%${nome}%`],
  );
  return rows[0] ?? null;
}

export async function createCategoria(data: {
  user_id: string;
  nome: string;
  icone?: string;
  limite_mensal?: number;
}): Promise<Categoria> {
  const { rows } = await pool.query<Categoria>(
    `INSERT INTO categorias (user_id, nome, icone, limite_mensal)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.user_id, data.nome, data.icone ?? '💸', data.limite_mensal ?? null],
  );
  return rows[0]!;
}

export async function seedCategoriasDefault(userId: string): Promise<void> {
  const defaults = [
    { nome: 'Alimentação', icone: '🍽️', limite_mensal: 600 },
    { nome: 'Transporte', icone: '🚗', limite_mensal: 300 },
    { nome: 'Moradia', icone: '🏠', limite_mensal: 900 },
    { nome: 'Saúde', icone: '💊', limite_mensal: 200 },
    { nome: 'Lazer', icone: '🎬', limite_mensal: 200 },
    { nome: 'Educação', icone: '📚', limite_mensal: 150 },
    { nome: 'Vestuário', icone: '👕', limite_mensal: 100 },
    { nome: 'Assinaturas', icone: '📱', limite_mensal: 100 },
    { nome: 'Outros', icone: '💸', limite_mensal: null },
  ];

  for (const cat of defaults) {
    await pool.query(
      `INSERT INTO categorias (user_id, nome, icone, limite_mensal)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [userId, cat.nome, cat.icone, cat.limite_mensal],
    );
  }
}