import { notFound } from "next/navigation";
import Link from "next/link";
import { connectToDB } from "@/lib/db/connect";
import Category from "@/models/Category.model";
import Product from "@/models/Product.model";
import Navbar from "@/components/ui/Navbar";
import ProductCard from "@/components/product/ProductCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  await connectToDB();
  const category = await Category.findOne({ slug }).lean();
  if (!category) return { title: "Category Not Found — ShopIN" };
  return {
    title: `${category.name} — ShopIN`,
    description: category.description ?? `Shop ${category.name} products on ShopIN`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params; // params is a Promise in Next.js 16

  await connectToDB();

  const category = await Category.findOne({ slug }).lean();
  if (!category) {
    notFound();
  }

  const products = await Product.find({ categoryId: category._id, isActive: true })
    .sort({ createdAt: -1 })
    .populate("categoryId", "name slug")
    .lean();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-white/40 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
            <span>/</span>
            <span className="text-white/70">{category.name}</span>
          </nav>

          <h1 className="text-3xl font-bold text-white">{category.name}</h1>
          {category.description && (
            <p className="text-white/50 mt-2">{category.description}</p>
          )}
          <p className="text-white/30 mt-1 text-sm">{products.length} products</p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-white/60 text-lg font-medium">No products in this category</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {products.map((product: any) => (
              <ProductCard key={product._id.toString()} product={{ ...product, _id: product._id.toString() }} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
