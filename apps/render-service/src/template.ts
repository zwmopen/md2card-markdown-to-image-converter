import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

import type { RenderRequest } from "./contracts.js";

const THEMES: Record<string, { background: string; color: string; accent: string; surface: string }> = {
  xiaohongshu: { background: "#ffffff", color: "#242424", accent: "#ff2442", surface: "rgba(255,255,255,.94)" },
  minimal: { background: "#ffffff", color: "#202124", accent: "#202124", surface: "rgba(255,255,255,.96)" },
  gradient: { background: "linear-gradient(145deg,#fff1f4,#eef4ff)", color: "#202124", accent: "#6c5ce7", surface: "rgba(255,255,255,.78)" },
  dark: { background: "#171717", color: "#f5f5f5", accent: "#9ec5ff", surface: "rgba(20,20,20,.9)" },
  tech: { background: "linear-gradient(145deg,#08111f,#12294a)", color: "#e6f7ff", accent: "#21d4fd", surface: "rgba(8,17,31,.88)" },
  warm: { background: "#fff3df", color: "#493829", accent: "#e76f51", surface: "rgba(255,250,240,.9)" },
  nature: { background: "#eff7ed", color: "#25412f", accent: "#4f772d", surface: "rgba(248,255,246,.9)" },
  business: { background: "#f8fafc", color: "#172033", accent: "#1d4ed8", surface: "rgba(255,255,255,.94)" },
};

function sanitizeRenderedHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "blockquote", "pre", "code",
      "strong", "em", "del", "ul", "ol", "li", "a", "img", "table", "thead", "tbody", "tr", "th", "td",
      "sup", "sub", "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "title", "width", "height"],
      code: ["class"],
      span: ["class"],
      div: ["class"],
      th: ["align"],
      td: ["align"],
    },
    allowedSchemes: ["http", "https", "data"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
  });
}

export function markdownToSafeHtml(markdown: string): string {
  marked.setOptions({ gfm: true, breaks: true });
  return sanitizeRenderedHtml(String(marked.parse(markdown)));
}

function splitByHorizontalRule(markdown: string): string[] {
  const parts = markdown
    .split(/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/m)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : [markdown];
}

function jsonForInlineScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

function cssValue(value: string): string {
  return value.replace(/[;{}]/g, "");
}

