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
  Calendar,
  TrendingUp,
  BookOpen,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Zap,
  Layers,
  AlertCircle,
  BarChart3,
  ArrowLeft,
  Home,
} from "lucide-react";

interface DueConcept {
  id: string;
  conceptId: string;
  conceptName: string;
  subDomain: string;
  trackName: string;
  trackIcon: string;
  trackColor: string;
  interval: number;
  easeFactor: number;
  nextReviewAt: string;
  due: boolean;
}

interface TrackGroup {
  name: string;
  icon: string;
  color: string;
  due: number;
  upcoming: number;
  total: number;
}

export default function SpacedRepetitionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("due");

  useEffect(() => {
    fetch(`/api/spaced-repetition?filter=${filter}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span>Loading spaced repetition...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-[var(--muted)]" />
        <p className="text-[var(--muted)]">Could not load spaced repetition data.</p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">Try Again</Button>
      </div>
    );
  }

  const { stats, dueConcepts, trackGroups, dailyReviews, intervalBuckets } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Navigation */}
      <div className="flex items-center gap-2 stagger-1 animate-fade-in-up">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all"
        >
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between stagger-1 animate-fade-in-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Spaced Repetition</h1>
          <p className="text-[var(--muted)] mt-1">Review concepts at optimal intervals for long-term retention</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/quiz?mode=spaced_repetition">
            <Button size="sm" className="gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Start Review
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger-2 animate-fade-in-up">
        <Card className="glass card-lift">
          <CardHeader className="pb-1.5">
            <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              Due Now
            </CardDescription>
            <CardTitle className="text-2xl text-[var(--foreground)]">
              {stats.dueEntries}
              <span className="text-sm text-[var(--muted)] font-normal"> concepts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--muted)]">
              {stats.dueEntries > 0 ? "Ready for review" : "All caught up! 🎉"}
            </p>
          </CardContent>
        </Card>

        <Card className="glass card-lift">
          <CardHeader className="pb-1.5">
            <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
              <BarChart3 className="w-3 h-3" />
              Retention Rate
            </CardDescription>
            <CardTitle className="text-2xl text-[var(--foreground)]">{stats.retentionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.retentionRate} className="h-1.5" />
            <p className="text-xs text-[var(--muted)] mt-1.5">{stats.correctReviewed}/{stats.totalReviewed} correct (30d)</p>
          </CardContent>
        </Card>

        <Card className="glass card-lift">
          <CardHeader className="pb-1.5">
            <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
              <BookOpen className="w-3 h-3" />
              Total Tracked
            </CardDescription>
            <CardTitle className="text-2xl text-[var(--foreground)]">{stats.totalEntries}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--muted)]">
              {stats.upcomingEntries} upcoming reviews
            </p>
          </CardContent>
        </Card>

        <Card className="glass card-lift">
          <CardHeader className="pb-1.5">
            <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" />
              Avg Ease Factor
            </CardDescription>
            <CardTitle className="text-2xl text-[var(--foreground)]">2.5</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--muted)]">Higher = longer intervals</p>
          </CardContent>
        </Card>
      </div>

      {/* Track Groups */}
      {trackGroups.length > 0 && (
        <Card className="glass stagger-3 animate-fade-in-up">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
              <Layers className="w-4 h-4 text-[var(--primary)]" />
              Reviews by Track
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trackGroups.map((tg: TrackGroup) => (
                <div key={tg.name} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-xl">{tg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-[var(--foreground)]">{tg.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px] text-orange-500">{tg.due} due</span>
                      <span className="text-[10px] text-[var(--muted)]">{tg.total} total</span>
                    </div>
                  </div>
                  {tg.due > 0 && (
                    <Badge variant="warning" className="text-[10px]">{tg.due}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Concepts */}
      <Card className="glass stagger-4 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
            <Brain className="w-4 h-4 text-[var(--primary)]" />
            Concepts Due for Review
          </CardTitle>
          <CardDescription>Review these concepts to reinforce your memory</CardDescription>
        </CardHeader>
        <CardContent>
          {dueConcepts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-[var(--primary)]" />
              <p className="text-sm text-[var(--muted)]">No concepts due for review! 🎉</p>
              <Link href="/quiz">
                <Button variant="outline" size="sm" className="mt-1">
                  Take a quiz to build more reviews
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {dueConcepts.slice(0, 20).map((concept: DueConcept, i: number) => (
                <div key={concept.id} className={`flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] card-lift ${concept.due ? 'border-l-2 border-l-orange-400' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-[var(--muted)] w-5">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-[var(--foreground)]">{concept.conceptName}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {concept.trackIcon} {concept.trackName} • {concept.subDomain}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-[var(--muted)]">
                        {concept.interval}d • EF {concept.easeFactor}
                      </p>
                      <p className="text-[10px] text-orange-500">
                        {Math.round((new Date(concept.nextReviewAt).getTime() - Date.now()) / 3600000)}h overdue
                      </p>
                    </div>
                    <Link href={`/quiz?mode=spaced_repetition&concepts=${concept.conceptId}`}>
                      <Button size="icon" variant="ghost" className="w-7 h-7">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interval Distribution */}
      <Card className="glass stagger-5 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
            <Calendar className="w-4 h-4 text-[var(--primary)]" />
            Interval Distribution
          </CardTitle>
          <CardDescription>How far apart your reviews are spaced</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(intervalBuckets).map(([bucket, count]: [string, any]) => {
              const values = Object.values(intervalBuckets) as number[];
              const max = Math.max(...values) || 1;
              return (
                <div key={bucket} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted)] w-12">{bucket}</span>
                  <div className="flex-1 h-5 rounded-full bg-[var(--soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[var(--foreground)] w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add to sidebar link */}
      <div className="text-center">
        <p className="text-sm text-[var(--muted)]">
          Review directly from the{" "}
          <Link href="/quiz?mode=spaced_repetition" className="text-[var(--primary)] hover:underline font-medium">
            quiz page
          </Link>{" "}
          or use the <strong>Spaced Review</strong> mode
        </p>
      </div>
    </div>
  );
}
