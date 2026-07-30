"use client";

import { useState, useEffect, useRef } from "react";
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
  RefreshCw,
  Code2,
  Zap,
  Cpu,
} from "lucide-react";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"];
const DIFFICULTY_ICONS: Record<string, string> = {
  easy: "🌱", medium: "⚡", hard: "🔥", expert: "💎",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
  medium: "text-amber-500 border-amber-500/20 bg-amber-500/10",
  hard: "text-red-500 border-red-500/20 bg-red-500/10",
  expert: "text-purple-500 border-purple-500/20 bg-purple-500/10",
};

interface GenResult {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  status: string;
  ollamaAvailable: boolean;
  modelName?: string;
  qualityScore?: number | null;
  qualityBreakdown?: any;
  retriesAttempted?: number;
}

type SseEvent =
  | { type: "status"; message: string }
  | { type: "token"; data: string }
  | { type: "preview"; data: string }
  | { type: "complete"; data: GenResult }
  | { type: "error"; message: string };

export default function AiGeneratePage() {
  const [difficulty, setDifficulty] = useState("medium");
  const [ollamaStatus, setOllamaStatus] = useState<boolean | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenResult | null>(null);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [liveText, setLiveText] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Companies and topics for display
  const [companies, setCompanies] = useState<Array<{ slug: string; name: string }>>([]);
  const [topics, setTopics] = useState<Array<{ slug: string; name: string; icon: string }>>([]);
  const [selectedCompany, setSelectedCompany] = useState("google");
  const [selectedTopic, setSelectedTopic] = useState("arrays");
  const [selectedLanguage, setSelectedLanguage] = useState("python");

  useEffect(() => {
    fetch("/api/ai/generate-problem")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setOllamaStatus(d.data.ollamaAvailable);
          setModelName(d.data.modelName || null);
        }
      })
      .catch(() => setOllamaStatus(false));

    Promise.all([
      fetch("/api/companies").then((r) => r.json()),
      fetch("/api/topics").then((r) => r.json()),
    ]).then(([c, t]) => {
      if (c.success) setCompanies(c.data);
      if (t.success) setTopics(t.data);
    }).catch(() => {});
  }, []);

  // Auto-scroll preview
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.scrollTop = previewRef.current.scrollHeight;
    }
  }, [liveText]);

  // Cleanup aborts on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function handleGenerate() {
    // Abort any previous generation
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setGenerating(true);
    setResult(null);
    setError("");
    setStatusMessage("Initializing...");
    setLiveText("");
    setShowPreview(true);

    try {
      const res = await fetch("/api/ai/generate-problem/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          topic: selectedTopic,
          company: selectedCompany,
          language: selectedLanguage,
        }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (!res.ok) {
        setError(`Server error: ${res.status}`);
        setGenerating(false);
        return;
      }



      const decoder = new TextDecoder();
      let buffer = "";

      const reader = res.body?.getReader();
      if (!reader) {
        setError("Stream not available");
        setGenerating(false);
        return;
      }

      while (true) {
        if (controller.signal.aborted) return;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const line = event.trim();
          if (!line || !line.startsWith("data: ")) continue;

          try {
            const parsed: SseEvent = JSON.parse(line.slice(6));

            switch (parsed.type) {
              case "status":
                setStatusMessage(parsed.message);
                break;
              case "token":
                setLiveText((prev) => prev + parsed.data);
                break;
              case "preview":
                setLiveText(parsed.data);
                break;
              case "complete":
                setResult(parsed.data);
                if (parsed.data.modelName) {
                  setModelName(parsed.data.modelName);
                }
                setStatusMessage("Generation complete!");
                setGenerating(false);
                return;
              case "error":
                setError(parsed.message);
                setGenerating(false);
                return;
            }
          } catch {
            continue;
          }
        }
      }

      // Stream ended without complete event
      if (!controller.signal.aborted) {
        setError("Stream ended unexpectedly");
        setGenerating(false);
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || controller.signal.aborted) return;
      setError("Network error — check that Ollama is running");
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
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs ${
        ollamaStatus === null
          ? "border-[var(--border)] text-[var(--muted)]"
          : ollamaStatus
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
            : "border-amber-500/20 bg-amber-500/5 text-amber-600"
      }`}>
        <div className="flex items-center gap-2">
          {ollamaStatus === null ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking AI Engine...</>
          ) : ollamaStatus ? (
            <><CheckCircle2 className="w-3.5 h-3.5" /> AI Engine connected</>
          ) : (
            <><AlertCircle className="w-3.5 h-3.5" /> AI Engine not detected — using template fallback</>
          )}
        </div>
        {ollamaStatus && modelName && (
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] font-mono">
            <Cpu className="w-3 h-3" /> {modelName}
          </span>
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
            className="w-full gap-2 py-3 text-base font-semibold"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generate Problem</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Live Generation Preview */}
      {generating && (
        <Card className="glass border-[var(--primary)]/20 overflow-hidden">
          <CardContent className="p-0">
            {/* Status header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border)] bg-[var(--primary)]/5">
              <div className="relative">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                <div className="absolute inset-0 animate-ping rounded-full bg-[var(--primary)]/20" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">
                  {statusMessage || "Generating..."}
                </p>
              </div>
              <span className="text-[10px] text-[var(--muted)] font-mono whitespace-nowrap">
                {modelName || "AI"}
              </span>
            </div>

            {/* Live text preview (typewriter effect) */}
            <div
              ref={previewRef}
              className="p-4 max-h-80 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap break-words scroll-smooth"
              style={{
                background: "var(--code-bg, #0d1117)",
                color: "var(--code-fg, #c9d1d9)",
              }}
            >
              {liveText ? (
                <>
                  {liveText}
                  <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--primary)] animate-pulse" />
                </>
              ) : (
                <span className="text-[var(--muted)] italic">
                  Waiting for AI response...
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="px-4 py-2 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
                <div className="flex-1">
                  <Progress className="h-1 animate-pulse" />
                </div>
                <span className="whitespace-nowrap">{Math.round(liveText.length / 4)} tokens</span>
              </div>
            </div>
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
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="outline" className={`text-[11px] ${DIFFICULTY_COLORS[result.difficulty] || ""}`}>
                    {DIFFICULTY_ICONS[result.difficulty]} {result.difficulty}
                  </Badge>
                  {result.ollamaAvailable ? (
                    <Badge className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20">
                      <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI Generated{result.modelName ? ` (${result.modelName})` : ""}
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                      Template Generated
                    </Badge>
                  )}
                  <Badge className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                    {result.status === "draft" ? "⏳ Pending Review" : "✅ Published"}
                  </Badge>
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
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--foreground)]">Generation Failed</p>
              <p className="text-xs text-[var(--muted)]">{error}</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleGenerate} className="ml-auto shrink-0">Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card className="glass">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--primary)]" />
            How It Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[var(--muted)]">
            <div className="space-y-1.5 p-3 rounded-lg border border-[var(--border)]">
              <p className="font-medium text-[var(--foreground)]">1. Configure</p>
              <p>Choose difficulty, company inspiration, topic, and primary language for your problem.</p>
            </div>
            <div className="space-y-1.5 p-3 rounded-lg border border-[var(--border)]">
              <p className="font-medium text-[var(--foreground)]">2. Live Generation</p>
              <p>Watch the AI write the problem in real-time — including story, solutions, test cases, and analysis.</p>
            </div>
            <div className="space-y-1.5 p-3 rounded-lg border border-[var(--border)]">
              <p className="font-medium text-[var(--foreground)]">3. Solve &amp; Share</p>
              <p>Problems are saved as drafts for admin review, then published for everyone to practice and solve.</p>
            </div>
          </div>

          {/* Generation Stats */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--muted)] pt-1">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              Model: <code className="bg-[var(--border)] px-1 rounded text-[var(--foreground)]">{modelName || "fallback-template"}</code>
            </span>
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              6 languages per problem
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Streaming generation
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
