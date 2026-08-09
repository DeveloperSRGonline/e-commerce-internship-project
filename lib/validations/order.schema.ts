import { z } from "zod";

// Address snapshot schema (mirrors the user address shape)
export const addressSnapshotSchema = z.object({
  label: z.string().min(1, "Address label is required"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be a 6-digit number"),
  isDefault: z.boolean().default(false),
});

// Order item snapshot schema
export const orderItemSnapshotSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  nameSnapshot: z.string().min(1, "Product name snapshot is required"),
  priceSnapshot: z.number().int("Price must be in paise (integer)").min(0, "Price cannot be negative"),
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
  lineTotal: z.number().int("Line total must be in paise (integer)").min(0, "Line total cannot be negative"),
});

// Payment schema
export const paymentSchema = z.object({
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  status: z.enum(["created", "paid", "failed", "refunded"]).default("created"),
});

// Schema for creating an order (server-side internal use only)
export const createOrderSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  items: z.array(orderItemSnapshotSchema).min(1, "Order must have at least one item"),
  shippingAddressSnapshot: addressSnapshotSchema,
  subtotal: z.number().int("Subtotal must be in paise (integer)").min(0, "Subtotal cannot be negative"),
  tax: z.number().int("Tax must be in paise (integer)").min(0, "Tax cannot be negative"),
  total: z.number().int("Total must be in paise (integer)").min(0, "Total cannot be negative"),
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).default("pending"),
  payment: paymentSchema.optional(),
});

// Valid order statuses — used to enforce the state machine
export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

// Schema for admin status update (enforces the state machine via the handler)
export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, `Status must be one of: ${ORDER_STATUSES.join(", ")}`),
});

// Checkout confirm body schema
export const confirmCheckoutSchema = z.object({
  razorpayOrderId: z.string().min(1, "Razorpay order ID is required"),
  razorpayPaymentId: z.string().min(1, "Razorpay payment ID is required"),
  razorpaySignature: z.string().min(1, "Razorpay signature is required"),
});

export type CreateOrderType = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusType = z.infer<typeof updateOrderStatusSchema>;
export type OrderType = z.infer<typeof createOrderSchema>;
export type ConfirmCheckoutType = z.infer<typeof confirmCheckoutSchema>;
