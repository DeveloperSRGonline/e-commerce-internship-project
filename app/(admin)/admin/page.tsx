import { connectToDB } from "@/lib/db/connect";
import User from "@/models/User.model";
import Product from "@/models/Product.model";
import Order from "@/models/Order.model";
import { IndianRupee, ShoppingBag, Users, Package, AlertTriangle, TrendingDown } from "lucide-react";

async function getDashboardStats() {
  await connectToDB();

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    revenueResult,
    pendingOrders,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $in: ["confirmed", "shipped", "delivered"] }, "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments({ status: "pending" }),
    Product.find({ isActive: true, stock: { $lt: 5 } }).limit(5).lean(),
    Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name email")
      .lean(),
  ]);

  const totalRevenue = revenueResult[0]?.total ?? 0;

  return {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    pendingOrders,
    lowStockProducts,
    recentOrders,
  };
}

export const metadata = { title: "Dashboard — Admin Console | ShopIN" };

export default async function AdminDashboard() {
  const {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    pendingOrders,
    lowStockProducts,
    recentOrders,
  } = await getDashboardStats();

  const stats = [
    { label: "Total Revenue", value: `₹${(totalRevenue / 100).toLocaleString("en-IN")}`, icon: IndianRupee, color: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10" },
    { label: "Total Orders", value: totalOrders.toLocaleString(), icon: ShoppingBag, color: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
    { label: "Active Customers", value: totalUsers.toLocaleString(), icon: Users, color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
    { label: "Catalog Products", value: totalProducts.toLocaleString(), icon: Package, color: "border-violet-500/30 text-violet-400 bg-violet-500/10" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    shipped: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-6">
        <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">OVERVIEW</span>
        <h1 className="text-3xl font-extrabold text-[#f5f5f7] font-display">System Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#71717a] uppercase">{stat.label}</span>
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#f5f5f7] font-display">{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders Alert */}
        {pendingOrders > 0 && (
          <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center gap-2.5 text-amber-400 font-semibold font-display text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Pending Orders Queue</span>
            </div>
            <p className="text-xs text-amber-300/80 font-mono">
              {pendingOrders} order(s) awaiting confirmation and status updates.
            </p>
          </div>
        )}

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="glass-panel rounded-2xl p-6 border border-rose-500/30 bg-rose-500/5 space-y-3">
            <div className="flex items-center gap-2.5 text-rose-400 font-semibold font-display text-sm">
              <TrendingDown className="w-4 h-4 flex-shrink-0" />
              <span>Inventory Depletion Warning</span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {lowStockProducts.map((p: any) => (
                <div key={p._id.toString()} className="flex justify-between items-center py-1 border-b border-white/[0.04] last:border-0">
                  <span className="text-[#a1a1aa] truncate">{p.name}</span>
                  <span className="text-rose-400 font-bold ml-2">{p.stock} LEFT</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <h2 className="text-base font-bold text-[#f5f5f7] font-display">Recent Order Transactions</h2>
        {recentOrders.length === 0 ? (
          <p className="text-xs font-mono text-[#71717a]">No recent order transactions available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-[#71717a] border-b border-white/[0.06] text-left">
                  <th className="pb-3 font-semibold uppercase">ORDER ID</th>
                  <th className="pb-3 font-semibold uppercase">CUSTOMER</th>
                  <th className="pb-3 font-semibold uppercase">STATUS</th>
                  <th className="pb-3 font-semibold uppercase text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recentOrders.map((order: any) => (
                  <tr key={order._id.toString()}>
                    <td className="py-3 text-[#f5f5f7]">#{order._id.toString().slice(-8).toUpperCase()}</td>
                    <td className="py-3 text-[#a1a1aa]">{order.userId?.name ?? "Customer"}</td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold border ${STATUS_COLORS[order.status] ?? "bg-white/10 text-white/60"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-[#f5f5f7] font-bold text-right">₹{(order.total / 100).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
