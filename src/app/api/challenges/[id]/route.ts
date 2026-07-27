import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/challenges/[id] — Get a single challenge with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const challenge = await prisma.codeChallenge.findUnique({
      where: { id },
      include: {
        concept: {
          include: {
            subDomain: {
              include: { track: { select: { id: true, name: true, icon: true, color: true } } },
            },
          },
        },
        submissions: {
          where: { userId: session.id },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!challenge) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
    }

    // Get total unique solvers
    const uniqueSolvers = await prisma.challengeSubmission.groupBy({
      by: ["userId"],
      where: { challengeId: id, passed: true },
    });

    const bestSubmission = challenge.submissions.length > 0
      ? challenge.submissions.reduce(
          (best, s) => (!best || (s.score || 0) > (best.score || 0) ? s : best),
          challenge.submissions[0]
        )
      : null;

    return NextResponse.json({
      success: true,
      data: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        difficulty: challenge.difficulty,
        language: challenge.language,
        templateCode: challenge.templateCode,
        solutionCode: challenge.solutionCode,
        testCases: JSON.parse(challenge.testCases || "[]"),
        order: challenge.order,
        conceptName: challenge.concept.name,
        trackName: challenge.concept.subDomain.track.name,
        trackIcon: challenge.concept.subDomain.track.icon,
        trackColor: challenge.concept.subDomain.track.color,
        totalSubmissions: challenge._count.submissions,
        uniqueSolvers: uniqueSolvers.length,
        userSubmissions: challenge.submissions.map((s) => ({
          id: s.id,
          passed: s.passed,
          score: s.score,
          executionTimeMs: s.executionTimeMs,
          createdAt: s.createdAt.toISOString(),
        })),
        bestSubmission: bestSubmission
          ? {
              passed: bestSubmission.passed,
              score: bestSubmission.score,
              executionTimeMs: bestSubmission.executionTimeMs,
              createdAt: bestSubmission.createdAt.toISOString(),
            }
          : null,
        createdAt: challenge.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Challenge detail error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
