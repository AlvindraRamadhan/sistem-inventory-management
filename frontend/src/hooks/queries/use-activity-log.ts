"use client";

import { useQuery } from "@tanstack/react-query";
import { activityLogService, type ActivityLogParams } from "@/services/activity-log.service";

const KEYS = {
  all: ["activity-log"] as const,
  list: (params?: ActivityLogParams) => ["activity-log", "list", params] as const,
};

export function useActivityLogList(params?: ActivityLogParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => activityLogService.getAll(params),
  });
}

export { KEYS as ACTIVITY_LOG_KEYS };
