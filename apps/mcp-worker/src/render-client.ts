import type {
  BatchRenderRequest,
  CancelJobRequest,
  DownloadResultRequest,
  GetJobRequest,
  ListJobsRequest,
  RenderRequest,
  RendererResponse,
  RetryJobRequest,
} from "./contracts";
import type { Env } from "./env";
import { parsePositiveInteger } from "./env";

export class RendererConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RendererConfigurationError";
  }
}

export class RendererRequestError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "RendererRequestError";
    this.status = status;
    this.details = details;
  }
}

function getRendererBaseUrl(env: Env): URL {
  const raw = env.RENDER_API_BASE_URL?.trim();
  if (!raw) {
    throw new RendererConfigurationError(
      "RENDER_API_BASE_URL is not configured. The MCP gateway is healthy, but image rendering is not connected yet.",
    );
  }

  const url = new URL(raw);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new RendererConfigurationError(
      "RENDER_API_BASE_URL must use HTTPS unless it points to localhost.",
    );
  }
  return url;
}

async function requestRenderer(
  env: Env,
  path: string,
  init: RequestInit,
): Promise<RendererResponse> {
  const baseUrl = getRendererBaseUrl(env);
  const url = new URL(path.replace(/^\//, ""), `${baseUrl.toString().replace(/\/$/, "")}/`);
  const timeoutMs = parsePositiveInteger(env.RENDER_TIMEOUT_MS, 30_000, 120_000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("renderer timeout"), timeoutMs);

  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  headers.set("content-type", "application/json");
  if (env.RENDER_API_TOKEN) {
    headers.set("authorization", `Bearer ${env.RENDER_API_TOKEN}`);
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });
    const text = await response.text();
    let payload: unknown = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text.slice(0, 2_000) };
      }
    }

    if (!response.ok) {
      throw new RendererRequestError(
        `Renderer request failed with HTTP ${response.status}`,
        response.status,
        payload,
      );
    }

    return (payload ?? { ok: true }) as RendererResponse;
  } catch (error) {
    if (error instanceof RendererRequestError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new RendererRequestError("Renderer request timed out", 504);
    }
    throw new RendererRequestError(
      error instanceof Error ? error.message : "Renderer request failed",
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function renderMarkdown(env: Env, input: RenderRequest): Promise<RendererResponse> {
  return requestRenderer(env, "/v1/render", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function batchRender(
  env: Env,
  input: BatchRenderRequest,
): Promise<RendererResponse> {
  return requestRenderer(env, "/v1/batch", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getRenderJob(env: Env, input: GetJobRequest): Promise<RendererResponse> {
  return requestRenderer(env, `/v1/jobs/${encodeURIComponent(input.jobId)}`, {
    method: "GET",
  });
}

export function listRenderJobs(env: Env, input: ListJobsRequest): Promise<RendererResponse> {
  const query = new URLSearchParams({ limit: String(input.limit) });
  if (input.status) query.set("status", input.status);
  if (input.cursor) query.set("cursor", input.cursor);
  return requestRenderer(env, `/v1/jobs?${query.toString()}`, { method: "GET" });
}

export function cancelRenderJob(
  env: Env,
  input: CancelJobRequest,
): Promise<RendererResponse> {
  return requestRenderer(env, `/v1/jobs/${encodeURIComponent(input.jobId)}/cancel`, {
    method: "POST",
  });
}

export function retryRenderJob(
  env: Env,
  input: RetryJobRequest,
): Promise<RendererResponse> {
  return requestRenderer(env, `/v1/jobs/${encodeURIComponent(input.jobId)}/retry`, {
    method: "POST",
  });
}

export function downloadRenderResult(
  env: Env,
  input: DownloadResultRequest,
): Promise<RendererResponse> {
  const query = new URLSearchParams({ prefer: input.prefer });
  return requestRenderer(
    env,
    `/v1/jobs/${encodeURIComponent(input.jobId)}/result?${query.toString()}`,
    { method: "GET" },
  );
}
