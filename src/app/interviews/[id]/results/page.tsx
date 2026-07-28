"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Target,
  Brain,
  Terminal,
  Clock,
  BarChart3,
  BookOpen,
  RefreshCw,
  Star,
} from "lucide-react";

interface ResultData {
  id: string;
  title: string;
  company: { name: string; slug: string; logoUrl: string | null };
  score: number;
  feedback: string;
  experienceYears: number;
  durationMinutes: number;
  timeTaken: number | null;
  completedAt: string;
  breakdown: {
    overall: number;
    problems: {
      total: number;
      solved: number;
      progress: number;
      items: Array<{
        title: string;
        slug: string;
        difficulty: string;
        solved: boolean;
        score: number | null;
        feedback: string | null;
      }>;
    };
    categories: Record<string, { correct: number; total: number; percentage: number }>;
  };
  questions: Array<{
    id: string;
    text: string;
    type: string;
    choices: Array<{ id: string; text: string }>;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean | null;
    explanation: string;
    score: number | null;
    order: number;
  }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  mcq: "Multiple Choice",
  sql: "SQL Queries",
  debugging: "Debugging",
  outputPrediction: "Output Prediction",
  lld: "Low Level Design",
  systemDesign: "System Design",
};

const TYPE_COLORS: Record<string, string> = {
  mcq: "#8B5CF6",
  sql: "#3B82F6",
  debugging: "#EF4444",
  outputPrediction: "#F59E0B",
  lld: "#22C55E",
  systemDesign: "#6366F1",
};

