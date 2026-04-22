import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.ts';
import { logger } from '../utils/logger.ts';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token não fornecido' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    (req as any).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido ou expirado' });
  }
}