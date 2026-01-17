class MD2Card {
    constructor() {
        this.initElements();
        this.initEventListeners();
        this.initMarked();
        this.initTemplates();
        this.setDefaultXiaohongshuMode();
        this.updatePreview();
    }

    initElements() {
        // 编辑器相关
        this.markdownInput = document.getElementById('markdownInput');
        this.cardContent = document.getElementById('cardContent');
        this.cardPreview = document.getElementById('cardPreview');
        
        // 预览区域
        this.longImageArea = document.getElementById('longImageArea');
        this.xiaohongshuGrid = document.getElementById('xiaohongshuGrid');
        this.gridContainer = document.getElementById('gridContainer');
        
        // 工具栏按钮
        this.boldBtn = document.getElementById('boldBtn');
        this.italicBtn = document.getElementById('italicBtn');
        this.headingBtn = document.getElementById('headingBtn');
        this.listBtn = document.getElementById('listBtn');
        this.quoteBtn = document.getElementById('quoteBtn');
        
        // 控制元素
        this.templateSelect = document.getElementById('templateSelect');
        this.fontSizeSlider = document.getElementById('fontSizeSlider');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.paddingSlider = document.getElementById('paddingSlider');
        this.paddingValue = document.getElementById('paddingValue');
        this.borderRadiusSlider = document.getElementById('borderRadiusSlider');
        this.borderRadiusValue = document.getElementById('borderRadiusValue');
        
        // 颜色选择
        this.colorBtns = document.querySelectorAll('.color-btn');
        
        // 导出相关
        this.exportTypeRadios = document.querySelectorAll('input[name="exportType"]');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.xiaohongshuPanel = document.getElementById('xiaohongshuPanel');
        this.maxCharsSlider = document.getElementById('maxCharsSlider');
        this.maxCharsValue = document.getElementById('maxCharsValue');
        
        // 操作按钮
        this.clearBtn = document.getElementById('clearBtn');
        this.exampleBtn = document.getElementById('exampleBtn');
        
        // 分页相关
        this.paginationControls = document.getElementById('paginationControls');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.pageInfo = document.getElementById('pageInfo');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        
        // 状态变量
        this.currentPage = 0;
        this.totalPages = 1;
        this.splitContent = [];
        this.isXiaohongshuMode = true; // 默认为小红书模式
    }

    initTemplates() {
        this.templates = {
            simple: { name: '简洁', className: 'simple-template' },
            xiaohongshu: { name: '小红书', className: 'xiaohongshu-template' },
            apple_notes: { name: '苹果便签', className: 'apple-notes-template' },
            glass_card: { name: '毛玻璃', className: 'glass-card-template' },
            neon_glow: { name: '霓虹', className: 'neon-glow-template' },
            paper_texture: { name: '纸质', className: 'paper-texture-template' },
            gradient_flow: { name: '流光', className: 'gradient-flow-template' },
            minimalist: { name: '极简', className: 'minimalist-template' },
            retro_vintage: { name: '复古', className: 'retro-vintage-template' },
            cyberpunk: { name: '赛博', className: 'cyberpunk-template' },
            nature_fresh: { name: '清新', className: 'nature-fresh-template' },
            business_pro: { name: '商务', className: 'business-pro-template' },
            ins_story: { name: 'Instagram故事', className: 'ins-story-template' },
            notion_card: { name: 'Notion卡片', className: 'notion-card-template' },
            kawaii_cute: { name: '可爱萌系', className: 'kawaii-cute-template' },
            dark_mode: { name: '深色模式', className: 'dark-mode-template' },
            watercolor: { name: '水彩艺术', className: 'watercolor-template' },
            comic_style: { name: '漫画风格', className: 'comic-style-template' },
            polaroid: { name: '拍立得', className: 'polaroid-template' },
            magazine: { name: '杂志风格', className: 'magazine-template' },
            tech_ui: { name: '科技UI', className: 'tech-ui-template' },
            handwritten: { name: '手写笔记', className: 'handwritten-template' },
            marble_luxury: { name: '大理石奢华', className: 'marble-luxury-template' },
            sunset_gradient: { name: '日落渐变', className: 'sunset-gradient-template' },
            forest_theme: { name: '森系主题', className: 'forest-theme-template' }
        };
    }

    setDefaultXiaohongshuMode() {
        // 设置默认为小红书模式
        const xiaohongshuRadio = document.querySelector('input[value="xiaohongshu"]');
        if (xiaohongshuRadio) {
            xiaohongshuRadio.checked = true;
        }
        
        // 显示小红书控制面板
        if (this.xiaohongshuPanel) {
            this.xiaohongshuPanel.style.display = 'flex';
        }
        
        // 显示小红书网格，隐藏长图区域
        if (this.longImageArea) {
            this.longImageArea.style.display = 'none';
        }
        if (this.xiaohongshuGrid) {
            this.xiaohongshuGrid.style.display = 'block';
        }
        
        // 设置默认内容
        this.loadDefaultContent();
    }

    loadDefaultContent() {
        const defaultMarkdown = `# MD2Card

> MD2Card 是一个 markdown 转知识卡片工具，可以让你用 Markdown 制作优雅的图文海报。

![](https://picsum.photos/600/300)

## 它的主要功能：

1. 将 Markdown 转化为**知识卡片**
2. 多种主题风格任你选择
3. 长文自动拆分，或者根据 markdown \`---\` 横线拆分
4. 可以复制图片到\`剪贴板\`，或者下载为\`PNG\`、\`SVG\`图片
5. 所见即所得
6. 免费

---

## 🌸 小红书分享

### ✨ 今日好物推荐

最近在逛街的时候偶然发现了这个超级好用的产品，忍不住要和大家分享一下！

### 💄 产品亮点

- **颜值超高** - 包装设计简约大方
- **质量很棒** - 用料扎实，手感很好  
- **性价比高** - 价格合理，物超所值
- **实用性强** - 日常使用频率很高

### 🛍️ 购买建议

> 建议大家趁着活动期间入手，平时价格会贵一些。记得货比三家，选择靠谱的店铺购买。

### 📝 使用心得

用了一段时间后，整体感受还是很不错的。特别是在细节处理上很用心，可以看出品牌的诚意。

**推荐指数**: ⭐⭐⭐⭐⭐

**姐妹们觉得怎么样？评论区聊聊吧！** 💕

#好物推荐 #种草分享 #生活好物`;

        this.markdownInput.value = defaultMarkdown;
        this.updatePreview();
    }

### 🛍️ 购买建议

> 建议大家趁着活动期间入手，平时价格会贵一些。记得货比三家，选择靠谱的店铺购买。

### 📝 使用心得

用了一段时间后，整体感受还是很不错的。特别是在细节处理上很用心，可以看出品牌的诚意。

**推荐指数**: ⭐⭐⭐⭐⭐

**姐妹们觉得怎么样？评论区聊聊吧！** 💕

#好物推荐 #种草分享 #生活好物`;

        this.markdownInput.value = defaultMarkdown;
    }

    initEventListeners() {
        // 实时预览
        this.markdownInput.addEventListener('input', () => {
            this.updatePreview();
        });

        // 工具栏按钮
        this.boldBtn.addEventListener('click', () => this.insertMarkdown('**', '**'));
        this.italicBtn.addEventListener('click', () => this.insertMarkdown('*', '*'));
        this.headingBtn.addEventListener('click', () => this.insertMarkdown('## ', ''));
        this.listBtn.addEventListener('click', () => this.insertMarkdown('- ', ''));
        this.quoteBtn.addEventListener('click', () => this.insertMarkdown('> ', ''));

        // 模板选择
        this.templateSelect.addEventListener('change', (e) => {
            this.applyTemplate(e.target.value);
            this.updatePreview(); // 更新预览
        });

        // 字体大小控制
        this.fontSizeSlider.addEventListener('input', (e) => {
            const fontSize = e.target.value;
            this.fontSizeValue.textContent = fontSize;
            this.cardContent.style.fontSize = fontSize + 'px';
        });

        // 内边距控制
        this.paddingSlider.addEventListener('input', (e) => {
            const padding = e.target.value;
            this.paddingValue.textContent = padding;
            if (this.cardPreview) {
                this.cardPreview.style.padding = padding + 'px';
            }
        });

        // 圆角控制
        this.borderRadiusSlider.addEventListener('input', (e) => {
            const borderRadius = e.target.value;
            this.borderRadiusValue.textContent = borderRadius;
            this.updateBorderRadius(borderRadius);
        });

        // 颜色选择
        this.colorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.colorBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const theme = e.target.dataset.theme;
                this.updateCardTheme(theme);
                this.updatePreview(); // 更新预览
            });
        });

        // 导出方式切换
        this.exportTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.isXiaohongshuMode = e.target.value === 'xiaohongshu';
                this.xiaohongshuPanel.style.display = this.isXiaohongshuMode ? 'flex' : 'none';
                
                if (this.isXiaohongshuMode) {
                    // 显示小红书网格模式
                    this.longImageArea.style.display = 'none';
                    this.xiaohongshuGrid.style.display = 'block';
                } else {
                    // 显示长图模式
                    this.longImageArea.style.display = 'block';
                    this.xiaohongshuGrid.style.display = 'none';
                }
                
                this.updatePreview();
            });
        });

        // 小红书模式字符数控制
        this.maxCharsSlider.addEventListener('input', (e) => {
            const maxChars = e.target.value;
            this.maxCharsValue.textContent = maxChars;
            if (this.isXiaohongshuMode) {
                this.updatePreview();
            }
        });

        // 操作按钮
        this.clearBtn.addEventListener('click', () => {
            if (confirm('确定要清空所有内容吗？')) {
                this.markdownInput.value = '';
                this.updatePreview();
            }
        });

        this.exampleBtn.addEventListener('click', () => {
            this.loadExample();
        });

        this.downloadBtn.addEventListener('click', () => {
            this.generateCards();
        });

        // 分页控制
        this.prevBtn.addEventListener('click', () => {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.showCurrentPage();
            }
        });

        this.nextBtn.addEventListener('click', () => {
            if (this.currentPage < this.totalPages - 1) {
                this.currentPage++;
                this.showCurrentPage();
            }
        });

        this.downloadAllBtn.addEventListener('click', () => {
            this.downloadAllCards();
        });
    }

    initMarked() {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false
        });
    }

    insertMarkdown(before, after) {
        const textarea = this.markdownInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        const newText = before + selectedText + after;
        textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        
        // 设置光标位置
        const newCursorPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
        
        this.updatePreview();
    }

    updatePreview() {
        const markdownText = this.markdownInput.value.trim();
        
        if (!markdownText) {
            if (this.isXiaohongshuMode) {
                this.showSingleCard();
            } else {
                this.showWelcomeContent();
            }
            this.hidePagination();
            return;
        }

        try {
            if (this.isXiaohongshuMode) {
                this.splitAndShowContent(markdownText);
            } else {
                const html = marked.parse(markdownText);
                if (this.cardContent) {
                    this.cardContent.innerHTML = html;
                }
                this.hidePagination();
            }
        } catch (error) {
            console.error('Markdown解析错误:', error);
            if (this.isXiaohongshuMode) {
                this.showSingleCard();
            } else if (this.cardContent) {
                this.cardContent.innerHTML = `<p style="color: #e74c3c;">Markdown解析出错，请检查语法</p>`;
            }
            this.hidePagination();
        }
    }

    showWelcomeContent() {
        if (this.isXiaohongshuMode) {
            this.showSingleCard();
        } else if (this.cardContent) {
            this.cardContent.innerHTML = `
                <h1>欢迎使用MD2Card</h1>
                <p>在左侧输入Markdown内容</p>
                <p>选择模板和样式</p>
                <p>实时预览效果</p>
                <p>一键生成精美卡片</p>
            `;
        }
    }

    applyTemplate(templateId) {
        const template = this.templates[templateId];
        if (!template) return;

        if (this.isXiaohongshuMode) {
            // 小红书模式：更新网格中的所有卡片
            const gridCards = document.querySelectorAll('.grid-card');
            const activeTheme = document.querySelector('.color-btn.active')?.dataset.theme || 'red';
            
            gridCards.forEach(card => {
                // 移除所有模板类
                card.className = card.className.replace(/\w+-template/g, '');
                // 添加新模板类（使用正确的className）
                card.classList.add(template.className);
                // 重新应用主题
                card.className = card.className.replace(/\w+-theme/g, '');
                card.classList.add(`${activeTheme}-theme`);
            });
        } else {
            // 长图模式：更新单个卡片
            if (this.cardPreview) {
                this.cardPreview.className = this.cardPreview.className.replace(/\w+-template/g, '');
                this.cardPreview.classList.add('card', template.className);
                
                const activeTheme = document.querySelector('.color-btn.active')?.dataset.theme || 'red';
                this.cardPreview.classList.add(`${activeTheme}-theme`);
            }
        }
    }

    updateCardTheme(theme) {
        if (this.isXiaohongshuMode) {
            // 小红书模式：更新网格中的所有卡片
            const gridCards = document.querySelectorAll('.grid-card');
            gridCards.forEach(card => {
                card.className = card.className.replace(/\w+-theme/g, '');
                card.classList.add(`${theme}-theme`);
            });
        } else {
            // 长图模式：更新单个卡片
            if (this.cardPreview) {
                this.cardPreview.className = this.cardPreview.className.replace(/\w+-theme/g, '');
                this.cardPreview.classList.add(`${theme}-theme`);
            }
        }
    }

    updateBorderRadius(borderRadius) {
        if (this.isXiaohongshuMode) {
            // 小红书模式：更新网格中的所有卡片
            const gridCards = document.querySelectorAll('.grid-card');
            gridCards.forEach(card => {
                card.style.borderRadius = borderRadius + 'px';
            });
        } else {
            // 长图模式：更新单个卡片
            if (this.cardPreview) {
                this.cardPreview.style.borderRadius = borderRadius + 'px';
            }
        }
    }

    splitAndShowContent(markdownText) {
        const maxChars = parseInt(this.maxCharsSlider.value);
        this.splitContent = this.smartSplitMarkdown(markdownText, maxChars);
        this.totalPages = this.splitContent.length;
        this.currentPage = 0;
        
        if (this.totalPages > 1) {
            this.showPagination();
            this.showAllXiaohongshuCards(); // 显示所有卡片的网格
        } else {
            this.hidePagination();
            this.showCurrentPage();
        }
    }

    smartSplitMarkdown(text, maxChars) {
        const lines = text.split('\n');
        const chunks = [];
        let currentChunk = '';
        let currentLength = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineLength = line.length + 1;

            // 如果当前行是标题，且当前块不为空，则开始新块
            if (line.match(/^#{1,6}\s/) && currentChunk.trim() && currentLength > maxChars * 0.3) {
                chunks.push(currentChunk.trim());
                currentChunk = line + '\n';
                currentLength = lineLength;
                continue;
            }

            // 如果添加这行会超过限制
            if (currentLength + lineLength > maxChars && currentChunk.trim()) {
                // 寻找合适的分割点
                const sentences = currentChunk.split(/[。！？.!?]\s*/);
                if (sentences.length > 1) {
                    // 按句子分割
                    let tempChunk = '';
                    let tempLength = 0;
                    
                    for (let j = 0; j < sentences.length - 1; j++) {
                        const sentence = sentences[j] + (j < sentences.length - 2 ? '。' : '');
                        if (tempLength + sentence.length > maxChars * 0.8 && tempChunk) {
                            break;
                        }
                        tempChunk += sentence;
                        tempLength += sentence.length;
                    }
                    
                    if (tempChunk.trim()) {
                        chunks.push(tempChunk.trim());
                        currentChunk = currentChunk.substring(tempLength) + line + '\n';
                        currentLength = currentChunk.length;
                    } else {
                        chunks.push(currentChunk.trim());
                        currentChunk = line + '\n';
                        currentLength = lineLength;
                    }
                } else {
                    chunks.push(currentChunk.trim());
                    currentChunk = line + '\n';
                    currentLength = lineLength;
                }
            } else {
                currentChunk += line + '\n';
                currentLength += lineLength;
            }
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks.length > 0 ? chunks : [text];
    }

    showCurrentPage() {
        if (this.splitContent.length === 0) return;
        
        const content = this.splitContent[this.currentPage];
        const html = marked.parse(content);
        
        this.cardContent.innerHTML = html; // 移除页码显示
        
        this.updatePaginationControls();
    }

    showAllXiaohongshuCards() {
        if (!this.isXiaohongshuMode || this.splitContent.length <= 1) {
            this.showSingleCard();
            return;
        }

        if (!this.gridContainer) return;

        // 清空现有内容
        this.gridContainer.innerHTML = '';
        
        // 为每个分页内容创建卡片
        this.splitContent.forEach((content, index) => {
            const card = document.createElement('div');
            const templateId = this.getCurrentTemplate();
            const template = this.templates[templateId];
            const templateClass = template ? template.className : 'xiaohongshu-template';
            
            card.className = `grid-card ${templateClass} ${this.getCurrentTheme()}-theme`;
            card.id = `card-${index}`;
            
            const cardContent = document.createElement('div');
            cardContent.className = 'grid-card-content';
            
            const html = marked.parse(content);
            cardContent.innerHTML = html; // 移除页码显示
            
            card.appendChild(cardContent);
            this.gridContainer.appendChild(card);
        });
    }

    showSingleCard() {
        if (!this.gridContainer) return;
        
        // 清空网格容器
        this.gridContainer.innerHTML = '';
        
        // 创建单个卡片
        const card = document.createElement('div');
        const templateId = this.getCurrentTemplate();
        const template = this.templates[templateId];
        const templateClass = template ? template.className : 'xiaohongshu-template';
        
        card.className = `grid-card ${templateClass} ${this.getCurrentTheme()}-theme`;
        card.id = 'single-card';
        
        const cardContent = document.createElement('div');
        cardContent.className = 'grid-card-content';
        
        const markdownText = this.markdownInput.value.trim();
        if (markdownText) {
            const html = marked.parse(markdownText);
            cardContent.innerHTML = html;
        } else {
            cardContent.innerHTML = `
                <h1>欢迎使用MD2Card</h1>
                <p>在左侧输入Markdown内容</p>
                <p>选择模板和样式</p>
                <p>实时预览效果</p>
                <p>一键生成精美卡片</p>
            `;
        }
        
        card.appendChild(cardContent);
        this.gridContainer.appendChild(card);
    }

    getCurrentTemplate() {
        const templateSelect = document.getElementById('templateSelect');
        return templateSelect ? templateSelect.value : 'xiaohongshu';
    }

    getCurrentTheme() {
        const activeThemeBtn = document.querySelector('.color-btn.active');
        return activeThemeBtn ? activeThemeBtn.dataset.theme : 'red';
    }

    updatePaginationControls() {
        this.prevBtn.disabled = this.currentPage === 0;
        this.nextBtn.disabled = this.currentPage === this.totalPages - 1;
        this.pageInfo.textContent = `${this.currentPage + 1} / ${this.totalPages}`;
    }

    showPagination() {
        this.paginationControls.style.display = 'flex';
    }

    hidePagination() {
        this.paginationControls.style.display = 'none';
        this.totalPages = 1;
        this.currentPage = 0;
        this.splitContent = [];
    }

    loadExample() {
        const exampleMarkdown = `# 🌸 小红书分享

## ✨ 今日好物推荐

最近在逛街的时候偶然发现了这个超级好用的产品，忍不住要和大家分享一下！

### 💄 产品亮点

- **颜值超高** - 包装设计简约大方
- **质量很棒** - 用料扎实，手感很好  
- **性价比高** - 价格合理，物超所值
- **实用性强** - 日常使用频率很高

### 🛍️ 购买建议

> 建议大家趁着活动期间入手，平时价格会贵一些。记得货比三家，选择靠谱的店铺购买。

### 📝 使用心得

用了一段时间后，整体感受还是很不错的。特别是在细节处理上很用心，可以看出品牌的诚意。

**推荐指数**: ⭐⭐⭐⭐⭐

---

**姐妹们觉得怎么样？评论区聊聊吧！** 💕

#好物推荐 #种草分享 #生活好物`;

        this.markdownInput.value = exampleMarkdown;
        this.updatePreview();
    }

    async generateCards() {
        const text = this.markdownInput.value.trim();
        if (!text) {
            this.showNotification('请先输入文本内容', 'warning');
            return;
        }

        if (this.isXiaohongshuMode) {
            await this.generateXiaohongshuCards();
        } else {
            await this.generateLongImage();
        }
    }

    async generateLongImage() {
        try {
            this.downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
            
            // 设置长图模式尺寸
            this.cardPreview.style.width = '400px';
            this.cardPreview.style.height = 'auto';
            this.cardPreview.style.minHeight = '600px';
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const canvas = await html2canvas(this.cardPreview, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                width: 400,
                windowWidth: 400
            });

            this.downloadCanvas(canvas, 'md2card-long');
            this.showNotification('长图生成成功！', 'success');
            
        } catch (error) {
            console.error('生成失败:', error);
            this.showNotification('生成失败，请重试', 'error');
        } finally {
            this.downloadBtn.innerHTML = '<i class="fas fa-download"></i> 导出';
        }
    }

    async generateXiaohongshuCards() {
        try {
            this.downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
            
            // 设置小红书模式尺寸 (3:4比例)
            this.cardPreview.style.width = '400px';
            this.cardPreview.style.height = '533px';
            
            if (this.splitContent.length === 0) {
                const text = this.markdownInput.value.trim();
                const maxChars = parseInt(this.maxCharsSlider.value);
                this.splitContent = this.smartSplitMarkdown(text, maxChars);
                this.totalPages = this.splitContent.length;
            }
            
            if (this.totalPages > 1) {
                this.showPagination();
                await this.downloadAllCards();
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));
                const canvas = await html2canvas(this.cardPreview, {
                    backgroundColor: null,
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    width: 400,
                    height: 533
                });
                this.downloadCanvas(canvas, 'md2card-xiaohongshu');
                this.showNotification('小红书卡片生成成功！', 'success');
            }
            
        } catch (error) {
            console.error('生成失败:', error);
            this.showNotification('生成失败，请重试', 'error');
        } finally {
            this.downloadBtn.innerHTML = '<i class="fas fa-download"></i> 导出';
        }
    }

    async downloadAllCards() {
        if (this.totalPages <= 1) {
            if (this.isXiaohongshuMode) {
                await this.downloadSingleXiaohongshuCard();
            } else {
                this.generateLongImage();
            }
            return;
        }

        try {
            const timestamp = Date.now();
            
            if (this.isXiaohongshuMode) {
                // 小红书模式：下载网格中的每个卡片
                const gridCards = document.querySelectorAll('.grid-card');
                
                // 并行处理所有卡片，提高下载速度
                const downloadPromises = Array.from(gridCards).map(async (card, i) => {
                    await new Promise(resolve => setTimeout(resolve, i * 200)); // 错开时间避免冲突

                    const canvas = await html2canvas(card, {
                        backgroundColor: null,
                        scale: 6, // 提高到6倍分辨率，获得超高清图片
                        useCORS: true,
                        allowTaint: true,
                        width: 280,
                        height: 373,
                        logging: false,
                        imageTimeout: 8000, // 进一步减少超时时间
                        removeContainer: true,
                        foreignObjectRendering: true // 提高渲染质量
                    });

                    this.downloadCanvas(canvas, `md2card-${timestamp}-page${i + 1}`);
                });

                await Promise.all(downloadPromises);
            } else {
                // 长图模式：使用原有逻辑
                const currentPage = this.currentPage;

                for (let i = 0; i < this.totalPages; i++) {
                    this.currentPage = i;
                    this.showCurrentPage();
                    
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const canvas = await html2canvas(this.cardPreview, {
                        backgroundColor: null,
                        scale: 6, // 提高到6倍分辨率，获得超高清图片
                        useCORS: true,
                        allowTaint: true,
                        width: 400,
                        height: 533,
                        logging: false,
                        imageTimeout: 10000, // 减少超时时间提高速度
                        removeContainer: true,
                        foreignObjectRendering: true // 提高渲染质量
                    });

                    this.downloadCanvas(canvas, `md2card-${timestamp}-page${i + 1}`);
                }

                this.currentPage = currentPage;
                this.showCurrentPage();
            }

            this.showNotification(`成功下载 ${this.totalPages || 1} 张卡片！`, 'success');

        } catch (error) {
            console.error('批量下载失败:', error);
            this.showNotification('批量下载失败，请重试', 'error');
        }
    }

    async downloadSingleXiaohongshuCard() {
        try {
            const card = document.querySelector('.grid-card');
            if (!card) return;

            const canvas = await html2canvas(card, {
                backgroundColor: null,
                scale: 6, // 提高到6倍分辨率，获得超高清图片
                useCORS: true,
                allowTaint: true,
                width: 280,
                height: 373,
                logging: false,
                imageTimeout: 10000, // 减少超时时间提高速度
                removeContainer: true,
                foreignObjectRendering: true // 提高渲染质量
            });

            this.downloadCanvas(canvas, `md2card-${Date.now()}`);
            this.showNotification('卡片下载成功！', 'success');

        } catch (error) {
            console.error('下载失败:', error);
            this.showNotification('下载失败，请重试', 'error');
        }
    }

    downloadCanvas(canvas, filename) {
        // 获取第一行文字作为文件夹名
        const firstLine = this.getFirstLineText();
        const folderName = this.sanitizeFilename(firstLine);
        
        const link = document.createElement('a');
        link.download = `${folderName}/${filename}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    getFirstLineText() {
        const markdownText = this.markdownInput.value.trim();
        if (!markdownText) return 'MD2Card';
        
        const lines = markdownText.split('
');
        for (let line of lines) {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                // 移除markdown标记
                return line.replace(/[#*`>-]/g, '').trim();
            } else if (line.startsWith('#')) {
                // 如果是标题，移除#号
                return line.replace(/^#+\s*/, '').trim();
            }
        }
        return 'MD2Card';
    }

    sanitizeFilename(filename) {
        // 清理文件名，移除不合法字符
        return filename
            .replace(/[<>:"/\\|?*]/g, '') // 移除Windows不支持的字符
            .replace(/\s+/g, '_') // 空格替换为下划线
            .substring(0, 50) // 限制长度
            || 'MD2Card';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new MD2Card();
});