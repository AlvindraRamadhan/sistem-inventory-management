"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsService, type ParetoAnalysisParams } from "@/services/analytics.service"

export const ANALYTICS_KEYS = {
  dashboard: ["analytics", "dashboard"] as const,
  weeklyMovement: ["analytics", "weekly-movement"] as const,
  pareto: (params: ParetoAnalysisParams) => ["analytics", "pareto", params] as const,
  safetyStock: ["analytics", "safety-stock"] as const,
  fastSlow: ["analytics", "fast-slow"] as const,
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.dashboard,
    queryFn: () => analyticsService.getDashboardStats(),
    staleTime: 60_000,
  })
}

export function useWeeklyMovement() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.weeklyMovement,
    queryFn: () => analyticsService.getWeeklyMovement(),
    staleTime: 300_000,
  })
}

export function useParetoAnalysis(params: ParetoAnalysisParams) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.pareto(params),
    queryFn: () => analyticsService.getParetoAnalysis(params),
    staleTime: 300_000,
  })
}

export function useSafetyStock() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.safetyStock,
    queryFn: () => analyticsService.getSafetyStock(),
    staleTime: 120_000,
  })
}

export function useFastSlowItems() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.fastSlow,
    queryFn: () => analyticsService.getFastSlowItems(),
    staleTime: 300_000,
  })
}
