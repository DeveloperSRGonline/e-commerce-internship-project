import { connectToDB } from "@/lib/db/connect";
import Category from "@/models/Category.model";
import Product from "@/models/Product.model";
import Link from "next/link";
import { Layers, Plus } from "lucide-react";

export const metadata = { title: "Categories — Admin Console | ShopIN" };

export default async function AdminCategoriesPage() {
  await connectToDB();

  const categories = await Category.find({}).sort({ name: 1 }).lean();

  const categoriesWithStats = await Promise.all(
    categories.map(async (cat) => {
      const count = await Product.countDocuments({ categoryId: cat._id });
      return { ...cat, productCount: count };
    })
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">MANAGEMENT</span>
          <h1 className="text-3xl font-extrabold text-[#f5f5f7] font-display">Product Categories ({categories.length})</h1>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-white/[0.02] text-[#71717a] border-b border-white/[0.06]">
                <th className="text-left px-5 py-4 font-semibold uppercase">CATEGORY NAME</th>
                <th className="text-left px-5 py-4 font-semibold uppercase">SLUG</th>
                <th className="text-left px-5 py-4 font-semibold uppercase">DESCRIPTION</th>
                <th className="text-right px-5 py-4 font-semibold uppercase">PRODUCTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {categoriesWithStats.map((category) => (
                <tr key={category._id.toString()} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-[#f5f5f7] font-semibold text-sm font-display">{category.name}</span>
                  </td>
                  <td className="px-5 py-4 text-indigo-400">{category.slug}</td>
                  <td className="px-5 py-4 text-[#a1a1aa] max-w-xs truncate">{category.description ?? "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                      {category.productCount} ITEMS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
