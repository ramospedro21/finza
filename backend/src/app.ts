import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.ts';
import gastosRoutes from './routes/gastos.routes.ts';
import cartoesRoutes from './routes/cartoes.routes.ts';
import dashboardRoutes from './routes/dashboard.routes.ts';
import telegramRoutes from './routes/telegram.routes.ts';
import { authMiddleware } from './middleware/auth.middleware.ts';
import { errorHandler, notFound } from './middleware/errorHandler.ts';
import { logger } from './utils/logger.ts';

export function createApp() {
  const app = express();

  app.use(cors());

  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0' }));

  // Adiciona direto no app.ts, antes das rotas
  app.post('/test', (_req, res) => {
    res.json({ ok: true });
  });
  logger.info('Registrando rotas...');

  // Rotas públicas
  try {
    app.use('/auth', authRoutes);
    logger.info('auth ok');
  } catch(e) { logger.error(e, 'auth failed'); }

  try {
    app.use('/telegram', telegramRoutes);
    logger.info('telegram ok');
  } catch(e) { logger.error(e, 'telegram failed'); }

  try {
    app.use('/gastos', authMiddleware, gastosRoutes);
    logger.info('gastos ok');
  } catch(e) { logger.error(e, 'gastos failed'); }

  try {
    app.use('/cartoes', authMiddleware, cartoesRoutes);
    logger.info('cartoes ok');
  } catch(e) { logger.error(e, 'cartoes failed'); }

  try {
    app.use('/dashboard', authMiddleware, dashboardRoutes);
    logger.info('dashboard ok');
  } catch(e) { logger.error(e, 'dashboard failed'); }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}