# Render Job API

## 列出任务

```http
GET /v1/jobs?status=completed&limit=20&cursor=<opaque>
Authorization: Bearer <RENDER_API_TOKEN>
```

查询参数：

- `status`：可选，`queued`、`running`、`completed`、`failed`、`cancelled`。
- `limit`：1–100，默认 20。
- `cursor`：可选，上一页返回的 `nextCursor`，必须原样传回。

响应示例：

```json
{
  "ok": true,
  "status": "completed",
  "limit": 20,
  "items": [
    {
      "jobId": "...",
      "kind": "single",
      "status": "completed",
      "createdAt": "2026-07-11T00:00:00.000Z",
      "updatedAt": "2026-07-11T00:00:02.000Z",
      "expiresAt": "2026-07-12T00:00:00.000Z",
      "statusUrl": "...",
      "resultManifestUrl": "...",
      "resultUrl": "...",
      "downloadUrl": "...",
      "fileCount": 1
    }
  ],
  "nextCursor": null
}
```

## 排序和分页保证

任务按 `createdAt` 从新到旧排序，同一时间戳使用任务 ID 作为稳定次级排序键。分页采用 keyset cursor，而不是 offset：在翻页期间插入新任务，不会使下一页重复已经返回的任务。

游标是内部编码的排序位置，不是任务 ID，也不应被修改或长期持久化。无效游标返回 HTTP 400：

```json
{
  "ok": false,
  "error": {
    "code": "invalid_cursor",
    "message": "The job list cursor is invalid"
  }
}
```

## 隐私边界

任务列表只返回摘要，不返回原始 `payload`，因此不会在列表接口中回显 Markdown 内容。需要查看一个任务的完整状态与文件清单时，使用：

```http
GET /v1/jobs/:jobId
```

渲染服务的持久化任务文件仍包含原始请求，`OUTPUT_DIR/.jobs` 必须位于受保护的持久卷中。
