"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

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
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Reset failed"); return; }
      setSuccess(true);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-sm animate-scale-in">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-[#B5533C]/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-[#B5533C]" />
            </div>
          </div>
          <CardTitle className="text-xl">Invalid link</CardTitle>
          <CardDescription>This password reset link has expired. Please request a new one.</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Link href="/forgot-password" className="w-full"><Button className="w-full gap-2"><ArrowLeft className="w-4 h-4" />Request New Link</Button></Link>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-sm animate-scale-in">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-[#3D5A45]/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#3D5A45]" />
            </div>
          </div>
          <CardTitle className="text-xl">Password reset!</CardTitle>
          <CardDescription>Your password has been successfully updated. Sign in with your new password.</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Link href="/login" className="w-full"><Button className="w-full">Sign In</Button></Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm animate-fade-in">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">Set new password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-2.5 text-sm bg-[#B5533C]/10 border border-[#B5533C]/20 text-[#B5533C] rounded-md">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" className="pr-9" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9C9A94] hover:text-[#2B2925] transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resetting...</> : "Reset Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-4">
      <Link href="/" className="fixed top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#9C9A94] hover:text-[#3D5A45] hover:bg-[#EDE9DF] transition-all duration-150">
        <ArrowLeft className="w-4 h-4" />
        <span>Home</span>
      </Link>

      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-md bg-[#3D5A45]" />
          <span className="font-heading font-semibold text-lg tracking-tight text-[#2B2925]">Chaduvkondi</span>
        </div>
        <Suspense fallback={<div className="flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#3D5A45] border-t-transparent rounded-full animate-spin" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
