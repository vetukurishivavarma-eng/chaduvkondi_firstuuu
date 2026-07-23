"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, ArrowLeft, Sparkles } from "lucide-react";

const MOODS = [
  { id: "hype", emoji: "🔥", label: "Hype Mode", desc: "LET'S GO! Energy maxed out!", color: "#ef4444", bg: "from-red-500/20 to-orange-500/10" },
  { id: "chill", emoji: "😎", label: "Chill Vibes", desc: "Keep it cool, keep it smooth.", color: "#22c55e", bg: "from-green-500/20 to-emerald-500/10" },
  { id: "focused", emoji: "🎯", label: "Locked In", desc: "Zero distractions. Full focus.", color: "#3b82f6", bg: "from-blue-500/20 to-indigo-500/10" },
  { id: "tired", emoji: "😴", label: "Tired Dev", desc: "Coffee-powered problem solving.", color: "#a855f7", bg: "from-purple-500/20 to-pink-500/10" },
  { id: "stressed", emoji: "😰", label: "Stressed Out", desc: "Deadlines? What deadlines?", color: "#f59e0b", bg: "from-amber-500/20 to-yellow-500/10" },
  { id: "confused", emoji: "🤔", label: "Confused", desc: "Wait... what?", color: "#ec4899", bg: "from-pink-500/20 to-rose-500/10" },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "mood">("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mood, setMood] = useState("chill");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, mood }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
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
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <Link
        href="/"
        className="fixed top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--soft)] transition-all duration-150"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Home</span>
      </Link>

      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] shadow-sm" />
          <span className="font-heading font-semibold text-lg tracking-tight text-[var(--foreground)]">Chaduvkondi</span>
        </div>

        {step === "info" ? (
          <Card className="overflow-hidden glass animate-scale-in">
            <div className="h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--primary-light)] to-[var(--secondary)]" />
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-gradient">Create your account</CardTitle>
              <CardDescription>Start your mastery journey today</CardDescription>
            </CardHeader>

            <form onSubmit={(e) => { e.preventDefault(); setStep("mood"); }}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-2.5 text-sm bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="transition-all duration-200 focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="transition-all duration-200 focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
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
                      className="pr-9 transition-all duration-200 focus:ring-2 focus:ring-[var(--primary)]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="transition-all duration-200 focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button type="submit" className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] hover:shadow-lg transition-all duration-200">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Continue
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card className="overflow-hidden glass animate-scale-in">
            <div className="h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--error)]" />
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">What's your vibe?</CardTitle>
              <CardDescription>
                Pick your mood — we'll tailor your learning experience with memes and energy just for you.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-2">
                {error && (
                  <div className="p-2.5 text-sm bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] rounded-md">
                    {error}
                  </div>
                )}

                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                      mood === m.id
                        ? "border-[var(--foreground)] bg-gradient-to-r " + m.bg + " shadow-md scale-[1.02]"
                        : "border-[var(--border)] hover:border-[var(--muted)] hover:bg-[var(--soft)]/50"
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm" style={{ color: m.color }}>{m.label}</p>
                      <p className="text-xs text-[var(--muted)]">{m.desc}</p>
                    </div>
                    {mood === m.id && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    )}
                  </button>
                ))}
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] hover:shadow-lg transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                  ) : (
                    "Create Account 🚀"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  ← Back
                </button>
              </CardFooter>
            </form>
          </Card>
        )}

        <p className="mt-6 text-sm text-center text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--primary)] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
