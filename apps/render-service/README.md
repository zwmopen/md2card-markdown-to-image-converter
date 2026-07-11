# MD2Card Playwright Render Service

真实的 Markdown-to-image 渲染后端。服务使用 Chromium 对固定尺寸卡片执行 DOM 排版和截图，并向 `apps/mcp-worker` 提供已经约定好的渲染协议。

## 当前能力

- `GET /health`
- `POST /v1/render`
- `POST /v1/batch`
- `GET /v1/jobs/:jobId`
- 带随机下载令牌的结果文件地址
- PNG、JPEG、WebP
- 自动分页、横线分页、不分页
- 单篇多页 ZIP
- 多文档批量 ZIP
- 有界内存任务队列
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

任务完成后响应包含：

- `resultUrl`：第一张图片
- `downloadUrl`：多页或批量任务的 ZIP；单页任务则为图片
- `files`：所有结果文件

结果 URL 自带随机下载令牌，不需要再次附加 API Bearer Token。

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

## 配置

| 变量 | 默认值 | 说明 |
|---|---:|---|
| `HOST` | `0.0.0.0` | 监听地址 |
| `PORT` | `3000` | 监听端口 |
| `OUTPUT_DIR` | `.md2card-output` | 图片和 ZIP 目录 |
| `PUBLIC_BASE_URL` | 请求来源 | 对外结果 URL 前缀，生产环境应使用 HTTPS |
| `RENDER_API_TOKEN` | 空 | MCP Worker 调用此服务的 Bearer Token |
| `MAX_BATCH_SIZE` | `20` | 单批最大文档数 |
| `MAX_BODY_BYTES` | `6291456` | 最大 JSON 请求体 |
| `RENDER_CONCURRENCY` | `1` | Chromium 并发任务数 |
| `JOB_TTL_MS` | `86400000` | 任务元数据有效期 |
| `RENDER_TIMEOUT_MS` | `60000` | 单次浏览器渲染超时 |
| `ALLOW_REMOTE_IMAGES` | `false` | 是否允许公共 HTTP/HTTPS 图片 |

任务与结果当前采用内存任务表和本地文件系统。进程重启后任务元数据会丢失，但已经写入磁盘的文件不会自动删除。生产化下一步是把任务状态接入 D1/数据库，把文件接入 R2/对象存储。

## Docker

```bash
docker build -t md2card-renderer apps/render-service
docker run --rm --init --ipc=host \
  -p 3000:3000 \
  -e RENDER_API_TOKEN \
  -v md2card-data:/data/md2card \
  md2card-renderer
```

镜像固定使用与项目依赖一致的 Playwright `1.61.0` Chromium 环境。

## 校验

单元检查：

```bash
npm run check
```

真实浏览器出图检查：

```bash
npx playwright install --with-deps chromium
npm run test:render
```

GitHub Actions 会执行 `npm run check:e2e`，只有 Chromium 真正生成多页 PNG、像素尺寸正确并生成 ZIP 才会通过。

## 已知边界

- 当前任务表尚未持久化。
- 当前本地文件下载令牌不是长期签名 URL。
- `mdxMode` 保留协议兼容，但尚未执行任意 MDX 组件，只会按安全 Markdown/HTML 处理。
- 远程图片即使开启，也只做主机名级私网阻断；高安全生产环境建议通过受控图片代理抓取。
