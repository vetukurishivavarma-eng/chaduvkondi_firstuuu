import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;

    // ── Heatmap: submissions per day for the last 365 days ──
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    oneYearAgo.setHours(0, 0, 0, 0);

    const submissions = await prisma.problemSubmission.findMany({
      where: {
        userId,
        createdAt: { gte: oneYearAgo },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const heatmapMap = new Map<string, { total: number; accepted: number }>();
    for (const sub of submissions) {
      const dateKey = sub.createdAt.toISOString().split("T")[0];
      const entry = heatmapMap.get(dateKey) || { total: 0, accepted: 0 };
      entry.total++;
      if (sub.status === "accepted") entry.accepted++;
      heatmapMap.set(dateKey, entry);
    }

    const heatmap = Array.from(heatmapMap.entries()).map(([date, counts]) => ({
      date,
      count: counts.total,
      accepted: counts.accepted,
    }));

    // ── Overall coding stats ──
    const allSubmissions = await prisma.problemSubmission.findMany({
      where: { userId },
      select: { status: true, problemId: true },
    });

    const totalSubmissions = allSubmissions.length;
    const accepted = allSubmissions.filter((s) => s.status === "accepted").length;
    const uniqueProblemsAttempted = new Set(allSubmissions.map((s) => s.problemId)).size;

    // Solved problems (unique problems with at least one accepted submission)
    const solvedProblemIds = new Set(
      allSubmissions.filter((s) => s.status === "accepted").map((s) => s.problemId)
    );
    const totalSolved = solvedProblemIds.size;

    // Total published problems
    const totalProblems = await prisma.codingProblem.count({
      where: { status: "published" },
    });

    const accuracy = totalSubmissions > 0 ? Math.round((accepted / totalSubmissions) * 100) : 0;

    // ── Company-wise progress ──
    const userProgress = await prisma.userProblemProgress.findMany({
      where: { userId },
      include: {
        problem: {
          select: {
            companyId: true,
            company: { select: { name: true, slug: true, logoUrl: true } },
          },
        },
      },
    });

    const companyMap = new Map<
      string,
      { name: string; slug: string; logoUrl: string | null; solved: number; total: number }
    >();

    // Get total problems per company
    const companyProblems = await prisma.codingProblem.groupBy({
      by: ["companyId"],
      where: {
        companyId: { not: null },
        status: "published",
      },
      _count: { id: true },
    });

    const companyTotalMap = new Map(companyProblems.map((c) => [c.companyId, c._count.id]));

    for (const progress of userProgress) {
      const companyId = progress.problem.companyId;
      if (!companyId) continue;
      const company = progress.problem.company!;
      const total = companyTotalMap.get(companyId) || 0;

      const existing = companyMap.get(companyId) || {
        name: company.name,
        slug: company.slug,
        logoUrl: company.logoUrl,
        solved: 0,
        total,
      };
      if (progress.solved) existing.solved++;
      companyMap.set(companyId, existing);
    }

    const companyProgress = Array.from(companyMap.entries())
      .map(([, data]) => ({
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl,
        solved: data.solved,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.solved - a.solved);

    // ── Topic mastery ──
    const topicProblems = await prisma.codingProblem.groupBy({
      by: ["topicId"],
      where: {
        topicId: { not: null },
        status: "published",
      },
      _count: { id: true },
    });

    const topicTotalMap = new Map(topicProblems.map((t) => [t.topicId, t._count.id]));

    const topics = await prisma.topic.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, icon: true, color: true },
    });

    const topicMap = new Map(topics.map((t) => [t.id, t]));
    const userSolvedByTopic = new Map<string, number>();

    // Get user's solved problems with their topics
    const solvedProgress = await prisma.userProblemProgress.findMany({
      where: { userId, solved: true },
      include: {
        problem: { select: { topicId: true } },
      },
    });

    for (const p of solvedProgress) {
      if (p.problem.topicId) {
        userSolvedByTopic.set(
          p.problem.topicId,
          (userSolvedByTopic.get(p.problem.topicId) || 0) + 1
        );
      }
    }

    const topicMastery = topics
      .map((topic) => {
        const total = topicTotalMap.get(topic.id) || 0;
        const solved = userSolvedByTopic.get(topic.id) || 0;
        return {
          name: topic.name,
          slug: topic.slug,
          icon: topic.icon,
          color: topic.color,
          solved,
          total,
          percentage: total > 0 ? Math.round((solved / total) * 100) : 0,
        };
      })
      .filter((t) => t.total > 0)
      .sort((a, b) => b.solved - a.solved);

    // ── Current coding streak ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const acceptedDates: Set<string> = new Set(
      submissions.filter((s) => s.status === "accepted").map((s) => s.createdAt.toISOString().split("T")[0])
    );
    let codingStreak = 0;
    const checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (acceptedDates.has(dateStr)) {
        codingStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // ── Weekly activity summary ──
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyActivity = weekDays.map((day, idx) => {
      const daySubmissions = submissions.filter((s) => {
        const d = new Date(s.createdAt);
        return d.getDay() === idx;
      });
      return {
        day,
        count: daySubmissions.length,
        accepted: daySubmissions.filter((s) => s.status === "accepted").length,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalSolved,
          totalProblems,
          totalSubmissions,
          uniqueProblemsAttempted,
          accepted,
          accuracy,
          codingStreak,
        },
        heatmap,
        weeklyActivity,
        companyProgress,
        topicMastery,
      },
    });
  } catch (error) {
    console.error("Coding stats API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
