// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Основной объект игры
const game = {
    // Данные игрока (позже добавим сохранение в LocalStorage)
    stats: {
        gold: 1000,
        emeralds: 10,
        wood: 50,
        stone: 20,
        exp: 0,
        lvl: 1,
        hp: 100,
        maxHp: 100,
        attack: 10,
        inventory: []
    },

    // Конфигурация цен (Экономика)
    config: {
        exchangeRate: 500, // 1 изумруд = 500 золота
        upgradeCityCost: { wood: 1000, stone: 500 }
    }
};

// Объект управления интерфейсом
const ui = {
    // Переключение между основными экранами (Город, Карта, Инвентарь)
    showScreen(screenId) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        // Показываем нужный
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }

        // Подсвечиваем кнопку в меню
        // (Логика поиска кнопки по названию экрана)
    },

    // Управление модальными окнами
    openModal(modalId) {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.querySelectorAll('.modal-window').forEach(m => m.classList.add('hidden'));
        document.getElementById(modalId).classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    },

    // Обновление всех цифр на экране
    updateResources() {
        document.getElementById('gold-val').innerText = game.stats.gold;
        document.getElementById('emerald-val').innerText = game.stats.emeralds;
        document.getElementById('wood-val').innerText = game.stats.wood;
        document.getElementById('stone-val').innerText = game.stats.stone;
        
        // Обновляем полоску опыта
        const expPercent = (game.stats.exp % 100); 
        document.getElementById('exp-fill').style.width = expPercent + "%";
        document.getElementById('exp-text').innerText = `Lvl ${game.stats.lvl}`;
    },

    // Всплывающие уведомления
    notify(text) {
        const container = document.getElementById('notification-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = text;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
};

// Функции-заглушки для HTML-кнопок, чтобы не было ошибок
ui.showTab = function(type) {
    if (type === 'blacksmith') ui.openModal('modal-blacksmith');
    if (type === 'market') ui.openModal('modal-market');
    if (type === 'town-hall') ui.openModal('modal-town-hall');
};
// Расширяем объект game логикой действий
game.buyItem = function(itemId, price) {
    if (this.stats.gold >= price) {
        this.stats.gold -= price;
        this.stats.inventory.push(itemId);
        ui.updateResources();
        ui.notify("Предмет куплен!");
        // Здесь будет функция добавления в инвентарь
    } else {
        ui.notify("Недостаточно золота!");
        tg.HapticFeedback.notificationOccurred('error'); // Вибрация в Telegram
    }
};

game.exchange = function(type) {
    if (type === 'emerald_to_gold') {
        if (this.stats.emeralds >= 1) {
            this.stats.emeralds -= 1;
            this.stats.gold += this.config.exchangeRate;
            ui.updateResources();
            ui.notify("Обмен совершен: +500 🪙");
            tg.HapticFeedback.impactOccurred('medium');
        } else {
            ui.notify("Нужны изумруды!");
        }
    }
};

// Запуск при загрузке страницы
window.onload = () => {
    ui.updateResources();
    // Устанавливаем имя из Telegram, если доступно
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        document.getElementById('player-name').innerText = tg.initDataUnsafe.user.first_name;
    }
};
// Расширяем логику игры квестами
game.quests = [
    { id: 1, title: "Охота на волков", rewardGold: 200, rewardEmeralds: 1, reqLevel: 1, duration: 5000 },
    { id: 2, title: "Поставка руды", rewardGold: 500, rewardEmeralds: 3, reqLevel: 5, duration: 15000 }
];

game.startQuest = function(questId) {
    const quest = this.quests.find(q => q.id === questId);
    
    if (this.stats.lvl < quest.reqLevel) {
        ui.notify("Слишком низкий уровень!");
        return;
    }

    ui.notify(`Квест "${quest.title}" начат...`);
    tg.HapticFeedback.impactOccurred('light');

    // Имитация выполнения квеста (таймер)
    setTimeout(() => {
        this.stats.gold += quest.rewardGold;
        this.stats.emeralds += quest.rewardEmeralds;
        this.stats.exp += 20;
        
        this.checkLevelUp();
        ui.updateResources();
        ui.notify(`Квест завершен! +${quest.rewardGold} 🪙`);
        tg.HapticFeedback.notificationOccurred('success');
    }, quest.duration);
};

// Проверка повышения уровня
game.checkLevelUp = function() {
    if (this.stats.exp >= 100) {
        this.stats.lvl += 1;
        this.stats.exp -= 100;
        this.stats.maxHp += 20;
        this.stats.hp = this.stats.maxHp;
        ui.notify(`УРОВЕНЬ ПОВЫШЕН: ${this.stats.lvl}!`);
    }
};

// ЛОГИКА ИНВЕНТАРЯ
ui.renderInventory = function() {
    const grid = document.querySelector('.inventory-grid');
    grid.innerHTML = ''; // Очищаем сетку

    // Создаем 12 слотов (как в CSS)
    for (let i = 0; i < 12; i++) {
        const slot = document.createElement('div');
        slot.className = 'inv-slot';
        
        // Если в массиве инвентаря есть предмет для этого слота
        if (game.stats.inventory[i]) {
            const item = game.stats.inventory[i];
            slot.innerText = this.getItemEmoji(item);
            slot.onclick = () => ui.showItemInfo(item);
        } else {
            slot.classList.add('empty');
        }
        grid.appendChild(slot);
    }
};

