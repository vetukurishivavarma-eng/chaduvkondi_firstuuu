import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface HintRequest {
  questionId: string;
  questionText: string;
  choices: { id: string; text: string; isCorrect: boolean }[];
  userAnswerId?: string;
  conceptName?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { questionId, questionText, choices, userAnswerId, conceptName } = await request.json() as HintRequest;

    if (!questionId || !questionText) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Get the correct answer
    const correctChoice = choices.find(c => c.isCorrect);
    const userChoice = choices.find(c => c.id === userAnswerId);

    // Determine if the user got it wrong and what mistakes they made
    const isWrong = userAnswerId && userChoice && !userChoice.isCorrect;

    // Get contextual info from the database
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        concept: {
          include: {
            subDomain: {
              include: { track: true },
            },
          },
        },
        choices: true,
      },
    });

    // Build a smart hint based on the context
    const concept = question?.concept || { name: conceptName || "this concept", description: "" };
    const subDomain = (question?.concept as any)?.subDomain;
    const track = subDomain?.track;

    let hint = "";
    let explanation = question?.explanation || "";
    let relatedResources: { title: string; url: string }[] = [];

    if (isWrong && userChoice) {
      // Generate targeted hint for wrong answers
      hint = generateTargetedHint(questionText, userChoice.text, correctChoice?.text || "", concept.name);
    } else {
      // Generate proactive learning hint
      hint = generateLearningTip(questionText, concept.name);
    }

    // Get related resources for this concept
    if (question?.conceptId) {
      const resources = await prisma.resource.findMany({
        where: { conceptId: question.conceptId },
        select: { title: true, url: true },
        take: 3,
      });
      relatedResources = resources;
    }

    // Get the explanation if available
    if (!explanation && question) {
      explanation = question.explanation;
    }

    return NextResponse.json({
      success: true,
      data: {
        hint,
        explanation,
        relatedResources,
        conceptName: concept.name,
        trackName: track?.name,
        trackIcon: track?.icon,
      },
    });
  } catch (error) {
    console.error("Hint API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

function generateTargetedHint(questionText: string, userAnswer: string, correctAnswer: string, conceptName: string): string {
  const hints = [
    `Great try! The answer "${userAnswer}" is close, but here's a key insight about ${conceptName}: think about the fundamental principle involved. The correct approach is "${correctAnswer}" because it directly addresses what's being asked.`,
    `In ${conceptName}, it's easy to confuse similar-sounding concepts. The key difference here is that "${correctAnswer}" is correct because it handles the specific scenario described in the question. "${userAnswer}" would work in a different context.`,
    `Think about this differently: what's the PRIMARY purpose of this feature in ${conceptName}? "${correctAnswer}" best fulfills that purpose. The option you chose, "${userAnswer}", is a related concept but serves a different role.`,
  ];
  return hints[Math.floor(Math.random() * hints.length)];
}

function generateLearningTip(questionText: string, conceptName: string): string {
  const tips = [
    `💡 Pro Tip: When working with ${conceptName}, try to understand the "why" behind each choice. Ask yourself: "What problem does each option solve?"`,
    `📝 Quick reminder: ${conceptName} is all about understanding the core principles. Break down the question into smaller parts and tackle each one.`,
    `🎯 Strategy: For this type of question about ${conceptName}, eliminate obviously wrong answers first, then compare the remaining options against the key requirements in the question.`,
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}
