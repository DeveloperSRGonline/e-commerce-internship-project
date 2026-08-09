import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/db/connect";
import Order from "@/models/Order.model";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
});

// GET /api/admin/orders — list all orders (admin)
export async function GET(request: NextRequest) {
  const notAuthorized = await requireAdmin();
  if (notAuthorized) return notAuthorized;

  const { searchParams } = request.nextUrl;
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { code: "INVALID_PARAMS", message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { page, status } = parsed.data;
  const limit = 20;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (status) filter.status = status;

  await connectToDB();

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name email")
      .lean(),
    Order.countDocuments(filter),
  ]);

  return Response.json({
    success: true,
    data: { orders, total, page, totalPages: Math.ceil(total / limit) },
  });
}
