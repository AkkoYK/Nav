/* ==========================================================================
   YKload — Nav · Alive Design
   ========================================================================== */

/* ---------- Element references ---------- */
const focusHint = document.getElementById('focus-hint');
const searchInput = document.getElementById('searchInput');
const normalSearchBtn = document.getElementById('normalSearchBtn');
const navBtn = document.getElementById('navBtn');
const qiuseekBtn = document.getElementById('qiuseekBtn');
const suggestions = document.getElementById('suggestions');
const wordCloud = document.getElementById('wordCloud');
const cursorGlow = document.getElementById('cursorGlow');
const searchBar = document.querySelector('.search-bar');
const aurora = document.querySelector('.aurora');

/* ---------- Time & date ---------- */
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
});

function updateTimeDate() {
    const now = new Date();
    document.getElementById('hours').textContent = String(now.getHours()).padStart(2, '0');
    document.getElementById('minutes').textContent = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('date').textContent = dateFormatter.format(now);
}
setInterval(updateTimeDate, 1000);
updateTimeDate();

/* ---------- Settings persistence ---------- */
document.querySelectorAll('.setting-item').forEach(item => {
    item.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function () {
            localStorage.setItem(this.name, this.value);
            if (this.name === 'bg') setBackgroundUrl();
        });
    });
});

function initializeSettings() {
    document.querySelectorAll('.setting-item input[type="radio"]').forEach(radio => {
        const stored = localStorage.getItem(radio.name);
        if (stored !== null && stored !== '') {
            radio.checked = (radio.value === stored);
        } else {
            radio.checked = radio.defaultChecked;
        }
    });
}

/* ---------- Search interaction ---------- */
let selectedSuggestionIndex = -1;
let pressTimer;
let isLongPress = false;

searchInput.addEventListener('keydown', function (e) {
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
        } else if (e.key === 'Escape') {
            this.blur();
        }
    } else if (e.key === 'Escape') {
        this.blur();
    }
});

searchInput.addEventListener('keyup', function (e) {
    if (e.key === 'Enter') {
        clearTimeout(pressTimer);
        if (!isLongPress) {
            performSearch();
        }
        isLongPress = false;
    }
});

function navigateSuggestions(direction) {
    const items = document.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;

    selectedSuggestionIndex += direction;
    if (selectedSuggestionIndex < 0) selectedSuggestionIndex = items.length - 1;
    if (selectedSuggestionIndex >= items.length) selectedSuggestionIndex = 0;

    items.forEach((item, i) => {
        item.classList.toggle('selected', i === selectedSuggestionIndex);
        item.setAttribute('aria-selected', i === selectedSuggestionIndex ? 'true' : 'false');
    });

    const selected = items[selectedSuggestionIndex];
    selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    searchInput.value = selected.querySelector('.suggestion-text').textContent;
}

/* ---------- Search execution ---------- */
function transitionAndOpen(url) {
    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    document.body.appendChild(overlay);

    suggestionLength = 0;
    focusHintLength = 0;
    suggestions.style.height = '0px';
    focusHint.style.transform = `translate(-50%, -50%)`;
    updateWordCloud([]);
    selectedSuggestionIndex = -1;

    requestAnimationFrame(() => {
        setTimeout(() => overlay.classList.add('visible'), 60);
    });

    setTimeout(() => {
        window.open(url, '_blank');
        searchInput.value = '';
        toggleSearchButtons();

        setTimeout(() => {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 350);
        }, 220);
    }, 460);
}

function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    const engine = document.querySelector('input[name="searchEngine"]:checked').value;
    const map = {
        baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
        bing: `https://bing.com/search?q=${encodeURIComponent(query)}`,
        google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
    };
    transitionAndOpen(map[engine]);
}

function performQiuSeek() {
    const query = searchInput.value.trim();
    if (!query) return;
    transitionAndOpen(`https://qs.ykload.com/?q=${encodeURIComponent(query)}`);
}

normalSearchBtn.addEventListener('click', performSearch);
qiuseekBtn.addEventListener('click', performQiuSeek);
navBtn.addEventListener('click', () => searchInput.focus());

/* ---------- Suggestions ---------- */
let debounceTimer;
let suggestionLength = 0;
let focusHintLength = 0;

searchInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const query = this.value.trim();
        if (query.length > 0) {
            fetchSuggestions(query);
        } else {
            suggestionLength = 0;
            focusHintLength = 0;
            suggestions.style.height = '0px';
            suggestions.innerHTML = '';
            focusHint.style.transform = `translate(-50%, -50%)`;
            updateWordCloud([]);
        }
        toggleSearchButtons();
        selectedSuggestionIndex = -1;
    }, 240);
});

