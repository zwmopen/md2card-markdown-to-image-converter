# MD2Card Playwright Render Service

真实的 Markdown-to-image 渲染后端。服务使用 Chromium 对固定尺寸卡片执行 DOM 排版和截图，并向 `apps/mcp-worker` 提供已经约定好的渲染协议。

## 当前能力

- `GET /health`
- `POST /v1/render`
- `POST /v1/batch`
- `GET /v1/jobs/:jobId`
- `GET /v1/jobs/:jobId/result`
- `POST /v1/jobs/:jobId/cancel`
- `POST /v1/jobs/:jobId/retry`
- 带随机下载令牌的结果文件地址
- PNG、JPEG、WebP
- 自动分页、横线分页、不分页
- 单篇多页 ZIP
- 多文档批量 ZIP
- 规范化结果选择：`auto`、`archive`、`primary`
- 有界任务队列
- 排队与运行任务取消
- 失败与已取消任务重试
- 任务元数据原子落盘和重启恢复
- 运行中任务在重启后明确标记为 `renderer_restarted`
- 过期任务自动删除元数据和结果目录
- 可配置并发、任务有效期和请求体上限
- 可选 Bearer Token 鉴权
- 默认禁止远程图片，避免渲染器访问内网资源

## 本地运行

需要 Node.js 22 或更高版本。

```bash
cd apps/render-service
npm install
npx playwright install --with-deps chromium
cp env.example .env
npm run dev
```

当前服务直接读取进程环境变量；使用 `.env` 时请由运行环境或进程管理器加载。

健康检查：

```bash
curl http://localhost:3000/health
```

健康响应中的 `durableJobs` 表示本地持久化已启用，`recoveredJobs` 表示本次启动恢复的任务数量，`jobControl` 和 `resultPreferences` 列出任务控制及结果选择能力。

## 提交单篇渲染

先在当前终端设置测试用 Token：

```bash
export RENDER_API_TOKEN=dev
```

```bash
curl -X POST http://localhost:3000/v1/render \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $RENDER_API_TOKEN" \
  -d '{
    "markdown": "# Hello MD2Card\n\n真实 Chromium 渲染。",
    "theme": "xiaohongshu",
    "themeMode": "light",
    "width": 400,
    "height": 533,
    "splitMode": "auto",
    "outputFormat": "png",
    "overHiddenMode": false,
    "mdxMode": false
  }'
```

提交成功返回 `202` 和 `jobId`。随后查询：

```bash
curl http://localhost:3000/v1/jobs/<jobId> \
  -H "authorization: Bearer $RENDER_API_TOKEN"
```

任务完成后响应包含第一张图片、ZIP（如有）和全部文件清单。文件 URL 自带随机下载令牌，不需要再次附加 API Bearer Token。

## 获取规范化下载结果

任务完成后，可以让服务直接选择最合适的下载结果：

```bash
curl "http://localhost:3000/v1/jobs/<jobId>/result?prefer=auto" \
  -H "authorization: Bearer $RENDER_API_TOKEN"
```

`prefer` 支持：

- `auto`：优先 ZIP；没有 ZIP 时返回主图片。
- `archive`：必须返回 ZIP；任务没有 ZIP 时返回 `result_unavailable`。
- `primary`：必须返回主图片。

成功响应包含：

```json
{
  "ok": true,
  "jobId": "任务 ID",
  "status": "completed",
  "preference": "auto",
  "selected": {
    "name": "cards.zip",
    "mediaType": "application/zip",
    "size": 12345,
    "url": "带下载令牌的 URL"
  },
  "primary": {},
  "archive": {},
  "files": []
}
```

稳定错误码：

- `result_not_ready`：任务仍在排队或运行。
- `result_failed`：任务失败。
- `result_cancelled`：任务已取消。
- `result_unavailable`：明确要求的结果类型不存在。

## 批量渲染

```bash
curl -X POST http://localhost:3000/v1/batch \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $RENDER_API_TOKEN" \
  -d '{
    "archiveName": "weekly-content",
    "documents": [
      {"id":"post-1","markdown":"# 第一篇"},
      {"id":"post-2","markdown":"# 第二篇","theme":"dark"}
    ]
  }'
```

