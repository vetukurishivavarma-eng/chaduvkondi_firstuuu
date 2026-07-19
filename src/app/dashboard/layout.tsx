"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Brain,
  Trophy,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  overallScore?: number;
  conceptsCount?: number;
  tier?: { name: string; color: string; icon: string } | null;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quiz", label: "Quiz", icon: Brain },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUser(data.data);
        else router.push("/login");
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1E8]">
        <div className="flex items-center gap-2 text-[#9C9A94]">
          <div className="w-5 h-5 border-2 border-[#3D5A45] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#FAF8F4] border-b border-[#E3DFD4]">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#3D5A45]" />
            <span className="font-heading font-semibold text-base">Chaduvkondi</span>
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-[#EDE9DF] transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-[#2B2925]/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-30 h-full w-60 bg-[#FAF8F4] border-r border-[#E3DFD4] transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-[#E3DFD4]">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-md bg-[#3D5A45] flex items-center justify-center text-[#F5F1E8] text-xs font-heading font-semibold group-hover:bg-[#4B6E55] transition-colors duration-200">C</div>
              <div>
                <span className="font-heading font-semibold text-base">Chaduvkondi</span>
                <p className="text-xs text-[#9C9A94]">Mastery Platform</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#3D5A45] text-[#F5F1E8]"
                      : "text-[#9C9A94] hover:text-[#2B2925] hover:bg-[#EDE9DF]"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}

            {user.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                  pathname.startsWith("/admin")
                    ? "bg-[#3D5A45] text-[#F5F1E8]"
                    : "text-[#9C9A94] hover:text-[#2B2925] hover:bg-[#EDE9DF]"
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* User Footer */}
          <div className="p-4 border-t border-[#E3DFD4]">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-[#2B2925]">{user.name}</p>
                {user.tier && (
                  <span className="text-xs" style={{ color: user.tier.color }}>
                    {user.tier.icon} {user.tier.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[#9C9A94] hover:text-[#B5533C] hover:bg-[#B5533C]/5 rounded-md transition-all duration-150"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-60 pt-14 lg:pt-0">
        <main className="p-5 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
