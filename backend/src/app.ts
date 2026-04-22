import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.ts';
import gastosRoutes from './routes/gastos.routes.ts';
import cartoesRoutes from './routes/cartoes.routes.ts';
import dashboardRoutes from './routes/dashboard.routes.ts';
import telegramRoutes from './routes/telegram.routes.ts';
import { authMiddleware } from './middleware/auth.middleware.ts';
import { errorHandler, notFound } from './middleware/errorHandler.ts';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));

  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0' }));

  // Rotas públicas
  app.use('/auth', authRoutes);
  app.use('/telegram', telegramRoutes);

  // Rotas protegidas
  app.use('/gastos', authMiddleware, gastosRoutes);
  app.use('/cartoes', authMiddleware, cartoesRoutes);
  app.use('/dashboard', authMiddleware, dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}