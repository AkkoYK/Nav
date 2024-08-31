// 更新时间和日期
function updateTimeDate() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('hours').textContent = hours;
    document.getElementById('minutes').textContent = minutes;
    document.getElementById('date').textContent = now.toLocaleDateString();
}

setInterval(updateTimeDate, 1000);
updateTimeDate();

// 搜索功能
const focusHint = document.getElementById('focus-hint');
const searchInput = document.getElementById('searchInput');
const normalSearchBtn = document.getElementById('normalSearchBtn');
const qiuseekBtn = document.getElementById('qiuseekBtn');
const suggestions = document.getElementById('suggestions');

// 获取所有类名为.setting的设置块
document.querySelectorAll('.setting').forEach(setting => {
    // 在每个.setting中找到所有类名为.setting-item的设置项
    setting.querySelectorAll('.setting-item').forEach(item => {
        // 找到当前设置项中的所有input[type="radio"]元素
        item.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const value = this.value;
                const name = this.name;
                console.log(`Setting ${name} changed to ${value}`);

                setBackgroundUrl();
    
                // 保存当前设置到localStorage
                localStorage.setItem(name, value);
            });
        });

        // 初始化设置项的值
        initializeSetting(item);
    });
});

// 初始化设置项的值函数
function initializeSetting(item) {
    // 找到当前设置项中的所有input[type="radio"]元素
    item.querySelectorAll('input[type="radio"]').forEach(radio => {
        const name = radio.name;
        const storedValue = localStorage.getItem(name);

        // 如果localStorage中有保存的值，则设置为保存的值
        if (storedValue !== null && storedValue !== '') {
            radio.checked = (radio.value === storedValue);
        } else {
            // 否则使用默认值（第一个选项）
            radio.checked = radio.defaultChecked;
        }
    });
}

// 页面加载时，初始化所有设置项的值
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.setting-item').forEach(item => {
        initializeSetting(item);
    });
});

let selectedSuggestionIndex = -1; // 选中的搜索建议索引
let pressTimer;
let isLongPress = false;

searchInput.addEventListener('keydown', function(e) {
    if (this.value.trim() !== '') {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!isLongPress) {
                pressTimer = setTimeout(() => {
                    isLongPress = true;
                    performQiuSeek();
                }, 500);
            }
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            navigateSuggestions(e.key === 'ArrowUp' ? -1 : 1);
        }
    }
});

searchInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
        clearTimeout(pressTimer);
        if (!isLongPress) {
            performSearch();
        }
        isLongPress = false;
    }
});

function navigateSuggestions(direction) {
    const suggestionItems = document.querySelectorAll('.suggestion-item');
    if (suggestionItems.length === 0) return;

    selectedSuggestionIndex += direction;
    if (selectedSuggestionIndex < 0) selectedSuggestionIndex = suggestionItems.length - 1;
    if (selectedSuggestionIndex >= suggestionItems.length) selectedSuggestionIndex = 0;

    updateSelectedSuggestion(suggestionItems);
    searchInput.value = suggestionItems[selectedSuggestionIndex].querySelector('.suggestion-text').textContent;
}

