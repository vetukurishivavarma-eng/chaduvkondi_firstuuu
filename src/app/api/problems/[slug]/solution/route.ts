import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/problems/[slug]/solution — Get solution
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const { slug } = await params;

    const problem = await prisma.codingProblem.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        bruteForceSolution: true,
        optimalSolution: true,
        complexityAnalysis: true,
        dryRun: true,
        pseudoCode: true,
        solutionJava: true,
        solutionPython: true,
        solutionCpp: true,
        solutionC: true,
        solutionJavaScript: true,
        solutionGo: true,
        solutionRust: true,
        solutionKotlin: true,
        solutionSwift: true,
        solutionPhp: true,
        solutionCsharp: true,
        solutionRuby: true,
        solutionTypescript: true,
      },
    });

    if (!problem) {
      return errorResponse("Problem not found", 404);
    }

    // Check if user has solved this problem or is admin
    const isAdmin = session.role === "admin";
    const progress = await prisma.userProblemProgress.findUnique({
      where: {
        userId_problemId: { userId: session.id, problemId: problem.id },
      },
    });

    if (!isAdmin && !progress?.solved) {
      // Return limited solution info without code
      return successResponse({
        bruteForceSolution: problem.bruteForceSolution,
        complexityAnalysis: problem.complexityAnalysis,
        hint: "Solve the problem to view the complete solution with code.",
        locked: true,
      });
    }

    return successResponse({
      bruteForceSolution: problem.bruteForceSolution,
      optimalSolution: problem.optimalSolution,
      complexityAnalysis: problem.complexityAnalysis,
      dryRun: problem.dryRun,
      pseudoCode: problem.pseudoCode,
      solutions: {
        java: problem.solutionJava,
        python: problem.solutionPython,
        cpp: problem.solutionCpp,
        c: problem.solutionC,
        javascript: problem.solutionJavaScript,
        go: problem.solutionGo,
        rust: problem.solutionRust,
        kotlin: problem.solutionKotlin,
        swift: problem.solutionSwift,
        php: problem.solutionPhp,
        csharp: problem.solutionCsharp,
        ruby: problem.solutionRuby,
        typescript: problem.solutionTypescript,
      },
      locked: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
