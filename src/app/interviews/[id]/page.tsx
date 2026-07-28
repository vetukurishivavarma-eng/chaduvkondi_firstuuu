"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CodeEditor } from "@/components/editor";
import {
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Flag,
  Brain,
  FileText,
  Terminal,
  Database,
  Code2,
  Bug,
  Lightbulb,
  Zap,
  BarChart3,
  Users,
} from "lucide-react";

type QuestionType = "mcq" | "sql" | "debugging" | "output_prediction" | "lld" | "system_design";

interface InterviewQuestion {
  id: string;
  questionText: string;
  type: QuestionType;
  choices: Array<{ id: string; text: string }>;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean | null;
  explanation: string;
  score: number | null;
  order: number;
}

interface InterviewProblem {
  id: string;
  problemId: string;
  order: number;
  userCode: string;
  score: number | null;
  feedback: string | null;
  solved: boolean;
  detail: {
    title: string;
    slug: string;
    difficulty: string;
    problemStatement: string;
    story: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string;
    examples: Array<{ input: string; output: string; explanation: string }>;
    tags: string[];
  };
}

interface InterviewData {
  id: string;
  title: string;
  company: { name: string; slug: string; logoUrl: string | null };
  status: string;
  score: number | null;
  feedback: string | null;
  experienceYears: number;
  durationMinutes: number;
  problems: InterviewProblem[];
  questions: InterviewQuestion[];
  startedAt: string | null;
  completedAt: string | null;
}

const TYPE_ICONS: Record<QuestionType, { icon: React.ReactNode; label: string; color: string }> = {
  mcq: { icon: <Brain className="w-4 h-4" />, label: "MCQ", color: "bg-purple-500/10 text-purple-600" },
  sql: { icon: <Database className="w-4 h-4" />, label: "SQL", color: "bg-blue-500/10 text-blue-600" },
  debugging: { icon: <Bug className="w-4 h-4" />, label: "Debugging", color: "bg-red-500/10 text-red-600" },
  output_prediction: { icon: <Terminal className="w-4 h-4" />, label: "Output", color: "bg-amber-500/10 text-amber-600" },
  lld: { icon: <Code2 className="w-4 h-4" />, label: "LLD", color: "bg-emerald-500/10 text-emerald-600" },
  system_design: { icon: <FileText className="w-4 h-4" />, label: "System Design", color: "bg-indigo-500/10 text-indigo-600" },
};

