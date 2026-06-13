"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  defektaService,
  type DefektaParams,
  type CreateDefektaDto,
  type ApproveDefektaDto,
  type RejectDefektaDto,
} from "@/services/defekta.service";

const KEYS = {
  all: ["defekta"] as const,
  list: (params?: DefektaParams) => ["defekta", "list", params] as const,
  detail: (id: string) => ["defekta", "detail", id] as const,
  stats: () => ["defekta", "stats"] as const,
};

export function useDefektaList(params?: DefektaParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => defektaService.getAll(params),
  });
}

export function useDefektaDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => defektaService.getById(id),
    enabled: !!id,
  });
}

export function useDefektaStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => defektaService.getStats(),
  });
}

export function useCreateDefekta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDefektaDto) => defektaService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Laporan defekta berhasil dikirim.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useApproveDefekta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ApproveDefektaDto }) =>
      defektaService.approve(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Defekta disetujui untuk pemusnahan.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRejectDefekta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RejectDefektaDto }) =>
      defektaService.reject(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Laporan defekta ditolak, stok dikembalikan.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMarkDestroyedDefekta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => defektaService.markDestroyed(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Defekta ditandai telah dimusnahkan.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export { KEYS as DEFEKTA_KEYS };
