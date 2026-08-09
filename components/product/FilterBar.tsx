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
      // Reset to page 1 on any filter change
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
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-semibold text-white/70 mb-2 uppercase tracking-wider">
          Search Products
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
            placeholder="Search products..."
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 transition-all"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-purple-500/80 hover:bg-purple-500 rounded-xl text-white text-sm transition-colors"
          >
            🔍
          </button>
        </form>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="filter-category" className="block text-sm font-semibold text-white/70 mb-2 uppercase tracking-wider">
          Category
        </label>
        <select
          id="filter-category"
          value={currentCategory ?? ""}
          onChange={(e) => updateParams({ category: e.target.value || undefined })}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-purple-400 transition-all cursor-pointer"
        >
          <option value="" className="bg-slate-800">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.slug} className="bg-slate-800">
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold text-white/70 mb-2 uppercase tracking-wider">
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
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 transition-all"
          />
          <span className="text-white/40 flex-shrink-0">—</span>
          <input
            id="filter-max-price"
            type="number"
            min={0}
            placeholder="Max"
            defaultValue={currentMaxPrice !== undefined ? currentMaxPrice / 100 : ""}
            onBlur={(e) =>
              updateParams({ maxPrice: e.target.value ? String(Number(e.target.value) * 100) : undefined })
            }
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 transition-all"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label htmlFor="filter-sort" className="block text-sm font-semibold text-white/70 mb-2 uppercase tracking-wider">
          Sort By
        </label>
        <select
          id="filter-sort"
          value={currentSort ?? ""}
          onChange={(e) => updateParams({ sort: e.target.value || undefined })}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-purple-400 transition-all cursor-pointer"
        >
          <option value="" className="bg-slate-800">Newest First</option>
          <option value="price_asc" className="bg-slate-800">Price: Low to High</option>
          <option value="price_desc" className="bg-slate-800">Price: High to Low</option>
        </select>
      </div>

      {/* Clear Filters */}
      {(currentCategory || currentMinPrice || currentMaxPrice || currentSort || currentQuery) && (
        <button
          id="clear-filters-btn"
          onClick={() => router.push(pathname)}
          className="w-full py-2 text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
        >
          {isPending ? "Applying..." : "✕ Clear All Filters"}
        </button>
      )}
    </div>
  );
}
