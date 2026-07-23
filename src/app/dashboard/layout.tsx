"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Brain,
  Trophy,
  Shield,
  LogOut,
  Menu,
  X,
  Sparkles,
  Smile,
  Zap,
  Moon,
  Cloud,
  Flame,
  Coffee,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  mood?: string;
  overallScore?: number;
  conceptsCount?: number;
  tier?: { name: string; color: string; icon: string } | null;
}

const MOOD_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  hype: { icon: "🔥", label: "Hype Mode", color: "#ef4444" },
  chill: { icon: "😎", label: "Chill Vibes", color: "#22c55e" },
  focused: { icon: "🎯", label: "Locked In", color: "#3b82f6" },
  tired: { icon: "😴", label: "Tired Dev", color: "#a855f7" },
  stressed: { icon: "😰", label: "Stressed Out", color: "#f59e0b" },
  confused: { icon: "🤔", label: "Confused", color: "#ec4899" },
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quiz", label: "Quiz", icon: Brain },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: Sparkles },
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
        if (!data.success) {
          router.push("/login");
          return;
        }
        setUser(data.data);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router, pathname]);

  async function handleLogout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const moodConfig = MOOD_CONFIG[user.mood || "chill"] || MOOD_CONFIG.chill;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[var(--surface)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)]" />
            <span className="font-heading font-semibold text-base text-[var(--foreground)]">Chaduvkondi</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm" title={moodConfig.label}>{moodConfig.icon}</span>
            <ThemeToggle />
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-[var(--soft)] transition-colors text-[var(--foreground)]">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-[var(--foreground)]/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-30 h-full w-60 bg-[var(--surface)]/80 backdrop-blur-lg border-r border-[var(--border)] transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-[var(--border)]">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-[var(--background)] text-xs font-heading font-semibold shadow-md group-hover:shadow-lg transition-all duration-200">C</div>
              <div>
                <span className="font-heading font-semibold text-base text-[var(--foreground)]">Chaduvkondi</span>
                <p className="text-xs text-[var(--muted)]">Mastery Platform</p>
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-[var(--background)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)]"
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  pathname.startsWith("/admin")
                    ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-[var(--background)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)]"
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}

            {/* Theme Toggle in sidebar */}
            <div className="pt-2 mt-2 border-t border-[var(--border)]">
              <ThemeToggle variant="sidebar" />
            </div>
          </nav>

          {/* User Footer */}
          <div className="p-4 border-t border-[var(--border)] bg-gradient-to-t from-[var(--soft)]/20">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Avatar className="h-8 w-8 ring-2 ring-[var(--primary)]/20">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="text-xs bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-[var(--background)]">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate text-[var(--foreground)]">{user.name}</p>
                  <span className="text-xs" title={moodConfig.label}>{moodConfig.icon}</span>
                </div>
                {user.tier && (
                  <span className="text-xs" style={{ color: user.tier.color }}>
                    {user.tier.icon} {user.tier.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/5 rounded-md transition-all duration-150"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-60 pt-14 lg:pt-0">
        <main className="p-5 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
