import { connectToDB } from "@/lib/db/connect";
import Cart from "@/models/Cart.model";
import Product from "@/models/Product.model";
import User from "@/models/User.model";
import { requireAuth } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";

// POST /api/checkout/create-order — create Razorpay order
export async function POST() {
  const user = await requireAuth();
  if (!user) {
    return Response.json(
      { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  await connectToDB();

  const cart = await Cart.findOne({ userId: user.userId }).lean();
  if (!cart || cart.items.length === 0) {
    return Response.json(
      { success: false, error: { code: "EMPTY_CART", message: "Cart is empty" } },
      { status: 400 }
    );
  }

  // Re-fetch live prices and validate stock
  const productIds = cart.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  for (const item of cart.items) {
    const product = productMap[item.productId.toString()];
    if (!product) {
      return Response.json(
        { success: false, error: { code: "PRODUCT_UNAVAILABLE", message: "A product in your cart is no longer available" } },
        { status: 409 }
      );
    }
    if (product.stock < item.quantity) {
      return Response.json(
        { success: false, error: { code: "INSUFFICIENT_STOCK", message: `Insufficient stock for ${product.name}` } },
        { status: 409 }
      );
    }
    subtotal += product.price * item.quantity;
  }

  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax; // total in paise

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: total, // Razorpay expects amount in paise
    currency: "INR",
    receipt: `rcpt_${user.userId.slice(-10)}_${Date.now().toString().slice(-8)}`,
  });

  // Get user data for shipping address
  const dbUser = await User.findById(user.userId).lean();

  return Response.json({
    success: true,
    data: {
      razorpayOrderId: razorpayOrder.id,
      amount: total,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      userName: dbUser?.name ?? "",
      userEmail: dbUser?.email ?? "",
      addresses: dbUser?.addresses ?? [],
    },
  });
}
