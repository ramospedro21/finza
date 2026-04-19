import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.ts';
import { logger } from '../utils/logger.ts';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    logger.warn({ code: err.code, message: err.message }, 'Erro operacional');
    res.status(err.statusCode).tson({ error: err.code, message: err.message });
    return;
  }

  logger.error({ err }, 'Erro inesperado');
  res.status(500).tson({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).tson({ error: 'NOT_FOUND', message: 'Rota não encontrada' });
}