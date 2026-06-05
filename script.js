const usernameInput = document.getElementById('usernameInput');
const searchBtn = document.getElementById('searchBtn');
const randomBtn = document.getElementById('randomBtn');
const themeToggle = document.getElementById('themeToggle');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const result = document.getElementById('result');

// Profile elements
const avatar = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const loginEl = document.getElementById('login');
const bioEl = document.getElementById('bio');
const publicRepos = document.getElementById('publicRepos');
const followers = document.getElementById('followers');
const following = document.getElementById('following');
const reposList = document.getElementById('reposList');
const sortSelect = document.getElementById('sortSelect');
const languagesList = document.getElementById('languagesList');
const languagesSection = document.getElementById('languagesSection');
const recentSearches = document.getElementById('recentSearches');
const recentList = document.getElementById('recentList');

// State
let currentUsername = '';
let allRepos = [];

// Known developers for random button
const knownDevelopers = [
    'torvalds', 'gaearon', 'addyosmani', 'sindresorhus', 'tj',
    'paulirish', 'yyx990803', 'mojombo', 'defunkt', 'jeresig',
    'mdo', 'fat', 'dhh', 'matz', 'fabpot',
    'schacon', 'kennethreitz', 'mitsuhiko', 'visionmedia', 'substack'
];

// Language colors mapping
const languageColors = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#3178c6',
    'Python': '#3572A5',
    'Java': '#b07219',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'C++': '#f34b7d',
    'C': '#555555',
    'C#': '#178600',
    'Ruby': '#701516',
    'PHP': '#4F5D95',
    'Swift': '#F05138',
    'Kotlin': '#A97BFF',
    'Dart': '#00B4AB',
    'Scala': '#c22d40',
    'Shell': '#89e051',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Vue': '#41b883',
    'Lua': '#000080',
    'R': '#198CE7',
    'Haskell': '#5e5086',
    'Elixir': '#6e4a7e',
    'Clojure': '#db5855',
    'Erlang': '#B83998',
    'Objective-C': '#438eff',
    'Perl': '#0298c3',
    'Julia': '#a270ba',
    'Assembly': '#6E4C13',
    'TeX': '#3D6117',
    'Dockerfile': '#384d54',
    'Makefile': '#427819',
};

// ========== THEME ==========

function loadTheme() {
    const saved = localStorage.getItem('github-card-theme');
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.textContent = '☀️';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
    }
}

themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
        localStorage.setItem('github-card-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.textContent = '☀️';
        localStorage.setItem('github-card-theme', 'light');
    }
});

loadTheme();

// ========== RECENT SEARCHES ==========

function loadRecentSearches() {
    const saved = localStorage.getItem('github-card-recent');
    if (!saved) return [];
    try {
        return JSON.parse(saved);
    } catch {
        return [];
    }
}

function saveRecentSearches(usernames) {
    localStorage.setItem('github-card-recent', JSON.stringify(usernames));
}

function addRecentSearch(username) {
    let recent = loadRecentSearches();
    recent = recent.filter(u => u.toLowerCase() !== username.toLowerCase());
    recent.unshift(username);
    if (recent.length > 5) recent = recent.slice(0, 5);
    saveRecentSearches(recent);
    renderRecentSearches();
}

function renderRecentSearches() {
    const recent = loadRecentSearches();
    if (recent.length === 0) {
        recentSearches.classList.add('hidden');
        return;
    }
    recentSearches.classList.remove('hidden');
    recentList.innerHTML = '';
    recent.forEach(username => {
        const chip = document.createElement('span');
        chip.className = 'recent-item';
        chip.textContent = username;
        chip.addEventListener('click', () => {
            usernameInput.value = username;
            fetchProfile(username);
        });
        recentList.appendChild(chip);
    });
}

renderRecentSearches();

// ========== SEARCH ==========

searchBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) fetchProfile(username);
});

usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const username = usernameInput.value.trim();
        if (username) fetchProfile(username);
    }
});

// ========== RANDOM USER ==========

randomBtn.addEventListener('click', () => {
    const random = knownDevelopers[Math.floor(Math.random() * knownDevelopers.length)];
    usernameInput.value = random;
    fetchProfile(random);
});

// ========== SORTING ==========

sortSelect.addEventListener('change', () => {
    if (allRepos.length > 0) {
        const sorted = sortRepos(allRepos, sortSelect.value).slice(0, 5);
        displayRepos(sorted);
    }
});

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

// ========== UI HELPERS ==========

