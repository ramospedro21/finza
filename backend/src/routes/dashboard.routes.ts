import { Router } from 'express';
import { getTotalMes, getGastosPorForma } from '../repositories/gastos.repository.ts';
import { getGastosPorCategoria } from '../repositories/gastos.repository.ts';
import { getFaturasMesAtual } from '../repositories/cartoes.repository.ts';
import { findUserByWhatsappId } from '../repositories/users.repository.ts';
import { ValidationError } from '../utils/errors.ts';
import { pool } from '../utils/db.ts';

const router = Router();

// GET /dashboard/resumo?user_id=...&mes=2026-04
router.get('/resumo', async (req, res, next) => {
  try {
    const userId = req.query.user_id as string;
    const mes = (req.query.mes as string) ?? new Date().toISOString().slice(0, 7);
    if (!userId) throw new ValidationError('user_id é obrigatório');

    const [resumo, porCategoria, porForma, faturas] = await Promise.all([
      getTotalMes(userId, mes),
      getGastosPorCategoria(userId, mes),
      getGastosPorForma(userId, mes),
      getFaturasMesAtual(userId),
    ]);

    // Busca renda do usuário
    const { rows } = await pool.query(
      'SELECT renda_mensal FROM users WHERE id = $1',
      [userId],
    );
    const renda = parseFloat(rows[0]?.renda_mensal ?? '0');
    const saldo = renda - resumo.total;
    const percentual = renda > 0 ? Math.round((resumo.total / renda) * 100) : 0;

    let status: 'tranquilo' | 'atencao' | 'apertado' = 'tranquilo';
    if (percentual >= 90) status = 'apertado';
    else if (percentual >= 70) status = 'atencao';

    res.tson({
      mes,
      renda_mensal: renda,
      total_gasto: resumo.total,
      qtd_gastos: resumo.qtd,
      saldo_estimado: saldo,
      percentual_renda: percentual,
      status,
      por_categoria: porCategoria,
      por_forma: porForma,
      faturas,
    });
  } catch (err) {
    next(err);
  }
});

// GET /dashboard/projecao?user_id=...
router.get('/projecao', async (req, res, next) => {
  try {
    const userId = req.query.user_id as string;
    if (!userId) throw new ValidationError('user_id é obrigatório');

    const mes = new Date().toISOString().slice(0, 7);
    const hoje = new Date();
    const diasPassados = hoje.getDate();
    const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();

    const { total } = await getTotalMes(userId, mes);
    const mediaDiaria = diasPassados > 0 ? total / diasPassados : 0;
    const projecaoMes = mediaDiaria * diasNoMes;

    const { rows } = await pool.query(
      'SELECT renda_mensal FROM users WHERE id = $1',
      [userId],
    );
    const renda = parseFloat(rows[0]?.renda_mensal ?? '0');
    const saldoProjetado = renda - projecaoMes;

    res.tson({
      total_ate_hoje: total,
      dias_passados: diasPassados,
      dias_no_mes: diasNoMes,
      media_diaria: Math.round(mediaDiaria * 100) / 100,
      projecao_mes: Math.round(projecaoMes * 100) / 100,
      renda_mensal: renda,
      saldo_projetado: Math.round(saldoProjetado * 100) / 100,
      fechara_no_azul: saldoProjetado >= 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;