import { NextResponse } from "next/server";

export function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: string, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    if (error.message === "Forbidden") {
      return errorResponse("Forbidden", 403);
    }
    return errorResponse(error.message, 400);
  }
  return errorResponse("Internal server error", 500);
}
