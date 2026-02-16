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

    // 1. Select all user containers (works for both Followers and Following files)
    // The class 'pam' and '_a6-g' are standard wrappers in these exports
    const userCards = doc.querySelectorAll('div.pam._3-95._2ph-._a6-g');

    userCards.forEach(card => {
        let username = '';
        let profileUrl = '';

        // ATTEMPT 1: Look for a Header (Common in "Following.html")
        const header = card.querySelector('h2');
        if (header) {
            username = header.textContent.trim();
        }

        // ATTEMPT 2: Look for a Link (Common in "Followers.html")
        if (!username) {
            const link = card.querySelector('div._a6-p a');
            if (link) {
                const href = link.getAttribute('href');
                if (href && href.includes('instagram.com/')) {
                    // Split by instagram.com/ to get the path
                    const parts = href.split('instagram.com/');
                    if (parts.length > 1) {
                        let segment = parts[1];
                        
                        // FIX: Remove mobile prefix "_u/" if present
                        if (segment.startsWith('_u/')) {
                            segment = segment.substring(3); // Remove first 3 chars "_u/"
                        }

                        // Clean up trailing slashes or query params
                        segment = segment.split('/')[0].split('?')[0];
                        username = segment;
                        profileUrl = href;
                    }
                }
                // Backup: Use link text if URL parsing failed
                if (!username) username = link.textContent.trim();
            }
        }

        // ATTEMPT 3: Look for Plain Text (Deactivated accounts in "Followers.html")
        if (!username) {
            // Path: Card -> Wrapper -> Inner Div -> Text Div
            const textDiv = card.querySelector('div._a6-p > div > div');
            if (textDiv) {
                const text = textDiv.textContent.trim();
                // Filter out dates (simple check: dates usually contain 4 digits like 2023)
                // or we can rely on the fact that usernames usually don't have spaces, 
                // but "Oct 24, 2023" does.
                if (!text.includes(',')) { 
                    username = text;
                    profileUrl = 'Deactivated/No Link';
                }
            }
        }

        // FINAL CHECK: Add valid usernames to list
        if (username && username !== "Instagram User") {
            if (!seenUsernames.has(username)) {
                seenUsernames.add(username);
                users.push({
                    username: username,
                    url: profileUrl || `https://www.instagram.com/${username}`
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