const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('lite/index.html', 'utf8');
const app = fs.readFileSync('lite/lite.js', 'utf8');
const core = require('../lite/core.js');
const netlify = fs.readFileSync('netlify.toml', 'utf8');

test('lite page is a self-contained static entrypoint', () => {
  assert.match(html, /<script defer src="core\.js"><\/script>/);
  assert.match(html, /<script defer src="lite\.js"><\/script>/);
  assert.match(html, /id="markdownInput"/);
  assert.match(html, /id="exportCurrentBtn"/);
  assert.match(html, /id="exportAllBtn"/);
});

test('lite app implements local preview and exports', () => {
  assert.match(app, /localStorage\.setItem/);
  assert.match(app, /html2canvas/);
  assert.match(app, /new window\.JSZip/);
  assert.match(app, /file\.text\(\)/);
  assert.doesNotMatch(app, /\bfetch\s*\(/);
  assert.doesNotMatch(app, /XMLHttpRequest/);
});

test('lite app blocks remote images and unsafe embedded content', () => {
  assert.match(app, /远程图片已省略/);
  assert.match(app, /script, iframe, object, embed/);
  assert.match(app, /javascript:/);
});

test('lite pagination core splits long Markdown and creates safe filenames', () => {
  const pages = core.splitMarkdown('# Title\n\n' + '内容'.repeat(600), 180);
  assert.ok(pages.length > 1);
  assert.equal(core.extractTitle('# 我的卡片'), '我的卡片');
  assert.equal(core.sanitizeFilename(' ../坏:名字 '), '坏名字');
});

test('Netlify publishes only the lite directory with security headers', () => {
  assert.match(netlify, /publish = "lite"/);
  assert.match(netlify, /Content-Security-Policy/);
  assert.match(netlify, /connect-src 'none'/);
});
