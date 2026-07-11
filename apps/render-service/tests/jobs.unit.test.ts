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

test("queued jobs can be cancelled without executing their work", async () => {
  let releaseFirst: (() => void) | undefined;
  let secondExecuted = false;
  const cleaned: string[] = [];
  const manager = new JobManager(1, 60_000, undefined, async (jobId) => {
    cleaned.push(jobId);
  });
  await manager.initialize();
  const first = await manager.enqueue("single", { id: "first" }, async () => {
    await new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    return { files: [] };
  });
  await waitFor(() => manager.get(first.id)?.status === "running");

  const second = await manager.enqueue("single", { id: "second" }, async () => {
    secondExecuted = true;
    return { files: [] };
  });
  assert.equal(manager.get(second.id)?.status, "queued");

  const result = await manager.cancel(second.id);
  assert.equal(result.cancelled, true);
  assert.equal(result.job?.status, "cancelled");
  assert.equal(result.job?.error?.code, "job_cancelled");
  assert.equal(secondExecuted, false);
  assert.deepEqual(cleaned, [second.id]);

  releaseFirst?.();
  await waitFor(() => manager.get(first.id)?.status === "completed");
  manager.close();
});

test("running jobs receive an abort signal and settle as cancelled", async () => {
  let observedAbort = false;
  const cleaned: string[] = [];
  const manager = new JobManager(1, 60_000, undefined, async (jobId) => {
    cleaned.push(jobId);
  });
  await manager.initialize();
  const job = await manager.enqueue("single", {}, async (_item, signal) => {
    await new Promise<void>((_resolve, reject) => {
      signal.addEventListener("abort", () => {
        observedAbort = true;
        reject(new Error("aborted"));
      }, { once: true });
    });
    return { files: [] };
  });
  await waitFor(() => manager.get(job.id)?.status === "running");

  const result = await manager.cancel(job.id);
  assert.equal(result.cancelled, true);
  await waitFor(() => manager.stats().active === 0);
  assert.equal(observedAbort, true);
  assert.equal(manager.get(job.id)?.status, "cancelled");
  assert.equal(manager.get(job.id)?.error?.code, "job_cancelled");
  assert.deepEqual(cleaned, [job.id]);
  manager.close();
});

test("retry lineage is stored on the new job", async () => {
  const manager = new JobManager(1, 60_000);
  await manager.initialize();
  const job = await manager.enqueue(
    "single",
    { markdown: "# Retry" },
    async () => ({ files: [] }),
    { retryOf: "original-job" },
  );
  assert.equal(job.retryOf, "original-job");
  await waitFor(() => manager.get(job.id)?.status === "completed");
  manager.close();
});