searchInput.addEventListener('focus', function () {
    toggleFocusMode(true);
    toggleSearchButtons();
});

searchInput.addEventListener('blur', function () {
    setTimeout(() => {
        toggleFocusMode(false);
        toggleSearchButtons();
    }, 120);
});

function fetchSuggestions(query) {
    const url = `https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd=${encodeURIComponent(query)}&cb=processSuggestions`;
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => script.remove();
    script.onerror = () => script.remove();
    document.body.appendChild(script);
}

window.processSuggestions = function (data) {
    const danmaku = document.querySelector('input[name="danmaku"]:checked').value;
    if (!Array.isArray(data.s)) return;
    showSuggestions(data.s);
    if (danmaku === 'on') {
        updateWordCloud(data.s);
    } else {
        updateWordCloud([]);
    }
};

function showSuggestions(items) {
    suggestions.innerHTML = '';

    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'suggestion-item';
        li.setAttribute('role', 'option');
        li.setAttribute('data-index', index);
        li.style.animationDelay = `${index * 35}ms`;

        const textSpan = document.createElement('span');
        textSpan.className = 'suggestion-text';
        textSpan.textContent = item;

        const qsBtn = document.createElement('button');
        qsBtn.type = 'button';
        qsBtn.className = 'suggestion-btn';
        qsBtn.setAttribute('aria-label', '使用求索 AI 搜索');
        qsBtn.innerHTML = '<img src="images/QiuSeek.svg" alt="" class="qiuseek-icon">';

        li.appendChild(textSpan);
        li.appendChild(qsBtn);

        li.addEventListener('click', function (e) {
            if (!e.target.closest('.suggestion-btn')) {
                searchInput.value = item;
                performSearch();
            }
        });

        qsBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            searchInput.value = item;
            performQiuSeek();
        });

        suggestions.appendChild(li);
    });

    suggestionLength = items.length === 0 ? 0 : items.length * 46;
    suggestions.style.height = suggestionLength + 'px';
    focusHintLength = suggestionLength / 2;
    focusHint.style.transform = `translate(-50%, -${focusHintLength}px)`;
    selectedSuggestionIndex = -1;
}

document.addEventListener('click', function (e) {
    if (e.target !== searchInput && !e.target.closest('.search-bar') && !e.target.closest('.suggestions')) {
        suggestions.style.height = '0px';
        suggestions.style.opacity = 0;
        wordCloud.style.opacity = 0;
    }
});

/* ---------- Focus mode ---------- */
function toggleFocusMode(active) {
    document.querySelector('.background').classList.toggle('focus-mode', active);
    document.querySelector('.search-container').classList.toggle('focus-mode', active);
    document.querySelector('.search-bar').classList.toggle('focus-mode', active);
    document.querySelector('.focus-hint').classList.toggle('focus-mode', active);
    document.querySelector('.container').classList.toggle('focus-mode', active);
    document.querySelector('.time-date').classList.toggle('focus-mode', active);
    document.querySelector('footer').classList.toggle('focus-mode', active);

    document.querySelector('.setting').classList.remove('open');

    setTimeout(() => {
        focusHint.style.transform = active ? `translate(-50%, -${focusHintLength}px)` : `translate(-50%, -50%)`;
        suggestions.style.height = active ? suggestionLength + 'px' : '0px';
        suggestions.style.opacity = active ? 1 : 0;
        wordCloud.style.opacity = active ? 1 : 0;
    }, 80);
}

/* ---------- Keyboard shortcuts ---------- */
document.addEventListener('keydown', function (e) {
    const tag = document.activeElement.tagName;
    if (document.activeElement === searchInput || tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        searchInput.focus();
    } else if (e.key === '/') {
        e.preventDefault();
        searchInput.focus();
    }
});

/* ---------- Word cloud ---------- */
let wordCloudWords = [];

function updateWordCloud(words) {
    wordCloudWords = words;
    renderWordCloud();
}

function renderWordCloud() {
    wordCloud.style.opacity = 0;
    setTimeout(() => {
        wordCloud.innerHTML = '';
        const rowCount = Math.floor(window.innerHeight / 100);
        for (let i = 0; i < rowCount; i++) {
            const row = document.createElement('div');
            row.className = 'word-cloud-row';
            row.style.top = `${i * 100}px`;
            row.style.left = `${Math.random() * 100}%`;
            row.style.animationDuration = `${36 + Math.random() * 60}s`;
            const rowWords = [...wordCloudWords, ...wordCloudWords];
            row.style.whiteSpace = 'pre';
            row.textContent = rowWords.join('              ');
            wordCloud.appendChild(row);
        }
        void wordCloud.offsetWidth;
        if (wordCloudWords.length > 0) {
            setTimeout(() => { wordCloud.style.opacity = 1; }, 60);
        }
    }, 280);
}

