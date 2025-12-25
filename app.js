// 全局变量
let apps = [];
let featuredContainer, appsGrid, searchInput;

// 渲染热门推荐 (无限循环版)
function renderFeatured() {
    if (!featuredContainer) return;

    const featuredApps = apps.filter(app => app.featured);
    const loopApps = [...featuredApps, ...featuredApps, ...featuredApps, ...featuredApps];

    featuredContainer.innerHTML = loopApps.map(app => `
        <a href="${app.url}" class="featured-card" target="_blank" title="${app.name}">
            <img src="${app.icon}" alt="${app.name}" class="featured-icon" style="${app.backgroundColor ? `background-color: ${app.backgroundColor}` : ''}">
            <div class="featured-info">
                <h3>${app.name}</h3>
                <p>${app.description || 'AI 助手'}</p>
            </div>
        </a>
    `).join('');
}

// 渲染所有应用
function renderApps(filterText = '') {
    if (!appsGrid) return;

    const filteredApps = apps.filter(app => {
        const searchText = filterText.toLowerCase();
        return app.name.toLowerCase().includes(searchText) ||
            (app.description && app.description.toLowerCase().includes(searchText)) ||
            app.url.toLowerCase().includes(searchText);
    });

    if (filteredApps.length === 0) {
        appsGrid.innerHTML = '<p style="color: grey; grid-column: 1/-1; text-align: center; padding: 20px;">未找到相关应用</p>';
        return;
    }

    appsGrid.innerHTML = filteredApps.map(app => `
        <a href="${app.url}" class="app-item" target="_blank">
            <div class="app-icon-wrapper">
                <img src="${app.icon}" alt="${app.name}" class="app-icon" style="${app.backgroundColor ? `background-color: ${app.backgroundColor}` : ''}">
            </div>
            <span class="app-name">${app.name}</span>
        </a>
    `).join('');
}

// DOM 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 获取 DOM 元素引用
    featuredContainer = document.getElementById('featuredContainer');
    appsGrid = document.getElementById('appsGrid');
    searchInput = document.getElementById('searchInput');

    // 搜索事件
    searchInput.addEventListener('input', (e) => {
        renderApps(e.target.value);
    });

    // 主题切换逻辑
    const themeBtn = document.getElementById('themeToggle');
    const sunIcon = themeBtn.querySelector('.sun-icon');
    const moonIcon = themeBtn.querySelector('.moon-icon');

    function setTheme(isLight) {
        if (isLight) {
            document.documentElement.setAttribute('data-theme', 'light');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
            localStorage.setItem('theme', 'dark');
        }
    }

    // 初始化主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        setTheme(true);
    }

    themeBtn.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        setTheme(!isLight);
    });

    // 加载模型数据
    fetch('models.json')
        .then(response => response.json())
        .then(async data => {
            apps = data;

            // 针对 Web 环境修复特殊后缀的 MIME 类型问题
            // Python SimpleHTTPRequestHandler 默认不识别 .svg+xml, .x-icon 等
            await Promise.all(apps.map(async app => {
                if (!app.icon) return;

                const lowerIcon = app.icon.toLowerCase();
                let mimeType = null;

                if (lowerIcon.endsWith('.svg+xml')) mimeType = 'image/svg+xml';
                else if (lowerIcon.endsWith('.x-icon')) mimeType = 'image/x-icon';
                else if (lowerIcon.endsWith('.vnd.microsoft.icon')) mimeType = 'image/x-icon';

                if (mimeType) {
                    try {
                        const res = await fetch(app.icon);
                        const blob = await res.blob();
                        const newBlob = new Blob([blob], { type: mimeType });
                        app.icon = URL.createObjectURL(newBlob);
                    } catch (e) {
                        console.warn('Icon fix failed for:', app.name);
                    }
                }
            }));

            renderFeatured();
            renderApps();
        })
        .catch(err => console.error('Failed to load models:', err));
});
