"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminProductActions({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const router = useRouter();

  async function handleToggleStatus() {
    if (!isActive) return; // Only can deactivate (not re-activate from this UI)

    if (!confirm("Deactivate this product? It will be hidden from customers.")) return;

    await fetch(`/api/admin/products/${productId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <Link
        href={`/admin/products/${productId}/edit`}
        id={`edit-product-${productId}`}
        className="px-3 py-1.5 text-xs text-purple-400 hover:text-white border border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/20 rounded-lg transition-all"
      >
        Edit
      </Link>
      {isActive && (
        <button
          id={`deactivate-product-${productId}`}
          onClick={handleToggleStatus}
          className="px-3 py-1.5 text-xs text-red-400 hover:text-white border border-red-500/30 hover:border-red-500 hover:bg-red-500/20 rounded-lg transition-all"
        >
          Deactivate
        </button>
      )}
    </div>
  );
}
