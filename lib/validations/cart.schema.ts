import { z } from "zod";

// Schema for adding an item to cart
export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
});

// Schema for updating a cart item's quantity
export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
});

export type AddToCartType = z.infer<typeof addToCartSchema>;
export type UpdateCartItemType = z.infer<typeof updateCartItemSchema>;
export type CartType = {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  updatedAt: Date;
};
