import { connectToDB } from "@/lib/db/connect";
import Order from "@/models/Order.model";
import { requireAuth } from "@/lib/auth";

// GET /api/orders — get current user's orders
export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return Response.json(
      { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  await connectToDB();

  const orders = await Order.find({ userId: user.userId })
    .sort({ createdAt: -1 }) // Newest first, uses { userId, createdAt } index
    .lean();

  return Response.json({ success: true, data: { orders } });
}
