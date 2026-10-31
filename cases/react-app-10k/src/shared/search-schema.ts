import { z } from 'zod';

export const searchSchema = z.object({
  query: z.string().max(100).catch(''),
  activeOnly: z.boolean().catch(false),
  page: z.coerce.number().int().min(1).max(3).catch(1),
  sort: z.enum(['name', 'amount', 'updatedAt']).catch('name'),
});

export type WorkspaceSearch = z.infer<typeof searchSchema>;
