import test from "node:test";
import assert from "node:assert/strict";

import type { RenderJob, RenderedFile } from "../src/contracts.js";
import { ResultSelectionError, selectJobResult } from "../src/result-selector.js";

const primary: RenderedFile = {
  name: "01.png",
  relativePath: "card/01.png",
  mediaType: "image/png",
  size: 1200,
};
const archive: RenderedFile = {
  name: "cards.zip",
  relativePath: "cards.zip",
  mediaType: "application/zip",
  size: 5200,
};

function job(overrides: Partial<RenderJob> = {}): RenderJob {
  const now = new Date().toISOString();
  return {
    id: "job-result",
    token: "x",
    kind: "single",
    status: "completed",
    payload: {},
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    result: {
      files: [primary, archive],
      primaryFile: primary,
      archiveFile: archive,
    },
    ...overrides,
  };
}

function expectCode(callback: () => unknown, code: string): void {
  assert.throws(callback, (error: unknown) => {
    assert.ok(error instanceof ResultSelectionError);
    assert.equal(error.code, code);
    return true;
  });
}

test("auto preference selects the archive before the primary image", () => {
  const selection = selectJobResult(job(), "auto");
  assert.equal(selection.selected.relativePath, archive.relativePath);
});

test("primary preference selects the main image", () => {
  const selection = selectJobResult(job(), "primary");
  assert.equal(selection.selected.relativePath, primary.relativePath);
});

test("auto falls back to the primary image for a single-page job", () => {
  const single = job({ result: { files: [primary], primaryFile: primary } });
  assert.equal(selectJobResult(single, "auto").selected.relativePath, primary.relativePath);
});

test("queued and running jobs report result_not_ready", () => {
  expectCode(() => selectJobResult(job({ status: "queued", result: undefined }), "auto"), "result_not_ready");
  expectCode(() => selectJobResult(job({ status: "running", result: undefined }), "auto"), "result_not_ready");
});

test("failed and cancelled jobs return distinct result errors", () => {
  expectCode(() => selectJobResult(job({ status: "failed", result: undefined }), "auto"), "result_failed");
  expectCode(() => selectJobResult(job({ status: "cancelled", result: undefined }), "auto"), "result_cancelled");
});

test("explicit unavailable preferences report result_unavailable", () => {
  const single = job({ result: { files: [primary], primaryFile: primary } });
  expectCode(() => selectJobResult(single, "archive"), "result_unavailable");
});
