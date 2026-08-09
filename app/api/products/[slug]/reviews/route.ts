import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/db/connect";
import Review from "@/models/Review.model";
import Product from "@/models/Product.model";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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

    const product = await Product.findOne({ slug, isActive: true }).lean();
    if (!product) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    const [reviews, total] = await Promise.all([
      Review.find({ productId: product._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name")
        .lean(),
      Review.countDocuments({ productId: product._id }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return Response.json({ success: true, data: { reviews, total, page, totalPages } });
  } catch (error) {
    console.error("[GET /api/products/[slug]/reviews]", error);
    return Response.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
