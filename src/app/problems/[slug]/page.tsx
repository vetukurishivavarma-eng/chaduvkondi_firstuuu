"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CodeEditor } from "@/components/editor";
import {
  Code2,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Play,
  RotateCcw,
  Trophy,
  Clock,
  Terminal,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Lightbulb,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";

interface ProblemDetail {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  story: string;
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  examples: Array<{ input: string; output: string; explanation: string }>;
  edgeCases: string[];
  hints: string[];
  testCases: Array<{ input: string; expected: string; description?: string }>;
  tags: string[];
  company: { name: string; slug: string } | null;
  language: { name: string; slug: string; icon: string; monacoId: string };
  topic: { name: string; slug: string; icon: string } | null;
  stats: { totalSubmissions: number; totalAccepted: number; acceptanceRate: number };
  userProgress: { solved: boolean; attempts: number; bookmarked: boolean; bestScore: number | null } | null;
  submissions: Array<{ id: string; status: string; score: number; executionTimeMs: number | null; createdAt: string }>;
  isBookmarked: boolean;
  relatedProblems: Array<{ id: string; title: string; slug: string; difficulty: string }>;
}

interface TestResult {
  name: string;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
}

const DIFFICULTY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  easy: { icon: "🌱", label: "Easy", color: "emerald" },
  medium: { icon: "⚡", label: "Medium", color: "amber" },
  hard: { icon: "🔥", label: "Hard", color: "red" },
  expert: { icon: "💎", label: "Expert", color: "purple" },
};

const DEFAULT_CODE: Record<string, string> = {
  python: "def solution():\n    # Write your code here\n    pass\n\nprint(solution())",
  javascript: "function solution() {\n  // Write your code here\n}\n\nconsole.log(solution());",
  typescript: "function solution(): any {\n  // Write your code here\n}\n\nconsole.log(solution());",
  java: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(solution());\n    }\n    \n    public static int solution() {\n        // Write your code here\n        return 0;\n    }\n}",
  cpp: "#include <iostream>\nusing namespace std;\n\nint solution() {\n    // Write your code here\n    return 0;\n}\n\nint main() {\n    cout << solution() << endl;\n    return 0;\n}",
  go: "package main\n\nimport \"fmt\"\n\nfunc solution() int {\n    // Write your code here\n    return 0\n}\n\nfunc main() {\n    fmt.Println(solution())\n}",
  rust: "fn solution() -> i32 {\n    // Write your code here\n    0\n}\n\nfn main() {\n    println!(\"{}\", solution());\n}",
};

