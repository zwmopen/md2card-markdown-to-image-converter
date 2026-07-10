(function () {
    'use strict';
    import('./src/app.js').catch(error => {
        console.error('MD2Card 启动失败', error);
        alert(`MD2Card 启动失败：${error.message}`);
    });
})();
