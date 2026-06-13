"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  alkesService,
  type AlkesParams,
  type CreateAlkesDto,
  type UpdateAlkesDto,
  type CreateKalibrasiDto,
} from "@/services/alkes.service";

const KEYS = {
  all: ["alkes"] as const,
  list: (params?: AlkesParams) => ["alkes", "list", params] as const,
  detail: (id: string) => ["alkes", "detail", id] as const,
  stats: () => ["alkes", "stats"] as const,
  kalibrasi: (id: string) => ["alkes", "kalibrasi", id] as const,
};

export function useAlkesList(params?: AlkesParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => alkesService.getAll(params),
  });
}

export function useAlkesStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => alkesService.getStats(),
  });
}

export function useAlkesDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => alkesService.getById(id),
    enabled: !!id,
  });
}

export function useAlkesKalibrasi(id: string) {
  return useQuery({
    queryKey: KEYS.kalibrasi(id),
    queryFn: () => alkesService.getKalibrasi(id),
    enabled: !!id,
  });
}

export function useCreateAlkes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAlkesDto) => alkesService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Alkes berhasil ditambahkan.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateAlkes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAlkesDto }) =>
      alkesService.update(id, dto),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      toast.success("Alkes berhasil diperbarui.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteAlkes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alkesService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Alkes berhasil dihapus.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAddKalibrasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateKalibrasiDto }) =>
      alkesService.addKalibrasi(id, dto),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.kalibrasi(id) });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.stats() });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export { KEYS as ALKES_KEYS };
