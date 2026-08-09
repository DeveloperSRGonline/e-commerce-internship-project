"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/40 transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ShopIN
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Products
            </Link>
            <Link href="/categories" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Categories
            </Link>
            {session?.user && (
              <>
                <Link href="/cart" className="text-white/70 hover:text-white text-sm font-medium transition-colors flex items-center gap-1">
                  🛒 Cart
                </Link>
                <Link href="/orders" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
                  Orders
                </Link>
              </>
            )}
            {session?.user?.role === "admin" && (
              <Link href="/admin" className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
                Admin ⚡
              </Link>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{session.user.name}</p>
                  <p className="text-white/40 text-xs capitalize">{session.user.role}</p>
                </div>
                <button
                  id="logout-btn"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded-xl transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/30 rounded-xl transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl transition-all shadow-lg hover:shadow-purple-500/30"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            id="mobile-menu-btn"
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-3">
            <Link href="/products" className="block text-white/70 hover:text-white py-2 text-sm" onClick={() => setIsMenuOpen(false)}>Products</Link>
            <Link href="/categories" className="block text-white/70 hover:text-white py-2 text-sm" onClick={() => setIsMenuOpen(false)}>Categories</Link>
            {session?.user && (
              <>
                <Link href="/cart" className="block text-white/70 hover:text-white py-2 text-sm" onClick={() => setIsMenuOpen(false)}>🛒 Cart</Link>
                <Link href="/orders" className="block text-white/70 hover:text-white py-2 text-sm" onClick={() => setIsMenuOpen(false)}>Orders</Link>
              </>
            )}
            {session?.user?.role === "admin" && (
              <Link href="/admin" className="block text-purple-400 py-2 text-sm" onClick={() => setIsMenuOpen(false)}>Admin ⚡</Link>
            )}
            <div className="pt-3 border-t border-white/10">
              {session?.user ? (
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); setIsMenuOpen(false); }}
                  className="w-full text-left text-sm text-white/60 hover:text-white py-2"
                >
                  Sign Out ({session.user.name})
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1 text-center py-2 text-sm border border-white/20 rounded-xl text-white/70" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                  <Link href="/register" className="flex-1 text-center py-2 text-sm bg-purple-500 rounded-xl text-white" onClick={() => setIsMenuOpen(false)}>Join Free</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
