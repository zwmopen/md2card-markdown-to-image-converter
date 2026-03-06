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
        this.exportBtn = document.getElementById('exportBtn');
        this.exportZipBtn = document.getElementById('exportZipBtn');
    }

    initEventListeners() {
        // Markdown输入监听
        if (this.markdownInput) {
            this.markdownInput.addEventListener('input', () => this.updatePreview());
        }
        
        // 模板选择
        if (this.templateSelect) {
            this.templateSelect.addEventListener('change', () => this.updatePreview());
        }
        
        // 导出按钮
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportCard());
        }
        
        if (this.exportZipBtn) {
            this.exportZipBtn.addEventListener('click', () => this.exportZip());
        }
    }

    initMarked() {
        // 配置Marked.js
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    initTemplates() {
        this.templates = {
            xiaohongshu: {
                name: '小红书经典',
                className: 'xiaohongshu-template'
            },
            minimal: {
                name: '极简风格',
                className: 'minimal-template'
            },
            gradient: {
                name: '渐变背景',
                className: 'gradient-template'
            }
        };
    }

    setDefaultXiaohongshuMode() {
        // 默认显示小红书模式
        if (this.longImageArea) {
            this.longImageArea.style.display = 'none';
        }
    }

    updatePreview() {
        if (!this.markdownInput || !this.xiaohongshuGrid) return;
        
        const markdown = this.markdownInput.value;
        const html = marked.parse(markdown);
        
        // 清空网格
        this.xiaohongshuGrid.innerHTML = '';
        
        // 创建小红书卡片
        const card = document.createElement('div');
        card.className = 'card xiaohongshu-template red-theme';
        card.style.width = '400px';
        card.style.height = '533px';
        card.style.backgroundColor = '#ffffff';
        card.style.padding = '20px';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        cardContent.innerHTML = html;
        
        card.appendChild(cardContent);
        this.xiaohongshuGrid.appendChild(card);
    }

    exportCard() {
        alert('导出功能开发中');
    }

    exportZip() {
        alert('导出ZIP功能开发中');
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    new MD2Card();
});