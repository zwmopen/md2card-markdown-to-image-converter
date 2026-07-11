import test from "node:test";
import assert from "node:assert/strict";

import { RenderRequestSchema } from "../src/contracts.js";
import { buildRenderHtml, markdownToSafeHtml } from "../src/template.js";

test("markdown rendering removes executable HTML", () => {
  const html = markdownToSafeHtml("# Safe\n\n<script>alert(1)</script>\n\n<img src=\"https://example.com/a.png\" onerror=\"alert(2)\">");
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /onerror/i);
  assert.match(html, /<h1>Safe<\/h1>/);
});

test("render template embeds fixed dimensions and readiness protocol", () => {
  const request = RenderRequestSchema.parse({
    markdown: "# Card",
    width: 640,
    height: 800,
    splitMode: "none",
  });
  const html = buildRenderHtml(request);
  assert.match(html, /--card-width:640px/);
  assert.match(html, /--card-height:800px/);
  assert.match(html, /data-ready=\"false\"/);
  assert.match(html, /dataset\.ready='true'/);
});
