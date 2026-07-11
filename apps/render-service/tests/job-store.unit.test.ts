import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { RenderJob } from "../src/contracts.js";
import { FileJobStore } from "../src/job-store.js";
import { JobManager } from "../src/jobs.js";

async function temporaryDirectory(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "md2card-jobs-"));
}

async function waitFor(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error("Timed out waiting for durable job state");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function persistedJob(overrides: Partial<RenderJob> = {}): RenderJob {
  const now = new Date().toISOString();
  return {
    id: "job-1",
    token: "x",
    kind: "single",
    status: "completed",
    payload: { markdown: "# Persisted" },
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    result: { files: [] },
    ...overrides,
  };
}

test("file job store atomically saves and reloads job metadata", async () => {
  const outputDir = await temporaryDirectory();
  try {
    const store = new FileJobStore(outputDir);
    await store.save(persistedJob());
    const jobs = await store.load();
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.id, "job-1");
    assert.equal(jobs[0]?.status, "completed");

    const stat = await fs.stat(path.join(outputDir, ".jobs", "job-1.json"));
    assert.equal(stat.mode & 0o777, 0o600);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});

test("manager recovers interrupted jobs as explicit restart failures", async () => {
  const outputDir = await temporaryDirectory();
  const store = new FileJobStore(outputDir);
  await store.save(persistedJob({ status: "running", result: undefined }));
  const manager = new JobManager(1, 60_000, store);
  try {
    assert.equal(await manager.initialize(), 1);
    assert.equal(manager.get("job-1")?.status, "failed");
    assert.equal(manager.get("job-1")?.error?.code, "renderer_restarted");
    const reloaded = await store.load();
    assert.equal(reloaded[0]?.status, "failed");
  } finally {
    manager.close();
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});

test("completed jobs remain queryable after a manager restart", async () => {
  const outputDir = await temporaryDirectory();
  const store = new FileJobStore(outputDir);
  const first = new JobManager(1, 60_000, store);
  await first.initialize();
  const job = await first.enqueue("single", { markdown: "# Durable" }, async () => ({ files: [] }));
  await waitFor(() => first.get(job.id)?.status === "completed");
  first.close();

  const second = new JobManager(1, 60_000, store);
  try {
    assert.equal(await second.initialize(), 1);
    assert.equal(second.get(job.id)?.status, "completed");
  } finally {
    second.close();
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});

test("expired persisted jobs remove metadata and invoke result cleanup", async () => {
  const outputDir = await temporaryDirectory();
  const store = new FileJobStore(outputDir);
  await store.save(persistedJob({
    status: "failed",
    expiresAt: new Date(Date.now() - 1_000).toISOString(),
  }));
  const removed: string[] = [];
  const manager = new JobManager(1, 60_000, store, async (jobId) => {
    removed.push(jobId);
  });
  try {
    assert.equal(await manager.initialize(), 0);
    assert.deepEqual(removed, ["job-1"]);
    assert.deepEqual(await store.load(), []);
  } finally {
    manager.close();
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});
