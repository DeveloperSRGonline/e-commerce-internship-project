import { Suspense } from "react";
import Link from "next/link";
import { connectToDB } from "@/lib/db/connect";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import Navbar from "@/components/ui/Navbar";
import FilterBar from "@/components/product/FilterBar";
import ProductCard from "@/components/product/ProductCard";

async function getProducts(searchParams: Record<string, string | string[] | undefined>) {
  await connectToDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { isActive: true };

  const page = Math.max(1, parseInt(String(searchParams.page ?? "1")));
  const limit = 12;
  const skip = (page - 1) * limit;

  // Category filter
  const categorySlug = String(searchParams.category ?? "");
  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug }).lean();
    if (cat) filter.categoryId = cat._id;
  }

  // Price range (in paise)
  const minPrice = parseInt(String(searchParams.minPrice ?? ""));
  const maxPrice = parseInt(String(searchParams.maxPrice ?? ""));
  if (!isNaN(minPrice) || !isNaN(maxPrice)) {
    filter.price = {};
    if (!isNaN(minPrice)) filter.price.$gte = minPrice;
    if (!isNaN(maxPrice)) filter.price.$lte = maxPrice;
  }

  // Text search
  const q = String(searchParams.q ?? "");
  if (q) filter.$text = { $search: q };

  // Sort
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sortOption: Record<string, any> = { createdAt: -1 };
  const sort = String(searchParams.sort ?? "");
  if (sort === "price_asc") sortOption = { price: 1 };
  else if (sort === "price_desc") sortOption = { price: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name slug")
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { products, total, page, totalPages: Math.ceil(total / limit) };
}

async function getCategories() {
  await connectToDB();
  return Category.find({}).sort({ name: 1 }).lean();
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata = {
  title: "Catalog — ShopIN",
  description: "Browse curated electronics, apparel, and home essentials.",
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [{ products, total, page, totalPages }, categories] = await Promise.all([
    getProducts(params),
    getCategories(),
  ]);

  const currentCategory = String(params.category ?? "");
  const currentSort = String(params.sort ?? "");
  const currentQuery = String(params.q ?? "");
  const currentMinPrice = params.minPrice ? parseInt(String(params.minPrice)) : undefined;
  const currentMaxPrice = params.maxPrice ? parseInt(String(params.maxPrice)) : undefined;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#a1a1aa]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.06] pb-8">
          <div>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-2">COLLECTION</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#f5f5f7] font-display">Product Catalog</h1>
          </div>
          <p className="text-xs font-mono text-[#71717a]">
            {total === 0
              ? "0 MATCHES"
              : `SHOWING ${(page - 1) * 12 + 1}–${Math.min(page * 12, total)} OF ${total} ITEMS`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <Suspense fallback={<div className="h-96 glass-panel rounded-2xl animate-pulse" />}>
              <FilterBar
                categories={categories.map((c) => ({
                  _id: c._id.toString(),
                  name: c.name,
                  slug: c.slug,
                }))}
                currentCategory={currentCategory || undefined}
                currentMinPrice={currentMinPrice}
                currentMaxPrice={currentMaxPrice}
                currentSort={currentSort || undefined}
                currentQuery={currentQuery || undefined}
              />
            </Suspense>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="glass-panel rounded-3xl p-16 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-xl">
                  🔍
                </div>
                <h3 className="text-[#f5f5f7] text-lg font-semibold font-display">No matching items found</h3>
                <p className="text-xs text-[#71717a] max-w-sm mx-auto">
                  Try clearing your search query or adjusting your category and price range parameters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {products.map((product: any) => (
                  <ProductCard key={product._id.toString()} product={{ ...product, _id: product._id.toString() }} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4 border-t border-white/[0.06] pt-8">
                {page > 1 && (
                  <Link
                    href={`/products?${new URLSearchParams({ ...params as Record<string, string>, page: String(page - 1) })}`}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="text-xs font-mono text-[#71717a]">
                  PAGE {page} OF {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/products?${new URLSearchParams({ ...params as Record<string, string>, page: String(page + 1) })}`}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
