import pg from 'pg';
import { config } from '../config.ts';
import { logger } from './logger.ts';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Erro inesperado no pool do PostgreSQL');
});

export async function connectDB(): Promise<void> {
  const client = await pool.connect();
  client.release();
  logger.info('✅ Conectado ao PostgreSQL');
}

export async function closeDB(): Promise<void> {
  await pool.end();
  logger.info('PostgreSQL pool encerrado');
}