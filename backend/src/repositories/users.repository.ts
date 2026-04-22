import { pool } from '../utils/db.ts';
import type { User } from '../types/index.ts';

export async function findUserByWhatsappId(whatsappId: string): Promise<User | null> {
  const { rows } = await pool.query<User>(
    'SELECT * FROM users WHERE whatsapp_id = $1 LIMIT 1',
    [whatsappId],
  );
  return rows[0] ?? null;
}

export async function createUser(data: {
  nome: string;
  whatsapp_id: string;
  renda_mensal: number;
}): Promise<User> {
  const { rows } = await pool.query<User>(
    `INSERT INTO users (nome, whatsapp_id, renda_mensal)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.nome, data.whatsapp_id, data.renda_mensal],
  );
  return rows[0]!;
}

export async function updateRendaMensal(userId: string, renda: number): Promise<User> {
  const { rows } = await pool.query<User>(
    `UPDATE users SET renda_mensal = $1 WHERE id = $2 RETURNING *`,
    [renda, userId],
  );
  return rows[0]!;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await pool.query<User>(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email],
  );
  return rows[0] ?? null;
}

export async function findUserByTelegramId(telegramId: string): Promise<User | null> {
  const { rows } = await pool.query<User>(
    'SELECT * FROM users WHERE telegram_id = $1 LIMIT 1',
    [telegramId],
  );
  return rows[0] ?? null;
}
export async function createUserWithEmail(data: {
  nome: string;
  email: string;
  password_hash: string;
  renda_mensal: number;
}): Promise<User> {
  const { rows } = await pool.query<User>(
    `INSERT INTO users (nome, email, password_hash, renda_mensal, whatsapp_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.nome, data.email, data.password_hash, data.renda_mensal, `email_${Date.now()}`],
  );
  return rows[0]!;
}

export async function linkTelegramToUser(userId: string, telegramId: string): Promise<void> {
  await pool.query(
    'UPDATE users SET telegram_id = $1 WHERE id = $2',
    [telegramId, userId],
  );
}