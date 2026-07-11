import { createMcpHandler } from "agents/mcp";

import type { Env } from "./env";
import { createMd2CardServer } from "./server";

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function hasValidAccessToken(request: Request, env: Env): boolean {
  const expected = env.MCP_ACCESS_TOKEN;
  if (!expected) return true;

  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return false;
  const provided = authorization.slice("Bearer ".length);
  if (provided.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < provided.length; index += 1) {
    difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health") {
      return jsonResponse({
        ok: true,
        service: "md2card-mcp",
        version: "0.1.0",
        mcpEndpoint: "/mcp",
        rendererConfigured: Boolean(env.RENDER_API_BASE_URL?.trim()),
        accessTokenRequired: Boolean(env.MCP_ACCESS_TOKEN),
      });
    }

    if (url.pathname !== "/mcp") {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "not_found",
            message: "Use /mcp for MCP traffic or /health for service status.",
          },
        },
        404,
      );
    }

    if (!hasValidAccessToken(request, env)) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "unauthorized",
            message: "A valid Bearer token is required for this MCP deployment.",
          },
        },
        401,
      );
    }

    // MCP SDK 1.26+ requires a fresh stateless server for every request.
    const server = createMd2CardServer(env);
    return createMcpHandler(server, { route: "/mcp" })(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
