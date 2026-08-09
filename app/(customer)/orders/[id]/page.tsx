import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectToDB } from "@/lib/db/connect";
import Order from "@/models/Order.model";
import Navbar from "@/components/ui/Navbar";

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}

export const metadata = { title: "Order Details — ShopIN" };

export default async function OrderDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login?callbackUrl=/orders");

  const { id } = await params;
  const { success } = await searchParams;

  await connectToDB();
  const order = await Order.findOne({ _id: id, userId: session.user.userId }).lean();

  if (!order) notFound();

  const stepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Success banner */}
        {success === "true" && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-2xl p-5 mb-6 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <h2 className="text-green-400 font-bold text-lg">Payment Successful!</h2>
            <p className="text-green-400/70 text-sm mt-1">Your order has been placed and is being processed.</p>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/orders" className="hover:text-white transition-colors">My Orders</Link>
          <span>/</span>
          <span className="text-white/70">Order #{id.slice(-8).toUpperCase()}</span>
        </div>

        {/* Order Status */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white font-bold text-lg">Order Details</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status] ?? "bg-white/10 text-white/60 border-white/20"}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          {/* Progress Bar */}
          {order.status !== "cancelled" && (
            <div className="flex items-center gap-0 mt-2 mb-4 relative">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 ${i <= stepIndex ? "bg-purple-500 text-white" : "bg-white/10 text-white/30"}`}>
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 ${i < stepIndex ? "bg-purple-500" : "bg-white/10"}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-white/40">Order Date</p>
              <p className="text-white font-medium mt-1">
                {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-white/40">Payment</p>
              <p className="text-white font-medium mt-1 capitalize">{order.payment.status}</p>
            </div>
            <div>
              <p className="text-white/40">Order ID</p>
              <p className="text-white font-medium mt-1 font-mono text-xs">{id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Items Ordered</h2>
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
                <div className="flex-1">
                  <p className="text-white font-medium">{item.nameSnapshot}</p>
                  <p className="text-white/40 text-sm">Qty: {item.quantity} × ₹{(item.priceSnapshot / 100).toLocaleString("en-IN")}</p>
                </div>
                <p className="text-white font-semibold">₹{(item.lineTotal / 100).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Subtotal</span>
              <span className="text-white">₹{(order.subtotal / 100).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">GST (18%)</span>
              <span className="text-white">₹{(order.tax / 100).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-2">
              <span className="text-white">Total Paid</span>
              <span className="text-white">₹{(order.total / 100).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-3">Shipping Address</h2>
          <div className="text-white/60 text-sm space-y-1">
            <p className="text-white font-medium">{order.shippingAddressSnapshot.label}</p>
            <p>{order.shippingAddressSnapshot.line1}</p>
            {order.shippingAddressSnapshot.line2 && <p>{order.shippingAddressSnapshot.line2}</p>}
            <p>{order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.state} — {order.shippingAddressSnapshot.pincode}</p>
          </div>
        </div>

        <div className="mt-6">
          <Link href="/orders" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
            ← Back to Orders
          </Link>
        </div>
      </main>
    </div>
  );
}
