(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MD2CardCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function normalizeMarkdown(value) {
    return String(value ?? '').replace(/\r\n?/g, '\n').trim();
  }

  function sanitizeFilename(value, fallback = 'MD2Card') {
    const cleaned = String(value ?? '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^[_\.]+|[_\.]+$/g, '')
      .slice(0, 80);
    return cleaned || fallback;
  }

  function extractTitle(markdown, fallback = 'MD2Card') {
    const text = normalizeMarkdown(markdown);
    const heading = text.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/m);
    const title = heading
      ? heading[1]
      : text.split('\n').map(line => line.trim()).find(Boolean) || fallback;
    return sanitizeFilename(title.replace(/^[>*+-]\s*/, '').replace(/[*_`~#]/g, ''), fallback);
  }

  function splitIntoBlocks(markdown) {
    const text = normalizeMarkdown(markdown);
    if (!text) return [''];
    const blocks = [];
    let current = [];
    let inFence = false;
    const flush = () => {
      if (!current.length) return;
      blocks.push(current.join('\n').trimEnd());
      current = [];
    };
    for (const line of text.split('\n')) {
      if (/^\s*```/.test(line)) inFence = !inFence;
      if (!inFence && !line.trim()) flush();
      else current.push(line);
    }
    flush();
    return blocks.length ? blocks : [''];
  }

  function splitLongBlock(block, maxChars) {
    if (block.length <= maxChars) return [block];
    const parts = [];
    let current = '';
    for (const line of block.split('\n')) {
      if (line.length > maxChars) {
        if (current) parts.push(current);
        current = '';
        for (let index = 0; index < line.length; index += maxChars) {
          parts.push(line.slice(index, index + maxChars));
        }
        continue;
      }
      const candidate = current ? `${current}\n${line}` : line;
      if (candidate.length > maxChars && current) {
        parts.push(current);
        current = line;
      } else current = candidate;
    }
    if (current) parts.push(current);
    return parts;
  }

  function splitMarkdown(markdown, maxChars = 650) {
    const safeMax = Math.max(120, Number(maxChars) || 650);
    const blocks = splitIntoBlocks(markdown).flatMap(block => splitLongBlock(block, safeMax));
    const pages = [];
    let current = '';
    for (const block of blocks) {
      const candidate = current ? `${current}\n\n${block}` : block;
      if (candidate.length > safeMax && current) {
        pages.push(current.trim());
        current = block;
      } else current = candidate;
    }
    if (current || !pages.length) pages.push(current.trim());
    return pages;
  }

  function estimatePageCapacity({ width = 400, height = 533, fontSize = 16, padding = 20 } = {}) {
    const usableWidth = Math.max(120, width - padding * 2);
    const usableHeight = Math.max(120, height - padding * 2);
    const charsPerLine = Math.max(10, Math.floor(usableWidth / (fontSize * 0.72)));
    const lines = Math.max(6, Math.floor(usableHeight / (fontSize * 1.72)));
    return Math.max(160, Math.floor(charsPerLine * lines * 0.82));
  }

  return {
    normalizeMarkdown,
    sanitizeFilename,
    extractTitle,
    splitIntoBlocks,
    splitMarkdown,
    estimatePageCapacity
  };
});
