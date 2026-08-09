import { connectToDB } from "@/lib/db/connect";
import Order from "@/models/Order.model";
import Product from "@/models/Product.model";
import User from "@/models/User.model";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/analytics — aggregated analytics data
export async function GET() {
  const notAuthorized = await requireAdmin();
  if (notAuthorized) return notAuthorized;

  await connectToDB();

  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(now.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const [
    revenueByMonth,
    ordersByStatus,
    topProducts,
    lowStockProducts,
    newUsersThisMonth,
    totalRevenue,
  ] = await Promise.all([
    // Revenue and order count grouped by month for the past 12 months
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          status: { $in: ["confirmed", "shipped", "delivered"] },
          "payment.status": "paid",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Order count grouped by status
    Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    // Top 5 products by revenue (via order items)
    Order.aggregate([
      { $match: { status: { $in: ["confirmed", "shipped", "delivered"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.nameSnapshot" },
          revenue: { $sum: "$items.lineTotal" },
          unitsSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),

    // Low stock products (< 5 units)
    Product.find({ isActive: true, stock: { $lt: 5 } })
      .select("name slug stock")
      .sort({ stock: 1 })
      .lean(),

    // New users this month
    User.countDocuments({
      role: "customer",
      createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
    }),

    // All-time revenue from paid orders
    Order.aggregate([
      { $match: { "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
  ]);

  // Fill missing months with 0 so the chart has 12 data points
  const monthLabels: string[] = [];
  const revenueData: number[] = [];
  const orderCountData: number[] = [];

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1; // 1-indexed

    const found = revenueByMonth.find((r) => r._id.year === y && r._id.month === m);
    monthLabels.push(monthNames[m - 1]);
    revenueData.push(found ? Math.round(found.revenue / 100) : 0); // Convert paise to rupees
    orderCountData.push(found ? found.count : 0);
  }

  // Status distribution
  const statusMap = Object.fromEntries(ordersByStatus.map((s) => [s._id, s.count]));

  return Response.json({
    success: true,
    data: {
      revenueChart: { labels: monthLabels, revenue: revenueData, orderCount: orderCountData },
      statusDistribution: statusMap,
      topProducts: topProducts.map((p) => ({
        ...p,
        revenue: Math.round(p.revenue / 100), // In rupees
      })),
      lowStockProducts,
      newUsersThisMonth,
      totalRevenue: Math.round((totalRevenue[0]?.total ?? 0) / 100), // In rupees
    },
  });
}
