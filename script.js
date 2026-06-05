/* ============================================
   GitHub Profile Card — JavaScript
   ============================================ */

// === DOM References ===
const usernameInput = document.getElementById('usernameInput');
const usernameInput2 = document.getElementById('usernameInput2');
const searchBtn = document.getElementById('searchBtn');
const randomBtn = document.getElementById('randomBtn');
const compareCheckbox = document.getElementById('compareCheckbox');
const secondUserInput = document.getElementById('secondUserInput');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const resultEl = document.getElementById('result');
const profileGrid = document.getElementById('profileGrid');
const themeToggle = document.getElementById('themeToggle');
const recentSearches = document.getElementById('recentSearches');
const recentList = document.getElementById('recentList');

// === State ===
let reposData = { 1: [], 2: [] };

// === Theme ===
function initTheme() {
    const saved = localStorage.getItem('gh-theme');
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === 'light';
    if (isLight) {
        html.removeAttribute('data-theme');
        localStorage.setItem('gh-theme', 'dark');
        themeToggle.textContent = '🌙';
    } else {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('gh-theme', 'light');
        themeToggle.textContent = '☀️';
    }
}

themeToggle.addEventListener('click', toggleTheme);
initTheme();

// === Compare Toggle ===
compareCheckbox.addEventListener('change', () => {
    if (compareCheckbox.checked) {
        secondUserInput.classList.remove('hidden');
        usernameInput2.focus();
    } else {
        secondUserInput.classList.add('hidden');
        usernameInput2.value = '';
    }
});

// === Recent Searches ===
function getRecentSearches() {
    try {
        return JSON.parse(localStorage.getItem('gh-recent') || '[]');
    } catch {
        return [];
    }
}

function saveRecentSearches(searches) {
    localStorage.setItem('gh-recent', JSON.stringify(searches));
}

function addRecentSearch(username) {
    if (!username) return;
    let searches = getRecentSearches();
    searches = searches.filter(s => s !== username);
    searches.unshift(username);
    if (searches.length > 5) searches = searches.slice(0, 5);
    saveRecentSearches(searches);
    renderRecentSearches();
}

function renderRecentSearches() {
    const searches = getRecentSearches();
    if (searches.length === 0) {
        recentSearches.classList.add('hidden');
        return;
    }
    recentSearches.classList.remove('hidden');
    recentList.innerHTML = searches.map(s =>
        `<button class="recent-item" data-username="${s}">${s}</button>`
    ).join('');
}

recentList.addEventListener('click', (e) => {
    const btn = e.target.closest('.recent-item');
    if (!btn) return;
    const username = btn.dataset.username;
    if (!usernameInput.value) {
        usernameInput.value = username;
        usernameInput.focus();
    } else if (compareCheckbox.checked && !usernameInput2.value) {
        usernameInput2.value = username;
        usernameInput2.focus();
    } else {
        usernameInput.value = username;
        usernameInput2.value = '';
        usernameInput.focus();
    }
});

renderRecentSearches();

// === API ===
const API_BASE = 'https://api.github.com';

// GitHub API token (увеличивает лимит с 60 до 5000 запросов/час)
// Получить токен: https://github.com/settings/tokens (нужны права только public_repo)
// Можно указать через localStorage: localStorage.setItem('gh-token', 'ваш_токен')
function getAuthHeaders() {
    const token = localStorage.getItem('gh-token') || '';
    const headers = { Accept: 'application/vnd.github.v3+json' };
    if (token) {
        headers.Authorization = `token ${token}`;
    }
    return headers;
}

async function fetchUser(username) {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}`, {
        headers: getAuthHeaders()
    });
    if (res.status === 404) {
        throw new Error(`Пользователь «${username}» не найден`);
    }
    if (res.status === 403) {
        throw new Error(`Превышен лимит запросов к GitHub API. Укажите токен в настройках или подождите час.`);
    }
    if (!res.ok) {
        throw new Error(`Ошибка API: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

