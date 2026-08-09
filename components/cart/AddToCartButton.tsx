"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Minus, Plus, Check, AlertCircle, Loader2 } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";

export default function AddToCartButton({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { refreshCartCount, triggerBounce } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (stock === 0) {
    return (
      <div className="w-full py-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-center text-xs font-mono font-semibold uppercase tracking-wider">
        Product Unavailable
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
        // Trigger pulse/bounce animation on top navbar cart badge
        triggerBounce();
        await refreshCartCount();

        setMessage({ type: "success", text: `Added ${quantity} item(s) to cart` });
        setTimeout(() => setMessage(null), 3500);
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
    <div className="space-y-4 pt-2">
      {/* Quantity Selector */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-[#71717a] uppercase">QUANTITY</span>
        <div className="flex items-center bg-[#14141f] border border-white/10 rounded-xl overflow-hidden">
          <button
            id="qty-decrease-btn"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-2.5 text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-4 py-1 text-sm font-semibold font-mono text-[#f5f5f7]">{quantity}</span>
          <button
            id="qty-increase-btn"
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
            className="p-2.5 text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        id="add-to-cart-btn"
        onClick={handleAddToCart}
        disabled={isLoading}
        className="btn-primary w-full py-4 text-xs tracking-wider uppercase flex items-center justify-center gap-2 transform active:scale-95 transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Adding to Cart...</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Order</span>
          </>
        )}
      </button>

      {/* Feedback Message */}
      {message && (
        <div className={`p-3 rounded-xl text-xs font-mono flex items-center justify-center gap-2 animate-in fade-in duration-200 ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
          {message.type === "success" ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
