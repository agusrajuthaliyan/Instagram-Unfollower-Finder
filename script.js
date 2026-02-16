let followersData = null;
let followingData = null;

const followersFileInput = document.getElementById('followersFile');
const followingFileInput = document.getElementById('followingFile');
const followersBox = document.getElementById('followersBox');
const followingBox = document.getElementById('followingBox');
const analyzeBtn = document.getElementById('analyzeBtn');
const results = document.getElementById('results');
const exportBtn = document.getElementById('exportBtn');

function parseInstagramHTML(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const users = [];
    const seenUsernames = new Set();

    // Select all links
    const links = doc.querySelectorAll('a');

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Clean trailing slash
        let cleanHref = href;
        if (cleanHref.endsWith('/')) {
            cleanHref = cleanHref.slice(0, -1);
        }

        // Check if it looks like a profile link
        // Standard format: https://www.instagram.com/username
        // We match strictly for a username after instagram.com/
        // Remove query parameters
        cleanHref = cleanHref.split('?')[0];

        let username = '';
        if (cleanHref.includes('instagram.com/')) {
            const parts = cleanHref.split('instagram.com/');
            if (parts.length > 1) {
                let segment = parts[1];

                if (segment.startsWith('_u/')) {
                    segment = segment.substring(3);
                }
                username = segment.split('/')[0];
            }
        }

        if (username && /^[a-zA-Z0-9._]+$/.test(username)) {
            // Filter out common non-profile paths
            const nonUserPaths = ['p', 'reel', 'tv', 'stories', 'explore', 'about', 'developer', 'help', 'legal', 'privacy', 'terms'];

            if (!nonUserPaths.includes(username) && !seenUsernames.has(username)) {
                seenUsernames.add(username);
                users.push({
                    username: username,
                    url: href
                });
            }
        }
    });

    return users;
}

followersFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const text = await file.text();
        followersData = parseInstagramHTML(text);
        document.getElementById('followersName').textContent = file.name;
        followersBox.classList.add('active');
        checkAnalyzeButton();
    }
});

followingFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const text = await file.text();
        followingData = parseInstagramHTML(text);
        document.getElementById('followingName').textContent = file.name;
        followingBox.classList.add('active');
        checkAnalyzeButton();
    }
});

function checkAnalyzeButton() {
    if (followersData && followingData) {
        analyzeBtn.disabled = false;
    }
}

// Stat elements
const statFollowingBtn = document.getElementById('statFollowing');
const statFollowersBtn = document.getElementById('statFollowers');
const statNotFollowingBtn = document.getElementById('statNotFollowingBack');
const resultsTitle = document.querySelector('.results-title');

let currentList = [];
let currentFilter = 'not_following_back'; // 'following', 'followers', 'not_following_back'

// Data store
let processedData = {
    following: [],
    followers: [],
    notFollowingBack: []
};

function updateActiveStat(type) {
    [statFollowingBtn, statFollowersBtn, statNotFollowingBtn].forEach(btn => btn.classList.remove('active'));

    if (type === 'following') statFollowingBtn.classList.add('active');
    else if (type === 'followers') statFollowersBtn.classList.add('active');
    else if (type === 'not_following_back') statNotFollowingBtn.classList.add('active');
}

function updateList(type) {
    currentFilter = type;
    updateActiveStat(type);

    let listToShow = [];
    let title = '';

    if (type === 'following') {
        listToShow = processedData.following;
        title = `Following (${listToShow.length})`;
    } else if (type === 'followers') {
        listToShow = processedData.followers;
        title = `Followers (${listToShow.length})`;
    } else {
        listToShow = processedData.notFollowingBack;
        title = `Not Following Back (${listToShow.length})`;
    }

    resultsTitle.textContent = title;
    displayResults(listToShow, type === 'not_following_back'); // Pass context if needed
}

