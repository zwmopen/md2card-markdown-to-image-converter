// 高级编辑器功能模块
class AdvancedEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            theme: 'default',
            autoSave: true,
            spellCheck: true,
            lineNumbers: false,
            ...options
        };
        this.init();
    }

    init() {
        this.createToolbar();
        this.createEditor();
        this.bindEvents();
        if (this.options.autoSave) {
            this.enableAutoSave();
        }
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-group">
                <button class="toolbar-btn" data-action="bold" title="粗体 (Ctrl+B)">
                    <i class="fas fa-bold"></i>
                </button>
                <button class="toolbar-btn" data-action="italic" title="斜体 (Ctrl+I)">
                    <i class="fas fa-italic"></i>
                </button>
                <button class="toolbar-btn" data-action="strikethrough" title="删除线">
                    <i class="fas fa-strikethrough"></i>
                </button>
            </div>
            <div class="toolbar-group">
                <button class="toolbar-btn" data-action="heading" title="标题">
                    <i class="fas fa-heading"></i>
                </button>
                <button class="toolbar-btn" data-action="quote" title="引用">
                    <i class="fas fa-quote-left"></i>
                </button>
                <button class="toolbar-btn" data-action="code" title="代码">
                    <i class="fas fa-code"></i>
                </button>
            </div>
            <div class="toolbar-group">
                <button class="toolbar-btn" data-action="list" title="列表">
                    <i class="fas fa-list-ul"></i>
                </button>
                <button class="toolbar-btn" data-action="ordered-list" title="有序列表">
                    <i class="fas fa-list-ol"></i>
                </button>
                <button class="toolbar-btn" data-action="link" title="链接">
                    <i class="fas fa-link"></i>
                </button>
            </div>
            <div class="toolbar-group">
                <button class="toolbar-btn" data-action="table" title="表格">
                    <i class="fas fa-table"></i>
                </button>
                <button class="toolbar-btn" data-action="emoji" title="表情">
                    <i class="fas fa-smile"></i>
                </button>
                <button class="toolbar-btn" data-action="fullscreen" title="全屏">
                    <i class="fas fa-expand"></i>
                </button>
            </div>
        `;
        this.container.appendChild(toolbar);
        this.toolbar = toolbar;
    }

    createEditor() {
        const editorWrapper = document.createElement('div');
        editorWrapper.className = 'editor-wrapper';
        
        const editor = document.createElement('textarea');
        editor.className = 'advanced-editor';
        editor.placeholder = '开始输入你的内容...';
        
        if (this.options.lineNumbers) {
            const lineNumbers = document.createElement('div');
            lineNumbers.className = 'line-numbers';
            editorWrapper.appendChild(lineNumbers);
            this.lineNumbers = lineNumbers;
        }
        
        editorWrapper.appendChild(editor);
        this.container.appendChild(editorWrapper);
        this.editor = editor;
        
        this.updateLineNumbers();
    }

    bindEvents() {
        // 工具栏按钮事件
        this.toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('.toolbar-btn');
            if (btn) {
                const action = btn.dataset.action;
                this.executeAction(action);
            }
        });

        // 编辑器事件
        this.editor.addEventListener('input', () => {
            this.updateLineNumbers();
            this.onContentChange();
        });

        this.editor.addEventListener('scroll', () => {
            if (this.lineNumbers) {
                this.lineNumbers.scrollTop = this.editor.scrollTop;
            }
        });

        // 快捷键
        this.editor.addEventListener('keydown', (e) => {
            this.handleShortcuts(e);
        });

        // 拖拽上传
        this.editor.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.editor.classList.add('drag-over');
        });

        this.editor.addEventListener('dragleave', () => {
            this.editor.classList.remove('drag-over');
        });

        this.editor.addEventListener('drop', (e) => {
            e.preventDefault();
            this.editor.classList.remove('drag-over');
            this.handleFileDrop(e);
        });
    }

    executeAction(action) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const selectedText = this.editor.value.substring(start, end);
        let replacement = '';

        switch (action) {
            case 'bold':
                replacement = `**${selectedText || '粗体文本'}**`;
                break;
            case 'italic':
                replacement = `*${selectedText || '斜体文本'}*`;
                break;
            case 'strikethrough':
                replacement = `~~${selectedText || '删除线文本'}~~`;
                break;
            case 'heading':
                replacement = `# ${selectedText || '标题'}`;
                break;
            case 'quote':
                replacement = `> ${selectedText || '引用文本'}`;
                break;
            case 'code':
                replacement = selectedText.includes('\n') 
                    ? `\`\`\`\n${selectedText || '代码块'}\n\`\`\``
                    : `\`${selectedText || '代码'}\``;
                break;
            case 'list':
                replacement = `- ${selectedText || '列表项'}`;
                break;
            case 'ordered-list':
                replacement = `1. ${selectedText || '列表项'}`;
                break;
            case 'link':
                replacement = `[${selectedText || '链接文本'}](https://example.com)`;
                break;
            case 'table':
                replacement = `| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |`;
                break;
            case 'emoji':
                this.showEmojiPicker();
                return;
            case 'fullscreen':
                this.toggleFullscreen();
                return;
        }

        this.insertText(replacement, start, end);
    }

    insertText(text, start, end) {
        const value = this.editor.value;
        const newValue = value.substring(0, start) + text + value.substring(end);
        this.editor.value = newValue;
        
        // 设置光标位置
        const newCursorPos = start + text.length;
        this.editor.setSelectionRange(newCursorPos, newCursorPos);
        this.editor.focus();
        
        this.onContentChange();
    }

    handleShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    this.executeAction('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.executeAction('italic');
                    break;
                case 'k':
                    e.preventDefault();
                    this.executeAction('link');
                    break;
            }
        }

        // Tab键处理
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.editor.selectionStart;
            const end = this.editor.selectionEnd;
            this.insertText('    ', start, end);
        }
    }

    handleFileDrop(e) {
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                this.handleImageUpload(file);
            }
        });
    }

    handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            const imageName = file.name;
            const markdown = `![${imageName}](${imageData})`;
            
            const start = this.editor.selectionStart;
            this.insertText(markdown, start, start);
        };
        reader.readAsDataURL(file);
    }

    updateLineNumbers() {
        if (!this.lineNumbers) return;
        
        const lines = this.editor.value.split('\n').length;
        const lineNumbersHtml = Array.from({length: lines}, (_, i) => 
            `<div class="line-number">${i + 1}</div>`
        ).join('');
        
        this.lineNumbers.innerHTML = lineNumbersHtml;
    }

    showEmojiPicker() {
        const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'];
        
        const picker = document.createElement('div');
        picker.className = 'emoji-picker';
        picker.innerHTML = emojis.map(emoji => 
            `<span class="emoji-item" data-emoji="${emoji}">${emoji}</span>`
        ).join('');
        
        picker.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji-item')) {
                const emoji = e.target.dataset.emoji;
                const start = this.editor.selectionStart;
                this.insertText(emoji, start, start);
                document.body.removeChild(picker);
            }
        });
        
        // 点击外部关闭
        setTimeout(() => {
            document.addEventListener('click', function closeEmojiPicker(e) {
                if (!picker.contains(e.target)) {
                    if (document.body.contains(picker)) {
                        document.body.removeChild(picker);
                    }
                    document.removeEventListener('click', closeEmojiPicker);
                }
            });
        }, 100);
        
        document.body.appendChild(picker);
        
        // 定位到按钮附近
        const emojiBtn = this.toolbar.querySelector('[data-action="emoji"]');
        const rect = emojiBtn.getBoundingClientRect();
        picker.style.position = 'fixed';
        picker.style.top = rect.bottom + 5 + 'px';
        picker.style.left = rect.left + 'px';
    }

    toggleFullscreen() {
        this.container.classList.toggle('fullscreen');
        const btn = this.toolbar.querySelector('[data-action="fullscreen"]');
        const icon = btn.querySelector('i');
        
        if (this.container.classList.contains('fullscreen')) {
            icon.className = 'fas fa-compress';
            btn.title = '退出全屏';
        } else {
            icon.className = 'fas fa-expand';
            btn.title = '全屏';
        }
    }

    enableAutoSave() {
        let saveTimeout;
        this.onContentChange = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                this.saveToLocalStorage();
            }, 1000);
        };
        
        // 页面加载时恢复内容
        this.loadFromLocalStorage();
    }

    saveToLocalStorage() {
        const content = this.editor.value;
        localStorage.setItem('md2card-content', content);
        localStorage.setItem('md2card-timestamp', Date.now().toString());
    }

    loadFromLocalStorage() {
        const content = localStorage.getItem('md2card-content');
        if (content) {
            this.editor.value = content;
            this.updateLineNumbers();
        }
    }

    getValue() {
        return this.editor.value;
    }

    setValue(value) {
        this.editor.value = value;
        this.updateLineNumbers();
        this.onContentChange();
    }

    focus() {
        this.editor.focus();
    }

    onContentChange() {
        // 子类可以重写此方法
    }
}