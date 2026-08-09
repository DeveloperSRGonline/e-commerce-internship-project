import { notFound } from "next/navigation";
import Link from "next/link";
import { connectToDB } from "@/lib/db/connect";
import Category from "@/models/Category.model";
import Product from "@/models/Product.model";
import Navbar from "@/components/ui/Navbar";
import ProductCard from "@/components/product/ProductCard";
import { ChevronRight, Layers } from "lucide-react";

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
  const { slug } = await params;

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
    <div className="min-h-screen bg-[#0a0a0f] text-[#a1a1aa]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[#71717a] mb-10">
          <Link href="/" className="hover:text-white transition-colors">HOME</Link>
          <ChevronRight className="w-3 h-3 text-[#71717a]" />
          <Link href="/products" className="hover:text-white transition-colors">CATALOG</Link>
          <ChevronRight className="w-3 h-3 text-[#71717a]" />
          <span className="text-[#f5f5f7] uppercase">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-12 border-b border-white/[0.06] pb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono uppercase">
            <Layers className="w-3.5 h-3.5" />
            <span>Category Collection</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#f5f5f7] font-display tracking-tight">{category.name}</h1>
          
          {category.description && (
            <p className="text-sm text-[#a1a1aa] max-w-2xl leading-relaxed">{category.description}</p>
          )}

          <span className="text-xs font-mono text-[#71717a] block">{products.length} PRODUCTS AVAILABLE</span>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="glass-panel rounded-3xl p-16 text-center space-y-3">
            <Layers className="w-10 h-10 text-white/20 mx-auto" />
            <h3 className="text-[#f5f5f7] font-semibold text-base font-display">No items in this collection</h3>
            <p className="text-xs text-[#71717a]">Check back later for new arrivals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
