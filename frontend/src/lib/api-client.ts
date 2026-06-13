/** Generic paginated response shape */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Generic single-item response */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Simulate async delay (for realistic mock UX) */
export function mockDelay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Helper to paginate an in-memory array */
export function paginate<T>(
  items: T[],
  page = 1,
  limit = 10
): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    meta: { total, page, limit, totalPages },
  };
}
