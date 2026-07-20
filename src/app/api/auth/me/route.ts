import { getSession } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import { calculateOverallMastery } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    // Get mastery scores for dashboard stats
    const masteryScores = await prisma.masteryScore.findMany({
      where: { userId: session.id },
      include: { concept: { include: { subDomain: true } } },
    });

    const overallScore = calculateOverallMastery(masteryScores);

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { tier: true },
    });

    return successResponse({
      ...session,
      avatarUrl: user?.avatarUrl ?? null,
      avatarCreatedAt: user?.avatarCreatedAt?.toISOString() ?? null,
      overallScore,
      conceptsCount: masteryScores.length,
      tier: user?.tier,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
