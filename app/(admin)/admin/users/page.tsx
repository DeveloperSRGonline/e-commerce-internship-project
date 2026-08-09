import { connectToDB } from "@/lib/db/connect";
import User from "@/models/User.model";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { Users, Shield, UserCheck } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export const metadata = { title: "Users — Admin Console | ShopIN" };

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { search } = await searchParams;
  await connectToDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">ACCOUNTS</span>
          <h1 className="text-3xl font-extrabold text-[#f5f5f7] font-display">Registered Users ({users.length})</h1>
        </div>
        <AdminSearchInput placeholder="Search users by name or email..." />
      </div>

      <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-white/[0.02] text-[#71717a] border-b border-white/[0.06]">
                <th className="text-left px-5 py-4 font-semibold uppercase">NAME</th>
                <th className="text-left px-5 py-4 font-semibold uppercase">EMAIL</th>
                <th className="text-center px-5 py-4 font-semibold uppercase">ROLE</th>
                <th className="text-right px-5 py-4 font-semibold uppercase">REGISTERED DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {users.map((user: any) => (
                <tr key={user._id.toString()} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-[#f5f5f7] font-semibold text-sm font-display">{user.name}</span>
                  </td>
                  <td className="px-5 py-4 text-[#a1a1aa]">{user.email}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold border ${user.role === "admin" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                      {user.role === "admin" ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-[#71717a]">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
