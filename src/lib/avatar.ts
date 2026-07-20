import { unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

/**
 * Delete a locally-uploaded avatar file from disk.
 * Only deletes files under /uploads/avatars/ (not external URLs).
 * Silently ignores missing files or permission errors.
 */
export async function deleteLocalAvatarFile(avatarUrl: string | null) {
  if (!avatarUrl || !avatarUrl.startsWith("/uploads/avatars/")) return;
  const filename = avatarUrl.replace("/uploads/avatars/", "");
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    await unlink(filePath);
  } catch {
    // File doesn't exist or can't be deleted – not a fatal error
  }
}
