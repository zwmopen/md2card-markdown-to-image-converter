# MD2Card Cloudflare MCP Worker

这是 MD2Card 的远程 MCP 网关。它部署在 Cloudflare Workers，使用 Streamable HTTP 暴露 `/mcp`，并把真实图片渲染请求转发给仓库中的 Playwright 渲染后端或其他兼容实现。

## 当前能力

- `get_capabilities`：返回工具、限制和渲染器连接状态
- `validate_render_request`：只校验并标准化渲染参数
- `render_markdown`：提交单篇 Markdown 渲染
- `batch_render`：提交最多 20 篇 Markdown 批量渲染
- `get_job`：查询异步任务状态和下载地址
- `/health`：公开健康检查
- 可选 Bearer Token 保护 `/mcp`

## 渲染后端

普通 Cloudflare Worker 不能直接运行完整 Playwright Chromium，因此 MCP Worker 负责鉴权、参数校验和转发，真实渲染由 [`../render-service`](../render-service) 完成。

渲染服务已经实现：

```text
POST /v1/render
POST /v1/batch
GET  /v1/jobs/:jobId
```

如果未配置渲染服务，参数校验工具仍可使用；真正渲染工具会明确返回 `renderer_not_configured`，不会伪造图片结果。

## 本地联调

先启动渲染服务：

```bash
cd apps/render-service
npm install
npx playwright install --with-deps chromium
export RENDER_API_TOKEN=dev
npm run dev
```

再启动 MCP Worker：

```bash
cd apps/mcp-worker
npm install
export RENDER_API_BASE_URL=http://localhost:3000
export RENDER_API_TOKEN=dev
npm run dev
```

健康检查：

```text
http://localhost:8787/health
```

MCP 地址：

```text
http://localhost:8787/mcp
```

使用 MCP Inspector 测试：

```bash
npx @modelcontextprotocol/inspector@latest
```

## 环境变量和密钥

普通变量在 `wrangler.jsonc` 中配置：

- `MAX_BATCH_SIZE`：批量上限，当前最多 20
- `RENDER_TIMEOUT_MS`：调用渲染服务的超时时间

部署前配置：

```bash
npx wrangler secret put RENDER_API_BASE_URL
npx wrangler secret put RENDER_API_TOKEN
npx wrangler secret put MCP_ACCESS_TOKEN
```

说明：

- `RENDER_API_BASE_URL` 必须使用 HTTPS，localhost 除外。
- `RENDER_API_TOKEN` 必须与渲染服务中的同名变量一致。
- `MCP_ACCESS_TOKEN` 可选；配置后，访问 `/mcp` 必须携带 `Authorization: Bearer <token>`。
- 渲染服务的运行、Docker 和安全边界见 [`../render-service/README.md`](../render-service/README.md)。
- 生产版最终应升级到 OAuth，而不是长期依赖共享 Token。

## 单篇请求参数

```json
{
  "markdown": "# Hello MD2Card",
  "title": "hello",
  "theme": "xiaohongshu",
  "themeMode": "light",
  "width": 400,
  "height": 533,
  "splitMode": "auto",
  "outputFormat": "png",
  "overHiddenMode": false,
  "mdxMode": false
}
```

渲染服务会先返回异步任务：

```json
{
  "ok": true,
  "jobId": "任务 ID",
  "status": "queued",
  "resultUrl": null,
  "downloadUrl": null
}
```

随后通过 `get_job` 查询，完成后可获得图片或 ZIP 下载地址。

## 校验

```bash
npm run check
```

该命令会生成 Workers 类型、执行 TypeScript 严格检查，并运行 Wrangler dry-run 构建。

## 部署

```bash
npm run deploy
```

部署完成后 MCP 地址通常是：

```text
https://md2card-mcp.<your-subdomain>.workers.dev/mcp
```
