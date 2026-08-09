import { connectToDB } from "@/lib/db/connect";
import Cart from "@/models/Cart.model";
import Product from "@/models/Product.model";
import { requireAuth } from "@/lib/auth";

// GET /api/cart — fetch current user's cart with live prices
export async function GET() {
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
    return Response.json({ success: true, data: { items: [], subtotal: 0, tax: 0, total: 0 } });
  }

  // Re-fetch live prices — never store prices in cart
  const productIds = cart.items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  const enrichedItems = cart.items
    .map((item) => {
      const product = productMap[item.productId.toString()];
      if (!product) return null; // Product was deleted or deactivated
      return {
        productId: item.productId.toString(),
        name: product.name,
        slug: product.slug,
        price: product.price, // Live price in paise
        image: product.images?.[0]?.url ?? null,
        quantity: item.quantity,
        stock: product.stock,
        lineTotal: product.price * item.quantity,
      };
    })
    .filter(Boolean);

  const subtotal = enrichedItems.reduce((sum, i) => sum + (i?.lineTotal ?? 0), 0);
  const tax = Math.round(subtotal * 0.18); // 18% GST
  const total = subtotal + tax;

  return Response.json({
    success: true,
    data: { items: enrichedItems, subtotal, tax, total },
  });
}

// DELETE /api/cart — clear entire cart
export async function DELETE() {
  const user = await requireAuth();
  if (!user) {
    return Response.json(
      { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  await connectToDB();
  await Cart.deleteOne({ userId: user.userId });

  return Response.json({ success: true, data: { message: "Cart cleared" } });
}
