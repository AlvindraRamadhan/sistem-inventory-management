"use client";

import { useQuery } from "@tanstack/react-query";
import { batchService, type BatchParams } from "@/services/batch.service";

const KEYS = {
  all: ["batch"] as const,
  list: (params?: BatchParams) => ["batch", "list", params] as const,
};

export function useBatchList(params?: BatchParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => batchService.getAll(params),
  });
}

export { KEYS as BATCH_KEYS };
