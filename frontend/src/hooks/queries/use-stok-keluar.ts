"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stokKeluarService, type StokKeluarParams, type StokKeluarDto } from "@/services/stok-keluar.service";
import { toast } from "sonner";

const KEYS = {
  all: ["stok-keluar"] as const,
  list: (params?: StokKeluarParams) => ["stok-keluar", "list", params] as const,
  detail: (id: string) => ["stok-keluar", "detail", id] as const,
  stats: () => ["stok-keluar", "stats"] as const,
  pareto: () => ["stok-keluar", "pareto"] as const,
};

export function useStokKeluarList(params?: StokKeluarParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => stokKeluarService.getAll(params),
  });
}

export function useStokKeluarDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => stokKeluarService.getById(id),
    enabled: !!id,
  });
}

export function useStokKeluarStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => stokKeluarService.getStats(),
  });
}

export function useStokKeluarPareto() {
  return useQuery({
    queryKey: KEYS.pareto(),
    queryFn: () => stokKeluarService.getPareto(),
  });
}

export function useCreateStokKeluar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StokKeluarDto) => stokKeluarService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["obat"] });
      qc.invalidateQueries({ queryKey: ["batch"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
