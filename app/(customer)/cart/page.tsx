"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import Navbar from "@/components/ui/Navbar";

interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
  stock: number;
  lineTotal: number;
}

interface CartData {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success) setCartData(data.data);
    } catch {
      console.error("Failed to fetch cart");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  async function updateQuantity(productId: string, newQty: number) {
    if (newQty < 1) return removeItem(productId);

    setUpdatingId(productId);
    try {
      await fetch(`/api/cart/items/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      await fetchCart();
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(productId: string) {
    setUpdatingId(productId);
    try {
      await fetch(`/api/cart/items/${productId}`, { method: "DELETE" });
      await fetchCart();
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCheckout() {
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/checkout/create-order", { method: "POST" });
      const data = await res.json();

      if (!data.success) {
        alert(data.error?.message ?? "Checkout failed");
        return;
      }

      const {
        razorpayOrderId,
        amount,
        keyId,
        userName,
        userEmail,
      } = data.data;

      // Load Razorpay SDK dynamically
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay({
          key: keyId,
          amount,
          currency: "INR",
          order_id: razorpayOrderId,
          name: "ShopIN Pro",
          description: "Order Checkout",
          prefill: { name: userName, email: userEmail },
          theme: { color: "#4f46e5" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const confirmRes = await fetch("/api/checkout/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                shippingAddressIndex: 0,
              }),
            });

            const confirmData = await confirmRes.json();
            if (confirmData.success) {
              router.push(`/orders/${confirmData.data.orderId}?success=true`);
            } else {
              console.error("[Razorpay Verification Error]:", confirmData);
              const errorMsg = confirmData?.error?.message || "Payment verification failed. Please contact support.";
              alert(`Payment Verification Issue: ${errorMsg}`);
            }
          },
          modal: {
            ondismiss: () => setIsCheckingOut(false),
          },
        });

        rzp.open();
      };

      document.body.appendChild(script);
    } catch {
      setIsCheckingOut(false);
      alert("Checkout failed. Please try again.");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#a1a1aa] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const isEmpty = !cartData || cartData.items.length === 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#a1a1aa]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
        <div className="mb-10 border-b border-white/[0.06] pb-6">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">BAG</span>
          <h1 className="text-3xl font-extrabold text-[#f5f5f7] font-display">Shopping Cart</h1>
        </div>

        {isEmpty ? (
          <div className="glass-panel rounded-3xl p-16 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-white/20 mx-auto" />
            <h2 className="text-[#f5f5f7] text-lg font-bold font-display">Your cart is empty</h2>
            <p className="text-xs text-[#71717a] max-w-xs mx-auto">
              Explore our curated catalog and add products to your cart.
            </p>
            <div className="pt-2">
              <Link href="/products" className="btn-primary inline-flex px-6 py-3 text-xs tracking-wider uppercase">
                Explore Catalog
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {cartData?.items.map((item) => (
                <div key={item.productId} className="glass-panel rounded-2xl p-5 flex gap-5 items-center">
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-[#14141f] border border-white/10">
                    <Image
                      src={item.image || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop`}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.slug}`} className="text-[#f5f5f7] font-semibold text-base font-display hover:text-indigo-300 transition-colors line-clamp-1">
                      {item.name}
                    </Link>
                    <p className="text-xs font-mono text-[#71717a] mt-1">₹{(item.price / 100).toLocaleString("en-IN")} EACH</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#14141f] border border-white/10 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={updatingId === item.productId}
                        className="p-2 text-[#a1a1aa] hover:text-white disabled:opacity-40 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1 font-mono text-xs font-semibold text-[#f5f5f7]">
                        {updatingId === item.productId ? "..." : item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={updatingId === item.productId || item.quantity >= item.stock}
                        className="p-2 text-[#a1a1aa] hover:text-white disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      id={`remove-item-${item.productId}`}
                      onClick={() => removeItem(item.productId)}
                      disabled={updatingId === item.productId}
                      className="p-2 text-rose-400/60 hover:text-rose-400 disabled:opacity-40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right min-w-[5rem]">
                    <span className="text-[#f5f5f7] font-bold font-display text-base">
                      ₹{(item.lineTotal / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Side Panel */}
            <div className="lg:col-span-4">
              <div className="glass-panel rounded-2xl p-6 space-y-6 sticky top-28 border border-white/[0.1]">
                <h2 className="text-lg font-bold text-[#f5f5f7] font-display">Order Summary</h2>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#71717a]">SUBTOTAL</span>
                    <span className="text-[#f5f5f7]">₹{(cartData.subtotal / 100).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717a]">ESTIMATED GST (18%)</span>
                    <span className="text-[#f5f5f7]">₹{(cartData.tax / 100).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t border-white/[0.06] pt-3 flex justify-between text-sm font-bold">
                    <span className="text-[#f5f5f7] font-display">TOTAL AMOUNT</span>
                    <span className="text-indigo-400 font-display text-base">
                      ₹{(cartData.total / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <button
                  id="checkout-btn"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="btn-primary w-full py-4 text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Initiating Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-[#71717a] pt-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Secured by Razorpay</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
