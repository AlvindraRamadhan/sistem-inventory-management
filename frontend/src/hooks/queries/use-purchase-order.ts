"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseOrderService, type POParams, type CreatePODto, type UpdatePOStatusDto } from "@/services/purchase-order.service";
import { toast } from "sonner";

const KEYS = {
  all: ["purchase-order"] as const,
  list: (params?: POParams) => ["purchase-order", "list", params] as const,
  detail: (id: string) => ["purchase-order", "detail", id] as const,
  stats: () => ["purchase-order", "stats"] as const,
};

export function usePOList(params?: POParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => purchaseOrderService.getAll(params),
  });
}

export function usePODetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => purchaseOrderService.getById(id),
    enabled: !!id,
  });
}

export function usePOStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => purchaseOrderService.getStats(),
  });
}

export function useCreatePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePODto) => purchaseOrderService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Purchase Order berhasil dibuat.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrderService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Purchase Order berhasil dihapus.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePOStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePOStatusDto }) =>
      purchaseOrderService.updateStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Status PO berhasil diperbarui.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
