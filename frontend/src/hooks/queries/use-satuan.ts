"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  satuanService,
  type CreateSatuanDto,
  type UpdateSatuanDto,
} from "@/services/satuan.service"
import { toast } from "sonner"

const KEYS = {
  all: ["satuan"] as const,
  list: () => ["satuan", "list"] as const,
  detail: (id: string) => ["satuan", "detail", id] as const,
}

export function useSatuanList() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: () => satuanService.getAll(),
    staleTime: 300_000,
  })
}

export function useSatuanDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => satuanService.getById(id),
    enabled: !!id,
  })
}

export function useCreateSatuan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSatuanDto) => satuanService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success("Satuan berhasil ditambahkan")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateSatuan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSatuanDto }) =>
      satuanService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success("Satuan berhasil diperbarui")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteSatuan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => satuanService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success("Satuan berhasil dihapus")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
