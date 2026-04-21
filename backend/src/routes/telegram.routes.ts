import { Router } from 'express';
import { processarMensagemTelegram } from '../services/telegram.webhook.service.ts';
import { logger } from '../utils/logger.ts';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    res.sendStatus(200);
    await processarMensagemTelegram(req.body);
  } catch (err) {
    logger.error({ err }, 'Erro ao processar mensagem Telegram');
    next(err);
  }
});

export default router;