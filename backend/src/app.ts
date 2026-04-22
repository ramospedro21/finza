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

  app.use(cors({
    origin: ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));

  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0' }));

  logger.info('Registrando rotas...');

  // Rotas públicas
  app.use('/auth', authRoutes);
  logger.info('auth ok');
  
  app.use('/telegram', telegramRoutes);
  logger.info('telegram ok');

  // Rotas protegidas
  app.use('/gastos', authMiddleware, gastosRoutes);
  logger.info('gastos ok');
  app.use('/cartoes', authMiddleware, cartoesRoutes);
  logger.info('cartoes ok');
  app.use('/dashboard', authMiddleware, dashboardRoutes);
  logger.info('dashboard ok');

  app.use(notFound);
  app.use(errorHandler);

  return app;
}