export default function InterviewResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [interviewId, setInterviewId] = useState("");
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "problems">("overview");
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setInterviewId(p.id));
  }, [params]);

  useEffect(() => {
    if (interviewId) fetchResults();
  }, [interviewId]);

  async function fetchResults() {
    try {
      const res = await fetch(`/api/interviews/${interviewId}/results`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || "Failed to load");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  }

  function getScoreBg(score: number): string {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "bg-amber-500/10 border-amber-500/20";
    return "bg-red-500/10 border-red-500/20";
  }

  function getGrade(score: number): string {
    if (score >= 90) return "Outstanding! 🏆";
    if (score >= 80) return "Excellent! 🎉";
    if (score >= 70) return "Great Job 👍";
    if (score >= 60) return "Good Work 💪";
    if (score >= 50) return "Keep Practicing 📚";
    if (score >= 40) return "Needs Improvement 🔄";
    return "Start Fresh 🌱";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[var(--muted)]">{error || "Results not found"}</p>
        <Link href="/interviews"><Button variant="outline">Back to Interviews</Button></Link>
      </div>
    );
  }

  const { breakdown, questions } = data;
  const categories = Object.entries(breakdown.categories).filter(([, v]) => v.total > 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/interviews" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Interviews
        </Link>
      </div>

      {/* Header Card */}
      <Card className={`glass overflow-hidden ${getScoreBg(breakdown.overall)}`}>
        <div className={`h-1.5 w-full ${breakdown.overall >= 80 ? "bg-gradient-to-r from-emerald-500 to-green-400" : breakdown.overall >= 60 ? "bg-gradient-to-r from-amber-500 to-yellow-400" : "bg-gradient-to-r from-red-500 to-orange-400"}`} />
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Score Circle */}
            <div className="shrink-0 flex flex-col items-center">
              <div className={`relative w-24 h-24 rounded-full flex items-center justify-center border-4 ${
                breakdown.overall >= 80 ? "border-emerald-500" : breakdown.overall >= 60 ? "border-amber-500" : "border-red-500"
              }`}>
                <span className={`text-3xl font-bold ${getScoreColor(breakdown.overall)}`}>{breakdown.overall}</span>
                <span className="absolute -top-1 -right-1 text-lg">
                  {breakdown.overall >= 80 ? "🏆" : breakdown.overall >= 60 ? "⭐" : "💪"}
                </span>
              </div>
              <p className="text-[10px] text-[var(--muted)] mt-1">Overall Score</p>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-[var(--foreground)]">{data.title}</h1>
              <p className="text-lg font-semibold mt-1">{getGrade(breakdown.overall)}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--muted)]">
                <span>{data.company?.name}</span>
                <span>• {data.experienceYears}y experience</span>
                <span>• {data.durationMinutes}min interview</span>
                {data.timeTaken != null && <span>• Completed in {data.timeTaken}min</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              <Link href="/interviews">
                <Button variant="outline" size="sm" className="gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> New Interview
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="glass">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="w-4 h-4 text-green-500" /></div>
            <div>
              <p className="text-lg font-bold text-[var(--foreground)]">
                {questions.filter((q) => q.isCorrect).length}/{questions.length}
              </p>
              <p className="text-[10px] text-[var(--muted)]">Questions Correct</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Terminal className="w-4 h-4 text-blue-500" /></div>
            <div>
              <p className="text-lg font-bold text-[var(--foreground)]">{breakdown.problems.solved}/{breakdown.problems.total}</p>
              <p className="text-[10px] text-[var(--muted)]">Problems Solved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><Brain className="w-4 h-4 text-amber-500" /></div>
            <div>
              <p className="text-lg font-bold text-[var(--foreground)]">{categories.length}</p>
              <p className="text-[10px] text-[var(--muted)]">Categories Tested</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10"><Star className="w-4 h-4 text-purple-500" /></div>
            <div>
              <p className="text-lg font-bold text-[var(--foreground)]" style={{ color: getScoreColor(breakdown.overall) }}>
                {getScoreColor(breakdown.overall) === "text-emerald-500" ? "Strong" : 
                 getScoreColor(breakdown.overall) === "text-amber-500" ? "Moderate" : "Needs Work"}
              </p>
              <p className="text-[10px] text-[var(--muted)]">Overall Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border)]">
        {[
          { id: "overview" as const, label: "Overview", icon: BarChart3 },
          { id: "questions" as const, label: "Questions", icon: Brain },
          { id: "problems" as const, label: "Problems", icon: Terminal },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Category Scores */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categories.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No category data available.</p>
              ) : (
                categories.map(([key, cat]) => {
                  const catKey = key as keyof typeof breakdown.categories;
                  const label = CATEGORY_LABELS[key] || key;
                  const color = TYPE_COLORS[key] || "#6366f1";
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-xs font-medium text-[var(--foreground)]">{label}</span>
                        </div>
                        <span className="text-xs text-[var(--muted)]">
                          {cat.correct}/{cat.total} ({cat.percentage}%)
                        </span>
                      </div>
                      <Progress value={cat.percentage} className="h-2" />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Coding Problems Progress */}
          {breakdown.problems.total > 0 && (
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Terminal className="w-4 h-4 text-blue-500" />
                  Coding Problems
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Progress value={breakdown.problems.progress} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-[var(--muted)]">{breakdown.problems.solved}/{breakdown.problems.total}</span>
                </div>
                {breakdown.problems.items.map((item) => (
                  <div key={item.slug} className="flex items-center justify-between p-2 rounded-lg border border-[var(--border)]">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.solved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[var(--muted)] shrink-0" />
                      )}
                      <span className="text-xs font-medium truncate text-[var(--foreground)]">{item.title}</span>
                      <Badge className={`text-[10px] ${
                        item.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-600" :
                        item.difficulty === "medium" ? "bg-amber-500/10 text-amber-600" :
                        "bg-red-500/10 text-red-600"
                      }`}>{item.difficulty}</Badge>
                    </div>
                    <Link href={`/problems/${item.slug}/solution`}>
                      <Button size="sm" variant="ghost" className="text-xs">View Solution</Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          {data.feedback && (
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  AI Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-[var(--foreground)] whitespace-pre-wrap leading-relaxed text-sm">
                  {data.feedback}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── QUESTIONS TAB ── */}
      {activeTab === "questions" && (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card
              key={q.id}
              className={`glass cursor-pointer transition-all ${
                selectedQuestion === q.id ? "ring-2 ring-[var(--primary)]" : ""
              }`}
              onClick={() => setSelectedQuestion(selectedQuestion === q.id ? null : q.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    q.isCorrect ? "bg-emerald-500/10" : q.isCorrect === false ? "bg-red-500/10" : "bg-[var(--soft)]"
                  }`}>
                    {q.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : q.isCorrect === false ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <span className="text-xs text-[var(--muted)]">—</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[10px] bg-[var(--soft)] text-[var(--muted)]">{q.type.replace("_", " ")}</Badge>
                      {q.isCorrect !== null && (
                        <span className={`text-[10px] font-medium ${q.isCorrect ? "text-emerald-500" : "text-red-500"}`}>
                          {q.isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--foreground)] mt-1 line-clamp-2">{q.text}</p>

                    {selectedQuestion === q.id && (
                      <div className="mt-3 space-y-2 animate-fade-in">
                        {/* Choices */}
                        <div className="space-y-1">
                          {q.choices.map((c) => {
                            const isUserChoice = q.userAnswer === c.id;
                            const isCorrectChoice = q.correctAnswer === c.id;
                            return (
                              <div
                                key={c.id}
                                className={`flex items-center gap-2 p-2 rounded-lg text-xs border ${
                                  isCorrectChoice
                                    ? "border-emerald-500/50 bg-emerald-500/5"
                                    : isUserChoice && !isCorrectChoice
                                      ? "border-red-500/50 bg-red-500/5"
                                      : "border-[var(--border)]"
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-medium ${
                                  isCorrectChoice ? "border-emerald-500 bg-emerald-500 text-white" :
                                  isUserChoice ? "border-red-500 bg-red-500 text-white" :
                                  "border-[var(--muted)]"
                                }`}>
                                  {c.id.toUpperCase()}
                                </span>
                                <span className="text-[var(--foreground)]">{c.text}</span>
                                {isUserChoice && <span className="text-[9px] text-[var(--muted)] ml-auto">Your answer</span>}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs">
                          <p className="font-medium text-blue-600 mb-1">Explanation</p>
                          <p className="text-[var(--foreground)]">{q.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── PROBLEMS TAB ── */}
      {activeTab === "problems" && (
        <div className="space-y-3">
          {breakdown.problems.items.length === 0 ? (
            <Card className="glass">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-[var(--muted)]">No coding problems were included in this interview.</p>
              </CardContent>
            </Card>
          ) : (
            breakdown.problems.items.map((item) => (
              <Card key={item.slug} className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.solved ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-[var(--muted)] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)]">{item.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] ${
                            item.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-600" :
                            item.difficulty === "medium" ? "bg-amber-500/10 text-amber-600" :
                            "bg-red-500/10 text-red-600"
                          }`}>{item.difficulty}</Badge>
                          <span className="text-xs text-[var(--muted)]">
                            {item.solved ? `Score: ${item.score || "—"}` : "Not solved"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/problems/${item.slug}`}>
                        <Button size="sm" variant="outline" className="text-xs">Practice</Button>
                      </Link>
                      <Link href={`/problems/${item.slug}/solution`}>
                        <Button size="sm" variant="ghost" className="text-xs">Solution</Button>
                      </Link>
                    </div>
                  </div>
                  {item.feedback && (
                    <p className="text-xs text-[var(--muted)] mt-2 p-2 rounded-lg bg-[var(--soft)]/50">{item.feedback}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center gap-3 pt-2 pb-8">
        <Link href="/interviews">
          <Button className="gap-1.5">
            <RefreshCw className="w-4 h-4" /> New Interview
          </Button>
        </Link>
        <Link href={`/problems?company=${data.company?.slug}`}>
          <Button variant="outline" className="gap-1.5">
            <Target className="w-4 h-4" /> Practice {data.company?.name} Problems
          </Button>
        </Link>
      </div>
    </div>
  );
}
