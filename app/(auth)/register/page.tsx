"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";
import { Zap, User, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4 text-[#a1a1aa] relative">
      {/* Background glow */}
      <div className="glow-ambient top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10" />

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/[0.1] relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="glow-ambient -top-20 -right-20 w-48 h-48 bg-indigo-600/20" />

          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 p-[1px] shadow-[0_0_25px_rgba(99,102,241,0.4)] mx-auto flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0a0f] rounded-[15px] flex items-center justify-center">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-[#f5f5f7] font-display">Create Account</h1>
            <p className="text-xs text-[#71717a] font-mono uppercase tracking-wider">Join ShopIN Pro Platform</p>
          </div>

          <form action={formAction} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="register-name" className="block text-xs font-mono font-medium text-[#a1a1aa] uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#71717a] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Aditya Sharma"
                  className="w-full pl-10 pr-4 py-3 bg-[#14141f] border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                />
              </div>
              {state.errors?.name && (
                <p className="text-rose-400 text-xs font-mono mt-1">{state.errors.name[0]}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="block text-xs font-mono font-medium text-[#a1a1aa] uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#71717a] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="aditya@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#14141f] border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                />
              </div>
              {state.errors?.email && (
                <p className="text-rose-400 text-xs font-mono mt-1">{state.errors.email[0]}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="register-password" className="block text-xs font-mono font-medium text-[#a1a1aa] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#71717a] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#14141f] border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                />
              </div>
              {state.errors?.password && (
                <p className="text-rose-400 text-xs font-mono mt-1">{state.errors.password[0]}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="register-confirm-password" className="block text-xs font-mono font-medium text-[#a1a1aa] uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#71717a] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#14141f] border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                />
              </div>
              {state.errors?.confirmPassword && (
                <p className="text-rose-400 text-xs font-mono mt-1">{state.errors.confirmPassword[0]}</p>
              )}
            </div>

            {/* General errors */}
            {state.errors?.general && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 flex items-center gap-2 text-xs text-rose-400 font-mono">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{state.errors.general[0]}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={isPending}
              className="btn-primary w-full py-3.5 text-xs tracking-wider uppercase flex items-center justify-center gap-2 mt-4"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-xs text-[#71717a] font-mono mt-8">
            ALREADY HAVE AN ACCOUNT?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 transition-colors">
              SIGN IN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
