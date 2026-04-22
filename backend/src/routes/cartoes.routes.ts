import { Router } from 'express';
import { z } from 'zod';
import {
  findCartoesByUserId,
  createCartao,
  updateCartao,
  getFaturasMesAtual,
} from '../repositories/cartoes.repository.ts';
import { ValidationError, NotFoundError } from '../utils/errors.ts';

const router = Router();

const cartaoSchema = z.object({
  user_id: z.string().uuid(),
  nome: z.string().min(1),
  limite: z.number().positive(),
  vencimento_fatura: z.number().int().min(1).max(31),
});

// GET /cartoes?user_id=...
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).userId as string;

    const cartoes = await findCartoesByUserId(userId);
    const faturas = await getFaturasMesAtual(userId);

    res.json({ cartoes, faturas });
  } catch (err) {
    next(err);
  }
});

// POST /cartoes
router.post('/', async (req, res, next) => {
  try {
    const data = cartaoSchema.parse(req.body);
    const cartao = await createCartao(data);
    res.status(201).json(cartao);
  } catch (err) {
    next(err);
  }
});

// PUT /cartoes/:id
router.put('/:id', async (req, res, next) => {
  try {
    const cartao = await updateCartao(req.params.id!, req.body);
    if (!cartao) throw new NotFoundError('Cartão');
    res.json(cartao);
  } catch (err) {
    next(err);
  }
});

export default router;