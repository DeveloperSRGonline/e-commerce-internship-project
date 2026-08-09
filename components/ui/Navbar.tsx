"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 p-[1px] shadow-[0_0_20px_rgba(99,102,241,0.35)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all">
              <div className="w-full h-full bg-[#0a0a0f] rounded-[11px] flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-[#f5f5f7] font-display flex items-center gap-1.5">
                ShopIN
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">PRO</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-sm font-medium text-[#a1a1aa] hover:text-[#f5f5f7] transition-colors">
              Catalog
            </Link>
            <Link href="/categories" className="text-sm font-medium text-[#a1a1aa] hover:text-[#f5f5f7] transition-colors">
              Categories
            </Link>
            {session?.user && (
              <>
                <Link href="/cart" className="text-sm font-medium text-[#a1a1aa] hover:text-[#f5f5f7] transition-colors flex items-center gap-2">
                  <span>Cart</span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                </Link>
                <Link href="/orders" className="text-sm font-medium text-[#a1a1aa] hover:text-[#f5f5f7] transition-colors">
                  Orders
                </Link>
              </>
            )}
            {session?.user?.role === "admin" && (
              <Link href="/admin" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                <span>Console</span>
                <span className="text-xs">⚡</span>
              </Link>
            )}
          </nav>

          {/* User Status / Actions */}
          <div className="hidden md:flex items-center gap-4">
            {session?.user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#f5f5f7] leading-none">{session.user.name}</p>
                  <p className="text-[11px] font-mono text-indigo-400/80 mt-1 uppercase tracking-wider">{session.user.role}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="btn-secondary px-4 py-2 text-xs">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary px-5 py-2 text-xs">
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            className="md:hidden p-2 text-[#a1a1aa] hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-white/10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <Link href="/products" className="block text-[#a1a1aa] hover:text-white text-base py-1" onClick={() => setIsMenuOpen(false)}>Catalog</Link>
            <Link href="/categories" className="block text-[#a1a1aa] hover:text-white text-base py-1" onClick={() => setIsMenuOpen(false)}>Categories</Link>
            {session?.user && (
              <>
                <Link href="/cart" className="block text-[#a1a1aa] hover:text-white text-base py-1" onClick={() => setIsMenuOpen(false)}>Cart</Link>
                <Link href="/orders" className="block text-[#a1a1aa] hover:text-white text-base py-1" onClick={() => setIsMenuOpen(false)}>Orders</Link>
              </>
            )}
            {session?.user?.role === "admin" && (
              <Link href="/admin" className="block text-indigo-400 font-semibold text-base py-1" onClick={() => setIsMenuOpen(false)}>Admin Console ⚡</Link>
            )}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {session?.user ? (
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); setIsMenuOpen(false); }}
                  className="btn-secondary w-full py-2.5 text-sm"
                >
                  Sign Out ({session.user.name})
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" className="btn-secondary text-center py-2.5 text-xs" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                  <Link href="/register" className="btn-primary text-center py-2.5 text-xs" onClick={() => setIsMenuOpen(false)}>Register</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
