"use client";

import { useEffect, useState } from "react";
import { IndianRupee, Users, TrendingDown, CheckCircle2 } from "lucide-react";

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
    <div className="flex items-end gap-2 h-36 pt-4">
      {values.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <div
            className="w-full rounded-t-sm transition-all duration-500 relative group-hover:brightness-125"
            style={{
              height: `${(val / max) * 100}%`,
              backgroundColor: color,
              opacity: val === 0 ? 0.15 : 0.85,
              minHeight: val > 0 ? "4px" : "0",
            }}
            title={`${labels[i]}: ₹${val.toLocaleString("en-IN")}`}
          />
          <span className="text-[#71717a] font-mono text-[10px] truncate w-full text-center">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: Record<string, number> }) {
  const STATUS_COLORS: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    shipped: "#6366f1",
    delivered: "#10b981",
    cancelled: "#f43f5e",
  };

  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return <p className="text-[#71717a] font-mono text-xs">No transactions recorded</p>;

  let cumulative = 0;
  const segments = entries.map(([status, count]) => {
    const pct = count / total;
    const start = cumulative;
    cumulative += pct;
    return { status, count, pct, start };
  });

  const toXY = (pct: number) => {
    const angle = pct * 2 * Math.PI - Math.PI / 2;
    return {
      x: 50 + 40 * Math.cos(angle),
      y: 50 + 40 * Math.sin(angle),
    };
  };

  return (
    <div className="flex items-center gap-8">
      <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0">
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
              opacity={0.85}
            />
          );
        })}
        <circle cx="50" cy="50" r="26" fill="#0a0a0f" />
        <text x="50" y="54" textAnchor="middle" fill="#f5f5f7" fontSize="12" fontWeight="bold" fontFamily="var(--font-mono)">{total}</text>
      </svg>

      <div className="space-y-2 flex-1 font-mono text-xs">
        {segments.map((seg) => (
          <div key={seg.status} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[seg.status] ?? "#666" }} />
              <span className="text-[#a1a1aa] uppercase">{seg.status}</span>
            </div>
            <span className="text-[#f5f5f7] font-bold">{seg.count}</span>
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
          <div key={i} className="h-48 glass-panel rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <div className="text-rose-400 font-mono text-xs">Failed to load system analytics</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-6">
        <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">METRICS</span>
        <h1 className="text-3xl font-extrabold text-[#f5f5f7] font-display">System Analytics</h1>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 bg-indigo-500/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-indigo-400">
            <span className="uppercase">ALL-TIME REVENUE</span>
            <IndianRupee className="w-4 h-4" />
          </div>
          <p className="text-3xl font-bold text-[#f5f5f7] font-display">₹{data.totalRevenue.toLocaleString("en-IN")}</p>
          <p className="text-[#71717a] text-[11px] font-mono">Aggregated paid orders</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-blue-500/30 bg-blue-500/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-blue-400">
            <span className="uppercase">NEW CUSTOMERS</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-3xl font-bold text-[#f5f5f7] font-display">{data.newUsersThisMonth}</p>
          <p className="text-[#71717a] text-[11px] font-mono">Registered this month</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-rose-500/30 bg-rose-500/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-rose-400">
            <span className="uppercase">DEPLETED ITEMS</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <p className="text-3xl font-bold text-[#f5f5f7] font-display">{data.lowStockProducts.length}</p>
          <p className="text-[#71717a] text-[11px] font-mono">Stock count under 5</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Month Chart */}
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-2">
          <h2 className="text-base font-bold text-[#f5f5f7] font-display">Monthly Revenue (₹)</h2>
          <p className="text-[#71717a] text-xs font-mono">Aggregated order totals</p>
          <BarChart
            labels={data.revenueChart.labels}
            values={data.revenueChart.revenue}
            color="#6366f1"
          />
        </div>

        {/* Order Status Distribution */}
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-2">
          <h2 className="text-base font-bold text-[#f5f5f7] font-display">Order Status Breakdown</h2>
          <p className="text-[#71717a] text-xs font-mono">Distribution by order lifecycle</p>
          <DonutChart data={data.statusDistribution} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
          <h2 className="text-base font-bold text-[#f5f5f7] font-display">Top 5 Revenue Generators</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-[#71717a] font-mono text-xs">No sales data recorded yet</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-4 py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-[#71717a] text-xs font-mono w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f5f5f7] font-semibold text-xs font-display truncate">{p.name}</p>
                    <p className="text-[#71717a] text-[11px] font-mono">{p.unitsSold} UNITS SOLD</p>
                  </div>
                  <span className="text-indigo-400 font-bold font-display text-sm">
                    ₹{p.revenue.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
          <h2 className="text-base font-bold text-[#f5f5f7] font-display">Stock Depletion Monitor</h2>
          {data.lowStockProducts.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>All catalog products have sufficient stock</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.lowStockProducts.map((p: any) => (
                <div key={p._id} className="flex items-center justify-between text-xs font-mono py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-[#a1a1aa] truncate max-w-[200px]">{p.name}</span>
                  <span className={`font-bold ${p.stock === 0 ? "text-rose-400" : "text-amber-400"}`}>
                    {p.stock === 0 ? "DEPLETED" : `${p.stock} REMAINING`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
