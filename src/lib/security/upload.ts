import { UPLOAD_LIMITS } from "@/lib/constants";
import { sanitizeFileName } from "./sanitize";

export type UploadKind = keyof typeof UPLOAD_LIMITS;
export type UploadValidation = { valid: true } | { valid: false; error: string };

export function getFileExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() ?? "" : "";
}

/**
 * Validate MIME type, extension and size before the file is sent to
 * Supabase Storage. The bucket policy is the second line of defence.
 */
export function validateUpload(file: File, kind: UploadKind): UploadValidation {
  const limits = UPLOAD_LIMITS[kind];
  const extension = getFileExtension(file.name);

  if (!extension || !(limits.extensions as readonly string[]).includes(extension)) {
    return {
      valid: false,
      error: `Ekstensi .${extension || "?"} tidak diizinkan. Gunakan ${limits.label}.`,
    };
  }

  if (!file.type || !(limits.mimeTypes as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: `Tipe file tidak dikenali. Gunakan ${limits.label}.`,
    };
  }

  if (file.size > limits.maxBytes) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal ${Math.round(
        limits.maxBytes / (1024 * 1024),
      )}MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "File kosong atau rusak." };
  }

  // A double extension such as invoice.pdf.exe is always suspicious.
  const segments = file.name.toLowerCase().split(".");
  if (segments.length > 2) {
    const dangerous = ["exe", "bat", "cmd", "sh", "js", "html", "htm", "php", "svg"];
    if (segments.some((segment) => dangerous.includes(segment))) {
      return { valid: false, error: "Nama file mengandung ekstensi berbahaya." };
    }
  }

  return { valid: true };
}

export function buildStoragePath(
  userId: string,
  folder: string,
  fileName: string,
): string {
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "");
  const safeName = sanitizeFileName(fileName).replace(/\s+/g, "-");
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${userId}/${safeFolder}/${unique}-${safeName}`;
}

export function validateImageUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
