import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectToDB } from "@/lib/db/connect";
import Order from "@/models/Order.model";
import Navbar from "@/components/ui/Navbar";
import { redirect } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  shipped: "bg-purple-500/20 text-purple-400",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export const metadata = { title: "My Orders — ShopIN" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login?callbackUrl=/orders");

  await connectToDB();
  const orders = await Order.find({ userId: session.user.userId })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">📦</div>
            <h2 className="text-white/60 text-lg font-medium mb-2">No orders yet</h2>
            <Link href="/products" className="inline-flex mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {orders.map((order: any) => (
              <Link key={order._id.toString()} href={`/orders/${order._id}`} className="block">
                <div className="bg-white/5 border border-white/10 hover:border-purple-500/30 rounded-2xl p-5 transition-all hover:bg-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-medium">Order #{order._id.toString().slice(-8).toUpperCase()}</p>
                      <p className="text-white/40 text-sm mt-1">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <p className="text-white/40 text-sm mt-1">{order.items.length} item(s)</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-white/10 text-white/60"}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <p className="text-white font-bold mt-2">₹{(order.total / 100).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
