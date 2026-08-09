"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useState } from "react";
import { Search, SlidersHorizontal, RotateCcw, ArrowUpDown, Tag, IndianRupee, Loader2 } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface FilterBarProps {
  categories: Category[];
  currentCategory?: string;
  currentMinPrice?: number;
  currentMaxPrice?: number;
  currentSort?: string;
  currentQuery?: string;
}

export default function FilterBar({
  categories,
  currentCategory,
  currentMinPrice,
  currentMaxPrice,
  currentSort,
  currentQuery,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchVal, setSearchVal] = useState(currentQuery ?? "");

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const hasActiveFilters = Boolean(
    currentCategory || currentMinPrice || currentMaxPrice || currentSort || currentQuery
  );

  return (
    <div className="sticky top-28 space-y-6">
      <div className="glass-panel rounded-3xl p-6 border border-white/[0.1] shadow-2xl relative overflow-hidden space-y-6 backdrop-blur-xl bg-[#14141f]/80">
        
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#f5f5f7] font-display">Refine Results</h3>
              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-wider block">Real-time parameters</span>
            </div>
          </div>
          {isPending && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
        </div>

        {/* Live Keyword Search Input */}
        <div className="space-y-2">
          <label htmlFor="search-query" className="block text-[11px] font-mono font-semibold text-[#a1a1aa] uppercase tracking-widest flex items-center gap-1.5">
            <Search className="w-3 h-3 text-indigo-400" />
            <span>Search Catalog</span>
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateParams({ q: searchVal || undefined });
            }}
            className="relative"
          >
            <input
              id="search-query"
              name="q"
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Type keyword & press enter..."
              className="w-full pl-3.5 pr-10 py-2.5 bg-[#0a0a0f]/80 border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 p-1 text-[#71717a] hover:text-indigo-400 transition-colors"
              title="Execute search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Category Pill / Select */}
        <div className="space-y-2">
          <label htmlFor="filter-category" className="block text-[11px] font-mono font-semibold text-[#a1a1aa] uppercase tracking-widest flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-indigo-400" />
            <span>Category</span>
          </label>
          <select
            id="filter-category"
            value={currentCategory ?? ""}
            onChange={(e) => updateParams({ category: e.target.value || undefined })}
            className="w-full px-3.5 py-2.5 bg-[#0a0a0f]/80 border border-white/10 rounded-xl text-[#f5f5f7] text-xs focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-sans"
          >
            <option value="" className="bg-[#0a0a0f]">All Collections</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.slug} className="bg-[#0a0a0f]">
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Filter Inputs */}
        <div className="space-y-2">
          <label className="block text-[11px] font-mono font-semibold text-[#a1a1aa] uppercase tracking-widest flex items-center gap-1.5">
            <IndianRupee className="w-3 h-3 text-indigo-400" />
            <span>Price Range (₹)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              id="filter-min-price"
              type="number"
              min={0}
              placeholder="Min ₹"
              defaultValue={currentMinPrice !== undefined ? currentMinPrice / 100 : ""}
              onBlur={(e) =>
                updateParams({ minPrice: e.target.value ? String(Number(e.target.value) * 100) : undefined })
              }
              className="w-full px-3 py-2 bg-[#0a0a0f]/80 border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
            />
            <input
              id="filter-max-price"
              type="number"
              min={0}
              placeholder="Max ₹"
              defaultValue={currentMaxPrice !== undefined ? currentMaxPrice / 100 : ""}
              onBlur={(e) =>
                updateParams({ maxPrice: e.target.value ? String(Number(e.target.value) * 100) : undefined })
              }
              className="w-full px-3 py-2 bg-[#0a0a0f]/80 border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
            />
          </div>
        </div>

        {/* Sort Order Selector */}
        <div className="space-y-2">
          <label htmlFor="filter-sort" className="block text-[11px] font-mono font-semibold text-[#a1a1aa] uppercase tracking-widest flex items-center gap-1.5">
            <ArrowUpDown className="w-3 h-3 text-indigo-400" />
            <span>Sort By</span>
          </label>
          <select
            id="filter-sort"
            value={currentSort ?? ""}
            onChange={(e) => updateParams({ sort: e.target.value || undefined })}
            className="w-full px-3.5 py-2.5 bg-[#0a0a0f]/80 border border-white/10 rounded-xl text-[#f5f5f7] text-xs focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-sans"
          >
            <option value="" className="bg-[#0a0a0f]">Newest Arrivals</option>
            <option value="price_asc" className="bg-[#0a0a0f]">Price: Low to High</option>
            <option value="price_desc" className="bg-[#0a0a0f]">Price: High to Low</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            id="clear-filters-btn"
            onClick={() => {
              setSearchVal("");
              router.push(pathname);
            }}
            className="btn-secondary w-full py-2.5 text-xs text-[#a1a1aa] flex items-center justify-center gap-2 pt-3 border-t border-white/[0.06]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Active Filters</span>
          </button>
        )}

      </div>
    </div>
  );
}
