import express from 'express';
import cors from 'cors';
import gastosRoutes from './routes/gastos.routes.ts';
import cartoesRoutes from './routes/cartoes.routes.ts';
import dashboardRoutes from './routes/dashboard.routes.ts';
import telegramRoutes from './routes/telegram.routes.ts';
import { errorHandler, notFound } from './middleware/errorHandler.ts';
import { logger } from './utils/logger.ts';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));

  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  app.use('/gastos', gastosRoutes);
  app.use('/cartoes', cartoesRoutes);
  app.use('/dashboard', dashboardRoutes);
  app.use('/telegram', telegramRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}