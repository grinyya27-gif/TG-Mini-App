const tg = window.Telegram.WebApp;
tg.expand();

const game = {
    // Данные игрока
    gold: 50,
    emeralds: 0,
    lvl: 1,
    xp: 0,
    nextXp: 100,
    inventory: [],

    // Переключение основных вкладок меню
    setTab(id, el) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const targetScreen = document.getElementById('screen-' + id);
        if (targetScreen) targetScreen.classList.add('active');
        if (el) el.classList.add('active');
        
        tg.HapticFeedback.impactOccurred('light');
    },

    // Переключение категорий ВНУТРИ лавки (удочки/кирки)
    filterShop(category) {
        const rodsContent = document.getElementById('shop-content-rods');
        const picksContent = document.getElementById('shop-content-picks');
        const rodsTab = document.getElementById('tab-rods');
        const picksTab = document.getElementById('tab-picks');

        if (rodsContent) rodsContent.style.display = 'none';
        if (picksContent) picksContent.style.display = 'none';
        if (rodsTab) rodsTab.classList.remove('active');
        if (picksTab) picksTab.classList.remove('active');
        
        if (category === 'rods' && rodsContent && rodsTab) {
            rodsContent.style.display = 'block';
            rodsTab.classList.add('active');
        } else if (category === 'picks' && picksContent && picksTab) {
            picksContent.style.display = 'block';
            picksTab.classList.add('active');
        }
        tg.HapticFeedback.impactOccurred('light');
    },

    // Логика работы (Порт и Рудник)
    doWork(type) {
        if (type === 'port') {
            let bonus = 0;
            // Проверка лучшей удочки
            if (this.inventory.includes('rod3')) bonus = 40;
            else if (this.inventory.includes('rod2')) bonus = 15;
            else if (this.inventory.includes('rod1')) bonus = 5;
            
            this.gold += (2 + bonus); 
            this.addXp(5);
        } else {
            let bonus = 0;
            let chance = 0.01;
            
            // Проверка лучшей кирки
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

    // Система опыта и уровней
    addXp(val) {
        this.xp += val;
        if(this.xp >= this.nextXp) {
            this.xp -= this.nextXp; 
            this.lvl++;
            this.nextXp = Math.floor(this.nextXp * 1.6 + 50);
            tg.showAlert("Уровень повышен до " + this.lvl + "!");
            tg.HapticFeedback.notificationOccurred('warning');
        }
    },

    // Покупка предметов
    buy(id, price) {
        if(this.gold >= price && !this.inventory.includes(id)) {
            this.gold -= price; 
            this.inventory.push(id);
            
            tg.HapticFeedback.notificationOccurred('success');
            this.updateUI();
        } else if (this.inventory.includes(id)) {
            tg.showAlert("Этот предмет уже куплен!");
        } else { 
            tg.showAlert("Недостаточно золота!"); 
        }
    },

    // Обмен изумрудов в банке
    exchange() {
        if(this.emeralds >= 1) {
            this.emeralds--; 
            this.gold += 500;
            this.updateUI();
            tg.showAlert("Обмен завершен! +500 золота.");
            tg.HapticFeedback.impactOccurred('heavy');
        } else { 
            tg.showAlert("У вас нет изумрудов!"); 
        }
    },

    // Заглушка для локаций на карте
    openLocation(id) {
        const titles = {
            tavern: "Таверна", blacksmith: "Оружейник", armorer: "Бронник"
        };
        tg.showAlert("Вы вошли в локацию: " + (titles[id] || id));
    },

    // Обновление интерфейса
    updateUI() {
        // Ресурсы
        document.getElementById('gold').innerText = Math.floor(this.gold);
        document.getElementById('emeralds').innerText = this.emeralds;
        
        // Прогресс уровня
        document.getElementById('lvl').innerText = this.lvl;
        document.getElementById('xp-text').innerText = this.xp + "/" + this.nextXp;
        document.getElementById('exp-fill').style.width = (this.xp / this.nextXp * 100) + "%";
        
        // Динамические показатели дохода на кнопках работы
        const pGold = document.getElementById('p-gold');
        const mGold = document.getElementById('m-gold');
        const mChance = document.getElementById('m-chance');

        let currentPB = 2 + (this.inventory.includes('rod3') ? 40 : (this.inventory.includes('rod2') ? 15 : (this.inventory.includes('rod1') ? 5 : 0)));
        let currentMB = 1 + (this.inventory.includes('pick3') ? 25 : (this.inventory.includes('pick2') ? 12 : (this.inventory.includes('pick1') ? 4 : 0)));
        let currentMC = (this.inventory.includes('pick3') ? 8 : (this.inventory.includes('pick2') ? 4 : (this.inventory.includes('pick1') ? 2 : 1)));

        if(pGold) pGold.innerText = currentPB;
        if(mGold) mGold.innerText = currentMB;
        if(mChance) mChance.innerText = currentMC;
        
        // Обновление кнопок в лавке (КУПЛЕНО)
        this.inventory.forEach(itemId => {
            const btn = document.getElementById('btn-' + itemId);
            if (btn) {
                btn.innerText = "КУПЛЕНО";
                btn.classList.add('bought');
            }
        });

        // Инвентарь в профиле
        const invDisplay = document.getElementById('inv');
        if (invDisplay) {
            invDisplay.innerText = this.inventory.length > 0 ? this.inventory.length + " предметов" : "пусто";
        }
    }
};

// Инициализация имени
if(tg.initDataUnsafe?.user) {
    const userName = document.getElementById('user-name');
    if (userName) userName.innerText = tg.initDataUnsafe.user.first_name;
startLoading() {
        const progress = document.getElementById('load-progress');
        const screen = document.getElementById('loading-screen');
        let width = 0;
        
        const interval = setInterval(() => {
            width += Math.random() * 30;
            if (width > 100) {
                width = 100;
                clearInterval(interval);
                setTimeout(() => {
                    screen.style.opacity = '0';
                    setTimeout(() => screen.style.display = 'none', 500);
                }, 500);
            }
            if (progress) progress.style.width = width + '%';
        }, 300);
    }}

game.updateUI();

