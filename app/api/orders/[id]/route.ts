import { connectToDB } from "@/lib/db/connect";
import Order from "@/models/Order.model";
import { requireAuth } from "@/lib/auth";

// GET /api/orders/[id] — get a single order by ID (owned by current user)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return Response.json(
      { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const { id } = await params;

  await connectToDB();

  const order = await Order.findOne({ _id: id, userId: user.userId }).lean();

  if (!order) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Order not found" } },
      { status: 404 }
    );
  }

  return Response.json({ success: true, data: { order } });
}
