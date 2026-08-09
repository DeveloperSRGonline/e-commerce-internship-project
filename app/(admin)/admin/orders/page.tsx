import { connectToDB } from "@/lib/db/connect";
import Order from "@/models/Order.model";
import User from "@/models/User.model";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminOrderStatusSelect from "./AdminOrderStatusSelect";
import Link from "next/link";

async function getOrders(page: number, status?: string, search?: string) {
  await connectToDB();
  // Register User model for populate
  const _ = User;
  const limit = 20;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { "payment.razorpayOrderId": { $regex: search, $options: "i" } },
      { "payment.razorpayPaymentId": { $regex: search, $options: "i" } },
      { "items.nameSnapshot": { $regex: search, $options: "i" } },
    ];
  }

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
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  shipped: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export const metadata = { title: "Orders — Admin Console | ShopIN" };

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { page: pageParam, status, search } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1"));
  const { orders, total, totalPages } = await getOrders(page, status, search);

  const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">TRANSACTIONS</span>
          <h1 className="text-3xl font-extrabold text-[#f5f5f7] font-display">Customer Orders ({total})</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <AdminSearchInput placeholder="Search orders..." />
          {/* Status Filter Tabs */}
          <div className="flex gap-1.5 flex-wrap">
            <Link href="/admin/orders" className={`px-3 py-1.5 text-xs font-mono rounded-xl transition-all border ${!status ? "btn-primary" : "btn-secondary"}`}>
              ALL
            </Link>
            {statuses.map((s) => (
              <Link key={s} href={`/admin/orders?status=${s}`} className={`px-3 py-1.5 text-xs font-mono uppercase rounded-xl transition-all border ${status === s ? "btn-primary" : "btn-secondary"}`}>
                {s}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-white/[0.02] text-[#71717a] border-b border-white/[0.06]">
                <th className="text-left px-5 py-4 font-semibold uppercase">ORDER ID</th>
                <th className="text-left px-5 py-4 font-semibold uppercase">CUSTOMER</th>
                <th className="text-left px-5 py-4 font-semibold uppercase">DATE</th>
                <th className="text-center px-5 py-4 font-semibold uppercase">STATUS</th>
                <th className="text-right px-5 py-4 font-semibold uppercase">TOTAL</th>
                <th className="text-right px-5 py-4 font-semibold uppercase">UPDATE STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {orders.map((order: any) => (
                <tr key={order._id.toString()} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 text-[#f5f5f7]">#{order._id.toString().slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-4">
                    <p className="text-[#f5f5f7] font-semibold font-display text-sm">{order.userId?.name ?? "Customer"}</p>
                    <p className="text-[#71717a] text-[11px] font-mono mt-0.5">{order.userId?.email ?? "—"}</p>
                  </td>
                  <td className="px-5 py-4 text-[#71717a]">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold border ${STATUS_COLORS[order.status] ?? "bg-white/10 text-white/60"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#f5f5f7] font-bold text-right">
                    ₹{(order.total / 100).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 text-right">
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
          <div className="p-4 border-t border-white/[0.06] flex justify-center gap-3 text-xs font-mono">
            {page > 1 && (
              <Link href={`/admin/orders?page=${page - 1}${status ? `&status=${status}` : ""}`} className="btn-secondary px-3 py-1.5">← PREV</Link>
            )}
            <span className="text-[#71717a] py-1.5">PAGE {page}/{totalPages}</span>
            {page < totalPages && (
              <Link href={`/admin/orders?page=${page + 1}${status ? `&status=${status}` : ""}`} className="btn-secondary px-3 py-1.5">NEXT →</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
