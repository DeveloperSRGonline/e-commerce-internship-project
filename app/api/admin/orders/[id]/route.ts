import { connectToDB } from "@/lib/db/connect";
import Order from "@/models/Order.model";
import { requireAdmin } from "@/lib/auth";
import { updateOrderStatusSchema } from "@/lib/validations/order.schema";

// PATCH /api/admin/orders/[id] — update order status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const notAuthorized = await requireAdmin();
  if (notAuthorized) return notAuthorized;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: { code: "INVALID_JSON", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const parsed = updateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { code: "INVALID_PARAMS", message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { status } = parsed.data;

  await connectToDB();

  // Enforce status state machine:
  // pending → confirmed → shipped → delivered (or any → cancelled)
  const order = await Order.findById(id).lean();
  if (!order) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Order not found" } },
      { status: 404 }
    );
  }

  const validTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["shipped", "cancelled"],
    shipped: ["delivered", "cancelled"],
    delivered: [], // Terminal state
    cancelled: [], // Terminal state
  };

  if (!validTransitions[order.status]?.includes(status)) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_TRANSITION",
          message: `Cannot transition from "${order.status}" to "${status}"`,
        },
      },
      { status: 409 }
    );
  }

  const updated = await Order.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true }
  ).lean();

  return Response.json({ success: true, data: { order: updated } });
}
