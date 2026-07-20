import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const { shirtColor, pantsColor, hairColor } = body;

    // Validate colors are valid hex strings
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (shirtColor && !hexColorRegex.test(shirtColor)) {
      return errorResponse("Invalid shirt color format. Use hex (e.g. #3D5A45)", 400);
    }
    if (pantsColor && !hexColorRegex.test(pantsColor)) {
      return errorResponse("Invalid pants color format. Use hex (e.g. #2D4635)", 400);
    }
    if (hairColor && !hexColorRegex.test(hairColor)) {
      return errorResponse("Invalid hair color format. Use hex (e.g. #4A3728)", 400);
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(shirtColor !== undefined && { avatarShirtColor: shirtColor }),
        ...(pantsColor !== undefined && { avatarPantsColor: pantsColor }),
        ...(hairColor !== undefined && { avatarHairColor: hairColor }),
      },
      select: {
        id: true,
        avatarShirtColor: true,
        avatarPantsColor: true,
        avatarHairColor: true,
      },
    });

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}
