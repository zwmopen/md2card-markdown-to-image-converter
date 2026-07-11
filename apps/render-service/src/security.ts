import crypto from "node:crypto";
import path from "node:path";

export function hasValidBearer(authorization: string | undefined, expected?: string): boolean {
  if (!expected) return true;
  if (!authorization?.startsWith("Bearer ")) return false;
  const provided = authorization.slice("Bearer ".length);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

export function sanitizeFilename(value: string | undefined, fallback = "md2card"): string {
  const cleaned = String(value ?? "")
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, "_")
    .replace(/^[_\.]+|[_\.]+$/g, "")
    .slice(0, 100);
  return cleaned || fallback;
}

export function ensurePathInside(root: string, candidate: string): string {
  const absoluteRoot = path.resolve(root);
  const absoluteCandidate = path.resolve(candidate);
  if (absoluteCandidate !== absoluteRoot && !absoluteCandidate.startsWith(`${absoluteRoot}${path.sep}`)) {
    throw new Error("Resolved path escapes the configured output directory");
  }
  return absoluteCandidate;
}

export function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (["localhost", "::1", "0.0.0.0"].includes(normalized)) return true;
  if (/^127\./.test(normalized) || /^10\./.test(normalized) || /^169\.254\./.test(normalized)) return true;
  if (/^192\.168\./.test(normalized)) return true;
  const match = normalized.match(/^172\.(\d+)\./);
  if (match) {
    const second = Number.parseInt(match[1] ?? "0", 10);
    if (second >= 16 && second <= 31) return true;
  }
  return normalized.endsWith(".local") || normalized.endsWith(".internal");
}

export function canLoadRemoteUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (!["https:", "http:"].includes(url.protocol)) return false;
    return !isPrivateHostname(url.hostname);
  } catch {
    return false;
  }
}

export function createDownloadToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}
