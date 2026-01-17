// 动画效果系统
class AnimationEffects {
    constructor() {
        this.animations = {
            fadeIn: 'fadeIn 0.5s ease-in-out',
            slideIn: 'slideIn 0.5s ease-out',
            zoomIn: 'zoomIn 0.3s ease-out',
            flipIn: 'flipIn 0.6s ease-in-out',
            bounceIn: 'bounceIn 0.8s ease-out',
            slideUp: 'slideUp 0.4s ease-out',
            pulse: 'pulse 2s infinite',
            shake: 'shake 0.5s ease-in-out'
        };
        this.initAnimationStyles();
    }

    initAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 淡入动画 */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            /* 滑入动画 */
            @keyframes slideIn {
                from { 
                    transform: translateX(-100%); 
                    opacity: 0; 
                }
                to { 
                    transform: translateX(0); 
                    opacity: 1; 
                }
            }

            /* 缩放动画 */
            @keyframes zoomIn {
                from { 
                    transform: scale(0.8); 
                    opacity: 0; 
                }
                to { 
                    transform: scale(1); 
                    opacity: 1; 
                }
            }

            /* 翻转动画 */
            @keyframes flipIn {
                from { 
                    transform: perspective(400px) rotateY(-90deg); 
                    opacity: 0; 
                }
                to { 
                    transform: perspective(400px) rotateY(0deg); 
                    opacity: 1; 
                }
            }

            /* 弹跳动画 */
            @keyframes bounceIn {
                0% { 
                    transform: scale(0.3); 
                    opacity: 0; 
                }
                50% { 
                    transform: scale(1.05); 
                    opacity: 0.8; 
                }
                70% { 
                    transform: scale(0.9); 
                    opacity: 0.9; 
                }
                100% { 
                    transform: scale(1); 
                    opacity: 1; 
                }
            }

            /* 上滑动画 */
            @keyframes slideUp {
                from { 
                    transform: translateY(30px); 
                    opacity: 0; 
                }
                to { 
                    transform: translateY(0); 
                    opacity: 1; 
                }
            }

