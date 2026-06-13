"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { obatService, type ObatParams, type CreateObatDto } from "@/services/obat.service";
import { toast } from "sonner";

const KEYS = {
  all: ["obat"] as const,
  list: (params?: ObatParams) => ["obat", "list", params] as const,
  detail: (id: string) => ["obat", "detail", id] as const,
  stats: () => ["obat", "stats"] as const,
  kritis: () => ["obat", "kritis"] as const,
};

export function useObatList(params?: ObatParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => obatService.getAll(params),
  });
}

export function useObatDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => obatService.getById(id),
    enabled: !!id,
  });
}

export function useObatStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => obatService.getAll({ limit: 1000 }).then((r) => {
      const items = r.data;
      return {
        total: r.meta.total,
        aman: items.filter((o) => o.stokSaat > o.stokMinimal * 2).length,
        menipis: items.filter((o) => o.stokSaat > o.stokMinimal && o.stokSaat <= o.stokMinimal * 2).length,
        kritis: items.filter((o) => o.stokSaat <= o.stokMinimal).length,
      };
    }),
  });
}

export function useObatKritis() {
  return useQuery({
    queryKey: KEYS.kritis(),
    queryFn: () => obatService.getAll({ limit: 100, isActive: true }).then((r) =>
      r.data.filter((o) => o.stokSaat <= o.stokMinimal)
    ),
  });
}

export function useCreateObat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateObatDto) => obatService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Obat berhasil ditambahkan.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateObat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateObatDto> }) =>
      obatService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Obat berhasil diperbarui.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteObat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => obatService.softDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Obat berhasil dihapus.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleObatActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      obatService.update(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Status obat diperbarui.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
