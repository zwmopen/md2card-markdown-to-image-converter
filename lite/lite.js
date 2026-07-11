(() => {
  'use strict';

  const STORAGE_KEY = 'md2card-lite-state-v1';
  const DEFAULT_MARKDOWN = '# MD2Card Lite\n\n开始输入 Markdown。';
  const RATIOS = {
    '3:4': { width: 720, height: 960, className: 'ratio-3-4' },
    '4:5': { width: 720, height: 900, className: 'ratio-4-5' },
    '1:1': { width: 720, height: 720, className: 'ratio-1-1' }
  };
  const THEMES = ['paper', 'sunset', 'dark'];

  const elements = {
    markdown: document.getElementById('markdownInput'),
    fileInput: document.getElementById('fileInput'),
    clear: document.getElementById('clearBtn'),
    exportCurrent: document.getElementById('exportCurrentBtn'),
    exportAll: document.getElementById('exportAllBtn'),
    theme: document.getElementById('themeSelect'),
    ratio: document.getElementById('ratioSelect'),
    fontSize: document.getElementById('fontSizeInput'),
    fontSizeValue: document.getElementById('fontSizeValue'),
    card: document.getElementById('cardPreview'),
    content: document.getElementById('cardContent'),
    cardPageNumber: document.getElementById('cardPageNumber'),
    pageCounter: document.getElementById('pageCounter'),
    pageDots: document.getElementById('pageDots'),
    previous: document.getElementById('prevBtn'),
    next: document.getElementById('nextBtn'),
    status: document.getElementById('statusMessage'),
    characterCount: document.getElementById('characterCount'),
    exportStage: document.getElementById('exportStage')
  };

  const state = {
    pages: [''],
    pageIndex: 0,
    busy: false,
    renderTimer: 0
  };

  function getCore() {
    if (!window.MD2CardCore) throw new Error('分页组件未加载');
    return window.MD2CardCore;
  }

  function currentSettings() {
    return {
      markdown: elements.markdown.value,
      theme: THEMES.includes(elements.theme.value) ? elements.theme.value : 'paper',
      ratio: RATIOS[elements.ratio.value] ? elements.ratio.value : '3:4',
      fontSize: Math.min(24, Math.max(14, Number(elements.fontSize.value) || 18))
    };
  }

  function restoreState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return;
      if (typeof saved.markdown === 'string') elements.markdown.value = saved.markdown;
      if (THEMES.includes(saved.theme)) elements.theme.value = saved.theme;
      if (RATIOS[saved.ratio]) elements.ratio.value = saved.ratio;
      if (Number.isFinite(saved.fontSize)) elements.fontSize.value = String(saved.fontSize);
    } catch {
      // The app remains usable when local storage is unavailable or malformed.
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings()));
    } catch {
      // Saving preferences is optional.
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function markdownToSafeHtml(markdown) {
    if (!window.marked) return `<p>${escapeHtml(markdown).replace(/\n/g, '<br>')}</p>`;

    const template = document.createElement('template');
    template.innerHTML = window.marked.parse(markdown, { gfm: true, breaks: true });

    template.content
      .querySelectorAll('script, iframe, object, embed, form, input, button, style, link, meta')
      .forEach(node => node.remove());

    template.content.querySelectorAll('*').forEach(node => {
      for (const attribute of Array.from(node.attributes)) {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        if (name.startsWith('on') || name === 'style' || name === 'srcdoc') {
          node.removeAttribute(attribute.name);
        } else if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
          node.removeAttribute(attribute.name);
        }
      }
    });

    template.content.querySelectorAll('img').forEach(image => {
      const source = image.getAttribute('src') || '';
      if (!/^(data:image\/|blob:)/i.test(source)) {
        const placeholder = document.createElement('span');
        const alt = image.getAttribute('alt');
        placeholder.textContent = alt ? `[图片：${alt}]` : '[远程图片已省略]';
        image.replaceWith(placeholder);
      }
    });

    template.content.querySelectorAll('a').forEach(link => {
      link.removeAttribute('target');
      link.removeAttribute('rel');
    });

    const wrapper = document.createElement('div');
    wrapper.append(template.content.cloneNode(true));
    return wrapper.innerHTML;
  }

  function calculatePages(settings) {
    const ratio = RATIOS[settings.ratio];
    const estimated = getCore().estimatePageCapacity({
      width: ratio.width,
      height: ratio.height,
      fontSize: settings.fontSize * 1.8,
      padding: 136
    });
    return getCore().splitMarkdown(
      settings.markdown || DEFAULT_MARKDOWN,
      Math.max(180, Math.floor(estimated * 0.86))
    );
  }

  function applyAppearance(card, settings, exportMode = false) {
    card.className = `card theme-${settings.theme} ${RATIOS[settings.ratio].className}`;
    const size = exportMode ? Math.round(settings.fontSize * 1.75) : settings.fontSize;
    card.style.setProperty('--card-font-size', `${size}px`);
  }

  function setStatus(message, isError = false) {
    elements.status.textContent = message;
    elements.status.style.color = isError ? '#b42318' : '';
  }

  function setBusy(busy) {
    state.busy = busy;
    elements.exportCurrent.disabled = busy;
    elements.exportAll.disabled = busy;
    elements.previous.disabled = busy || state.pageIndex <= 0;
    elements.next.disabled = busy || state.pageIndex >= state.pages.length - 1;
  }

  function renderDots() {
    elements.pageDots.replaceChildren();
    if (state.pages.length > 12) {
      const label = document.createElement('span');
      label.className = 'page-counter';
      label.textContent = `${state.pageIndex + 1} / ${state.pages.length}`;
      elements.pageDots.append(label);
      return;
    }
    state.pages.forEach((_page, index) => {
      const dot = document.createElement('span');
      dot.className = `dot${index === state.pageIndex ? ' active' : ''}`;
      elements.pageDots.append(dot);
    });
  }

  function render() {
    const settings = currentSettings();
    state.pages = calculatePages(settings);
    state.pageIndex = Math.min(state.pageIndex, state.pages.length - 1);
    const page = state.pages[state.pageIndex] || '';

    applyAppearance(elements.card, settings);
    elements.content.innerHTML = markdownToSafeHtml(page);
    elements.fontSizeValue.textContent = String(settings.fontSize);
    elements.cardPageNumber.textContent = String(state.pageIndex + 1).padStart(2, '0');
    elements.pageCounter.textContent = `${state.pageIndex + 1} / ${state.pages.length}`;
    elements.characterCount.textContent = `${settings.markdown.length.toLocaleString('zh-CN')} 字`;
    elements.previous.disabled = state.busy || state.pageIndex <= 0;
    elements.next.disabled = state.busy || state.pageIndex >= state.pages.length - 1;
    renderDots();
    saveState();
  }

  function scheduleRender(resetPage = false) {
    if (resetPage) state.pageIndex = 0;
    window.clearTimeout(state.renderTimer);
    state.renderTimer = window.setTimeout(render, 80);
  }

  function createExportCard(markdown, pageIndex, settings) {
    const card = document.createElement('article');
    applyAppearance(card, settings, true);

    const content = document.createElement('div');
    content.className = 'card-content';
    content.innerHTML = markdownToSafeHtml(markdown);

    const footer = document.createElement('footer');
    footer.className = 'card-footer';
    const brand = document.createElement('span');
    brand.textContent = 'MD2Card Lite';
    const page = document.createElement('span');
    page.textContent = `${String(pageIndex + 1).padStart(2, '0')} / ${String(state.pages.length).padStart(2, '0')}`;
    footer.append(brand, page);
    card.append(content, footer);
    return card;
  }

  async function cardToBlob(card) {
    if (!window.html2canvas) throw new Error('截图组件未加载，请检查网络后刷新页面');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const canvas = await window.html2canvas(card, {
      backgroundColor: null,
      scale: 1,
      useCORS: false,
      logging: false,
      imageTimeout: 0
    });
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('图片生成失败')), 'image/png');
    });
  }

  async function renderExportPage(pageIndex) {
    const settings = currentSettings();
    const card = createExportCard(state.pages[pageIndex] || '', pageIndex, settings);
    elements.exportStage.replaceChildren(card);
    try {
      return await cardToBlob(card);
    } finally {
      elements.exportStage.replaceChildren();
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  async function exportCurrent() {
    if (state.busy) return;
    setBusy(true);
    try {
      setStatus('正在生成当前页…');
      const blob = await renderExportPage(state.pageIndex);
      const title = getCore().extractTitle(elements.markdown.value, 'MD2Card_Lite');
      downloadBlob(blob, `${title}_${String(state.pageIndex + 1).padStart(2, '0')}.png`);
      setStatus('当前页已导出');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '导出失败', true);
    } finally {
      setBusy(false);
    }
  }

  async function exportAll() {
    if (state.busy) return;
    if (!window.JSZip) {
      setStatus('ZIP 组件未加载，请检查网络后刷新页面', true);
      return;
    }
    setBusy(true);
    try {
      const zip = new window.JSZip();
      const title = getCore().extractTitle(elements.markdown.value, 'MD2Card_Lite');
      for (let index = 0; index < state.pages.length; index += 1) {
        setStatus(`正在生成 ${index + 1} / ${state.pages.length}…`);
        const blob = await renderExportPage(index);
        zip.file(`${title}_${String(index + 1).padStart(2, '0')}.png`, blob);
      }
      setStatus('正在打包 ZIP…');
      const archive = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      downloadBlob(archive, `${title}.zip`);
      setStatus(`已导出 ${state.pages.length} 张卡片`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '批量导出失败', true);
    } finally {
      setBusy(false);
    }
  }

  async function importFile(file) {
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      setStatus('请选择 Markdown 或文本文件', true);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatus('文件不能超过 2 MB', true);
      return;
    }
    try {
      elements.markdown.value = await file.text();
      state.pageIndex = 0;
      render();
      setStatus(`已导入 ${file.name}`);
    } catch {
      setStatus('文件读取失败', true);
    } finally {
      elements.fileInput.value = '';
    }
  }

  function movePage(delta) {
    const nextIndex = Math.min(state.pages.length - 1, Math.max(0, state.pageIndex + delta));
    if (nextIndex === state.pageIndex) return;
    state.pageIndex = nextIndex;
    render();
  }

  elements.markdown.addEventListener('input', () => scheduleRender(true));
  elements.theme.addEventListener('change', () => scheduleRender(false));
  elements.ratio.addEventListener('change', () => scheduleRender(true));
  elements.fontSize.addEventListener('input', () => scheduleRender(true));
  elements.previous.addEventListener('click', () => movePage(-1));
  elements.next.addEventListener('click', () => movePage(1));
  elements.exportCurrent.addEventListener('click', exportCurrent);
  elements.exportAll.addEventListener('click', exportAll);
  elements.fileInput.addEventListener('change', event => importFile(event.target.files?.[0]));
  elements.clear.addEventListener('click', () => {
    elements.markdown.value = '';
    state.pageIndex = 0;
    render();
    elements.markdown.focus();
    setStatus('内容已清空');
  });

  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void exportCurrent();
    }
    if (event.altKey && event.key === 'ArrowLeft') movePage(-1);
    if (event.altKey && event.key === 'ArrowRight') movePage(1);
  });

  restoreState();
  render();
  setStatus('准备就绪，内容仅在本地处理');
})();
