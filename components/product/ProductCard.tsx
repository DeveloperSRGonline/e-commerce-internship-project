import Link from "next/link";
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number; // In paise
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  images: { url: string; publicId: string }[];
  categoryId: { name: string; slug: string } | string;
}

function StarRating({ avg, count }: { avg: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-3.5 h-3.5 ${star <= Math.round(avg) ? "text-yellow-400" : "text-white/20"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-white/40 text-xs">({count})</span>
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const priceInRupees = product.price / 100;
  const category = typeof product.categoryId === "object" ? product.categoryId : null;
  const imageUrl = product.images?.[0]?.url;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10">
        {/* Image */}
        <div className="relative aspect-square bg-gradient-to-br from-white/5 to-white/10 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          )}

          {/* Stock badge */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-500/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
          {product.stock > 0 && product.stock < 5 && (
            <div className="absolute top-2 right-2">
              <span className="bg-orange-500/90 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                Only {product.stock} left
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Category */}
          {category && (
            <span className="text-purple-400 text-xs font-medium uppercase tracking-wider">
              {category.name}
            </span>
          )}

          {/* Name */}
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 group-hover:text-purple-300 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <StarRating avg={product.ratingAvg} count={product.ratingCount} />

          {/* Price */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xl font-bold text-white">
              ₹{priceInRupees.toLocaleString("en-IN")}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${product.stock > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              {product.stock > 0 ? "In Stock" : "Sold Out"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
