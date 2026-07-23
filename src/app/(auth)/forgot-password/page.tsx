"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      setSent(true);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Link href="/"        className="fixed top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--soft)] transition-all duration-150">
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Card className="w-full max-w-sm animate-scale-in glass">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
            <CardTitle className="text-xl text-gradient">Check your email</CardTitle>
            <CardDescription className="mt-2">
              If an account exists with <span className="font-medium text-[var(--foreground)]">{email}</span>,
              we&apos;ve sent a password reset link. It expires in 1 hour.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-[var(--muted)]">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button onClick={() => { setSent(false); setEmail(""); }} className="text-[var(--primary)] hover:underline font-medium">try again</button>
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Link href="/login" className="w-full"><Button variant="outline" className="w-full gap-2"><ArrowLeft className="w-4 h-4" />Back to Sign In</Button></Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-4">
      <Link href="/"        className="fixed top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--soft)] transition-all duration-150">
        <ArrowLeft className="w-4 h-4" />
        <span>Home</span>
      </Link>

      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-md bg-[var(--primary)]" />
          <span className="font-heading font-semibold text-lg tracking-tight text-[var(--foreground)]">Chaduvkondi</span>
        </div>

        <Card className="glass animate-scale-in">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-gradient">Forgot password?</CardTitle>
            <CardDescription>Enter your email and we&apos;ll send you a reset link</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-2.5 text-sm bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] rounded-md">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : "Send Reset Link"}
              </Button>
              <Link href="/login" className="w-full"><Button variant="outline" className="w-full gap-2"><ArrowLeft className="w-4 h-4" />Back to Sign In</Button></Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
