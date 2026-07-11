import path from "node:path";

function positiveInteger(value: string | undefined, fallback: number, maximum: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, maximum);
}

function booleanValue(value: string | undefined, fallback = false): boolean {
  if (value == null || value.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export interface RenderServiceConfig {
  host: string;
  port: number;
  outputDir: string;
  publicBaseUrl?: string;
  apiToken?: string;
  maxBatchSize: number;
  maxBodyBytes: number;
  concurrency: number;
  jobTtlMs: number;
  renderTimeoutMs: number;
  allowRemoteImages: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): RenderServiceConfig {
  const publicBaseUrl = env.PUBLIC_BASE_URL?.trim();
  if (publicBaseUrl) {
    const url = new URL(publicBaseUrl);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      throw new Error("PUBLIC_BASE_URL must use HTTPS unless it points to localhost");
    }
  }

  return {
    host: env.HOST?.trim() || "0.0.0.0",
    port: positiveInteger(env.PORT, 3000, 65_535),
    outputDir: path.resolve(env.OUTPUT_DIR?.trim() || ".md2card-output"),
    ...(publicBaseUrl ? { publicBaseUrl: publicBaseUrl.replace(/\/$/, "") } : {}),
    ...(env.RENDER_API_TOKEN?.trim() ? { apiToken: env.RENDER_API_TOKEN.trim() } : {}),
    maxBatchSize: positiveInteger(env.MAX_BATCH_SIZE, 20, 100),
    maxBodyBytes: positiveInteger(env.MAX_BODY_BYTES, 6 * 1024 * 1024, 25 * 1024 * 1024),
    concurrency: positiveInteger(env.RENDER_CONCURRENCY, 1, 8),
    jobTtlMs: positiveInteger(env.JOB_TTL_MS, 24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000),
    renderTimeoutMs: positiveInteger(env.RENDER_TIMEOUT_MS, 60_000, 300_000),
    allowRemoteImages: booleanValue(env.ALLOW_REMOTE_IMAGES, false),
  };
}
