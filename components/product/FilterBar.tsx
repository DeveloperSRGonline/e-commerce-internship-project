"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useState, useEffect } from "react";
import { Search, SlidersHorizontal, RotateCcw, ArrowUpDown, Tag, IndianRupee, Loader2, Check, X } from "lucide-react";

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
  const [minPriceVal, setMinPriceVal] = useState(currentMinPrice !== undefined ? String(currentMinPrice / 100) : "");
  const [maxPriceVal, setMaxPriceVal] = useState(currentMaxPrice !== undefined ? String(currentMaxPrice / 100) : "");

  // Keep local inputs in sync with URL
  useEffect(() => {
    setSearchVal(currentQuery ?? "");
    setMinPriceVal(currentMinPrice !== undefined ? String(currentMinPrice / 100) : "");
    setMaxPriceVal(currentMaxPrice !== undefined ? String(currentMaxPrice / 100) : "");
  }, [currentQuery, currentMinPrice, currentMaxPrice]);

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

  const handlePriceApply = () => {
    updateParams({
      minPrice: minPriceVal ? String(Number(minPriceVal) * 100) : undefined,
      maxPrice: maxPriceVal ? String(Number(maxPriceVal) * 100) : undefined,
    });
  };

  const hasActiveFilters = Boolean(
    currentCategory || currentMinPrice || currentMaxPrice || currentSort || currentQuery
  );

  return (
    <div className="space-y-6">
      {/* Search Input Bar (Linear style search container) */}
      <div className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ q: searchVal || undefined });
          }}
          className="relative flex items-center"
        >
          <Search className="w-4 h-4 text-[#71717a] absolute left-4 pointer-events-none" />
          <input
            id="search-query"
            name="q"
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search catalog by keyword..."
            className="w-full pl-11 pr-20 py-3 bg-[#14141f]/90 border border-white/[0.1] rounded-2xl text-[#f5f5f7] placeholder-[#71717a] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
          />
          {searchVal && (
            <button
              type="button"
              onClick={() => {
                setSearchVal("");
                updateParams({ q: undefined });
              }}
              className="absolute right-12 text-[#71717a] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors"
          >
            Go
          </button>
        </form>
      </div>

      {/* Accordion / Sidebar Filter Card */}
      <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-6">
        
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#f5f5f7]">Filter & Sort</h3>
          </div>
          {isPending && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
        </div>

        {/* Categories Pills/List */}
        <div className="space-y-3">
          <label className="block text-[11px] font-mono text-[#71717a] uppercase tracking-widest flex items-center justify-between">
            <span>COLLECTION</span>
            {currentCategory && (
              <button
                onClick={() => updateParams({ category: undefined })}
                className="text-[10px] text-indigo-400 hover:underline"
              >
                Clear
              </button>
            )}
          </label>

          <div className="space-y-1">
            <button
              onClick={() => updateParams({ category: undefined })}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${!currentCategory ? "bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20" : "text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white"}`}
            >
              <span>All Collections</span>
              {!currentCategory && <Check className="w-3.5 h-3.5 text-indigo-400" />}
            </button>

            {categories.map((cat) => {
              const isActive = currentCategory === cat.slug;
              return (
                <button
                  key={cat._id}
                  onClick={() => updateParams({ category: isActive ? undefined : cat.slug })}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${isActive ? "bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20" : "text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white"}`}
                >
                  <span>{cat.name}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Range Filter Inputs */}
        <div className="space-y-3 border-t border-white/[0.06] pt-5">
          <label className="block text-[11px] font-mono text-[#71717a] uppercase tracking-widest flex items-center justify-between">
            <span>PRICE (₹)</span>
            {(minPriceVal || maxPriceVal) && (
              <button
                onClick={() => {
                  setMinPriceVal("");
                  setMaxPriceVal("");
                  updateParams({ minPrice: undefined, maxPrice: undefined });
                }}
                className="text-[10px] text-indigo-400 hover:underline"
              >
                Reset
              </button>
            )}
          </label>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={minPriceVal}
              onChange={(e) => setMinPriceVal(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
            />
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={maxPriceVal}
              onChange={(e) => setMaxPriceVal(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
            />
          </div>

          <button
            onClick={handlePriceApply}
            className="w-full py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-xs font-mono text-[#f5f5f7] transition-all"
          >
            Apply Price Filter
          </button>
        </div>

        {/* Sort Order Selector */}
        <div className="space-y-3 border-t border-white/[0.06] pt-5">
          <label htmlFor="filter-sort" className="block text-[11px] font-mono text-[#71717a] uppercase tracking-widest">
            SORT ORDER
          </label>
          <select
            id="filter-sort"
            value={currentSort ?? ""}
            onChange={(e) => updateParams({ sort: e.target.value || undefined })}
            className="w-full px-3.5 py-2.5 bg-[#0a0a0f] border border-white/10 rounded-xl text-[#f5f5f7] text-xs focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-sans"
          >
            <option value="" className="bg-[#0a0a0f]">Newest Arrivals</option>
            <option value="price_asc" className="bg-[#0a0a0f]">Price: Low to High</option>
            <option value="price_desc" className="bg-[#0a0a0f]">Price: High to Low</option>
          </select>
        </div>

        {/* Global Reset */}
        {hasActiveFilters && (
          <button
            id="clear-filters-btn"
            onClick={() => {
              setSearchVal("");
              setMinPriceVal("");
              setMaxPriceVal("");
              router.push(pathname);
            }}
            className="btn-secondary w-full py-2.5 text-xs text-[#a1a1aa] flex items-center justify-center gap-2 pt-3 border-t border-white/[0.06]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear All Filters</span>
          </button>
        )}

      </div>
    </div>
  );
}