function showLoading() {
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    result.classList.add('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
    hideLoading();
    result.classList.add('hidden');
}

function hideError() {
    error.classList.add('hidden');
}

// ========== MAIN FETCH ==========

async function fetchProfile(username) {
    showLoading();
    hideError();

    try {
        const userResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);

        if (userResponse.status === 404) {
            showError(`Пользователь "${username}" не найден на GitHub. Проверьте правильность написания юзернейма.`);
            return;
        }

        if (!userResponse.ok) {
            showError(`Ошибка при запросе к GitHub API. Статус: ${userResponse.status}. Попробуйте позже.`);
            return;
        }

        const userData = await userResponse.json();

        // Fetch all repos (up to 100 for language stats)
        const reposResponse = await fetch(
            `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100&type=owner`
        );

        if (!reposResponse.ok) {
            showError(`Ошибка при загрузке репозиториев. Статус: ${reposResponse.status}. Попробуйте позже.`);
            return;
        }

        allRepos = await reposResponse.json();

        // Display profile
        displayProfile(userData);

        // Display sorted repos (default: by update)
        const sortedRepos = sortRepos(allRepos, sortSelect.value).slice(0, 5);
        displayRepos(sortedRepos);

        // Display languages
        displayLanguages(allRepos);

        hideLoading();
        result.classList.remove('hidden');

        // Save to recent
        currentUsername = username;
        addRecentSearch(username);

    } catch (err) {
        showError('Не удалось выполнить запрос. Проверьте подключение к интернету и попробуйте снова.');
        console.error('Fetch error:', err);
    }
}

// ========== DISPLAY PROFILE ==========

function displayProfile(user) {
    avatar.src = user.avatar_url;
    avatar.alt = `Аватар ${user.login}`;
    nameEl.textContent = user.name || user.login;
    loginEl.textContent = `@${user.login}`;
    bioEl.textContent = user.bio || '';
    publicRepos.textContent = user.public_repos;
    followers.textContent = user.followers;
    following.textContent = user.following;
}

// ========== DISPLAY REPOS ==========

function displayRepos(repos) {
    reposList.innerHTML = '';

    if (repos.length === 0) {
        reposList.innerHTML = '<p class="repo-item" style="color: var(--text-secondary);">У пользователя пока нет публичных репозиториев.</p>';
        return;
    }

    repos.forEach(repo => {
        const repoItem = document.createElement('div');
        repoItem.className = 'repo-item';

        const repoLink = document.createElement('a');
        repoLink.className = 'repo-name';
        repoLink.href = repo.html_url;
        repoLink.target = '_blank';
        repoLink.rel = 'noopener noreferrer';
        repoLink.textContent = repo.name;

        const repoDesc = document.createElement('p');
        repoDesc.className = 'repo-description';
        repoDesc.textContent = repo.description || '';

        const repoMeta = document.createElement('div');
        repoMeta.className = 'repo-meta';

        // Language
        if (repo.language) {
            const langSpan = document.createElement('span');
            const dot = document.createElement('span');
            dot.className = 'repo-language-dot';
            dot.style.backgroundColor = languageColors[repo.language] || '#8b949e';
            langSpan.appendChild(dot);
            langSpan.appendChild(document.createTextNode(repo.language));
            repoMeta.appendChild(langSpan);
        }

        // Stars
        if (repo.stargazers_count > 0) {
            const starsSpan = document.createElement('span');
            starsSpan.textContent = `⭐ ${repo.stargazers_count}`;
            repoMeta.appendChild(starsSpan);
        }

        // Forks
        if (repo.forks_count > 0) {
            const forksSpan = document.createElement('span');
            forksSpan.textContent = `⑂ ${repo.forks_count}`;
            repoMeta.appendChild(forksSpan);
        }

        repoItem.appendChild(repoLink);
        repoItem.appendChild(repoDesc);
        if (repoMeta.children.length > 0) {
            repoItem.appendChild(repoMeta);
        }
        reposList.appendChild(repoItem);
    });
}

// ========== DISPLAY LANGUAGES ==========

function displayLanguages(repos) {
    const langMap = new Map();

    repos.forEach(repo => {
        if (repo.language) {
            langMap.set(repo.language, (langMap.get(repo.language) || 0) + 1);
        }
    });

    if (langMap.size === 0) {
        languagesSection.classList.add('hidden');
        return;
    }

    languagesSection.classList.remove('hidden');

    // Sort by count descending
    const sorted = [...langMap.entries()].sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, [, count]) => sum + count, 0);

    languagesList.innerHTML = '';

    sorted.forEach(([lang, count]) => {
        const percent = ((count / total) * 100).toFixed(1);
        const color = languageColors[lang] || '#8b949e';

        const item = document.createElement('div');
        item.className = 'language-item';

        const colorDot = document.createElement('span');
        colorDot.className = 'language-color';
        colorDot.style.backgroundColor = color;

        const name = document.createElement('span');
        name.className = 'language-name';
        name.textContent = lang;

        const barWrapper = document.createElement('div');
        barWrapper.className = 'language-bar-wrapper';

        const bar = document.createElement('div');
        bar.className = 'language-bar';
        bar.style.width = `${percent}%`;
        bar.style.backgroundColor = color;
        barWrapper.appendChild(bar);

        const percentText = document.createElement('span');
        percentText.className = 'language-percent';
        percentText.textContent = `${percent}%`;

        item.appendChild(colorDot);
        item.appendChild(name);
        item.appendChild(barWrapper);
        item.appendChild(percentText);
        languagesList.appendChild(item);
    });
}
