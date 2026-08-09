import { connectToDB } from "@/lib/db/connect";
import Order from "@/models/Order.model";
import AdminOrderStatusSelect from "./AdminOrderStatusSelect";

async function getOrders(page: number, status?: string) {
  await connectToDB();
  const limit = 20;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name email")
      .lean(),
    Order.countDocuments(filter),
  ]);

  return { orders, total, totalPages: Math.ceil(total / limit) };
}

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  shipped: "bg-purple-500/20 text-purple-400",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export const metadata = { title: "Orders — Admin | ShopIN" };

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { page: pageParam, status } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1"));
  const { orders, total, totalPages } = await getOrders(page, status);

  const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-white/40 text-sm mt-1">{total} total orders</p>
        </div>
        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          <a href="/admin/orders" className={`px-3 py-1.5 text-xs rounded-lg transition-all ${!status ? "bg-purple-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
            All
          </a>
          {statuses.map((s) => (
            <a key={s} href={`/admin/orders?status=${s}`} className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-all ${status === s ? "bg-purple-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
              {s}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-white/40 border-b border-white/10">
                <th className="text-left px-4 py-3 font-medium">Order ID</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-right px-4 py-3 font-medium">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {orders.map((order: any) => (
                <tr key={order._id.toString()} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-white/60 font-mono text-xs">#{order._id.toString().slice(-8).toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white">{order.userId?.name ?? "—"}</p>
                    <p className="text-white/30 text-xs">{order.userId?.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-white/60 text-xs">
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status] ?? "bg-white/10 text-white/60"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold text-right">
                    ₹{(order.total / 100).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AdminOrderStatusSelect
                      orderId={order._id.toString()}
                      currentStatus={order.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex justify-center gap-3">
            {page > 1 && (
              <a href={`/admin/orders?page=${page - 1}${status ? `&status=${status}` : ""}`} className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg text-white">← Prev</a>
            )}
            <span className="text-white/40 text-sm py-1.5">Page {page}/{totalPages}</span>
            {page < totalPages && (
              <a href={`/admin/orders?page=${page + 1}${status ? `&status=${status}` : ""}`} className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg text-white">Next →</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
