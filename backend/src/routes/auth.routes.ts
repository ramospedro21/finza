import { Router } from 'express';
import { z } from 'zod';
import { findUserByEmail, createUserWithEmail, findUserBySetupToken, setUserPassword } from '../repositories/users.repository.ts';
import { seedCategoriasDefault } from '../repositories/categorias.repository.ts';
import { generateToken, hashPassword, comparePassword } from '../utils/auth.ts';
import { ValidationError } from '../utils/errors.ts';

const router = Router();

const registerSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  renda_mensal: z.number().positive().default(3000),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await findUserByEmail(data.email);
    if (existing) throw new ValidationError('Email já cadastrado');

    const password_hash = await hashPassword(data.password);
    const user = await createUserWithEmail({
      nome: data.nome,
      email: data.email,
      password_hash,
      renda_mensal: data.renda_mensal,
    });

    await seedCategoriasDefault(user.id);
    const token = generateToken(user.id);

    res.status(201).json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await findUserByEmail(email);
    if (!user || !user.password_hash) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Email ou senha inválidos' });
      return;
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Email ou senha inválidos' });
      return;
    }

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me
router.get('/me', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { rows } = await (await import('../utils/db.ts')).pool.query(
      'SELECT id, nome, email, renda_mensal, telegram_id FROM users WHERE id = $1',
      [userId],
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /auth/verify-token?token=xxx
router.get('/verify-token', async (req, res, next) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ error: 'Token não fornecido' });
      return;
    }
    const user = await findUserBySetupToken(token);
    if (!user) {
      res.status(404).json({ error: 'Token inválido ou expirado' });
      return;
    }
    res.json({ valid: true, nome: user.nome });
  } catch (err) {
    next(err);
  }
});

// POST /auth/setup
router.post('/setup', async (req, res, next) => {
  try {
    const { token, password } = z.object({
      token: z.string().min(1),
      password: z.string().min(6),
    }).parse(req.body);

    const user = await findUserBySetupToken(token);
    if (!user) {
      res.status(400).json({ error: 'Token inválido ou expirado' });
      return;
    }

    const password_hash = await hashPassword(password);
    await setUserPassword(user.id, password_hash);

    const jwtToken = generateToken(user.id);
    res.json({ token: jwtToken, user: { id: user.id, nome: user.nome, email: user.email } });
  } catch (err) {
    next(err);
  }
});

export default router;