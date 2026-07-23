"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Map,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Route,
  Loader2,
  ChevronDown,
  GraduationCap,
  Target,
  Layers,
  Zap,
  Circle,
  Lock,
  Braces,
  Code2,
  ArrowLeft,
  Home,
} from "lucide-react";

interface RoadmapConcept {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  masteryScore: number;
  masteryLevel: "mastered" | "learning" | "started" | "new";
  attempts: number;
}

interface RoadmapSubDomain {
  id: string;
  name: string;
  description: string;
  concepts: RoadmapConcept[];
}

interface RoadmapTrack {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: string;
  subDomains: RoadmapSubDomain[];
}

export default function RoadmapsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/roadmaps")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          if (res.data.activeTrackId) setSelectedTrack(res.data.activeTrackId);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span>Loading roadmaps...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.tracks.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Map className="w-10 h-10 text-[var(--muted)]" />
        <p className="text-[var(--muted)]">No tracks available yet.</p>
      </div>
    );
  }

  const activeTrack: RoadmapTrack | undefined = selectedTrack
    ? data.tracks.find((t: RoadmapTrack) => t.id === selectedTrack)
    : data.tracks[0];

  const overallProgress = activeTrack
    ? Math.round(
        activeTrack.subDomains.reduce(
          (sum: number, sd: RoadmapSubDomain) =>
            sum +
            sd.concepts.reduce(
              (s: number, c: RoadmapConcept) => s + c.masteryScore,
              0
            ) / sd.concepts.length,
          0
        ) / Math.max(activeTrack.subDomains.length, 1)
      )
    : 0;

  const masteredConcepts = activeTrack
    ? activeTrack.subDomains.reduce(
        (sum: number, sd: RoadmapSubDomain) =>
          sum + sd.concepts.filter((c: RoadmapConcept) => c.masteryLevel === "mastered").length,
        0
      )
    : 0;

  const totalConcepts = activeTrack
    ? activeTrack.subDomains.reduce(
        (sum: number, sd: RoadmapSubDomain) => sum + sd.concepts.length,
        0
      )
    : 0;

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 stagger-1 animate-fade-in-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Learning Roadmaps</h1>
          <p className="text-[var(--muted)] mt-1">Visualize your journey to mastery across all tracks</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/quiz/diagnostic">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Diagnostic
            </Button>
          </Link>
        </div>
      </div>

      {/* Track Selector + Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 stagger-2 animate-fade-in-up">
        {/* Track Selector */}
        <Card className="glass lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
              <Route className="w-4 h-4 text-[var(--primary)]" />
              Select Track
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.tracks.map((track: RoadmapTrack) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  selectedTrack === track.id
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                    : "text-[var(--foreground)] hover:bg-[var(--soft)]"
                }`}
              >
                <span className="text-lg">{track.icon}</span>
                <span className="truncate">{track.name}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Progress Stats */}
        {activeTrack && (
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="glass card-lift">
              <CardHeader className="pb-1.5">
                <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                  <GraduationCap className="w-3 h-3" /> Overall Progress
                </CardDescription>
                <CardTitle className="text-2xl text-[var(--foreground)]">{overallProgress}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={overallProgress} className="h-1.5" />
                <p className="text-xs text-[var(--muted)] mt-1.5">{activeTrack.description.slice(0, 80)}</p>
              </CardContent>
            </Card>

            <Card className="glass card-lift">
              <CardHeader className="pb-1.5">
                <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> Mastered
                </CardDescription>
                <CardTitle className="text-2xl text-[var(--foreground)]">
                  {masteredConcepts}
                  <span className="text-sm text-[var(--muted)] font-normal"> / {totalConcepts}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={totalConcepts > 0 ? (masteredConcepts / totalConcepts) * 100 : 0} className="h-1.5" />
                <p className="text-xs text-[var(--muted)] mt-1.5">{totalConcepts - masteredConcepts} concepts remaining</p>
              </CardContent>
            </Card>

            <Card className="glass card-lift">
              <CardHeader className="pb-1.5">
                <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                  <Target className="w-3 h-3" /> Difficulty
                </CardDescription>
                <CardTitle className="text-xl text-[var(--foreground)]">{activeTrack.difficulty}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeTrack.color }} />
                  {activeTrack.subDomains.length} sub-domains • {totalConcepts} concepts
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Roadmap Visualization */}
      {activeTrack && (
        <div className="space-y-0">
          {activeTrack.subDomains.map((subDomain: RoadmapSubDomain, sdIdx: number) => {
            const domainMastery = Math.round(
              subDomain.concepts.reduce((s: number, c: RoadmapConcept) => s + c.masteryScore, 0) /
                Math.max(subDomain.concepts.length, 1)
            );

            return (
              <div key={subDomain.id} className={`relative animate-fade-in-up`} style={{ animationDelay: `${sdIdx * 100}ms` }}>
                {/* Connection line between sub-domains */}
                {sdIdx > 0 && (
                  <div className="absolute left-[23px] -top-6 w-0.5 h-6 bg-gradient-to-b from-[var(--primary)]/30 to-transparent" />
                )}

                {/* Sub-Domain Header */}
                <div className="flex items-center gap-3 mb-3 mt-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-md"
                    style={{
                      backgroundColor: `${activeTrack.color}20`,
                      color: activeTrack.color,
                    }}
                  >
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-semibold text-base text-[var(--foreground)]">
                        {subDomain.name}
                      </h3>
                      <Badge variant="secondary" className="text-[10px]">{domainMastery}%</Badge>
                    </div>
                    <p className="text-xs text-[var(--muted)]">{subDomain.description}</p>
                  </div>
                  <Progress value={domainMastery} className="w-20 h-1.5 hidden sm:block" />
                </div>

                {/* Concepts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 ml-14">
                  {subDomain.concepts.map((concept: RoadmapConcept, cIdx: number) => {
                    const isMastered = concept.masteryLevel === "mastered";
                    const isLearning = concept.masteryLevel === "learning";
                    const isStarted = concept.masteryLevel === "started";
                    const isNew = concept.masteryLevel === "new";

                    return (
                      <Link
                        key={concept.id}
                        href={`/quiz?track=${activeTrack.id}&concept=${concept.id}`}
                        className={`group relative p-3 rounded-xl border transition-all duration-300 ${
                          isMastered
                            ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                            : isLearning
                            ? "border-[var(--primary)]/30 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/50"
                            : isStarted
                            ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50"
                            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)]/30 hover:bg-[var(--soft)]"
                        }`}
                      >
                        {/* Status indicator */}
                        <div className="flex items-start justify-between mb-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            isMastered
                              ? "bg-emerald-500/20 text-emerald-500"
                              : isLearning
                              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                              : isStarted
                              ? "bg-amber-500/20 text-amber-500"
                              : "bg-[var(--soft)] text-[var(--muted)]"
                          }`}>
                            {isMastered ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : isLearning ? (
                              <Zap className="w-3.5 h-3.5" />
                            ) : isStarted ? (
                              <Circle className="w-3 h-3" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                          </div>
                          <span className={`text-[10px] font-medium ${
                            isMastered ? "text-emerald-500" :
                            isLearning ? "text-[var(--primary)]" :
                            isStarted ? "text-amber-500" :
                            "text-[var(--muted)]"
                          }`}>
                            {concept.attempts > 0 ? `${Math.round(concept.masteryScore)}%` : "NEW"}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                          {concept.name}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">
                          {concept.description}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <Code2 className="w-3 h-3 text-[var(--muted)]" />
                          <span className="text-[10px] text-[var(--muted)]">
                            {concept.questionCount} question{concept.questionCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <Card className="glass stagger-6 animate-fade-in-up">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Mastered (80%+)
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[var(--primary)]" /> In Progress (50-79%)
            </span>
            <span className="flex items-center gap-1.5">
              <Circle className="w-3 h-3 text-amber-500" /> Started (20-49%)
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-[var(--muted)]" /> Not Started
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
