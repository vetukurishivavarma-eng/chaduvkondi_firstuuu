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
  Sparkles,
  X,
  Layers,
  ChevronDown,
  Code2,
  Flame,
  Building2,
  Target,
  TrendingUp,
  Award,
} from "lucide-react";
import StreakVisualization from "@/components/streak-visualization";
import DailyChallenge from "@/components/daily-challenge";
import Heatmap from "@/components/dashboard/heatmap";

interface TrackProgress {
  id: string;
  name: string;
  icon: string;
  color: string;
  score: number;
  conceptsMastered: number;
  totalConcepts: number;
  isActive: boolean;
}

interface CodingStats {
  stats: {
    totalSolved: number;
    totalProblems: number;
    totalSubmissions: number;
    uniqueProblemsAttempted: number;
    accepted: number;
    accuracy: number;
    codingStreak: number;
  };
  heatmap: Array<{ date: string; count: number; accepted: number }>;
  weeklyActivity: Array<{ day: string; count: number; accepted: number }>;
  companyProgress: Array<{
    name: string;
    slug: string;
    logoUrl: string | null;
    solved: number;
    total: number;
    percentage: number;
  }>;
  topicMastery: Array<{
    name: string;
    slug: string;
    icon: string;
    color: string;
    solved: number;
    total: number;
    percentage: number;
  }>;
}

interface DashboardData {
  user: {
    name: string;
    email: string;
    tier: { name: string; color: string; icon: string } | null;
    avatarUrl?: string | null;
    currentTrackId?: string | null;
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
  weakConcepts: Array<{ id: string; name: string; subDomain: string; score: number }>;
  recentActivity: Array<{
    id: string;
    type: string;
    score: number;
    completedAt: string;
    conceptCount: number;
    trackName: string | null;
    trackIcon: string | null;
  }>;
  subDomainScores: Array<{ name: string; score: number; color: string }>;
  spacedDue: number;
  tracks: TrackProgress[];
  allTracks: Array<{ id: string; name: string; icon: string; color: string }>;
  activeTrackId: string;
}

const TRACK_ICONS: Record<string, string> = {
  "Salesforce Developer": "☁️",
  "Python": "🐍",
  "JavaScript / TypeScript": "💛",
  "Java": "☕",
  "Go": "🔵",
  "Rust": "🦀",
  "Angular": "🅰️",
  "Django Backend": "🎯",
  "Full DevOps": "🛠️",
  "FastAPI": "⚡",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [trackDropdownOpen, setTrackDropdownOpen] = useState(false);
  const [codingStats, setCodingStats] = useState<CodingStats | null>(null);
  const [codingStatsLoading, setCodingStatsLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem("avatarBannerDismissed") === "true"
  );

  const fetchDashboard = (trackId?: string) => {
    setLoading(true);
    const url = trackId ? `/api/dashboard?trackId=${trackId}` : "/api/dashboard";
    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          if (!activeTrackId && res.data.activeTrackId) {
            setActiveTrackId(res.data.activeTrackId);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  const fetchCodingStats = () => {
    setCodingStatsLoading(true);
    fetch("/api/dashboard/coding-stats")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setCodingStats(res.data);
      })
      .finally(() => setCodingStatsLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
    fetchCodingStats();
  }, []);

  function switchTrack(trackId: string) {
    setActiveTrackId(trackId);
    setTrackDropdownOpen(false);
    fetchDashboard(trackId);
  }

  function dismissBanner() {
    setBannerDismissed(true);
    sessionStorage.setItem("avatarBannerDismissed", "true");
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-[var(--muted)]" />
        <p className="text-[var(--muted)] text-sm">Could not load dashboard data.</p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">Try Again</Button>
      </div>
    );
  }

