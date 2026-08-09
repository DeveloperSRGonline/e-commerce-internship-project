import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/db/connect";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import { z } from "zod";

// Query parameter validation schema
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  category: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest"]).optional(),
  q: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Validate query params
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return Response.json(
        { success: false, error: { code: "INVALID_PARAMS", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { page, limit, category, minPrice, maxPrice, sort, q } = parsed.data;

    await connectToDB();

    // Build the query filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {
      isActive: true, // Never expose soft-deleted products
    };

    // Category filter — resolve slug → _id
    if (category) {
      const cat = await Category.findOne({ slug: category }).lean();
      if (!cat) {
        return Response.json(
          { success: true, data: { products: [], total: 0, page, totalPages: 0 } },
          { status: 200 }
        );
      }
      filter.categoryId = cat._id;
    }

    // Price range filter (values are in paise)
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Text search using the text index
    if (q) {
      filter.$text = { $search: q };
    }

    // Sort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sortOption: Record<string, any> = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };
    else if (sort === "newest") sortOption = { createdAt: -1 };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate("categoryId", "name slug")
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return Response.json({
      success: true,
      data: { products, total, page, totalPages },
    });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return Response.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