export default function InterviewSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [interviewId, setInterviewId] = useState("");
  const [data, setData] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Session state
  const [started, setStarted] = useState(false);
  const [activeSection, setActiveSection] = useState<"coding" | "questions">("questions");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<string, boolean>>({});
  const [codingCode, setCodingCode] = useState<Record<string, string>>({});
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [resultPopup, setResultPopup] = useState<{ shown: boolean; correct: boolean; explanation: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    params.then((p) => setInterviewId(p.id));
  }, [params]);

  useEffect(() => {
    if (interviewId) fetchInterview();
  }, [interviewId]);

  useEffect(() => {
    if (data && (data.status === "completed" || data.status === "evaluated")) {
      setCompleted(true);
    }
  }, [data?.status]);

  async function fetchInterview() {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.data.startedAt) {
          setStarted(true);
          setIsRunning(true);
        }
      } else {
        setError(json.error || "Failed to load");
      }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  // Start interview
  async function handleStart() {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const json = await res.json();
      if (json.success) {
        setStarted(true);
        setIsRunning(true);
        setTimer(0);
      }
    } catch {}
  }

  // Timer
  useEffect(() => {
    if (isRunning && data) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, data?.id]);

  // Poll for status updates
  useEffect(() => {
    if (started && data && !completed) {
      pollRef.current = setInterval(fetchInterview, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [started, data?.id, completed]);

  // Format timer
  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  async function handleAnswer(questionId: string, choiceId: string) {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", questionId, choiceId }),
      });
      const json = await res.json();
      if (json.success) {
        setAnsweredMap((prev) => ({ ...prev, [questionId]: true }));
        setResultPopup({
          shown: true,
          correct: json.data.isCorrect,
          explanation: json.data.explanation,
        });
        setTimeout(() => setResultPopup(null), 4000);
        // Auto-advance to next question
        setTimeout(() => {
          if (currentQuestionIndex < (data?.questions.length || 0) - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
          }
        }, 1500);
      }
    } catch {}
  }

  async function handleSubmitCode(problemEntryId: string, code: string) {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit-code", problemEntryId, code }),
      });
      const json = await res.json();
      if (json.success) {
        setAnsweredMap((prev) => ({ ...prev, [problemEntryId]: true }));
      }
    } catch {}
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      const json = await res.json();
      if (json.success) {
        setCompleted(true);
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        router.push(`/interviews/${interviewId}/results`);
      }
    } catch {}
    finally { setCompleting(false); }
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
        <AlertCircle className="w-10 h-10 text-[var(--muted)]" />
        <p className="text-[var(--muted)]">{error || "Interview not found"}</p>
        <Link href="/interviews"><Button variant="outline">Back to Interviews</Button></Link>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-lg mx-auto text-center">
        <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Interview Complete!</h2>
        <p className="text-sm text-[var(--muted)]">Great effort! View your detailed results and feedback.</p>
        <Link href={`/interviews/${interviewId}/results`}>
          <Button size="lg" className="gap-2">
            <BarChart3 className="w-4 h-4" /> View Results
          </Button>
        </Link>
      </div>
    );
  }

  // ── PENDING / LOBBY ──
  if (!started) {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in py-8">
        <Link href="/interviews" className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Interviews
        </Link>

        <Card className="glass text-center">
          <CardContent className="p-8 space-y-6">
            <div className="p-4 w-fit mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20">
              <Users className="w-10 h-10 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">{data.title}</h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                {data.company?.name} • {data.experienceYears}y experience • {data.durationMinutes} minutes
              </p>
            </div>

            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--foreground)]">{data.problems.length}</p>
                <p className="text-xs text-[var(--muted)]">Coding Problems</p>
              </div>
              <div className="text-2xl text-[var(--muted)]">+</div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--foreground)]">{data.questions.length}</p>
                <p className="text-xs text-[var(--muted)]">Questions</p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--soft)]/30 text-left space-y-1">
              <p className="text-xs font-medium text-[var(--foreground)]">Interview Includes:</p>
              <ul className="text-xs text-[var(--muted)] space-y-0.5">
                {data.problems.length > 0 && <li>✓ Coding problems with solution submissions</li>}
                <li>✓ Multiple choice questions (DS & Algo)</li>
                <li>✓ SQL query questions</li>
                <li>✓ Debugging & output prediction</li>
                <li>✓ Low level & system design</li>
                <li>✓ Auto-evaluation with score & feedback</li>
              </ul>
            </div>

            <Button onClick={handleStart} size="lg" className="w-full gap-2">
              <Play className="w-4 h-4" /> Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── ACTIVE INTERVIEW ──
  const questions = data.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = activeSection === "questions"
    ? (Object.keys(answeredMap).length / (questions.length + data.problems.length)) * 100
    : ((Object.keys(answeredMap).length) / (questions.length + data.problems.length)) * 100;

  return (
    <div className="space-y-4 animate-fade-in max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-[var(--muted)] hidden sm:inline">{data.company?.name}</span>
          <span className="text-xs text-[var(--muted)] hidden sm:inline">•</span>
          <span className="text-xs text-[var(--muted)] truncate">{data.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-mono font-bold">
            <Clock className={`w-3.5 h-3.5 ${timer > (data.durationMinutes * 60 * 0.8) ? "text-red-500 animate-pulse" : "text-[var(--muted)]"}`} />
            <span className={timer > (data.durationMinutes * 60 * 0.8) ? "text-red-500" : "text-[var(--foreground)]"}>
              {formatTime(timer)} / {data.durationMinutes}:00
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={handleComplete} disabled={completing} className="gap-1 text-xs">
            {completing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}
            Finish
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <Progress value={progress} className="h-1.5 flex-1" />
        <span className="text-[10px] text-[var(--muted)] w-20 text-right">
          {Object.keys(answeredMap).length}/{questions.length + data.problems.length} answered
        </span>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setActiveSection("questions")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeSection === "questions"
              ? "bg-[var(--primary)]/10 text-[var(--primary)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Brain className="w-3.5 h-3.5" /> Questions ({questions.length})
        </button>
        {data.problems.length > 0 && (
          <button
            onClick={() => setActiveSection("coding")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSection === "coding"
                ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> Coding ({data.problems.length})
          </button>
        )}
      </div>

      {/* Questions Section */}
      {activeSection === "questions" && questions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Question Navigation */}
          <Card className="glass lg:col-span-1 h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                {questions.map((q, idx) => {
                  const isAnswered = answeredMap[q.id];
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center ${
                        idx === currentQuestionIndex
                          ? "ring-2 ring-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                          : isAnswered
                            ? q.isCorrect
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                            : "bg-[var(--soft)] text-[var(--muted)] hover:bg-[var(--soft)]/70"
                      }`}
                    >
                      {isAnswered ? (q.isCorrect ? "✓" : "✗") : idx + 1}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active Question */}
          <div className="lg:col-span-2 space-y-3">
            {currentQuestion ? (
              <Card className="glass">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={TYPE_ICONS[currentQuestion.type]?.color || "bg-[var(--soft)]"}>
                        {TYPE_ICONS[currentQuestion.type]?.icon} {TYPE_ICONS[currentQuestion.type]?.label || currentQuestion.type}
                      </Badge>
                      <span className="text-xs text-[var(--muted)]">Q{currentQuestionIndex + 1} of {questions.length}</span>
                    </div>
                    {answeredMap[currentQuestion.id] && (
                      <Badge className={currentQuestion.isCorrect ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}>
                        {currentQuestion.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{currentQuestion.questionText}</p>

                  {currentQuestion.type === "lld" || currentQuestion.type === "system_design" ? (
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-600">
                      <strong>💡 Tip:</strong> Read the question and choose the best architectural approach from the options below.
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    {currentQuestion.choices.map((choice) => {
                      const isSelected = currentQuestion.userAnswer === choice.id;
                      const isDisabled = answeredMap[currentQuestion.id];
                      return (
                        <button
                          key={choice.id}
                          onClick={() => !isDisabled && handleAnswer(currentQuestion.id, choice.id)}
                          disabled={isDisabled}
                          className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                            isSelected && isDisabled
                              ? currentQuestion.isCorrect
                                ? "border-emerald-500 bg-emerald-500/10"
                                : "border-red-500 bg-red-500/10"
                              : isDisabled && currentQuestion.correctAnswer === choice.id
                                ? "border-emerald-500/50 bg-emerald-500/5"
                                : isDisabled
                                  ? "border-[var(--border)] opacity-50"
                                  : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--soft)] cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-medium ${
                              isSelected && isDisabled
                                ? currentQuestion.isCorrect ? "border-emerald-500 bg-emerald-500 text-white" : "border-red-500 bg-red-500 text-white"
                                : "border-[var(--muted)] text-[var(--muted)]"
                            }`}>
                              {choice.id.toUpperCase()}
                            </span>
                            <span className="text-[var(--foreground)]">{choice.text}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Result explanation */}
                  {resultPopup && resultPopup.shown && (
                    <div className={`p-3 rounded-lg text-xs ${
                      resultPopup.correct
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700"
                        : "bg-red-500/10 border border-red-500/20 text-red-700"
                    }`}>
                      <p className="font-semibold mb-1">{resultPopup.correct ? "✓ Correct!" : "✗ Incorrect"}</p>
                      <p>{resultPopup.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-[var(--muted)]">All questions completed! Switch to the Coding tab or finish the interview.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Coding Section */}
      {activeSection === "coding" && data.problems.length > 0 && (
        <div className="space-y-4">
          {data.problems.map((problem) => {
            const isAnswered = answeredMap[problem.id];
            return (
              <Card key={problem.id} className="glass">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={
                        problem.detail.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-600" :
                        problem.detail.difficulty === "medium" ? "bg-amber-500/10 text-amber-600" :
                        "bg-red-500/10 text-red-600"
                      }>
                        {problem.detail.difficulty}
                      </Badge>
                      <CardTitle className="text-sm">{problem.detail.title}</CardTitle>
                    </div>
                    {isAnswered && (
                      <Badge className="bg-emerald-500/10 text-emerald-600">✓ Submitted</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">{problem.detail.story}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg bg-[var(--soft)]/50 text-xs text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                    {problem.detail.problemStatement}
                  </div>

                  {/* Constraints & Examples */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-[var(--soft)]/30 text-[10px]">
                      <p className="font-medium text-[var(--muted)] mb-1">Constraints</p>
                      <p className="text-[var(--foreground)] whitespace-pre-wrap">{problem.detail.constraints}</p>
                    </div>
                    {problem.detail.examples.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-[var(--muted)]">Example</p>
                        <div className="p-2 rounded-lg bg-[#1a1a2e] text-[#e0e0e0] text-[10px] font-mono">
                          <p>Input: {problem.detail.examples[0].input}</p>
                          <p>Output: {problem.detail.examples[0].output}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Code Editor */}
                  <div className="rounded-lg overflow-hidden border border-[var(--border)]">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] border-b border-[var(--border)]">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                      </div>
                      <span className="text-xs text-[var(--muted)] ml-2">Solution</span>
                    </div>
                    <div className="h-[300px]">
                      <CodeEditor
                        language="python"
                        value={codingCode[problem.id] || `# Write your solution for ${problem.detail.title}\n# ${problem.detail.slug}\n\ndef solution():\n    # Your code here\n    pass\n`}
                        onChange={(val) => setCodingCode((prev) => ({ ...prev, [problem.id]: val }))}
                        height="300px"
                        theme="vs-dark"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitCode(problem.id, codingCode[problem.id] || "")}
                      disabled={isAnswered}
                      className="gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {isAnswered ? "Submitted ✓" : "Submit Code"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Finish Button (fixed bottom) */}
      <div className="flex justify-center pt-2 pb-4">
        <Button onClick={handleComplete} disabled={completing} size="lg" className="gap-2">
          {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
          {completing ? "Submitting..." : "Submit & View Results"}
        </Button>
      </div>
    </div>
  );
}
