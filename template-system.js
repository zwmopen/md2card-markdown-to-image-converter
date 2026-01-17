// 模板系统
class TemplateSystem {
    constructor() {
        this.templates = this.initTemplates();
        this.customTemplates = this.loadCustomTemplates();
    }

    initTemplates() {
        return {
            'xiaohongshu-lifestyle': {
                name: '小红书生活分享',
                category: '生活',
                preview: '🌸 生活分享模板',
                template: `# 🌸 {{title}}

## ✨ 今日分享

{{content}}

### 📝 使用心得
- **优点**：{{pros}}
- **注意**：{{tips}}

### 🏷️ 标签
#{{tag1}} #{{tag2}} #{{tag3}}

---
💕 **记得点赞收藏哦~**`,
                fields: [
                    { key: 'title', label: '标题', type: 'text', placeholder: '今日好物推荐' },
                    { key: 'content', label: '主要内容', type: 'textarea', placeholder: '分享你的发现...' },
                    { key: 'pros', label: '优点', type: 'text', placeholder: '质量很好，性价比高' },
                    { key: 'tips', label: '小贴士', type: 'text', placeholder: '建议提前预定' },
                    { key: 'tag1', label: '标签1', type: 'text', placeholder: '好物推荐' },
                    { key: 'tag2', label: '标签2', type: 'text', placeholder: '生活分享' },
                    { key: 'tag3', label: '标签3', type: 'text', placeholder: '种草' }
                ]
            },
            'xiaohongshu-beauty': {
                name: '小红书美妆教程',
                category: '美妆',
                preview: '💄 美妆教程模板',
                template: `# 💄 {{title}}

## 🎨 妆容重点

{{description}}

### 📋 产品清单
{{products}}

### 💡 化妆步骤
1. **底妆**：{{step1}}
2. **眼妆**：{{step2}}  
3. **唇妆**：{{step3}}
4. **定妆**：{{step4}}

### ⚠️ 小贴士
> {{tips}}

### 🏷️ 标签  
#{{tag1}} #{{tag2}} #{{tag3}}

---
✨ **变美路上一起加油~**`,
                fields: [
                    { key: 'title', label: '妆容名称', type: 'text', placeholder: '日常通勤妆' },
                    { key: 'description', label: '妆容描述', type: 'textarea', placeholder: '适合日常上班的清淡妆容...' },
                    { key: 'products', label: '产品清单', type: 'textarea', placeholder: '- 粉底液：YSL\n- 眼影盘：Urban Decay' },
                    { key: 'step1', label: '底妆步骤', type: 'text', placeholder: '先用妆前乳，再上粉底液' },
                    { key: 'step2', label: '眼妆步骤', type: 'text', placeholder: '大地色眼影打底，深色加深' },
                    { key: 'step3', label: '唇妆步骤', type: 'text', placeholder: '先用唇膏打底，再涂口红' },
                    { key: 'step4', label: '定妆步骤', type: 'text', placeholder: '散粉定妆，喷定妆喷雾' },
                    { key: 'tips', label: '小贴士', type: 'text', placeholder: '记得卸妆要彻底哦' },
                    { key: 'tag1', label: '标签1', type: 'text', placeholder: '美妆教程' },
                    { key: 'tag2', label: '标签2', type: 'text', placeholder: '日常妆容' },
                    { key: 'tag3', label: '标签3', type: 'text', placeholder: '新手友好' }
                ]
            },
            'xiaohongshu-food': {
                name: '小红书美食分享',
                category: '美食',
                preview: '🍰 美食分享模板',
                template: `# 🍰 {{title}}

## 😋 美食介绍

{{description}}

### 📍 店铺信息
- **店名**：{{shopName}}
- **地址**：{{address}}
- **人均**：{{price}}
- **推荐指数**：{{rating}}

### 🍽️ 必点推荐
{{recommendations}}

### 💰 性价比分析
{{analysis}}

### 🏷️ 标签
#{{tag1}} #{{tag2}} #{{tag3}}

---
🤤 **吃货们冲鸭~**`,
                fields: [
                    { key: 'title', label: '美食标题', type: 'text', placeholder: '这家店的蛋糕绝了！' },
                    { key: 'description', label: '美食描述', type: 'textarea', placeholder: '偶然发现的宝藏甜品店...' },
                    { key: 'shopName', label: '店铺名称', type: 'text', placeholder: '甜蜜时光烘焙坊' },
                    { key: 'address', label: '店铺地址', type: 'text', placeholder: '朝阳区三里屯' },
                    { key: 'price', label: '人均消费', type: 'text', placeholder: '80-120元' },
                    { key: 'rating', label: '推荐指数', type: 'text', placeholder: '⭐⭐⭐⭐⭐' },
                    { key: 'recommendations', label: '推荐菜品', type: 'textarea', placeholder: '- 草莓蛋糕：颜值超高\n- 提拉米苏：口感丰富' },
                    { key: 'analysis', label: '性价比', type: 'text', placeholder: '价格适中，分量足，值得回购' },
                    { key: 'tag1', label: '标签1', type: 'text', placeholder: '美食探店' },
                    { key: 'tag2', label: '标签2', type: 'text', placeholder: '甜品推荐' },
                    { key: 'tag3', label: '标签3', type: 'text', placeholder: '三里屯' }
                ]
            },
            'study-notes': {
                name: '学习笔记',
                category: '学习',
                preview: '📚 学习笔记模板',
                template: `# 📚 {{subject}} - {{topic}}

## 🎯 学习目标
{{objectives}}

## 📖 核心内容

### 重点概念
{{concepts}}

### 关键公式/定理
{{formulas}}

### 实例分析
{{examples}}

## 💡 学习心得
{{insights}}

## 🔄 复习要点
{{review}}

---
📝 **学习日期**：{{date}}`,
                fields: [
                    { key: 'subject', label: '学科', type: 'text', placeholder: '数学' },
                    { key: 'topic', label: '主题', type: 'text', placeholder: '微积分基础' },
                    { key: 'objectives', label: '学习目标', type: 'textarea', placeholder: '掌握导数的基本概念和计算方法' },
                    { key: 'concepts', label: '重点概念', type: 'textarea', placeholder: '- 导数的定义\n- 导数的几何意义' },
                    { key: 'formulas', label: '关键公式', type: 'textarea', placeholder: '- f\'(x) = lim[h→0] [f(x+h)-f(x)]/h' },
                    { key: 'examples', label: '实例分析', type: 'textarea', placeholder: '求 f(x) = x² 的导数...' },
                    { key: 'insights', label: '学习心得', type: 'textarea', placeholder: '导数反映了函数的变化率...' },
                    { key: 'review', label: '复习要点', type: 'textarea', placeholder: '- 熟记基本导数公式\n- 多做练习题' },
                    { key: 'date', label: '学习日期', type: 'date', placeholder: '' }
                ]
            },
            'work-summary': {
                name: '工作总结',
                category: '工作',
                preview: '💼 工作总结模板',
                template: `# 💼 {{period}} 工作总结

## 📊 工作概况
{{overview}}

## ✅ 主要成果
{{achievements}}

## 📈 数据表现
{{metrics}}

## 🎯 重点项目
### {{project1}}
{{project1_desc}}

### {{project2}}  
{{project2_desc}}

## 💡 经验总结
{{lessons}}

## 🚀 下期计划
{{plans}}

---
📅 **总结时间**：{{date}}`,
                fields: [
                    { key: 'period', label: '时间周期', type: 'text', placeholder: '2024年第一季度' },
                    { key: 'overview', label: '工作概况', type: 'textarea', placeholder: '本季度主要负责产品开发和团队管理...' },
                    { key: 'achievements', label: '主要成果', type: 'textarea', placeholder: '- 完成3个重要项目\n- 团队效率提升20%' },
                    { key: 'metrics', label: '数据表现', type: 'textarea', placeholder: '- 项目按时完成率：95%\n- 客户满意度：4.8/5' },
                    { key: 'project1', label: '重点项目1', type: 'text', placeholder: 'APP改版项目' },
                    { key: 'project1_desc', label: '项目1描述', type: 'textarea', placeholder: '负责整体UI/UX设计，用户体验显著提升' },
                    { key: 'project2', label: '重点项目2', type: 'text', placeholder: '团队建设' },
                    { key: 'project2_desc', label: '项目2描述', type: 'textarea', placeholder: '组织团建活动，加强团队凝聚力' },
                    { key: 'lessons', label: '经验总结', type: 'textarea', placeholder: '沟通的重要性，提前规划的必要性' },
                    { key: 'plans', label: '下期计划', type: 'textarea', placeholder: '- 启动新产品线\n- 扩大团队规模' },
                    { key: 'date', label: '总结日期', type: 'date', placeholder: '' }
                ]
            }
        };
    }

