'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchResumo, fetchProjecao, fetchGastos } from '../lib/api.ts';

export function useDashboard(mes: string) {
  const [resumo, setResumo]     = useState<any>(null);
  const [projecao, setProjecao] = useState<any>(null);
  const [gastos, setGastos]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, p, g] = await Promise.all([
        fetchResumo(mes),
        fetchProjecao(),
        fetchGastos(mes),
      ]);
      setResumo(r);
      setProjecao(p);
      setGastos(g.gastos ?? []);
    } catch (err) {
      setError('Falha ao carregar dados. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  }, [mes]);

  useEffect(() => { load(); }, [load]);

  return { resumo, projecao, gastos, loading, error, reload: load };
}