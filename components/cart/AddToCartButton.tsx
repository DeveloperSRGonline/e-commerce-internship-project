"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AddToCartButton({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (stock === 0) {
    return (
      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1 py-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-center font-medium">
          Out of Stock
        </div>
      </div>
    );
  }

  async function handleAddToCart() {
    if (!session) {
      router.push("/login?callbackUrl=/cart");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: `Added ${quantity} item(s) to cart!` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error?.message ?? "Failed to add to cart" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <label className="text-white/60 text-sm">Qty:</label>
        <div className="flex items-center bg-white/10 border border-white/20 rounded-xl overflow-hidden">
          <button
            id="qty-decrease-btn"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            −
          </button>
          <span className="px-4 py-2 text-white font-semibold min-w-[2rem] text-center">{quantity}</span>
          <button
            id="qty-increase-btn"
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
            className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            +
          </button>
        </div>
        <span className="text-white/30 text-sm">{stock} available</span>
      </div>

      {/* Add to Cart button */}
      <button
        id="add-to-cart-btn"
        onClick={handleAddToCart}
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg hover:shadow-purple-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Adding...
          </span>
        ) : (
          "🛒 Add to Cart"
        )}
      </button>

      {/* Feedback message */}
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm text-center font-medium ${message.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