    loadCustomTemplates() {
        const saved = localStorage.getItem('md2card-custom-templates');
        return saved ? JSON.parse(saved) : {};
    }

    saveCustomTemplates() {
        localStorage.setItem('md2card-custom-templates', JSON.stringify(this.customTemplates));
    }

    getAllTemplates() {
        return { ...this.templates, ...this.customTemplates };
    }

    getTemplatesByCategory(category) {
        const allTemplates = this.getAllTemplates();
        return Object.entries(allTemplates)
            .filter(([_, template]) => template.category === category)
            .reduce((acc, [key, template]) => {
                acc[key] = template;
                return acc;
            }, {});
    }

    getTemplate(id) {
        return this.getAllTemplates()[id];
    }

    renderTemplate(templateId, data) {
        const template = this.getTemplate(templateId);
        if (!template) return '';

        let content = template.template;
        
        // 替换模板变量
        template.fields.forEach(field => {
            const value = data[field.key] || '';
            const regex = new RegExp(`{{${field.key}}}`, 'g');
            content = content.replace(regex, value);
        });

        // 处理日期字段
        if (data.date && !data.date.includes('{{')) {
            content = content.replace(/{{date}}/g, data.date);
        } else {
            content = content.replace(/{{date}}/g, new Date().toLocaleDateString('zh-CN'));
        }

        return content;
    }

    createTemplate(id, templateData) {
        this.customTemplates[id] = templateData;
        this.saveCustomTemplates();
    }

    deleteTemplate(id) {
        if (this.customTemplates[id]) {
            delete this.customTemplates[id];
            this.saveCustomTemplates();
            return true;
        }
        return false;
    }

    exportTemplates() {
        return JSON.stringify(this.customTemplates, null, 2);
    }

    importTemplates(jsonData) {
        try {
            const templates = JSON.parse(jsonData);
            Object.assign(this.customTemplates, templates);
            this.saveCustomTemplates();
            return true;
        } catch (error) {
            console.error('导入模板失败:', error);
            return false;
        }
    }

    getCategories() {
        const allTemplates = this.getAllTemplates();
        const categories = new Set();
        Object.values(allTemplates).forEach(template => {
            categories.add(template.category);
        });
        return Array.from(categories);
    }
}