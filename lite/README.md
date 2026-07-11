# MD2Card Lite

面向日常直接使用的纯前端轻量版。

## 能力

- Markdown 实时预览
- 自动分页
- 纸张、暖色、深色三种主题
- 3:4、4:5、1:1 三种比例
- 字号调整
- 单页 PNG 导出
- 全部页面 ZIP 导出
- Markdown 文件导入
- 浏览器本地自动保存
- 响应式手机/桌面布局

## 隐私

页面没有后端请求，也不上传 Markdown 内容。远程图片默认不会加载，只允许 `data:` 或 `blob:` 本地图片。页面依赖 jsDelivr 加载 Marked、html2canvas 和 JSZip 三个浏览器库。

## 本地使用

直接打开 `index.html` 即可。由于浏览器库来自 CDN，首次加载需要联网。

## 部署

仓库根目录的 `netlify.toml` 已配置：

```toml
[build]
  publish = "lite"
```

Netlify 只发布该目录，不会公开仓库中的渲染服务或其他源文件。
