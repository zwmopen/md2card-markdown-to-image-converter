# MD2Card Cloudflare MCP Worker

这是 MD2Card 的远程 MCP 网关。它部署在 Cloudflare Workers，使用 Streamable HTTP 暴露 `/mcp`，并把真实图片渲染请求转发给仓库中的 Playwright 渲染后端或其他兼容实现。

## 当前能力

- `get_capabilities`：返回工具、限制和渲染器连接状态
- `validate_render_request`：只校验并标准化渲染参数
- `render_markdown`：提交单篇 Markdown 渲染
- `batch_render`：提交最多 20 篇 Markdown 批量渲染
- `list_jobs`：按状态列出任务摘要并用游标翻页
- `get_job`：查询完整任务状态和文件清单
- `download_result`：为完成任务返回规范化下载结果
- `cancel_job`：取消排队中或运行中的任务
- `retry_job`：重试失败或已取消的任务
- `/health`：公开健康检查
- 可选 Bearer Token 保护 `/mcp`

## 渲染后端

```text
POST /v1/render
POST /v1/batch
GET  /v1/jobs?status=&limit=&cursor=
GET  /v1/jobs/:jobId
GET  /v1/jobs/:jobId/result?prefer=auto|archive|primary
POST /v1/jobs/:jobId/cancel
POST /v1/jobs/:jobId/retry
```

如果未配置渲染服务，参数校验工具仍可使用；需要访问渲染器的工具会明确返回 `renderer_not_configured`。

## 本地联调

```bash
cd apps/render-service
npm install
npx playwright install --with-deps chromium
export RENDER_API_TOKEN=dev
npm run dev
```

```bash
cd apps/mcp-worker
npm install
export RENDER_API_BASE_URL=http://localhost:3000
export RENDER_API_TOKEN=dev
npm run dev
```

MCP 地址：

```text
http://localhost:8787/mcp
```

## 环境变量和密钥

```bash
npx wrangler secret put RENDER_API_BASE_URL
npx wrangler secret put RENDER_API_TOKEN
npx wrangler secret put MCP_ACCESS_TOKEN
```

- `RENDER_API_BASE_URL` 必须使用 HTTPS，localhost 除外。
- `RENDER_API_TOKEN` 必须与渲染服务中的同名变量一致。
- `MCP_ACCESS_TOKEN` 可选；配置后访问 `/mcp` 必须携带 Bearer Token。

## 任务列表

`list_jobs` 输入示例：

```json
{
  "status": "failed",
  "limit": 20
}
```

返回任务摘要按创建时间从新到旧排列，不包含 Markdown 原文。若返回 `nextCursor`，下一次调用原样传回：

```json
{
  "status": "failed",
  "limit": 20,
  "cursor": "上一页返回的 nextCursor"
}
```

支持状态：`queued`、`running`、`completed`、`failed`、`cancelled`。游标是不可解析业务含义的稳定分页令牌；无效游标会返回 `invalid_cursor`。

## 渲染、下载与任务控制

`render_markdown` 或 `batch_render` 会先返回 `jobId`。随后可使用：

- `list_jobs`：找回或筛选任务。
- `get_job`：查看一个任务的完整状态和文件清单。
- `download_result`：选择 ZIP 或主图片。
- `cancel_job`：取消 queued/running。
- `retry_job`：重试 failed/cancelled。

`download_result` 的 `prefer` 支持 `auto`、`archive` 和 `primary`；`auto` 优先 ZIP，没有 ZIP 时返回主图片。

## 校验与部署

```bash
npm run check
npm run deploy
```

部署完成后的 MCP 地址通常是：

```text
https://md2card-mcp.<your-subdomain>.workers.dev/mcp
```
