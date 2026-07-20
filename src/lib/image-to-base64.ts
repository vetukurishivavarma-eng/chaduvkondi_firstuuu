/**
 * Client-side utility: resize an image and convert to a base64 data URL.
 * Avoids writing to disk (serverless-safe) and keeps avatar sizes small.
 *
 * @param file - The image File from an <input type="file">
 * @param maxDimension - Max width/height in px (default 300)
 * @param quality - JPEG/WebP quality 0-1 (default 0.7)
 * @returns A data URL string like "data:image/jpeg;base64,..."
 */
export function imageFileToBase64(
  file: File,
  maxDimension = 300,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      reject(new Error("File must be an image (JPEG, PNG, WebP, or GIF)"));
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Image must be less than 5MB"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const aspect = width / height;
          if (width > height) {
            width = maxDimension;
            height = Math.round(maxDimension / aspect);
          } else {
            height = maxDimension;
            width = Math.round(maxDimension * aspect);
          }
        }

        // Draw resized image on canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64
        const mimeType = file.type === "image/gif" ? "image/webp" : file.type; // Convert GIF to WebP
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