  const { stats, weakConcepts, recentActivity, subDomainScores, spacedDue, tracks } = data;
  const tier = data.user.tier;
  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];

  return (
    <div className="space-y-5">
      {/* Avatar reminder banner */}
      {!data.user.avatarUrl && !bannerDismissed && (
        <div className="relative flex items-start gap-3 p-4 rounded-lg border border-[var(--secondary)]/30 bg-[var(--secondary)]/5 animate-fade-in">
          <div className="shrink-0 w-9 h-9 rounded-md bg-[var(--secondary)]/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[var(--secondary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)]">Set up your avatar</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Upload a profile photo so your avatar companion can appear on the dashboard.
            </p>
            <Link href="/profile" onClick={dismissBanner}>
              <Button size="sm" variant="link" className="h-auto p-0 mt-1.5 text-xs font-medium text-[var(--secondary)] hover:text-[var(--secondary-light)]">
                Upload Photo
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <button
            onClick={dismissBanner}
            className="shrink-0 p-1 rounded-md hover:bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Track Switcher + Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Track selector */}
          <div className="relative">
            <button
              onClick={() => setTrackDropdownOpen(!trackDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--soft)] transition-colors text-sm font-medium"
            >
              {activeTrack && (
                <>
                  <span>{activeTrack.icon || TRACK_ICONS[activeTrack.name] || "📚"}</span>
                  <span className="text-[var(--foreground)]">{activeTrack.name}</span>
                </>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform duration-200 ${trackDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {trackDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTrackDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg z-20 overflow-hidden animate-scale-in">
                  {tracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => switchTrack(track.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                        track.isActive
                          ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                          : "text-[var(--foreground)] hover:bg-[var(--soft)]"
                      }`}
                    >
                      <span className="text-lg">{track.icon || TRACK_ICONS[track.name] || "📚"}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm">{track.name}</p>
                        <p className="text-xs text-[var(--muted)]">{track.score}% mastered</p>
                      </div>
                      {track.isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <h1 className="font-heading text-xl md:text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Welcome back, {data.user.name.split(" ")[0]}
            </h1>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              {spacedDue > 0
                ? `${spacedDue} concept${spacedDue > 1 ? "s" : ""} due for review`
                : "You're all caught up! Take a practice quiz to keep learning."}
            </p>
          </div>
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
            <CardTitle className="text-2xl text-[var(--foreground)]">{stats.overallScore}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.overallScore} className="h-1.5" />
            {tier && <p className="text-xs mt-1.5" style={{ color: tier.color }}>{tier.icon} {tier.name}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">Mastered</CardDescription>
            <CardTitle className="text-2xl text-[var(--foreground)]">{stats.conceptsMastered}<span className="text-sm text-[var(--muted)] font-normal"> / {stats.totalConcepts}</span></CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.totalConcepts > 0 ? (stats.conceptsMastered / stats.totalConcepts) * 100 : 0} className="h-1.5" />
            <p className="text-xs text-[var(--muted)] mt-1.5">{stats.totalConcepts > 0 ? Math.round((stats.conceptsMastered / stats.totalConcepts) * 100) : 0}% of concepts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">{stats.nextTier ? `Next: ${stats.nextTier.name}` : "Max Tier"}</CardDescription>
            <CardTitle className="text-2xl text-[var(--foreground)]">{stats.nextTier ? `${Math.round(stats.tierProgress)}%` : "—"}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.nextTier && <><Progress value={stats.tierProgress} className="h-1.5" /><p className="text-xs text-[var(--muted)] mt-1.5">{Math.round(100 - stats.tierProgress)}% to {stats.nextTier.name}</p></>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5">
            <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">Streak</CardDescription>
            <CardTitle className="text-2xl text-[var(--foreground)]">{stats.currentStreak}<span className="text-sm text-[var(--muted)] font-normal"> days</span></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--muted)] mt-1.5">{stats.totalQuizzes} quiz{stats.totalQuizzes !== 1 ? "zes" : ""} completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-track progress summary */}
      {tracks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
              <Layers className="w-4 h-4 text-[var(--primary)]" />
              Track Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => switchTrack(track.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    track.id === activeTrackId
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--soft)]/50"
                  }`}
                >
                  <span className="text-xl">{track.icon || TRACK_ICONS[track.name] || "📚"}</span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-medium truncate text-[var(--foreground)]">{track.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Progress value={track.score} className="h-1 flex-1" />
                      <span className="text-[10px] text-[var(--muted)] w-7 text-right">{track.score}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Challenge & Streak row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-4">
          <DailyChallenge />
        </div>
        <div className="lg:col-span-2">
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                <Flame className="w-4 h-4 text-orange-500" />
                Learning Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StreakVisualization currentStreak={stats.currentStreak} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sub-Domain Scores */}
        <Card className="lg:col-span-2 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
              <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
              {activeTrack ? `${activeTrack.name} Sub-Domains` : "Sub-Domain Mastery"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subDomainScores.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Code2 className="w-7 h-7 text-[var(--muted)]" />
                <p className="text-sm text-[var(--muted)]">Take a quiz to see your sub-domain scores</p>
              </div>
            ) : (
              subDomainScores.map((sd) => (
                <div key={sd.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--foreground)]">{sd.name}</span>
                    <span className="text-[var(--muted)]">{sd.score}%</span>
                  </div>
                  <Progress value={sd.score} className="h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Coding Stats Summary */}
        {codingStats && !codingStatsLoading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Coding Interview</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <p className="text-xs text-[var(--muted)]">Solved</p>
                <p className="text-lg font-bold text-emerald-500">{codingStats.stats.totalSolved}<span className="text-xs font-normal text-[var(--muted)]">/{codingStats.stats.totalProblems}</span></p>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <p className="text-xs text-[var(--muted)]">Accuracy</p>
                <p className="text-lg font-bold text-[var(--foreground)]">{codingStats.stats.accuracy}%</p>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <p className="text-xs text-[var(--muted)]">Attempted</p>
                <p className="text-lg font-bold text-[var(--foreground)]">{codingStats.stats.uniqueProblemsAttempted}</p>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <p className="text-xs text-[var(--muted)]">Streak</p>
                <p className="text-lg font-bold text-orange-500">{codingStats.stats.codingStreak}<span className="text-xs font-normal text-[var(--muted)]"> days</span></p>
              </div>
            </div>
            <Link href="/problems">
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                <Code2 className="w-3.5 h-3.5" />
                Browse Problems
              </Button>
            </Link>
          </div>
        )}

        {/* Weak Concepts & Spaced Rep */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                <AlertCircle className="w-4 h-4 text-[var(--secondary)]" />
                Focus Areas
              </CardTitle>
              <CardDescription>Concepts needing the most attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {weakConcepts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <CheckCircle2 className="w-7 h-7 text-[var(--primary)]" />
                  <p className="text-sm text-[var(--muted)]">No weak concepts!</p>
                </div>
              ) : (
                weakConcepts.slice(0, 3).map((concept) => (
                  <div key={concept.id} className="flex items-center justify-between p-2.5 bg-[var(--soft)]/50 rounded-md">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-[var(--foreground)]">{concept.name}</p>
                      <p className="text-xs text-[var(--muted)]">{concept.subDomain}</p>
                    </div>
                    <Badge variant={concept.score < 30 ? "destructive" : concept.score < 50 ? "warning" : "secondary"}>{concept.score}%</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {spacedDue > 0 && (
            <Link href="/quiz?mode=spaced">
              <Card className="cursor-pointer card-lift border-[var(--primary)]/20 bg-[var(--primary)]/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-md bg-[var(--primary)] flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[var(--background)]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-heading font-semibold text-sm text-[var(--foreground)]">Review Due</p>
                    <p className="text-xs text-[var(--muted)]">{spacedDue} concept{spacedDue > 1 ? "s" : ""} to review</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--muted)]" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* ═══════════ CODING DASHBOARD EXTRA SECTION ═══════════ */}
      {codingStats && (
        <>
          {/* Heatmap Section */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Coding Activity
              </CardTitle>
              <CardDescription>Problem-solving activity over the past year</CardDescription>
            </CardHeader>
            <CardContent>
              {codingStatsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <Heatmap data={codingStats.heatmap} />
              )}
            </CardContent>
          </Card>

          {/* Company-wise Progress + Topic Mastery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Company Progress */}
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                  <Building2 className="w-4 h-4 text-[var(--secondary)]" />
                  Company-wise Progress
                </CardTitle>
                <CardDescription>Problems solved by company</CardDescription>
              </CardHeader>
              <CardContent>
                {codingStatsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : codingStats.companyProgress.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Building2 className="w-7 h-7 text-[var(--muted)]" />
                    <p className="text-sm text-[var(--muted)]">Solve company-tagged problems to see progress</p>
                    <Link href="/problems">
                      <Button size="sm" variant="outline">Browse Problems</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {codingStats.companyProgress.slice(0, 8).map((company) => (
                      <Link
                        key={company.slug}
                        href={`/problems?company=${company.slug}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                              {company.name}
                            </span>
                            <span className="text-[10px] text-[var(--muted)]">
                              {company.solved}/{company.total}
                            </span>
                          </div>
                          <div className="relative mt-1 h-1.5 rounded-full bg-[var(--soft)] overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                              style={{
                                width: `${company.percentage}%`,
                                background: `linear-gradient(90deg, var(--primary), var(--primary-light))`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-[var(--muted)] w-8 text-right">
                          {company.percentage}%
                        </span>
                      </Link>
                    ))}
                    {codingStats.companyProgress.length > 8 && (
                      <Link href="/problems" className="block text-center text-[10px] text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors pt-1">
                        View all {codingStats.companyProgress.length} companies
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Topic Mastery */}
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                  <Target className="w-4 h-4 text-purple-500" />
                  Topic Mastery
                </CardTitle>
                <CardDescription>Your proficiency across topics</CardDescription>
              </CardHeader>
              <CardContent>
                {codingStatsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : codingStats.topicMastery.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Target className="w-7 h-7 text-[var(--muted)]" />
                    <p className="text-sm text-[var(--muted)]">Solve topic-tagged problems to see mastery</p>
                    <Link href="/problems">
                      <Button size="sm" variant="outline">Browse Problems</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {codingStats.topicMastery.slice(0, 8).map((topic) => (
                      <Link
                        key={topic.slug}
                        href={`/problems?topic=${topic.slug}`}
                        className="flex items-center gap-3 group"
                      >
                        <span className="text-lg shrink-0">{topic.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                              {topic.name}
                            </span>
                            <span className="text-[10px] text-[var(--muted)]">
                              {topic.solved}/{topic.total}
                            </span>
                          </div>
                          <div className="relative mt-1 h-2 rounded-full bg-[var(--soft)] overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                              style={{
                                width: `${topic.percentage}%`,
                                backgroundColor: topic.color || "var(--primary)",
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Award
                            className="w-3.5 h-3.5"
                            style={{
                              color: topic.percentage >= 80 ? "#22c55e" : topic.percentage >= 50 ? "#f59e0b" : "#9c9a94",
                            }}
                          />
                          <span className="text-[10px] font-medium"
                            style={{
                              color: topic.percentage >= 80 ? "#22c55e" : topic.percentage >= 50 ? "#f59e0b" : "var(--muted)",
                            }}
                          >
                            {topic.percentage}%
                          </span>
                        </div>
                      </Link>
                    ))}
                    {codingStats.topicMastery.length > 8 && (
                      <Link href="/problems" className="block text-center text-[10px] text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors pt-1">
                        View all {codingStats.topicMastery.length} topics
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
            <Clock className="w-4 h-4 text-[var(--primary)]" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Brain className="w-8 h-8 text-[var(--border)]" />
              <p className="text-sm text-[var(--muted)]">No activity yet</p>
              <Link href="/quiz/diagnostic"><Button size="sm" variant="outline" className="mt-1">Start Diagnostic</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-2.5 bg-[var(--soft)]/30 rounded-md">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[var(--primary)]/10">
                      {activity.type === "diagnostic" ? <Zap className="w-3.5 h-3.5 text-[var(--primary)]" /> :
                       activity.type === "spaced_repetition" ? <BookOpen className="w-3.5 h-3.5 text-[var(--secondary)]" /> :
                       <Brain className="w-3.5 h-3.5 text-[var(--primary)]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-[var(--foreground)] capitalize">{activity.type.replace("_", " ")}</p>
                        {activity.trackName && (
                          <span className="text-[10px] text-[var(--muted)]">
                            {activity.trackIcon || "📚"} {activity.trackName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted)]">{activity.conceptCount} concept{activity.conceptCount > 1 ? "s" : ""} • {new Date(activity.completedAt).toLocaleDateString()}</p>
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
