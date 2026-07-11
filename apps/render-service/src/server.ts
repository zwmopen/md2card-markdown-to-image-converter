import http, { type IncomingMessage, type ServerResponse } from "node:http";

import { z } from "zod";

import type { RenderServiceConfig } from "./config.js";
import {
  BatchRenderRequestSchema,
  ListJobsRequestSchema,
  RenderRequestSchema,
  ResultPreferenceSchema,
  type BatchRenderRequest,
  type RenderJob,
  type RenderRequest,
  type RenderedFile,
} from "./contracts.js";
import { FileJobStore } from "./job-store.js";
import { InvalidJobCursorError, paginateJobs } from "./job-list.js";
import { JobManager } from "./jobs.js";
import { RenderEngine } from "./renderer.js";
import { ResultSelectionError, selectJobResult } from "./result-selector.js";
import { hasValidBearer } from "./security.js";
import { OutputStore } from "./storage.js";

class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

function setSecurityHeaders(response: ServerResponse): void {
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("x-frame-options", "DENY");
  response.setHeader("referrer-policy", "no-referrer");
}

function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  setSecurityHeaders(response);
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function readJson(request: IncomingMessage, maximumBytes: number): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maximumBytes) throw new HttpError(413, "request_too_large", "Request body is too large");
    chunks.push(buffer);
  }
  if (!chunks.length) throw new HttpError(400, "empty_body", "A JSON request body is required");
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "invalid_json", "Request body must be valid JSON");
  }
}

function requestUrl(request: IncomingMessage): URL {
  const host = request.headers.host || "localhost";
  const protocol = request.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return new URL(request.url || "/", `${protocol}://${host}`);
}

function baseUrl(config: RenderServiceConfig, request: IncomingMessage): string {
  if (config.publicBaseUrl) return config.publicBaseUrl;
  const url = requestUrl(request);
  return `${url.protocol}//${url.host}`;
}

