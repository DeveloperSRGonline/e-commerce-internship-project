"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  revenueChart: { labels: string[]; revenue: number[]; orderCount: number[] };
  statusDistribution: Record<string, number>;
  topProducts: { _id: string; name: string; revenue: number; unitsSold: number }[];
  lowStockProducts: { _id: string; name: string; slug: string; stock: number }[];
  newUsersThisMonth: number;
  totalRevenue: number;
}

function BarChart({ labels, values, color }: { labels: string[]; values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {values.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div
            className="w-full rounded-t-sm transition-all duration-500"
            style={{
              height: `${(val / max) * 100}%`,
              backgroundColor: color,
              opacity: val === 0 ? 0.1 : 0.8,
              minHeight: val > 0 ? "4px" : "0",
            }}
            title={`${labels[i]}: ₹${val.toLocaleString("en-IN")}`}
          />
          <span className="text-white/20 text-[9px] truncate w-full text-center">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: Record<string, number> }) {
  const STATUS_COLORS: Record<string, string> = {
    pending: "#eab308",
    confirmed: "#3b82f6",
    shipped: "#a855f7",
    delivered: "#22c55e",
    cancelled: "#ef4444",
  };

  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return <p className="text-white/30 text-sm">No data</p>;

  let cumulative = 0;
  const segments = entries.map(([status, count]) => {
    const pct = count / total;
    const start = cumulative;
    cumulative += pct;
    return { status, count, pct, start };
  });

  // Simple SVG arc segments
  const toXY = (pct: number) => {
    const angle = pct * 2 * Math.PI - Math.PI / 2;
    return {
      x: 50 + 40 * Math.cos(angle),
      y: 50 + 40 * Math.sin(angle),
    };
  };

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-28 h-28 flex-shrink-0">
        {segments.map((seg, i) => {
          const startP = toXY(seg.start);
          const endP = toXY(seg.start + seg.pct);
          const largeArc = seg.pct > 0.5 ? 1 : 0;
          const d = `M 50 50 L ${startP.x} ${startP.y} A 40 40 0 ${largeArc} 1 ${endP.x} ${endP.y} Z`;
          return (
            <path
              key={i}
              d={d}
              fill={STATUS_COLORS[seg.status] ?? "#666"}
              opacity={0.8}
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="rgb(15 23 42)" />
        <text x="50" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{total}</text>
      </svg>

      <div className="space-y-2 flex-1">
        {segments.map((seg) => (
          <div key={seg.status} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[seg.status] ?? "#666" }} />
              <span className="text-white/60 capitalize">{seg.status}</span>
            </div>
            <span className="text-white font-medium">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-white/5 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <div className="text-white/40">Failed to load analytics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-white/40 text-sm mt-1">Revenue and performance insights</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-2xl p-5">
          <p className="text-purple-400/70 text-sm mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-white">₹{data.totalRevenue.toLocaleString("en-IN")}</p>
          <p className="text-white/30 text-xs mt-1">All-time paid orders</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-2xl p-5">
          <p className="text-blue-400/70 text-sm mb-1">New Users This Month</p>
          <p className="text-3xl font-bold text-white">{data.newUsersThisMonth}</p>
          <p className="text-white/30 text-xs mt-1">Customer accounts</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30 rounded-2xl p-5">
          <p className="text-orange-400/70 text-sm mb-1">Low Stock Products</p>
          <p className="text-3xl font-bold text-white">{data.lowStockProducts.length}</p>
          <p className="text-white/30 text-xs mt-1">Less than 5 units</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Month Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1">Revenue by Month</h2>
          <p className="text-white/30 text-xs mb-5">Last 12 months (₹)</p>
          <BarChart
            labels={data.revenueChart.labels}
            values={data.revenueChart.revenue}
            color="#a855f7"
          />
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1">Order Status</h2>
          <p className="text-white/30 text-xs mb-5">Distribution by status</p>
          <DonutChart data={data.statusDistribution} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Top Products by Revenue</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-white/30 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="text-white/20 text-xs w-4 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.name}</p>
                    <p className="text-white/30 text-xs">{p.unitsSold} units sold</p>
                  </div>
                  <span className="text-purple-400 font-semibold text-sm flex-shrink-0">
                    ₹{p.revenue.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Low Stock Alert</h2>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-green-400 text-sm">✅ All products have adequate stock</p>
          ) : (
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.lowStockProducts.map((p: any) => (
                <div key={p._id} className="flex items-center justify-between">
                  <p className="text-white text-sm truncate max-w-[200px]">{p.name}</p>
                  <span className={`font-bold text-sm ${p.stock === 0 ? "text-red-400" : "text-orange-400"}`}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders by Month */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-1">Orders by Month</h2>
        <p className="text-white/30 text-xs mb-5">Last 12 months (count)</p>
        <BarChart
          labels={data.revenueChart.labels}
          values={data.revenueChart.orderCount}
          color="#22d3ee"
        />
      </div>
    </div>
  );
}
