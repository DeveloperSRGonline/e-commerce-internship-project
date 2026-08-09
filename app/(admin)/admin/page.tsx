import { connectToDB } from "@/lib/db/connect";
import User from "@/models/User.model";
import Product from "@/models/Product.model";
import Order from "@/models/Order.model";

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

export const metadata = { title: "Dashboard — Admin | ShopIN" };

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
    { label: "Total Revenue", value: `₹${(totalRevenue / 100).toLocaleString("en-IN")}`, icon: "💰", color: "from-purple-500/20 to-purple-500/5 border-purple-500/30" },
    { label: "Total Orders", value: totalOrders.toLocaleString(), icon: "📦", color: "from-blue-500/20 to-blue-500/5 border-blue-500/30" },
    { label: "Customers", value: totalUsers.toLocaleString(), icon: "👥", color: "from-green-500/20 to-green-500/5 border-green-500/30" },
    { label: "Active Products", value: totalProducts.toLocaleString(), icon: "🛍️", color: "from-pink-500/20 to-pink-500/5 border-pink-500/30" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    pending: "text-yellow-400",
    confirmed: "text-blue-400",
    shipped: "text-purple-400",
    delivered: "text-green-400",
    cancelled: "text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Welcome to the ShopIN Admin Console</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-5`}>
            <div className="text-3xl mb-3">{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-white/50 text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders Alert */}
        {pendingOrders > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-yellow-400 font-semibold">Pending Orders</h2>
            </div>
            <p className="text-yellow-400/70 text-sm">{pendingOrders} order(s) waiting for confirmation.</p>
          </div>
        )}

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">📉</span>
              <h2 className="text-orange-400 font-semibold">Low Stock Alert</h2>
            </div>
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {lowStockProducts.map((p: any) => (
                <div key={p._id.toString()} className="flex justify-between text-sm">
                  <span className="text-white/60 truncate">{p.name}</span>
                  <span className="text-orange-400 font-semibold ml-2">{p.stock} left</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-white/40 text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 border-b border-white/10">
                  <th className="text-left pb-3 font-medium">Order ID</th>
                  <th className="text-left pb-3 font-medium">Customer</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-right pb-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recentOrders.map((order: any) => (
                  <tr key={order._id.toString()}>
                    <td className="py-3 text-white/60 font-mono">#{order._id.toString().slice(-8).toUpperCase()}</td>
                    <td className="py-3 text-white/70">{order.userId?.name ?? "—"}</td>
                    <td className="py-3">
                      <span className={`font-medium capitalize ${STATUS_COLORS[order.status] ?? "text-white/60"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-white font-semibold text-right">₹{(order.total / 100).toLocaleString("en-IN")}</td>
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
