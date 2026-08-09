"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export default function AdminOrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const validNext = VALID_TRANSITIONS[currentStatus] ?? [];

  if (validNext.length === 0) {
    return <span className="text-white/20 text-xs italic">Terminal</span>;
  }

  async function handleStatusChange(newStatus: string) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        router.refresh();
      } else {
        alert(data.error?.message ?? "Failed to update status");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex gap-1 justify-end flex-wrap">
      {validNext.map((status) => (
        <button
          key={status}
          id={`status-${orderId}-${status}`}
          onClick={() => handleStatusChange(status)}
          disabled={isLoading}
          className={`px-2 py-1 text-xs rounded-lg capitalize border transition-all disabled:opacity-50 ${
            status === "cancelled"
              ? "border-red-500/30 text-red-400 hover:bg-red-500/20"
              : "border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
          }`}
        >
          {isLoading ? "..." : `→ ${status}`}
        </button>
      ))}
    </div>
  );
}
