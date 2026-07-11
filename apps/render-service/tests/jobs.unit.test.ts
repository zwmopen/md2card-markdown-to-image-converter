import test from "node:test";
import assert from "node:assert/strict";

import { JobManager } from "../src/jobs.js";

async function waitFor(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error("Timed out waiting for job state");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

test("job manager transitions queued work to completed", async () => {
  const manager = new JobManager(1, 60_000);
  await manager.initialize();
  const job = await manager.enqueue("single", { markdown: "# Test" }, async () => ({ files: [] }));
  await waitFor(() => manager.get(job.id)?.status === "completed");
  assert.equal(manager.get(job.id)?.status, "completed");
  assert.equal(manager.get(job.id)?.error, undefined);
  manager.close();
});

test("job manager records render failures", async () => {
  const manager = new JobManager(1, 60_000);
  await manager.initialize();
  const job = await manager.enqueue("single", {}, async () => {
    throw new Error("boom");
  });
  await waitFor(() => manager.get(job.id)?.status === "failed");
  assert.equal(manager.get(job.id)?.error?.code, "render_failed");
  assert.equal(manager.get(job.id)?.error?.message, "boom");
  manager.close();
});
