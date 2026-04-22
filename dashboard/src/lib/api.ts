const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function getHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('finza_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Email ou senha inválidos');
  return res.json();
}

export async function register(data: { nome: string; email: string; password: string; renda_mensal: number }) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao criar conta');
  return res.json();
}

export async function fetchResumo(mes: string) {
  const res = await fetch(`${API}/dashboard/resumo?mes=${mes}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Erro ao buscar resumo');
  return res.json();
}

export async function fetchProjecao() {
  const res = await fetch(`${API}/dashboard/projecao`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Erro ao buscar projeção');
  return res.json();
}

export async function fetchGastos(mes: string) {
  const res = await fetch(`${API}/gastos?mes=${mes}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Erro ao buscar gastos');
  return res.json();
}

export async function fetchCartoes() {
  const res = await fetch(`${API}/cartoes`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Erro ao buscar cartões');
  return res.json();
}

export async function deleteGasto(id: string) {
  const res = await fetch(`${API}/gastos/${id}`, { method: 'DELETE', headers: getHeaders() });
  if (!res.ok) throw new Error('Erro ao deletar gasto');
}