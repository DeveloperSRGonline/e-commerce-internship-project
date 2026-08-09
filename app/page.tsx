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
  title: "ShopIN — Premium Curated Commerce",
  description: "High-grade electronics, tech accessories, lifestyle items & home essentials.",
};

export default async function HomePage() {
  const { categories, featuredProducts } = await getFeaturedData();

  const categoryIcons: Record<string, string> = {
    electronics: "⚡",
    fashion: "✨",
    "home-kitchen": "🛠️",
    books: "📖",
    groceries: "📦",
    "personal-care": "💎",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#a1a1aa] selection:bg-indigo-500 selection:text-white relative">
      <Navbar />

      {/* Ambient background glows */}
      <div className="glow-ambient top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15" />
      <div className="glow-ambient top-[400px] left-[10%] w-[400px] h-[300px] bg-violet-600/10" />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-28 lg:pb-32 overflow-hidden border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                Next-Gen Indian Commerce
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold text-[#f5f5f7] tracking-tight font-display leading-[1.05]">
                Curated essentials <br />
                <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  engineered for longevity.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#a1a1aa] max-w-xl leading-relaxed">
                Discover a focused catalog of consumer electronics, apparel, and lifestyle hardware. Server-authoritative checkout with instant Razorpay dispatch.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/products"
                  className="btn-primary px-8 py-4 text-sm flex items-center justify-center gap-2 group"
                >
                  <span>Explore Full Catalog</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link
                  href="/categories"
                  className="btn-secondary px-8 py-4 text-sm flex items-center justify-center"
                >
                  Browse Categories
                </Link>
              </div>

              {/* Stats Bar */}
              <div className="pt-8 border-t border-white/[0.06] grid grid-cols-3 gap-6">
                <div>
                  <span className="text-2xl font-bold text-[#f5f5f7] font-display block">100%</span>
                  <span className="text-xs text-[#71717a] font-mono">AUTHENTIC</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#f5f5f7] font-display block">24-48h</span>
                  <span className="text-xs text-[#71717a] font-mono">DISPATCH</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#f5f5f7] font-display block">INR 0</span>
                  <span className="text-xs text-[#71717a] font-mono">PLATFORM FEE</span>
                </div>
              </div>
            </div>

            {/* Hero Right Visual / Asymmetrical Card Stack */}
            <div className="lg:col-span-5 relative">
              <div className="relative glass-panel rounded-3xl p-6 border border-white/[0.12] shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">FEATURED SPOTLIGHT</span>
                  <span className="text-xs text-[#71717a] font-mono">LIMITED STOCK</span>
                </div>

                <div className="relative aspect-video rounded-2xl bg-[#14141f] overflow-hidden border border-white/[0.08]">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 to-slate-900/80 flex items-center justify-center">
                    <div className="text-center space-y-2 p-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-300 text-xl">
                        ⚡
                      </div>
                      <p className="text-sm font-semibold text-[#f5f5f7] font-display">Premium Hardware Collection</p>
                      <p className="text-xs text-[#71717a]">Precision crafted for performance</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#f5f5f7] font-semibold">Direct Fulfillment Guarantee</span>
                    <span className="text-emerald-400 font-mono text-xs">Verified</span>
                  </div>
                  <p className="text-xs text-[#71717a] leading-relaxed">
                    All items pass strict quality verification before warehousing. Verified serials and instant digital receipts.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-2">INDEX</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f5f5f7] font-display">Browse Collections</h2>
          </div>
          <Link href="/products" className="text-xs font-mono text-[#a1a1aa] hover:text-indigo-400 transition-colors uppercase tracking-wider">
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category._id.toString()}
              href={`/categories/${category.slug}`}
              className="glass-panel-interactive rounded-2xl p-6 text-left flex flex-col justify-between h-36 group"
            >
              <span className="text-2xl">{categoryIcons[category.slug] ?? "📦"}</span>
              <div>
                <h3 className="text-[#f5f5f7] font-semibold text-sm group-hover:text-indigo-300 transition-colors font-display">
                  {category.name}
                </h3>
                <span className="text-[11px] font-mono text-[#71717a] block mt-0.5">Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-20 border-t border-white/[0.06]">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-2">CURATED</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f5f5f7] font-display">Featured Products</h2>
          </div>
          <Link href="/products" className="text-xs font-mono text-[#a1a1aa] hover:text-indigo-400 transition-colors uppercase tracking-wider">
            All Products →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {featuredProducts.map((product: any) => (
            <ProductCard
              key={product._id.toString()}
              product={{ ...product, _id: product._id.toString() }}
            />
          ))}
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-20 border-t border-white/[0.06]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "🛡️", title: "Razorpay Protected", desc: "256-bit encryption with instant refund routing on cancellations." },
            { icon: "⚡", title: "Express Dispatch", desc: "Prioritized order fulfillment from regional logistics hubs." },
            { icon: "🔄", title: "7-Day Replacement", desc: "Hassle-free return policy with dedicated support resolution." },
          ].map((feat) => (
            <div key={feat.title} className="glass-panel rounded-2xl p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl text-indigo-400">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-[#f5f5f7] font-display">{feat.title}</h3>
              <p className="text-sm text-[#71717a] leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono text-[#71717a]">
          <div>
            © {new Date().getFullYear()} ShopIN Inc. Engineered with Next.js 16, Auth.js & Razorpay.
          </div>
          <div className="flex gap-6">
            <Link href="/products" className="hover:text-white transition-colors">Catalog</Link>
            <Link href="/login" className="hover:text-white transition-colors">Account</Link>
            <Link href="/admin" className="hover:text-indigo-400 transition-colors">Admin Console</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}