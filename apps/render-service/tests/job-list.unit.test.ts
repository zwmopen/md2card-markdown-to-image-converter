import test from "node:test";
import assert from "node:assert/strict";

import type { RenderJob } from "../src/contracts.js";
import {
  decodeJobCursor,
  encodeJobCursor,
  InvalidJobCursorError,
  paginateJobs,
} from "../src/job-list.js";

function job(id: string, createdAt: string, status: RenderJob["status"]): RenderJob {
  return {
    id,
    token: "x",
    kind: "single",
    status,
    payload: {},
    createdAt,
    updatedAt: createdAt,
    expiresAt: "2099-01-01T00:00:00.000Z",
  };
}

const jobs = [
  job("c", "2026-07-11T03:00:00.000Z", "completed"),
  job("b", "2026-07-11T02:00:00.000Z", "failed"),
  job("a", "2026-07-11T01:00:00.000Z", "completed"),
];

test("cursor round-trips stable sort keys", () => {
  const cursor = encodeJobCursor(jobs[0]!);
  assert.deepEqual(decodeJobCursor(cursor), {
    createdAt: jobs[0]!.createdAt,
    id: jobs[0]!.id,
  });
});

test("jobs are listed newest first with a stable next cursor", () => {
  const first = paginateJobs(jobs, { limit: 2 });
  assert.deepEqual(first.items.map((item) => item.id), ["c", "b"]);
  assert.ok(first.nextCursor);

  const second = paginateJobs(jobs, { limit: 2, cursor: first.nextCursor! });
  assert.deepEqual(second.items.map((item) => item.id), ["a"]);
  assert.equal(second.nextCursor, null);
});

test("status filtering is applied before cursor pagination", () => {
  const page = paginateJobs(jobs, { limit: 10, status: "completed" });
  assert.deepEqual(page.items.map((item) => item.id), ["c", "a"]);
});

test("newer inserted jobs do not duplicate the next cursor page", () => {
  const first = paginateJobs(jobs, { limit: 2 });
  const withNewJob = [job("d", "2026-07-11T04:00:00.000Z", "queued"), ...jobs];
  const second = paginateJobs(withNewJob, { limit: 2, cursor: first.nextCursor! });
  assert.deepEqual(second.items.map((item) => item.id), ["a"]);
});

test("invalid cursors fail with a stable error", () => {
  assert.throws(
    () => decodeJobCursor("not-a-valid-cursor"),
    (error: unknown) => error instanceof InvalidJobCursorError && error.code === "invalid_cursor",
  );
});
