"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  lokasiGudangService,
  type LokasiGudangParams,
  type CreateLokasiGudangDto,
  type UpdateLokasiGudangDto,
} from "@/services/lokasi-gudang.service";

const KEYS = {
  all: ["lokasi-gudang"] as const,
  list: (params?: LokasiGudangParams) => ["lokasi-gudang", "list", params] as const,
  detail: (id: string) => ["lokasi-gudang", "detail", id] as const,
};

export function useLokasiGudangList(params?: LokasiGudangParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => lokasiGudangService.getAll(params),
  });
}

export function useLokasiGudangDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => lokasiGudangService.getById(id),
    enabled: !!id,
  });
}

export function useCreateLokasiGudang() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLokasiGudangDto) => lokasiGudangService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Lokasi gudang berhasil ditambahkan.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateLokasiGudang() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLokasiGudangDto }) =>
      lokasiGudangService.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Lokasi gudang berhasil diperbarui.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteLokasiGudang() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lokasiGudangService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Lokasi gudang berhasil dihapus.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export { KEYS as LOKASI_GUDANG_KEYS };
