"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

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

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-violet-50 dark:from-black dark:via-zinc-950 dark:to-violet-950/20 p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-violet-200/30 dark:bg-violet-800/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 mt-2">
              If an account exists with <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span>,
              we&apos;ve sent a password reset link. It expires in 1 hour.
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
              >
                try again
              </button>
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full h-11 gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-violet-50 dark:from-black dark:via-zinc-950 dark:to-violet-950/20 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200/30 dark:bg-violet-800/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
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
                className="h-11"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
            <Link
              href="/login"
              className="w-full"
            >
              <Button variant="outline" className="w-full h-11 gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
