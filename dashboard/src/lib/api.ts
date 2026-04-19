const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const USER_ID = process.env.NEXT_PUBLIC_USER_ID ?? '';

export async function fetchResumo(mes: string) {
  const res = await fetch(`${API}/dashboard/resumo?user_id=${USER_ID}&mes=${mes}`);
  if (!res.ok) throw new Error('Erro ao buscar resumo');
  return res.json();
}

export async function fetchProjecao() {
  const res = await fetch(`${API}/dashboard/projecao?user_id=${USER_ID}`);
  if (!res.ok) throw new Error('Erro ao buscar projeção');
  return res.json();
}

export async function fetchGastos(mes: string) {
  const res = await fetch(`${API}/gastos?user_id=${USER_ID}&mes=${mes}`);
  if (!res.ok) throw new Error('Erro ao buscar gastos');
  return res.json();
}

export async function fetchCartoes() {
  const res = await fetch(`${API}/cartoes?user_id=${USER_ID}`);
  if (!res.ok) throw new Error('Erro ao buscar cartões');
  return res.json();
}

export async function deleteGasto(id: string) {
  const res = await fetch(`${API}/gastos/${id}?user_id=${USER_ID}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao deletar gasto');
}