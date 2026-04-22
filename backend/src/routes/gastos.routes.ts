import { Router } from 'express';
import { z } from 'zod';
import {
  findGastosByMes,
  createGasto,
  updateGasto,
  deleteGasto,
  getTotalMes,
  getGastosPorForma,
} from '../repositories/gastos.repository.ts';
import { NotFoundError, ValidationError } from '../utils/errors.ts';

const router = Router();

const gastoSchema = z.object({
  user_id: z.string().uuid(),
  valor: z.number().positive(),
  descricao: z.string().min(1),
  categoria_id: z.string().uuid().nullable().optional(),
  forma_pagamento: z.enum(['cartao_credito', 'cartao_debito', 'pix', 'boleto', 'dinheiro', 'outro']),
  cartao_id: z.string().uuid().nullable().optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// GET /gastos?mes=2026-04&user_id=...
router.get('/', async (req, res, next) => {
  try {
    const mes = (req.query.mes as string) ?? new Date().toISOString().slice(0, 7);
    const userId = (req as any).userId as string;

    const gastos = await findGastosByMes(userId, mes);
    const { total, qtd } = await getTotalMes(userId, mes);
    const porForma = await getGastosPorForma(userId, mes);

    res.json({ gastos, resumo: { total, qtd, por_forma: porForma } });
  } catch (err) {
    next(err);
  }
});

// POST /gastos
router.post('/', async (req, res, next) => {
  try {
    const data = gastoSchema.parse(req.body);
    const gasto = await createGasto(data);
    res.status(201).json(gasto);
  } catch (err) {
    next(err);
  }
});

// PUT /gastos/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { user_id, ...rest } = req.body as { user_id: string } & Record<string, unknown>;
    if (!user_id) throw new ValidationError('user_id é obrigatório');

    const gasto = await updateGasto(req.params.id!, user_id, rest as never);
    if (!gasto) throw new NotFoundError('Gasto');

    res.json(gasto);
  } catch (err) {
    next(err);
  }
});

// DELETE /gastos/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).userId as string;

    const deleted = await deleteGasto(req.params.id!, userId);
    if (!deleted) throw new NotFoundError('Gasto');

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

export default router;