"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  kategoriService,
  type CreateKategoriDto,
  type UpdateKategoriDto,
} from "@/services/kategori.service"
import { toast } from "sonner"

const KEYS = {
  all: ["kategori"] as const,
  list: () => ["kategori", "list"] as const,
  detail: (id: string) => ["kategori", "detail", id] as const,
}

export function useKategoriList() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: () => kategoriService.getAll(),
    staleTime: 300_000,
  })
}

export function useKategoriDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => kategoriService.getById(id),
    enabled: !!id,
  })
}

export function useCreateKategori() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateKategoriDto) => kategoriService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success("Kategori berhasil ditambahkan")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateKategori() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKategoriDto }) =>
      kategoriService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success("Kategori berhasil diperbarui")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteKategori() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => kategoriService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success("Kategori berhasil dihapus")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
