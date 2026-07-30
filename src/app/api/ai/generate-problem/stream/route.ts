/**
 * Streaming AI Problem Generator API Route
 *
 * Uses SSE (Server-Sent Events) to stream problem generation tokens
 * in real-time so users can watch the AI "write" the problem.
 *
 * Events emitted:
 *   - status:  { type: "status", message: string }
 *   - token:   { type: "token", data: string }
 *   - preview: { type: "preview", data: string } (accumulated text so far)
 *   - error:   { type: "error", message: string }
 *   - complete:{ type: "complete", data: { id, title, slug, ... } }
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateProblem,
  isOllamaAvailable,
  getModelName,
  buildGenerationPrompt,
  buildSystemPrompt,
  callOllamaStreaming,
  extractJson,
  tryParseJson,
  validateGeneratedProblem,
  generateFallbackProblem,
  GeneratorConfig,
  GenerationResult,
} from "@/lib/ai-generator";
import {
  scoreProblem,
  isHighQuality,
  QualityScore,
  MAX_RETRIES,
} from "@/lib/quality-scorer";
import { errorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const maxDuration = 120;

// ── SSE helpers ──

const encoder = new TextEncoder();

function sseEvent(data: object): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

// ── POST handler ──

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return new Response(
        `data: ${JSON.stringify({ type: "error", message: "Unauthorized" })}\n\n`,
        {
          status: 401,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    const body = await request.json();
    const config: GeneratorConfig = {
      difficulty: body.difficulty || "medium",
      topic: body.topic || "arrays",
      company: body.company || "google",
      language: body.language || "python",
    };

    // Validate inputs
    const validDifficulties = ["easy", "medium", "hard", "expert"];
    if (!validDifficulties.includes(config.difficulty)) {
      return new Response(
        `data: ${JSON.stringify({ type: "error", message: "Invalid difficulty" })}\n\n`,
        { status: 400, headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } }
      );
    }

    // Check Ollama availability
    const ollamaAvailable = await isOllamaAvailable();

    if (!ollamaAvailable) {
      // No Ollama — use fallback and send a single complete event
      const problem = generateFallbackProblem(config);
      const savedResult = await saveProblemToDb(problem, config, session.id);
      const fallbackStream = new ReadableStream({
        start(controller) {
          controller.enqueue(sseEvent({ type: "status", message: `Using template fallback (Ollama not available)` }));
          controller.enqueue(sseEvent({ type: "complete", data: savedResult }));
          controller.close();
        },
      });
      return new Response(fallbackStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // ── Streaming from Ollama ──
    const modelName = getModelName();
    const systemPrompt = buildSystemPrompt();
    const fullPrompt = buildGenerationPrompt(config);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Initial status
          controller.enqueue(sseEvent({ type: "status", message: `Connecting to ${modelName}...` }));

          // 2. Stream tokens from Ollama
          let accumulatedText = "";
          let tokenCount = 0;

          for await (const chunk of callOllamaStreaming(fullPrompt, systemPrompt)) {
            if (chunk.done) {
              accumulatedText = chunk.fullText || accumulatedText;
              controller.enqueue(sseEvent({ type: "status", message: "Processing generated problem..." }));
              break;
            }

            accumulatedText += chunk.token;
            tokenCount++;

            // Send token event for live display
            controller.enqueue(sseEvent({ type: "token", data: chunk.token }));

            // Send preview periodically (every ~20 tokens)
            if (tokenCount % 20 === 0) {
              controller.enqueue(sseEvent({ type: "preview", data: accumulatedText }));
            }
          }

          // 3. Parse, validate, score, and auto-retry if needed
          let problem;
          let usedAi = true;
          let qualityScore: QualityScore | undefined;
          let retriesAttempted = 0;

          try {
            const cleaned = extractJson(accumulatedText);
            const parsed = tryParseJson(cleaned);

            if (parsed && parsed.title && parsed.problemStatement) {
              problem = validateGeneratedProblem(parsed, config);

              // Score the problem quality
              qualityScore = scoreProblem(problem, config);

              // If quality is below threshold, retry with non-streaming generation
              if (!isHighQuality(qualityScore.total)) {
                controller.enqueue(sseEvent({
                  type: "status",
                  message: `Quality score: ${qualityScore.total}/100 — retrying with improvements...`,
                }));

                const result = await generateProblem(config);
                problem = result.problem;
                usedAi = result.usedAi;
                qualityScore = result.qualityScore;
                retriesAttempted = (result.retriesAttempted || 0) + 1;

                controller.enqueue(sseEvent({
                  type: "status",
                  message: `Regenerated with quality score: ${qualityScore?.total || "?"}/100`,
                }));
              }
            } else {
              throw new Error("Invalid or incomplete JSON from AI");
            }
          } catch (parseError) {
            // Phase 2 retry: try non-streaming generation
            controller.enqueue(sseEvent({ type: "status", message: "JSON parsing failed — retrying with simplified prompt..." }));
            const result = await generateProblem(config);
            problem = result.problem;
            usedAi = result.usedAi;
            qualityScore = result.qualityScore;
            retriesAttempted = (result.retriesAttempted || 0) + 1;
          }

          if (!problem) {
            // Ultimate fallback
            controller.enqueue(sseEvent({ type: "status", message: "Using template fallback..." }));
            problem = generateFallbackProblem(config);
            usedAi = false;
          }

          // 4. Save to database
          controller.enqueue(sseEvent({ type: "status", message: "Saving to database..." }));

          // Look up DB references
          const [companyRecord, topicRecord, languageRecord] = await Promise.all([
            prisma.company.findUnique({ where: { slug: problem.companySlug } }),
            prisma.topic.findUnique({ where: { slug: problem.topicSlug } }),
            prisma.programmingLanguage.findUnique({ where: { slug: problem.languageSlug } }),
          ]);

          if (!languageRecord) {
            controller.enqueue(sseEvent({ type: "error", message: `Language not found: ${problem.languageSlug}` }));
            controller.close();
            return;
          }

          // Check for duplicate slug
          const existing = await prisma.codingProblem.findUnique({ where: { slug: problem.slug } });
          if (existing) {
            problem.slug = `${problem.slug}-${Date.now() % 10000}`;
          }

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
              isAiGenerated: usedAi,
              status: "draft",
              authorId: session.id,
              createdById: session.id,
            },
          });

          // 5. Log the generation
          await prisma.aiGenerationLog.create({
            data: {
              prompt: JSON.stringify(config),
              response: JSON.stringify({ title: problem.title, slug: problem.slug, usedAi }),
              model: usedAi ? modelName : "fallback-template",
              tokensUsed: Math.round(accumulatedText.length / 4),
              generationType: "problem",
            },
          });

          // 6. Send complete event with quality score
          controller.enqueue(sseEvent({
            type: "complete",
            data: {
              id: created.id,
              title: created.title,
              slug: created.slug,
              difficulty: created.difficulty,
              status: created.status,
              isAiGenerated: created.isAiGenerated,
              ollamaAvailable: true,
              modelName,
              qualityScore: qualityScore?.total || null,
              qualityBreakdown: qualityScore?.breakdown || null,
              retriesAttempted,
            },
          }));

          controller.close();
        } catch (err: any) {
          controller.enqueue(sseEvent({ type: "error", message: err.message || "Generation failed" }));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("AI stream error:", err);
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: err.message || "Internal server error" })}\n\n`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }
}

// ── Helper: save problem to DB (used by fallback path) ──

async function saveProblemToDb(problem: any, config: GeneratorConfig, userId: string) {
  const [companyRecord, topicRecord, languageRecord] = await Promise.all([
    prisma.company.findUnique({ where: { slug: problem.companySlug } }),
    prisma.topic.findUnique({ where: { slug: problem.topicSlug } }),
    prisma.programmingLanguage.findUnique({ where: { slug: problem.languageSlug } }),
  ]);

  if (!languageRecord) {
    throw new Error(`Language not found: ${problem.languageSlug}`);
  }

  const existing = await prisma.codingProblem.findUnique({ where: { slug: problem.slug } });
  if (existing) {
    problem.slug = `${problem.slug}-${Date.now() % 10000}`;
  }

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
      isAiGenerated: false,
      status: "draft",
      authorId: userId,
      createdById: userId,
    },
  });

  return {
    id: created.id,
    title: created.title,
    slug: created.slug,
    difficulty: created.difficulty,
    status: created.status,
    isAiGenerated: false,
    ollamaAvailable: false,
    modelName: "fallback-template",
    qualityScore: null,
    qualityBreakdown: null,
    retriesAttempted: 0,
  };
}
