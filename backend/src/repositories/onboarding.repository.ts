import { pool } from '../utils/db.ts';
import type { OnboardingSession, OnboardingStep } from '../types/index.ts';

export async function findSession(telegramId: string): Promise<OnboardingSession | null> {
  const { rows } = await pool.query<OnboardingSession>(
    'SELECT * FROM onboarding_sessions WHERE telegram_id = $1 LIMIT 1',
    [telegramId],
  );
  return rows[0] ?? null;
}

export async function upsertSession(
  telegramId: string,
  step: OnboardingStep,
  data: Record<string, unknown>,
): Promise<OnboardingSession> {
  const { rows } = await pool.query<OnboardingSession>(
    `INSERT INTO onboarding_sessions (telegram_id, step, data)
     VALUES ($1, $2, $3)
     ON CONFLICT (telegram_id) DO UPDATE
     SET step = $2, data = $3, updated_at = NOW()
     RETURNING *`,
    [telegramId, step, JSON.stringify(data)],
  );
  return rows[0]!;
}

export async function deleteSession(telegramId: string): Promise<void> {
  await pool.query('DELETE FROM onboarding_sessions WHERE telegram_id = $1', [telegramId]);
}