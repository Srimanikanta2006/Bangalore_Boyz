import { z } from 'zod';

/** Shared query pagination schema (used by list validators). */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Parse raw (already validated) query values into pagination offsets. */
export function resolvePagination(query: { page?: unknown; limit?: unknown }) {
  const { page, limit } = paginationQuerySchema.parse(query);
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/** Standard paginated payload shape: { items: T[], pagination: {...} } */
export function buildPaginated<T>(items: T[], total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pagination: PageMeta = {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
  return { items, pagination };
}
