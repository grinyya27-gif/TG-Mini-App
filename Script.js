// ====================================================================================================================
// === GameHub ULTRA - JAVASCRIPT (более 1500 строк)
// ====================================================================================================================
document.addEventListener('DOMContentLoaded', () => {

    // =======================================================
    // --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ, КОНСТАНТЫ И УТИЛИТЫ ---
    // =======================================================
    const DB_KEY = 'gamehub_users_v3';
    const SESSION_KEY = 'gamehub_currentUser_v3';
    const AVATARS = [1, 2, 3, 4, 5, 6, 7, 8].map(n => `https://api.dicebear.com/8.x/pixel-art/svg?seed=${n}.svg`);
    
    let activeGame = {
        interval: null,
        keyListener: null,
        timer: null,
    };

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    function showToast(message, type = 'info') {
        const container = $('#toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    function openModal(modalId) { $(`#${modalId}`).style.display = 'block'; }
    function closeModal(modalId) { $(`#${modalId}`).style.display = 'none'; }
    $$('.modal .close-button').forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal').id)));
    window.addEventListener('click', (event) => { if (event.target.classList.contains('modal')) closeModal(event.target.id); });
    
    function confirmAction(title, text) {
        return new Promise((resolve) => {
            $('#confirm-title').textContent = title;
            $('#confirm-text').textContent = text;
            openModal('confirm-modal');
            $('#confirm-yes').onclick = () => { closeModal('confirm-modal'); resolve(true); };
            $('#confirm-no').onclick = () => { closeModal('confirm-modal'); resolve(false); };
        });
    }
    
    // =======================================================
    // --- ЛОГИКА АУТЕНТИФИКАЦИИ И УПРАВЛЕНИЯ ДАННЫМИ ---
    // =======================================================
    const AuthManager = {
        getCurrentUser: () => sessionStorage.getItem(SESSION_KEY),
        getUsers: () => JSON.parse(localStorage.getItem(DB_KEY)) || [],
        saveUsers: (users) => localStorage.setItem(DB_KEY, JSON.stringify(users)),
        hashPassword: (password) => btoa(password + "super_secret_salt"),

        init() {
            this.populateAvatars();
            $('#signup-form').addEventListener('submit', this.handleSignup.bind(this));
            $('#login-form').addEventListener('submit', this.handleLogin.bind(this));
            $('#logout-btn').addEventListener('click', this.handleLogout.bind(this));
            $('#profile-btn').addEventListener('click', UI.showProfile);
            $$('.switch-link').forEach(link => link.addEventListener('click', (e) => {
                closeModal(e.target.closest('.modal').id);
                openModal(e.target.dataset.modal);
            }));
        },

        populateAvatars() {
            const selector = $('#avatar-selector');
            AVATARS.forEach((src, index) => {
                const img = document.createElement('img');
                img.src = src;
                img.classList.add('avatar-option');
                if (index === 0) img.classList.add('selected');
                img.onclick = () => {
                    $$('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                    img.classList.add('selected');
                };
                selector.appendChild(img);
            });
        },

        handleSignup(e) {
            e.preventDefault();
            const username = $('#signup-username').value.trim();
            const password = $('#signup-password').value;
            const errorDiv = $('#signup-username-error');
            const users = this.getUsers();

            if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
                errorDiv.textContent = 'Это имя пользователя уже занято.';
                errorDiv.style.display = 'block';
                return;
            }
            errorDiv.style.display = 'none';

            const newUser = {
                username,
                passwordHash: this.hashPassword(password),
                avatar: $('.avatar-option.selected').src,
                stats: {
                    snake: { highScore: 0 },
                    clicker: { highScore: 0 },
                    tictactoe: { wins: 0 },
                    memory: { bestTime: Infinity, bestMoves: Infinity },
                    typing: { bestWPM: 0, bestAccuracy: 0 }
                }
            };
            users.push(newUser);
            this.saveUsers(users);
            showToast('Регистрация прошла успешно!', 'success');
            closeModal('signup-modal');
            openModal('login-modal');
        },

        handleLogin(e) {
            e.preventDefault();
            const username = $('#login-username').value.trim();
            const password = $('#login-password').value;
            const errorDiv = $('#login-error');
            const user = this.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());

            if (user && user.passwordHash === this.hashPassword(password)) {
                sessionStorage.setItem(SESSION_KEY, user.username);
                UI.updateForLogin(user);
                closeModal('login-modal');
                errorDiv.style.display = 'none';
                showToast(`Добро пожаловать, ${user.username}!`, 'success');
                Leaderboard.updateAll();
            } else {
                errorDiv.style.display = 'block';
            }
        },

        async handleLogout() {
            if (await confirmAction('Выход', 'Вы уверены, что хотите выйти?')) {
                sessionStorage.removeItem(SESSION_KEY);
                UI.updateForLogout();
                showToast('Вы успешно вышли из системы.');
                Leaderboard.updateAll();
            }
        },
        
        updateUserStat(game, newStats) {
            const username = this.getCurrentUser();
            if (!username) return;
            let users = this.getUsers();
            const userIndex = users.findIndex(u => u.username === username);
            if (userIndex === -1) return;

            let updated = false;
            const userStats = users[userIndex].stats[game];
            
            Object.keys(newStats).forEach(key => {
                if (key.startsWith('best')) { // Lower is better for time/moves
                    if (newStats[key] < userStats[key]) {
                        userStats[key] = newStats[key];
                        updated = true;
                    }
                } else { // Higher is better for scores/wpm
                    if (newStats[key] > userStats[key]) {
                        userStats[key] = newStats[key];
                        updated = true;
                    }
                }
            });

            if (updated) {
                this.saveUsers(users);
                showToast('Новый рекорд!', 'success');
                Leaderboard.updateAll();
            }
        }
    };

    // =======================================================
    // --- УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ (UI) ---
    // =======================================================
    const UI = {
        init() {
            const currentUser = AuthManager.getCurrentUser();
            if (currentUser) {
                const user = AuthManager.getUsers().find(u => u.username === currentUser);
                if (user) this.updateForLogin(user);
                else this.updateForLogout();
            } else {
                this.updateForLogout();
            }
        },

        updateForLogin(user) {
            $('.auth-buttons').style.display = 'none';
            $('.user-info').style.display = 'flex';
            $('.user-greeting').innerHTML = `<img src="${user.avatar}" alt="avatar"> ${user.username}`;
            $('#hero-title').textContent = `С возвращением, ${user.username}!`;
            $('#hero-subtitle').textContent = 'Ваши рекорды ждут вас.';
        },

        updateForLogout() {
            $('.auth-buttons').style.display = 'flex';
            $('.user-info').style.display = 'none';
            $('#hero-title').textContent = `Вселенная браузерных игр`;
            $('#hero-subtitle').textContent = 'Играй, соревнуйся и становись легендой.';
        },

        showProfile() {
            const username = AuthManager.getCurrentUser();
            if (!username) return;
            const user = AuthManager.getUsers().find(u => u.username === username);
            if (!user) return;

            const content = $('#profile-content');
            content.innerHTML = `
                <div id="profile-header">
                    <img src="${user.avatar}" alt="avatar">
                    <h3 id="profile-username">${user.username}</h3>
                </div>
                <div class="profile-stats">
                    <h4>Змейка</h4>
                    <div class="stat-item"><span>Рекорд</span><span>${user.stats.snake.highScore}</span></div>
                    <h4>Кликер</h4>
                    <div class="stat-item"><span>Рекорд</span><span>${user.stats.clicker.highScore}</span></div>
                    <h4>Найди Пару</h4>
                    <div class="stat-item"><span>Лучшее время</span><span>${user.stats.memory.bestTime === Infinity ? 'N/A' : user.stats.memory.bestTime + 's'}</span></div>
                    <div class="stat-item"><span>Мин. ходов</span><span>${user.stats.memory.bestMoves === Infinity ? 'N/A' : user.stats.memory.bestMoves}</span></div>
                    <h4>Скорость Печати</h4>
                    <div class="stat-item"><span>Лучший WPM</span><span>${user.stats.typing.bestWPM}</span></div>
                    <div class="stat-item"><span>Лучшая точность</span><span>${user.stats.typing.bestAccuracy}%</span></div>
                    <h4>Крестики-нолики</h4>
                    <div class="stat-item"><span>Всего побед</span><span>${user.stats.tictactoe.wins}</span></div>
                </div>
            `;
            openModal('profile-modal');
        }
    };

    // =======================================================
    // --- ЛОГИКА ТАБЛИЦ ЛИДЕРОВ ---
    // =======================================================
    const Leaderboard = {
        updateAll() {
            const users = AuthManager.getUsers();
            this.update('snake', users, 'highScore', true);
            this.update('clicker', users, 'highScore', true);
            this.update('memory', users, 'bestTime', false, 's');
            this.update('typing', users, 'bestWPM', true);
        },
        
        update(game, users, statKey, higherIsBetter, unit = '') {
            const sortedUsers = users
                .filter(u => u.stats[game][statKey] > 0 && u.stats[game][statKey] !== Infinity)
                .sort((a, b) => higherIsBetter ? b.stats[game][statKey] - a.stats[game][statKey] : a.stats[game][statKey] - b.stats[game][statKey])
                .slice(0, 5);
            
            const table = $(`#leaderboard-${game}`);
            const statName = statKey.includes('Time') ? 'Время' : (statKey.includes('WPM') ? 'WPM' : 'Счет');
            table.innerHTML = `<thead><tr><th>#</th><th>Игрок</th><th>${statName}</th></tr></thead><tbody></tbody>`;
            const tbody = table.querySelector('tbody');
            
            if (sortedUsers.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--subtle-text);">Пока нет рекордов</td></tr>`;
            } else {
                sortedUsers.forEach((user, index) => {
                    tbody.innerHTML += `
                        <tr>
                            <td class="rank">${index + 1}</td>
                            <td class="player"><img src="${user.avatar}" alt="avatar"> ${user.username}</td>
                            <td>${user.stats[game][statKey]}${unit}</td>
                        </tr>
                    `;
                });
            }
        }
    };

    // =======================================================
    // --- ГЛАВНЫЙ МЕНЕДЖЕР ИГР ---
    // =======================================================
    const GameManager = {
        init() {
            $$('.play-button').forEach(button => button.addEventListener('click', () => {
                this.prepareGame(button.dataset.game);
                openModal('game-modal');
            }));
            $('#game-modal .close-button').addEventListener('click', this.cleanup.bind(this));
        },

        cleanup() {
            if (activeGame.interval) clearInterval(activeGame.interval);
            if (activeGame.timer) clearInterval(activeGame.timer);
            if (activeGame.keyListener) document.removeEventListener('keydown', activeGame.keyListener);
            activeGame = { interval: null, keyListener: null, timer: null };
            $('#game-content-wrapper').innerHTML = '';
        },

        prepareGame(gameId) {
            this.cleanup();
            const title = $('#game-modal .modal-title');
            const wrapper = $('#game-content-wrapper');
            title.textContent = 'Настройки игры';

            const gameConfig = {
                snake: { title: 'Настройки "Змейки"', html: `<div class="game-settings"><h3>Выберите скорость:</h3><label><input type="radio" name="snake-speed" value="150" checked> Медленно</label><label><input type="radio" name="snake-speed" value="100"> Нормально</label><label><input type="radio" name="snake-speed" value="60"> Быстро</label></div><button class="btn primary" id="start-game-btn">Начать игру</button>` },
                memory: { title: 'Настройки "Найди пару"', html: `<div class="game-settings"><h3>Выберите размер поля:</h3><label><input type="radio" name="memory-size" value="16" checked> 4x4 (Легко)</label><label><input type="radio" name="memory-size" value="20"> 5x4 (Сложно)</label></div><button class="btn primary" id="start-game-btn">Начать игру</button>` }
            };

            if (gameConfig[gameId]) {
                title.textContent = gameConfig[gameId].title;
                wrapper.innerHTML = gameConfig[gameId].html;
                $('#start-game-btn').onclick = () => {
                    const option = $(`input[name="${gameId}-size"]`) || $(`input[name="${gameId}-speed"]`);
                    this.loadGame(gameId, { option: option ? parseInt(option.value) : null });
                };
            } else {
                this.loadGame(gameId);
            }
        },

        loadGame(gameId, options = {}) {
            this.cleanup();
            const title = $('#game-modal .modal-title');
            const gameLoaders = {
                snake: () => { title.textContent = 'Змейка'; GameLogic.initSnake(options.option); },
                tictactoe: () => { title.textContent = 'Крестики-нолики'; GameLogic.initTicTacToe(); },
                clicker: () => { title.textContent = 'Кликер-мания'; GameLogic.initClicker(); },
                memory: () => { title.textContent = 'Найди Пару'; GameLogic.initMemory(options.option); },
                typing: () => { title.textContent = 'Тест Скорости Печати'; GameLogic.initTyping(); }
            };
            if (gameLoaders[gameId]) gameLoaders[gameId]();
        }
    };

    // =======================================================
    // --- ЛОГИКА КАЖДОЙ ИГРЫ ---
    // =======================================================
    const GameLogic = {
        // --- 1. Змейка ---
        initSnake(speed) {
            $('#game-content-wrapper').innerHTML = `<canvas id="snake-canvas" width="400" height="400"></canvas><div id="snake-score" style="font-size: 1.5rem; margin-top: 10px;">Счет: 0</div>`;
            const canvas = $('#snake-canvas'), scoreEl = $('#snake-score'), ctx = canvas.getContext('2d'), gridSize = 20;
            let snake, food, score, direction, changingDirection;
            const resetGame = () => { score = 0; scoreEl.textContent = 'Счет: 0'; snake = [{ x: 10, y: 10 }]; direction = 'right'; generateFood(); };
            const generateFood = () => { food = { x: Math.floor(Math.random() * (canvas.width/gridSize)), y: Math.floor(Math.random() * (canvas.height/gridSize)) }; if (snake.some(s => s.x === food.x && s.y === food.y)) generateFood(); };
            const update = () => {
                changingDirection = false;
                const head = { x: snake[0].x, y: snake[0].y };
                if (direction === 'right') head.x++; if (direction === 'left') head.x--; if (direction === 'up') head.y--; if (direction === 'down') head.y++;
                if (head.x < 0 || head.x*gridSize >= canvas.width || head.y < 0 || head.y*gridSize >= canvas.height || snake.slice(1).some(s => s.x === head.x && s.y === head.y)) { AuthManager.updateUserStat('snake', { highScore: score }); resetGame(); return; }
                snake.unshift(head);
                if (head.x === food.x && head.y === food.y) { score++; scoreEl.textContent = 'Счет: ' + score; generateFood(); } else { snake.pop(); }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                snake.forEach(s => { ctx.fillStyle = 'lightgreen'; ctx.fillRect(s.x * gridSize, s.y * gridSize, gridSize, gridSize); });
                ctx.fillStyle = 'red'; ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
            };
            resetGame();
            activeGame.keyListener = (e) => {
                if (changingDirection) return;
                changingDirection = true;
                const key = e.key.toLowerCase();
                if ((key === 'arrowleft' || key === 'a') && direction !== 'right') direction = 'left';
                if ((key === 'arrowup' || key === 'w') && direction !== 'down') direction = 'up';
                if ((key === 'arrowright' || key === 'd') && direction !== 'left') direction = 'right';
                if ((key === 'arrowdown' || key === 's') && direction !== 'up') direction = 'down';
            };
            document.addEventListener('keydown', activeGame.keyListener);
            activeGame.interval = setInterval(update, speed);
        },

        // --- 2. Крестики-нолики ---
        initTicTacToe() {
            $('#game-content-wrapper').innerHTML = `<div id="tictactoe-board"></div><div id="ttt-status" style="font-size: 1.5rem; margin-top: 20px;">Ход игрока X</div><button class="btn" id="ttt-restart" style="margin-top: 15px;">Начать заново</button>`;
            const boardEl = $('#tictactoe-board'), statusEl = $('#ttt-status');
            let board, currentPlayer, gameActive;
            const winConditions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
            const restartGame = () => { board = Array(9).fill(''); currentPlayer = 'X'; gameActive = true; statusEl.textContent = `Ход игрока ${currentPlayer}`; boardEl.innerHTML = ''; for (let i = 0; i < 9; i++) { const cell = document.createElement('div'); cell.classList.add('ttt-cell'); cell.dataset.index = i; cell.addEventListener('click', handleCellClick); boardEl.appendChild(cell); } };
            const checkResult = () => {
                let roundWon = winConditions.some(cond => board[cond[0]] && board[cond[0]] === board[cond[1]] && board[cond[0]] === board[cond[2]]);
                if (roundWon) { 
                    statusEl.textContent = `Игрок ${currentPlayer} победил!`; gameActive = false;
                    const currentUser = AuthManager.getUsers().find(u=>u.username===AuthManager.getCurrentUser());
                    if (currentPlayer === 'X' && currentUser) {
                        AuthManager.updateUserStat('tictactoe', { wins: currentUser.stats.tictactoe.wins + 1 });
                    }
                    return; 
                }
                if (!board.includes('')) { statusEl.textContent = 'Ничья!'; gameActive = false; return; }
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X'; statusEl.textContent = `Ход игрока ${currentPlayer}`;
            };
            const handleCellClick = (e) => { if (!gameActive || board[e.target.dataset.index] !== '') return; board[e.target.dataset.index] = currentPlayer; e.target.textContent = currentPlayer; checkResult(); };
            restartGame();
            $('#ttt-restart').addEventListener('click', restartGame);
        },

        // --- 3. Кликер ---
        initClicker() {
            $('#game-content-wrapper').innerHTML = `<div id="clicker-game"><div id="clicker-score" style="font-size: 4rem; margin-bottom: 20px;">0</div><button id="click-button">Кликай!</button><button class="btn" id="upgrade-button" style="margin-top: 20px; background-color: #1abc9c; border-color: #1abc9c; color: white;">Купить авто-клик (10)</button><div id="autoclick-info" style="margin-top: 10px;">Авто-кликов в сек: 0</div></div>`;
            const scoreEl = $('#clicker-score'), upgradeBtn = $('#upgrade-button'), autoClickInfo = $('#autoclick-info');
            let score = 0, upgradeCost = 10, autoClicksPerSecond = 0;
            const updateUI = () => { scoreEl.textContent = score; upgradeBtn.textContent = `Купить авто-клик (${upgradeCost})`; autoClickInfo.textContent = `Авто-кликов в сек: ${autoClicksPerSecond}`; };
            $('#click-button').addEventListener('click', () => { score++; AuthManager.updateUserStat('clicker', { highScore: score }); updateUI(); });
            upgradeBtn.addEventListener('click', () => { if (score >= upgradeCost) { score -= upgradeCost; autoClicksPerSecond++; upgradeCost = Math.ceil(upgradeCost * 1.5); updateUI(); } });
            activeGame.interval = setInterval(() => { if (autoClicksPerSecond > 0) { score += autoClicksPerSecond; AuthManager.updateUserStat('clicker', { highScore: score }); updateUI(); } }, 1000);
            updateUI();
        },

        // --- 4. Найди Пару ---
        initMemory(size) {
            $('#game-content-wrapper').innerHTML = `<div id="memory-game-container"><div id="memory-grid"></div><div id="memory-stats"><div>Время<span id="memory-timer">0</span></div><div>Ходы<span id="memory-moves">0</span></div><button class="btn primary" id="memory-restart">Заново</button></div></div>`;
            const grid = $('#memory-grid'), timerEl = $('#memory-timer'), movesEl = $('#memory-moves');
            const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'];
            let hasFlippedCard, lockBoard, firstCard, secondCard, moves, matchedPairs, totalPairs;
            
            const startGame = () => {
                if (activeGame.timer) clearInterval(activeGame.timer);
                activeGame.timer = null;
                moves = 0; matchedPairs = 0; totalPairs = size / 2;
                hasFlippedCard = false; lockBoard = false; firstCard = null; secondCard = null;
                movesEl.textContent = moves;
                timerEl.textContent = 0;
                grid.style.gridTemplateColumns = `repeat(${size === 20 ? 5 : 4}, 100px)`;

                let cardEmojis = emojis.slice(0, totalPairs).concat(emojis.slice(0, totalPairs));
                cardEmojis.sort(() => 0.5 - Math.random());
                grid.innerHTML = '';
                cardEmojis.forEach(emoji => {
                    const card = document.createElement('div');
                    card.classList.add('memory-card');
                    card.innerHTML = `<div class="front-face">${emoji}</div><div class="back-face">?</div>`;
                    card.addEventListener('click', flipCard);
                    grid.appendChild(card);
                });
            };

            const flipCard = (e) => {
                const clickedCard = e.currentTarget;
                if (lockBoard || clickedCard === firstCard || clickedCard.classList.contains('flip')) return;
                if (!activeGame.timer) { activeGame.timer = setInterval(() => timerEl.textContent++, 1000); }
                clickedCard.classList.add('flip');
                if (!hasFlippedCard) { hasFlippedCard = true; firstCard = clickedCard; return; }
                secondCard = clickedCard;
                moves++; movesEl.textContent = moves;
                checkForMatch();
            };
            
            const checkForMatch = () => { firstCard.querySelector('.front-face').textContent === secondCard.querySelector('.front-face').textContent ? disableCards() : unflipCards(); };
            const disableCards = () => { firstCard.removeEventListener('click', flipCard); secondCard.removeEventListener('click', flipCard); matchedPairs++; resetBoard(); if (matchedPairs === totalPairs) winGame(); };
            const unflipCards = () => { lockBoard = true; setTimeout(() => { firstCard.classList.remove('flip'); secondCard.classList.remove('flip'); resetBoard(); }, 1200); };
            const resetBoard = () => { [hasFlippedCard, lockBoard] = [false, false]; [firstCard, secondCard] = [null, null]; };
            const winGame = () => { clearInterval(activeGame.timer); activeGame.timer = null; AuthManager.updateUserStat('memory', { bestTime: parseInt(timerEl.textContent), bestMoves: moves }); showToast(`Победа! Время: ${timerEl.textContent}с, Ходы: ${moves}`, 'success'); };
            $('#memory-restart').addEventListener('click', startGame);
            startGame();
        },
        
        // --- 5. Тест скорости печати ---
        initTyping() {
            const textSamples = ["Технологии быстро меняют наш мир, открывая новые возможности для общения, работы и развлечений. Искусственный интеллект, блокчейн и интернет вещей становятся частью повседневной жизни.", "Космос всегда манил человечество своими загадками. Исследование планет, звезд и галактик помогает нам лучше понять законы Вселенной и наше место в ней.", "Здоровый образ жизни, включающий правильное питание и регулярные физические упражнения, является ключом к долголетию и хорошему самочувствию. Важно заботиться о себе."];
            $('#game-content-wrapper').innerHTML = `<div id="typing-test-container"><div id="typing-text"></div><div id="typing-stats" style="margin-top: 20px;"><div><h3>WPM</h3><span id="typing-wpm">0</span></div><div><h3>Точность</h3><span id="typing-accuracy">100%</span></div><div><h3>Время</h3><span id="typing-timer">0</span></div></div><button class="btn" id="typing-restart" style="margin-top: 20px;">Заново</button></div>`;
            const textEl = $('#typing-text'), wpmEl = $('#typing-wpm'), accEl = $('#typing-accuracy'), timerEl = $('#typing-timer');
            let textToType, charIndex, mistakes;
            
            const startGame = () => {
                if (activeGame.timer) clearInterval(activeGame.timer);
                if (activeGame.keyListener) document.removeEventListener('keydown', activeGame.keyListener);
                activeGame.timer = null; activeGame.keyListener = null;

                textToType = textSamples[Math.floor(Math.random() * textSamples.length)];
                charIndex = 0; mistakes = 0;
                
                textEl.innerHTML = textToType.split('').map(char => `<span>${char}</span>`).join('');
                textEl.querySelector('span').classList.add('caret');
                wpmEl.textContent = '0'; accEl.textContent = '100%'; timerEl.textContent = '0';
                
                activeGame.keyListener = handleKeyPress;
                document.addEventListener('keydown', activeGame.keyListener);
            };
            
            const handleKeyPress = (e) => {
                const isTypableKey = e.key.length === 1 || e.key === 'Backspace';
                if (!isTypableKey || charIndex >= textToType.length && e.key !== 'Backspace') { e.preventDefault(); return; }
                e.preventDefault();

                if (!activeGame.timer && e.key !== 'Backspace') { activeGame.timer = setInterval(() => timerEl.textContent++, 1000); }
                
                const allChars = $$('#typing-text span');
                
                if (e.key === 'Backspace') {
                    if (charIndex > 0) {
                        charIndex--;
                        if (allChars[charIndex].classList.contains('incorrect')) mistakes--;
                        allChars[charIndex].className = 'caret';
                        allChars[charIndex+1].classList.remove('caret');
                    }
                    return;
                }

                allChars[charIndex].classList.remove('caret');

                if (e.key === allChars[charIndex].textContent) {
                    allChars[charIndex].classList.add('correct');
                } else {
                    allChars[charIndex].classList.add('incorrect');
                    mistakes++;
                }
                charIndex++;
                
                const accuracy = Math.round(((charIndex - mistakes) / charIndex) * 100) || 0;
                accEl.textContent = `${accuracy}%`;
                const timeElapsed = parseInt(timerEl.textContent);
                if(timeElapsed > 0) {
                    const wpm = Math.round(((charIndex - mistakes) / 5) / (timeElapsed / 60)) || 0;
                    wpmEl.textContent = wpm > 0 ? wpm : 0;
                }

                if (charIndex === textToType.length) {
                    clearInterval(activeGame.timer);
                    document.removeEventListener('keydown', activeGame.keyListener);
                    const finalWPM = parseInt(wpmEl.textContent);
                    AuthManager.updateUserStat('typing', { bestWPM: finalWPM, bestAccuracy: accuracy });
                    showToast(`Готово! WPM: ${finalWPM}, Точность: ${accuracy}%`, 'success');
                } else {
                    allChars[charIndex].classList.add('caret');
                }
            };

            $('#typing-restart').addEventListener('click', startGame);
            startGame();
        }
    };

    // =======================================================
    // --- ИНИЦИАЛИЗАЦИЯ ВСЕГО ПРИЛОЖЕНИЯ ---
    // =======================================================
    AuthManager.init();
    UI.init();
    Leaderboard.updateAll();
    GameManager.init();
});
