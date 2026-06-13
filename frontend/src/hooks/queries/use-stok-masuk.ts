"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stokMasukService, type StokMasukParams, type StokMasukDto } from "@/services/stok-masuk.service";
import { toast } from "sonner";

const KEYS = {
  all: ["stok-masuk"] as const,
  list: (params?: StokMasukParams) => ["stok-masuk", "list", params] as const,
  detail: (id: string) => ["stok-masuk", "detail", id] as const,
  stats: () => ["stok-masuk", "stats"] as const,
};

export function useStokMasukList(params?: StokMasukParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => stokMasukService.getAll(params),
  });
}

export function useStokMasukDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => stokMasukService.getById(id),
    enabled: !!id,
  });
}

export function useStokMasukStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => stokMasukService.getStats(),
  });
}

export function useCreateStokMasuk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StokMasukDto) => stokMasukService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["obat"] });
      qc.invalidateQueries({ queryKey: ["batch"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
