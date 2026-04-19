import express from 'express';
import cors from 'cors';
import webhookRoutes from './routes/webhook.routes.ts';
import gastosRoutes from './routes/gastos.routes.ts';
import cartoesRoutes from './routes/cartoes.routes.ts';
import dashboardRoutes from './routes/dashboard.routes.ts';
import { errorHandler, notFound } from './middleware/errorHandler.ts';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));

  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  app.use('/webhook', webhookRoutes);
  app.use('/gastos', gastosRoutes);
  app.use('/cartoes', cartoesRoutes);
  app.use('/dashboard', dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}