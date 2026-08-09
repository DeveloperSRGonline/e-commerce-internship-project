import { z } from "zod";

// Schema for creating a review (client-submitted)
export const createReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z.string().trim().optional(),
});

export type CreateReviewType = z.infer<typeof createReviewSchema>;
export type ReviewType = z.infer<typeof createReviewSchema>;
