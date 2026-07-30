import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProblem, isOllamaAvailable, getModelName } from "@/lib/ai-generator";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { difficulty = "medium", topic = "arrays", company = "google", language = "python" } = body;

    // Validate inputs
    const validDifficulties = ["easy", "medium", "hard", "expert"];
    if (!validDifficulties.includes(difficulty)) {
      return errorResponse("Invalid difficulty. Must be: easy, medium, hard, or expert", 400);
    }

    // Check if Ollama is available (for status reporting)
    const ollamaAvailable = await isOllamaAvailable();

    // Generate the problem
    const result = await generateProblem({ difficulty, topic, company, language });

    const problem = result.problem;

    // Look up DB references
    const companyRecord = await prisma.company.findUnique({ where: { slug: problem.companySlug } });
    const topicRecord = await prisma.topic.findUnique({ where: { slug: problem.topicSlug } });
    const languageRecord = await prisma.programmingLanguage.findUnique({ where: { slug: problem.languageSlug } });

    if (!languageRecord) {
      return errorResponse(`Language not found: ${problem.languageSlug}. Run seed first.`, 500);
    }

    // Check for duplicate slug
    const existing = await prisma.codingProblem.findUnique({ where: { slug: problem.slug } });
    if (existing) {
      // Append a suffix to avoid collision
      problem.slug = `${problem.slug}-${Date.now() % 10000}`;
    }

    // Create the problem with "draft" status for admin review
    const created = await prisma.codingProblem.create({
      data: {
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        story: problem.story,
        problemStatement: problem.problemStatement,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        constraints: problem.constraints,
        examples: JSON.stringify(problem.examples),
        edgeCases: JSON.stringify(problem.edgeCases),
        hints: JSON.stringify(problem.hints),
        tags: JSON.stringify(problem.tags),
        companyId: companyRecord?.id || null,
        topicId: topicRecord?.id || null,
        languageId: languageRecord.id,

        bruteForceSolution: problem.bruteForceSolution,
        optimalSolution: problem.optimalSolution,
        complexityAnalysis: problem.complexityAnalysis,
        dryRun: problem.dryRun,
        pseudoCode: problem.pseudoCode,

        solutionJava: problem.solutionJava,
        solutionPython: problem.solutionPython,
        solutionCpp: problem.solutionCpp,
        solutionJavaScript: problem.solutionJavaScript,
        solutionGo: problem.solutionGo,
        solutionKotlin: problem.solutionKotlin,

        testCases: JSON.stringify(problem.testCases),
        hiddenTestCases: JSON.stringify(problem.hiddenTestCases),

        interviewTips: problem.interviewTips,
        commonMistakes: problem.commonMistakes,

        isAiGenerated: result.usedAi,
        status: "draft",
        authorId: session.id,
        createdById: session.id,
      },
    });

    // Determine the actual model used
    const modelName = result.usedAi ? getModelName() : "fallback-template";

    // Log the AI generation
    await prisma.aiGenerationLog.create({
      data: {
        prompt: JSON.stringify({ difficulty, topic, company, language }),
        response: JSON.stringify({ title: problem.title, slug: problem.slug, usedAi: result.usedAi }),
        model: modelName,
        tokensUsed: result.tokensUsed || 0,
        generationType: "problem",
      },
    });

    return successResponse({
      id: created.id,
      title: created.title,
      slug: created.slug,
      difficulty: created.difficulty,
      status: created.status,
      isAiGenerated: created.isAiGenerated,
      ollamaAvailable,
      modelName,
      qualityScore: result.qualityScore?.total || null,
      qualityBreakdown: result.qualityScore?.breakdown || null,
      retriesAttempted: result.retriesAttempted || 0,
    });
  } catch (error) {
    console.error("AI generate problem error:", error);
    return handleApiError(error);
  }
}

// GET — check if Ollama is available
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const available = await isOllamaAvailable();

    const modelName = getModelName();

    return successResponse({
      ollamaAvailable: available,
      modelName: available ? modelName : null,
      message: available
        ? `Ollama is running (${modelName}) and ready to generate problems.`
        : "Ollama is not running. Template-based fallback will be used.",
    });
  } catch (error) {
    console.error("AI status check error:", error);
    return handleApiError(error);
  }
}
