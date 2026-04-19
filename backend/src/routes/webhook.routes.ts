import { Router } from 'express';
import { processarWebhook } from '../services/webhook.service.ts';
import { logger } from '../utils/logger.ts';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    // Responde imediatamente para a Evolution API não reenviar
    res.sendStatus(200);
    await processarWebhook(req.body);
  } catch (err) {
    logger.error({ err }, 'Erro ao processar webhook');
    next(err);
  }
});

export default router;