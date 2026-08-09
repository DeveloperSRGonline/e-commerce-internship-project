"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Zap, ShoppingBag, Shield, Menu, X, LogOut } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount, isBouncing } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 p-[1px] shadow-[0_0_20px_rgba(99,102,241,0.35)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all">
              <div className="w-full h-full bg-[#0a0a0f] rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
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
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase">
            <Link href="/products" className="text-[#a1a1aa] hover:text-[#f5f5f7] transition-colors">
              Catalog
            </Link>
            <Link href="/categories" className="text-[#a1a1aa] hover:text-[#f5f5f7] transition-colors">
              Categories
            </Link>
            {session?.user && (
              <>
                <Link
                  href="/cart"
                  className={`relative text-[#a1a1aa] hover:text-[#f5f5f7] transition-all flex items-center gap-2 px-3 py-1.5 rounded-xl border border-transparent hover:border-white/10 ${isBouncing ? "scale-110 border-indigo-500/50 bg-indigo-500/10 text-indigo-300" : ""}`}
                >
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  <span>Cart</span>
                  <span
                    className={`ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono transition-transform duration-300 ${
                      isBouncing
                        ? "scale-125 bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-bounce"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    }`}
                  >
                    {cartCount}
                  </span>
                </Link>
                <Link href="/orders" className="text-[#a1a1aa] hover:text-[#f5f5f7] transition-colors">
                  Orders
                </Link>
              </>
            )}
            {session?.user?.role === "admin" && (
              <Link href="/admin" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
                <Shield className="w-3.5 h-3.5" />
                <span>Console</span>
              </Link>
            )}
          </nav>

          {/* User Status / Profile Action */}
          <div className="hidden md:flex items-center gap-4">
            {session?.user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-indigo-500/30 hover:bg-white/[0.08] transition-all group"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">
                    {(session.user.name ?? "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#f5f5f7] font-display leading-none group-hover:text-indigo-300 transition-colors">{session.user.name ?? "User"}</p>
                  </div>
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-2 text-[#71717a] hover:text-rose-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="btn-secondary px-4 py-2 text-xs font-mono uppercase tracking-wider">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary px-5 py-2 text-xs font-mono uppercase tracking-wider">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            className="md:hidden p-2 text-[#a1a1aa] hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-white/10 space-y-4 font-mono text-xs uppercase">
            <Link href="/products" className="block text-[#a1a1aa] hover:text-white py-1" onClick={() => setIsMenuOpen(false)}>Catalog</Link>
            <Link href="/categories" className="block text-[#a1a1aa] hover:text-white py-1" onClick={() => setIsMenuOpen(false)}>Categories</Link>
            {session?.user && (
              <>
                <Link href="/profile" className="block text-indigo-400 font-semibold py-1" onClick={() => setIsMenuOpen(false)}>My Profile</Link>
                <Link href="/cart" className="flex items-center justify-between text-[#a1a1aa] hover:text-white py-1" onClick={() => setIsMenuOpen(false)}>
                  <span>Cart</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">{cartCount}</span>
                </Link>
                <Link href="/orders" className="block text-[#a1a1aa] hover:text-white py-1" onClick={() => setIsMenuOpen(false)}>Orders</Link>
              </>
            )}
            {session?.user?.role === "admin" && (
              <Link href="/admin" className="block text-indigo-400 font-semibold py-1" onClick={() => setIsMenuOpen(false)}>Admin Console ⚡</Link>
            )}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {session?.user ? (
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); setIsMenuOpen(false); }}
                  className="btn-secondary w-full py-2.5 text-xs text-rose-400"
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
