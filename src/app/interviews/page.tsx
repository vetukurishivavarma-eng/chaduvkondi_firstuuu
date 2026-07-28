"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ArrowRight,
  Target,
  Brain,
  Building2,
  Star,
  Timer,
  BarChart3,
} from "lucide-react";

interface Interview {
  id: string;
  title: string;
  company: { name: string; slug: string; logoUrl: string | null } | null;
  status: string;
  score: number | null;
  experienceYears: number;
  durationMinutes: number;
  codingProblems: number;
  totalQuestions: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Not Started", color: "text-amber-600", bg: "bg-amber-500/10" },
  in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-500/10" },
  completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  evaluated: { label: "Evaluated", color: "text-purple-600", bg: "bg-purple-500/10" },
};

const COMPANIES = [
  { name: "Amazon", slug: "amazon", icon: "📦" },
  { name: "Google", slug: "google", icon: "🔍" },
  { name: "Microsoft", slug: "microsoft", icon: "🪟" },
  { name: "Meta", slug: "meta", icon: "👤" },
  { name: "Netflix", slug: "netflix", icon: "🎬" },
  { name: "Apple", slug: "apple", icon: "🍎" },
  { name: "Uber", slug: "uber", icon: "🚗" },
  { name: "Salesforce", slug: "salesforce", icon: "☁️" },
];

export default function InterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [selectedCompany, setSelectedCompany] = useState("google");
  const [experienceYears, setExperienceYears] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(60);

  useEffect(() => {
    fetchInterviews();
  }, []);

  async function fetchInterviews() {
    setLoading(true);
    try {
      const res = await fetch("/api/interviews");
      const data = await res.json();
      if (data.success) setInterviews(data.data);
      else setError(data.error || "Failed to load");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companySlug: selectedCompany,
          experienceYears,
          durationMinutes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/interviews/${data.data.id}`);
      } else {
        setError(data.error || "Failed to create");
      }
    } catch { setError("Network error"); }
    finally { setCreating(false); }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gradient">Mock Interviews</h1>
            <p className="text-sm text-[var(--muted)] mt-0.5">Practice company-specific interviews with coding problems and questions</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-1.5">
          <Sparkles className="w-4 h-4" /> New Interview
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="glass border-blue-500/20 animate-fade-in-down">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-[var(--primary)]" />
              Configure Your Interview
            </h3>

            {/* Company */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2 block">Company</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {COMPANIES.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => setSelectedCompany(c.slug)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      selectedCompany === c.slug
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/30 hover:text-[var(--foreground)]"
                    }`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-[10px] font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Experience & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2 block">Experience Level</label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 5, 8].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setExperienceYears(yr)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        experienceYears === yr
                          ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
                          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/30"
                      }`}
                    >
                      {yr === 0 ? "Fresher" : `${yr}yr`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2 block">Duration</label>
                <div className="flex gap-2">
                  {[30, 45, 60, 90].map((min) => (
                    <button
                      key={min}
                      onClick={() => setDurationMinutes(min)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        durationMinutes === min
                          ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
                          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/30"
                      }`}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleCreate} disabled={creating} className="gap-1.5">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {creating ? "Generating..." : "Generate Interview"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            </div>

            {error && <p className="text-xs text-[var(--error)]">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Stats Bar */}
      {interviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="glass">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Brain className="w-4 h-4 text-blue-500" /></div>
              <div><p className="text-lg font-bold text-[var(--foreground)]">{interviews.length}</p><p className="text-[10px] text-[var(--muted)]">Total</p></div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
              <div><p className="text-lg font-bold text-[var(--foreground)]">{interviews.filter((i) => i.status === "completed" || i.status === "evaluated").length}</p><p className="text-[10px] text-[var(--muted)]">Completed</p></div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Timer className="w-4 h-4 text-blue-500" /></div>
              <div><p className="text-lg font-bold text-[var(--foreground)]">{interviews.filter((i) => i.status === "in_progress").length}</p><p className="text-[10px] text-[var(--muted)]">In Progress</p></div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10"><BarChart3 className="w-4 h-4 text-purple-500" /></div>
              <div>
                <p className="text-lg font-bold text-[var(--foreground)]">
                  {interviews.filter((i) => i.score != null).length > 0
                    ? Math.round(interviews.filter((i) => i.score != null).reduce((a, i) => a + (i.score || 0), 0) / interviews.filter((i) => i.score != null).length)
                    : "—"}
                </p>
                <p className="text-[10px] text-[var(--muted)]">Avg Score</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interview List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" /></div>
      ) : interviews.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-16 text-center space-y-3">
            <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 w-fit mx-auto">
              <Users className="w-10 h-10 text-[var(--muted)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--foreground)]">No interviews yet</p>
            <p className="text-sm text-[var(--muted)]">Generate a mock interview to practice company-specific coding problems.</p>
            <Button onClick={() => setShowCreateForm(true)} className="gap-1.5">
              <Sparkles className="w-4 h-4" /> Start Your First Interview
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => {
            const statusCfg = STATUS_CONFIG[interview.status] || STATUS_CONFIG.pending;
            return (
              <Link key={interview.id} href={interview.status === "completed" || interview.status === "evaluated" ? `/interviews/${interview.id}/results` : `/interviews/${interview.id}`}>
                <Card className="glass card-lift cursor-pointer group hover:border-blue-500/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Status icon */}
                      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${statusCfg.bg}`}>
                        {interview.status === "completed" || interview.status === "evaluated" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : interview.status === "in_progress" ? (
                          <Timer className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Building2 className="w-5 h-5 text-amber-500" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate">
                            {interview.title}
                          </h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--muted)]">
                          {interview.company && <span>{interview.company.name}</span>}
                          <span>• {interview.experienceYears}y exp</span>
                          <span>• {interview.durationMinutes}min</span>
                          <span>• {interview.codingProblems} coding + {interview.totalQuestions} questions</span>
                        </div>
                      </div>

                      {/* Score / Action */}
                      <div className="shrink-0 text-right">
                        {interview.score != null ? (
                          <div>
                            <p className={`text-lg font-bold ${interview.score >= 70 ? "text-emerald-500" : interview.score >= 40 ? "text-amber-500" : "text-red-500"}`}>
                              {interview.score}%
                            </p>
                            <p className="text-[10px] text-[var(--muted)]">Score</p>
                          </div>
                        ) : interview.status === "pending" ? (
                          <div className="flex items-center gap-1 text-xs text-[var(--primary)]">
                            Start <ArrowRight className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-blue-500">
                            Continue <ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
