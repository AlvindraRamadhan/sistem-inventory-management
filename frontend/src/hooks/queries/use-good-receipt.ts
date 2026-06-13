"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goodReceiptService, type GRParams, type CreateGRDto, type ReviewGRDto } from "@/services/good-receipt.service";
import { toast } from "sonner";

const KEYS = {
  all: ["good-receipt"] as const,
  list: (params?: GRParams) => ["good-receipt", "list", params] as const,
  detail: (id: string) => ["good-receipt", "detail", id] as const,
  receivablePOs: () => ["good-receipt", "receivable-pos"] as const,
};

export function useGRList(params?: GRParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => goodReceiptService.getAll(params),
  });
}

export function useGRDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => goodReceiptService.getById(id),
    enabled: !!id,
  });
}

export function useReceivablePOs() {
  return useQuery({
    queryKey: KEYS.receivablePOs(),
    queryFn: () => goodReceiptService.getReceivablePOs(),
  });
}

export function useCreateGR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGRDto) => goodReceiptService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["purchase-order"] });
      toast.success("Good Receipt berhasil dibuat.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteGR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goodReceiptService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Good Receipt berhasil dihapus.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSubmitGRQC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goodReceiptService.submitQC(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("QC Good Receipt berhasil disubmit.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSaveDraftGR() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: import("@/services/good-receipt.service").SaveDraftGRDto }) =>
      goodReceiptService.saveDraft(id, payload),
    onSuccess: () => toast.success("Draft tersimpan."),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReviewGR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewGRDto }) =>
      goodReceiptService.review(id, payload),
    onSuccess: (_, { payload }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["obat"] });
      const label = payload.action === "approve" ? "disetujui" : payload.action === "reject" ? "ditolak" : "dikembalikan";
      toast.success(`Good Receipt berhasil ${label}.`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
