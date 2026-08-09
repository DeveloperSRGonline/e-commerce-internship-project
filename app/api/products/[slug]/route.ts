import { connectToDB } from "@/lib/db/connect";
import Product from "@/models/Product.model";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params; // params is a Promise in Next.js 16

    await connectToDB();

    const product = await Product.findOne({ slug, isActive: true })
      .populate("categoryId", "name slug")
      .lean();

    if (!product) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: { product } });
  } catch (error) {
    console.error("[GET /api/products/[slug]]", error);
    return Response.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
