import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectToDB } from "@/lib/db/connect";
import Order from "@/models/Order.model";
import Navbar from "@/components/ui/Navbar";
import { CheckCircle2, ChevronRight, ArrowLeft, ShieldCheck, MapPin, PackageCheck } from "lucide-react";

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  shipped: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}

export const metadata = { title: "Order Detail — ShopIN" };

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
    <div className="min-h-screen bg-[#0a0a0f] text-[#a1a1aa]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-12">
        {/* Success Banner */}
        {success === "true" && (
          <div className="glass-panel rounded-2xl p-6 mb-8 border border-emerald-500/30 bg-emerald-500/10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h2 className="text-emerald-400 font-bold text-lg font-display">Order Confirmed & Paid</h2>
            <p className="text-xs font-mono text-emerald-300/80">
              Payment verified via Razorpay. Your order is queued for fulfillment.
            </p>
          </div>
        )}

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[#71717a] mb-8">
          <Link href="/orders" className="hover:text-white transition-colors">MY ORDERS</Link>
          <ChevronRight className="w-3 h-3 text-[#71717a]" />
          <span className="text-[#f5f5f7]">ORDER #{id.slice(-8).toUpperCase()}</span>
        </nav>

        {/* Order Progress Header */}
        <div className="glass-panel rounded-2xl p-6 mb-6 border border-white/[0.08] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-[#71717a] block">ORDER ID</span>
              <h1 className="text-xl font-bold text-[#f5f5f7] font-mono">#{id.toUpperCase()}</h1>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase border ${STATUS_COLORS[order.status] ?? "bg-white/10 text-white/60"}`}>
              {order.status}
            </span>
          </div>

          {/* Step Tracker */}
          {order.status !== "cancelled" && (
            <div className="flex items-center gap-0 pt-4 border-t border-white/[0.06]">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 z-10 ${i <= stepIndex ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-[#14141f] text-[#71717a] border border-white/10"}`}>
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 ${i < stepIndex ? "bg-indigo-600" : "bg-white/10"}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono pt-2">
            <div>
              <span className="text-[#71717a] block mb-0.5">DATE</span>
              <span className="text-[#f5f5f7]">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            <div>
              <span className="text-[#71717a] block mb-0.5">PAYMENT</span>
              <span className="text-emerald-400 font-semibold uppercase">{order.payment.status}</span>
            </div>
            <div>
              <span className="text-[#71717a] block mb-0.5">RAZORPAY ID</span>
              <span className="text-[#f5f5f7] truncate block">{order.payment.razorpayOrderId ?? "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="glass-panel rounded-2xl p-6 mb-6 border border-white/[0.08] space-y-4">
          <h2 className="text-base font-bold text-[#f5f5f7] font-display flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-indigo-400" />
            <span>Items Snapshot</span>
          </h2>
          <div className="divide-y divide-white/[0.06]">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {order.items.map((item: any, i: number) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#f5f5f7] font-display">{item.nameSnapshot}</p>
                  <p className="text-xs font-mono text-[#71717a] mt-0.5">
                    {item.quantity} × ₹{(item.priceSnapshot / 100).toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="text-sm font-bold text-[#f5f5f7] font-display">
                  ₹{(item.lineTotal / 100).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.06] pt-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#71717a]">SUBTOTAL</span>
              <span className="text-[#f5f5f7]">₹{(order.subtotal / 100).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#71717a]">GST (18%)</span>
              <span className="text-[#f5f5f7]">₹{(order.tax / 100).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/[0.06]">
              <span className="text-[#f5f5f7] font-display">TOTAL PAID</span>
              <span className="text-indigo-400 font-display">₹{(order.total / 100).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address Snapshot */}
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-3">
          <h2 className="text-base font-bold text-[#f5f5f7] font-display flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <span>Shipping Address</span>
          </h2>
          <div className="text-xs text-[#a1a1aa] leading-relaxed space-y-1 font-mono">
            <p className="text-[#f5f5f7] font-semibold">{order.shippingAddressSnapshot.label}</p>
            <p>{order.shippingAddressSnapshot.line1}</p>
            {order.shippingAddressSnapshot.line2 && <p>{order.shippingAddressSnapshot.line2}</p>}
            <p>{order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.state} — {order.shippingAddressSnapshot.pincode}</p>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/orders" className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
