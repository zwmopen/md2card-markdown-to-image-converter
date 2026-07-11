import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import {
  canLoadRemoteUrl,
  ensurePathInside,
  hasValidBearer,
  sanitizeFilename,
} from "../src/security.js";

test("bearer validation accepts only an exact token", () => {
  assert.equal(hasValidBearer("Bearer abc", "abc"), true);
  assert.equal(hasValidBearer("Bearer abcd", "abc"), false);
  assert.equal(hasValidBearer(undefined, "abc"), false);
  assert.equal(hasValidBearer(undefined, undefined), true);
});

test("filename sanitization removes unsafe path characters", () => {
  assert.equal(sanitizeFilename("  ../我的:卡片?.png  "), "我的卡片.png");
});

test("output path guard rejects directory traversal", () => {
  const root = path.resolve("/tmp/md2card-output");
  assert.throws(() => ensurePathInside(root, path.resolve(root, "../escape")));
  assert.equal(ensurePathInside(root, path.join(root, "job", "file.png")), path.join(root, "job", "file.png"));
});

test("remote URL guard blocks local and private network hosts", () => {
  assert.equal(canLoadRemoteUrl("https://example.com/image.png"), true);
  assert.equal(canLoadRemoteUrl("http://127.0.0.1/admin"), false);
  assert.equal(canLoadRemoteUrl("http://192.168.1.10/image.png"), false);
  assert.equal(canLoadRemoteUrl("file:///etc/passwd"), false);
});
