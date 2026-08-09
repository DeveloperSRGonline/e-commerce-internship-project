import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { connectToDB } from "@/lib/db/connect";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import Review from "@/models/Review.model";
import Navbar from "@/components/ui/Navbar";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { Star, ShieldCheck, ArrowRight, ChevronRight, Package, Truck, RefreshCw } from "lucide-react";

async function getProduct(slug: string) {
  await connectToDB();
  const product = await Product.findOne({ slug, isActive: true })
    .populate("categoryId", "name slug")
    .lean();
  return product;
}

async function getReviews(productId: string) {
  const reviews = await Review.find({ productId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("userId", "name")
    .lean();
  return reviews;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product Not Found — ShopIN" };
  return {
    title: `${product.name} — ShopIN`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const reviews = await getReviews(product._id.toString());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const category = product.categoryId as any;

  // Real Unsplash dummy fallback image matching the product name
  const fallbackImage = `https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop`;
  const mainImageUrl = product.images?.[0]?.url || fallbackImage;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#a1a1aa]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[#71717a] mb-10">
          <Link href="/" className="hover:text-white transition-colors">HOME</Link>
          <ChevronRight className="w-3 h-3 text-[#71717a]" />
          <Link href="/products" className="hover:text-white transition-colors">CATALOG</Link>
          {category && (
            <>
              <ChevronRight className="w-3 h-3 text-[#71717a]" />
              <Link href={`/categories/${category.slug}`} className="hover:text-white transition-colors uppercase">{category.name}</Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-[#71717a]" />
          <span className="text-[#f5f5f7] truncate max-w-xs uppercase">{product.name}</span>
        </nav>

        {/* Product Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Visual Gallery (Left) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[4/3] glass-panel rounded-3xl overflow-hidden border border-white/[0.1] bg-[#14141f]">
              <Image
                src={mainImageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            </div>

            {/* Thumbnail gallery */}
            {product.images?.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pt-2">
                {product.images.map((img, i) => (
                  <div key={i} className="relative w-24 h-20 flex-shrink-0 glass-panel rounded-xl overflow-hidden border border-white/10">
                    <Image src={img.url || fallbackImage} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="96px" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Specifications & Order Box (Right) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              {category && (
                <Link href={`/categories/${category.slug}`} className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  {category.name}
                </Link>
              )}

              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#f5f5f7] font-display leading-tight">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-4 h-4 ${star <= Math.round(product.ratingAvg) ? "text-indigo-400 fill-indigo-400" : "text-white/10"}`} />
                  ))}
                </div>
                <span className="text-xs font-mono text-[#71717a]">{product.ratingAvg.toFixed(1)} ({product.ratingCount} reviews)</span>
              </div>
            </div>

            {/* Price & Stock Container */}
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-mono text-[#71717a] block mb-1">PRICE INCL. GST</span>
                  <span className="text-4xl font-bold text-[#f5f5f7] font-display">
                    ₹{(product.price / 100).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full font-mono text-xs uppercase font-semibold ${product.stock > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                  {product.stock > 0 ? `${product.stock} IN STOCK` : "OUT OF STOCK"}
                </span>
              </div>

              <p className="text-xs text-[#a1a1aa] leading-relaxed pt-2 border-t border-white/[0.06]">{product.description}</p>

              {/* Add to Cart Component */}
              <AddToCartButton
                productId={product._id.toString()}
                stock={product.stock}
              />
            </div>

            {/* Value Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="glass-panel p-4 rounded-xl text-center space-y-1">
                <Truck className="w-5 h-5 text-indigo-400 mx-auto" />
                <span className="text-[11px] font-mono text-[#f5f5f7] block">Fast Shipping</span>
              </div>
              <div className="glass-panel p-4 rounded-xl text-center space-y-1">
                <ShieldCheck className="w-5 h-5 text-indigo-400 mx-auto" />
                <span className="text-[11px] font-mono text-[#f5f5f7] block">Razorpay Auth</span>
              </div>
              <div className="glass-panel p-4 rounded-xl text-center space-y-1">
                <RefreshCw className="w-5 h-5 text-indigo-400 mx-auto" />
                <span className="text-[11px] font-mono text-[#f5f5f7] block">7-Day Return</span>
              </div>
            </div>

          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="border-t border-white/[0.06] pt-12">
          <h2 className="text-2xl font-bold text-[#f5f5f7] font-display mb-8">Verified Customer Reviews</h2>
          {reviews.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-xs font-mono text-[#71717a]">
              NO REVIEWS FOR THIS PRODUCT YET
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {reviews.map((review: any) => (
                <div key={review._id.toString()} className="glass-panel rounded-2xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#f5f5f7] font-display">{review.userId?.name ?? "Customer"}</span>
                    <span className="text-[11px] font-mono text-[#71717a]">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? "text-indigo-400 fill-indigo-400" : "text-white/10"}`} />
                    ))}
                  </div>
                  {review.comment && <p className="text-xs text-[#a1a1aa] leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
