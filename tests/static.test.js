import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const loader = fs.readFileSync('script.js', 'utf8');
const app = fs.readFileSync('src/app.js', 'utf8');

test('HTML loads the application entrypoint', () => {
    assert.match(html, /<script src=["']script\.js["']><\/script>/);
    assert.match(loader, /import\('\.\/src\/app\.js'\)/);
});

test('required interface controls remain present', () => {
    const ids = ['markdownInput', 'xiaohongshuGrid', 'exportBtn', 'exportZipBtn', 'mdFileInput', 'mdFolderInput', 'templateSelect', 'ratioSelect'];
    ids.forEach(id => assert.match(html, new RegExp(`id=["']${id}["']`), `${id} is missing`));
});

test('application implements real exports rather than placeholder alerts', () => {
    assert.doesNotMatch(app, /导出功能开发中/);
    assert.match(app, /html2canvas/);
    assert.match(app, /JSZip/);
});