window.addEventListener('resize', renderWordCloud);

/* ---------- Background ---------- */
function setBackgroundUrl() {
    const bgType = document.querySelector('input[name="bg"]:checked').value;
    const backgroundElement = document.querySelector('.background');

    if (bgType === 'aurora') {
        // Pure Alive Design — no photo, only living aurora.
        backgroundElement.classList.remove('fade-in');
        backgroundElement.style.backgroundImage = 'none';
        return;
    }

    let imageUrl = '';
    switch (bgType) {
        case 'landscape':
            imageUrl = 'https://api.dujin.org/bing/1920.php';
            break;
        case 'moe':
            imageUrl = `https://t.alcy.cc/moez`;
            break;
    }

    if (imageUrl) {
        const img = new Image();
        img.onload = function () {
            backgroundElement.style.backgroundImage = `url('${imageUrl}')`;
            backgroundElement.classList.add('fade-in');
        };
        img.src = imageUrl;
    }
}

/* ---------- Settings drawer ---------- */
function toggleSettingOpen() {
    const setting = document.querySelector('.setting');
    setting.classList.toggle('open');

    const isOpen = setting.classList.contains('open');
    document.querySelector('.background').classList.toggle('focus-mode', isOpen);
    document.querySelector('.search-container').classList.toggle('focus-mode', isOpen);
    document.querySelector('.container').classList.toggle('focus-mode', isOpen);
    document.querySelector('.time-date').classList.toggle('focus-mode', isOpen);
    document.querySelector('footer').classList.toggle('focus-mode', isOpen);
}

document.getElementById('time').addEventListener('click', toggleSettingOpen);

/* ---------- Search button visibility ---------- */
function toggleSearchButtons() {
    const visible = searchInput.value.trim() !== '' && document.activeElement === searchInput;

    normalSearchBtn.style.pointerEvents = visible ? 'auto' : 'none';
    normalSearchBtn.style.opacity = visible ? 1 : 0;
    normalSearchBtn.style.width = visible ? '78px' : '0px';

    qiuseekBtn.style.pointerEvents = visible ? 'auto' : 'none';
    qiuseekBtn.style.opacity = visible ? 1 : 0;
    qiuseekBtn.style.width = visible ? '92px' : '0px';

    navBtn.style.pointerEvents = visible ? 'none' : 'auto';
    navBtn.style.opacity = visible ? 0 : 1;
    navBtn.style.width = visible ? '0px' : '46px';
}

/* ---------- Cursor glow + magnetic search bar ---------- */
let cursorRafId = null;
let cursorTargetX = window.innerWidth / 2;
let cursorTargetY = window.innerHeight / 2;
let cursorCurrentX = cursorTargetX;
let cursorCurrentY = cursorTargetY;

function smoothCursor() {
    cursorCurrentX += (cursorTargetX - cursorCurrentX) * 0.18;
    cursorCurrentY += (cursorTargetY - cursorCurrentY) * 0.18;
    document.documentElement.style.setProperty('--cursor-x', `${cursorCurrentX}px`);
    document.documentElement.style.setProperty('--cursor-y', `${cursorCurrentY}px`);
    cursorRafId = requestAnimationFrame(smoothCursor);
}

document.addEventListener('mousemove', (e) => {
    cursorTargetX = e.clientX;
    cursorTargetY = e.clientY;
    cursorGlow.classList.add('is-active');
    if (cursorRafId === null) smoothCursor();

    if (searchBar) {
        const rect = searchBar.getBoundingClientRect();
        const xPct = ((e.clientX - rect.left) / rect.width) * 100;
        const yPct = ((e.clientY - rect.top) / rect.height) * 100;
        searchBar.style.setProperty('--bar-glow-x', `${xPct}%`);
        searchBar.style.setProperty('--bar-glow-y', `${yPct}%`);
    }
});

document.addEventListener('mouseleave', () => {
    cursorGlow.classList.remove('is-active');
});

/* ---------- Time tilt — subtle parallax ---------- */
const timeEl = document.getElementById('time');
const timeDateEl = document.querySelector('.time-date');
document.addEventListener('mousemove', (e) => {
    if (!timeDateEl || timeDateEl.classList.contains('focus-mode')) {
        timeEl.style.transform = '';
        return;
    }
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    timeEl.style.transform = `translate3d(${dx * 6}px, ${dy * 4}px, 0)`;
});

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', function () {
    initializeSettings();
    setBackgroundUrl();
    toggleSearchButtons();
    renderWordCloud();
});
