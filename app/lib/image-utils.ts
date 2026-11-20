export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

const MAX_LONGEST_EDGE = 1800; // PRD: 1600-2400px
const JPEG_QUALITY = 0.83; // PRD: 80-85%
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB before client compression

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode JPEG blob"));
      },
      "image/jpeg",
      quality
    );
  });
}

export function validateImageFile(file: File): "ok" | "invalid_type" | "too_large" {
  const isImage =
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
  if (!isImage) return "invalid_type";
  if (file.size > MAX_FILE_SIZE_BYTES) return "too_large";
  return "ok";
}

/**
 * Compresses an image client-side with EXIF orientation auto-correction
 * (via createImageBitmap imageOrientation: "from-image"), resizes longest side
 * to <= 1800px, and returns JPEG dataUrl + exact natural dimensions to prevent CLS.
 */
export async function compressImageClientSide(
  file: File
): Promise<CompressedImageResult> {
  // Prefer createImageBitmap with EXIF orientation handling (supported in modern Safari & Chrome)
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      const { width, height } = fitWithinMaxEdge(
        bitmap.width,
        bitmap.height,
        MAX_LONGEST_EDGE
      );
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        throw new Error("Canvas context unavailable");
      }
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const blob = await canvasToJpegBlob(canvas, JPEG_QUALITY);
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      return { blob, dataUrl, width, height, sizeBytes: blob.size };
    } catch {
      // Fall through to HTMLImageElement loader
    }
  }

  return compressWithImageElement(file);
}

function compressWithImageElement(file: File): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      try {
        const { width, height } = fitWithinMaxEdge(
          img.naturalWidth || 1200,
          img.naturalHeight || 1600,
          MAX_LONGEST_EDGE
        );
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const blob = await canvasToJpegBlob(canvas, JPEG_QUALITY);
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        URL.revokeObjectURL(url);
        resolve({ blob, dataUrl, width, height, sizeBytes: blob.size });
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image"));
    };
    img.src = url;
  });
}

function fitWithinMaxEdge(
  origWidth: number,
  origHeight: number,
  maxEdge: number
): { width: number; height: number } {
  const longest = Math.max(origWidth, origHeight);
  if (longest <= maxEdge) {
    return { width: origWidth, height: origHeight };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(origWidth * scale)),
    height: Math.max(1, Math.round(origHeight * scale)),
  };
}

export function formatCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
