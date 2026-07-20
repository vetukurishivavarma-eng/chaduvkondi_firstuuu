"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import {
  Brain,
  Zap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
  Trophy,
  Target,
  ExternalLink,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  difficultyWeight: number;
  explanation: string;
  concept: {
    id: string;
    name: string;
    subDomain: string;
  };
  choices: Array<{
    id: string;
    text: string;
  }>;
}

interface QuizData {
  quizId: string;
  type: string;
  questions: Question[];
  totalQuestions: number;
}

interface AnswerResult {
  isCorrect: boolean;
  explanation: string;
  correctChoice: string;
  conceptName: string;
  subDomain: string;
  currentMastery: number;
  remediation: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    type: string;
  }> | null;
}

type QuizPhase = "select" | "active" | "results";

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "practice";

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("select");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<Array<{ questionId: string; isCorrect: boolean; result: AnswerResult }>>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState<number>(0);

  const questionCount = searchParams.get("count")
    ? parseInt(searchParams.get("count")!)
    : 10;

  useEffect(() => {
    if (phase === "active" && !startTime) {
      setStartTime(Date.now());
    }
  }, [phase, startTime]);

  // Auto-start based on URL mode
  useEffect(() => {
    if (mode && ["diagnostic", "spaced_repetition"].includes(mode)) {
      startQuiz(mode);
    }
  }, []);

  async function startQuiz(quizType: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: quizType,
          count: questionCount,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to start quiz");
        return;
      }

      setQuiz(data.data);
      setPhase("active");
      setCurrentQuestion(0);
      setAnswers([]);
      setSelectedChoice(null);
      setShowFeedback(false);
      setStartTime(Date.now());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!selectedChoice || !quiz) return;

    const question = quiz.questions[currentQuestion];
    const timeOnQuestion = Math.floor((Date.now() - startTime) / 1000);

    setShowFeedback(true);

    try {
      const res = await fetch(`/api/quiz/${quiz.quizId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          choiceId: selectedChoice,
          timeSpent: timeOnQuestion,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setAnswers((prev) => [
          ...prev,
          {
            questionId: question.id,
            isCorrect: data.data.isCorrect,
            result: data.data,
          },
        ]);

        // 🎉 Trigger avatar celebration on correct answer
        if (data.data.isCorrect) {
          window.dispatchEvent(new CustomEvent("avatar-celebrate"));
        }
      }
    } catch {
      setAnswers((prev) => [
        ...prev,
        {
          questionId: question.id,
          isCorrect: false,
          result: {
            isCorrect: false,
            explanation: "",
            correctChoice: "",
            conceptName: "",
            subDomain: "",
            currentMastery: 0,
            remediation: null,
          },
        },
      ]);
    }
  }

  function nextQuestion() {
    if (!quiz) return;

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedChoice(null);
      setShowFeedback(false);
      setStartTime(Date.now());
    } else {
      completeQuiz();
    }
  }

  async function completeQuiz() {
    if (!quiz) return;
    setCompleting(true);

    try {
      await fetch(`/api/quiz/${quiz.quizId}`, {
        method: "PATCH",
      });
      setPhase("results");
    } catch {
      setPhase("results");
    } finally {
      setCompleting(false);
    }
  }

  if (phase === "select") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Quiz</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Choose your quiz mode to get started
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-emerald-200 dark:border-emerald-800"
            onClick={() => !loading && startQuiz("practice")}
          >
            <CardContent className="p-6 space-y-4">
              <div className="p-2.5 w-fit rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Practice Quiz</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Adaptive questions targeting your weakest concepts
                </p>
              </div>
              <Button className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Practice"}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-amber-200 dark:border-amber-800"
            onClick={() => !loading && startQuiz("diagnostic")}
          >
            <CardContent className="p-6 space-y-4">
              <div className="p-2.5 w-fit rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Diagnostic</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Full assessment across all concepts to gauge your level
                </p>
              </div>
              <Button className="w-full" variant="outline" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Diagnostic"}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-emerald-200 dark:border-emerald-800"
            onClick={() => !loading && startQuiz("spaced_repetition")}
          >
            <CardContent className="p-6 space-y-4">
              <div className="p-2.5 w-fit rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Spaced Review</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Review concepts due for spaced repetition reinforcement
                </p>
              </div>
              <Button className="w-full" variant="outline" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Review"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (phase === "results" && quiz) {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const score =
      quiz.questions.length > 0
        ? Math.round((correctCount / quiz.questions.length) * 100)
        : 0;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-8 space-y-4">
            <div
              className={`p-3 w-fit mx-auto rounded-full ${
                score >= 70
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : score >= 40
                  ? "bg-amber-100 dark:bg-amber-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {score >= 70 ? (
                <Trophy className="w-8 h-8 text-emerald-600" />
              ) : score >= 40 ? (
                <Target className="w-8 h-8 text-amber-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold">Quiz Complete!</h2>
            <div className="text-5xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              {score}%
            </div>
            <p className="text-zinc-500">
              {correctCount} of {quiz.questions.length} correct
            </p>
            <Progress value={score} className="h-3 max-w-xs mx-auto" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quiz.questions.map((q, i) => {
              const answer = answers.find((a) => a.questionId === q.id);
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {answer?.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{q.text}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {q.concept.name} • {q.concept.subDomain}
                      </p>
                    </div>
                  </div>

                  {answer?.result.explanation && (
                    <div className="ml-8 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm">
                      <p className="font-medium text-xs uppercase tracking-wider text-zinc-500 mb-1">
                        Explanation
                      </p>
                      <p>{answer.result.explanation}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Correct answer:{" "}
                        <span className="font-medium text-emerald-600">
                          {answer.result.correctChoice}
                        </span>
                      </p>
                    </div>
                  )}

                  {!answer?.isCorrect &&
                    answer?.result.remediation &&
                    answer.result.remediation.length > 0 && (
                      <div className="ml-8 space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Remediation Resources
                        </p>
                        {answer.result.remediation.map((r) => (
                          <a
                            key={r.id}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors group"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="flex-1">{r.title}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {r.type}
                            </Badge>
                          </a>
                        ))}
                      </div>
                    )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={() => setPhase("select")}
            variant="outline"
            className="flex-1"
          >
            Back to Quiz Modes
          </Button>
          <Button onClick={() => router.push("/dashboard")} className="flex-1">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const answer = answers.find((a) => a.questionId === question.id);
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setPhase("select")}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-medium">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
            <span className="text-zinc-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Quiz Type Badge */}
      <Badge variant="secondary" className="capitalize w-fit">
        {quiz.type.replace("_", " ")}
      </Badge>

      {/* Question Card */}
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-6 space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                {question.concept.name}
              </Badge>
              <span className="text-xs text-zinc-400">
                {question.concept.subDomain}
              </span>
            </div>
            <p className="text-lg font-medium leading-relaxed">{question.text}</p>
          </div>

          {/* Answer Choices */}
          <RadioGroup
            value={selectedChoice || ""}
            onValueChange={(value) => !showFeedback && setSelectedChoice(value)}
            className="space-y-3"
          >
            {question.choices.map((choice) => {
              const isSelected = selectedChoice === choice.id;
              const showCorrect =
                showFeedback &&
                answer?.result.correctChoice === choice.text;
              const showWrong = showFeedback && isSelected && !answer?.isCorrect;

              return (
                <div
                  key={choice.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    showCorrect
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                      : showWrong
                      ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                      : isSelected
                      ? "border-violet-500 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-700"
                  }`}
                  onClick={() => !showFeedback && setSelectedChoice(choice.id)}
                >
                  <RadioGroupItem
                    value={choice.id}
                    id={choice.id}
                    disabled={showFeedback}
                  />
                  <label
                    htmlFor={choice.id}
                    className="flex-1 cursor-pointer text-sm font-medium"
                  >
                    {choice.text}
                  </label>
                  {showCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                  {showWrong && <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Feedback & Explanation */}
      {showFeedback && answer && (
        <Card
          className={`border ${
            answer.isCorrect
              ? "border-emerald-200 dark:border-emerald-800"
              : "border-amber-200 dark:border-amber-800"
          }`}
        >
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              {answer.isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Correct!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-red-700 dark:text-red-300">
                    Incorrect
                  </span>
                </>
              )}
            </div>

            <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <p className="text-sm font-medium mb-1">Explanation:</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {answer.result.explanation}
              </p>
            </div>

            {/* Mastery Update */}
            <div className="flex items-center gap-3 text-sm">
              <Target className="w-4 h-4 text-emerald-500" />
              <span>Concept mastery: </span>
              <span className="font-semibold">
                {Math.round(answer.result.currentMastery)}%
              </span>
            </div>

            {/* Remediation Resources for Wrong Answers */}
            {!answer.isCorrect &&
              answer.result.remediation &&
              answer.result.remediation.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    Recommended Resources
                  </p>
                  {answer.result.remediation.map((r) => (
                    <a
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors group"
                    >
                      <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{r.title}</p>
                        <p className="text-xs text-zinc-500 truncate">
                          {r.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {r.type}
                      </Badge>
                    </a>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {!showFeedback ? (
          <Button
            onClick={submitAnswer}
            disabled={!selectedChoice}
            className="flex-1 h-12 text-base gap-2"
          >
            {completing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Submit Answer"
            )}
          </Button>
        ) : (
          <Button
            onClick={nextQuestion}
            disabled={completing}
            className="flex-1 h-12 text-base gap-2"
          >
            {isLastQuestion ? (
              completing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "View Results"
              )
            ) : (
              <>
                Next Question
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading quiz...</span>
          </div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
