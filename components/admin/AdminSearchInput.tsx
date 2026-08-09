"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useTransition } from "react";

export default function AdminSearchInput({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("search") ?? "");

  function handleSearch(val: string) {
    setQuery(val);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (val) {
        params.set("search", val);
        params.set("page", "1");
      } else {
        params.delete("search");
      }
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative flex-1 max-w-xs">
      <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isPending ? "text-indigo-400 animate-pulse" : "text-[#71717a]"}`} />
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-mono text-[#f5f5f7] placeholder-[#71717a] focus:outline-none focus:border-indigo-500/50 transition-colors"
      />
    </div>
  );
}
