import { connectToDB } from "@/lib/db/connect";
import Category from "@/models/Category.model";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "New Product — Admin Console | ShopIN" };

export default async function NewProductPage() {
  await connectToDB();

  const categories = await Category.find({}).sort({ name: 1 }).lean();

  const serializedCategories = categories.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    slug: c.slug,
  }));

  return <ProductForm categories={serializedCategories} />;
}
