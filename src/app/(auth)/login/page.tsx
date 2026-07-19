"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Eye, EyeOff, Circle, Hexagon, Star, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-emerald-50 dark:from-black dark:via-zinc-950 dark:to-emerald-950/20 p-4 overflow-hidden">
      {/* Floating background shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[15%] left-[10%] w-64 h-64 bg-emerald-200/20 dark:bg-emerald-800/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-teal-200/20 dark:bg-teal-800/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-[40%] right-[30%] w-48 h-48 bg-amber-200/15 dark:bg-amber-800/10 rounded-full blur-3xl animate-drift" />
        <div className="absolute bottom-[40%] left-[5%] w-40 h-40 bg-emerald-200/15 dark:bg-emerald-800/10 rounded-full blur-3xl animate-spin-slow" />
        <div className="absolute top-[20%] left-[30%] animate-float">
          <Circle className="w-6 h-6 text-emerald-300/20 dark:text-emerald-500/10" />
        </div>
        <div className="absolute bottom-[30%] right-[20%] animate-float-delayed">
          <Star className="w-5 h-5 text-amber-300/20 dark:text-amber-500/10" />
        </div>
      </div>

      {/* Home Navigation */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/80 dark:hover:bg-zinc-900/80 backdrop-blur-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-200 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
        <span className="font-medium">Home</span>
      </Link>

      <Card className="w-full max-w-md relative z-10 backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-2xl animate-fade-in-up">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 animate-bounce-gentle">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Sign in to continue your learning journey
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-2 animate-fade-in-up stagger-1">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 transition-all duration-200 focus:scale-[1.01]"
              />
            </div>

            <div className="space-y-2 animate-fade-in-up stagger-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10 transition-all duration-200 focus:scale-[1.01]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2 animate-fade-in-up stagger-3">
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <p className="text-sm text-center text-zinc-500 dark:text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
