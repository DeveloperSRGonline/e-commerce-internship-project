import { connectToDB } from "@/lib/db/connect";
import Category from "@/models/Category.model";

export async function GET() {
  try {
    await connectToDB();

    const categories = await Category.find({}).sort({ name: 1 }).lean();

    return Response.json({ success: true, data: { categories } });
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return Response.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
