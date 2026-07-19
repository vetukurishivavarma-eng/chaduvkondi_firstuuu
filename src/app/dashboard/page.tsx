"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Zap,
  BookOpen,
} from "lucide-react";

interface DashboardData {
  user: { name: string; email: string; tier: { name: string; color: string; icon: string } | null };
  stats: {
    overallScore: number;
    conceptsMastered: number;
    totalConcepts: number;
    totalQuizzes: number;
    currentStreak: number;
    tierProgress: number;
    nextTier: { name: string; minScore: number } | null;
  };
  weakConcepts: Array<{ id: string; name: string; subDomain: string; score: number }>;
  recentActivity: Array<{ id: string; type: string; score: number; completedAt: string; conceptCount: number }>;
  subDomainScores: Array<{ name: string; score: number; color: string }>;
  spacedDue: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((res) => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-[#9C9A94]">
          <div className="w-5 h-5 border-2 border-[#3D5A45] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-[#9C9A94]" />
        <p className="text-[#9C9A94] text-sm">Could not load dashboard data.</p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">Try Again</Button>
      </div>
    );
  }

  const { stats, weakConcepts, recentActivity, subDomainScores, spacedDue } = data;
  const tier = data.user.tier;

  return (
    <div className="space-y-5">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-semibold tracking-tight text-[#2B2925]">
            Welcome back, {data.user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-[#9C9A94] mt-0.5">
            {spacedDue > 0
              ? `${spacedDue} concept${spacedDue > 1 ? "s" : ""} due for review`
              : "You're all caught up! Take a practice quiz to keep learning."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/quiz"><Button size="sm" className="gap-1.5"><Brain className="w-3.5 h-3.5" />Start Quiz</Button></Link>
          <Link href="/quiz/diagnostic"><Button variant="outline" size="sm" className="gap-1.5"><Zap className="w-3.5 h-3.5" />Diagnostic</Button></Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">Overall Mastery</CardDescription>
            <CardTitle className="text-2xl">{stats.overallScore}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.overallScore} className="h-1.5" />
            {tier && <p className="text-xs mt-1.5" style={{ color: tier.color }}>{tier.icon} {tier.name}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">Mastered</CardDescription>
            <CardTitle className="text-2xl">{stats.conceptsMastered}<span className="text-sm text-[#9C9A94] font-normal"> / {stats.totalConcepts}</span></CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(stats.conceptsMastered / stats.totalConcepts) * 100} className="h-1.5" />
            <p className="text-xs text-[#9C9A94] mt-1.5">{Math.round((stats.conceptsMastered / stats.totalConcepts) * 100)}% of concepts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">{stats.nextTier ? `Next: ${stats.nextTier.name}` : "Max Tier"}</CardDescription>
            <CardTitle className="text-2xl">{stats.nextTier ? `${Math.round(stats.tierProgress)}%` : "—"}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.nextTier && <><Progress value={stats.tierProgress} className="h-1.5" /><p className="text-xs text-[#9C9A94] mt-1.5">{Math.round(100 - stats.tierProgress)}% to {stats.nextTier.name}</p></>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">Streak</CardDescription>
            <CardTitle className="text-2xl">{stats.currentStreak}<span className="text-sm text-[#9C9A94] font-normal"> days</span></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[#9C9A94] mt-1.5">{stats.totalQuizzes} quiz{stats.totalQuizzes !== 1 ? "zes" : ""} completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sub-Domain Scores */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="w-4 h-4 text-[#3D5A45]" />Sub-Domain Mastery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subDomainScores.map((sd) => (
              <div key={sd.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#2B2925]">{sd.name}</span>
                  <span className="text-[#9C9A94]">{sd.score}%</span>
                </div>
                <Progress value={sd.score} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weak Concepts & Spaced Rep */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><AlertCircle className="w-4 h-4 text-[#C08A3E]" />Focus Areas</CardTitle>
              <CardDescription>Concepts needing the most attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {weakConcepts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <CheckCircle2 className="w-7 h-7 text-[#3D5A45]" />
                  <p className="text-sm text-[#9C9A94]">No weak concepts!</p>
                </div>
              ) : (
                weakConcepts.slice(0, 3).map((concept) => (
                  <div key={concept.id} className="flex items-center justify-between p-2.5 bg-[#EDE9DF]/50 rounded-md">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-[#2B2925]">{concept.name}</p>
                      <p className="text-xs text-[#9C9A94]">{concept.subDomain}</p>
                    </div>
                    <Badge variant={concept.score < 30 ? "destructive" : concept.score < 50 ? "warning" : "secondary"}>{concept.score}%</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {spacedDue > 0 && (
            <Link href="/quiz?mode=spaced">
              <Card className="cursor-pointer card-lift border-[#3D5A45]/20 bg-[#3D5A45]/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-md bg-[#3D5A45] flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[#F5F1E8]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-heading font-semibold text-sm text-[#2B2925]">Review Due</p>
                    <p className="text-xs text-[#9C9A94]">{spacedDue} concept{spacedDue > 1 ? "s" : ""} to review</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9C9A94]" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Clock className="w-4 h-4 text-[#3D5A45]" />Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Brain className="w-8 h-8 text-[#E3DFD4]" />
              <p className="text-sm text-[#9C9A94]">No activity yet</p>
              <Link href="/quiz/diagnostic"><Button size="sm" variant="outline" className="mt-1">Start Diagnostic</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-2.5 bg-[#EDE9DF]/30 rounded-md">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#3D5A45]/10">
                      {activity.type === "diagnostic" ? <Zap className="w-3.5 h-3.5 text-[#3D5A45]" /> :
                       activity.type === "spaced_repetition" ? <BookOpen className="w-3.5 h-3.5 text-[#C08A3E]" /> :
                       <Brain className="w-3.5 h-3.5 text-[#3D5A45]" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2B2925] capitalize">{activity.type.replace("_", " ")}</p>
                      <p className="text-xs text-[#9C9A94]">{activity.conceptCount} concept{activity.conceptCount > 1 ? "s" : ""} • {new Date(activity.completedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {activity.score !== null && (
                    <Badge variant={activity.score >= 70 ? "success" : activity.score >= 40 ? "warning" : "destructive"} className="text-xs">{Math.round(activity.score)}%</Badge>
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
