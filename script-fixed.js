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
        
        // 导出按钮
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
            medium_article: { name: 'Medium文章', class: 'medium-article-template' }
        };
    }

    initEventListeners() {
        // 编辑器输入事件
        if (this.markdownInput) {
            this.markdownInput.addEventListener('input', () => this.updatePreview());
        }
        
        // 模板选择事件
        if (this.templateSelect) {
            this.templateSelect.addEventListener('change', () => {
                this.updatePreview();
            });
        }
        
        // 滑块事件
        if (this.fontSizeSlider) {
            this.fontSizeSlider.addEventListener('input', (e) => {
                if (this.fontSizeValue) {
                    this.fontSizeValue.textContent = e.target.value;
                }
                this.updatePreview();
            });
        }
        
        if (this.paddingSlider) {
            this.paddingSlider.addEventListener('input', (e) => {
                if (this.paddingValue) {
                    this.paddingValue.textContent = e.target.value;
                }
                this.updatePreview();
            });
        }
        
        if (this.borderRadiusSlider) {
            this.borderRadiusSlider.addEventListener('input', (e) => {
                if (this.borderRadiusValue) {
                    this.borderRadiusValue.textContent = e.target.value;
                }
                this.updatePreview();
            });
        }
        
        if (this.cardWidthSlider) {
            this.cardWidthSlider.addEventListener('input', (e) => {
                if (this.cardWidthValue) {
                    this.cardWidthValue.textContent = e.target.value;
                }
                this.updatePreview();
            });
        }
        
        if (this.cardHeightSlider) {
            this.cardHeightSlider.addEventListener('input', (e) => {
                if (this.cardHeightValue) {
                    this.cardHeightValue.textContent = e.target.value;
                }
                this.updatePreview();
            });
        }
        
        // 导出事件
        const exportAllBtn = document.getElementById('exportAllBtn');
        const exportZipBtn = document.getElementById('exportZipBtn');
        
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => this.downloadAllCards());
        }
        if (exportZipBtn) {
            exportZipBtn.addEventListener('click', () => this.exportAsZip());
        }
        if (this.batchProcessBtn) {
            this.batchProcessBtn.addEventListener('click', () => this.batchProcessFiles());
        }
        
        // 分页事件
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousPage());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextPage());
        }
        if (this.downloadAllBtn) {
            this.downloadAllBtn.addEventListener('click', () => this.downloadAllCards());
        }
        
        // 字体选择事件
        if (this.fontSelect) {
            this.fontSelect.addEventListener('change', () => {
                if (this.templateSelect) {
                    const currentTemplate = this.templateSelect.value;
                    this.templateFonts[currentTemplate] = this.fontSelect.value;
                }
                this.updatePreview();
            });
        }
        
        // 比例选择事件
        if (this.ratioSelect) {
            this.ratioSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.selectedOptions[0];
                if (selectedOption) {
                    const width = selectedOption.dataset.width;
                    const height = selectedOption.dataset.height;
                    
                    // 更新滑块值
                    if (this.cardWidthSlider) {
                        this.cardWidthSlider.value = width;
                    }
                    if (this.cardWidthValue) {
                        this.cardWidthValue.textContent = width;
                    }
                    if (this.cardHeightSlider) {
                        this.cardHeightSlider.value = height;
                    }
                    if (this.cardHeightValue) {
                        this.cardHeightValue.textContent = height;
                    }
                }
                this.updatePreview();
            });
        }
        
        // 背景图事件
        if (this.bgUploadBtn) {
            this.bgUploadBtn.addEventListener('click', () => {
                if (this.bgFileInput) {
                    this.bgFileInput.click();
                }
            });
        }
        
        if (this.bgClearBtn) {
            this.bgClearBtn.addEventListener('click', () => {
                this.customBackgroundImage = null;
                this.updatePreview();
            });
        }
        
        if (this.bgFileInput) {
            this.bgFileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.customBackgroundImage = event.target.result;
                        this.updatePreview();
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
        }
        
        // 上传按钮事件
        if (this.uploadMdBtn) {
            this.uploadMdBtn.addEventListener('click', () => {
                if (this.mdFileInput) {
                    this.mdFileInput.click();
                }
            });
        }
        
        if (this.uploadFolderBtn) {
            this.uploadFolderBtn.addEventListener('click', () => {
                if (this.mdFolderInput) {
                    this.mdFolderInput.click();
                }
            });
        }
        
        // 文件输入事件
        if (this.mdFileInput) {
            this.mdFileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.readMarkdownFile(e.target.files[0]);
                }
            });
        }
        
        if (this.mdFolderInput) {
            this.mdFolderInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.readMarkdownFolder(e.target.files);
                }
            });
        }
        
        // 背景颜色事件
        if (this.bgColorButtons) {
            this.bgColorButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const bgColor = button.dataset.bgColor;
                    this.customBackgroundColor = bgColor;
                    this.updatePreview();
                });
            });
        }
        
        // 主题事件
        if (this.colorButtons) {
            this.colorButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const theme = button.dataset.theme;
                    this.changeTheme(theme);
                    if (this.colorButtons) {
                        this.colorButtons.forEach(btn => btn.classList.remove('active'));
                    }
                    button.classList.add('active');
                });
            });
        }
        
        // 背景透明度事件
        const opacitySlider = document.getElementById('opacitySlider');
        const opacityValue = document.getElementById('opacityValue');
        
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                if (opacityValue) {
                    opacityValue.textContent = e.target.value;
                }
                this.contentBackgroundOpacity = e.target.value / 100;
                this.updatePreview();
            });
        }
    }

    setDefaultXiaohongshuMode() {
        this.isXiaohongshuMode = true;
        if (this.xiaohongshuArea) {
            this.xiaohongshuArea.style.display = 'block';
        }
        if (this.longImageArea) {
            this.longImageArea.style.display = 'none';
        }
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
        
        if (this.markdownInput) {
            this.markdownInput.value = defaultContent;
        }
        this.updatePreview();
    }

    switchToXiaohongshuMode() {
        this.isXiaohongshuMode = true;
        if (this.xiaohongshuArea) {
            this.xiaohongshuArea.style.display = 'block';
        }
        if (this.longImageArea) {
            this.longImageArea.style.display = 'none';
        }
        this.updatePreview();
    }

    switchToLongImageMode() {
        this.isXiaohongshuMode = false;
        if (this.longImageArea) {
            this.longImageArea.style.display = 'block';
        }
        if (this.xiaohongshuArea) {
            this.xiaohongshuArea.style.display = 'none';
        }
        this.updatePreview();
    }

    updatePreview() {
        const markdownText = this.markdownInput ? this.markdownInput.value : '';
        if (!markdownText) return;
        
        const htmlText = marked.parse(markdownText);
        
        if (this.isXiaohongshuMode) {
            this.generateXiaohongshuCards(htmlText);
        } else {
            this.generateLongImage(htmlText);
        }
    }

    generateXiaohongshuCards(htmlText) {
        if (!this.xiaohongshuGrid) return;
        
        // 清空预览区域
        this.xiaohongshuGrid.innerHTML = '';
        
        // 分割内容为卡片
        this.splitContent = this.splitContentForXiaohongshu(htmlText);
        this.totalPages = this.splitContent.length;
        this.currentPage = 0;
        
        // 生成当前页卡片
        this.generateCurrentPageCards();
        
        // 更新分页信息
        this.updatePagination();
    }

    splitContentForXiaohongshu(html) {
        // 简单的分割逻辑
        const paragraphs = html.split('</p>');
        const cards = [];
        let currentCard = [];
        
        paragraphs.forEach((paragraph, index) => {
            if (!paragraph.trim()) return;
            
            currentCard.push(paragraph + '</p>');
            
            // 每3个段落或最后一段时创建一张卡片
            if (currentCard.length >= 3 || index === paragraphs.length - 1) {
                cards.push(currentCard.join(''));
                currentCard = [];
            }
        });
        
        return cards.length > 0 ? cards : [html];
    }

    generateCurrentPageCards() {
        if (!this.xiaohongshuGrid) return;
        
        this.xiaohongshuGrid.innerHTML = '';
        
        if (this.splitContent[this.currentPage]) {
            const cardContent = this.splitContent[this.currentPage];
            const card = this.createXiaohongshuCard(cardContent);
            this.xiaohongshuGrid.appendChild(card);
        }
    }

    createXiaohongshuCard(content) {
        const card = document.createElement('div');
        card.className = 'card xiaohongshu-template ' + this.currentTheme + '-theme';
        
        const cardInner = document.createElement('div');
        cardInner.className = 'card-content';
        cardInner.innerHTML = content;
        
        // 应用字体
        if (this.fontSelect) {
            const fontValue = this.fontSelect.value;
            if (fontValue && fontValue !== 'default') {
                cardInner.style.fontFamily = fontValue;
            }
        }
        
        // 应用背景图
        if (this.customBackgroundImage) {
            card.style.backgroundImage = `url('${this.customBackgroundImage}')`;
            card.style.backgroundSize = 'cover';
            card.style.backgroundPosition = 'center';
        }
        
        // 应用背景颜色
        if (this.customBackgroundColor) {
            card.style.backgroundColor = this.customBackgroundColor;
        }
        
        // 应用内容背景透明度
        if (cardInner) {
            cardInner.style.opacity = this.contentBackgroundOpacity;
        }
        
        card.appendChild(cardInner);
        return card;
    }

    generateLongImage(htmlText) {
        if (!this.cardContent) return;
        
        this.cardContent.innerHTML = htmlText;
        
        // 应用字体
        if (this.fontSelect && this.cardContent) {
            const fontValue = this.fontSelect.value;
            if (fontValue && fontValue !== 'default') {
                this.cardContent.style.fontFamily = fontValue;
            }
        }
        
        // 应用背景图
        if (this.cardPreview && this.customBackgroundImage) {
            this.cardPreview.style.backgroundImage = `url('${this.customBackgroundImage}')`;
            this.cardPreview.style.backgroundSize = 'cover';
            this.cardPreview.style.backgroundPosition = 'center';
        }
        
        // 应用背景颜色
        if (this.cardPreview && this.customBackgroundColor) {
            this.cardPreview.style.backgroundColor = this.customBackgroundColor;
        }
        
        // 应用内容背景透明度
        if (this.cardContent) {
            this.cardContent.style.opacity = this.contentBackgroundOpacity;
        }
    }

    updatePagination() {
        if (!this.pageInfo) return;
        
        this.pageInfo.textContent = `第 ${this.currentPage + 1} 页，共 ${this.totalPages} 页`;
        
        if (this.paginationControls) {
            this.paginationControls.style.display = this.totalPages > 1 ? 'flex' : 'none';
        }
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.generateCurrentPageCards();
            this.updatePagination();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.generateCurrentPageCards();
            this.updatePagination();
        }
    }

    downloadAllCards() {
        if (this.splitContent.length === 0) {
            alert('没有可下载的卡片内容');
            return;
        }
        
        this.splitContent.forEach((content, index) => {
            this.downloadCard(content, index + 1);
        });
    }

    downloadCard(content, index) {
        const card = this.createXiaohongshuCard(content);
        document.body.appendChild(card);
        
        html2canvas(card).then(canvas => {
            const link = document.createElement('a');
            link.download = `小红书卡片_${index}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            document.body.removeChild(card);
        });
    }

    exportAsZip() {
        if (this.splitContent.length === 0) {
            alert('没有可导出的卡片内容');
            return;
        }
        
        const zip = new JSZip();
        const promises = [];
        
        this.splitContent.forEach((content, index) => {
            const promise = new Promise((resolve) => {
                const card = this.createXiaohongshuCard(content);
                document.body.appendChild(card);
                
                html2canvas(card).then(canvas => {
                    canvas.toBlob((blob) => {
                        zip.file(`小红书卡片_${index + 1}.png`, blob);
                        document.body.removeChild(card);
                        resolve();
                    });
                });
            });
            promises.push(promise);
        });
        
        Promise.all(promises).then(() => {
            zip.generateAsync({ type: 'blob' }).then((blob) => {
                const link = document.createElement('a');
                link.download = '小红书卡片.zip';
                link.href = URL.createObjectURL(blob);
                link.click();
            });
        });
    }

    batchProcessFiles() {
        alert('批量处理功能开发中，敬请期待！');
    }

    readMarkdownFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (this.markdownInput) {
                this.markdownInput.value = event.target.result;
            }
            this.updatePreview();
        };
        reader.readAsText(file);
    }

    readMarkdownFolder(files) {
        const markdownFiles = Array.from(files).filter(file => 
            file.name.endsWith('.md') || file.name.endsWith('.markdown')
        );
        
        if (markdownFiles.length === 0) {
            alert('未找到Markdown文件');
            return;
        }
        
        // 处理第一个文件
        this.readMarkdownFile(markdownFiles[0]);
        
        if (markdownFiles.length > 1) {
            alert(`找到 ${markdownFiles.length} 个Markdown文件，已加载第一个文件`);
        }
    }

    changeTheme(theme) {
        this.currentTheme = theme;
        this.updatePreview();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    new MD2Card();
});