            /* 脉搏动画 */
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            /* 摇摆动画 */
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }

            /* 卡片切换动画 */
            @keyframes cardFlip {
                0% { transform: rotateY(0deg); }
                50% { transform: rotateY(-90deg); }
                100% { transform: rotateY(0deg); }
            }

            @keyframes cardSlide {
                0% { transform: translateX(0); opacity: 1; }
                50% { transform: translateX(-100%); opacity: 0; }
                51% { transform: translateX(100%); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
            }

            /* 加载动画 */
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes dots {
                0%, 20% { color: rgba(0,0,0,0); text-shadow: .25em 0 0 rgba(0,0,0,0), .5em 0 0 rgba(0,0,0,0); }
                40% { color: black; text-shadow: .25em 0 0 rgba(0,0,0,0), .5em 0 0 rgba(0,0,0,0); }
                60% { text-shadow: .25em 0 0 black, .5em 0 0 rgba(0,0,0,0); }
                80%, 100% { text-shadow: .25em 0 0 black, .5em 0 0 black; }
            }

            /* 悬停效果 */
            .hover-lift {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }

            .hover-lift:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            }

            .hover-glow {
                transition: box-shadow 0.3s ease;
            }

            .hover-glow:hover {
                box-shadow: 0 0 20px rgba(103, 126, 234, 0.5);
            }

            /* 页面切换动画 */
            .page-transition-enter {
                animation: slideIn 0.5s ease-out;
            }

            .page-transition-exit {
                animation: slideOut 0.5s ease-in;
            }

            @keyframes slideOut {
                from { 
                    transform: translateX(0); 
                    opacity: 1; 
                }
                to { 
                    transform: translateX(100%); 
                    opacity: 0; 
                }
            }

            /* 通知动画 */
            .notification-enter {
                animation: slideInRight 0.3s ease-out;
            }

            .notification-exit {
                animation: slideOutRight 0.3s ease-in;
            }

            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }

            /* 模态框动画 */
            .modal-backdrop {
                animation: fadeIn 0.3s ease-out;
            }

            .modal-content {
                animation: zoomIn 0.3s ease-out;
            }

            /* 工具提示动画 */
            .tooltip {
                animation: fadeIn 0.2s ease-out;
            }

            /* 进度条动画 */
            @keyframes progressBar {
                0% { width: 0%; }
                100% { width: var(--progress-width); }
            }

            .progress-bar {
                animation: progressBar 1s ease-out;
            }
        `;
        document.head.appendChild(style);
    }

    animate(element, animationType, options = {}) {
        if (!element || !this.animations[animationType]) {
            console.warn('Invalid element or animation type');
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const {
                duration = null,
                delay = 0,
                easing = null,
                onComplete = null
            } = options;

            // 设置动画
            let animation = this.animations[animationType];
            
            if (duration) {
                animation = animation.replace(/[\d.]+s/, duration);
            }
            
            if (easing) {
                animation = animation.replace(/ease-[\w-]+|ease|linear/, easing);
            }

            element.style.animation = animation;
            
            if (delay > 0) {
                element.style.animationDelay = `${delay}ms`;
            }

            // 监听动画结束
            const handleAnimationEnd = () => {
                element.style.animation = '';
                element.style.animationDelay = '';
                element.removeEventListener('animationend', handleAnimationEnd);
                
                if (onComplete) {
                    onComplete();
                }
                resolve();
            };

            element.addEventListener('animationend', handleAnimationEnd);
        });
    }

    // 卡片切换动画
    async switchCard(oldCard, newCard, type = 'slide') {
        if (!oldCard || !newCard) return;

        switch (type) {
            case 'slide':
                await this.animate(oldCard, 'slideOut', { duration: '0.3s' });
                oldCard.style.display = 'none';
                newCard.style.display = 'block';
                await this.animate(newCard, 'slideIn', { duration: '0.3s' });
                break;
                
            case 'flip':
                oldCard.style.animation = 'cardFlip 0.6s ease-in-out';
                setTimeout(() => {
                    oldCard.style.display = 'none';
                    newCard.style.display = 'block';
                    newCard.style.animation = 'cardFlip 0.6s ease-in-out reverse';
                }, 300);
                break;
                
            case 'fade':
                await this.animate(oldCard, 'fadeOut', { duration: '0.3s' });
                oldCard.style.display = 'none';
                newCard.style.display = 'block';
                await this.animate(newCard, 'fadeIn', { duration: '0.3s' });
                break;
        }
    }

    // 页面加载动画
    pageLoadAnimation(elements) {
        elements.forEach((element, index) => {
            this.animate(element, 'slideUp', {
                delay: index * 100,
                duration: '0.5s'
            });
        });
    }

    // 按钮点击效果
    buttonClickEffect(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    // 错误摇摆动画
    errorShake(element) {
        this.animate(element, 'shake');
    }

    // 成功脉搏动画
    successPulse(element) {
        this.animate(element, 'pulse', { duration: '0.5s' });
    }

    // 加载动画
    showLoading(element, text = '加载中') {
        element.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <span class="loading-text">${text}</span>
            </div>
        `;
        
        const spinner = element.querySelector('.loading-spinner');
        if (spinner) {
            spinner.style.animation = 'spin 1s linear infinite';
        }
    }

    hideLoading(element, originalContent) {
        element.innerHTML = originalContent;
    }

    // 进度条动画
    animateProgressBar(element, targetWidth) {
        element.style.setProperty('--progress-width', targetWidth + '%');
        element.classList.add('progress-bar');
    }

    // 数字计数动画
    animateNumber(element, start, end, duration = 1000) {
        const startTime = performance.now();
        const difference = end - start;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (difference * this.easeOutQuart(progress));
            element.textContent = Math.round(current);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }

    // 缓动函数
    easeOutQuart(t) {
        return 1 - (--t) * t * t * t;
    }

    // 添加悬停效果
    addHoverEffect(element, type = 'lift') {
        element.classList.add(`hover-${type}`);
    }

    // 移除悬停效果
    removeHoverEffect(element, type = 'lift') {
        element.classList.remove(`hover-${type}`);
    }

    // 创建粒子效果
    createParticleEffect(container, options = {}) {
        const {
            count = 20,
            colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
            duration = 2000
        } = options;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
            `;

            const rect = container.getBoundingClientRect();
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;

            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';

            document.body.appendChild(particle);

            // 随机方向和距离
            const angle = (Math.PI * 2 * i) / count;
            const distance = 50 + Math.random() * 100;
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance;

            particle.animate([
                { 
                    transform: 'translate(0, 0) scale(1)', 
                    opacity: 1 
                },
                { 
                    transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, 
                    opacity: 0 
                }
            ], {
                duration: duration,
                easing: 'ease-out'
            }).onfinish = () => {
                document.body.removeChild(particle);
            };
        }
    }
}