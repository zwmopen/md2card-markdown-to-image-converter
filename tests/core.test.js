import test from 'node:test';
import assert from 'node:assert/strict';
import * as Core from '../src/core.js';

test('sanitizeFilename removes unsafe characters and edge separators', () => {
    assert.equal(Core.sanitizeFilename('  我的:卡片 / 测试?  '), '我的卡片_测试');
});

test('extractTitle prefers the first markdown heading', () => {
    assert.equal(Core.extractTitle('正文\n\n# 产品复刻计划\n其他'), '产品复刻计划');
});

test('splitMarkdown keeps fenced code blocks intact when capacity allows', () => {
    const input = '# 标题\n\n```js\nconst a = 1;\nconst b = 2;\n```\n\n结尾';
    const pages = Core.splitMarkdown(input, 180);
    assert.equal(pages.length, 1);
    assert.match(pages[0], /```js[\s\S]*```/);
});

test('splitMarkdown creates deterministic bounded pages', () => {
    const input = Array.from({ length: 20 }, (_, i) => `## 第${i + 1}节\n${'内容'.repeat(30)}`).join('\n\n');
    const pages = Core.splitMarkdown(input, 220);
    assert.ok(pages.length > 2);
    assert.ok(pages.every(page => page.length <= 220 || !page.includes('\n\n')));
});

test('estimatePageCapacity responds to dimensions and font size', () => {
    const small = Core.estimatePageCapacity({ width: 320, height: 400, fontSize: 20, padding: 30 });
    const large = Core.estimatePageCapacity({ width: 600, height: 800, fontSize: 14, padding: 20 });
    assert.ok(large > small);
});

test('sortMarkdownFiles filters and naturally sorts markdown files', () => {
    const result = Core.sortMarkdownFiles([
        { name: '10.md' }, { name: 'note.txt' }, { name: '2.md' }, { name: '1.markdown' }
    ]);
    assert.deepEqual(result.map(file => file.name), ['1.markdown', '2.md', '10.md']);
});
