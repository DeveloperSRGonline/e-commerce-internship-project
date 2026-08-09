"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Save, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface ProductData {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  price: number; // in rupees for form
  stock: number;
  categoryId: string;
  images: { url: string; publicId: string }[];
  isActive: boolean;
}

export default function ProductForm({
  initialData,
  categories,
}: {
  initialData?: ProductData;
  categories: Category[];
}) {
  const router = useRouter();
  const isEditing = !!initialData?._id;

  const [formData, setFormData] = useState({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    description: initialData?.description ?? "",
    price: initialData?.price ? (initialData.price / 100).toString() : "",
    stock: initialData?.stock?.toString() ?? "0",
    categoryId: initialData?.categoryId ?? categories[0]?._id ?? "",
    imageUrl: initialData?.images?.[0]?.url ?? "",
    isActive: initialData?.isActive ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function handleNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEditing
        ? prev.slug
        : name
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-"),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const priceInPaise = Math.round(parseFloat(formData.price) * 100);
      const stockInt = parseInt(formData.stock, 10);

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price: priceInPaise,
        stock: stockInt,
        categoryId: formData.categoryId,
        images: formData.imageUrl
          ? [{ url: formData.imageUrl, publicId: `img_${Date.now()}` }]
          : [],
        isActive: formData.isActive,
      };

      const url = isEditing
        ? `/api/admin/products/${initialData._id}`
        : "/api/admin/products";

      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to save product");
      }

      setSuccessMsg(isEditing ? "Product updated successfully!" : "Product created successfully!");
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-[#71717a] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">
              INVENTORY MANAGEMENT
            </span>
            <h1 className="text-3xl font-extrabold text-[#f5f5f7] font-display">
              {isEditing ? "Edit Product" : "Add New Product"}
            </h1>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary px-6 py-2.5 text-xs uppercase font-mono tracking-wider flex items-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isEditing ? "Save Changes" : "Create Product"}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Core Fields */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
            <h2 className="text-sm font-bold text-[#f5f5f7] font-display uppercase tracking-wider text-indigo-400">
              Basic Details
            </h2>

            <div>
              <label className="block text-xs font-mono text-[#71717a] mb-1.5 uppercase">Product Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Wireless Noise-Cancelling Earbuds"
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-mono text-[#f5f5f7] focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#71717a] mb-1.5 uppercase">Product Slug</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-mono text-[#f5f5f7] focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#71717a] mb-1.5 uppercase">Description</label>
              <textarea
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide detailed product specifications and features..."
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-mono text-[#f5f5f7] focus:outline-none focus:border-indigo-500/50 resize-none"
              />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
            <h2 className="text-sm font-bold text-[#f5f5f7] font-display uppercase tracking-wider text-indigo-400">
              Pricing & Stock
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#71717a] mb-1.5 uppercase">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="2999"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-mono text-[#f5f5f7] focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#71717a] mb-1.5 uppercase">Stock Units</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="50"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-mono text-[#f5f5f7] focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Category & Media */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
            <h2 className="text-sm font-bold text-[#f5f5f7] font-display uppercase tracking-wider text-indigo-400">
              Organization
            </h2>

            <div>
              <label className="block text-xs font-mono text-[#71717a] mb-1.5 uppercase">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#14141f] border border-white/[0.08] rounded-xl text-xs font-mono text-[#f5f5f7] focus:outline-none focus:border-indigo-500/50"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded bg-white/5 border-white/10 text-indigo-600 focus:ring-0"
                />
                <span className="text-xs font-mono text-[#f5f5f7]">Active in Catalog</span>
              </label>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
            <h2 className="text-sm font-bold text-[#f5f5f7] font-display uppercase tracking-wider text-indigo-400">
              Product Image URL
            </h2>

            <div>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-mono text-[#f5f5f7] focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {formData.imageUrl && (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-[#14141f]">
                <Image
                  src={formData.imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
