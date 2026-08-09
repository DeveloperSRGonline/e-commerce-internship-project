import { Suspense } from "react";
import Link from "next/link";
import { connectToDB } from "@/lib/db/connect";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import Navbar from "@/components/ui/Navbar";
import FilterBar from "@/components/product/FilterBar";
import ProductCard from "@/components/product/ProductCard";

// Fetch products server-side (RSC — no exposed API call)
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
  title: "Products — ShopIN",
  description: "Browse our wide selection of electronics, fashion, home goods, books, and more.",
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams; // searchParams is a Promise in Next.js 16
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">All Products</h1>
          <p className="text-white/50 mt-1">
            {total === 0
              ? "No products found"
              : `Showing ${(page - 1) * 12 + 1}–${Math.min(page * 12, total)} of ${total} products`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <Suspense fallback={<div className="h-96 bg-white/5 rounded-2xl animate-pulse" />}>
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
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-white/60 text-lg font-medium">No products found</h3>
                <p className="text-white/30 text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {products.map((product: any) => (
                  <ProductCard key={product._id.toString()} product={{ ...product, _id: product._id.toString() }} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                {page > 1 && (
                  <Link
                    href={`/products?${new URLSearchParams({ ...params as Record<string, string>, page: String(page - 1) })}`}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm transition-all"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="text-white/50 text-sm">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/products?${new URLSearchParams({ ...params as Record<string, string>, page: String(page + 1) })}`}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm transition-all"
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
