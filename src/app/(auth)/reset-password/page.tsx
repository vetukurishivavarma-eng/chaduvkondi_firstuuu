"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Circle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Reset failed");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md relative z-10 backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-2xl animate-scale-in">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Invalid link</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400 mt-2">
            This password reset link is invalid or has expired. Please request a new one.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full h-11 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Request New Link
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md relative z-10 backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-2xl animate-scale-in">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 animate-bounce-gentle">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Password reset!</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400 mt-2">
            Your password has been successfully updated. You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Link href="/login" className="w-full">
            <Button className="w-full h-11">
              Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md relative z-10 backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-2xl animate-fade-in-up">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 animate-bounce-gentle">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">
          Enter your new password below
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl animate-fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2 animate-fade-in-up stagger-1">
            <Label htmlFor="password" className="text-sm font-medium">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
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

          <div className="space-y-2 animate-fade-in-up stagger-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="h-11 transition-all duration-200 focus:scale-[1.01]"
            />
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
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-emerald-50 dark:from-black dark:via-zinc-950 dark:to-emerald-950/20 p-4 overflow-hidden">
      {/* Floating background shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[15%] left-[10%] w-64 h-64 bg-emerald-200/20 dark:bg-emerald-800/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-teal-200/20 dark:bg-teal-800/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-[40%] right-[30%] w-48 h-48 bg-amber-200/15 dark:bg-amber-800/10 rounded-full blur-3xl animate-drift" />
        <div className="absolute bottom-[40%] left-[5%] w-40 h-40 bg-emerald-200/15 dark:bg-emerald-800/10 rounded-full blur-3xl animate-spin-slow" />
        <div className="absolute top-[25%] right-[25%] animate-float">
          <Circle className="w-6 h-6 text-emerald-300/20 dark:text-emerald-500/10" />
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

      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
