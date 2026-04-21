import http from 'node:http';
import { createApp } from './app.ts';
import { config } from './config.ts';
import { connectDB, closeDB } from './utils/db.ts';
import { logger } from './utils/logger.ts';

const app = createApp();
const server = http.createServer(app);

async function start() {
  await connectDB();

  server.listen(config.PORT, () => {
    logger.info(`🚀 Finza backend rodando na porta ${config.PORT} [${config.NODE_ENV}]`);
  });

  server.setTimeout(30_000);
}

async function shutdown(signal: string) {
  logger.info(`Recebido ${signal}, encerrando...`);
  server.close(async () => {
    await closeDB();
    logger.info('Servidor encerrado.');
    process.exit(0);
  });

  // Força saída após 10s se travar
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ 
    reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise)
  }, 'unhandledRejection');
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'uncaughtException');
  process.exit(1);
});

start();