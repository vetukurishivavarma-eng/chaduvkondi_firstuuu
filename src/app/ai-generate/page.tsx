"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Terminal,
  Brain,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Code2,
} from "lucide-react";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"];
const DIFFICULTY_ICONS: Record<string, string> = {
  easy: "🌱", medium: "⚡", hard: "🔥", expert: "💎",
};

interface GenResult {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  status: string;
  ollamaAvailable: boolean;
}

export default function AiGeneratePage() {
  const [difficulty, setDifficulty] = useState("medium");
  const [ollamaStatus, setOllamaStatus] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenResult | null>(null);
  const [error, setError] = useState("");

  // Companies and topics for display
  const [companies, setCompanies] = useState<Array<{ slug: string; name: string }>>([]);
  const [topics, setTopics] = useState<Array<{ slug: string; name: string; icon: string }>>([]);
  const [selectedCompany, setSelectedCompany] = useState("google");
  const [selectedTopic, setSelectedTopic] = useState("arrays");
  const [selectedLanguage, setSelectedLanguage] = useState("python");

  useEffect(() => {
    // Check Ollama status
    fetch("/api/ai/generate-problem")
      .then((r) => r.json())
      .then((d) => { if (d.success) setOllamaStatus(d.data.ollamaAvailable); })
      .catch(() => setOllamaStatus(false));

    // Load filter options
    Promise.all([
      fetch("/api/companies").then((r) => r.json()),
      fetch("/api/topics").then((r) => r.json()),
    ]).then(([c, t]) => {
      if (c.success) setCompanies(c.data);
      if (t.success) setTopics(t.data);
    }).catch(() => {});
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/ai/generate-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          topic: selectedTopic,
          company: selectedCompany,
          language: selectedLanguage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Generation failed");
      }
    } catch {
      setError("Network error — check that Ollama is running");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
          <Sparkles className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gradient">AI Problem Generator</h1>
          <p className="text-sm text-[var(--muted)]">Generate unlimited original coding interview problems using AI</p>
        </div>
      </div>

      {/* Ollama Status */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs ${
        ollamaStatus === null
          ? "border-[var(--border)] text-[var(--muted)]"
          : ollamaStatus
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
            : "border-amber-500/20 bg-amber-500/5 text-amber-600"
      }`}>
        {ollamaStatus === null ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking Ollama status...</>
        ) : ollamaStatus ? (
          <><CheckCircle2 className="w-3.5 h-3.5" /> Ollama connected — generating with Llama 3</>
        ) : (
          <><AlertCircle className="w-3.5 h-3.5" /> Ollama not detected — using template fallback (still generates valid problems)</>
        )}
      </div>

      {/* Generator Card */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-[var(--primary)]" />
            Configure & Generate
          </CardTitle>
          <CardDescription>Choose the parameters for your coding problem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Difficulty */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2 block">Difficulty</label>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    difficulty === d
                      ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
                      : "text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)]/30 hover:text-[var(--foreground)]"
                  }`}
                >
                  {DIFFICULTY_ICONS[d]} {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2 block">Inspired By Company</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            >
              {companies.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2 block">Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            >
              {topics.map((t) => (
                <option key={t.slug} value={t.slug}>{t.icon} {t.name}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2 block">Primary Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            >
              <option value="python">🐍 Python</option>
              <option value="java">☕ Java</option>
              <option value="cpp">⚡ C++</option>
              <option value="javascript">💛 JavaScript</option>
              <option value="go">🔵 Go</option>
              <option value="rust">🦀 Rust</option>
              <option value="kotlin">🅺 Kotlin</option>
            </select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full gap-2 py-3 text-base"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Problem</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {generating && (
        <Card className="glass border-[var(--primary)]/20">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                <div className="absolute inset-0 animate-ping rounded-full bg-[var(--primary)]/20" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Generating your problem...</p>
                <p className="text-xs text-[var(--muted)]">Creating story, solutions, test cases, and more</p>
              </div>
            </div>
            <Progress value={65} className="h-1.5 animate-pulse" />
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className="glass border-emerald-500/20 animate-fade-in-up">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[var(--foreground)]">{result.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{result.difficulty}</Badge>
                  {result.ollamaAvailable ? (
                    <Badge className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20">AI Generated</Badge>
                  ) : (
                    <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">Template</Badge>
                  )}
                  <Badge className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">Status: {result.status}</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Link href={`/problems/${result.slug}`}>
                <Button className="gap-1.5">
                  <Code2 className="w-4 h-4" /> Solve Problem
                </Button>
              </Link>
              <Button variant="outline" onClick={handleGenerate} disabled={generating} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Generate Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="glass border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--error)] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Generation Failed</p>
              <p className="text-xs text-[var(--muted)]">{error}</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleGenerate} className="ml-auto shrink-0">Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card className="glass">
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--primary)]" />
            How It Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[var(--muted)]">
            <div className="space-y-1">
              <p className="font-medium text-[var(--foreground)]">1. Configure</p>
              <p>Choose difficulty, company inspiration, topic, and language for your problem.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-[var(--foreground)]">2. Generate</p>
              <p>AI creates an original problem with story, solutions (6 languages), test cases, and analysis.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-[var(--foreground)]">3. Solve & Share</p>
              <p>Problems are saved as drafts for admin review, then published for everyone to solve.</p>
            </div>
          </div>
          {!ollamaStatus && (
            <div className="mt-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-600">
              <strong>💡 Tip:</strong> Install <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="underline">Ollama</a> and run <code className="bg-amber-500/10 px-1 rounded">ollama pull llama3.2</code> for AI-powered generation. Without it, template-based fallback is used.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
