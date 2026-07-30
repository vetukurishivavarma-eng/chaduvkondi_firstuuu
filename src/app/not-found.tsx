"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="glass overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
          <CardContent className="p-8 text-center space-y-6">
            {/* 404 Illustration */}
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 animate-pulse" />
              <div className="relative flex items-center justify-center w-full h-full">
                <span className="text-6xl font-heading font-bold text-gradient">404</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-heading font-bold text-[var(--foreground)]">
                Page not found
              </h1>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
                Let&apos;s get you back on track.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
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
