"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

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

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-6 border border-white/[0.08]">
      {/* Search */}
      <div>
        <label className="block text-[11px] font-mono font-semibold text-indigo-400 uppercase tracking-widest mb-2">
          Search
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
            updateParams({ q: q || undefined });
          }}
          className="flex gap-2"
        >
          <input
            id="search-query"
            name="q"
            type="text"
            defaultValue={currentQuery}
            placeholder="Keyword search..."
            className="w-full px-3.5 py-2.5 bg-[#14141f] border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
          <button
            type="submit"
            className="btn-primary px-4 py-2 text-xs flex-shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="filter-category" className="block text-[11px] font-mono font-semibold text-indigo-400 uppercase tracking-widest mb-2">
          Category
        </label>
        <select
          id="filter-category"
          value={currentCategory ?? ""}
          onChange={(e) => updateParams({ category: e.target.value || undefined })}
          className="w-full px-3.5 py-2.5 bg-[#14141f] border border-white/10 rounded-xl text-[#f5f5f7] text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
        >
          <option value="" className="bg-[#0a0a0f]">All Collections</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.slug} className="bg-[#0a0a0f]">
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-[11px] font-mono font-semibold text-indigo-400 uppercase tracking-widest mb-2">
          Price Range (₹)
        </label>
        <div className="flex gap-2 items-center">
          <input
            id="filter-min-price"
            type="number"
            min={0}
            placeholder="Min"
            defaultValue={currentMinPrice !== undefined ? currentMinPrice / 100 : ""}
            onBlur={(e) =>
              updateParams({ minPrice: e.target.value ? String(Number(e.target.value) * 100) : undefined })
            }
            className="w-full px-3 py-2 bg-[#14141f] border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-sm focus:outline-none focus:border-indigo-500 transition-all"
          />
          <span className="text-[#71717a]">—</span>
          <input
            id="filter-max-price"
            type="number"
            min={0}
            placeholder="Max"
            defaultValue={currentMaxPrice !== undefined ? currentMaxPrice / 100 : ""}
            onBlur={(e) =>
              updateParams({ maxPrice: e.target.value ? String(Number(e.target.value) * 100) : undefined })
            }
            className="w-full px-3 py-2 bg-[#14141f] border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-sm focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label htmlFor="filter-sort" className="block text-[11px] font-mono font-semibold text-indigo-400 uppercase tracking-widest mb-2">
          Sort Order
        </label>
        <select
          id="filter-sort"
          value={currentSort ?? ""}
          onChange={(e) => updateParams({ sort: e.target.value || undefined })}
          className="w-full px-3.5 py-2.5 bg-[#14141f] border border-white/10 rounded-xl text-[#f5f5f7] text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
        >
          <option value="" className="bg-[#0a0a0f]">Newest Arrivals</option>
          <option value="price_asc" className="bg-[#0a0a0f]">Price: Low to High</option>
          <option value="price_desc" className="bg-[#0a0a0f]">Price: High to Low</option>
        </select>
      </div>

      {/* Clear Filters */}
      {(currentCategory || currentMinPrice || currentMaxPrice || currentSort || currentQuery) && (
        <button
          id="clear-filters-btn"
          onClick={() => router.push(pathname)}
          className="btn-secondary w-full py-2.5 text-xs text-[#a1a1aa]"
        >
          {isPending ? "Updating..." : "Reset Filters"}
        </button>
      )}
    </div>
  );
}