async function fetchRepos(username) {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`, {
        headers: getAuthHeaders()
    });
    if (res.status === 403) {
        throw new Error(`Превышен лимит запросов к GitHub API. Укажите токен в настройках или подождите час.`);
    }
    if (!res.ok) {
        throw new Error(`Не удалось загрузить репозитории для «${username}»`);
    }
    return res.json();
}

// === Language colors ===
const LANGUAGE_COLORS = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Java: '#b07219',
    Go: '#00ADD8',
    Rust: '#dea584',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    Scala: '#c22d40',
    Shell: '#89e051',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Vue: '#41b883',
    Lua: '#000080',
    Haskell: '#5e5086',
    Elixir: '#6e4a7e',
    Clojure: '#db5855',
    Erlang: '#B83998',
    R: '#198CE7',
    Objective_C: '#438eff',
    Perl: '#0298c3',
    Julia: '#a270ba',
    Solidity: '#AA6746',
    default: '#6b5d4e'
};

function getLanguageColor(lang) {
    return LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default;
}

// === Render functions ===
function renderProfile(data, num) {
    document.getElementById(`avatar${num}`).src = data.avatar_url;
    document.getElementById(`avatar${num}`).alt = `${data.login}'s avatar`;
    document.getElementById(`name${num}`).textContent = data.name || data.login;
    document.getElementById(`login${num}`).textContent = `@${data.login}`;
    document.getElementById(`bio${num}`).textContent = data.bio || '';
    document.getElementById(`publicRepos${num}`).textContent = data.public_repos;
    document.getElementById(`followers${num}`).textContent = data.followers;
    document.getElementById(`following${num}`).textContent = data.following;
}

