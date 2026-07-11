import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";

import type { RenderServiceConfig } from "../src/config.js";
import { RenderRequestSchema, type RenderJob, type RenderRequest } from "../src/contracts.js";
import { RenderEngine } from "../src/renderer.js";
import { OutputStore } from "../src/storage.js";

test("Playwright renders a long Markdown document into real PNG pages", { timeout: 120_000 }, async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "md2card-render-"));
  const config: RenderServiceConfig = {
    host: "127.0.0.1",
    port: 3000,
    outputDir,
    maxBatchSize: 20,
    maxBodyBytes: 6 * 1024 * 1024,
    concurrency: 1,
    jobTtlMs: 60_000,
    renderTimeoutMs: 60_000,
    allowRemoteImages: false,
  };
  const store = new OutputStore(outputDir);
  await store.init();
  const engine = new RenderEngine(config, store);

  const markdown = [
    "# 浏览器真实渲染测试",
    ...Array.from({ length: 24 }, (_, index) => `## 第 ${index + 1} 节\n这是一段用于验证真实 DOM 自动分页的中文内容。内容必须进入 Chromium，并被截图成实际 PNG 文件。`),
  ].join("\n\n");
  const payload = RenderRequestSchema.parse({
    markdown,
    width: 320,
    height: 320,
    splitMode: "auto",
    outputFormat: "png",
  });
  const now = new Date().toISOString();
  const job: RenderJob<RenderRequest> = {
    id: "render-e2e",
    token: "x",
    kind: "single",
    status: "running",
    payload,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };

  try {
    const result = await engine.renderSingle(job);
    const images = result.files.filter((file) => file.mediaType === "image/png");
    assert.ok(images.length > 1, `expected multiple pages, received ${images.length}`);
    assert.ok(result.archiveFile, "multi-page render should produce a ZIP archive");

    const first = await store.read(job.id, images[0]!.relativePath);
    assert.deepEqual([...first.data.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    const metadata = await sharp(first.data).metadata();
    assert.equal(metadata.width, 640);
    assert.equal(metadata.height, 640);
  } finally {
    await engine.close();
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});
