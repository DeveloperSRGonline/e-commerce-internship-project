import { auth } from "@/lib/auth";
import { connectToDB } from "@/lib/db/connect";
import User from "@/models/User.model";
import Order from "@/models/Order.model";
import Navbar from "@/components/ui/Navbar";
import { redirect } from "next/navigation";
import { User as UserIcon, Mail, Shield, MapPin, Package, Clock, Calendar, Lock } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "My Profile — ShopIN Pro" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login?callbackUrl=/profile");

  await connectToDB();

  const [dbUser, recentOrdersCount] = await Promise.all([
    User.findById(session.user.userId).lean(),
    Order.countDocuments({ userId: session.user.userId }),
  ]);

  if (!dbUser) redirect("/login");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#a1a1aa]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-12 space-y-8">
        {/* Header */}
        <div className="border-b border-white/[0.06] pb-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">ACCOUNT</span>
            <h1 className="text-3xl font-extrabold text-[#f5f5f7] font-display">User Profile</h1>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-xs uppercase">
            {dbUser.role} ACCESS
          </span>
        </div>

        {/* Profile Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Card */}
          <div className="glass-panel rounded-3xl p-8 space-y-6 border border-white/[0.08] relative overflow-hidden">
            <div className="glow-ambient -top-10 -right-10 w-36 h-36 bg-indigo-600/15" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 p-[1px] shadow-[0_0_25px_rgba(99,102,241,0.35)]">
              <div className="w-full h-full bg-[#0a0a0f] rounded-[15px] flex items-center justify-center text-indigo-400 text-2xl font-bold font-display">
                {dbUser.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#f5f5f7] font-display">{dbUser.name}</h2>
              <p className="text-xs font-mono text-[#71717a] mt-1">{dbUser.email}</p>
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#71717a]">TOTAL ORDERS</span>
                <span className="text-[#f5f5f7] font-bold">{recentOrdersCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717a]">JOINED</span>
                <span className="text-[#f5f5f7]">
                  {new Date(dbUser.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Addresses Card */}
          <div className="md:col-span-2 glass-panel rounded-3xl p-8 space-y-6 border border-white/[0.08]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h3 className="text-base font-bold text-[#f5f5f7] font-display flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>Saved Addresses ({dbUser.addresses?.length ?? 0})</span>
              </h3>
              <Link href="/orders" className="text-xs font-mono text-indigo-400 hover:underline">
                View Order History →
              </Link>
            </div>

            {(!dbUser.addresses || dbUser.addresses.length === 0) ? (
              <div className="p-8 text-center text-xs font-mono text-[#71717a]">
                No saved addresses. Saved shipping addresses from checkout will appear here.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {dbUser.addresses.map((addr: any, i: number) => (
                  <div key={i} className="bg-[#14141f]/60 border border-white/[0.06] rounded-2xl p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#f5f5f7] font-bold uppercase">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p className="text-[#a1a1aa] leading-relaxed">
                      {addr.line1} {addr.line2 ? `, ${addr.line2}` : ""}<br />
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
