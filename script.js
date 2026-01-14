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

    // Переключение категорий ВНУТРИ лавки
    filterShop(category) {
        const rodsContent = document.getElementById('shop-content-rods');
        const picksContent = document.getElementById('shop-content-picks');
        const rodsTab = document.getElementById('tab-rods');
        const picksTab = document.getElementById('tab-picks');

        // Прячем всё
        if (rodsContent) rodsContent.style.display = 'none';
        if (picksContent) picksContent.style.display = 'none';
        
        // Убираем подсветку кнопок
        if (rodsTab) rodsTab.classList.remove('active');
        if (picksTab) picksTab.classList.remove('active');
        
        // Показываем нужную категорию
        if (category === 'rods' && rodsContent && rodsTab) {
            rodsContent.style.display = 'block';
            rodsTab.classList.add('active');
        } else if (category === 'picks' && picksContent && picksTab) {
            picksContent.style.display = 'block';
            picksTab.classList.add('active');
        }
        tg.HapticFeedback.impactOccurred('light');
    },

    // Логика работы
    doWork(type) {
        if (type === 'port') {
            let bonus = this.inventory.includes('rod1') ? 5 : 0;
            this.gold += (2 + bonus); 
            this.addXp(5);
        } else {
            let bonus = this.inventory.includes('pick1') ? 4 : 0;
            let chance = this.inventory.includes('pick1') ? 0.02 : 0.01;
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

    // Система опыта
    addXp(val) {
        this.xp += val;
        if(this.xp >= this.nextXp) {
            this.xp -= this.nextXp; 
            this.lvl++;
            // Умное увеличение сложности уровня
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
            
            // Визуально помечаем кнопку покупки
            const btn = document.getElementById('btn-' + id);
            if (btn) {
                btn.innerText = "КУПЛЕНО";
                btn.classList.add('bought');
            }
            
            tg.HapticFeedback.notificationOccurred('success');
            this.updateUI();
        } else if (this.inventory.includes(id)) {
            tg.showAlert("Этот предмет уже в инвентаре!");
        } else { 
            tg.showAlert("Недостаточно золота!"); 
        }
    },

    // Банковский обмен
    exchange() {
        if(this.emeralds >= 1) {
            this.emeralds--; 
            this.gold += 500;
            this.updateUI();
            tg.showAlert("Обмен завершен! +500 золота.");
            tg.HapticFeedback.impactOccurred('heavy');
        } else { 
            tg.showAlert("У вас нет изумрудов для обмена!"); 
        }
    },

    // Локации на карте
    openLocation(id) {
        const titles = {
            tavern: "Таверна", camp: "Лагерь", 
            stable: "Конюшня", blacksmith: "Оружейник", armorer: "Бронник"
        };
        tg.showAlert("Добро пожаловать в " + (titles[id] || id) + "! Здесь скоро будет контент.");
    },

    // Обновление всех данных на экране
    updateUI() {
        // Ресурсы
        document.getElementById('gold').innerText = Math.floor(this.gold);
        document.getElementById('emeralds').innerText = this.emeralds;
        
        // Опыт и Уровень
        document.getElementById('lvl').innerText = this.lvl;
        document.getElementById('xp-text').innerText = this.xp + "/" + this.nextXp;
        document.getElementById('exp-fill').style.width = (this.xp / this.nextXp * 100) + "%";
        
        // Информация на кнопках работы (динамическое обновление дохода)
        const pGold = document.getElementById('p-gold');
        const mGold = document.getElementById('m-gold');
        const mChance = document.getElementById('m-chance');

        if(pGold) pGold.innerText = this.inventory.includes('rod1') ? 7 : 2;
        if(mGold) mGold.innerText = this.inventory.includes('pick1') ? 5 : 1;
        if(mChance) mChance.innerText = this.inventory.includes('pick1') ? 2 : 1;
        
        // Инвентарь в профиле
        let itemsNames = [];
        if(this.inventory.includes('rod1')) itemsNames.push("Удочка");
        if(this.inventory.includes('pick1')) itemsNames.push("Кирка");
        
        const invDisplay = document.getElementById('inv');
        if (invDisplay) {
            invDisplay.innerText = itemsNames.length ? itemsNames.join(", ") : "пусто";
        }
    }
};

// Привязка имени пользователя Telegram
if(tg.initDataUnsafe?.user) {
    const userName = document.getElementById('user-name');
    if (userName) userName.innerText = tg.initDataUnsafe.user.first_name;
}

// Первый запуск интерфейса
game.updateUI();
