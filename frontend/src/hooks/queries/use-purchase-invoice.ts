"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseInvoiceService, type InvoiceParams, type CreateInvoiceDto, type UpdatePaymentDto } from "@/services/purchase-invoice.service";
import { toast } from "sonner";

const KEYS = {
  all: ["purchase-invoice"] as const,
  list: (params?: InvoiceParams) => ["purchase-invoice", "list", params] as const,
  detail: (id: string) => ["purchase-invoice", "detail", id] as const,
  stats: () => ["purchase-invoice", "stats"] as const,
  availableGRs: () => ["purchase-invoice", "available-grs"] as const,
};

export function useInvoiceList(params?: InvoiceParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => purchaseInvoiceService.getAll(params),
  });
}

export function useInvoiceDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => purchaseInvoiceService.getById(id),
    enabled: !!id,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => purchaseInvoiceService.getStats(),
  });
}

export function useAvailableGRsForInvoice() {
  return useQuery({
    queryKey: KEYS.availableGRs(),
    queryFn: () => purchaseInvoiceService.getAvailableGRs(),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoiceDto) => purchaseInvoiceService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Invoice berhasil dibuat.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseInvoiceService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Invoice berhasil dihapus.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateInvoicePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePaymentDto }) =>
      purchaseInvoiceService.updatePayment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Status pembayaran berhasil diperbarui.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
