import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/db/connect";
import Review from "@/models/Review.model";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // params is a Promise in Next.js 16
    const { searchParams } = request.nextUrl;

    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return Response.json(
        { success: false, error: { code: "INVALID_PARAMS", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    await connectToDB();

    const [reviews, total] = await Promise.all([
      Review.find({ productId: id })
        .sort({ createdAt: -1 }) // Uses { productId: 1, createdAt: -1 } index
        .skip(skip)
        .limit(limit)
        .populate("userId", "name") // Only return name, not email
        .lean(),
      Review.countDocuments({ productId: id }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return Response.json({ success: true, data: { reviews, total, page, totalPages } });
  } catch (error) {
    console.error("[GET /api/products/[id]/reviews]", error);
    return Response.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
