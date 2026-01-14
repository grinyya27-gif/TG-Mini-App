const tg = window.Telegram.WebApp;
tg.expand();

const game = {
    // === ДАННЫЕ ИГРОКА ===
    gold: 50,
    emeralds: 0,
    lvl: 1,
    xp: 0,
    nextXp: 100,
    inventory: [],
    lastWheelSpin: 0, // Время последнего вращения колеса

    // === ИНИЦИАЛИЗАЦИЯ ===
    init() {
        this.loadProgress(); // Загружаем данные из памяти
        this.updateUI();
        this.startLoading();
        
        if(tg.initDataUnsafe?.user) {
            document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
        }

        setTimeout(() => this.checkDaily(), 3000);
    },

    // === СИСТЕМА НАВИГАЦИИ ===
    setTab(id, el) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const target = document.getElementById('screen-' + id);
        if (target) target.classList.add('active');
        if (el) el.classList.add('active');
        
        tg.HapticFeedback.impactOccurred('light');
    },

    filterShop(category) {
        ['rods', 'picks', 'weapons'].forEach(type => {
            document.getElementById('shop-content-' + type).style.display = 'none';
            document.getElementById('tab-' + type).classList.remove('active');
        });
        document.getElementById('shop-content-' + category).style.display = 'block';
        document.getElementById('tab-' + category).classList.add('active');
    },

    // === ВИЗУАЛЬНЫЕ ЭФФЕКТЫ (ВЫЛЕТАЮЩИЕ ЦИФРЫ) ===
    spawnText(e, text) {
        const el = document.createElement('div');
        el.className = 'click-anim';
        el.innerText = text;
        el.style.left = e.pageX + 'px';
        el.style.top = e.pageY + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 800);
    },

    // === ЛОГИКА РАБОТЫ ===
    doWork(type, event) {
        let earnedGold = 0;
        let earnedXp = 0;

        if (type === 'port') {
            let bonus = this.inventory.includes('rod3') ? 40 : (this.inventory.includes('rod2') ? 15 : (this.inventory.includes('rod1') ? 5 : 0));
            earnedGold = 2 + bonus;
            earnedXp = 5;
        } else if (type === 'mine') {
            let bonus = this.inventory.includes('pick3') ? 25 : (this.inventory.includes('pick2') ? 12 : (this.inventory.includes('pick1') ? 4 : 0));
            earnedGold = 1 + bonus;
            earnedXp = 8;
            if (Math.random() < (this.inventory.includes('pick3') ? 0.08 : 0.02)) this.emeralds++;
        } else if (type === 'farm') {
            if (this.lvl < 15) return tg.showAlert("Нужен 15 уровень!");
            earnedGold = 15;
            earnedXp = 12;
        } else if (type === 'hunt') {
            if (this.lvl < 25) return tg.showAlert("Нужен 25 уровень!");
            if (!this.inventory.includes('bow1') && !this.inventory.includes('bow2')) return tg.showAlert("Нужен лук!");
            earnedGold = this.inventory.includes('bow2') ? 100 : 50;
            earnedXp = 20;
        }

        this.gold += earnedGold;
        this.addXp(earnedXp);
        this.spawnText(event, "+" + earnedGold + "🪙");
        this.updateUI();
        this.saveProgress();
        tg.HapticFeedback.impactOccurred('medium');
    },

    // === КОЛЕСО ФОРТУНЫ ===
    checkWheelAccess() {
        const streak = parseInt(localStorage.getItem('bonusStreak') || "0");
        if (streak >= 10) {
            document.getElementById('wheel-container').style.display = 'flex';
        }
    },

    spinWheel() {
        const btn = document.getElementById('spin-btn');
        const wheel = document.getElementById('main-wheel');
        btn.disabled = true;

        const randomDeg = Math.floor(Math.random() * 360) + 3600; // 10 полных оборотов + рандом
        wheel.style.transform = `rotate(${randomDeg}deg)`;

        setTimeout(() => {
            const prizes = ["5000 🪙", "50 💎", "10000 🪙", "100 💎", "Меч Лорда", "2000 🪙", "10 💎", "500 🪙"];
            const prizeIndex = Math.floor(((randomDeg % 360)) / 45);
            const won = prizes[prizeIndex];
            
            tg.showAlert("Великая удача! Ваш приз: " + won);
            
            // Начисление (пример для золота)
            if (won.includes("🪙")) this.gold += parseInt(won);
            if (won.includes("💎")) this.emeralds += parseInt(won);
            
            localStorage.setItem('bonusStreak', "0"); // Сброс серии после крутки
            setTimeout(() => {
                document.getElementById('wheel-container').style.display = 'none';
                this.updateUI();
            }, 2000);
        }, 4000);
    },

    // === СОХРАНЕНИЕ И ЗАГРУЗКА ===
    saveProgress() {
        const data = {
            gold: this.gold,
            emeralds: this.emeralds,
            lvl: this.lvl,
            xp: this.xp,
            nextXp: this.nextXp,
            inventory: this.inventory
        };
        localStorage.setItem('warGameSave', JSON.stringify(data));
    },

    loadProgress() {
        const saved = localStorage.getItem('warGameSave');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(this, data);
        }
    },

    // === ОСТАЛЬНАЯ ЛОГИКА (БАЗОВАЯ) ===
    addXp(val) {
        let swordBonus = this.inventory.includes('sword2') ? 10 : (this.inventory.includes('sword1') ? 2 : 0);
        this.xp += (val + swordBonus);
        if (this.xp >= this.nextXp) {
            this.lvl++;
            this.xp -= this.nextXp;
            this.nextXp = Math.floor(this.nextXp * 1.5);
            tg.showAlert("НОВЫЙ РАНГ: " + this.lvl);
        }
    },

    buy(id, price) {
        if (this.gold >= price && !this.inventory.includes(id)) {
            this.gold -= price;
            this.inventory.push(id);
            this.updateUI();
            this.saveProgress();
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.showAlert(this.inventory.includes(id) ? "Уже есть!" : "Мало золота!");
        }
    },

    updateUI() {
        document.getElementById('gold').innerText = Math.floor(this.gold);
        document.getElementById('emeralds').innerText = this.emeralds;
        document.getElementById('lvl').innerText = this.lvl;
        document.getElementById('xp-text').innerText = `${this.xp}/${this.nextXp}`;
        document.getElementById('exp-fill').style.width = (this.xp / this.nextXp * 100) + "%";
        
        // Статус игрока
        const statuses = ["Рекрут", "Боец", "Ветеран", "Рыцарь", "Барон", "Виконт", "Граф", "Маркиз", "Герцог", "Принц", "Король"];
        document.getElementById('status-text').innerText = statuses[Math.min(Math.floor(this.lvl/5), statuses.length-1)];

        // Инвентарь
        document.getElementById('inv').innerText = this.inventory.join(', ') || "Пусто";

        // Разблокировка работ
        if (this.lvl >= 15) document.getElementById('work-farm').classList.remove('locked');
        if (this.lvl >= 25) document.getElementById('work-hunt').classList.remove('locked');
        
        // Пометка купленного
        this.inventory.forEach(item => {
            const btn = document.getElementById('btn-' + item);
            if(btn) { btn.innerText = "ВЫДАНО"; btn.classList.add('bought'); }
        });

        this.checkWheelAccess();
    },

    // === СТАНДАРТНЫЕ МЕТОДЫ ===
    startLoading() {
        let w = 0;
        const bar = document.getElementById('load-progress');
        const ival = setInterval(() => {
            w += Math.random() * 20;
            if(w >= 100) {
                w = 100; clearInterval(ival);
                setTimeout(() => document.getElementById('loading-screen').style.display='none', 500);
            }
            bar.style.width = w + "%";
        }, 150);
    },

    checkDaily() {
        const last = localStorage.getItem('lastBonusDate');
        const today = new Date().toDateString();
        if (last !== today) {
            let streak = parseInt(localStorage.getItem('bonusStreak') || "0") + 1;
            this.giveDailyReward(streak);
            localStorage.setItem('lastBonusDate', today);
            localStorage.setItem('bonusStreak', streak);
        }
    },

    giveDailyReward(day) {
        const reward = day === 10 ? 50 : 5 + day;
        this.emeralds += reward;
        document.getElementById('daily-modal').style.display = 'flex';
        this.updateUI();
    },

    closeDaily() { document.getElementById('daily-modal').style.display = 'none'; },
    exchange() {
        if(this.emeralds >= 1) { this.emeralds--; this.gold += 500; this.updateUI(); this.saveProgress(); }
    },
    openLocation(name) { tg.showAlert("Локация " + name + " под охраной. Нужен пропуск."); }
};

// Запуск
game.init();