export function buildRenderHtml(request: RenderRequest): string {
  const requestedTheme = THEMES[request.theme] ?? THEMES.xiaohongshu;
  const theme = request.themeMode === "dark" && request.theme !== "dark"
    ? THEMES.dark
    : requestedTheme;
  const pageHtml = request.splitMode === "hr"
    ? splitByHorizontalRule(request.markdown).map(markdownToSafeHtml)
    : [markdownToSafeHtml(request.markdown)];
  const sourceHtml = pageHtml[0] ?? "";
  const configuredPages = request.splitMode === "hr" ? pageHtml : [];

  return `<!doctype html>
<html lang="zh-CN" data-ready="false">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MD2Card Render</title>
<style>
  :root{--card-width:${request.width}px;--card-height:${request.height}px;--card-bg:${cssValue(theme.background)};--card-color:${cssValue(theme.color)};--card-accent:${cssValue(theme.accent)};--card-surface:${cssValue(theme.surface)}}
  *{box-sizing:border-box}html,body{margin:0;padding:0;background:transparent}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif;color:var(--card-color)}
  #pages{display:flex;flex-direction:column;align-items:flex-start;gap:24px;padding:0}.md2card-page{width:var(--card-width);height:var(--card-height);position:relative;overflow:hidden;background:var(--card-bg);color:var(--card-color);border-radius:0;box-shadow:none}
  .md2card-content{position:absolute;inset:20px;padding:0;overflow:${request.overHiddenMode ? "hidden" : "visible"};font-size:16px;line-height:1.65;overflow-wrap:anywhere}
  .md2card-content h1,.md2card-content h2,.md2card-content h3,.md2card-content h4,.md2card-content h5,.md2card-content h6{color:var(--card-accent);line-height:1.24;margin:0 0 .62em}.md2card-content h1{font-size:1.8em}.md2card-content h2{font-size:1.45em}.md2card-content h3{font-size:1.2em}
  .md2card-content p{margin:0 0 .72em}.md2card-content ul,.md2card-content ol{margin:.35em 0 .8em 1.35em;padding:0}.md2card-content li{margin:.18em 0}.md2card-content blockquote{margin:.8em 0;padding:.62em .9em;border-left:4px solid var(--card-accent);background:color-mix(in srgb,var(--card-surface) 82%,transparent)}
  .md2card-content pre{margin:.8em 0;padding:.78em;overflow:hidden;border-radius:8px;background:#111827;color:#f8fafc;font-size:.82em;white-space:pre-wrap}.md2card-content code{font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace}.md2card-content :not(pre)>code{padding:.1em .3em;border-radius:4px;background:color-mix(in srgb,var(--card-accent) 12%,transparent)}
  .md2card-content img{display:block;max-width:100%;height:auto;margin:.65em auto;border-radius:8px}.md2card-content a{color:var(--card-accent);text-decoration:none}.md2card-content hr{border:0;border-top:1px solid color-mix(in srgb,var(--card-color) 20%,transparent);margin:1em 0}
  .md2card-content table{width:100%;border-collapse:collapse;margin:.8em 0;font-size:.82em}.md2card-content th,.md2card-content td{border:1px solid color-mix(in srgb,var(--card-color) 20%,transparent);padding:.38em .48em;text-align:left}.md2card-content th{background:color-mix(in srgb,var(--card-accent) 12%,transparent)}
  .page-badge{position:absolute;right:10px;bottom:8px;z-index:3;padding:3px 8px;border-radius:999px;background:var(--card-accent);color:#fff;font-size:10px;font-weight:700;opacity:.88}
  #preload{position:fixed;left:-100000px;top:0;width:calc(var(--card-width) - 40px);visibility:hidden;pointer-events:none;font-size:16px;line-height:1.65}
</style>
</head>
<body>
<div id="pages"></div>
<div id="preload" class="md2card-content">${sourceHtml}</div>
<script>
(() => {
  const mode=${jsonForInlineScript(request.splitMode)};
  const configuredPages=${jsonForInlineScript(configuredPages)};
  const pagesRoot=document.getElementById('pages');
  const preload=document.getElementById('preload');
  const createPage=()=>{const page=document.createElement('article');page.className='md2card-page';const content=document.createElement('div');content.className='md2card-content';page.appendChild(content);pagesRoot.appendChild(page);return content};
  const waitForImages=async(root)=>{const images=[...root.querySelectorAll('img')];await Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{const timer=setTimeout(resolve,5000);img.addEventListener('load',()=>{clearTimeout(timer);resolve()},{once:true});img.addEventListener('error',()=>{clearTimeout(timer);resolve()},{once:true})})))};
  const paginate=async()=>{
    await waitForImages(preload);
    if(mode==='hr'){
      for(const html of configuredPages){const content=createPage();content.innerHTML=html}
    }else if(mode==='none'){
      const content=createPage();content.innerHTML=preload.innerHTML
    }else{
      const nodes=[...preload.childNodes].filter(node=>node.nodeType!==Node.TEXT_NODE||node.textContent.trim());
      let content=createPage();
      for(const original of nodes){
        const clone=original.cloneNode(true);content.appendChild(clone);
        if(content.scrollHeight>content.clientHeight&&content.childNodes.length>1){content.removeChild(clone);content=createPage();content.appendChild(clone)}
      }
      if(!nodes.length) createPage();
    }
    const pages=[...document.querySelectorAll('.md2card-page')];
    pages.forEach((page,index)=>{const badge=document.createElement('div');badge.className='page-badge';badge.textContent=(index+1)+'/'+pages.length;page.appendChild(badge)});
    preload.remove();
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    document.documentElement.dataset.ready='true';
  };
  paginate().catch(error=>{document.documentElement.dataset.renderError=String(error&&error.message||error);document.documentElement.dataset.ready='error'});
})();
</script>
</body>
</html>`;
}