function renderRepos(repos, num) {
    const list = document.getElementById(`reposList${num}`);
    if (!repos || repos.length === 0) {
        list.innerHTML = '<div class="repo-item"><p class="repo-description">Нет публичных репозиториев</p></div>';
        return;
    }

    list.innerHTML = repos.slice(0, 5).map(repo => {
        const desc = repo.description || '';
        const lang = repo.language || '';
        const stars = repo.stargazers_count || 0;
        const forks = repo.forks_count || 0;

        return `
            <div class="repo-item">
                <a href="${repo.html_url}" target="_blank" class="repo-name">${repo.name}</a>
                ${desc ? `<p class="repo-description">${escapeHtml(desc)}</p>` : ''}
                <div class="repo-meta">
                    ${lang ? `<span><span class="repo-language-dot" style="background:${getLanguageColor(lang)}"></span>${lang}</span>` : ''}
                    ${stars > 0 ? `<span>★ ${stars}</span>` : ''}
                    ${forks > 0 ? `<span>⑂ ${forks}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderLanguages(repos, num) {
    const list = document.getElementById(`languagesList${num}`);
    const langCount = {};

    repos.forEach(repo => {
        if (repo.language) {
            langCount[repo.language] = (langCount[repo.language] || 0) + 1;
        }
    });

    const total = Object.values(langCount).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(langCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (sorted.length === 0) {
        list.innerHTML = '<p style="color:var(--text-secondary);font-style:italic;font-size:0.85rem;">Нет данных о языках</p>';
        return;
    }

    list.innerHTML = sorted.map(([lang, count]) => {
        const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        return `
            <div class="language-item">
                <span class="language-color" style="background:${getLanguageColor(lang)}"></span>
                <span class="language-name">${lang}</span>
                <div class="language-bar-wrapper">
                    <div class="language-bar" style="width:${percent}%;background:${getLanguageColor(lang)}"></div>
                </div>
                <span class="language-percent">${percent}%</span>
            </div>
        `;
    }).join('');
}

// === Sort repos ===
function sortRepos(repos, sortBy) {
    const sorted = [...repos];
    switch (sortBy) {
        case 'stars':
            sorted.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
            break;
        case 'created':
            sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'updated':
        default:
            sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            break;
    }
    return sorted;
}

// === Sort select handlers ===
document.querySelectorAll('.sort-select').forEach(select => {
    select.addEventListener('change', () => {
        const userNum = parseInt(select.dataset.user);
        const sorted = sortRepos(reposData[userNum], select.value);
        renderRepos(sorted, userNum);
    });
});

// === Main search ===
async function searchUsers() {
    const username1 = usernameInput.value.trim();
    const isCompare = compareCheckbox.checked;
    const username2 = isCompare ? usernameInput2.value.trim() : '';

    if (!username1) {
        showError('Введите GitHub-юзернейм');
        return;
    }

    hideError();
    showLoading();
    hideResult();

    try {
        // Параллельные запросы
        const promises = [];

        promises.push(
            fetchUser(username1).then(data => ({ num: 1, data })),
            fetchRepos(username1).then(data => ({ num: 1, repos: data }))
        );

        if (isCompare && username2) {
            promises.push(
                fetchUser(username2).then(data => ({ num: 2, data })),
                fetchRepos(username2).then(data => ({ num: 2, repos: data }))
            );
        }

        const results = await Promise.all(promises);

        // Обрабатываем результаты
        const userData = {};
        const repoData = {};

        results.forEach(r => {
            if (r.data) userData[r.num] = r.data;
            if (r.repos) repoData[r.num] = r.repos;
        });

        // Сохраняем данные
        reposData[1] = repoData[1] || [];
        addRecentSearch(username1);

        if (isCompare && username2) {
            reposData[2] = repoData[2] || [];
            addRecentSearch(username2);
        }

        // Показываем/скрываем колонки
        document.getElementById('userColumn1').classList.remove('hidden');
        document.getElementById('userColumn2').classList.toggle('hidden', !(isCompare && username2));

        // Управляем режимом сравнения
        profileGrid.classList.toggle('compare-mode', isCompare && !!username2);

        // Рендерим первого пользователя
        if (userData[1]) {
            renderProfile(userData[1], 1);
            const sorted1 = sortRepos(reposData[1], 'updated');
            renderRepos(sorted1, 1);
            renderLanguages(reposData[1], 1);
        }

        // Рендерим второго пользователя (если есть)
        if (isCompare && username2 && userData[2]) {
            renderProfile(userData[2], 2);
            const sorted2 = sortRepos(reposData[2], 'updated');
            renderRepos(sorted2, 2);
            renderLanguages(reposData[2], 2);
        }

        hideLoading();
        showResult();

    } catch (err) {
        hideLoading();
        showError(err.message);
    }
}

// === Random users ===
const RANDOM_USERS = [
    'torvalds', 'gaearon', 'addyosmani', 'sindresorhus', 'tj',
    'yyx990803', 'mojombo', 'defunkt', 'pjhyett', 'dhh',
    'jeresig', 'paulirish', 'fat', 'mdo', 'necolas',
    'kentcdodds', 'dan_abramov', 'thejameskyle', 'developit', 'feross'
];

function getRandomUsers() {
    const shuffled = [...RANDOM_USERS].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
}

randomBtn.addEventListener('click', () => {
    const [u1, u2] = getRandomUsers();
    usernameInput.value = u1;
    if (compareCheckbox.checked) {
        usernameInput2.value = u2;
    } else {
        usernameInput2.value = '';
    }
    searchUsers();
});

// === Event listeners ===
searchBtn.addEventListener('click', searchUsers);

usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (compareCheckbox.checked && !usernameInput2.value) {
            usernameInput2.focus();
        } else {
            searchUsers();
        }
    }
});

usernameInput2.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchUsers();
});

// === UI helpers ===
function showLoading() {
    loadingEl.classList.remove('hidden');
}

function hideLoading() {
    loadingEl.classList.add('hidden');
}

function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
}

function hideError() {
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
}

function showResult() {
    resultEl.classList.remove('hidden');
}

function hideResult() {
    resultEl.classList.add('hidden');
}