analyzeBtn.addEventListener('click', () => {
    if (!followersData || !followingData) {
        console.error('followersData or followingData is empty');
        return;
    }

    const followerUsernames = new Set(followersData.map(u => u.username.toLowerCase()));
    const notFollowingBack = followingData.filter(
        user => !followerUsernames.has(user.username.toLowerCase())
    );

    // Store data
    processedData.following = followingData;
    processedData.followers = followersData;
    processedData.notFollowingBack = notFollowingBack;

    // Update stats UI
    document.getElementById('totalFollowing').textContent = followingData.length;
    document.getElementById('totalFollowers').textContent = followersData.length;
    document.getElementById('notFollowingBack').textContent = notFollowingBack.length;

    // Show default view
    updateList('not_following_back');

    results.classList.add('show');
    setTimeout(() => {
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
});

// Stat Click Listeners
statFollowingBtn.addEventListener('click', () => updateList('following'));
statFollowersBtn.addEventListener('click', () => updateList('followers'));
statNotFollowingBtn.addEventListener('click', () => updateList('not_following_back'));

function displayResults(users, isUnfollowersView = false) {
    if (!users) {
        throw new Error('displayResults called with null or undefined argument');
    }

    const userList = document.getElementById('user-list');

    if (!userList) {
        throw new Error('displayResults could not find element with id "user-list"');
    }

    userList.innerHTML = '';

    try {
        if (users.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';

            if (isUnfollowersView) {
                emptyState.innerHTML = `
                    <div class="empty-icon">🎉</div>
                    <div class="empty-title">You're all set!</div>
                    <div class="empty-description">Everyone you follow follows you back.</div>
                `;
            } else {
                emptyState.innerHTML = `
                    <div class="empty-icon">📂</div>
                    <div class="empty-title">No users found</div>
                    <div class="empty-description">This list is empty.</div>
                `;
            }
            userList.appendChild(emptyState);
            return;
        }

        for (const user of users) {
            if (!user) {
                continue;
            }

            const listItem = document.createElement('li');
            listItem.className = 'user-item';

            // Avatar with initials
            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.textContent = user.username.substring(0, 2).toUpperCase();
            listItem.appendChild(avatar);

            // User Info
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';

            const usernameDiv = document.createElement('div');
            usernameDiv.className = 'username';
            usernameDiv.textContent = user.username;
            userInfo.appendChild(usernameDiv);

            const link = document.createElement('a');
            link.className = 'profile-link';
            link.href = user.url;
            link.target = '_blank';
            link.textContent = 'View Profile';
            userInfo.appendChild(link);

            listItem.appendChild(userInfo);

            if (!userList.appendChild(listItem)) {
                throw new Error('displayResults could not append list item element to list');
            }
        }
    } catch (error) {
        console.error(`displayResults encountered an error: ${error}`);
    }
}

exportBtn.addEventListener('click', () => {
    let listToExport = [];
    let filename = 'instagram_data.csv';

    if (currentFilter === 'following') {
        listToExport = processedData.following;
        filename = 'instagram_following.csv';
    } else if (currentFilter === 'followers') {
        listToExport = processedData.followers;
        filename = 'instagram_followers.csv';
    } else {
        listToExport = processedData.notFollowingBack;
        filename = 'instagram_unfollowers.csv';
    }

    let csv = 'Username,Profile URL\n';
    listToExport.forEach(user => {
        csv += `${user.username},${user.url}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
});

// Drag and drop
[followersBox, followingBox].forEach(box => {
    const input = box.querySelector('input[type="file"]');

    box.addEventListener('dragover', (e) => {
        e.preventDefault();
        box.style.borderColor = '#52525b';
        box.style.background = '#18181b';
    });

    box.addEventListener('dragleave', () => {
        if (!box.classList.contains('active')) {
            box.style.borderColor = '';
            box.style.background = '';
        }
    });

    box.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            input.files = files;
            input.dispatchEvent(new Event('change'));
        }
    });
});