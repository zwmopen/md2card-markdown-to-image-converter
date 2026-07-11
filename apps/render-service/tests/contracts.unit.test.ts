import test from "node:test";
import assert from "node:assert/strict";

import { BatchRenderRequestSchema, RenderRequestSchema } from "../src/contracts.js";

test("render contract applies MCP-compatible defaults", () => {
  const request = RenderRequestSchema.parse({ markdown: "# Hello" });
  assert.deepEqual(request, {
    markdown: "# Hello",
    theme: "xiaohongshu",
    themeMode: "light",
    width: 400,
    height: 533,
    splitMode: "auto",
    outputFormat: "png",
    overHiddenMode: false,
    mdxMode: false,
  });
});

test("render contract rejects unknown properties and invalid dimensions", () => {
  assert.throws(() => RenderRequestSchema.parse({ markdown: "ok", width: 100, unknown: true }));
});

test("batch contract rejects more than twenty documents", () => {
  const documents = Array.from({ length: 21 }, (_, index) => ({
    id: `item-${index}`,
    markdown: `# Item ${index}`,
  }));
  assert.throws(() => BatchRenderRequestSchema.parse({ documents }));
});
