"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierService, type SupplierParams, type CreateSupplierDto } from "@/services/supplier.service";
import { toast } from "sonner";

const KEYS = {
  all: ["supplier"] as const,
  list: (params?: SupplierParams) => ["supplier", "list", params] as const,
  detail: (id: string) => ["supplier", "detail", id] as const,
  stats: () => ["supplier", "stats"] as const,
};

export function useSupplierList(params?: SupplierParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => supplierService.getAll(params),
  });
}

export function useSupplierDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => supplierService.getById(id),
    enabled: !!id,
  });
}

export function useSupplierStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => supplierService.getStats(),
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSupplierDto) => supplierService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Supplier berhasil ditambahkan.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSupplier(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateSupplierDto>) => supplierService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Supplier berhasil diperbarui.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supplierService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Supplier berhasil dihapus.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleSupplierActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supplierService.toggleActive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Status supplier diperbarui.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
