"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  Sparkles,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

interface AiGeneratedProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  status: string;
  company: { name: string; slug: string } | null;
  topic: { name: string; slug: string; icon: string } | null;
  language: { name: string; icon: string } | null;
  author: { id: string; name: string; email: string } | null;
  createdAt: string;
}

const DIFFICULTY_STYLES: Record<string, { color: string; bg: string }> = {
  easy: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  medium: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  hard: { color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
  expert: { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10" },
};

export default function AdminAiGeneratedPage() {
  const [problems, setProblems] = useState<AiGeneratedProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchProblems() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-generated?status=draft");
      const data = await res.json();
      if (data.success) {
        setProblems(data.data.problems);
      } else {
        setError(data.error || "Failed to load");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProblems(); }, []);

  async function handleAction(problemId: string, action: "approve" | "reject" | "delete") {
    setActionLoading(problemId);
    try {
      const res = await fetch("/api/admin/ai-generated", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setProblems((prev) => prev.filter((p) => p.id !== problemId));
      } else {
        alert(data.error || "Action failed");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gradient">AI Generated Problems</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">Review and approve AI-generated coding problems</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={fetchProblems} disabled={loading} className="gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Content */}
      {loading && problems.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <AlertCircle className="w-10 h-10 text-[var(--error)]" />
          <p className="text-sm text-[var(--muted)]">{error}</p>
        </div>
      ) : problems.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-16 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-[var(--muted)] mx-auto" />
            <p className="text-lg font-semibold text-[var(--foreground)]">No problems pending review</p>
            <p className="text-sm text-[var(--muted)]">Generate coding problems from the AI Generator page.</p>
            <Link href="/ai-generate">
              <Button className="gap-1.5"><Sparkles className="w-4 h-4" /> Generate Problems</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[var(--muted)]">{problems.length} problem{problems.length !== 1 ? "s" : ""} pending approval</p>
          {problems.map((problem) => {
            const diff = DIFFICULTY_STYLES[problem.difficulty] || DIFFICULTY_STYLES.easy;
            return (
              <Card key={problem.id} className="glass card-lift group hover:border-[var(--primary)]/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-[var(--foreground)] truncate">{problem.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${diff.bg} ${diff.color}`}>{problem.difficulty}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted)]">
                        {problem.company && <span>{problem.company.name}</span>}
                        {problem.topic && <span>{problem.topic.icon} {problem.topic.name}</span>}
                        {problem.language && <span>{problem.language.icon} {problem.language.name}</span>}
                      </div>
                      <p className="text-[10px] text-[var(--muted)] mt-1">
                        Generated by {problem.author?.name || "Unknown"} • {new Date(problem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/problems/${problem.slug}`}>
                        <Button size="sm" variant="outline" className="text-xs">Preview</Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleAction(problem.id, "approve")}
                        disabled={actionLoading === problem.id}
                        className="gap-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30"
                      >
                        {actionLoading === problem.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(problem.id, "reject")}
                        disabled={actionLoading === problem.id}
                        variant="outline"
                        className="gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(problem.id, "delete")}
                        disabled={actionLoading === problem.id}
                        variant="outline"
                        className="gap-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
