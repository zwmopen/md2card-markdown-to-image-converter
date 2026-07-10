(function () {
    'use strict';

    const files = [
        './src/core.js',
        './src/presets.js',
        './src/styles.js',
        './src/app.js'
    ];

    function load(index) {
        if (index >= files.length) return;
        const script = document.createElement('script');
        script.src = files[index];
        script.async = false;
        script.onload = () => load(index + 1);
        script.onerror = () => {
            const message = `MD2Card 启动失败：无法加载 ${files[index]}`;
            console.error(message);
            alert(message);
        };
        document.head.appendChild(script);
    }

    load(0);
})();
