"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Target,
  Trophy,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  Layers,
  Zap,
  BookOpen,
} from "lucide-react";

interface DashboardData {
  user: {
    name: string;
    email: string;
    tier: { name: string; color: string; icon: string } | null;
  };
  stats: {
    overallScore: number;
    conceptsMastered: number;
    totalConcepts: number;
    totalQuizzes: number;
    currentStreak: number;
    tierProgress: number;
    nextTier: { name: string; minScore: number } | null;
  };
  weakConcepts: Array<{
    id: string;
    name: string;
    subDomain: string;
    score: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    score: number;
    completedAt: string;
    conceptCount: number;
  }>;
  subDomainScores: Array<{
    name: string;
    score: number;
    color: string;
  }>;
  spacedDue: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-zinc-400">
          <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-zinc-400" />
        <p className="text-zinc-500">Could not load dashboard data.</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const { stats, weakConcepts, recentActivity, subDomainScores, spacedDue } = data;
  const tier = data.user.tier;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, {data.user.name.split(" ")[0]}!
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {spacedDue > 0
              ? `You have ${spacedDue} concept${spacedDue > 1 ? "s" : ""} due for review`
              : "You're all caught up! Take a practice quiz to keep learning."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/quiz">
            <Button className="gap-2">
              <Brain className="w-4 h-4" />
              Start Quiz
            </Button>
          </Link>
          <Link href="/quiz/diagnostic">
            <Button variant="outline" className="gap-2">
              <Zap className="w-4 h-4" />
              Diagnostic
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Mastery */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
              <Target className="w-3.5 h-3.5" />
              Overall Mastery
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{stats.overallScore}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.overallScore} className="h-2" />
            {tier && (
              <p className="text-xs text-zinc-500 mt-2" style={{ color: tier.color }}>
                {tier.icon} {tier.name}
              </p>
            )}
          </CardContent>
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -translate-y-8 translate-x-8" />
        </Card>

        {/* Concepts Mastered */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              Concepts Mastered
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {stats.conceptsMastered}
              <span className="text-lg text-zinc-400 font-normal"> / {stats.totalConcepts}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(stats.conceptsMastered / stats.totalConcepts) * 100} className="h-2" />
            <p className="text-xs text-zinc-500 mt-2">
              {Math.round((stats.conceptsMastered / stats.totalConcepts) * 100)}% of all concepts
            </p>
          </CardContent>
        </Card>

        {/* Tier Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              {stats.nextTier ? `Next: ${stats.nextTier.name}` : "Max Tier"}
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {stats.nextTier ? `${Math.round(stats.tierProgress)}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.nextTier && (
              <>
                <Progress value={stats.tierProgress} className="h-2" />
                <p className="text-xs text-zinc-500 mt-2">
                  {Math.round(100 - stats.tierProgress)}% to {stats.nextTier.name}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              Active Streak
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {stats.currentStreak}
              <span className="text-lg text-zinc-400 font-normal"> days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500 mt-2">
              {stats.totalQuizzes} quiz{stats.totalQuizzes !== 1 ? "zes" : ""} completed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sub-Domain Scores */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-violet-600" />
              Sub-Domain Mastery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subDomainScores.map((sd) => (
              <div key={sd.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{sd.name}</span>
                  <span className="text-zinc-500">{sd.score}%</span>
                </div>
                <Progress value={sd.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weak Concepts & Stats */}
        <div className="space-y-6">
          {/* Weak Concepts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Focus Areas
              </CardTitle>
              <CardDescription>Concepts needing the most attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {weakConcepts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <p className="text-sm text-zinc-500">No weak concepts!</p>
                  <p className="text-xs text-zinc-400">You&apos;re doing great.</p>
                </div>
              ) : (
                weakConcepts.slice(0, 3).map((concept) => (
                  <div
                    key={concept.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{concept.name}</p>
                      <p className="text-xs text-zinc-500">{concept.subDomain}</p>
                    </div>
                    <Badge variant={concept.score < 30 ? "destructive" : concept.score < 50 ? "warning" : "secondary"}>
                      {concept.score}%
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Spaced Repetition Due */}
          {spacedDue > 0 && (
            <Link href="/quiz?mode=spaced">
              <Card className="cursor-pointer hover:shadow-md transition-all duration-200 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-violet-200 dark:border-violet-800">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Spaced Repetition Due</p>
                    <p className="text-sm text-zinc-500">
                      {spacedDue} concept{spacedDue > 1 ? "s" : ""} to review
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-400" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-violet-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Brain className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
              <p className="text-zinc-500 font-medium">No activity yet</p>
              <p className="text-sm text-zinc-400">Take your first quiz to get started!</p>
              <Link href="/quiz/diagnostic">
                <Button variant="default" className="mt-2 gap-2">
                  <Sparkles className="w-4 h-4" />
                  Start Diagnostic
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        activity.type === "diagnostic"
                          ? "bg-violet-100 dark:bg-violet-900/30"
                          : activity.type === "spaced_repetition"
                          ? "bg-amber-100 dark:bg-amber-900/30"
                          : "bg-emerald-100 dark:bg-emerald-900/30"
                      }`}
                    >
                      {activity.type === "diagnostic" ? (
                        <Zap className="w-4 h-4 text-violet-600" />
                      ) : activity.type === "spaced_repetition" ? (
                        <BookOpen className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Brain className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{activity.type.replace("_", " ")}</p>
                      <p className="text-xs text-zinc-500">
                        {activity.conceptCount} concept{activity.conceptCount > 1 ? "s" : ""} •{" "}
                        {new Date(activity.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {activity.score !== null && (
                    <Badge variant={activity.score >= 70 ? "success" : activity.score >= 40 ? "warning" : "destructive"}>
                      {Math.round(activity.score)}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
