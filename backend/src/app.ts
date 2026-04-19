import express from 'express';
import webhookRoutes from './routes/webhook.routes.ts';
import gastosRoutes from './routes/gastos.routes.ts';
import cartoesRoutes from './routes/cartoes.routes.ts';
import dashboardRoutes from './routes/dashboard.routes.ts';
import { errorHandler, notFound } from './middleware/errorHandler.ts';

export function createApp() {
  const app = express();

  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  // Rotas
  app.use('/webhook', webhookRoutes);
  app.use('/gastos', gastosRoutes);
  app.use('/cartoes', cartoesRoutes);
  app.use('/dashboard', dashboardRoutes);

  // 404 + error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}