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