function updateSelectedSuggestion(suggestionsList) {
    suggestionsList.forEach((item, index) => {
        if (index === selectedSuggestionIndex) {
            item.classList.add('selected');
            item.setAttribute('aria-selected', 'true');
        } else {
            item.classList.remove('selected');
            item.setAttribute('aria-selected', 'false');
        }
    });
    if (selectedSuggestionIndex !== -1) {
        suggestionsList[selectedSuggestionIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function performSearch() {
    const query = searchInput.value;
    const searchEngine = document.querySelector('input[name="searchEngine"]:checked').value;
    let searchUrl;

    // 添加跳转动画效果
    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    document.body.appendChild(overlay);

    suggestionLength = 0;
    focusHintLength = suggestionLength/2;
    suggestions.style.height = '0px';
    focusHint.style.transform = `translate(-50% , -50%)`;
    updateWordCloud([]);
    selectedSuggestionIndex = -1; // 重置选中的搜索建议索引

    // 淡入动画效果
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 300);

    // 淡出动画效果，然后执行搜索跳转
    setTimeout(() => {
        switch(searchEngine) {
            case 'baidu':
                searchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
                break;
            case 'bing':
                searchUrl = `https://bing.com/search?q=${encodeURIComponent(query)}`;
                break;
            case 'google':
                searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                break;
            case 'duckduckgo':
                searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
                break;
        }
        
        window.open(searchUrl, '_blank');
        searchInput.value = '';
        
        // 移除 overlay 元素
        setTimeout(() => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
            }, 125); // 等待淡出动画完成后移除 overlay 元素
        }, 250); // 等待搜索跳转完成后执行淡出动画
    }, 500); // 500毫秒后执行搜索跳转，以便观察跳转动画
}

function performQiuSeek() {
    const query = searchInput.value;
    let searchUrl = `https://qs.ykload.com/?q=${encodeURIComponent(query)}`;

    // 添加跳转动画效果
    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    document.body.appendChild(overlay);

    suggestionLength = 0;
    focusHintLength = suggestionLength/2;
    suggestions.style.height = '0px';
    focusHint.style.transform = `translate(-50% , -50%)`;
    updateWordCloud([]);
    selectedSuggestionIndex = -1; // 重置选中的搜索建议索引

    // 淡入动画效果
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 300);

    // 淡出动画效果，然后执行搜索跳转
    setTimeout(() => {
        window.open(searchUrl, '_blank');
        searchInput.value = '';
        
        // 移除 overlay 元素
        setTimeout(() => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
            }, 125); // 等待淡出动画完成后移除 overlay 元素
        }, 250); // 等待搜索跳转完成后执行淡出动画
    }, 500); // 500毫秒后执行搜索跳转，以便观察跳转动画
}

// 添加按钮点击事件监听器
normalSearchBtn.addEventListener('click', performSearch);
qiuseekBtn.addEventListener('click', performQiuSeek);

// 搜索联想功能
let debounceTimer;

searchInput.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const query = this.value.trim();
        if (query.length > 0) {
            fetchSuggestions(query);
        } else {
            suggestionLength = 0;
            focusHintLength = suggestionLength/2
            suggestions.style.height = '0px';
            focusHint.style.transform = `translate(-50% , -50%)`;
            updateWordCloud([]);
        }
        toggleSearchButtons();
        selectedSuggestionIndex = -1; // 重置选中的搜索建议索引
    }, 300);
});

searchInput.addEventListener('focus', function() {
    toggleFocusMode(true);
    toggleSearchButtons();
});

searchInput.addEventListener('blur', function() {
    toggleFocusMode(false);
    setTimeout(toggleSearchButtons, 100); // 延迟执行，以便在点击搜索按钮时能正确触发搜索
});

function fetchSuggestions(query) {
    const url = `https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd=${encodeURIComponent(query)}&cb=processSuggestions`;
    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
}

// 前端定义的回调函数，用于处理返回的数据
function processSuggestions(data) {
    const danmaku = document.querySelector('input[name="danmaku"]:checked').value;

    if (!Array.isArray(data.s)) {
        // console.error('Received unexpected data format:', data);
        return;
    }

    showSuggestions(data.s); // 百度返回的是类似 Google 的 [搜索词, [相关搜索词]] 结构，可以使用 data.s 作为相关搜索词数组
    if (danmaku === 'on') {
        updateWordCloud(data.s); // 也用 data.s 来更新词云
    }
}

let suggestionLength = 0;
let focusHintLength = 0;

