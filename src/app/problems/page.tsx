"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Code2,
  Loader2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  Home,
  ChevronDown,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  company: { name: string; slug: string; logoUrl: string | null } | null;
  language: { name: string; slug: string; icon: string; color: string };
  topic: { name: string; slug: string; icon: string; color: string } | null;
  tags: string[];
  totalSubmissions: number;
  totalAccepted: number;
  acceptanceRate: number;
  isSolved: boolean;
  isBookmarked: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DIFFICULTY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  easy: { icon: "🌱", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  medium: { icon: "⚡", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  hard: { icon: "🔥", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
  expert: { icon: "💎", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10" },
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filters
  const [difficulty, setDifficulty] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Data for filters
  const [companies, setCompanies] = useState<Array<{ slug: string; name: string }>>([]);
  const [topics, setTopics] = useState<Array<{ slug: string; name: string; icon: string }>>([]);

  // Load filter options
  useEffect(() => {
    Promise.all([
      fetch("/api/companies").then((r) => r.json()),
      fetch("/api/topics").then((r) => r.json()),
    ]).then(([companiesRes, topicsRes]) => {
      if (companiesRes.success) setCompanies(companiesRes.data);
      if (topicsRes.success) setTopics(topicsRes.data);
    }).catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProblems = useCallback(async (pageNum = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(pageNum));
    params.set("limit", "20");
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (difficulty) params.set("difficulty", difficulty);
    if (company) params.set("company", company);
    if (topic) params.set("topic", topic);
    if (status) params.set("status", status);
    if (sort) params.set("sort", sort);

    try {
      const res = await fetch(`/api/problems?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProblems(data.data.problems);
        setPagination(data.data.pagination);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [debouncedSearch, difficulty, company, topic, status, sort]);

  useEffect(() => {
    fetchProblems(1);
  }, [fetchProblems]);

  function getAcceptanceColor(rate: number): string {
    if (rate >= 70) return "text-emerald-500";
    if (rate >= 40) return "text-amber-500";
    return "text-red-500";
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Coding Problems</h1>
          <p className="text-[var(--muted)] mt-1">Practice coding interview questions across companies and topics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {(difficulty || company || topic || status) && (
              <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
            )}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
        <input
          type="text"
          placeholder="Search problems by title, topic, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] animate-fade-in-down space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Difficulty */}
            <div>
              <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              >
                <option value="">All Difficulties</option>
                <option value="easy">🌱 Easy</option>
                <option value="medium">⚡ Medium</option>
                <option value="hard">🔥 Hard</option>
                <option value="expert">💎 Expert</option>
              </select>
            </div>

            {/* Company */}
            <div>
              <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Company</label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Topic</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              >
                <option value="">All Topics</option>
                {topics.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.icon} {t.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              >
                <option value="">All Problems</option>
                <option value="solved">Solved</option>
                <option value="unsolved">Unsolved</option>
                <option value="bookmarked">Bookmarked</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              >
                <option value="newest">Newest</option>
                <option value="popularity">Most Popular</option>
                <option value="difficulty">Easiest</option>
                <option value="acceptance">Highest Acceptance</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(difficulty || company || topic || status) && (
            <button
              onClick={() => { setDifficulty(""); setCompany(""); setTopic(""); setStatus(""); setSort("newest"); }}
              className="text-xs text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Stats Summary */}
      {!loading && problems.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
          <span>{pagination.total} problems</span>
          <span>{problems.filter((p) => p.isSolved).length} solved</span>
          <span>{problems.filter((p) => p.isBookmarked).length} bookmarked</span>
        </div>
      )}

      {/* Problem List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        </div>
      ) : problems.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="p-4 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-light)]/20">
            <Code2 className="w-10 h-10 text-[var(--muted)]" />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">No problems found</p>
          <p className="text-sm text-[var(--muted)]">Try adjusting your search or filters.</p>
          {(difficulty || company || topic || status || debouncedSearch) && (
            <Button variant="outline" size="sm" onClick={() => { setDifficulty(""); setCompany(""); setTopic(""); setStatus(""); setSearchQuery(""); }}>
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {problems.map((problem) => {
              const diff = DIFFICULTY_CONFIG[problem.difficulty] || DIFFICULTY_CONFIG.easy;
              return (
                <Link key={problem.id} href={`/problems/${problem.slug}`}>
                  <Card className="glass card-bounce cursor-pointer group hover:border-[var(--primary)]/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Status icon */}
                        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center">
                          {problem.isSolved ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <div className={`w-8 h-8 rounded-lg ${diff.bg} flex items-center justify-center`}>
                              <span className="text-sm">{diff.icon}</span>
                            </div>
                          )}
                        </div>

                        {/* Problem info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate">
                              {problem.title}
                            </h3>
                            {problem.isBookmarked && (
                              <BookmarkCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-medium ${diff.color}`}>{diff.icon} {problem.difficulty}</span>
                            {problem.company && (
                              <span className="text-xs text-[var(--muted)]">• {problem.company.name}</span>
                            )}
                            {problem.topic && (
                              <span className="text-xs text-[var(--muted)]">• {problem.topic.icon} {problem.topic.name}</span>
                            )}
                            <span className="text-xs text-[var(--muted)]">• {problem.language.icon} {problem.language.name}</span>
                          </div>
                          {/* Tags */}
                          {problem.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {problem.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--soft)] text-[var(--muted)]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-right">
                          <div>
                            <p className={`text-xs font-medium ${getAcceptanceColor(problem.acceptanceRate)}`}>
                              {problem.acceptanceRate.toFixed(1)}%
                            </p>
                            <p className="text-[10px] text-[var(--muted)]">Acceptance</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[var(--foreground)]">{problem.totalSubmissions}</p>
                            <p className="text-[10px] text-[var(--muted)]">Submissions</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchProblems(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <span className="text-xs text-[var(--muted)]">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchProblems(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
