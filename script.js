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

const focusHint = document.getElementById('focus-hint');
const searchInput = document.getElementById('searchInput');
const normalSearchBtn = document.getElementById('normalSearchBtn');
const qiuseekBtn = document.getElementById('qiuseekBtn');
const suggestions = document.getElementById('suggestions');

document.querySelectorAll('.setting').forEach(setting => {
    setting.querySelectorAll('.setting-item').forEach(item => {
        item.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const value = this.value;
                const name = this.name;
                console.log(`Setting ${name} changed to ${value}`);

                setBackgroundUrl();
                setThemeMode(); // Pfb2d

                localStorage.setItem(name, value);
            });
        });

        initializeSetting(item);
    });
});

function initializeSetting(item) {
    item.querySelectorAll('input[type="radio"]').forEach(radio => {
        const name = radio.name;
        const storedValue = localStorage.getItem(name);

        if (storedValue !== null && storedValue !== '') {
            radio.checked = (radio.value === storedValue);
        } else {
            radio.checked = radio.defaultChecked;
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.setting-item').forEach(item => {
        initializeSetting(item);
    });
    setThemeMode(); // Pd365
});

let selectedSuggestionIndex = -1;
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

    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    document.body.appendChild(overlay);

    suggestionLength = 0;
    focusHintLength = suggestionLength/2;
    suggestions.style.height = '0px';
    focusHint.style.transform = `translate(-50% , -50%)`;
    updateWordCloud([]);
    selectedSuggestionIndex = -1;

    setTimeout(() => {
        overlay.classList.add('visible');
    }, 300);

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
        
        setTimeout(() => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
            }, 125);
        }, 250);
    }, 500);
}

function performQiuSeek() {
    const query = searchInput.value;
    let searchUrl = `https://qs.ykload.com/?q=${encodeURIComponent(query)}`;

    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    document.body.appendChild(overlay);

    suggestionLength = 0;
    focusHintLength = suggestionLength/2;
    suggestions.style.height = '0px';
    focusHint.style.transform = `translate(-50% , -50%)`;
    updateWordCloud([]);
    selectedSuggestionIndex = -1;

    setTimeout(() => {
        overlay.classList.add('visible');
    }, 300);

    setTimeout(() => {
        window.open(searchUrl, '_blank');
        searchInput.value = '';
        
        setTimeout(() => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
            }, 125);
        }, 250);
    }, 500);
}

normalSearchBtn.addEventListener('click', performSearch);
qiuseekBtn.addEventListener('click', performQiuSeek);

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
        selectedSuggestionIndex = -1;
    }, 300);
});

searchInput.addEventListener('focus', function() {
    toggleFocusMode(true);
    toggleSearchButtons();
});

searchInput.addEventListener('blur', function() {
    toggleFocusMode(false);
    setTimeout(toggleSearchButtons, 100);
});

function fetchSuggestions(query) {
    const url = `https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd=${encodeURIComponent(query)}&cb=processSuggestions`;
    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
}

function processSuggestions(data) {
    const danmaku = document.querySelector('input[name="danmaku"]:checked').value;

    if (!Array.isArray(data.s)) {
        return;
    }

    showSuggestions(data.s);
    if (danmaku === 'on') {
        updateWordCloud(data.s);
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
    
    selectedSuggestionIndex = -1;
}

document.addEventListener('click', function(e) {
    if (e.target !== searchInput && e.target !== suggestions) {
        suggestions.style.height = '0px';
        suggestions.style.opacity = 0;
        wordCloud.style.opacity = 0;
    }
});

function toggleFocusMode(active) {
    document.querySelector('.background').classList.toggle('focus-mode', active);
    document.querySelector('.search-container').classList.toggle('focus-mode', active);
    document.querySelector('.search-bar').classList.toggle('focus-mode', active);
    document.querySelector('.focus-hint').classList.toggle('focus-mode', active);
    document.querySelector('.container').classList.toggle('focus-mode', active);
    document.querySelector('.time-date').classList.toggle('focus-mode', active);
    document.querySelector('footer').classList.toggle('focus-mode', active);

    document.querySelector('.setting').classList.remove('open', active);
    

    setTimeout(() => {
        focusHint.style.transform = active ? `translate(-50% , -${focusHintLength}px)` : `translate(-50% , -50%)`;
        suggestions.style.height = active ? suggestionLength + 'px' : '0px';
        suggestions.style.opacity = active ? 1 : 0;
        wordCloud.style.opacity = active ? 1 : 0;
    }, 100);
}

document.addEventListener('keydown', function(e) {
    if (document.activeElement === searchInput || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        searchInput.focus();
    }
});

let wordCloudWords = [];
const wordCloud = document.getElementById('wordCloud');
const currentWordCloud = wordCloud.querySelectorAll('.word-cloud-row');

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
            row.style.animationDuration = `${30 + Math.random() * 60}s`;
            row.style.animationDirection = i % 2 === 0 ? 'normal' : 'normal';

            const rowWords = [...wordCloudWords, ...wordCloudWords];
            row.style.whiteSpace = 'pre';
            row.textContent = rowWords.join('              ');

            wordCloud.appendChild(row);
        }

        void wordCloud.offsetWidth;

        setTimeout(() => {
            wordCloud.style.opacity = 1;
        }, 50);
    }, 300);
}

window.addEventListener('resize', renderWordCloud);

renderWordCloud();

function setBackgroundUrl() {
    const bgType = document.querySelector('input[name="bg"]:checked').value;
    const backgroundElement = document.querySelector('.background');
    let imageUrl = '';

    switch (bgType) {
        case 'landscape':
            imageUrl = 'https://api.dujin.org/bing/1920.php';
            break;
        case 'moe':
            imageUrl = `https://t.alcy.cc/moez`;
            break;
        default:
            break;
    }

    if (imageUrl) {
        const img = new Image();
        img.onload = function() {
            backgroundElement.style.backgroundImage = `url('${imageUrl}')`;
            backgroundElement.classList.add('fade-in');
        };
        img.src = imageUrl;
    }
}

function monitorBackgroundChanges() {
    const backgroundElement = document.querySelector('.background');
    backgroundElement.classList.add('fade-in');
}

document.addEventListener('DOMContentLoaded', function() {
    setBackgroundUrl();
    monitorBackgroundChanges();
});

function toggleSettingOpen() {
    var setting = document.querySelector('.setting');
    setting.classList.toggle('open');

    document.querySelector('.background').classList.toggle('focus-mode');
    document.querySelector('.search-container').classList.toggle('focus-mode');

    document.querySelector('.container').classList.toggle('focus-mode');
    document.querySelector('.time-date').classList.toggle('focus-mode');
    document.querySelector('footer').classList.toggle('focus-mode');
}

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

document.addEventListener('DOMContentLoaded', toggleSearchButtons);

function setThemeMode() {
    const theme = document.querySelector('input[name="theme"]:checked').value;
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        document.documentElement.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
        document.documentElement.classList.remove('light-mode');
    }
}
