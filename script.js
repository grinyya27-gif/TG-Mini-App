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

    // Фильтр в лавке (удочки/кирки)
    filterShop(category) {
        const rodsContent = document.getElementById('shop-content-rods');
        const picksContent = document.getElementById('shop-content-picks');
        const rodsTab = document.getElementById('tab-rods');
        const picksTab = document.getElementById('tab-picks');

        if (rodsContent) rodsContent.style.display = 'none';
        if (picksContent) picksContent.style.display = 'none';
        if (rodsTab) rodsTab.classList.remove('active');
        if (picksTab) picksTab.classList.remove('active');
        
        if (category === 'rods') {
            rodsContent.style.display = 'block';
            rodsTab.classList.add('active');
        } else {
            picksContent.style.display = 'block';
            picksTab.classList.add('active');
        }
        tg.HapticFeedback.impactOccurred('light');
    },
    filterShop(category) {
    document.getElementById('shop-content-rods').style.display = 'none';
    document.getElementById('shop-content-picks').style.display = 'none';
    document.getElementById('shop-content-weapons').style.display = 'none'; // Скрыть оружие
    
    document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById('shop-content-' + category).style.display = 'block';
    document.getElementById('tab-' + category).classList.add('active');
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

        if (lastDate === todayStr) return; // Уже получал сегодня

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
        let reward = 5 + (day - 1) * 3; // Базовая прогрессия
        if (day === 10) reward = 50; // Супер-приз на 10 день
        
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

    // === ИГРОВАЯ ЛОГИКА ===
    doWork(type) {
        if (type === 'port') {
            let bonus = 0;
            if (this.inventory.includes('rod3')) bonus = 40;
            else if (this.inventory.includes('rod2')) bonus = 15;
            else if (this.inventory.includes('rod1')) bonus = 5;
            
            this.gold += (2 + bonus);
            this.addXp(5);
        } else {
            let bonus = 0;
            let chance = 0.01;
            if (this.inventory.includes('pick3')) { bonus = 25; chance = 0.08; }
            else if (this.inventory.includes('pick2')) { bonus = 12; chance = 0.04; }
            else if (this.inventory.includes('pick1')) { bonus = 4; chance = 0.02; }
            
            this.gold += (1 + bonus);
            if(Math.random() < chance) { 
                this.emeralds++; 
                tg.HapticFeedback.notificationOccurred('success'); 
            }
            this.addXp(8);
        }
        tg.HapticFeedback.impactOccurred('medium');
        this.updateUI();
    },
    doWork(type) {
    if (type === 'farm') {
        if (this.lvl < 15) return tg.showAlert("Нужен 15 уровень!");
        this.gold += 15; this.addXp(12);
    } 
    else if (type === 'hunt') {
        if (this.lvl < 25) return tg.showAlert("Нужен 25 уровень!");
        if (!this.inventory.includes('bow1') && !this.inventory.includes('bow2')) {
            return tg.showAlert("Купите лук в лавке!");
        }
        let bonus = this.inventory.includes('bow2') ? 100 : 50;
        this.gold += bonus; this.addXp(20);
    }
    // ... логика для порта и рудника остается ...
    else if (type === 'port') { /* старый код порта */ }
    else if (type === 'mine') { /* старый код рудника */ }
    
    tg.HapticFeedback.impactOccurred('medium');
    this.updateUI();
},

    addXp(val) {
        // Бонус опыта от оружия
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

    openLocation(id) {
        const titles = { tavern: "Таверна", camp: "Лагерь", stable: "Конюшня", armorer: "Бронник" };
        tg.showAlert("Вы пришли в: " + (titles[id] || id) + ". Контент в разработке!");
    },

    // === ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ===
    updateUI() {
        document.getElementById('gold').innerText = Math.floor(this.gold);
        document.getElementById('emeralds').innerText = this.emeralds;
        document.getElementById('lvl').innerText = this.lvl;
        document.getElementById('xp-text').innerText = this.xp + "/" + this.nextXp;
        document.getElementById('exp-fill').style.width = (this.xp / this.nextXp * 100) + "%";
        
        // Обновление цифр дохода на кнопках
        const pG = 2 + (this.inventory.includes('rod3') ? 40 : (this.inventory.includes('rod2') ? 15 : (this.inventory.includes('rod1') ? 5 : 0)));
        const mG = 1 + (this.inventory.includes('pick3') ? 25 : (this.inventory.includes('pick2') ? 12 : (this.inventory.includes('pick1') ? 4 : 0)));
        const mC = (this.inventory.includes('pick3') ? 8 : (this.inventory.includes('pick2') ? 4 : (this.inventory.includes('pick1') ? 2 : 1)));

        if(document.getElementById('p-gold')) document.getElementById('p-gold').innerText = pG;
        if(document.getElementById('m-gold')) document.getElementById('m-gold').innerText = mG;
        if(document.getElementById('m-chance')) document.getElementById('m-chance').innerText = mC;
        
        // Пометка купленных кнопок
        this.inventory.forEach(itemId => {
            const btn = document.getElementById('btn-' + itemId);
            if (btn) {
                btn.innerText = "КУПЛЕНО";
                btn.classList.add('bought');
            }
        });

        // Инвентарь
        document.getElementById('inv').innerText = this.inventory.length > 0 ? "Предметов: " + this.inventory.length : "пусто";
    }
};

// === ИНИЦИАЛИЗАЦИЯ ПРИ ЗАПУСКЕ ===
if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
}

// Запуск систем
game.updateUI();
game.startLoading();

// Проверка бонуса через 3 секунды после анимации
setTimeout(() => {
    game.checkDaily();
}, 3000);

