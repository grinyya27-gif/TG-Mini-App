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

    // === СИСТЕМА НАВИГАЦИИ ===
    setTab(id, el) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const targetScreen = document.getElementById('screen-' + id);
        if (targetScreen) targetScreen.classList.add('active');
        if (el) el.classList.add('active');
        
        tg.HapticFeedback.impactOccurred('light');
    },

    filterShop(category) {
        const types = ['rods', 'picks', 'weapons'];
        types.forEach(type => {
            const content = document.getElementById('shop-content-' + type);
            const tab = document.getElementById('tab-' + type);
            if (content) content.style.display = 'none';
            if (tab) tab.classList.remove('active');
        });

        const activeContent = document.getElementById('shop-content-' + category);
        const activeTab = document.getElementById('tab-' + category);
        if (activeContent) activeContent.style.display = 'block';
        if (activeTab) activeTab.classList.add('active');
        
        tg.HapticFeedback.impactOccurred('light');
    },

    // === ЛОГИКА ЗАГРУЗКИ ===
    startLoading() {
        const progress = document.getElementById('load-progress');
        const screen = document.getElementById('loading-screen');
        let width = 0;
        
        const interval = setInterval(() => {
            width += Math.random() * 25;
            if (width > 100) {
                width = 100;
                clearInterval(interval);
                setTimeout(() => {
                    screen.style.opacity = '0';
                    setTimeout(() => screen.style.display = 'none', 500);
                }, 500);
            }
            if (progress) progress.style.width = width + '%';
        }, 200);
    },

    // === ЕЖЕДНЕВНЫЕ БОНУСЫ ===
    checkDaily() {
        const now = new Date();
        const lastDate = localStorage.getItem('lastBonusDate');
        let streak = parseInt(localStorage.getItem('bonusStreak') || "0");
        const todayStr = now.toDateString();

        if (lastDate === todayStr) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate === yesterday.toDateString()) {
            streak++;
        } else {
            streak = 1;
        }

        if (streak > 10) streak = 1;
        localStorage.setItem('lastBonusDate', todayStr);
        localStorage.setItem('bonusStreak', streak);
        this.giveDailyReward(streak);
    },

    giveDailyReward(day) {
        let reward = 5 + (day - 1) * 3;
        if (day === 10) reward = 50;
        
        this.emeralds += reward;
        document.getElementById('daily-day-text').innerText = "День " + day;
        document.getElementById('daily-reward-text').innerText = (day === 10) ? "СУПЕР-ПРИЗ: 50 Изумрудов" : "+" + reward + " Изумрудов";
        document.getElementById('daily-reward-icon').innerText = (day === 10) ? "🎡" : "💎";
        document.getElementById('daily-modal').style.display = 'flex';
        
        tg.HapticFeedback.notificationOccurred('success');
        this.updateUI();
    },

    closeDaily() {
        document.getElementById('daily-modal').style.display = 'none';
        tg.HapticFeedback.impactOccurred('light');
    },

    // === ИГРОВАЯ ЛОГИКА (РАБОТА) ===
    doWork(type) {
        let earnedGold = 0;
        let earnedXp = 0;

        if (type === 'port') {
            let bonus = 0;
            if (this.inventory.includes('rod3')) bonus = 40;
            else if (this.inventory.includes('rod2')) bonus = 15;
            else if (this.inventory.includes('rod1')) bonus = 5;
            earnedGold = 2 + bonus;
            earnedXp = 5;
        } 
        else if (type === 'mine') {
            let bonus = 0;
            let chance = 0.01;
            if (this.inventory.includes('pick3')) { bonus = 25; chance = 0.08; }
            else if (this.inventory.includes('pick2')) { bonus = 12; chance = 0.04; }
            else if (this.inventory.includes('pick1')) { bonus = 4; chance = 0.02; }
            earnedGold = 1 + bonus;
            earnedXp = 8;
            if(Math.random() < chance) { 
                this.emeralds++; 
                tg.HapticFeedback.notificationOccurred('success'); 
            }
        }
        else if (type === 'farm') {
            if (this.lvl < 15) return tg.showAlert("Нужен 15 уровень!");
            earnedGold = 15;
            earnedXp = 12;
        }
        else if (type === 'hunt') {
            if (this.lvl < 25) return tg.showAlert("Нужен 25 уровень!");
            if (!this.inventory.includes('bow1') && !this.inventory.includes('bow2')) {
                return tg.showAlert("Купите лук или арбалет в лавке!");
            }
            earnedGold = this.inventory.includes('bow2') ? 100 : 50;
            earnedXp = 20;
        }

        // Применяем изменения
        this.gold += earnedGold;
        this.addXp(earnedXp);
        
        // Вибрация и обновление
        tg.HapticFeedback.impactOccurred('medium');
        this.updateUI();
    },

    addXp(val) {
        let swordBonus = this.inventory.includes('sword1') ? 2 : 0;
        this.xp += (val + swordBonus);

        if(this.xp >= this.nextXp) {
            this.xp -= this.nextXp; 
            this.lvl++;
            this.nextXp = Math.floor(this.nextXp * 1.6 + 50);
            tg.showAlert("Уровень повышен до " + this.lvl + "!");
            tg.HapticFeedback.notificationOccurred('warning');
        }
    },

    buy(id, price) {
        if(this.gold >= price && !this.inventory.includes(id)) {
            this.gold -= price; 
            this.inventory.push(id);
            tg.HapticFeedback.notificationOccurred('success');
            this.updateUI();
        } else if (this.inventory.includes(id)) {
            tg.showAlert("Уже куплено!");
        } else { 
            tg.showAlert("Недостаточно золота!"); 
        }
    },

    exchange() {
        if(this.emeralds >= 1) {
            this.emeralds--; 
            this.gold += 500;
            this.updateUI();
            tg.HapticFeedback.impactOccurred('heavy');
        } else { 
            tg.showAlert("Нужны изумруды!"); 
        }
    },

    // === ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ===
    updateUI() {
        // Ресурсы
        document.getElementById('gold').innerText = Math.floor(this.gold);
        document.getElementById('emeralds').innerText = this.emeralds;
        document.getElementById('lvl').innerText = this.lvl;
        document.getElementById('xp-text').innerText = this.xp + "/" + this.nextXp;
        document.getElementById('exp-fill').style.width = (this.xp / this.nextXp * 100) + "%";
        
        // Динамические показатели на кнопках
        const pG = 2 + (this.inventory.includes('rod3') ? 40 : (this.inventory.includes('rod2') ? 15 : (this.inventory.includes('rod1') ? 5 : 0)));
        const mG = 1 + (this.inventory.includes('pick3') ? 25 : (this.inventory.includes('pick2') ? 12 : (this.inventory.includes('pick1') ? 4 : 0)));
        const mC = (this.inventory.includes('pick3') ? 8 : (this.inventory.includes('pick2') ? 4 : (this.inventory.includes('pick1') ? 2 : 1)));

        if(document.getElementById('p-gold')) document.getElementById('p-gold').innerText = pG;
        if(document.getElementById('m-gold')) document.getElementById('m-gold').innerText = mG;
        if(document.getElementById('m-chance')) document.getElementById('m-chance').innerText = mC;
        
        // Разблокировка работ
        if (this.lvl >= 15 && document.getElementById('work-farm')) {
            document.getElementById('work-farm').style.opacity = "1";
            document.getElementById('farm-lock').innerText = "";
        }
        if (this.lvl >= 25 && document.getElementById('work-hunt')) {
            document.getElementById('work-hunt').style.opacity = "1";
            document.getElementById('hunt-lock').innerText = "";
            let bowText = this.inventory.includes('bow2') ? "Доход: 100 🪙" : (this.inventory.includes('bow1') ? "Доход: 50 🪙" : "Нужен лук!");
            document.getElementById('hunt-desc').innerText = bowText;
        }

        // Кнопки в магазине
        this.inventory.forEach(itemId => {
            const btn = document.getElementById('btn-' + itemId);
            if (btn) {
                btn.innerText = "КУПЛЕНО";
                btn.classList.add('bought');
            }
        });

        // Инвентарь в профиле
        document.getElementById('inv').innerText = this.inventory.length > 0 ? "Предметов: " + this.inventory.length : "пусто";
    },

    openLocation(id) {
        tg.showAlert("Локация временно недоступна.");
    }
};

// === ЗАПУСК ===
if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
}

game.updateUI();
game.startLoading();

setTimeout(() => {
    game.checkDaily();
}, 3000);
