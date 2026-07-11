# MD2Card

Markdown 转知识卡片、小红书图文卡片与批量渲染工具。

## 当前状态

项目已于 2026-07 重新启动，当前按照 **“先复刻、再进化”** 的路线持续开发。

第一轮已经完成可运行 Web 基线：原页面中大量仅展示、未接通的控件已经连接到真实运行时，并通过 GitHub Actions 自动测试。当前版本仍不是线上产品的最终 1:1 复刻；完整差距和实施顺序见 [`docs/PARITY_MATRIX.md`](docs/PARITY_MATRIX.md)。

Cloudflare Remote MCP 网关和真实 Playwright 渲染后端也已经建立。MCP 可以提交、查询、下载、取消和重试单篇或批量任务；渲染服务会启动 Chromium，按真实 DOM 排版生成 PNG、JPEG、WebP 和 ZIP。单节点部署已经支持任务与结果持久化、重启恢复和过期清理；横向扩展仍需数据库、共享队列和对象存储。

## 已实现

### Web 编辑器

- Markdown 实时预览
- 标题、段落、列表、引用、代码等基础语法
- 长文自动分页
- 单个 Markdown 文件导入
- Markdown 文件夹批量导入与自然排序
- 单页与全部卡片预览
- 多种视觉预设
- 字体、比例、主题色、背景色、背景图、透明度、字号、内边距、圆角和尺寸控制
- 当前页 PNG 导出
- 全部卡片 ZIP 批量导出
- 自动命名和按文档分目录
- 直接打开本地 `index.html` 的经典脚本兼容方式

### Remote MCP

- Cloudflare Streamable HTTP MCP 网关
- `get_capabilities`
- `validate_render_request`
- `render_markdown`
- `batch_render`
- `get_job`
- `download_result`
- `cancel_job`
- `retry_job`
- 严格参数契约、健康检查和可选 Bearer Token

### Playwright Render Service

- `GET /health`
- `POST /v1/render`
- `POST /v1/batch`
- `GET /v1/jobs/:jobId`
- `GET /v1/jobs/:jobId/result`
- `POST /v1/jobs/:jobId/cancel`
- `POST /v1/jobs/:jobId/retry`
- Chromium 真实 DOM 排版和截图
- 自动分页、横线分页、不分页
- PNG、JPEG、WebP
- 单篇多页 ZIP 和多文档批量 ZIP
- `auto`、`archive`、`primary` 规范化结果选择
- 有界任务队列、运行中任务中止、失败/取消任务重试
- 原子任务元数据持久化、重启恢复和过期结果清理
- 下载令牌、路径穿越防护和默认远程资源阻断
- Docker 镜像和持久卷支持
- 真实 Chromium 出图回归测试

## Web 版直接使用

下载或克隆仓库后，直接用浏览器打开：

```text
index.html
```

页面依赖 CDN 加载 Markdown 解析、截图和 ZIP 库，因此直接打开本地文件时仍需要网络。后续会补齐可选的完全离线构建版本。

## 本地验证

Web 基线需要 Node.js 20 或更高版本：

```bash
npm run verify
```

MCP Worker：

```bash
cd apps/mcp-worker
npm install
npm run check
```

真实渲染服务需要 Node.js 22、Chromium 和 Playwright 系统依赖：

```bash
cd apps/render-service
npm install
npx playwright install --with-deps chromium
npm run check:e2e
```

详细运行、持久化目录、结果选择、任务控制、Docker 和 API 示例见 [`apps/render-service/README.md`](apps/render-service/README.md)。

## 连接 MCP 与渲染服务

渲染服务提供：

```text
POST /v1/render
POST /v1/batch
GET  /v1/jobs/:jobId
GET  /v1/jobs/:jobId/result?prefer=auto|archive|primary
POST /v1/jobs/:jobId/cancel
POST /v1/jobs/:jobId/retry
```

部署渲染服务后，在 MCP Worker 中配置：

```text
RENDER_API_BASE_URL=https://你的渲染服务地址
RENDER_API_TOKEN=两端一致的服务端令牌
```

MCP Worker 会把 `render_markdown`、`batch_render`、`get_job`、`download_result`、`cancel_job` 和 `retry_job` 转发到真实渲染服务。

## 产品路线

### Phase 1：当前产品等价复刻

- 当前官网信息架构与主要交互对齐
- 官方主题 ID、模式和视觉结果对齐
- 表格、数学公式、Mermaid、MDX、图片尺寸和分栏
- 主题商店、贴纸、偏好保存和暗色模式
- 视频录制与导出
- API 与微信公众号转换能力
- 浏览器端功能测试与视觉回归

### Phase 2：生产级批量产品

- 多实例共享数据库与分布式任务队列
- R2/对象存储结果归档和签名下载
- 失败明细、幂等键和任务优先级
- 多尺寸、多平台批量导出
- 品牌模板和主题 SDK
- Web、CLI、API 共用同一渲染内核

### Phase 3：生产级 MCP

- OAuth
- 用户级额度与调用日志
- 本地、Docker 和远程 HTTP 多种部署方式

## 技术结构

```text
index.html                 页面和现有信息架构
style.css                  主界面样式
script.js                  兼容本地文件打开的脚本加载器
src/core.js                分页、命名、文件排序等纯逻辑
src/presets.js             视觉预设
src/styles.js              运行时补充样式
src/app.js                 编辑器、预览、导入和导出控制器
apps/mcp-worker/           Cloudflare Remote MCP 网关和任务控制工具
apps/render-service/       Playwright Chromium 渲染、持久任务和结果服务
tests/                     Web 基线回归测试
docs/                      产品研究与复刻矩阵
```

## 原则

先理解并验证成熟产品的功能、参数语义和交互，再抽离独立渲染内核。复刻阶段不直接带入第三方密钥、用户数据、受限素材或无法确认授权的商业字体；最终产品使用独立品牌和可替换主题资产。
