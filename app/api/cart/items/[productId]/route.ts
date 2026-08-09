import { connectToDB } from "@/lib/db/connect";
import Cart from "@/models/Cart.model";
import Product from "@/models/Product.model";
import { requireAuth } from "@/lib/auth";
import { updateCartItemSchema } from "@/lib/validations/cart.schema";

// PATCH /api/cart/items/[productId] — update quantity
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return Response.json(
      { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const { productId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: { code: "INVALID_JSON", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const parsed = updateCartItemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { code: "INVALID_PARAMS", message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { quantity } = parsed.data;

  await connectToDB();

  // Verify stock
  const product = await Product.findOne({ _id: productId, isActive: true }).lean();
  if (!product) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Product not found" } },
      { status: 404 }
    );
  }

  if (product.stock < quantity) {
    return Response.json(
      { success: false, error: { code: "INSUFFICIENT_STOCK", message: `Only ${product.stock} items available` } },
      { status: 409 }
    );
  }

  const result = await Cart.updateOne(
    { userId: user.userId, "items.productId": productId },
    { $set: { "items.$.quantity": quantity } }
  );

  if (result.matchedCount === 0) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Item not found in cart" } },
      { status: 404 }
    );
  }

  return Response.json({ success: true, data: { message: "Cart updated" } });
}

// DELETE /api/cart/items/[productId] — remove item from cart
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return Response.json(
      { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const { productId } = await params;

  await connectToDB();

  await Cart.updateOne(
    { userId: user.userId },
    { $pull: { items: { productId } } }
  );

  return Response.json({ success: true, data: { message: "Item removed from cart" } });
}
