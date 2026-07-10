(function (root) {
'use strict';

const core = root.MD2CardCore;
const presets = root.MD2CardPresets;
const styles = root.MD2CardStyles;
if (!core || !presets || !styles) {
    throw new Error('MD2Card 运行时依赖加载不完整');
}

const { extractTitle, sanitizeFilename, splitMarkdown, estimatePageCapacity, sortMarkdownFiles } = core;
const { TEMPLATE_STYLES, THEME_ACCENTS } = presets;
const { injectBaselineStyles } = styles;

class MD2Card {
    constructor() {
        this.files = [];
        this.pages = [];
        this.currentPage = 0;
        this.showAllPages = false;
        this.backgroundImage = '';
        this.initElements();
        this.initMarked();
        this.initEventListeners();
        this.updatePreview();
        root.md2cardApp = this;
    }

    byId(id) { return document.getElementById(id); }
    listen(element, event, handler) { if (element) element.addEventListener(event, handler); }

    initElements() {
        const ids = [
            'markdownInput', 'xiaohongshuGrid', 'templateSelect', 'fontSelect', 'ratioSelect',
            'fontSizeSlider', 'fontSizeValue', 'paddingSlider', 'paddingValue',
            'borderRadiusSlider', 'borderRadiusValue', 'cardWidthSlider', 'cardWidthValue',
            'cardHeightSlider', 'cardHeightValue', 'opacitySlider', 'opacityValue',
            'exportBtn', 'exportZipBtn', 'exportDropdownMenu', 'mdFileInput', 'mdFolderInput',
            'uploadMdBtn', 'uploadFolderBtn', 'bgFileInput', 'bgUploadBtn', 'bgClearBtn',
            'paginationControls', 'prevBtn', 'nextBtn', 'pageInfo', 'batchExport', 'downloadAllBtn'
        ];
        ids.forEach(id => { this[id] = this.byId(id); });
        this.colorBtns = Array.from(document.querySelectorAll('.color-btn'));
        this.bgColorBtns = Array.from(document.querySelectorAll('.bg-color-btn'));
    }

    initMarked() {
        if (!root.marked) throw new Error('Marked.js 未加载');
        root.marked.setOptions({ breaks: true, gfm: true });
    }

    initEventListeners() {
        this.listen(this.markdownInput, 'input', () => {
            this.files = [];
            this.currentPage = 0;
            this.updatePreview();
        });
        [this.templateSelect, this.fontSelect].forEach(element => {
            this.listen(element, 'change', () => this.updatePreview());
        });
        this.listen(this.ratioSelect, 'change', () => this.applyRatio());

        const sliders = [
            [this.fontSizeSlider, this.fontSizeValue], [this.paddingSlider, this.paddingValue],
            [this.borderRadiusSlider, this.borderRadiusValue], [this.cardWidthSlider, this.cardWidthValue],
            [this.cardHeightSlider, this.cardHeightValue], [this.opacitySlider, this.opacityValue]
        ];
        sliders.forEach(([input, output]) => this.listen(input, 'input', () => {
            if (output) output.textContent = input.value;
            this.currentPage = 0;
            this.updatePreview();
        }));

        this.colorBtns.forEach(button => this.listen(button, 'click', () => {
            this.colorBtns.forEach(item => item.classList.remove('active'));
            button.classList.add('active');
            this.updatePreview();
        }));
        this.bgColorBtns.forEach(button => this.listen(button, 'click', () => {
            this.bgColorBtns.forEach(item => item.classList.remove('active'));
            button.classList.add('active');
            this.backgroundImage = '';
            this.updatePreview();
        }));

        this.listen(this.uploadMdBtn, 'click', () => this.mdFileInput && this.mdFileInput.click());
        this.listen(this.uploadFolderBtn, 'click', () => this.mdFolderInput && this.mdFolderInput.click());
        this.listen(this.mdFileInput, 'change', event => this.loadFiles(event.target.files, false));
        this.listen(this.mdFolderInput, 'change', event => this.loadFiles(event.target.files, true));
        this.listen(this.bgUploadBtn, 'click', () => this.bgFileInput && this.bgFileInput.click());
        this.listen(this.bgFileInput, 'change', event => this.loadBackground(event.target.files && event.target.files[0]));
        this.listen(this.bgClearBtn, 'click', () => {
            this.backgroundImage = '';
            if (this.bgFileInput) this.bgFileInput.value = '';
            this.updatePreview();
        });

        this.listen(this.exportBtn, 'click', event => {
            event.stopPropagation();
            this.exportCurrentPng();
        });
        this.listen(this.exportZipBtn, 'click', event => {
            event.stopPropagation();
            this.exportZip();
        });
        this.listen(this.prevBtn, 'click', () => this.changePage(-1));
        this.listen(this.nextBtn, 'click', () => this.changePage(1));
        this.listen(this.downloadAllBtn, 'click', () => this.toggleBatchPreview());
    }

    getSettings() {
        const activeTheme = document.querySelector('.color-btn.active');
        const activeBg = document.querySelector('.bg-color-btn.active');
        const theme = activeTheme ? activeTheme.dataset.theme : 'red';
        const background = activeBg ? activeBg.dataset.bgColor : '';
        return {
            template: this.templateSelect ? this.templateSelect.value : 'xiaohongshu',
            fontFamily: !this.fontSelect || this.fontSelect.value === 'default'
                ? "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif"
                : this.fontSelect.value,
            width: Number(this.cardWidthSlider ? this.cardWidthSlider.value : 400),
            height: Number(this.cardHeightSlider ? this.cardHeightSlider.value : 533),
            fontSize: Number(this.fontSizeSlider ? this.fontSizeSlider.value : 16),
            padding: Number(this.paddingSlider ? this.paddingSlider.value : 20),
            radius: Number(this.borderRadiusSlider ? this.borderRadiusSlider.value : 0),
            opacity: Number(this.opacitySlider ? this.opacitySlider.value : 100) / 100,
            accent: THEME_ACCENTS[theme] || THEME_ACCENTS.red,
            backgroundColor: background || null
        };
    }

    applyRatio() {
        const option = this.ratioSelect && this.ratioSelect.selectedOptions[0];
        if (!option) return;
        const width = option.dataset.width;
        const height = option.dataset.height;
        if (width && this.cardWidthSlider) this.cardWidthSlider.value = width;
        if (height && this.cardHeightSlider) this.cardHeightSlider.value = height;
        if (this.cardWidthValue) this.cardWidthValue.textContent = width;
        if (this.cardHeightValue) this.cardHeightValue.textContent = height;
        this.currentPage = 0;
        this.updatePreview();
    }

    async loadFiles(fileList, isFolder) {
        const files = sortMarkdownFiles(fileList);
        if (!files.length) return this.notify('没有找到 Markdown 文件', 'error');
        try {
            this.files = await Promise.all(files.map(async file => ({
                name: file.name,
                path: file.webkitRelativePath || file.name,
                text: await file.text()
            })));
            this.markdownInput.value = this.files[0].text;
            this.currentPage = 0;
            this.showAllPages = isFolder;
            this.updatePreview();
            this.notify(`已载入 ${this.files.length} 个 Markdown 文件`, 'success');
        } catch (error) {
            console.error(error);
            this.notify('读取文件失败', 'error');
        } finally {
            if (this.mdFileInput) this.mdFileInput.value = '';
            if (this.mdFolderInput) this.mdFolderInput.value = '';
        }
    }

    loadBackground(file) {
        if (!file) return;
        if (!file.type.startsWith('image/')) return this.notify('请选择图片文件', 'error');
        const reader = new FileReader();
        reader.onload = () => {
            this.backgroundImage = String(reader.result || '');
            this.bgColorBtns.forEach(item => item.classList.remove('active'));
            this.updatePreview();
        };
        reader.onerror = () => this.notify('背景图片读取失败', 'error');
        reader.readAsDataURL(file);
    }

    getDocuments() {
        if (this.files.length) return this.files;
        const text = this.markdownInput ? this.markdownInput.value : '';
        return [{ name: `${extractTitle(text)}.md`, text }];
    }

    buildPages() {
        const capacity = estimatePageCapacity(this.getSettings());
        const result = [];
        this.getDocuments().forEach((documentItem, documentIndex) => {
            const chunks = splitMarkdown(documentItem.text, capacity);
            chunks.forEach((markdown, pageIndex) => result.push({
                documentIndex,
                pageIndex,
                pageCount: chunks.length,
                title: extractTitle(documentItem.text, `document-${documentIndex + 1}`),
                sourceName: documentItem.name,
                markdown
            }));
        });
        return result;
    }

    updatePreview() {
        if (!this.xiaohongshuGrid) return;
        this.pages = this.buildPages();
        this.currentPage = Math.min(this.currentPage, Math.max(0, this.pages.length - 1));
        this.xiaohongshuGrid.innerHTML = '';
        this.pages.forEach((page, index) => {
            this.xiaohongshuGrid.appendChild(this.createCard(page, index));
        });
        this.updateVisibility();
    }

    createCard(page, index) {
        const settings = this.getSettings();
        const preset = TEMPLATE_STYLES[settings.template] || TEMPLATE_STYLES.xiaohongshu;
        const radius = preset.radius == null ? settings.radius : preset.radius;
        const card = document.createElement('article');
        card.className = `card ${settings.template}-template`;
        card.dataset.pageIndex = String(index);
        card.dataset.exportName = `${page.title}-${String(page.pageIndex + 1).padStart(2, '0')}`;
        Object.assign(card.style, {
            width: `${settings.width}px`,
            height: `${settings.height}px`,
            padding: `${settings.padding}px`,
            borderRadius: `${radius}px`,
            color: preset.color,
            background: this.backgroundImage
                ? `url("${this.backgroundImage}") center/cover no-repeat`
                : settings.backgroundColor || preset.background,
            boxShadow: preset.shadow || '0 10px 30px rgba(30,35,45,.12)',
            border: preset.border || '1px solid rgba(0,0,0,.06)',
            overflow: 'hidden',
            position: 'relative',
            flex: '0 0 auto'
        });
        card.style.setProperty('--card-accent', settings.accent || preset.accent);

        const content = document.createElement('div');
        content.className = 'card-content';
        Object.assign(content.style, {
            height: '100%',
            overflow: 'hidden',
            fontFamily: settings.fontFamily,
            fontSize: `${settings.fontSize}px`,
            lineHeight: '1.65',
            background: this.backgroundImage || settings.backgroundColor
                ? `rgba(255,255,255,${settings.opacity})`
                : 'transparent',
            borderRadius: `${Math.max(0, radius - 4)}px`,
            padding: this.backgroundImage || settings.backgroundColor ? '12px' : '0'
        });
        content.innerHTML = root.marked.parse(page.markdown || '');
        content.querySelectorAll('a').forEach(link => {
            link.rel = 'noopener noreferrer';
            link.target = '_blank';
        });
        content.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading => {
            heading.style.color = settings.accent || preset.accent;
        });
        card.appendChild(content);

        const badge = document.createElement('div');
        badge.className = 'md2card-page-badge';
        badge.textContent = `${page.pageIndex + 1}/${page.pageCount}`;
        card.appendChild(badge);
        return card;
    }

    updateVisibility() {
        const cards = Array.from(this.xiaohongshuGrid ? this.xiaohongshuGrid.children : []);
        cards.forEach((card, index) => {
            card.style.display = this.showAllPages || index === this.currentPage ? 'block' : 'none';
        });
        const total = cards.length;
        const hasMany = total > 1;
        if (this.paginationControls) this.paginationControls.style.display = hasMany && !this.showAllPages ? 'flex' : 'none';
        if (this.batchExport) this.batchExport.style.display = hasMany ? 'block' : 'none';
        if (this.pageInfo) this.pageInfo.textContent = `第 ${Math.min(total, this.currentPage + 1)} 页，共 ${total} 页`;
        if (this.prevBtn) this.prevBtn.disabled = this.currentPage <= 0;
        if (this.nextBtn) this.nextBtn.disabled = this.currentPage >= total - 1;
    }

    changePage(delta) {
        const next = this.currentPage + delta;
        if (next < 0 || next >= this.pages.length) return;
        this.currentPage = next;
        this.updateVisibility();
    }

    toggleBatchPreview() {
        this.showAllPages = !this.showAllPages;
        if (this.downloadAllBtn) {
            this.downloadAllBtn.innerHTML = this.showAllPages
                ? '<i class="fas fa-compress"></i> 单页预览'
                : '<i class="fas fa-eye"></i> 批量预览所有卡片';
        }
        this.updateVisibility();
    }

    async cardToCanvas(card) {
        if (!root.html2canvas) throw new Error('html2canvas 未加载');
        if (document.fonts && document.fonts.ready) await document.fonts.ready;

        const hidden = getComputedStyle(card).display === 'none';
        const previous = {
            display: card.style.display,
            position: card.style.position,
            left: card.style.left,
            top: card.style.top,
            visibility: card.style.visibility
        };
        if (hidden) {
            Object.assign(card.style, {
                display: 'block',
                position: 'fixed',
                left: '-10000px',
                top: '0',
                visibility: 'visible'
            });
        }
        try {
            return await root.html2canvas(card, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: null,
                logging: false
            });
        } finally {
            if (hidden) Object.assign(card.style, previous);
        }
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async exportCurrentPng() {
        const card = this.xiaohongshuGrid && this.xiaohongshuGrid.children[this.currentPage];
        if (!card) return;
        try {
            this.notify('正在生成 PNG…');
            const canvas = await this.cardToCanvas(card);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1));
            if (!blob) throw new Error('PNG 生成失败');
            this.downloadBlob(blob, `${sanitizeFilename(card.dataset.exportName)}.png`);
            this.notify('PNG 已生成', 'success');
        } catch (error) {
            console.error(error);
            this.notify(`导出失败：${error.message}`, 'error');
        }
    }

    async exportZip() {
        if (!root.JSZip) return this.notify('JSZip 未加载', 'error');
        const cards = Array.from(this.xiaohongshuGrid ? this.xiaohongshuGrid.children : []);
        if (!cards.length) return;
        const zip = new root.JSZip();
        try {
            for (let index = 0; index < cards.length; index += 1) {
                this.notify(`正在生成 ${index + 1}/${cards.length}…`);
                const canvas = await this.cardToCanvas(cards[index]);
                const data = canvas.toDataURL('image/png').split(',')[1];
                const page = this.pages[index];
                zip.folder(sanitizeFilename(page.title))
                    .file(`${String(page.pageIndex + 1).padStart(2, '0')}.png`, data, { base64: true });
            }
            const blob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            const rootName = this.files.length === 1 ? extractTitle(this.files[0].text) : 'md2card-batch';
            this.downloadBlob(blob, `${sanitizeFilename(rootName)}.zip`);
            this.notify(`ZIP 已生成，共 ${cards.length} 张`, 'success');
        } catch (error) {
            console.error(error);
            this.notify(`ZIP 导出失败：${error.message}`, 'error');
        }
    }

    notify(message, type = 'info') {
        let box = document.querySelector('.md2card-notification');
        if (!box) {
            box = document.createElement('div');
            box.className = 'md2card-notification';
            document.body.appendChild(box);
        }
        box.textContent = message;
        box.dataset.type = type;
        box.classList.add('visible');
        clearTimeout(this.notifyTimer);
        this.notifyTimer = setTimeout(() => box.classList.remove('visible'), 2200);
    }
}

injectBaselineStyles();
new MD2Card();
})(typeof globalThis !== 'undefined' ? globalThis : this);
