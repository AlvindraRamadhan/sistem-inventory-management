"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stokOpnameService, type StokOpnameParams, type UpdateOpnameItemDto } from "@/services/stok-opname.service";
import { toast } from "sonner";

const KEYS = {
  all: ["stok-opname"] as const,
  list: (params?: StokOpnameParams) => ["stok-opname", "list", params] as const,
  detail: (id: string) => ["stok-opname", "detail", id] as const,
};

export function useStokOpnameList(params?: StokOpnameParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => stokOpnameService.getAll(params),
  });
}

export function useStokOpnameDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => stokOpnameService.getById(id),
    enabled: !!id,
  });
}

export function useCreateStokOpname() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload?: { catatan?: string }) => stokOpnameService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Sesi opname berhasil dibuat.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteStokOpname() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stokOpnameService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Sesi opname berhasil dihapus.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateOpnameItem(opnameId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOpnameItemDto) => stokOpnameService.updateItem(opnameId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(opnameId) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSubmitOpname() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stokOpnameService.submit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Opname berhasil diajukan ke admin.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useFinalizeOpname() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stokOpnameService.finalize(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["obat"] });
      toast.success("Opname berhasil difinalisasi. Stok sistem telah disesuaikan.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRejectOpname() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, catatanPenolakan }: { id: string; catatanPenolakan: string }) =>
      stokOpnameService.reject(id, catatanPenolakan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Opname ditolak. Apoteker akan dikirim notifikasi.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
