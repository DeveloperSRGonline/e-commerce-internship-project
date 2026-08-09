"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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
          name: "ShopIN",
          description: "Purchase on ShopIN",
          prefill: { name: userName, email: userEmail },
          theme: { color: "#a855f7" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            // Confirm payment server-side
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
              alert("Payment verification failed. Please contact support.");
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white/50">Loading cart...</div>
      </div>
    );
  }

  const isEmpty = !cartData || cartData.items.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Your Cart</h1>

        {isEmpty ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-white/60 text-lg font-medium mb-2">Your cart is empty</h2>
            <p className="text-white/30 text-sm mb-6">Add some products to get started</p>
            <Link
              href="/products"
              className="inline-flex px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Items */}
            <div className="flex-1 space-y-4">
              {cartData?.items.map((item) => (
                <div key={item.productId} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center">
                  {/* Image */}
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white/10">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">🛍️</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.slug}`} className="text-white font-medium hover:text-purple-300 transition-colors line-clamp-2">
                      {item.name}
                    </Link>
                    <p className="text-white/40 text-sm mt-1">₹{(item.price / 100).toLocaleString("en-IN")} each</p>
                    {item.stock < 5 && (
                      <p className="text-orange-400 text-xs mt-1">Only {item.stock} left</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white/10 border border-white/20 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={updatingId === item.productId}
                        className="px-3 py-2 text-white/60 hover:text-white disabled:opacity-50 transition-colors"
                      >
                        −
                      </button>
                      <span className="px-3 py-2 text-white min-w-[2rem] text-center text-sm">
                        {updatingId === item.productId ? "..." : item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={updatingId === item.productId || item.quantity >= item.stock}
                        className="px-3 py-2 text-white/60 hover:text-white disabled:opacity-50 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      id={`remove-item-${item.productId}`}
                      onClick={() => removeItem(item.productId)}
                      disabled={updatingId === item.productId}
                      className="p-2 text-red-400/60 hover:text-red-400 disabled:opacity-50 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="text-white font-semibold text-right min-w-[5rem]">
                    ₹{(item.lineTotal / 100).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-24">
                <h2 className="text-white font-semibold text-lg mb-5">Order Summary</h2>
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Subtotal</span>
                    <span className="text-white">₹{(cartData.subtotal / 100).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">GST (18%)</span>
                    <span className="text-white">₹{(cartData.tax / 100).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-white text-lg">₹{(cartData.total / 100).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <button
                  id="checkout-btn"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isCheckingOut ? "Processing..." : "Proceed to Payment →"}
                </button>

                <p className="text-white/30 text-xs text-center mt-3">
                  🔒 Secured by Razorpay
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