ui.getItemEmoji = function(itemId) {
    const library = {
        'rusty_sword': '🗡️',
        'steel_claymore': '⚔️',
        'dragon_shield': '🛡️'
    };
    return library[itemId] || '❓';
};
const combat = {
    currentEnemy: {
        name: "Лесной Разбойник",
        hp: 100,
        maxHp: 100,
        attack: 8
    },

    attack() {
        // Урон игрока (базовая атака + рандом)
        const damage = game.stats.attack + Math.floor(Math.random() * 5);
        this.currentEnemy.hp -= damage;
        
        ui.notify(`Вы нанесли ${damage} урона!`);
        this.updateBars();

        if (this.currentEnemy.hp <= 0) {
            this.win();
        } else {
            // Ответный удар врага через 1 секунду
            setTimeout(() => this.enemyTurn(), 1000);
        }
    },

    enemyTurn() {
        const damage = this.currentEnemy.attack + Math.floor(Math.random() * 3);
        game.stats.hp -= damage;
        
        ui.notify(`${this.currentEnemy.name} бьет на ${damage}!`);
        this.updateBars();

        if (game.stats.hp <= 0) {
            this.lose();
        }
    },

    updateBars() {
        // Обновляем HP врага на экране
        const enemyBar = document.getElementById('enemy-hp-fill');
        const percent = (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100;
        enemyBar.style.width = Math.max(0, percent) + "%";
        document.getElementById('enemy-hp-text').innerText = `${this.currentEnemy.hp}/${this.currentEnemy.maxHp} HP`;
    },

    win() {
        ui.notify("Победа! Получено 50 золота.");
        game.stats.gold += 50;
        game.stats.exp += 15;
        game.checkLevelUp();
        ui.updateResources();
        setTimeout(() => ui.showScreen('main-city'), 2000);
    },

    lose() {
        ui.notify("Вы проиграли... Нужно подлечиться.");
        game.stats.hp = 10; // Оставляем немного HP
        ui.updateResources();
        setTimeout(() => ui.showScreen('main-city'), 2000);
    }
};
// СИСТЕМА СОХРАНЕНИЯ (Local Storage)
game.save = function() {
    const data = JSON.stringify(this.stats);
    localStorage.setItem('medieval_strategy_save', data);
    console.log("Прогресс сохранен");
};

game.load = function() {
    const savedData = localStorage.getItem('medieval_strategy_save');
    if (savedData) {
        this.stats = JSON.parse(savedData);
        ui.updateResources();
        ui.notify("С возвращением, Лорд!");
    }
};

// Авто-сохранение каждые 30 секунд
setInterval(() => game.save(), 30000);

// ИНТЕГРАЦИЯ С КНОПКАМИ TELEGRAM
tg.BackButton.onClick(() => {
    // Если открыто модальное окно — закрываем его
    if (!document.getElementById('modal-overlay').classList.contains('hidden')) {
        ui.closeModal();
    } else {
        // Иначе возвращаемся в главный город
        ui.showScreen('main-city');
    }
});

// Управление видимостью кнопки "Назад"
ui.toggleBackButton = function(show) {
    if (show) tg.BackButton.show();
    else tg.BackButton.hide();
};

// Модифицируем функцию переключения экранов, чтобы кнопка Back появлялась вовремя
const originalShowScreen = ui.showScreen;
ui.showScreen = function(screenId) {
    originalShowScreen(screenId);
    if (screenId === 'main-city') {
        this.toggleBackButton(false);
    } else {
        this.toggleBackButton(true);
    }
};
game.upgradeCity = function() {
    const cost = this.config.upgradeCityCost;
    
    if (this.stats.wood >= cost.wood && this.stats.stone >= cost.stone) {
        this.stats.wood -= cost.wood;
        this.stats.stone -= cost.stone;
        this.stats.lvl += 1; // Повышаем уровень города
        
        ui.notify("Город улучшен! Новые горизонты открыты.");
        tg.HapticFeedback.notificationOccurred('success');
        ui.updateResources();
        ui.closeModal();
    } else {
        ui.notify("Нужно больше дерева и камня!");
        tg.HapticFeedback.notificationOccurred('error');
    }
};

game.upgradeTaxes = function() {
    if (this.stats.emeralds >= 10) {
        this.stats.emeralds -= 10;
        // Логика: увеличиваем пассивный доход (например, +10 золота в минуту)
        this.stats.passiveIncome = (this.stats.passiveIncome || 0) + 10;
        
        ui.notify("Налоги увеличены! Казна будет расти быстрее.");
        ui.updateResources();
    } else {
        ui.notify("Недостаточно изумрудов!");
    }
};

// Пассивный доход
setInterval(() => {
    if (game.stats.passiveIncome > 0) {
        game.stats.gold += game.stats.passiveIncome;
        ui.updateResources();
    }
}, 60000); // Раз в минуту
window.onload = () => {
    // 1. Загружаем данные
    game.load();
    
    // 2. Настраиваем Telegram
    tg.ready();
    tg.expand();
    
    // 3. Устанавливаем имя игрока
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        document.getElementById('player-name').innerText = tg.initDataUnsafe.user.first_name;
    } else {
        document.getElementById('player-name').innerText = "Странник";
    }

    // 4. Обновляем UI
    ui.updateResources();
    ui.renderInventory();
    
    // Показываем главный экран
    ui.showScreen('main-city');
};

