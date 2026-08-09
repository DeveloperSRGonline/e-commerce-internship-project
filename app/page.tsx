import Link from "next/link";
import { connectToDB } from "@/lib/db/connect";
import Category from "@/models/Category.model";
import Product from "@/models/Product.model";
import Navbar from "@/components/ui/Navbar";
import ProductCard from "@/components/product/ProductCard";

async function getFeaturedData() {
  await connectToDB();
  const [categories, featuredProducts] = await Promise.all([
    Category.find({}).sort({ name: 1 }).limit(6).lean(),
    Product.find({ isActive: true })
      .sort({ ratingCount: -1 })
      .limit(8)
      .populate("categoryId", "name slug")
      .lean(),
  ]);
  return { categories, featuredProducts };
}

export const metadata = {
  title: "ShopIN — India's Premium E-Commerce Platform",
  description: "Discover quality products across electronics, fashion, home & kitchen, books, groceries, and personal care. Secure checkout with Razorpay.",
};

export default async function HomePage() {
  const { categories, featuredProducts } = await getFeaturedData();

  const categoryIcons: Record<string, string> = {
    electronics: "💻",
    fashion: "👗",
    "home-kitchen": "🏠",
    books: "📚",
    groceries: "🌾",
    "personal-care": "✨",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 text-purple-300 text-sm font-medium mb-6">
            🇮🇳 Made in India, For India
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Shop Smart,<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Shop India
            </span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            Discover thousands of quality products with secure checkout powered by Razorpay. From electronics to groceries — all at great prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              id="shop-now-btn"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-purple-500/40 transition-all duration-200 transform hover:scale-105"
            >
              Shop Now →
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-2xl transition-all duration-200"
            >
              Join Free
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Shop by Category</h2>
          <Link href="/products" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category._id.toString()}
              href={`/categories/${category.slug}`}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-3xl mb-3">{categoryIcons[category.slug] ?? "🛍️"}</div>
              <p className="text-white text-sm font-medium group-hover:text-purple-300 transition-colors">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Featured Products</h2>
          <Link href="/products" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {featuredProducts.map((product: any) => (
            <ProductCard
              key={product._id.toString()}
              product={{ ...product, _id: product._id.toString() }}
            />
          ))}
        </div>
      </section>

      {/* Features Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "🔒", title: "Secure Payments", desc: "Powered by Razorpay with 100% secure transactions" },
            { icon: "🚀", title: "Fast Delivery", desc: "Quick delivery across India for all orders" },
            { icon: "↩️", title: "Easy Returns", desc: "Hassle-free returns within 7 days" },
          ].map((feat) => (
            <div key={feat.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">{feat.icon}</div>
              <h3 className="text-white font-semibold mb-1">{feat.title}</h3>
              <p className="text-white/40 text-sm">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white/30 text-sm">
          © {new Date().getFullYear()} ShopIN. Built with Next.js, MongoDB & Razorpay.
        </div>
      </footer>
    </div>
  );
}