function showSuggestions(items) {
    const currentSuggestions = document.querySelectorAll('.suggestion-item');
    const newSuggestions = [];

    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.classList.add('suggestion-item', 'fade-out');
        li.setAttribute('data-index', index);

        const textSpan = document.createElement('span');
        textSpan.textContent = item;
        textSpan.classList.add('suggestion-text');

        const qiuseekBtn = document.createElement('button');
        qiuseekBtn.innerHTML = '<img src="images/QiuSeek.svg" alt="QiuSeek" class="qiuseek-icon">';
        qiuseekBtn.classList.add('suggestion-btn', 'qiuseek-btn');

        li.appendChild(textSpan);
        li.appendChild(qiuseekBtn);

        li.addEventListener('click', function(e) {
            if (!e.target.closest('.qiuseek-btn')) {
                searchInput.value = item;
                performSearch();
            }
        });

        qiuseekBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            searchInput.value = item;
            performQiuSeek();
        });

        newSuggestions.push(li);
    });

    suggestions.innerHTML = '';

    newSuggestions.forEach(li => {
        suggestions.appendChild(li);
        void li.offsetWidth;
        li.classList.remove('fade-out');
    });

    if (items.length === 0) {
        suggestionLength = 0;
    } else {
        suggestionLength = items.length * 40;
    }

    suggestions.style.height = suggestionLength + 'px';
    focusHintLength = suggestionLength / 2;
    focusHint.style.transform = `translate(-50% , -${focusHintLength}px)`;
    
    selectedSuggestionIndex = -1; // 重置选中的搜索建议索引
}

// 点击页面其他地方时隐藏建议和词云
document.addEventListener('click', function(e) {
    if (e.target !== searchInput && e.target !== suggestions) {
        suggestions.style.height = '0px';
        suggestions.style.opacity = 0;
        wordCloud.style.opacity = 0;
    }
});

// 添加焦点模式
function toggleFocusMode(active) {
    document.querySelector('.background').classList.toggle('focus-mode', active);
    document.querySelector('.search-container').classList.toggle('focus-mode', active);
    document.querySelector('.search-bar').classList.toggle('focus-mode', active);
    document.querySelector('.focus-hint').classList.toggle('focus-mode', active);
    document.querySelector('.container').classList.toggle('focus-mode', active);
    document.querySelector('.time-date').classList.toggle('focus-mode', active);
    document.querySelector('footer').classList.toggle('focus-mode', active);

    document.querySelector('.setting').classList.remove('open', active);
    

    // 延迟设置高度和透明度，确保平滑过渡
    setTimeout(() => {
        focusHint.style.transform = active ? `translate(-50% , -${focusHintLength}px)` : `translate(-50% , -50%)`;
        suggestions.style.height = active ? suggestionLength + 'px' : '0px';
        suggestions.style.opacity = active ? 1 : 0;
        wordCloud.style.opacity = active ? 1 : 0;
    }, 100); // 可以根据实际情况调整延迟时间
}

// 使用空格键快速聚焦搜索栏
document.addEventListener('keydown', function(e) {
    if (document.activeElement === searchInput || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        searchInput.focus();
    }
});

// 词云功能
let wordCloudWords = [];
const wordCloud = document.getElementById('wordCloud');
const currentWordCloud = wordCloud.querySelectorAll('.word-cloud-row');

function updateWordCloud(words) {
    wordCloudWords = words;
    renderWordCloud();
}

function renderWordCloud() {
    wordCloud.style.opacity = 0; // 将透明度设置为0，触发淡出动画

    // 在淡出动画完成后，清空词云内容并开始新的渲染
    setTimeout(() => {
        wordCloud.innerHTML = '';
        const rowCount = Math.floor(window.innerHeight / 100);

        for (let i = 0; i < rowCount; i++) {
            const row = document.createElement('div');
            row.className = 'word-cloud-row';
            row.style.top = `${i * 100}px`;
            row.style.left = `${Math.random() * 100}%`;
            row.style.animationDuration = `${30 + Math.random() * 60}s`;
            row.style.animationDirection = i % 2 === 0 ? 'normal' : 'normal';

            const rowWords = [...wordCloudWords, ...wordCloudWords];
            row.style.whiteSpace = 'pre';
            row.textContent = rowWords.join('              ');

            wordCloud.appendChild(row);
        }

        // 强制浏览器回流，触发新的渲染
        void wordCloud.offsetWidth;

        // 淡入新的词云
        setTimeout(() => {
            wordCloud.style.opacity = 1; // 淡入动画
        }, 50); // 50毫秒后开始淡入动画
    }, 300); // 等待0.3秒后开始清空词云内容和淡出动画，与CSS过渡的时长对应
}

