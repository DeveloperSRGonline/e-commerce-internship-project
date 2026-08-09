import Link from "next/link";
import { connectToDB } from "@/lib/db/connect";
import Product from "@/models/Product.model";
import AdminProductActions from "./AdminProductActions";

async function getProducts(page: number) {
  await connectToDB();
  const limit = 20;
  const [products, total] = await Promise.all([
    Product.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoryId", "name slug")
      .lean(),
    Product.countDocuments({}),
  ]);
  return { products, total, totalPages: Math.ceil(total / limit) };
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export const metadata = { title: "Products — Admin | ShopIN" };

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1"));
  const { products, total, totalPages } = await getProducts(page);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-white/40 text-sm mt-1">{total} total products</p>
        </div>
        <Link
          href="/admin/products/new"
          id="add-product-btn"
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl text-sm transition-all"
        >
          + Add Product
        </Link>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-white/40 border-b border-white/10">
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-right px-4 py-3 font-medium">Price</th>
                <th className="text-right px-4 py-3 font-medium">Stock</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {products.map((product: any) => (
                <tr key={product._id.toString()} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium truncate max-w-[200px]">{product.name}</p>
                      <p className="text-white/30 text-xs">{product.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/60">{product.categoryId?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-white text-right">₹{(product.price / 100).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${product.stock === 0 ? "text-red-400" : product.stock < 5 ? "text-orange-400" : "text-green-400"}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AdminProductActions productId={product._id.toString()} isActive={product.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex justify-center gap-3">
            {page > 1 && (
              <Link href={`/admin/products?page=${page - 1}`} className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">← Prev</Link>
            )}
            <span className="text-white/40 text-sm py-1.5">Page {page}/{totalPages}</span>
            {page < totalPages && (
              <Link href={`/admin/products?page=${page + 1}`} className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">Next →</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