## 取消任务

只有 `queued` 和 `running` 状态可以取消：

```bash
curl -X POST http://localhost:3000/v1/jobs/<jobId>/cancel \
  -H "authorization: Bearer $RENDER_API_TOKEN"
```

排队任务会从队列中移除；运行任务会触发 `AbortSignal` 并关闭对应 Chromium 上下文。任务最终状态为 `cancelled`，错误码为 `job_cancelled`，已经产生的部分文件会被清理。

对 `completed`、`failed` 或已经 `cancelled` 的任务再次取消会返回 HTTP `409` 和 `job_not_cancellable`。

## 重试任务

只有 `failed` 或 `cancelled` 状态可以重试：

```bash
curl -X POST http://localhost:3000/v1/jobs/<jobId>/retry \
  -H "authorization: Bearer $RENDER_API_TOKEN"
```

服务会复用原始、已经校验过的请求参数，创建一个全新的任务 ID。新任务响应包含 `retryOf`，原任务不会被覆盖。

## 持久化目录

`OUTPUT_DIR` 同时保存结果文件和任务元数据：

```text
OUTPUT_DIR/
├── .jobs/                 原子 JSON 任务记录，目录权限 0700、文件权限 0600
└── <job-id>/              PNG、JPEG、WebP 和 ZIP 结果
```

任务记录包含原始请求，包括 Markdown 内容。部署时必须把 `OUTPUT_DIR` 放在受保护的持久卷中，不应作为公共静态目录暴露。

服务启动时会恢复尚未过期的完成、失败和已取消任务。上次进程结束时处于 `queued` 或 `running` 的任务会转换为失败状态，错误码为 `renderer_restarted`。

## 配置

| 变量 | 默认值 | 说明 |
|---|---:|---|
| `HOST` | `0.0.0.0` | 监听地址 |
| `PORT` | `3000` | 监听端口 |
| `OUTPUT_DIR` | `.md2card-output` | 任务元数据、图片和 ZIP 目录 |
| `PUBLIC_BASE_URL` | 请求来源 | 对外结果 URL 前缀，生产环境应使用 HTTPS |
| `RENDER_API_TOKEN` | 空 | MCP Worker 调用此服务的 Bearer Token |
| `MAX_BATCH_SIZE` | `20` | 单批最大文档数 |
| `MAX_BODY_BYTES` | `6291456` | 最大 JSON 请求体 |
| `RENDER_CONCURRENCY` | `1` | Chromium 并发任务数 |
| `JOB_TTL_MS` | `86400000` | 任务和结果有效期；过期后自动清理 |
| `RENDER_TIMEOUT_MS` | `60000` | 单次浏览器渲染超时 |
| `ALLOW_REMOTE_IMAGES` | `false` | 是否允许公共 HTTP/HTTPS 图片 |

## Docker

```bash
docker build -t md2card-renderer apps/render-service
docker run --rm --init --ipc=host \
  -p 3000:3000 \
  -e RENDER_API_TOKEN \
  -v md2card-data:/data/md2card \
  md2card-renderer
```

持久卷 `md2card-data` 是恢复任务和下载结果所必需的。镜像固定使用与项目依赖一致的 Playwright `1.61.0` Chromium 环境。

## 校验

```bash
npm run check
npx playwright install --with-deps chromium
npm run test:render
```

GitHub Actions 会执行严格类型检查、结果选择、持久化/恢复、取消/重试状态机测试和真实 Chromium 出图测试。

## 已知边界

- 当前持久化面向单节点本地磁盘；多个渲染实例不能共享同一个任务队列。
- 当前本地文件下载令牌不是长期签名 URL。
- `mdxMode` 保留协议兼容，但尚未执行任意 MDX 组件，只会按安全 Markdown/HTML 处理。
- 远程图片即使开启，也只做主机名级私网阻断；高安全生产环境建议通过受控图片代理抓取。
- 横向扩展阶段仍需把任务状态接入数据库/队列，并把结果接入 R2 或其他对象存储。
