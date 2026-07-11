# MD2Card Cloudflare MCP Worker

这是 MD2Card 的第一版远程 MCP 网关。它部署在 Cloudflare Workers，使用 Streamable HTTP 暴露 `/mcp`，并把真正的图片渲染请求转发给可替换的渲染后端。

## 当前能力

- `get_capabilities`：返回工具、限制和渲染器连接状态
- `validate_render_request`：只校验并标准化渲染参数
- `render_markdown`：提交单篇 Markdown 渲染
- `batch_render`：提交最多 20 篇 Markdown 批量渲染
- `get_job`：查询异步任务状态和下载地址
- `/health`：公开健康检查
- 可选 Bearer Token 保护 `/mcp`

## 为什么先做网关

现有 Web 版依赖浏览器 DOM 与截图。普通 Cloudflare Worker 不能直接复用这条链路，因此第一阶段先固定 MCP 工具、参数和渲染服务协议。下一阶段可以接入：

1. Cloudflare Browser Rendering；
2. 独立 Playwright 渲染服务；
3. 未来抽离出的 MD2Card Render Core。

未配置渲染后端时，参数校验工具仍可使用；真正渲染工具会明确返回 `renderer_not_configured`，不会伪造成功结果。

## 本地开发

```bash
cd apps/mcp-worker
npm install
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
- `RENDER_API_TOKEN` 是 MCP Worker 调用渲染后端的服务端密钥。
- `MCP_ACCESS_TOKEN` 可选；配置后，访问 `/mcp` 必须携带 `Authorization: Bearer <token>`。
- 生产版最终应升级到 OAuth，而不是长期依赖共享 Token。

## 渲染后端协议

MCP Worker 当前约定渲染服务提供：

```text
POST /v1/render
POST /v1/batch
GET  /v1/jobs/:jobId
```

单篇请求示例：

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

渲染服务应返回 JSON，推荐结构：

```json
{
  "ok": true,
  "jobId": "job_123",
  "status": "queued",
  "resultUrl": null,
  "downloadUrl": null
}
```

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