function fileUrl(base: string, job: RenderJob, relativePath: string): string {
  const encodedPath = relativePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/v1/jobs/${encodeURIComponent(job.id)}/files/${encodedPath}?token=${encodeURIComponent(job.token)}`;
}

function publicFile(base: string, job: RenderJob, file: RenderedFile) {
  return {
    name: file.name,
    mediaType: file.mediaType,
    size: file.size,
    url: fileUrl(base, job, file.relativePath),
  };
}

function publicJob(job: RenderJob, base: string): Record<string, unknown> {
  const files = job.result?.files.map((file) => publicFile(base, job, file)) ?? [];
  const primary = job.result?.primaryFile;
  const archive = job.result?.archiveFile;
  return {
    ok: !["failed", "cancelled"].includes(job.status),
    jobId: job.id,
    kind: job.kind,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    expiresAt: job.expiresAt,
    ...(job.retryOf ? { retryOf: job.retryOf } : {}),
    statusUrl: `${base}/v1/jobs/${encodeURIComponent(job.id)}`,
    resultUrl: primary ? fileUrl(base, job, primary.relativePath) : null,
    downloadUrl: archive
      ? fileUrl(base, job, archive.relativePath)
      : primary
        ? fileUrl(base, job, primary.relativePath)
        : null,
    files,
    ...(job.error ? { error: job.error } : {}),
  };
}

function publicJobSummary(job: RenderJob, base: string): Record<string, unknown> {
  const primary = job.result?.primaryFile;
  const archive = job.result?.archiveFile;
  return {
    jobId: job.id,
    kind: job.kind,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    expiresAt: job.expiresAt,
    ...(job.retryOf ? { retryOf: job.retryOf } : {}),
    statusUrl: `${base}/v1/jobs/${encodeURIComponent(job.id)}`,
    resultManifestUrl: `${base}/v1/jobs/${encodeURIComponent(job.id)}/result`,
    resultUrl: primary ? fileUrl(base, job, primary.relativePath) : null,
    downloadUrl: archive
      ? fileUrl(base, job, archive.relativePath)
      : primary
        ? fileUrl(base, job, primary.relativePath)
        : null,
    fileCount: job.result?.files.length ?? 0,
    ...(job.error ? { error: job.error } : {}),
  };
}

function publicResult(job: RenderJob, base: string, preference: "auto" | "archive" | "primary") {
  const selection = selectJobResult(job, preference);
  return {
    ok: true,
    jobId: job.id,
    status: job.status,
    expiresAt: job.expiresAt,
    ...(job.retryOf ? { retryOf: job.retryOf } : {}),
    preference: selection.preference,
    selected: publicFile(base, job, selection.selected),
    primary: selection.primaryFile ? publicFile(base, job, selection.primaryFile) : null,
    archive: selection.archiveFile ? publicFile(base, job, selection.archiveFile) : null,
    files: selection.files.map((file) => publicFile(base, job, file)),
  };
}

function requireApiAuth(request: IncomingMessage, config: RenderServiceConfig): void {
  const authorization = Array.isArray(request.headers.authorization)
    ? request.headers.authorization[0]
    : request.headers.authorization;
  if (!hasValidBearer(authorization, config.apiToken)) {
    throw new HttpError(401, "unauthorized", "A valid Bearer token is required");
  }
}

function sendError(response: ServerResponse, error: unknown): void {
  if (error instanceof InvalidJobCursorError) {
    sendJson(response, error.status, {
      ok: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }
  if (error instanceof ResultSelectionError) {
    sendJson(response, error.status, {
      ok: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }
  if (error instanceof HttpError) {
    sendJson(response, error.status, {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }
  if (error instanceof z.ZodError) {
    sendJson(response, 400, {
      ok: false,
      error: {
        code: "invalid_request",
        message: "The request is invalid",
        issues: error.issues,
      },
    });
    return;
  }
  console.error(error);
  sendJson(response, 500, {
    ok: false,
    error: {
      code: "internal_error",
      message: error instanceof Error ? error.message : "Unexpected server error",
    },
  });
}

export interface RenderService {
  server: http.Server;
  jobs: JobManager;
  engine: RenderEngine;
  close(): Promise<void>;
}

export async function createRenderService(config: RenderServiceConfig): Promise<RenderService> {
  const store = new OutputStore(config.outputDir);
  await store.init();
  const jobStore = new FileJobStore(config.outputDir);
  const jobs = new JobManager(
    config.concurrency,
    config.jobTtlMs,
    jobStore,
    (jobId) => store.removeJob(jobId),
  );
  const recoveredJobs = await jobs.initialize();
  const engine = new RenderEngine(config, store);

  const server = http.createServer(async (request, response) => {
    try {
      const url = requestUrl(request);
      const method = request.method || "GET";

      if (method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
        sendJson(response, 200, {
          ok: true,
          service: "md2card-render-service",
          version: "0.5.0",
          renderer: "playwright-chromium",
          durableJobs: true,
          jobControl: ["cancel", "retry"],
          jobListing: { maxLimit: 100, cursorPagination: true },
          resultPreferences: ResultPreferenceSchema.options,
          recoveredJobs,
          maxBatchSize: config.maxBatchSize,
          remoteImagesAllowed: config.allowRemoteImages,
          queue: jobs.stats(),
        });
        return;
      }

      if (method === "GET") {
        const fileMatch = url.pathname.match(/^\/v1\/jobs\/([^/]+)\/files\/(.+)$/);
        if (fileMatch) {
          const jobId = decodeURIComponent(fileMatch[1] || "");
          const relativePath = fileMatch[2]?.split("/").map(decodeURIComponent).join("/") || "";
          const job = jobs.get(jobId);
          if (!job) throw new HttpError(404, "job_not_found", "Render job was not found");
          if (!hasValidBearer(`Bearer ${url.searchParams.get("token") || ""}`, job.token)) {
            throw new HttpError(401, "invalid_download_token", "The download token is invalid");
          }
          if (!job.result?.files.some((file) => file.relativePath === relativePath)) {
            throw new HttpError(404, "file_not_found", "Rendered file was not found");
          }
          const file = await store.read(jobId, relativePath);
          setSecurityHeaders(response);
          response.statusCode = 200;
          response.setHeader("content-type", file.mediaType);
          response.setHeader("content-length", String(file.data.length));
          response.setHeader("content-disposition", `attachment; filename*=UTF-8''${encodeURIComponent(relativePath.split("/").at(-1) || "result")}`);
          response.end(file.data);
          return;
        }
      }

      if (!url.pathname.startsWith("/v1/")) {
        throw new HttpError(404, "not_found", "Unknown endpoint");
      }
      requireApiAuth(request, config);
      const publicOrigin = baseUrl(config, request);

      if (method === "POST" && url.pathname === "/v1/render") {
        const payload = RenderRequestSchema.parse(await readJson(request, config.maxBodyBytes));
        const job = await jobs.enqueue<RenderRequest>(
          "single",
          payload,
          (item, signal) => engine.renderSingle(item, signal),
        );
        sendJson(response, 202, publicJob(job, publicOrigin));
        return;
      }

      if (method === "POST" && url.pathname === "/v1/batch") {
        const payload = BatchRenderRequestSchema.parse(await readJson(request, config.maxBodyBytes));
        if (payload.documents.length > config.maxBatchSize) {
          throw new HttpError(
            400,
            "batch_limit_exceeded",
            `This deployment accepts at most ${config.maxBatchSize} documents per batch`,
          );
        }
        const job = await jobs.enqueue<BatchRenderRequest>(
          "batch",
          payload,
          (item, signal) => engine.renderBatch(item, signal),
        );
        sendJson(response, 202, publicJob(job, publicOrigin));
        return;
      }

      if (method === "POST") {
        const actionMatch = url.pathname.match(/^\/v1\/jobs\/([^/]+)\/(cancel|retry)$/);
        if (actionMatch) {
          const jobId = decodeURIComponent(actionMatch[1] || "");
          const action = actionMatch[2];
          const original = jobs.get(jobId);
          if (!original) throw new HttpError(404, "job_not_found", "Render job was not found");

          if (action === "cancel") {
            const result = await jobs.cancel(jobId);
            if (!result.cancelled || !result.job) {
              throw new HttpError(
                409,
                "job_not_cancellable",
                `A job in ${original.status} status cannot be cancelled`,
              );
            }
            sendJson(response, 200, {
              ...publicJob(result.job, publicOrigin),
              ok: true,
              action: "cancelled",
            });
            return;
          }

          if (!["failed", "cancelled"].includes(original.status)) {
            throw new HttpError(
              409,
              "job_not_retryable",
              `A job in ${original.status} status cannot be retried`,
            );
          }

          if (original.kind === "single") {
            const payload = RenderRequestSchema.parse(original.payload);
            const retry = await jobs.enqueue<RenderRequest>(
              "single",
              payload,
              (item, signal) => engine.renderSingle(item, signal),
              { retryOf: original.id },
            );
            sendJson(response, 202, publicJob(retry, publicOrigin));
            return;
          }

          const payload = BatchRenderRequestSchema.parse(original.payload);
          if (payload.documents.length > config.maxBatchSize) {
            throw new HttpError(
              400,
              "batch_limit_exceeded",
              `This deployment accepts at most ${config.maxBatchSize} documents per batch`,
            );
          }
          const retry = await jobs.enqueue<BatchRenderRequest>(
            "batch",
            payload,
            (item, signal) => engine.renderBatch(item, signal),
            { retryOf: original.id },
          );
          sendJson(response, 202, publicJob(retry, publicOrigin));
          return;
        }
      }

      if (method === "GET") {
        if (url.pathname === "/v1/jobs") {
          const rawStatus = url.searchParams.get("status");
          const rawLimit = url.searchParams.get("limit");
          const rawCursor = url.searchParams.get("cursor");
          const listRequest = ListJobsRequestSchema.parse({
            ...(rawStatus ? { status: rawStatus } : {}),
            ...(rawLimit ? { limit: rawLimit } : {}),
            ...(rawCursor ? { cursor: rawCursor } : {}),
          });
          const page = paginateJobs(jobs.values(), listRequest);
          sendJson(response, 200, {
            ok: true,
            status: listRequest.status ?? null,
            limit: listRequest.limit,
            items: page.items.map((job) => publicJobSummary(job, publicOrigin)),
            nextCursor: page.nextCursor,
          });
          return;
        }

        const resultMatch = url.pathname.match(/^\/v1\/jobs\/([^/]+)\/result$/);
        if (resultMatch) {
          const job = jobs.get(decodeURIComponent(resultMatch[1] || ""));
          if (!job) throw new HttpError(404, "job_not_found", "Render job was not found");
          const preference = ResultPreferenceSchema.parse(url.searchParams.get("prefer") || "auto");
          sendJson(response, 200, publicResult(job, publicOrigin, preference));
          return;
        }

        const jobMatch = url.pathname.match(/^\/v1\/jobs\/([^/]+)$/);
        if (jobMatch) {
          const job = jobs.get(decodeURIComponent(jobMatch[1] || ""));
          if (!job) throw new HttpError(404, "job_not_found", "Render job was not found");
          sendJson(response, 200, publicJob(job, publicOrigin));
          return;
        }
      }

      throw new HttpError(404, "not_found", "Unknown renderer endpoint");
    } catch (error) {
      sendError(response, error);
    }
  });

  server.on("clientError", (_error, socket) => {
    socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
  });

  return {
    server,
    jobs,
    engine,
    async close() {
      jobs.close();
      await engine.close();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    },
  };
}