// 在窗口大小改变时重新渲染词云
window.addEventListener('resize', renderWordCloud);

// 初始化
renderWordCloud();

// 设置背景URL的函数
function setBackgroundUrl() {
    const bgType = document.querySelector('input[name="bg"]:checked').value;
    const backgroundElement = document.querySelector('.background');
    let imageUrl = '';

    switch (bgType) {
        case 'landscape':
            imageUrl = 'https://api.dujin.org/bing/1920.php';
            break;
        case 'moe':
            // 以下请求会在每次更改设置时被触发，固先停用
            // 添加时间戳参数以确保每次请求唯一
            // const timestamp = Date.now();
            // imageUrl = `https://t.alcy.cc/moez?timestamp=${timestamp}`;

            imageUrl = `https://t.alcy.cc/moez`;
            break;
        default:
            // Handle default case if needed
            break;
    }

    if (imageUrl) {
        // 创建一个新的Image对象来加载背景图片
        const img = new Image();
        img.onload = function() {
            // 图片加载完毕后设置背景，并添加淡入动画类
            backgroundElement.style.backgroundImage = `url('${imageUrl}')`;
            backgroundElement.classList.add('fade-in');
        };
        img.src = imageUrl; // 开始加载图片
    }
}

// 监测背景图片加载/切换的函数
function monitorBackgroundChanges() {
    const backgroundElement = document.querySelector('.background');

    // 在CSS中定义.fade-in类的淡入效果
    // 可以根据需要调整动画效果
    backgroundElement.classList.add('fade-in');
}

// 页面加载完成时执行设置背景和添加动画效果
document.addEventListener('DOMContentLoaded', function() {
    setBackgroundUrl();
    monitorBackgroundChanges();
});

function toggleSettingOpen() {
    var setting = document.querySelector('.setting');
    // 切换是否具有 .open 类
    setting.classList.toggle('open');

    document.querySelector('.background').classList.toggle('focus-mode');
    document.querySelector('.search-container').classList.toggle('focus-mode');

    document.querySelector('.container').classList.toggle('focus-mode');
    document.querySelector('.time-date').classList.toggle('focus-mode');
    document.querySelector('footer').classList.toggle('focus-mode');
}

// 监听 #time 元素的点击事件
document.getElementById('time').addEventListener('click', toggleSettingOpen);

function toggleSearchButtons() {
    const buttonsVisible = searchInput.value.trim() !== '' && document.activeElement === searchInput;
    normalSearchBtn.style.pointerEvents = buttonsVisible ? 'auto' : 'none';
    normalSearchBtn.style.opacity = buttonsVisible ? 1 : 0;
    normalSearchBtn.style.width = buttonsVisible ? '80px' : '0px';
    qiuseekBtn.style.pointerEvents = buttonsVisible ? 'auto' : 'none';
    qiuseekBtn.style.opacity = buttonsVisible ? 1 : 0;
    qiuseekBtn.style.width = buttonsVisible ? '100px' : '0px';
    navBtn.style.pointerEvents = buttonsVisible ? 'none' : 'auto';
    navBtn.style.opacity = buttonsVisible ? 0 : 1;
    navBtn.style.width = buttonsVisible ? '0px' : '45px';
}

// 初始化搜索按钮显示状态
document.addEventListener('DOMContentLoaded', toggleSearchButtons);
