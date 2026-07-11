import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  BatchRenderRequestSchema,
  CancelJobRequestSchema,
  DEFAULT_MAX_BATCH_SIZE,
  DownloadResultRequestSchema,
  GetJobRequestSchema,
  ListJobsRequestSchema,
  RenderRequestSchema,
  RetryJobRequestSchema,
} from "./contracts";
import type { Env } from "./env";
import { parsePositiveInteger } from "./env";
import {
  batchRender,
  cancelRenderJob,
  downloadRenderResult,
  getRenderJob,
  listRenderJobs,
  RendererConfigurationError,
  RendererRequestError,
  renderMarkdown,
  retryRenderJob,
} from "./render-client";

function jsonToolResult(value: unknown, isError = false) {
  return {
    ...(isError ? { isError: true } : {}),
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function errorToolResult(error: unknown) {
  if (error instanceof RendererConfigurationError) {
    return jsonToolResult({ ok: false, error: { code: "renderer_not_configured", message: error.message } }, true);
  }
  if (error instanceof RendererRequestError) {
    return jsonToolResult({
      ok: false,
      error: {
        code: "renderer_request_failed",
        message: error.message,
        status: error.status,
        details: error.details,
      },
    }, true);
  }
  if (error instanceof z.ZodError) {
    return jsonToolResult({
      ok: false,
      error: { code: "invalid_request", message: "The request is invalid.", issues: error.issues },
    }, true);
  }
  return jsonToolResult({
    ok: false,
    error: {
      code: "internal_error",
      message: error instanceof Error ? error.message : "Unexpected MCP tool error",
    },
  }, true);
}

export function createMd2CardServer(env: Env): McpServer {
  const server = new McpServer({ name: "MD2Card MCP", version: "0.4.0" });

  server.registerTool(
    "get_capabilities",
    {
      description: "Return the MD2Card MCP gateway capabilities, limits, and renderer connection status.",
      inputSchema: {},
    },
    async () => jsonToolResult({
      ok: true,
      service: "md2card-mcp",
      version: "0.4.0",
      transport: "streamable-http",
      rendererConfigured: Boolean(env.RENDER_API_BASE_URL?.trim()),
      maxBatchSize: parsePositiveInteger(
        env.MAX_BATCH_SIZE,
        DEFAULT_MAX_BATCH_SIZE,
        DEFAULT_MAX_BATCH_SIZE,
      ),
      tools: [
        "get_capabilities",
        "validate_render_request",
        "render_markdown",
        "batch_render",
        "list_jobs",
        "get_job",
        "download_result",
        "cancel_job",
        "retry_job",
      ],
      renderContract: {
        single: "POST /v1/render",
        batch: "POST /v1/batch",
        jobs: "GET /v1/jobs?status=&limit=&cursor=",
        job: "GET /v1/jobs/:jobId",
        result: "GET /v1/jobs/:jobId/result?prefer=auto|archive|primary",
        cancel: "POST /v1/jobs/:jobId/cancel",
        retry: "POST /v1/jobs/:jobId/retry",
      },
    }),
  );

  server.registerTool(
    "validate_render_request",
    {
      description: "Validate and normalize Markdown-to-image parameters without starting a render job.",
      inputSchema: RenderRequestSchema.shape,
    },
    async (input) => {
      try {
        return jsonToolResult({ ok: true, request: RenderRequestSchema.parse(input) });
      } catch (error) {
        return errorToolResult(error);
      }
    },
  );

  server.registerTool(
    "render_markdown",
    {
      description: "Render one Markdown document through the configured MD2Card renderer.",
      inputSchema: RenderRequestSchema.shape,
    },
    async (input) => {
      try {
        return jsonToolResult(await renderMarkdown(env, RenderRequestSchema.parse(input)));
      } catch (error) {
        return errorToolResult(error);
      }
    },
  );

  server.registerTool(
    "batch_render",
    {
      description: "Submit multiple Markdown documents as one batch render job.",
      inputSchema: BatchRenderRequestSchema.shape,
    },
    async (input) => {
      try {
        const request = BatchRenderRequestSchema.parse(input);
        const maxBatchSize = parsePositiveInteger(
          env.MAX_BATCH_SIZE,
          DEFAULT_MAX_BATCH_SIZE,
          DEFAULT_MAX_BATCH_SIZE,
        );
        if (request.documents.length > maxBatchSize) {
          return jsonToolResult({
            ok: false,
            error: {
              code: "batch_limit_exceeded",
              message: `This deployment accepts at most ${maxBatchSize} documents per batch.`,
            },
          }, true);
        }
        return jsonToolResult(await batchRender(env, request));
      } catch (error) {
        return errorToolResult(error);
      }
    },
  );

  server.registerTool(
    "list_jobs",
    {
      description:
        "List render job summaries newest first. Optionally filter by status and continue with the returned cursor.",
      inputSchema: ListJobsRequestSchema.shape,
    },
    async (input) => {
      try {
        return jsonToolResult(await listRenderJobs(env, ListJobsRequestSchema.parse(input)));
      } catch (error) {
        return errorToolResult(error);
      }
    },
  );

  server.registerTool(
    "get_job",
    {
      description: "Get the full status and file manifest of one render job.",
      inputSchema: GetJobRequestSchema.shape,
    },
    async (input) => {
      try {
        return jsonToolResult(await getRenderJob(env, GetJobRequestSchema.parse(input)));
      } catch (error) {
        return errorToolResult(error);
      }
    },
  );

  server.registerTool(
    "download_result",
    {
      description:
        "Return one normalized downloadable result for a completed job. Auto prefers ZIP and falls back to the primary image.",
      inputSchema: DownloadResultRequestSchema.shape,
    },
    async (input) => {
      try {
        return jsonToolResult(await downloadRenderResult(env, DownloadResultRequestSchema.parse(input)));
      } catch (error) {
        return errorToolResult(error);
      }
    },
  );

  server.registerTool(
    "cancel_job",
    {
      description: "Cancel a queued or running render job and remove partial output.",
      inputSchema: CancelJobRequestSchema.shape,
    },
    async (input) => {
      try {
        return jsonToolResult(await cancelRenderJob(env, CancelJobRequestSchema.parse(input)));
      } catch (error) {
        return errorToolResult(error);
      }
    },
  );

  server.registerTool(
    "retry_job",
    {
      description: "Retry a failed or cancelled render job and return a new linked job ID.",
      inputSchema: RetryJobRequestSchema.shape,
    },
    async (input) => {
      try {
        return jsonToolResult(await retryRenderJob(env, RetryJobRequestSchema.parse(input)));
      } catch (error) {
        return errorToolResult(error);
      }
    },
  );

  return server;
}
