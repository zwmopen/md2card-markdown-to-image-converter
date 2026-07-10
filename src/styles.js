(function (root) {
'use strict';
function injectBaselineStyles() {
    if (document.getElementById('md2card-baseline-styles')) return;
    const style = document.createElement('style');
    style.id = 'md2card-baseline-styles';
    style.textContent = `
      .xiaohongshu-grid{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:center;gap:20px}
      .card-content{position:relative;z-index:1}.card-content h1,.card-content h2,.card-content h3{line-height:1.25;margin:0 0 .65em}
      .card-content p{margin:0 0 .72em}.card-content ul,.card-content ol{margin:.35em 0 .8em 1.35em}
      .card-content blockquote{margin:.8em 0;padding:.6em .9em;border-left:4px solid var(--card-accent);background:rgba(127,127,127,.1)}
      .card-content pre{margin:.8em 0;padding:.75em;overflow:hidden;border-radius:8px;background:rgba(0,0,0,.82);color:#f7f7f7}
      .card-content code{overflow-wrap:anywhere}.card-content img{max-width:100%;height:auto;border-radius:8px}.card-content a{color:var(--card-accent)}
      .md2card-page-badge{position:absolute;right:12px;bottom:10px;z-index:3;padding:3px 8px;border-radius:999px;font:600 11px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff;background:var(--card-accent);opacity:.88}
      .export-dropdown-menu.show{display:block!important}.bg-color-btn.active,.color-btn.active{outline:3px solid rgba(0,113,227,.28);outline-offset:2px}.page-btn:disabled{opacity:.35;cursor:not-allowed}
      .md2card-notification{position:fixed;left:50%;bottom:28px;z-index:99999;transform:translate(-50%,20px);max-width:min(88vw,520px);padding:10px 16px;border-radius:12px;color:#fff;background:rgba(29,29,31,.92);box-shadow:0 12px 35px rgba(0,0,0,.18);opacity:0;pointer-events:none;transition:.22s ease}
      .md2card-notification.visible{opacity:1;transform:translate(-50%,0)}.md2card-notification[data-type=success]{background:rgba(22,163,74,.94)}.md2card-notification[data-type=error]{background:rgba(220,38,38,.94)}
      @media(max-width:980px){body{overflow:auto}.container{height:auto;min-height:100vh}.main-content{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
}
root.MD2CardStyles = { injectBaselineStyles };
})(typeof globalThis !== 'undefined' ? globalThis : this);
