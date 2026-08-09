import Link from "next/link";
import { connectToDB } from "@/lib/db/connect";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminProductActions from "./AdminProductActions";
import { Plus, Package } from "lucide-react";

async function getProducts(page: number, search?: string) {
  await connectToDB();
  // Register Category model
  const _ = Category;
  const limit = 20;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoryId", "name slug")
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { products, total, totalPages: Math.ceil(total / limit) };
}

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export const metadata = { title: "Products — Admin Console | ShopIN" };

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { page: pageParam, search } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1"));
  const { products, total, totalPages } = await getProducts(page, search);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">INVENTORY</span>
          <h1 className="text-3xl font-extrabold text-[#f5f5f7] font-display">Product Catalog ({total})</h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AdminSearchInput placeholder="Search catalog items..." />
          <Link
            href="/admin/products/new"
            id="add-product-btn"
            className="btn-primary px-4 py-2 text-xs uppercase font-mono tracking-wider flex items-center gap-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-white/[0.02] text-[#71717a] border-b border-white/[0.06]">
                <th className="text-left px-5 py-4 font-semibold uppercase">PRODUCT</th>
                <th className="text-left px-5 py-4 font-semibold uppercase">CATEGORY</th>
                <th className="text-right px-5 py-4 font-semibold uppercase">PRICE</th>
                <th className="text-right px-5 py-4 font-semibold uppercase">STOCK</th>
                <th className="text-center px-5 py-4 font-semibold uppercase">STATUS</th>
                <th className="text-right px-5 py-4 font-semibold uppercase">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {products.map((product: any) => (
                <tr key={product._id.toString()} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-[#f5f5f7] font-semibold text-sm font-display truncate max-w-[240px]">{product.name}</p>
                      <p className="text-[#71717a] text-[11px] font-mono mt-0.5">{product.slug}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#a1a1aa]">{product.categoryId?.name ?? "—"}</td>
                  <td className="px-5 py-4 text-[#f5f5f7] text-right font-bold">₹{(product.price / 100).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`font-bold ${product.stock === 0 ? "text-rose-400" : product.stock < 5 ? "text-amber-400" : "text-emerald-400"}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold border ${product.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                      {product.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <AdminProductActions productId={product._id.toString()} isActive={product.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/[0.06] flex justify-center gap-3 text-xs font-mono">
            {page > 1 && (
              <Link href={`/admin/products?page=${page - 1}`} className="btn-secondary px-3 py-1.5">← PREV</Link>
            )}
            <span className="text-[#71717a] py-1.5">PAGE {page}/{totalPages}</span>
            {page < totalPages && (
              <Link href={`/admin/products?page=${page + 1}`} className="btn-secondary px-3 py-1.5">NEXT →</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
