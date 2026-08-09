import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/db/connect";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import { requireAdmin } from "@/lib/auth";
import { createProductSchema } from "@/lib/validations/product.schema";

// GET /api/admin/products — list all products (including inactive)
export async function GET(request: NextRequest) {
  const notAuthorized = await requireAdmin();
  if (notAuthorized) return notAuthorized;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  await connectToDB();

  const [products, total] = await Promise.all([
    Product.find({}) // Admin sees ALL products, including isActive: false
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoryId", "name slug")
      .lean(),
    Product.countDocuments({}),
  ]);

  return Response.json({
    success: true,
    data: { products, total, page, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/admin/products — create a new product
export async function POST(request: Request) {
  const notAuthorized = await requireAdmin();
  if (notAuthorized) return notAuthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: { code: "INVALID_JSON", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { code: "INVALID_PARAMS", message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const data = parsed.data;

  await connectToDB();

  // Verify category exists
  const category = await Category.findById(data.categoryId).lean();
  if (!category) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Category not found" } },
      { status: 404 }
    );
  }

  // Check slug uniqueness
  const existing = await Product.findOne({ slug: data.slug }).lean();
  if (existing) {
    return Response.json(
      { success: false, error: { code: "CONFLICT", message: "A product with this slug already exists" } },
      { status: 409 }
    );
  }

  const product = await Product.create(data);

  return Response.json({ success: true, data: { product } }, { status: 201 });
}
