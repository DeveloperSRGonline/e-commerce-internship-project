import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { LayoutDashboard, Package, ShoppingBag, Layers, Users, BarChart3, ArrowLeft, Zap } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/users", label: "Users", icon: Users },
];

export const metadata = {
  title: "Admin Console — ShopIN Pro",
  description: "ShopIN Administration Panel",
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();

  if (!session?.user?.userId || session.user.role !== "admin") {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#a1a1aa] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0a0f]/90 backdrop-blur-xl border-r border-white/[0.08] flex flex-col fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-white/[0.08] space-y-3">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 p-[1px] shadow-[0_0_20px_rgba(99,102,241,0.35)]">
              <div className="w-full h-full bg-[#0a0a0f] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-base font-extrabold text-[#f5f5f7] font-display block">ShopIN Admin</span>
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block">SYSTEM CONSOLE</span>
            </div>
          </Link>

          <div className="pt-2 flex items-center justify-between text-xs font-mono">
            <span className="text-[#71717a] truncate max-w-[120px]">{session.user.name}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
              ONLINE
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono text-[#a1a1aa] hover:text-[#f5f5f7] hover:bg-white/[0.05] transition-all group border border-transparent hover:border-white/[0.08]"
              >
                <Icon className="w-4 h-4 text-[#71717a] group-hover:text-indigo-400 transition-colors" />
                <span className="uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08]">
          <Link href="/" className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Store</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}
