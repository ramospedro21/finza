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
  app.use('/auth', authRoutes);
  app.use('/telegram', telegramRoutes);
    
  //ROTAS PRIVADAS
  app.use('/gastos', authMiddleware, gastosRoutes);
  app.use('/cartoes', authMiddleware, cartoesRoutes);
  app.use('/dashboard', authMiddleware, dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}