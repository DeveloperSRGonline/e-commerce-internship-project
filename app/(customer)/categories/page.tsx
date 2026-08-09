import { connectToDB } from "@/lib/db/connect";
import Category from "@/models/Category.model";
import Product from "@/models/Product.model";
import Navbar from "@/components/ui/Navbar";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";
import { Layers, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Categories — ShopIN Pro",
  description: "Browse product categories and collections.",
};

const categoryIcons: Record<string, string> = {
  electronics: "⚡",
  fashion: "✨",
  "home-kitchen": "🛠️",
  books: "📖",
  groceries: "📦",
  "personal-care": "💎",
};

export default async function CategoriesPage() {
  await connectToDB();

  const categories = await Category.find({}).sort({ name: 1 }).lean();
  
  // Count active products for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const count = await Product.countDocuments({ categoryId: cat._id, isActive: true });
      return { ...cat, productCount: count };
    })
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#a1a1aa]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        <div className="mb-12 border-b border-white/[0.06] pb-8">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">COLLECTIONS</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#f5f5f7] font-display">Product Categories</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesWithCount.map((category) => (
            <Link
              key={category._id.toString()}
              href={`/categories/${category.slug}`}
              className="glass-panel-interactive rounded-2xl p-8 space-y-6 flex flex-col justify-between group border border-white/[0.08]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{categoryIcons[category.slug] ?? "🛍️"}</span>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-xs">
                    {category.productCount} ITEMS
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#f5f5f7] font-display group-hover:text-indigo-300 transition-colors">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-xs text-[#71717a] mt-2 leading-relaxed line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-indigo-400 group-hover:text-indigo-300">
                <span>VIEW COLLECTION</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
