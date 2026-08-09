import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectToDB } from "@/lib/db/connect";
import Order from "@/models/Order.model";
import Navbar from "@/components/ui/Navbar";
import { redirect } from "next/navigation";
import { Package, Clock, CheckCircle2, Truck, AlertCircle, ChevronRight } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: CheckCircle2 },
  shipped: { label: "Shipped", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: AlertCircle },
};

export const metadata = { title: "Order History — ShopIN" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login?callbackUrl=/orders");

  await connectToDB();
  const orders = await Order.find({ userId: session.user.userId })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#a1a1aa]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-12">
        <div className="mb-10 border-b border-white/[0.06] pb-6">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">HISTORY</span>
          <h1 className="text-3xl font-extrabold text-[#f5f5f7] font-display">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="glass-panel rounded-3xl p-16 text-center space-y-4">
            <Package className="w-12 h-12 text-white/20 mx-auto" />
            <h2 className="text-[#f5f5f7] text-lg font-bold font-display">No past orders</h2>
            <p className="text-xs text-[#71717a] max-w-xs mx-auto">
              When you place an order, it will appear here for tracking.
            </p>
            <div className="pt-2">
              <Link href="/products" className="btn-primary inline-flex px-6 py-3 text-xs tracking-wider uppercase">
                Explore Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {orders.map((order: any) => {
              const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;

              return (
                <Link key={order._id.toString()} href={`/orders/${order._id}`} className="block group">
                  <div className="glass-panel-interactive rounded-2xl p-6 border border-white/[0.08]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[#f5f5f7] font-mono">
                            ORDER #{order._id.toString().slice(-8).toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase border ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                        </div>

                        <p className="text-xs font-mono text-[#71717a]">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} • {order.items.length} ITEM(S)
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                        <span className="text-lg font-bold text-[#f5f5f7] font-display">
                          ₹{(order.total / 100).toLocaleString("en-IN")}
                        </span>
                        <ChevronRight className="w-5 h-5 text-[#71717a] group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
