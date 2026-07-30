"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="glass overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-red-400 via-rose-500 to-pink-500" />
          <CardContent className="p-8 text-center space-y-6">
            {/* Error Illustration */}
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-400/20 to-rose-500/20 animate-pulse" />
              <div className="relative flex items-center justify-center w-full h-full">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-heading font-bold text-[var(--foreground)]">
                Something went wrong
              </h1>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                An unexpected error occurred. Our team has been notified.
                Please try again or return to the dashboard.
              </p>
              {error.digest && (
                <p className="text-[10px] text-[var(--muted)] font-mono mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={reset}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Link href="/dashboard">
                <Button className="w-full gap-2">
                  <Home className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
