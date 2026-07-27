"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Code2,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Home,
  Filter,
  ChevronDown,
  Sparkles,
  Terminal,
  Trophy,
  Clock,
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  language: string;
  order: number;
  templateCode: string;
  trackName: string;
  trackIcon: string;
  trackColor: string;
  conceptName: string;
  totalSubmissions: number;
  userSubmission: { passed: boolean; score: number; createdAt: string } | null;
}

const DIFFICULTIES = ["easy", "medium", "hard"];
const LANGUAGES = ["python", "javascript", "typescript", "java", "rust", "go"];

const DIFFICULTY_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  easy: { color: "emerald", icon: "🌱", label: "Easy" },
  medium: { color: "amber", icon: "⚡", label: "Medium" },
  hard: { color: "red", icon: "🔥", label: "Hard" },
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [tracks, setTracks] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [trackFilter, setTrackFilter] = useState<string>("");

  useEffect(() => {
    // Load tracks for filter
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.allTracks) {
          setTracks(res.data.allTracks);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [difficultyFilter, languageFilter, trackFilter]);

  function fetchChallenges() {
    setLoading(true);
    const params = new URLSearchParams();
    if (difficultyFilter) params.set("difficulty", difficultyFilter);
    if (languageFilter) params.set("language", languageFilter);
    if (trackFilter) params.set("trackId", trackFilter);

    fetch(`/api/challenges?${params.toString()}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setChallenges(res.data);
      })
      .finally(() => setLoading(false));
  }

  const uniqueDifficulties = DIFFICULTIES;
  const uniqueLanguages = LANGUAGES;

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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Code Challenges</h1>
          <p className="text-[var(--muted)] mt-1">Practice coding with hands-on challenges across multiple languages</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/playground">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              Playground
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="stagger-2 animate-fade-in-up">
        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--soft)] transition-colors text-xs font-medium"
            >
              <Filter className="w-3.5 h-3.5" />
              {difficultyFilter
                ? DIFFICULTY_CONFIG[difficultyFilter]?.label || difficultyFilter
                : "Difficulty"}
              <ChevronDown className={`w-3 h-3 text-[var(--muted)] transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-40 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg z-20 overflow-hidden animate-scale-in">
                  <button
                    onClick={() => { setDifficultyFilter(""); setFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${!difficultyFilter ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium" : "text-[var(--foreground)] hover:bg-[var(--soft)]"}`}
                  >
                    All Difficulties
                  </button>
                  {uniqueDifficulties.map((d) => (
                    <button
                      key={d}
                      onClick={() => { setDifficultyFilter(d); setFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${difficultyFilter === d ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium" : "text-[var(--foreground)] hover:bg-[var(--soft)]"}`}
                    >
                      {DIFFICULTY_CONFIG[d]?.icon} {DIFFICULTY_CONFIG[d]?.label || d}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Language filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setLanguageFilter("")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                !languageFilter
                  ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
                  : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)]/30"
              }`}
            >
              All
            </button>
            {uniqueLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguageFilter(languageFilter === lang ? "" : lang)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                  languageFilter === lang
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
                    : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)]/30"
                }`}
              >
                {lang === "javascript" ? "💛" : lang === "typescript" ? "🔷" : lang === "python" ? "🐍" : lang === "java" ? "☕" : lang === "rust" ? "🦀" : lang === "go" ? "🔵" : "📄"}{" "}
                {lang === "javascript" ? "JS" : lang === "typescript" ? "TS" : lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            ))}
          </div>

          {/* Track filter */}
          {tracks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tracks.slice(0, 4).map((track) => (
                <button
                  key={track.id}
                  onClick={() => setTrackFilter(trackFilter === track.id ? "" : track.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                    trackFilter === track.id
                      ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
                      : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)]/30"
                  }`}
                >
                  {track.icon} {track.name.split(" ")[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Challenge Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-[var(--muted)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading challenges...</span>
          </div>
        </div>
      ) : challenges.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center stagger-3 animate-fade-in-up">
          <div className="p-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <Code2 className="w-10 h-10 text-[var(--muted)]" />
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--foreground)]">No challenges found</p>
            <p className="text-sm text-[var(--muted)] mt-1">
              Try adjusting your filters or check back later for new challenges.
            </p>
          </div>
          {(difficultyFilter || languageFilter || trackFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setDifficultyFilter(""); setLanguageFilter(""); setTrackFilter(""); }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-3 animate-fade-in-up">
          {challenges.map((challenge, i) => {
            const diff = DIFFICULTY_CONFIG[challenge.difficulty] || DIFFICULTY_CONFIG.easy;
            const isSolved = challenge.userSubmission?.passed;

            return (
              <Link key={challenge.id} href={`/challenges/${challenge.id}`}>
                <Card
                  className="glass card-bounce h-full cursor-pointer group overflow-hidden"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className={`h-1 ${
                    challenge.difficulty === "hard"
                      ? "bg-gradient-to-r from-red-500 to-orange-500"
                      : challenge.difficulty === "medium"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500"
                      : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                  }`} />
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{challenge.trackIcon}</span>
                          <span className="text-[10px] text-[var(--muted)] truncate">{challenge.trackName}</span>
                        </div>
                        <h3 className="font-heading font-semibold text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate">
                          {challenge.title}
                        </h3>
                      </div>
                      {/* Status icon */}
                      {isSolved ? (
                        <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                      ) : challenge.userSubmission && !isSolved ? (
                        <div className="shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        </div>
                      ) : null}
                    </div>

                    <p className="text-xs text-[var(--muted)] line-clamp-2 mb-3 leading-relaxed">
                      {challenge.description}
                    </p>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          challenge.difficulty === "easy"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : challenge.difficulty === "medium"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                        }`}
                      >
                        {diff.icon} {diff.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {challenge.language === "javascript" ? "💛" : challenge.language === "typescript" ? "🔷" : challenge.language === "python" ? "🐍" : "📄"}{" "}
                        {challenge.language}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {challenge.totalSubmissions} sub{challenge.totalSubmissions !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {/* User score if attempted */}
                    {challenge.userSubmission && (
                      <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center gap-2">
                        <Progress
                          value={challenge.userSubmission.score || 0}
                          className={`h-1 flex-1 ${
                            challenge.userSubmission.passed ? "bg-emerald-500/20" : "bg-red-500/20"
                          }`}
                        />
                        <span className={`text-[10px] font-medium ${
                          challenge.userSubmission.passed ? "text-emerald-500" : "text-red-500"
                        }`}>
                          {challenge.userSubmission.score}%
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Stats Footer */}
      {challenges.length > 0 && (
        <Card className="glass stagger-4 animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                {challenges.length} challenge{challenges.length !== 1 ? "s" : ""} available
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {challenges.filter((c) => c.userSubmission?.passed).length} solved
              </span>
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                {challenges.filter((c) => c.userSubmission && !c.userSubmission.passed).length} attempted
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
