import { connectToDB } from "@/lib/db/connect";
import Product from "@/models/Product.model";
import { requireAdmin } from "@/lib/auth";
import { updateProductSchema } from "@/lib/validations/product.schema";

// PATCH /api/admin/products/[id] — update product
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

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { code: "INVALID_PARAMS", message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  await connectToDB();

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: parsed.data },
    { new: true, runValidators: true }
  ).lean();

  if (!product) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Product not found" } },
      { status: 404 }
    );
  }

  return Response.json({ success: true, data: { product } });
}

// DELETE /api/admin/products/[id] — soft delete (set isActive: false)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const notAuthorized = await requireAdmin();
  if (notAuthorized) return notAuthorized;

  const { id } = await params;

  await connectToDB();

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true }
  ).lean();

  if (!product) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Product not found" } },
      { status: 404 }
    );
  }

  return Response.json({ success: true, data: { message: "Product deactivated" } });
}
