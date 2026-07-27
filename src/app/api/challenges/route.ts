import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/challenges — List all challenges with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");
    const language = searchParams.get("language");
    const trackId = searchParams.get("trackId");

    const where: any = { isActive: true };
    if (difficulty) where.difficulty = difficulty;
    if (language) where.language = language;
    if (trackId) where.concept = { subDomain: { trackId } };

    const challenges = await prisma.codeChallenge.findMany({
      where,
      include: {
        concept: {
          include: {
            subDomain: {
              include: { track: { select: { id: true, name: true, icon: true, color: true } } },
            },
          },
        },
        _count: { select: { submissions: true } },
      },
      orderBy: [{ difficulty: "asc" }, { order: "asc" }],
    });

    // Get user's own submission status for each challenge
    const userId = session.id;
    const userSubmissions = await prisma.challengeSubmission.findMany({
      where: { userId },
      select: { challengeId: true, passed: true, score: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const latestByChallenge = new Map<string, typeof userSubmissions[0]>();
    for (const sub of userSubmissions) {
      if (!latestByChallenge.has(sub.challengeId)) {
        latestByChallenge.set(sub.challengeId, sub);
      }
    }

    const formatted = challenges.map((ch) => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      difficulty: ch.difficulty,
      language: ch.language,
      order: ch.order,
      templateCode: ch.templateCode,
      trackName: ch.concept.subDomain.track.name,
      trackIcon: ch.concept.subDomain.track.icon,
      trackColor: ch.concept.subDomain.track.color,
      conceptName: ch.concept.name,
      totalSubmissions: ch._count.submissions,
      userSubmission: latestByChallenge.get(ch.id) || null,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Challenges list error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/challenges — Submit a solution for evaluation
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { challengeId, code } = await request.json();
    if (!challengeId || !code) {
      return NextResponse.json({ success: false, error: "Challenge ID and code are required" }, { status: 400 });
    }

    const challenge = await prisma.codeChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
    }

    const requestOrigin = request.nextUrl.origin;

    // Evaluate the solution by running it against test cases via the playground API
    const testCases = JSON.parse(challenge.testCases || "[]") as Array<{
      input: string;
      expected: string;
      description?: string;
    }>;

    if (testCases.length === 0) {
      // No test cases — just check syntax via playground
      const syntaxResult = await evaluateCode(challenge.language, code, requestOrigin);
      if (syntaxResult.error) {
        return NextResponse.json({
          success: true,
          data: {
            passed: false,
            score: 0,
            testsPassed: 0,
            totalTests: 0,
            results: [{ name: "Syntax Check", passed: false, error: syntaxResult.error }],
            executionTimeMs: syntaxResult.executionTimeMs,
          },
        });
      }

      // Record submission
      await prisma.challengeSubmission.create({
        data: {
          userId: session.id,
          challengeId,
          code,
          passed: true,
          score: 100,
          executionTimeMs: syntaxResult.executionTimeMs,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          passed: true,
          score: 100,
          testsPassed: 0,
          totalTests: 0,
          results: [{ name: "Code Executed", passed: true, output: syntaxResult.output }],
          executionTimeMs: syntaxResult.executionTimeMs,
        },
      });
    }

    // Run each test case
    const results: Array<{ name: string; passed: boolean; input: string; expected: string; actual: string; error?: string }> = [];
    let testsPassed = 0;
    let totalExecutionTime = 0;

    for (const tc of testCases) {
      const testCode = wrapWithTestCase(challenge.language, challenge.templateCode, code, tc);
      const result = await evaluateCode(challenge.language, testCode, requestOrigin);
      totalExecutionTime += result.executionTimeMs;

      const actualOutput = result.output?.trim() || "";
      const expectedOutput = tc.expected.trim();
      const passed = actualOutput === expectedOutput && !result.error;

      if (passed) testsPassed++;

      results.push({
        name: tc.description || `Test Case`,
        passed,
        input: tc.input,
        expected: expectedOutput,
        actual: actualOutput,
        error: result.error || (passed ? undefined : "Output mismatch"),
      });
    }

    const allPassed = testsPassed === testCases.length;
    const score = Math.round((testsPassed / testCases.length) * 100);

    // Record submission
    await prisma.challengeSubmission.create({
      data: {
        userId: session.id,
        challengeId,
        code,
        passed: allPassed,
        score,
        executionTimeMs: totalExecutionTime,
      },
    });

    // Update mastery score for the concept if passed
    if (allPassed) {
      const existingMastery = await prisma.masteryScore.findUnique({
        where: {
          userId_conceptId: {
            userId: session.id,
            conceptId: challenge.conceptId,
          },
        },
      });

      if (existingMastery) {
        await prisma.masteryScore.update({
          where: { id: existingMastery.id },
          data: {
            score: Math.min(100, existingMastery.score + 10),
            attempts: existingMastery.attempts + 1,
            correctCount: existingMastery.correctCount + 1,
            lastTestedAt: new Date(),
          },
        });
      } else {
        await prisma.masteryScore.create({
          data: {
            userId: session.id,
            conceptId: challenge.conceptId,
            score: 85,
            attempts: 1,
            correctCount: 1,
            lastTestedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        passed: allPassed,
        score,
        testsPassed,
        totalTests: testCases.length,
        results,
        executionTimeMs: totalExecutionTime,
      },
    });
  } catch (error) {
    console.error("Challenge submit error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function evaluateCode(
  language: string,
  code: string,
  origin: string
): Promise<{ output: string; error: string | null; executionTimeMs: number }> {
  const startTime = performance.now();

  try {
    const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/playground`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language }),
    });

    const data = await res.json();
    const endTime = performance.now();

    if (data.success) {
      return {
        output: data.data.output || "",
        error: data.data.stderr || null,
        executionTimeMs: Math.round(endTime - startTime),
      };
    }

    return {
      output: "",
      error: data.error || "Execution failed",
      executionTimeMs: Math.round(endTime - startTime),
    };
  } catch (err: any) {
    return {
      output: "",
      error: err.message || "Network error",
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }
}

function wrapWithTestCase(
  language: string,
  templateCode: string,
  userCode: string,
  testCase: { input: string; expected: string }
): string {
  // Extract function name from template (assumes first function defined)
  const funcMatch = templateCode.match(/(?:def|function|fn|fun)\s+(\w+)/);
  const funcName = funcMatch ? funcMatch[1] : "solution";

  switch (language) {
    case "python":
      return `${userCode}\n\n# Test runner\nresult = ${funcName}(${testCase.input})\nprint(result)`;

    case "javascript":
    case "typescript":
      return `${userCode}\n\n// Test runner\nconst result = ${funcName}(${testCase.input});\nconsole.log(result);`;

    case "java":
      return `${userCode}\n\n// Test runner\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println(${funcName}(${testCase.input}));\n  }\n}`;

    case "rust":
      return `${userCode}\n\n// Test runner\nfn main() {\n  println!("{}", ${funcName}(${testCase.input}));\n}`;

    case "go":
      return `${userCode}\n\n// Test runner\nfunc main() {\n  fmt.Println(${funcName}(${testCase.input}))\n}`;

    default:
      return userCode;
  }
}
