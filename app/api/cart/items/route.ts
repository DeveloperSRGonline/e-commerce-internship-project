import { connectToDB } from "@/lib/db/connect";
import Cart from "@/models/Cart.model";
import Product from "@/models/Product.model";
import { requireAuth } from "@/lib/auth";
import { addToCartSchema } from "@/lib/validations/cart.schema";

// POST /api/cart/items — add/update item in cart
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

  const parsed = addToCartSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { code: "INVALID_PARAMS", message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { productId, quantity } = parsed.data;

  await connectToDB();

  // Verify product exists, is active, and has enough stock
  const product = await Product.findOne({ _id: productId, isActive: true }).lean();
  if (!product) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Product not found or unavailable" } },
      { status: 404 }
    );
  }

  if (product.stock < quantity) {
    return Response.json(
      { success: false, error: { code: "INSUFFICIENT_STOCK", message: `Only ${product.stock} items available` } },
      { status: 409 }
    );
  }

  // Upsert: if cart exists, update item; if not, create new cart
  const cart = await Cart.findOne({ userId: user.userId });

  if (!cart) {
    await Cart.create({
      userId: user.userId,
      items: [{ productId, quantity }],
    });
  } else {
    const existingIndex = cart.items.findIndex(
      (i) => i.productId.toString() === productId
    );

    if (existingIndex >= 0) {
      // Update quantity
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        return Response.json(
          { success: false, error: { code: "INSUFFICIENT_STOCK", message: `Only ${product.stock} items available` } },
          { status: 409 }
        );
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({ productId: product._id, quantity });
    }

    await cart.save();
  }

  return Response.json(
    { success: true, data: { message: "Item added to cart" } },
    { status: 201 }
  );
}
