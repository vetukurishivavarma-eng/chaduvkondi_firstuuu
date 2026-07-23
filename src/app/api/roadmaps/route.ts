import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;

    // Fetch all tracks with sub-domains, concepts, and user mastery
    const tracks = await prisma.track.findMany({
      where: { isActive: true },
      include: {
        subDomains: {
          orderBy: { order: "asc" },
          include: {
            concepts: {
              orderBy: { order: "asc" },
              include: {
                masteryScores: {
                  where: { userId },
                  take: 1,
                },
                _count: { select: { questions: true } },
              },
            },
            _count: { select: { concepts: true } },
          },
        },
      },
      orderBy: { popularity: "desc" },
    });

    // Format the data
    const roadmapData = tracks.map((track) => ({
      id: track.id,
      name: track.name,
      description: track.longDescription || track.description,
      icon: track.icon,
      color: track.color,
      difficulty: track.difficulty,
      subDomains: track.subDomains.map((sd) => ({
        id: sd.id,
        name: sd.name,
        description: sd.description,
        concepts: sd.concepts.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          questionCount: c._count.questions,
          masteryScore: c.masteryScores.length > 0 ? c.masteryScores[0].score : 0,
          masteryLevel: c.masteryScores.length > 0
            ? c.masteryScores[0].score >= 80 ? "mastered" :
              c.masteryScores[0].score >= 50 ? "learning" :
              c.masteryScores[0].score >= 20 ? "started" : "new"
            : "new",
          attempts: c.masteryScores.length > 0 ? c.masteryScores[0].attempts : 0,
        })),
      })),
    }));

    // Get user's active track
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentTrackId: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        tracks: roadmapData,
        activeTrackId: user?.currentTrackId,
      },
    });
  } catch (error) {
    console.error("Roadmaps API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
