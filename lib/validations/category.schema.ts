import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
  slug: z.string().min(1, "Category slug is required").trim().toLowerCase(),
  description: z.string().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
  slug: z.string().min(1, "Category slug is required").trim().toLowerCase(),
  description: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CategoryType = z.infer<typeof categorySchema>;
export type CreateCategoryType = z.infer<typeof createCategorySchema>;
export type UpdateCategoryType = z.infer<typeof updateCategorySchema>;
