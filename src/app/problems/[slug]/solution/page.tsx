"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/editor";
import {
  Code2,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Lock,
  BookOpen,
  Lightbulb,
  FileText,
  Braces,
  Sparkles,
  Bug,
  BarChart3,
} from "lucide-react";

interface SolutionData {
  title?: string;
  bruteForceSolution: string;
  optimalSolution: string;
  complexityAnalysis: string;
  dryRun: string;
  pseudoCode: string;
  solutions: Record<string, string>;
  locked: boolean;
  hint?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  java: "Java", python: "Python", cpp: "C++", c: "C",
  javascript: "JavaScript", go: "Go", rust: "Rust",
  kotlin: "Kotlin", swift: "Swift", php: "PHP",
  csharp: "C#", ruby: "Ruby", typescript: "TypeScript",
};

const LANGUAGE_MONACO: Record<string, string> = {
  java: "java", python: "python", cpp: "cpp", c: "c",
  javascript: "javascript", go: "go", rust: "rust",
  kotlin: "kotlin", swift: "swift", php: "php",
  csharp: "csharp", ruby: "ruby", typescript: "typescript",
};

const tabs = [
  { id: "optimal", label: "Optimal Solution", icon: Sparkles },
  { id: "brute-force", label: "Brute Force", icon: Bug },
  { id: "complexity", label: "Complexity", icon: BarChart3 },
  { id: "dry-run", label: "Dry Run", icon: BookOpen },
  { id: "pseudo", label: "Pseudo Code", icon: FileText },
] as const;

export default function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");
  const [data, setData] = useState<SolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string>("optimal");
  const [selectedLang, setSelectedLang] = useState("java");

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (slug) fetchSolution();
  }, [slug]);

  async function fetchSolution() {
    setLoading(true);
    try {
      const res = await fetch(`/api/problems/${slug}/solution`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Set first available language
        if (json.data.solutions && !json.data.locked) {
          const available = Object.entries(json.data.solutions).find(([, code]) => code);
          if (available) setSelectedLang(available[0]);
        }
      } else {
        setError(json.error || "Failed to load solution");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-[var(--muted)]" />
        <p className="text-[var(--muted)]">{error}</p>
        <Button onClick={() => router.push("/problems")} variant="outline">
          Back to Problems
        </Button>
      </div>
    );
  }

  if (!data) return null;

  // ── LOCKED STATE ──
  if (data.locked) {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in py-16">
        <Link href={`/problems/${slug}`} className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Problem
        </Link>

        <Card className="text-center border-amber-500/20">
          <CardContent className="p-10 space-y-6">
            <div className="p-4 w-fit mx-auto rounded-full bg-amber-500/10 border border-amber-500/20">
              <Lock className="w-10 h-10 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Solution Locked</h2>
              <p className="text-sm text-[var(--muted)] mt-2">
                {data.hint || "Solve the problem first to view the complete solution with code explanations."}
              </p>
            </div>

            {/* Show brute force and complexity as preview */}
            <div className="space-y-3 text-left">
              {data.bruteForceSolution && (
                <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Brute Force Approach</h4>
                  <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{data.bruteForceSolution}</p>
                </div>
              )}
              {data.complexityAnalysis && (
                <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Complexity Analysis</h4>
                  <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{data.complexityAnalysis}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <Link href={`/problems/${slug}`}>
                <Button className="gap-1.5">
                  <Code2 className="w-4 h-4" /> Solve Problem
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── FULL SOLUTION VIEW ──
  const availableLangs = Object.entries(data.solutions).filter(([, code]) => code && code.trim());
  const currentCode = data.solutions[selectedLang] || "";

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/problems/${slug}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Problem
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gradient">{data.title || "Solution"}</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">Comprehensive solution with multiple approaches and language implementations</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-[var(--border)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {/* Brute Force */}
        {activeTab === "brute-force" && (
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <Bug className="w-4 h-4 text-orange-500" />
                Brute Force Approach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed font-mono bg-[var(--soft)]/50 p-4 rounded-lg">
                {data.bruteForceSolution || "No brute force solution provided."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Optimal Solution */}
        {activeTab === "optimal" && (
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Optimal Solution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed font-mono bg-[var(--soft)]/50 p-4 rounded-lg">
                {data.optimalSolution || "No optimal solution provided."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Complexity Analysis */}
        {activeTab === "complexity" && (
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Complexity Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed font-mono bg-[var(--soft)]/50 p-4 rounded-lg">
                {data.complexityAnalysis || "No complexity analysis provided."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dry Run */}
        {activeTab === "dry-run" && (
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <BookOpen className="w-4 h-4 text-purple-500" />
                Step-by-Step Dry Run
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed font-mono bg-[var(--soft)]/50 p-4 rounded-lg">
                {data.dryRun || "No dry run provided."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pseudo Code */}
        {activeTab === "pseudo" && (
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <FileText className="w-4 h-4 text-cyan-500" />
                Pseudo Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-[#1a1a2e] text-[#e0e0e0] p-4 rounded-lg">
                <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                  {data.pseudoCode || "// No pseudo code provided."}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Multi-Language Solutions */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
          <Braces className="w-4 h-4 text-[var(--primary)]" />
          Multi-Language Solutions
        </h2>

        {/* Language Selector */}
        {availableLangs.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {availableLangs.map(([lang]) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${
                  selectedLang === lang
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
                    : "text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)]/30 hover:text-[var(--foreground)]"
                }`}
              >
                {LANGUAGE_NAMES[lang] || lang}
              </button>
            ))}
          </div>
        )}

        {/* Code Viewer */}
        {currentCode ? (
          <div className="rounded-lg overflow-hidden border border-[var(--border)]">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] border-b border-[var(--border)]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-[var(--muted)] ml-2">
                {LANGUAGE_NAMES[selectedLang] || selectedLang}
              </span>
              <span className="text-[10px] text-[var(--muted)] ml-auto">
                {currentCode.split("\n").length} lines
              </span>
            </div>
            <div className="h-[400px]">
              <CodeEditor
                language={LANGUAGE_MONACO[selectedLang] || selectedLang}
                value={currentCode}
                onChange={() => {}}
                readOnly={true}
                height="400px"
                theme="vs-dark"
              />
            </div>
          </div>
        ) : (
          <Card className="glass border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-[var(--muted)]">No solution available for {LANGUAGE_NAMES[selectedLang] || selectedLang}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Link href={`/problems/${slug}`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Code2 className="w-3.5 h-3.5" /> Try Again
          </Button>
        </Link>
      </div>
    </div>
  );
}