export default function ProblemSolvePage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [judgeStatus, setJudgeStatus] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (slug) fetchProblem();
  }, [slug]);

  async function fetchProblem() {
    setLoading(true);
    try {
      const res = await fetch(`/api/problems/${slug}`);
      const data = await res.json();
      if (data.success) {
        setProblem(data.data);
        setBookmarked(data.data.isBookmarked);
        const lang = data.data.language.slug || "python";
        setLanguage(lang);
        setCode(DEFAULT_CODE[lang] || DEFAULT_CODE.python);
      } else {
        setError(data.error || "Failed to load problem");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRun() {
    setRunning(true);
    setResults(null);
    setError("");
    try {
      const res = await fetch("/api/judge/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (data.success) {
        setResults([{
          name: "Quick Run",
          passed: !data.data.error,
          input: "",
          expected: "No errors",
          actual: data.data.output || data.data.error || "",
          error: data.data.error || undefined,
        }]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  async function handleSubmit() {
    if (!problem || submitting) return;
    setSubmitting(true);
    setResults(null);
    setJudgeStatus(null);
    setScore(null);
    setError("");

    try {
      const res = await fetch(`/api/problems/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data.testResults);
        setJudgeStatus(data.data.status);
        setScore(data.data.score);
        setExecutionTime(data.data.executionTimeMs);
        // Refresh problem to update solved status
        fetchProblem();
      } else {
        setError(data.error || "Submission failed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleBookmark() {
    if (!problem) return;
    try {
      const res = await fetch(`/api/problems/${slug}/bookmark`, { method: "POST" });
      const data = await res.json();
      if (data.success) setBookmarked(data.data.bookmarked);
    } catch {}
  }

  function resetCode() {
    setCode(DEFAULT_CODE[language] || DEFAULT_CODE.python);
    setResults(null);
    setJudgeStatus(null);
    setScore(null);
    setError("");
  }

  function switchLanguage(lang: string) {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang] || DEFAULT_CODE.python);
    setResults(null);
    setJudgeStatus(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error && !problem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-[var(--muted)]" />
        <p className="text-[var(--muted)]">{error}</p>
        <Button onClick={() => router.push("/problems")} variant="outline">Back to Problems</Button>
      </div>
    );
  }

  if (!problem) return null;

  const diff = DIFFICULTY_CONFIG[problem.difficulty] || DIFFICULTY_CONFIG.easy;
  const testsPassed = results?.filter((r) => r.passed).length || 0;
  const totalTests = results?.length || 0;

  return (
    <div className="space-y-4 animate-fade-in max-w-[1600px] mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/problems" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleBookmark}
            className="p-1.5 rounded-md hover:bg-[var(--soft)] transition-colors"
            title={bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            {bookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-amber-500" />
            ) : (
              <Bookmark className="w-4 h-4 text-[var(--muted)]" />
            )}
          </button>
          <Badge className={`text-[10px] ${
            problem.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-600" :
            problem.difficulty === "medium" ? "bg-amber-500/10 text-amber-600" :
            problem.difficulty === "hard" ? "bg-red-500/10 text-red-600" :
            "bg-purple-500/10 text-purple-600"
          }`}>
            {diff.icon} {diff.label}
          </Badge>
          {problem.company && (
            <Badge variant="secondary" className="text-[10px]">{problem.company.name}</Badge>
          )}
        </div>
      </div>

      {/* Problem Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gradient">{problem.title}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[var(--muted)]">{problem.language.icon} {problem.language.name}</span>
          {problem.topic && <span className="text-xs text-[var(--muted)]">• {problem.topic.icon} {problem.topic.name}</span>}
          <span className="text-xs text-[var(--muted)]">• {problem.stats.acceptanceRate.toFixed(1)}% acceptance</span>
          {problem.userProgress?.solved && (
            <>
              <Badge variant="success" className="text-[10px]">Solved</Badge>
              <Link
                href={`/problems/${slug}/solution`}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 transition-all"
              >
                <Eye className="w-3 h-3" />
                View Solution
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Description + Editor */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* LEFT: Problem Description */}
        <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
          {/* Story */}
          {problem.story && (
            <Card className="glass border-l-4 border-l-[var(--primary)]">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--primary)] mt-0.5 shrink-0" />
                  <p className="text-sm text-[var(--foreground)] italic leading-relaxed">{problem.story}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Problem Statement */}
          <Card className="glass">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Problem Statement</h3>
              <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{problem.problemStatement}</p>
            </CardContent>
          </Card>

          {/* Input/Output Format & Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {problem.inputFormat && (
              <Card className="glass">
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] mb-1">Input Format</p>
                  <p className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono">{problem.inputFormat}</p>
                </CardContent>
              </Card>
            )}
            {problem.outputFormat && (
              <Card className="glass">
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] mb-1">Output Format</p>
                  <p className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono">{problem.outputFormat}</p>
                </CardContent>
              </Card>
            )}
            {problem.constraints && (
              <Card className="glass">
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] mb-1">Constraints</p>
                  <p className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono">{problem.constraints}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Examples */}
          {problem.examples.length > 0 && (
            <Card className="glass">
              <CardHeader className="pb-2">
                <button
                  onClick={() => setShowExamples(!showExamples)}
                  className="flex items-center justify-between w-full"
                >
                  <CardTitle className="text-sm text-[var(--foreground)]">Examples</CardTitle>
                  {showExamples ? <ChevronUp className="w-3.5 h-3.5 text-[var(--muted)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" />}
                </button>
              </CardHeader>
              {showExamples && (
                <CardContent className="space-y-2">
                  {problem.examples.map((ex, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[var(--soft)]/50 border border-[var(--border)]">
                      <p className="text-xs font-medium text-[var(--foreground)] mb-1.5">Example {i + 1}</p>
                      <div className="space-y-1 text-[11px] font-mono">
                        <div><span className="text-[var(--muted)]">Input:</span> <span className="text-[var(--foreground)]">{ex.input}</span></div>
                        <div><span className="text-[var(--muted)]">Output:</span> <span className="text-emerald-600 dark:text-emerald-400">{ex.output}</span></div>
                        {ex.explanation && <div><span className="text-[var(--muted)]">Explanation:</span> <span className="text-[var(--foreground)]">{ex.explanation}</span></div>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )}

          {/* Hints */}
          {problem.hints.length > 0 && (
            <Card className="glass border-amber-500/20">
              <CardHeader className="pb-2">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="flex items-center justify-between w-full"
                >
                  <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Hints ({problem.hints.length})
                  </CardTitle>
                  {showHints ? <ChevronUp className="w-3.5 h-3.5 text-[var(--muted)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" />}
                </button>
              </CardHeader>
              {showHints && (
                <CardContent>
                  <ul className="space-y-1.5">
                    {problem.hints.map((hint, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[var(--foreground)]">
                        <span className="text-amber-500 mt-0.5">💡</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )}

          {/* Related Problems */}
          {problem.relatedProblems.length > 0 && (
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[var(--foreground)]">Related Problems</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {problem.relatedProblems.map((rp) => (
                    <Link key={rp.id} href={`/problems/${rp.slug}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--soft)] transition-colors">
                      <span className="text-xs text-[var(--foreground)]">{rp.title}</span>
                      <Badge variant="secondary" className="text-[10px]">{rp.difficulty}</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submissions History */}
          {problem.submissions.length > 0 && (
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Recent Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {problem.submissions.slice(0, 5).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--soft)]/50">
                      <div className="flex items-center gap-2">
                        {sub.status === "accepted" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className="text-xs text-[var(--foreground)] capitalize">{sub.status.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.score != null && <span className="text-[10px] font-medium text-[var(--muted)]">{sub.score}%</span>}
                        <span className="text-[10px] text-[var(--muted)]">{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: Code Editor + Results */}
        <div className="space-y-3">
          {/* Language Selector + Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {["python", "javascript", "typescript", "java", "cpp", "go", "rust"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => switchLanguage(lang)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                    language === lang
                      ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
                      : "text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)]/30 hover:text-[var(--foreground)]"
                  }`}
                >
                  {lang === "javascript" ? "JS" : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={resetCode} className="p-1.5 rounded-md hover:bg-[var(--soft)] transition-colors text-[var(--muted)] hover:text-[var(--foreground)]" title="Reset code">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="rounded-lg overflow-hidden border border-[var(--border)]">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] border-b border-[var(--border)]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-[var(--muted)] ml-2 capitalize">{language}</span>
              <span className="text-[10px] text-[var(--muted)] ml-auto">
                {code.split("\n").length} lines
              </span>
            </div>
            <div className="h-[450px]">
              <CodeEditor
                language={problem.language.monacoId || language}
                value={code}
                onChange={setCode}
                height="450px"
                theme="vs-dark"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleRun} disabled={running || !code.trim()} variant="outline" className="flex-1 gap-1.5 h-9 text-xs">
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !code.trim()} className="flex-1 gap-1.5 h-9 text-xs">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
              Submit
            </Button>
          </div>

          {/* Results */}
          {(results || error || judgeStatus) && (
            <div className="space-y-2 animate-scale-in">
              {/* Overall Status */}
              {judgeStatus && (
                <Card className={`overflow-hidden ${
                  judgeStatus === "accepted"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {judgeStatus === "accepted" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className={`text-sm font-semibold ${
                            judgeStatus === "accepted" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            {judgeStatus === "accepted" ? "Accepted 🎉" : judgeStatus.replace(/_/g, " ").toUpperCase()}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            Score: {score}% • {testsPassed}/{totalTests} tests passed
                            {executionTime ? ` • ${executionTime}ms` : ""}
                          </p>
                        </div>
                      </div>
                      {judgeStatus === "accepted" && <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" />}
                    </div>
                    <Progress value={score || 0} className={`h-1 mt-2 ${
                      judgeStatus === "accepted" ? "bg-emerald-500/20" : "bg-red-500/20"
                    }`} />
                  </CardContent>
                </Card>
              )}

              {/* Test Results */}
              {results && results.length > 0 && (
                <Card className="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                      <Terminal className="w-4 h-4 text-[var(--primary)]" />
                      Test Results ({testsPassed}/{totalTests})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 max-h-64 overflow-y-auto">
                    {results.map((r, i) => (
                      <div key={i} className={`p-2.5 rounded-lg border ${
                        r.passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {r.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          )}
                          <span className={`text-xs font-medium ${
                            r.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            {r.name}
                          </span>
                        </div>
                        {r.error && (
                          <div className="mt-1 text-[10px] font-mono text-red-500 whitespace-pre-wrap">
                            {r.error}
                          </div>
                        )}
                        {r.actual && (
                          <div className="mt-1 text-[10px] font-mono text-[var(--muted)]">
                            {r.input && <div>Input: {r.input}</div>}
                            {r.expected && <div>Expected: {r.expected}</div>}
                            <div>Actual: {r.actual}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
