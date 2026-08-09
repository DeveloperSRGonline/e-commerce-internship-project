"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Zap, Mail, Lock, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const justRegistered = searchParams.get("registered") === "true";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please check your credentials.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/[0.1] relative overflow-hidden">
      {/* Background Subtle Accent Glow */}
      <div className="glow-ambient -top-20 -right-20 w-48 h-48 bg-indigo-600/20" />

      {/* Brand Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 p-[1px] shadow-[0_0_25px_rgba(99,102,241,0.4)] mx-auto flex items-center justify-center">
          <div className="w-full h-full bg-[#0a0a0f] rounded-[15px] flex items-center justify-center">
            <Zap className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-[#f5f5f7] font-display">Welcome Back</h1>
        <p className="text-xs text-[#71717a] font-mono uppercase tracking-wider">Access your ShopIN account</p>
      </div>

      {/* Success banner from registration */}
      {justRegistered && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 mb-6 flex items-center gap-2.5 text-xs text-emerald-400 font-mono">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Account created successfully. Sign in below.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-xs font-mono font-medium text-[#a1a1aa] uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#71717a] absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="aditya.sharma@example.com"
              className="w-full pl-10 pr-4 py-3 bg-[#14141f] border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="block text-xs font-mono font-medium text-[#a1a1aa] uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#71717a] absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-3 bg-[#14141f] border border-white/10 rounded-xl text-[#f5f5f7] placeholder-[#71717a] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-rose-400 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          id="login-submit-btn"
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3.5 text-xs tracking-wider uppercase flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Demo Credentials Box */}
        <div className="bg-[#14141f]/60 border border-white/[0.06] rounded-xl p-4 text-[11px] font-mono text-[#71717a] space-y-1">
          <p className="text-indigo-400 font-semibold uppercase">DEMO CREDENTIALS</p>
          <p className="truncate">Admin: aditya.sharma@example.com / Password123!</p>
          <p className="truncate">Customer: priya.patel@example.com / Password123!</p>
        </div>
      </form>

      {/* Register Link */}
      <p className="text-center text-xs text-[#71717a] font-mono mt-8">
        DON&apos;T HAVE AN ACCOUNT?{" "}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 transition-colors">
          CREATE ACCOUNT
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4 text-[#a1a1aa] relative">
      {/* Background glow */}
      <div className="glow-ambient top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10" />

      <div className="w-full max-w-md relative z-10">
        <Suspense fallback={<div className="glass-panel rounded-3xl h-96 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
