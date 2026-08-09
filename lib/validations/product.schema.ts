import { z } from "zod";

export const productImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  publicId: z.string().min(1, "Public ID is required"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  slug: z.string().min(1, "Product slug is required").trim().toLowerCase(),
  description: z.string().min(1, "Product description is required").trim(),
  price: z.number().int("Price must be an integer (in paise)").min(0, "Price cannot be negative"),
  stock: z.number().int("Stock must be an integer").min(0, "Stock cannot be negative"),
  categoryId: z.string().min(1, "Category ID is required"),
  images: z.array(productImageSchema).default([]),
  isActive: z.boolean().default(true),
  ratingAvg: z.number().min(0).max(5).default(0),
  ratingCount: z.number().int().min(0).default(0),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  slug: z.string().min(1, "Product slug is required").trim().toLowerCase(),
  description: z.string().min(1, "Product description is required").trim(),
  price: z.number().int("Price must be an integer (in paise)").min(0, "Price cannot be negative"),
  stock: z.number().int("Stock must be an integer").min(0, "Stock cannot be negative"),
  categoryId: z.string().min(1, "Category ID is required"),
  images: z.array(productImageSchema).default([]),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export type ProductType = z.infer<typeof productSchema>;
export type CreateProductType = z.infer<typeof createProductSchema>;
export type UpdateProductType = z.infer<typeof updateProductSchema>;
