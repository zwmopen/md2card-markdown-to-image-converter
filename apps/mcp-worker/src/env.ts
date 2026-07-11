export interface Env {
  RENDER_API_BASE_URL?: string;
  RENDER_API_TOKEN?: string;
  MCP_ACCESS_TOKEN?: string;
  MAX_BATCH_SIZE?: string;
  RENDER_TIMEOUT_MS?: string;
}

export function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  maximum: number,
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, maximum);
}
