import { notFound } from "next/navigation";
import { connectToDB } from "@/lib/db/connect";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import ProductForm from "@/components/admin/ProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Product — Admin Console | ShopIN" };

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  await connectToDB();

  const [product, categories] = await Promise.all([
    Product.findById(id).lean(),
    Category.find({}).sort({ name: 1 }).lean(),
  ]);

  if (!product) {
    notFound();
  }

  const serializedProduct = {
    _id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    stock: product.stock,
    categoryId: product.categoryId.toString(),
    images: product.images ?? [],
    isActive: product.isActive,
  };

  const serializedCategories = categories.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    slug: c.slug,
  }));

  return (
    <ProductForm
      initialData={serializedProduct}
      categories={serializedCategories}
    />
  );
}
