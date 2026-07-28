import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import { quickRun } from "@/lib/judge";

// POST /api/judge/run — Quick execute code without test cases
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const { code, language, stdin } = await request.json();

    if (!code || !language) {
      return errorResponse("Code and language are required", 400);
    }

    const result = await quickRun(code, language, stdin || "");

    return successResponse({
      output: result.output,
      error: result.error,
      exitCode: result.exitCode,
      executionTimeMs: result.executionTimeMs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
