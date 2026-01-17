class MD2Card {
    constructor() {
        this.initElements();
        this.initEventListeners();
        this.initMarked();
        this.initTemplates();
        this.setDefaultXiaohongshuMode();
        this.loadDefaultContent();
    }

    initElements() {
        // 编辑器相关
        this.markdownInput = document.getElementById('markdownInput');
        this.cardContent = document.getElementById('cardContent');
        this.cardPreview = document.getElementById('cardPreview');
        
        // 预览区域
        this.longImageArea = document.getElementById('longImageArea');
        this.xiaohongshuArea = document.getElementById('xiaohongshuArea');
        this.xiaohongshuGrid = document.getElementById('xiaohongshuGrid');
        
        // 控制元素
        this.templateSelect = document.getElementById('templateSelect');
        this.fontSizeSlider = document.getElementById('fontSizeSlider');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.paddingSlider = document.getElementById('paddingSlider');
        this.paddingValue = document.getElementById('paddingValue');
        this.borderRadiusSlider = document.getElementById('borderRadiusSlider');
        this.borderRadiusValue = document.getElementById('borderRadiusValue');
        this.cardWidthSlider = document.getElementById('cardWidthSlider');
        this.cardWidthValue = document.getElementById('cardWidthValue');
        this.cardHeightSlider = document.getElementById('cardHeightSlider');
        this.cardHeightValue = document.getElementById('cardHeightValue');
        
        // 比例选择
        this.ratioSelect = document.getElementById('ratioSelect');
        
        // 颜色选择
        this.colorButtons = document.querySelectorAll('.color-btn');
        
        // 模式切换
        this.xiaohongshuModeBtn = document.getElementById('xiaohongshuModeBtn');
        this.longImageModeBtn = document.getElementById('longImageModeBtn');
        
        // 导出按钮
        this.exportLongBtn = document.getElementById('exportLongBtn');
        this.exportXiaohongshuBtn = document.getElementById('exportXiaohongshuBtn');
        this.batchProcessBtn = document.getElementById('batchProcessBtn');
        
        // 分页控制
        this.paginationControls = document.getElementById('paginationControls');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.pageInfo = document.getElementById('pageInfo');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        
        // 字体和背景图相关
        this.fontSelect = document.getElementById('fontSelect');
        this.bgFileInput = document.getElementById('bgFileInput');
        this.bgUploadBtn = document.getElementById('bgUploadBtn');
        this.bgClearBtn = document.getElementById('bgClearBtn');
        
        // 文件上传相关
        this.mdFileInput = document.getElementById('mdFileInput');
        this.mdFolderInput = document.getElementById('mdFolderInput');
        this.uploadMdBtn = document.getElementById('uploadMdBtn');
        this.uploadFolderBtn = document.getElementById('uploadFolderBtn');
        
        // 背景颜色和内容背景透明度相关
        this.bgColorButtons = document.querySelectorAll('.bg-color-btn');
        
        // 状态变量
        this.currentPage = 0;
        this.totalPages = 1;
        this.splitContent = [];
        this.isXiaohongshuMode = true; // 默认为小红书模式
        this.currentTheme = 'red'; // 默认主题
        this.templateFonts = {}; // 存储每个模板的字体选择
        this.customBackgroundImage = null; // 自定义背景图
        this.customBackgroundColor = null; // 自定义背景颜色
        this.contentBackgroundOpacity = 1; // 内容背景透明度 (0-1)
    }

    initMarked() {
        // 配置marked
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    initTemplates() {
        this.templates = {
            xiaohongshu: { name: '小红书经典', class: 'xiaohongshu-template' },
            minimal: { name: '极简风格', class: 'minimal-template' },
            gradient: { name: '渐变背景', class: 'gradient-template' },
            shadow: { name: '阴影卡片', class: 'shadow-template' },
            border: { name: '边框装饰', class: 'border-template' },
            rounded: { name: '圆角设计', class: 'rounded-template' },
            modern: { name: '现代简约', class: 'modern-template' },
            elegant: { name: '优雅风格', class: 'elegant-template' },
            vibrant: { name: '活力色彩', class: 'vibrant-template' },
            soft: { name: '柔和色调', class: 'soft-template' },
            bold: { name: '大胆设计', class: 'bold-template' },
            clean: { name: '清新风格', class: 'clean-template' },
            warm: { name: '温暖色调', class: 'warm-template' },
            cool: { name: '冷色调', class: 'cool-template' },
            nature: { name: '自然风格', class: 'nature-template' },
            tech: { name: '科技风格', class: 'tech-template' },
            retro: { name: '复古风格', class: 'retro-template' },
            neon: { name: '霓虹风格', class: 'neon-template' },
            pastel: { name: '马卡龙色', class: 'pastel-template' },
            dark: { name: '深色主题', class: 'dark-template' },
            light: { name: '浅色主题', class: 'light-template' },
            colorful: { name: '多彩风格', class: 'colorful-template' },
            monochrome: { name: '单色风格', class: 'monochrome-template' },
            artistic: { name: '艺术风格', class: 'artistic-template' },
            business: { name: '商务风格', class: 'business-template' },
            casual: { name: '休闲风格', class: 'casual-template' },
            luxury: { name: '奢华风格', class: 'luxury-template' },
            minimalist: { name: '极简主义', class: 'minimalist-template' },
            vintage: { name: '复古怀旧', class: 'vintage-template' },
            futuristic: { name: '未来科技', class: 'futuristic-template' },
            organic: { name: '有机风格', class: 'organic-template' },
            geometric: { name: '几何图形', class: 'geometric-template' },
            handwritten: { name: '手写风格', class: 'handwritten-template' },
            // 社交媒体风格
            wechat_reading: { name: '微信读书', class: 'wechat-reading-template' },
            xingtu: { name: '醒图风格', class: 'xingtu-template' },
            instagram_story: { name: 'Instagram故事', class: 'instagram-story-template' },
            twitter_card: { name: 'Twitter卡片', class: 'twitter-card-template' },
            linkedin_post: { name: 'LinkedIn帖子', class: 'linkedin-post-template' },
            tiktok_video: { name: 'TikTok视频', class: 'tiktok-video-template' },
            bilibili_cover: { name: 'B站封面', class: 'bilibili-cover-template' },
            zhihu_answer: { name: '知乎回答', class: 'zhihu-answer-template' },
            weibo_post: { name: '微博帖子', class: 'weibo-post-template' },
            douyin_video: { name: '抖音短视频', class: 'douyin-video-template' },
            // 设计平台风格
            canva_modern: { name: 'Canva现代', class: 'canva-modern-template' },
            figma_design: { name: 'Figma设计', class: 'figma-design-template' },
            dribbble_card: { name: 'Dribbble卡片', class: 'dribbble-card-template' },
            behance_portfolio: { name: 'Behance作品集', class: 'behance-portfolio-template' },
            pinterest_pin: { name: 'Pinterest图钉', class: 'pinterest-pin-template' },
            // 音乐娱乐风格
            netease_music: { name: '网易云音乐', class: 'netease-music-template' },
            qq_music: { name: 'QQ音乐', class: 'qq-music-template' },
            spotify_playlist: { name: 'Spotify播放列表', class: 'spotify-playlist-template' },
            netflix_show: { name: 'Netflix节目', class: 'netflix-show-template' },
            // 游戏风格
            steam_game: { name: 'Steam游戏', class: 'steam-game-template' },
            genshin_impact: { name: '原神', class: 'genshin-impact-template' },
            minecraft: { name: '我的世界', class: 'minecraft-template' },
            pokemon_card: { name: '宝可梦卡片', class: 'pokemon-card-template' },
            // 特殊风格
            anime_style: { name: '动漫风格', class: 'anime-style-template' },
            miyazaki_style: { name: '宫崎骏风格', class: 'miyazaki-style-template' },
            github_readme: { name: 'GitHub README', class: 'github-readme-template' },
            discord_embed: { name: 'Discord嵌入', class: 'discord-embed-template' },
            medium_article: { name: 'Medium文章', class: 'medium-article-template' },
            // 拟态风格
            neumorphism: { name: '拟态设计', class: 'neumorphism-template' }
        };
    }

    initEventListeners() {
        // Markdown输入事件
        this.markdownInput.addEventListener('input', () => this.updatePreview());
        
        // 模板选择事件
        this.templateSelect.addEventListener('change', () => {
            // 恢复该模板之前选择的字体
            const currentTemplate = this.templateSelect.value;
            if (this.templateFonts[currentTemplate]) {
                this.fontSelect.value = this.templateFonts[currentTemplate];
            } else {
                this.fontSelect.value = 'default';
            }
            this.updatePreview();
        });
        
        // 主题色选择事件
        this.colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.colorButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTheme = e.target.dataset.theme;
                this.updatePreview();
            });
        });
        
        // 样式控制滑块事件
        this.fontSizeSlider.addEventListener('input', (e) => {
            this.fontSizeValue.textContent = e.target.value;
            this.updatePreview();
        });
        
        this.paddingSlider.addEventListener('input', (e) => {
            this.paddingValue.textContent = e.target.value;
            this.updatePreview();
        });
        
        this.borderRadiusSlider.addEventListener('input', (e) => {
            this.borderRadiusValue.textContent = e.target.value;
            this.updatePreview();
        });
        
        this.cardWidthSlider.addEventListener('input', (e) => {
            this.cardWidthValue.textContent = e.target.value;
            this.updatePreview();
        });
        
        this.cardHeightSlider.addEventListener('input', (e) => {
            this.cardHeightValue.textContent = e.target.value;
            this.updatePreview();
        });
        
        // 模式切换事件
        this.xiaohongshuModeBtn.addEventListener('click', () => this.switchToXiaohongshuMode());
        this.longImageModeBtn.addEventListener('click', () => this.switchToLongImageMode());
        
        // 导出事件
        this.exportAllBtn = document.getElementById('exportAllBtn');
        this.exportZipBtn = document.getElementById('exportZipBtn');
        
        this.exportAllBtn.addEventListener('click', () => this.downloadAllCards());
        this.exportZipBtn.addEventListener('click', () => this.exportAsZip());
        this.batchProcessBtn.addEventListener('click', () => this.batchProcessFiles());
        
        // 分页事件
        this.prevBtn.addEventListener('click', () => this.previousPage());
        this.nextBtn.addEventListener('click', () => this.nextPage());
        this.downloadAllBtn.addEventListener('click', () => this.downloadAllCards());
        
        // 字体选择事件
        this.fontSelect.addEventListener('change', () => {
            const currentTemplate = this.templateSelect.value;
            this.templateFonts[currentTemplate] = this.fontSelect.value;
            this.updatePreview();
        });
        
        // 比例选择事件
        this.ratioSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            const width = selectedOption.dataset.width;
            const height = selectedOption.dataset.height;
            
            // 更新滑块值
            this.cardWidthSlider.value = width;
            this.cardWidthValue.textContent = width;
            this.cardHeightSlider.value = height;
            this.cardHeightValue.textContent = height;
            
            this.updatePreview();
        });
        
        // 背景图事件
        this.bgUploadBtn.addEventListener('click', () => {
            this.bgFileInput.click();
        });
        
        this.bgFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.customBackgroundImage = e.target.result;
                    this.updatePreview();
                };
                reader.readAsDataURL(file);
            }
        });
        
        this.bgClearBtn.addEventListener('click', () => {
            this.customBackgroundImage = null;
            this.customBackgroundColor = null;
            this.bgFileInput.value = '';
            this.updatePreview();
        });
        
        // 背景颜色选择事件
        this.bgColorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.customBackgroundColor = e.target.dataset.bgColor;
                this.customBackgroundImage = null; // 清除背景图
                this.bgFileInput.value = '';
                this.updatePreview();
            });
        });
        
        // 文件上传事件
        this.uploadMdBtn.addEventListener('click', () => {
            this.mdFileInput.click();
        });
        
        this.mdFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.readMarkdownFile(file);
            }
        });
        
        this.uploadFolderBtn.addEventListener('click', () => {
            this.mdFolderInput.click();
        });
        
        this.mdFolderInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                this.readMarkdownFiles(files);
            }
        });
        
        // 内容背景透明度事件
        this.opacitySlider = document.getElementById('opacitySlider');
        this.opacityValue = document.getElementById('opacityValue');
        
        this.opacitySlider.addEventListener('input', (e) => {
            const opacity = parseFloat(e.target.value) / 100;
            this.contentBackgroundOpacity = opacity;
            this.opacityValue.textContent = e.target.value;
            this.updatePreview();
        });
    }

    setDefaultXiaohongshuMode() {
        this.isXiaohongshuMode = true;
        this.xiaohongshuModeBtn.classList.add('active');
        this.longImageModeBtn.classList.remove('active');
        this.xiaohongshuArea.style.display = 'block';
        this.longImageArea.style.display = 'none';
    }

    loadDefaultContent() {
        const defaultContent = `# 🌸 小红书分享

## ✨ 今日好物推荐

最近发现了超棒的宝藏好物！

### 🎯 推荐理由
- **颜值超高** - 简约设计，百搭风格
- **性价比** - 价格亲民，质量优秀  
- **实用性** - 日常必备，提升生活品质

### 💡 使用心得
用了一段时间，真的太满意了！
强烈推荐给大家 ✨

---
*#好物推荐 #生活分享 #种草*`;
        
        this.markdownInput.value = defaultContent;
        this.updatePreview();
    }

    switchToXiaohongshuMode() {
        this.isXiaohongshuMode = true;
        this.xiaohongshuModeBtn.classList.add('active');
        this.longImageModeBtn.classList.remove('active');
        this.xiaohongshuArea.style.display = 'block';
        this.longImageArea.style.display = 'none';
        this.updatePreview();
    }

    switchToLongImageMode() {
        this.isXiaohongshuMode = false;
        this.longImageModeBtn.classList.add('active');
        this.xiaohongshuModeBtn.classList.remove('active');
        this.longImageArea.style.display = 'block';
        this.xiaohongshuArea.style.display = 'none';
        this.updatePreview();
    }

    updatePreview() {
        const markdownText = this.markdownInput.value;
        const htmlContent = marked.parse(markdownText);
        
        if (this.isXiaohongshuMode) {
            this.showAllXiaohongshuCards(htmlContent);
        } else {
            this.showLongImage(htmlContent);
        }
    }

    showLongImage(htmlContent) {
        const template = this.templateSelect.value;
        const templateClass = this.templates[template]?.class || 'xiaohongshu-template';
        const theme = this.currentTheme;
        
        // 更新卡片样式
        this.cardPreview.className = `card ${templateClass} ${theme}-theme`;
        this.cardContent.innerHTML = htmlContent;
        
        // 应用自定义样式
        this.applyCustomStyles(this.cardPreview);
    }

    showAllXiaohongshuCards(htmlContent) {
        // 分割内容为多个卡片
        this.splitContent = this.splitContentForCards(htmlContent);
        this.totalPages = Math.ceil(this.splitContent.length / 9); // 每页9张卡片
        
        if (this.currentPage >= this.totalPages) {
            this.currentPage = 0;
        }
        
        this.renderCurrentPage();
        this.updatePaginationControls();
    }

    splitContentForCards(htmlContent) {
        // 简单的内容分割逻辑
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        const elements = Array.from(tempDiv.children);
        const cards = [];
        let currentCard = '';
        let wordCount = 0;
        const maxWordsPerCard = 100;
        
        elements.forEach(element => {
            const elementText = element.textContent || '';
            const elementWords = elementText.length;
            
            if (wordCount + elementWords > maxWordsPerCard && currentCard) {
                cards.push(currentCard);
                currentCard = element.outerHTML;
                wordCount = elementWords;
            } else {
                currentCard += element.outerHTML;
                wordCount += elementWords;
            }
        });
        
        if (currentCard) {
            cards.push(currentCard);
        }
        
        return cards.length > 0 ? cards : [htmlContent];
    }

    renderCurrentPage() {
        const startIndex = this.currentPage * 9;
        const endIndex = Math.min(startIndex + 9, this.splitContent.length);
        const pageCards = this.splitContent.slice(startIndex, endIndex);
        
        this.xiaohongshuGrid.innerHTML = '';
        
        pageCards.forEach((cardContent, index) => {
            const cardElement = this.createXiaohongshuCard(cardContent, startIndex + index);
            this.xiaohongshuGrid.appendChild(cardElement);
        });
    }

    createXiaohongshuCard(content, index) {
        const template = this.templateSelect.value;
        const templateClass = this.templates[template]?.class || 'xiaohongshu-template';
        const theme = this.currentTheme;
        
        const cardDiv = document.createElement('div');
        cardDiv.className = `xiaohongshu-card ${templateClass} ${theme}-theme`;
        cardDiv.innerHTML = `<div class="card-content">${content}</div>`;
        
        // 应用自定义样式
        this.applyCustomStyles(cardDiv);
        
        return cardDiv;
    }

    applyCustomStyles(cardElement) {
        const fontSize = this.fontSizeSlider.value;
        const padding = this.paddingSlider.value;
        const borderRadius = this.borderRadiusSlider.value;
        const cardWidth = this.cardWidthSlider.value;
        const cardHeight = this.cardHeightSlider.value;
        const selectedFont = this.fontSelect.value;
        
        // 应用样式
        cardElement.style.fontSize = `${fontSize}px`;
        cardElement.style.padding = `${padding}px`;
        cardElement.style.borderRadius = `${borderRadius}px`;
        cardElement.style.width = `${cardWidth}px`;
        cardElement.style.height = `${cardHeight}px`;
        
        // 应用字体
        if (selectedFont !== 'default') {
            cardElement.style.fontFamily = selectedFont;
        }
        
        // 应用背景图或背景颜色
        if (this.customBackgroundImage) {
            cardElement.style.backgroundImage = `url(${this.customBackgroundImage})`;
            cardElement.style.backgroundSize = 'cover';
            cardElement.style.backgroundPosition = 'center';
            cardElement.style.backgroundColor = '';
        } else if (this.customBackgroundColor) {
            cardElement.style.backgroundColor = this.customBackgroundColor;
            cardElement.style.backgroundImage = '';
        }
        
        // 应用内容背景透明度
        const cardContent = cardElement.querySelector('.card-content');
        if (cardContent) {
            cardContent.style.backgroundColor = `rgba(255, 255, 255, ${this.contentBackgroundOpacity})`;
            // 根据透明度调整文字颜色，确保可读性
            if (this.contentBackgroundOpacity < 0.3) {
                cardContent.style.color = '#ffffff';
            } else {
                // 保持原有颜色
            }
        }
    }

    updatePaginationControls() {
        if (this.totalPages > 1) {
            this.paginationControls.style.display = 'flex';
            this.pageInfo.textContent = `第 ${this.currentPage + 1} 页，共 ${this.totalPages} 页`;
            this.prevBtn.disabled = this.currentPage === 0;
            this.nextBtn.disabled = this.currentPage === this.totalPages - 1;
        } else {
            this.paginationControls.style.display = 'none';
        }
        
        // 显示批量导出按钮
        if (this.splitContent.length > 1) {
            document.getElementById('batchExport').style.display = 'block';
        } else {
            document.getElementById('batchExport').style.display = 'none';
        }
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderCurrentPage();
            this.updatePaginationControls();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.renderCurrentPage();
            this.updatePaginationControls();
        }
    }

    async exportLongImage() {
        const card = this.cardPreview;
        
        try {
            const canvas = await html2canvas(card, {
                scale: 6,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: card.offsetWidth,
                height: card.offsetHeight
            });
            
            // 下载图片
            const link = document.createElement('a');
            link.download = this.getFileName('长图');
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('导出长图失败:', error);
            alert('导出失败，请重试');
        }
    }

    async exportXiaohongshuCards() {
        const cards = this.xiaohongshuGrid.querySelectorAll('.xiaohongshu-card');
        
        if (cards.length === 0) {
            alert('没有可导出的卡片');
            return;
        }
        
        try {
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const canvas = await html2canvas(card, {
                    scale: 6,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: card.offsetWidth,
                    height: card.offsetHeight
                });
                
                // 下载图片
                const link = document.createElement('a');
                link.download = this.getFileName(`小红书卡片_${this.currentPage + 1}_${i + 1}`);
                link.href = canvas.toDataURL('image/png');
                link.click();
                
                // 添加延迟避免浏览器阻止多个下载
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error('导出小红书卡片失败:', error);
            alert('导出失败，请重试');
        }
    }

    async downloadAllCards() {
        try {
            for (let page = 0; page < this.totalPages; page++) {
                // 临时切换到该页
                const originalPage = this.currentPage;
                this.currentPage = page;
                this.renderCurrentPage();
                
                // 等待渲染完成
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 导出该页的卡片
                const cards = this.xiaohongshuGrid.querySelectorAll('.xiaohongshu-card');
                
                for (let i = 0; i < cards.length; i++) {
                    const card = cards[i];
                    const canvas = await html2canvas(card, {
                        scale: 6,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        width: card.offsetWidth,
                        height: card.offsetHeight
                    });
                    
                    // 下载图片
                    const link = document.createElement('a');
                    link.download = this.getFileName(`小红书卡片_${page + 1}_${i + 1}`);
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    
                    // 添加延迟
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // 恢复原页面
                this.currentPage = originalPage;
            }
            
            // 重新渲染当前页
            this.renderCurrentPage();
            this.updatePaginationControls();
        } catch (error) {
            console.error('批量导出失败:', error);
            alert('批量导出失败，请重试');
        }
    }

    getFileName(prefix, fileName = null) {
        // 如果提供了文件名，使用文件名
        if (fileName) {
            const cleanFileName = fileName.replace(/\.md$|\.markdown$/, '').substring(0, 50);
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '');
            return `${cleanFileName}_${prefix}_${timestamp}.png`;
        }
        
        // 否则获取第一行文本作为文件名
        const firstLine = this.markdownInput.value.split('\n')[0];
        const cleanFirstLine = firstLine.replace(/[#\*\-\s]/g, '').substring(0, 50);
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '');
        
        if (cleanFirstLine) {
            return `${cleanFirstLine}_${prefix}_${timestamp}.png`;
        } else {
            return `${prefix}_${timestamp}.png`;
        }
    }
    
    // 读取单个Markdown文件
    readMarkdownFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.markdownInput.value = content;
            this.updatePreview();
        };
        reader.onerror = () => {
            alert('读取文件失败，请重试');
        };
        reader.readAsText(file, 'utf-8');
    }
    
    // 读取多个Markdown文件
    readMarkdownFiles(files) {
        // 存储所有文件
        this.batchFiles = files;
        
        // 显示文件数量
        if (files.length > 0) {
            // 处理第一个文件作为当前编辑文件
            this.readMarkdownFile(files[0]);
            
            if (files.length > 1) {
                alert(`已加载第一个文件，共选择了 ${files.length} 个文件`);
            }
        }
    }
    
    // 批量处理所有Markdown文件
    async batchProcessFiles() {
        if (!this.batchFiles || this.batchFiles.length === 0) {
            alert('请先上传文件夹中的Markdown文件');
            return;
        }
        
        try {
            const zip = new JSZip();
            const images = zip.folder('小红书卡片');
            
            for (let i = 0; i < this.batchFiles.length; i++) {
                const file = this.batchFiles[i];
                const fileName = file.name.replace(/\.md$|\.markdown$/, '');
                
                // 读取文件内容
                const content = await this.readFileAsText(file);
                const htmlContent = marked.parse(content);
                
                // 生成卡片
                const cardElement = this.createBatchCard(htmlContent);
                
                // 转换为图片
                const canvas = await html2canvas(cardElement, {
                    scale: 6,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: cardElement.offsetWidth,
                    height: cardElement.offsetHeight
                });
                
                // 添加到压缩包
                const dataUrl = canvas.toDataURL('image/png');
                const base64Data = dataUrl.split(',')[1];
                images.file(`${fileName}.png`, base64Data, { base64: true });
            }
            
            // 生成压缩包并下载
            zip.generateAsync({ type: 'blob' }).then(blob => {
                const link = document.createElement('a');
                link.download = '批量导出小红书卡片.zip';
                link.href = URL.createObjectURL(blob);
                link.click();
            });
        } catch (error) {
            console.error('批量处理失败:', error);
            alert('批量处理失败，请重试');
        }
    }
    
    // 读取文件为文本
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file, 'utf-8');
        });
    }
    
    // 创建用于批量处理的卡片
    createBatchCard(htmlContent) {
        const template = this.templateSelect.value;
        const templateClass = this.templates[template]?.class || 'xiaohongshu-template';
        const theme = this.currentTheme;
        
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${templateClass} ${theme}-theme`;
        cardDiv.style.width = `${this.cardWidthSlider.value}px`;
        cardDiv.style.height = `${this.cardHeightSlider.value}px`;
        cardDiv.innerHTML = `<div class="card-content">${htmlContent}</div>`;
        
        // 应用自定义样式
        this.applyCustomStyles(cardDiv);
        
        // 隐藏添加到DOM
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = '-9999px';
        document.body.appendChild(cardDiv);
        
        return cardDiv;
    }
    
    async exportAsZip() {
        try {
            // 检查是否有可用的JSZip库
            if (typeof JSZip === 'undefined') {
                alert('请先引入JSZip库以支持压缩包导出功能');
                return;
            }
            
            const zip = new JSZip();
            const images = zip.folder('小红书卡片');
            
            for (let page = 0; page < this.totalPages; page++) {
                // 临时切换到该页
                const originalPage = this.currentPage;
                this.currentPage = page;
                this.renderCurrentPage();
                
                // 等待渲染完成
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 导出该页的卡片
                const cards = this.xiaohongshuGrid.querySelectorAll('.xiaohongshu-card');
                
                for (let i = 0; i < cards.length; i++) {
                    const card = cards[i];
                    const canvas = await html2canvas(card, {
                        scale: 6,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        width: card.offsetWidth,
                        height: card.offsetHeight
                    });
                    
                    // 将图片添加到压缩包
                    const fileName = this.getFileName(`小红书卡片_${page + 1}_${i + 1}`);
                    const dataUrl = canvas.toDataURL('image/png');
                    const base64Data = dataUrl.split(',')[1];
                    images.file(fileName, base64Data, { base64: true });
                }
                
                // 恢复原页面
                this.currentPage = originalPage;
            }
            
            // 生成压缩包并下载
            zip.generateAsync({ type: 'blob' }).then(blob => {
                const link = document.createElement('a');
                link.download = this.getFileName('小红书卡片') + '.zip';
                link.href = URL.createObjectURL(blob);
                link.click();
            });
            
            // 重新渲染当前页
            this.renderCurrentPage();
            this.updatePaginationControls();
        } catch (error) {
            console.error('导出压缩包失败:', error);
            alert('导出压缩包失败，请重试');
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MD2Card();
});