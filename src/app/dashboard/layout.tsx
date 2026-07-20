"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AvatarActivityProvider } from "@/components/avatar-activity-provider";
import {
  LayoutDashboard,
  Brain,
  Trophy,
  Shield,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  overallScore?: number;
  conceptsCount?: number;
  tier?: { name: string; color: string; icon: string } | null;
}

// Dynamic import for the Three.js avatar companion
import dynamic from "next/dynamic";
const AvatarCompanionDynamic = dynamic(
  () => import("@/components/avatar-companion").then((m) => m.AvatarCompanionInner),
  { ssr: false }
);

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

        // Redirect to avatar onboarding if user has no avatar and hasn't skipped
        if (
          !data.data.avatarUrl &&
          pathname === "/dashboard" &&
          !sessionStorage.getItem("avatarSkipped")
        ) {
          router.push("/onboarding/avatar");
        }
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

  return (
    <AvatarActivityProvider>
    <div className="min-h-screen bg-[var(--background)]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--primary)]" />
            <span className="font-heading font-semibold text-base text-[var(--foreground)]">Chaduvkondi</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-[var(--soft)] transition-colors text-[var(--foreground)]">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-[var(--foreground)]/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-30 h-full w-60 bg-[var(--surface)] border-r border-[var(--border)] transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-[var(--border)]">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-md bg-[var(--primary)] flex items-center justify-center text-[var(--background)] text-xs font-heading font-semibold group-hover:bg-[var(--primary-light)] transition-colors duration-200">C</div>
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--background)]"
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
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                  pathname.startsWith("/admin")
                    ? "bg-[var(--primary)] text-[var(--background)]"
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
          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Avatar className="h-8 w-8">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-[var(--foreground)]">{user.name}</p>
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
        <main className="p-5 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>

      {/* Avatar Companion – dynamically loaded */}
      <AvatarCompanionDynamic avatarUrl={user.avatarUrl ?? null} />
    </div>
    </AvatarActivityProvider>
  );
}
