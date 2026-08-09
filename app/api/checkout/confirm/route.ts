import crypto from "crypto";
import mongoose from "mongoose";
import { connectToDB } from "@/lib/db/connect";
import Cart from "@/models/Cart.model";
import Product from "@/models/Product.model";
import Order from "@/models/Order.model";
import User from "@/models/User.model";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const confirmSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  shippingAddressIndex: z.number().int().min(0).default(0),
});

// POST /api/checkout/confirm — verify payment signature and create order
export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) {
    return Response.json(
      { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: { code: "INVALID_JSON", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { code: "INVALID_PARAMS", message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, shippingAddressIndex } = parsed.data;

  // ── Verify Razorpay signature ─────────────────────────────────────────────
  // This is the single most critical security check — prevents fake payment confirmations
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return Response.json(
      { success: false, error: { code: "INVALID_SIGNATURE", message: "Payment verification failed" } },
      { status: 400 }
    );
  }

  await connectToDB();

  // ── Re-fetch cart and live prices ─────────────────────────────────────────
  const cart = await Cart.findOne({ userId: user.userId }).lean();
  if (!cart || cart.items.length === 0) {
    return Response.json(
      { success: false, error: { code: "EMPTY_CART", message: "Cart is empty" } },
      { status: 400 }
    );
  }

  const productIds = cart.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  // Build order items with snapshots
  const items = cart.items.map((item) => {
    const product = productMap[item.productId.toString()];
    if (!product) throw new Error(`Product ${item.productId} unavailable`);
    return {
      productId: product._id,
      nameSnapshot: product.name,
      priceSnapshot: product.price,
      quantity: item.quantity,
      lineTotal: product.price * item.quantity,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  // Get shipping address with fallback for fresh/test accounts
  const dbUser = await User.findById(user.userId).lean();
  const address = dbUser?.addresses?.[shippingAddressIndex] ?? dbUser?.addresses?.[0] ?? {
    label: "Primary",
    line1: "123 Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    isDefault: true,
  };

  // ── Create order and update stock in a single session ─────────────────────
  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      // Create the order
      [order] = await Order.create(
        [
          {
            userId: user.userId,
            items,
            shippingAddressSnapshot: address,
            subtotal,
            tax,
            total,
            status: "confirmed",
            payment: {
              razorpayOrderId,
              razorpayPaymentId,
              status: "paid",
            },
          },
        ],
        { session }
      );

      // Decrement stock for each product
      for (const item of items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { session }
        );
      }

      // Clear the cart
      await Cart.deleteOne({ userId: user.userId }, { session });
    });
  } catch (error) {
    await session.endSession();
    console.error("[checkout/confirm] Transaction failed:", error);
    return Response.json(
      { success: false, error: { code: "ORDER_FAILED", message: "Order creation failed. Please contact support." } },
      { status: 500 }
    );
  }

  await session.endSession();

  return Response.json(
    { success: true, data: { orderId: order!._id.toString(), total } },
    { status: 201 }
  );
}
