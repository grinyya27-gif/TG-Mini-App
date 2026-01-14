/**
 * WAR-GAME: Chronicles of Empire
 * Core Engine Module
 */

"use strict";
// Аварийный таймер: убирает экран загрузки через 3 секунды в любом случае
setTimeout(() => {
    const loader = document.getElementById('app-curtain') || 
                   document.getElementById('preloader') || 
                   document.querySelector('[id*="load"]');
    if (loader) {
        loader.style.display = 'none';
        console.log("Загрузка убрана принудительно");
    }
    // Показываем основной блок игры
    const app = document.getElementById('app');
    if (app) app.style.display = 'block';
}, 3000);

// Функция, которая физически убирает заставку
function forceHideLoader() {
    console.log("Принудительное скрытие загрузки...");
    const loader = document.getElementById('preloader') || document.getElementById('app-curtain');
    const app = document.getElementById('app');

    if (loader) {
        loader.classList.add('hide-preloader'); // Добавляем CSS класс скрытия
        loader.style.display = 'none';         // Дублируем для надежности
    }
    
    if (app) {
        app.classList.remove('hidden');       // Показываем саму игру
        app.style.display = 'block';
    }
}

// Запуск таймера: если через 4 секунды игра не ожила, убираем экран загрузки
setTimeout(forceHideLoader, 4000);

// Также пробуем убрать загрузку сразу, как только страница "отрисовалась"
window.addEventListener('DOMContentLoaded', () => {
    // Если Telegram готов, пробуем запуститься
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
});
const tg = window.Telegram.WebApp;

// Главный объект игры
const Game = {
    // Состояние игрока (Модель данных)
    state: {
        user: {
            id: 0,
            name: "Unknown Warrior",
            photo: "",
            level: 1,
            exp: 0,
            nextLvlExp: 100,
            points: 0
        },
        resources: {
            gold: 1000,
            emeralds: 10,
            energy: 100,
            maxEnergy: 100
        },
        stats: {
            hp: 100,
            maxHp: 100,
            atk: 10,
            def: 5,
            luck: 3,
            crit: 5
        },
        inventory: [],
        location: 'hub',
        flags: {
            isTutorialPassed: false,
            firstBonusClaimed: false
        }
    },

    // Конфигурация
    config: {
        saveKey: 'war_game_v1_save',
        autoSaveInterval: 30000 // 30 секунд
    },

    // Инициализация
    init() {
        console.log("Game Engine: Starting...");
        tg.expand();
        tg.ready();

        // 1. Загрузка данных
        this.loadPlayerData();

        // 2. Синхронизация с Telegram
        this.syncWithTelegram();

        // 3. Запуск систем
        UI.init();
        Economy.init();
        
        // 4. Скрытие прелоадера
        setTimeout(() => {
            document.getElementById('preloader').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            UI.showScreen('screen-auth');
        }, 1500);

        // 5. Автосохранение
        setInterval(() => this.savePlayerData(), this.config.autoSaveInterval);
    },

    syncWithTelegram() {
        const user = tg.initDataUnsafe?.user;
        if (user) {
            this.state.user.id = user.id;
            this.state.user.name = user.first_name + (user.last_name ? ` ${user.last_name}` : "");
            this.state.user.photo = user.photo_url;
            
            // Если в HTML есть элементы для данных ТГ
            const nameEl = document.getElementById('tg-name');
            if (nameEl) nameEl.innerText = this.state.user.name;
            
            const avatarEl = document.getElementById('tg-avatar');
            if (avatarEl && user.photo_url) {
                avatarEl.src = user.photo_url;
                avatarEl.classList.remove('hidden');
            }
        }
    },

    savePlayerData() {
        try {
            const data = JSON.stringify(this.state);
            localStorage.setItem(this.config.saveKey, data);
            UI.toast("Игра сохранена");
        } catch (e) {
            console.error("Save error:", e);
        }
    },

    loadPlayerData() {
        const saved = localStorage.getItem(this.config.saveKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Мерджим сохраненные данные с дефолтными (на случай обновлений структуры)
                this.state = { ...this.state, ...parsed };
            } catch (e) {
                console.error("Load error:", e);
            }
        }
    }
};

/**
 * UI Модуль - управление интерфейсом
 */
const UI = {
    currentScreen: 'screen-auth',

    init() {
        this.bindEvents();
        this.updateHUD();
    },

    // Переключение главных экранов
    showScreen(screenId) {
        document.querySelectorAll('.game-screen').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
            this.currentScreen = screenId;
        }
    },

    // Управление локациями (модалками)
    openLocation(locId) {
        const modal = document.getElementById(`modal-${locId}`);
        if (modal) {
            modal.classList.remove('hidden');
            tg.HapticFeedback.impactOccurred('medium');
            
            // Обновляем заголовок HUD если нужно
            const locName = document.querySelector(`[data-target="${locId}"] h3`)?.innerText;
            if (locName) document.getElementById('current-location-name').innerText = locName;
        }
    },

    closeLocation() {
        document.querySelectorAll('.location-overlay').forEach(m => m.classList.add('hidden'));
        document.getElementById('current-location-name').innerText = "Цитадель";
        tg.HapticFeedback.selectionChanged();
    },

    // Обновление цифр на экране
    updateHUD() {
        const s = Game.state;
        document.getElementById('val-gold').innerText = s.resources.gold.toLocaleString();
        document.getElementById('val-emeralds').innerText = s.resources.emeralds.toLocaleString();
        document.getElementById('hud-lvl').innerText = s.user.level;
        
        const hpPercent = (s.stats.hp / s.stats.maxHp) * 100;
        document.getElementById('hp-fill').style.width = `${hpPercent}%`;
    },

    toast(text) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const t = document.createElement('div');
        t.className = 'toast-msg';
        t.innerText = text;
        container.appendChild(t);
        
        setTimeout(() => t.remove(), 3000);
    },

    bindEvents() {
        // Кнопка входа
        document.getElementById('btn-enter-game')?.addEventListener('click', () => {
            this.showScreen('game-world'); // Переход в основной мир
            document.getElementById('main-hud').classList.remove('hidden');
            document.getElementById('bottom-nav').classList.remove('hidden');
            document.getElementById('game-world').classList.remove('hidden');
            
            if (!Game.state.flags.isTutorialPassed) {
                this.openLocation('tutorial');
            }
        });

        // Клик по узлам хаба
        document.querySelectorAll('.hub-node').forEach(node => {
            node.addEventListener('click', () => {
                const target = node.getAttribute('data-target');
                this.openLocation(target);
            });
        });
    }
};

/**
 * Economy Модуль
 */
const Economy = {
    init() {
        console.log("Economy system active.");
    },

    addGold(amount) {
        Game.state.resources.gold += amount;
        UI.updateHUD();
        tg.HapticFeedback.notificationOccurred('success');
    },

    spendGold(amount) {
        if (Game.state.resources.gold >= amount) {
            Game.state.resources.gold -= amount;
            UI.updateHUD();
            return true;
        }
        UI.toast("Недостаточно золота!");
        return false;
    }
};

// Запуск при загрузке окна
window.onload = () => Game.init();
/**
 * COMBAT SYSTEM - Логика сражений и дуэлей
 */
const Combat = {
    isFighting: false,
    currentEnemy: null,

    // Инициализация боя
    startDuel() {
        if (this.isFighting) return;
        
        // Генерация противника (уровень игрока +/- 1)
        const pLvl = Game.state.user.level;
        this.currentEnemy = {
            name: "Разбойник",
            level: pLvl,
            hp: 80 + (pLvl * 20),
            maxHp: 80 + (pLvl * 20),
            atk: 8 + (pLvl * 2),
            def: 4 + pLvl
        };

        this.isFighting = true;
        UI.showScreen('combat-overlay');
        this.log("Начинается бой с: " + this.currentEnemy.name);
        this.updateCombatUI();
    },

    attack() {
        if (!this.isFighting) return;

        // 1. Ход игрока
        let playerDamage = this.calculateDamage(Game.state.stats.atk, this.currentEnemy.def);
        let isCrit = Math.random() * 100 < Game.state.stats.crit;
        if (isCrit) playerDamage *= 2;

        this.currentEnemy.hp -= playerDamage;
        this.log(`Вы ударили на ${playerDamage}! ${isCrit ? 'КРИТ!' : ''}`, 'player');

        // Проверка на победу
        if (this.currentEnemy.hp <= 0) {
            this.endBattle(true);
            return;
        }

        // 2. Ход врага (с задержкой для анимации)
        setTimeout(() => {
            let enemyDamage = this.calculateDamage(this.currentEnemy.atk, Game.state.stats.def);
            Game.state.stats.hp -= enemyDamage;
            this.log(`${this.currentEnemy.name} бьет на ${enemyDamage}`, 'enemy');
            
            UI.updateHUD();
            this.updateCombatUI();

            if (Game.state.stats.hp <= 0) {
                this.endBattle(false);
            }
        }, 600);
    },

    calculateDamage(atk, def) {
        // Базовая формула: (Атака * 2) - Защита. Минимум 1 урон.
        let dmg = (atk * 1.5) - (def * 0.5);
        return Math.max(1, Math.floor(dmg + (Math.random() * 5)));
    },

    endBattle(win) {
        this.isFighting = false;
        if (win) {
            const goldPrize = 50 + (this.currentEnemy.level * 10);
            const expPrize = 25;
            Economy.addGold(goldPrize);
            this.addExp(expPrize);
            this.log(`Победа! Получено ${goldPrize} золота и ${expPrize} опыта.`);
        } else {
            UI.showScreen('screen-death');
            Game.state.stats.hp = 10; // Остаток жизни после "смерти"
        }
        setTimeout(() => UI.showScreen('game-world'), 2000);
    },

    addExp(amt) {
        const s = Game.state.user;
        s.exp += amt;
        if (s.exp >= s.nextLvlExp) {
            s.level++;
            s.exp -= s.nextLvlExp;
            s.nextLvlExp = Math.floor(s.nextLvlExp * 1.5);
            UI.toast("НОВЫЙ УРОВЕНЬ: " + s.level);
            tg.HapticFeedback.notificationOccurred('success');
        }
    },

    log(msg, type) {
        const logBox = document.getElementById('combat-log-detailed');
        const entry = document.createElement('div');
        entry.className = `log-msg ${type}`;
        entry.innerText = msg;
        logBox.prepend(entry);
    },

    updateCombatUI() {
        // Здесь можно обновлять прогресс-бары HP врага в modal-arena
    }
};

/**
 * INVENTORY SYSTEM - Предметы и экипировка
 */
const Inventory = {
    // База данных предметов (в реальности может быть в отдельном JSON)
    db: [
        { id: 'w_1', name: "Меч Новичка", type: 'weapon', atk: 5, price: 100 },
        { id: 'a_1', name: "Кожаная куртка", type: 'armor', def: 3, price: 80 }
    ],

    addItem(itemId) {
        const item = this.db.find(i => i.id === itemId);
        if (item) {
            Game.state.inventory.push(item);
            this.render();
            UI.toast(`Получено: ${item.name}`);
        }
    },

    render() {
        const grid = document.getElementById('inventory-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        Game.state.inventory.forEach((item, index) => {
            const cell = document.createElement('div');
            cell.className = 'inv-cell occupied';
            cell.innerHTML = `<span>${item.name[0]}</span>`;
            cell.onclick = () => this.useItem(index);
            grid.appendChild(cell);
        });
    },

    useItem(index) {
        const item = Game.state.inventory[index];
        if (item.type === 'weapon') {
            Game.state.stats.atk += item.atk;
            UI.toast(`Экипировано: ${item.name} (+${item.atk} Атк)`);
        }
        // Удаляем после использования или экипировки (логику можно усложнить)
        Game.state.inventory.splice(index, 1);
        this.render();
        UI.updateHUD();
    }
};

/**
 * ACTIONS - Работа в трактире, экспедиции
 */
const Actions = {
    isWorking: false,

    doWork(type) {
        if (this.isWorking) return;
        
        const energyCost = 15;
        if (Game.state.resources.energy < energyCost) {
            UI.toast("Нет энергии! Отдохните в таверне.");
            return;
        }

        this.isWorking = true;
        Game.state.resources.energy -= energyCost;
        
        UI.toast("Работаем...");
        
        setTimeout(() => {
            let reward = 20 + (Game.state.user.level * 5);
            Economy.addGold(reward);
            UI.toast(`Вы заработали ${reward} 🪙`);
            this.isWorking = false;
            UI.updateHUD();
        }, 3000);
    }
};

// Расширяем UI.bindEvents для новых функций
const originalBindEvents = UI.bindEvents;
UI.bindEvents = function() {
    originalBindEvents.apply(this);

    // Привязка кнопок боя
    document.querySelector('.btn-duel')?.addEventListener('click', () => Combat.startDuel());
    
    // Привязка кнопок работы
    document.querySelector('[onclick="game.work(\'cleaning\')"]')?.setAttribute('onclick', '');
    document.querySelector('[onclick="game.work(\'cleaning\')"]')?.addEventListener('click', () => Actions.doWork('clean'));
};
/**
 * SHOP SYSTEM - Динамическая торговля
 */
const Shop = {
    // Ассортимент товаров
    items: [
        { id: 'w_2', name: "Стальной меч", type: 'weapon', atk: 15, price: 500, currency: 'gold' },
        { id: 'a_2', name: "Латный доспех", type: 'armor', def: 12, price: 1200, currency: 'gold' },
        { id: 'p_1', name: "Кристалл Силы", type: 'artifact', atk: 50, price: 50, currency: 'emeralds' }
    ],

    initShop() {
        const container = document.getElementById('forge-items');
        if (!container) return;
        container.innerHTML = '';

        this.items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'item-slot';
            itemEl.innerHTML = `
                <div class="item-icon">${item.type === 'weapon' ? '⚔️' : '🛡️'}</div>
                <span class="item-name">${item.name}</span>
                <small>${item.atk ? 'Атк: +' + item.atk : 'Защ: +' + item.def}</small>
                <button class="btn-buy-small" onclick="Shop.buy('${item.id}')">
                    ${item.price} ${item.currency === 'gold' ? '🪙' : '💎'}
                </button>
            `;
            container.appendChild(itemEl);
        });
    },

    buy(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        if (item.currency === 'gold') {
            if (Economy.spendGold(item.price)) {
                Inventory.addItem(item.id);
                UI.toast(`Куплено: ${item.name}`);
            }
        } else {
            if (Game.state.resources.emeralds >= item.price) {
                Game.state.resources.emeralds -= item.price;
                Inventory.addItem(item.id);
                UI.updateHUD();
                UI.toast(`Редкая покупка: ${item.name}`);
            } else {
                UI.toast("Недостаточно изумрудов!");
            }
        }
    }
};

/**
 * QUEST SYSTEM - Задания и прогресс
 */
const Quests = {
    activeQuests: [
        { id: 'q_start', title: "Первые шаги", desc: "Заработать 200 золота", goal: 200, type: 'gold', current: 0, reward: 50, done: false }
    ],

    checkProgress(type, value) {
        this.activeQuests.forEach(q => {
            if (!q.done && q.type === type) {
                q.current += value;
                if (q.current >= q.goal) {
                    this.complete(q);
                }
            }
        });
    },

    complete(quest) {
        quest.done = true;
        Economy.addGold(quest.reward);
        UI.toast(`Квест выполнен: ${quest.title}! +${quest.reward}🪙`);
        tg.HapticFeedback.notificationOccurred('success');
    }
};

/**
 * RANDOM EVENTS - Случайные встречи в мире
 */
const WorldEvents = {
    chance: 0.15, // 15% шанс при переходе между локациями

    trigger() {
        if (Math.random() < this.chance) {
            const events = [
                { text: "Вы нашли кошелек на дороге!", action: () => Economy.addGold(50) },
                { text: "Вы встретили старого учителя. Опыт +20", action: () => Combat.addExp(20) },
                { text: "Вам в карман залетел изумруд!", action: () => { Game.state.resources.emeralds += 1; UI.updateHUD(); } }
            ];
            
            const randomEv = events[Math.floor(Math.random() * events.length)];
            setTimeout(() => {
                alert("СОБЫТИЕ: " + randomEv.text);
                randomEv.action();
            }, 500);
        }
    }
};

/**
 * Расширение логики UI и Игры
 */
// Модифицируем UI.openLocation, чтобы добавить события и инициализацию магазина
const oldOpenLocation = UI.openLocation;
UI.openLocation = function(locId) {
    oldOpenLocation.apply(this, arguments);
    
    // Если открыли кузню — обновить товары
    if (locId === 'blacksmith') Shop.initShop();
    
    // При каждом переходе — шанс события
    WorldEvents.trigger();
};

// Добавляем проверку квестов в Economy
const oldAddGold = Economy.addGold;
Economy.addGold = function(amount) {
    oldAddGold.apply(this, arguments);
    Quests.checkProgress('gold', amount);
};

/**
 * DAILY REWARDS - Ежедневная лотерея
 */
const Daily = {
    claim() {
        if (Game.state.flags.firstBonusClaimed) {
            UI.toast("Сегодня награда уже получена!");
            return;
        }
        
        const prize = 100;
        Economy.addGold(prize);
        Game.state.flags.firstBonusClaimed = true;
        UI.toast(`Ежедневный бонус: +${prize} 🪙`);
        document.getElementById('modal-daily').classList.add('hidden');
    }
};
/**
 * PET SYSTEM - Спутники, дающие бонусы
 */
const Pets = {
    owned: [],
    activePet: null,

    db: [
        { id: 'pet_dragon', name: 'Дракончик', bonus: { atk: 10 }, icon: '🐲', price: 100 },
        { id: 'pet_wolf', name: 'Лютоволк', bonus: { crit: 5 }, icon: '🐺', price: 50 }
    ],

    buyPet(petId) {
        const pet = this.db.find(p => p.id === petId);
        if (Game.state.resources.emeralds >= pet.price) {
            Game.state.resources.emeralds -= pet.price;
            this.owned.push(pet);
            UI.toast(`${pet.name} теперь ваш спутник!`);
            this.renderPets();
            UI.updateHUD();
        } else {
            UI.toast("Недостаточно изумрудов!");
        }
    },

    setActive(index) {
        this.activePet = this.owned[index];
        // Применяем бонусы к статам игрока
        if (this.activePet.bonus.atk) Game.state.stats.atk += this.activePet.bonus.atk;
        UI.toast(`${this.activePet.name} готов к бою!`);
        UI.updateHUD();
    },

    renderPets() {
        const container = document.getElementById('my-pets-list');
        if (!container) return;
        container.innerHTML = '';
        this.owned.forEach((pet, i) => {
            container.innerHTML += `
                <div class="pet-card" onclick="Pets.setActive(${i})">
                    <div class="pet-avatar">${pet.icon}</div>
                    <div class="pet-name">${pet.name}</div>
                </div>`;
        });
    }
};

/**
 * ALCHEMY & CRAFT - Создание предметов из ресурсов
 */
const Workshop = {
    recipes: [
        { 
            id: 'super_potion', 
            name: 'Зелье Великана', 
            ingredients: { gold: 500, exp: 100 }, 
            result: () => { Game.state.stats.maxHp += 20; UI.toast("Макс. HP увеличено!"); }
        }
    ],

    executeCraft(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (Game.state.resources.gold >= recipe.ingredients.gold) {
            Game.state.resources.gold -= recipe.ingredients.gold;
            recipe.result();
            UI.updateHUD();
            tg.HapticFeedback.impactOccurred('heavy');
        } else {
            UI.toast("Недостаточно ингредиентов!");
        }
    }
};

/**
 * ACHIEVEMENT SYSTEM - Постоянные цели
 */
const Achievements = {
    list: [
        { id: 'rich', title: 'Магнат', goal: 5000, current: 0, type: 'gold', reward: 50, completed: false },
        { id: 'killer', title: 'Убийца чудовищ', goal: 10, current: 0, type: 'kills', reward: 20, completed: false }
    ],

    track(type, value) {
        this.list.forEach(ach => {
            if (ach.type === type && !ach.completed) {
                ach.current += value;
                if (ach.current >= ach.goal) {
                    this.unlock(ach);
                }
            }
        });
    },

    unlock(ach) {
        ach.completed = true;
        Game.state.resources.emeralds += ach.reward;
        UI.toast(`🏆 Достижение: ${ach.title}! +${ach.reward} 💎`);
        tg.HapticFeedback.notificationOccurred('success');
    }
};

/**
 * ГЛОБАЛЬНАЯ ИНТЕГРАЦИЯ
 * Перехватываем стандартные функции для отслеживания достижений
 */

// Следим за убийствами в бою
const oldEndBattle = Combat.endBattle;
Combat.endBattle = function(win) {
    if (win) Achievements.track('kills', 1);
    oldEndBattle.apply(this, arguments);
};

// Следим за накоплением золота
const oldAddGoldAch = Economy.addGold;
Economy.addGold = function(amount) {
    oldAddGoldAch.apply(this, arguments);
    Achievements.track('gold', amount);
};

/**
 * VFX ENGINE - Визуальные эффекты (Canvas-лайт)
 */
const VFX = {
    shakeScreen() {
        const app = document.getElementById('app');
        app.classList.add('shake-anim');
        setTimeout(() => app.classList.remove('shake-anim'), 500);
    },

    showDamage(value, isCritical) {
        const container = document.getElementById('damage-numbers-container');
        const el = document.createElement('div');
        el.className = `damage-popup ${isCritical ? 'crit' : ''}`;
        el.innerText = `-${value}`;
        el.style.left = `${50 + (Math.random() * 20 - 10)}%`;
        container.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }
};
/**
 * CLAN SYSTEM - Социальное взаимодействие (Имитация)
 */
const Clans = {
    currentClan: null,
    
    // Список доступных кланов для вступления
    list: [
        { id: 1, name: 'Imperial Guard', power: 15000, members: 45, minLvl: 5 },
        { id: 2, name: 'Shadow Assassins', power: 12000, members: 30, minLvl: 10 }
    ],

    init() {
        this.renderClanList();
    },

    renderClanList() {
        const container = document.querySelector('.clan-list');
        if (!container) return;
        container.innerHTML = '';

        this.list.forEach(clan => {
            container.innerHTML += `
                <div class="clan-card">
                    <div class="clan-info">
                        <h4>${clan.name}</h4>
                        <p>Мощь: ${clan.power} | Участники: ${clan.members}/50</p>
                    </div>
                    <button class="btn-join" onclick="Clans.join(${clan.id})">Вступить</button>
                </div>
            `;
        });
    },

    join(clanId) {
        const clan = this.list.find(c => c.id === clanId);
        if (Game.state.user.level < clan.minLvl) {
            UI.toast(`Нужен уровень ${clan.minLvl}!`);
            return;
        }
        this.currentClan = clan;
        UI.toast(`Добро пожаловать в ${clan.name}!`);
        document.getElementById('clan-join-view').classList.add('hidden');
        document.getElementById('clan-main-view').classList.remove('hidden');
        document.getElementById('my-clan-name').innerText = clan.name;
    }
};

/**
 * MAIL SYSTEM - Подарки и уведомления
 */
const Mail = {
    messages: [
        { id: 1, title: 'Приветственный бонус', body: 'Держи 100 золота для старта!', reward: { gold: 100 }, read: false }
    ],

    render() {
        const container = document.getElementById('mail-container');
        if (!container) return;
        container.innerHTML = '';

        this.messages.forEach(msg => {
            container.innerHTML += `
                <div class="mail-item ${msg.read ? '' : 'unread'}">
                    <div class="mail-content">
                        <h4>${msg.title}</h4>
                        <p>${msg.body}</p>
                    </div>
                    ${!msg.read ? `<button onclick="Mail.collect(${msg.id})">Забрать</button>` : '<span>Получено</span>'}
                </div>
            `;
        });
    },

    collect(id) {
        const msg = this.messages.find(m => m.id === id);
        if (msg && !msg.read) {
            if (msg.reward.gold) Economy.addGold(msg.reward.gold);
            msg.read = true;
            UI.toast("Награда получена!");
            this.render();
        }
    }
};

/**
 * ADVANCED COMBAT - ИИ с фазами и навыками
 */
const AdvancedCombat = {
    enemyPhases: {
        enraged: false
    },

    // Специальный удар игрока
    useSkill() {
        const cost = 25;
        if (Game.state.resources.energy < cost) {
            UI.toast("Недостаточно энергии!");
            return;
        }
        
        Game.state.resources.energy -= cost;
        const skillDamage = Math.floor(Game.state.stats.atk * 2.5);
        Combat.currentEnemy.hp -= skillDamage;
        
        VFX.shakeScreen();
        VFX.showDamage(skillDamage, true);
        UI.toast("💥 МОЩНЫЙ УДАР!");
        
        if (Combat.currentEnemy.hp <= 0) Combat.endBattle(true);
        UI.updateHUD();
    },

    // Проверка состояния врага (вызывается каждый ход)
    checkEnemyState() {
        const enemy = Combat.currentEnemy;
        if (enemy.hp < enemy.maxHp * 0.3 && !this.enemyPhases.enraged) {
            this.enemyPhases.enraged = true;
            enemy.atk *= 1.5;
            UI.toast("💢 ВРАГ В ЯРОСТИ! Урон увеличен!");
        }
    }
};

/**
 * NAVIGATION & SOUNDS - Улучшение UX
 */
const SoundEngine = {
    play(soundId) {
        const audio = document.getElementById(`snd-${soundId}`);
        if (audio && Game.state.flags.soundEnabled) {
            audio.currentTime = 0;
            audio.play();
        }
    }
};

// Расширяем привязку событий для работы с кланами и навыками
const extendUI = () => {
    // Кнопка навыка в бою
    document.querySelector('.btn-combat[onclick="combat.skill()"]')?.setAttribute('onclick', '');
    document.querySelector('.btn-combat[onclick="combat.skill()"]')?.addEventListener('click', () => AdvancedCombat.useSkill());

    // Инициализация почты при открытии
    const oldOpen = UI.openLocation;
    UI.openLocation = function(locId) {
        oldOpen.apply(this, arguments);
        if (locId === 'mail') Mail.render();
        if (locId === 'clans') Clans.init();
    };
};

// Запускаем расширение после загрузки
window.addEventListener('DOMContentLoaded', extendUI);
/**
 * DUNGEON SYSTEM - Генератор случайных походов
 */
const Dungeons = {
    currentFloor: 0,
    maxFloors: 5,
    isExplorationActive: false,

    start(dungeonId) {
        this.currentFloor = 1;
        this.isExplorationActive = true;
        UI.openLocation('combat-overlay'); // Используем боевой экран для подземелья
        this.nextEvent();
    },

    nextEvent() {
        if (this.currentFloor > this.maxFloors) {
            this.finish(true);
            return;
        }

        const roll = Math.random();
        if (roll < 0.6) {
            this.triggerBattle();
        } else if (roll < 0.9) {
            this.triggerTreasure();
        } else {
            this.triggerTrap();
        }
    },

    triggerBattle() {
        UI.toast(`Этаж ${this.currentFloor}: Засада!`);
        Combat.startDuel(); 
        // Перехватываем конец боя специально для подземелья
        const oldEnd = Combat.endBattle;
        Combat.endBattle = (win) => {
            oldEnd.call(Combat, win);
            if (win && this.isExplorationActive) {
                this.currentFloor++;
                setTimeout(() => this.nextEvent(), 1500);
            } else {
                this.isExplorationActive = false;
            }
            Combat.endBattle = oldEnd; // Возвращаем функцию в исходное состояние
        };
    },

    triggerTreasure() {
        const gold = 100 * this.currentFloor;
        Economy.addGold(gold);
        UI.toast(`Вы нашли сундук: +${gold} 🪙`);
        this.currentFloor++;
        setTimeout(() => this.nextEvent(), 2000);
    },

    triggerTrap() {
        const damage = 10 + (this.currentFloor * 2);
        Game.state.stats.hp -= damage;
        VFX.shakeScreen();
        UI.toast(`Ловушка! Вы потеряли ${damage} HP`);
        UI.updateHUD();
        
        if (Game.state.stats.hp <= 0) {
            this.finish(false);
        } else {
            this.currentFloor++;
            setTimeout(() => this.nextEvent(), 2000);
        }
    },

    finish(victory) {
        this.isExplorationActive = false;
        if (victory) {
            UI.toast("Подземелье зачищено! Награда: 5 💎");
            Game.state.resources.emeralds += 5;
        }
        UI.showScreen('game-world');
        UI.updateHUD();
    }
};

/**
 * AUCTION SYSTEM - Логика рынка
 */
const Auction = {
    lots: [
        { id: 101, name: "Меч Древних", price: 5000, seller: "NPC_Merchant", type: "weapon" },
        { id: 102, name: "Кольцо Удачи", price: 200, seller: "Legendary_Hero", type: "artifact" }
    ],

    render() {
        const container = document.getElementById('auction-list');
        if (!container) return;
        container.innerHTML = '';

        this.lots.forEach(lot => {
            container.innerHTML += `
                <div class="auc-card">
                    <div class="auc-info">
                        <h4>${lot.name}</h4>
                        <p>Продавец: ${lot.seller}</p>
                    </div>
                    <div class="auc-price">
                        <span>${lot.price} 🪙</span>
                        <button onclick="Auction.buy(${lot.id})">Купить</button>
                    </div>
                </div>
            `;
        });
    },

    buy(lotId) {
        const lot = this.lots.find(l => l.id === lotId);
        if (Economy.spendGold(lot.price)) {
            Inventory.addItem(lot.type === 'weapon' ? 'w_2' : 'p_1'); // Упрощенно выдаем предмет
            this.lots = this.lots.filter(l => l.id !== lotId);
            this.render();
            UI.toast("Лот выкуплен!");
        }
    }
};

/**
 * BUFF SYSTEM - Временные усиления
 */
const Buffs = {
    active: [],

    apply(id, stat, value, durationSec) {
        const buff = { id, stat, value, expires: Date.now() + (durationSec * 1000) };
        this.active.push(buff);
        
        // Применяем эффект
        Game.state.stats[stat] += value;
        UI.toast(`Эффект получен: +${value} к ${stat}`);
        UI.updateHUD();

        // Таймер на снятие
        setTimeout(() => this.remove(id), durationSec * 1000);
    },

    remove(id) {
        const index = this.active.findIndex(b => b.id === id);
        if (index !== -1) {
            const buff = this.active[index];
            Game.state.stats[buff.stat] -= buff.value;
            this.active.splice(index, 1);
            UI.toast(`Действие эффекта ${id} закончилось`);
            UI.updateHUD();
        }
    }
};

/**
 * СВЯЗКА С ИНТЕРФЕЙСОМ
 */
const bindNewModules = () => {
    // Аукцион при открытии
    const oldOpen = UI.openLocation;
    UI.openLocation = function(locId) {
        oldOpen.apply(this, arguments);
        if (locId === 'auction') Auction.render();
        if (locId === 'port') {
            // Предлагаем поход в подземелье в порту
            if (confirm("Отправиться в Темную Гавань?")) Dungeons.start('d1');
        }
    };
};

window.addEventListener('DOMContentLoaded', bindNewModules);
/**
 * BOSS RAID SYSTEM - Уникальные механики боссов
 */
const BossSystem = {
    activeBoss: null,
    
    // Список боссов с фазами
    bosses: [
        { 
            id: 'b_dragon', 
            name: 'Древний Дракон', 
            hp: 5000, 
            maxHp: 5000, 
            atk: 45, 
            skills: ['Огненное дыхание', 'Удар хвостом'],
            phase: 1
        }
    ],

    spawn(bossId) {
        const template = this.bosses.find(b => b.id === bossId);
        this.activeBoss = { ...template };
        
        UI.showScreen('combat-overlay');
        Logger.log(`⚠️ МИРОВОЙ БОСС: ${this.activeBoss.name} пробудился!`, 'warning');
        this.startBossLoop();
    },

    startBossLoop() {
        // Логика боя с боссом отличается от обычного дуэля
        this.updateBossUI();
    },

    takeDamage(dmg) {
        if (!this.activeBoss) return;
        this.activeBoss.hp -= dmg;
        
        // Переход во вторую фазу
        if (this.activeBoss.hp < this.activeBoss.maxHp / 2 && this.activeBoss.phase === 1) {
            this.activeBoss.phase = 2;
            this.activeBoss.atk *= 1.5;
            Logger.log(`${this.activeBoss.name} входит в ярость!`, 'critical');
            VFX.shakeScreen();
        }

        if (this.activeBoss.hp <= 0) {
            this.defeat();
        }
        this.updateBossUI();
    },

    defeat() {
        Logger.log(`🎉 ${this.activeBoss.name} повержен!`, 'success');
        Economy
        /**
 * TALENT SYSTEM - Прогрессия персонажа
 */
const Talents = {
    // Состояние выученных навыков
    points: 0,
    learned: [],

    // Описание эффектов талантов
    db: {
        'str_1': { name: 'Сила быка', stat: 'atk', bonus: 5, cost: 1 },
        'str_2': { name: 'Латник', stat: 'def', bonus: 10, cost: 2 },
        'luk_1': { name: 'Глаз орла', stat: 'crit', bonus: 5, cost: 1 }
    },

    init() {
        this.updatePoints();
        this.renderTree();
    },

    updatePoints() {
        // Очки талантов даются за каждые 2 уровня
        this.points = Math.floor(Game.state.user.level / 2) - this.learned.length;
        const el = document.getElementById('tp-count');
        if (el) el.innerText = this.points;
    },

    learn(talentId) {
        const talent = this.db[talentId];
        if (this.points >= talent.cost && !this.learned.includes(talentId)) {
            this.learned.push(talentId);
            Game.state.stats[talent.stat] += talent.bonus;
            
            this.points -= talent.cost;
            UI.toast(`Изучено: ${talent.name}`);
            tg.HapticFeedback.impactOccurred('medium');
            
            this.renderTree();
            UI.updateHUD();
        } else {
            UI.toast("Недостаточно очков или уже изучено");
        }
    },

    renderTree() {
        // Подсвечиваем активные ноды в HTML
        Object.keys(this.db).forEach(id => {
            const node = document.querySelector(`[data-talent="${id}"]`);
            if (node) {
                if (this.learned.includes(id)) {
                    node.classList.add('learned');
                    node.classList.remove('available');
                } else if (this.points >= this.db[id].cost) {
                    node.classList.add('available');
                }
            }
        });
    }
};

/**
 * CLOUD SYNC - Работа с Telegram CloudStorage
 */
const CloudProvider = {
    // Сохранение в облако Telegram (синхронизация между устройствами)
    save() {
        const dataString = JSON.stringify(Game.state);
        tg.CloudStorage.setItem('game_save_v1', dataString, (err, success) => {
            if (success) console.log("Cloud Save: OK");
        });
    },

    // Загрузка из облака
    load() {
        tg.CloudStorage.getItem('game_save_v1', (err, value) => {
            if (value) {
                const cloudData = JSON.parse(value);
                if (cloudData.user.level > Game.state.user.level) {
                    Game.state = cloudData;
                    UI.updateHUD();
                    UI.toast("Данные синхронизированы с облаком");
                }
            }
        });
    }
};

/**
 * MASTER INITIALIZER - Запуск всех систем
 */
const AppLauncher = {
    run() {
        // 1. Базовая инициализация ядра
        Game.init();

        // 2. Инициализация подсистем
        Talents.init();
        Clans.init();
        Mail.render();
        
        // 3. Загрузка из облака (асинхронно)
        CloudProvider.load();

        // 4. Глобальный таймер регенерации
        setInterval(() => this.tick(), 5000);

        console.log("--- WAR GAME ENGINE READY ---");
    },

    tick() {
        // Регенерация энергии и HP каждые 5 сек
        if (Game.state.stats.hp < Game.state.stats.maxHp) {
            Game.state.stats.hp += 1;
        }
        if (Game.state.resources.energy < Game.state.resources.maxEnergy) {
            Game.state.resources.energy += 2;
        }
        UI.updateHUD();
    }
};

// Финальная привязка к кнопкам HTML
window.game = {
    startExpedition: (id) => Dungeons.start(id),
    learnTalent: (id) => Talents.learn(id),
    claimDaily: () => Daily.claim(),
    work: (type) => Actions.doWork(type),
    travel: (loc) => UI.openLocation(loc),
    collectMail: (id) => Mail.collect(id)
};

// Старт
document.addEventListener('DOMContentLoaded', () => AppLauncher.run());

        /**
 * БЕЗОПАСНЫЙ ЗАПУСК (Без звукового движка)
 */
const AppLauncher = {
    run() {
        console.log("Попытка запуска системы...");
        
        try {
            // 1. Инициализация Telegram
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();
            }

            // 2. Инициализация основных модулей
            // Проверяем существование каждого модуля перед вызовом
            if (typeof Game !== 'undefined') Game.loadPlayerData();
            if (typeof UI !== 'undefined') UI.init();
            if (typeof Economy !== 'undefined') Economy.init();

            // 3. Убираем экран загрузки (Curtain)
            this.hideLoader();

        } catch (error) {
            console.error("Критическая ошибка при запуске:", error);
            // Если всё сломалось, всё равно пытаемся показать интерфейс через 2 секунды
            setTimeout(() => this.hideLoader(), 2000);
        }
    },

    hideLoader() {
        const curtain = document.getElementById('app-curtain');
        if (curtain) {
            curtain.style.opacity = '0';
            setTimeout(() => {
                curtain.style.display = 'none';
                // Показываем первый экран
                if (typeof UI !== 'undefined') UI.showScreen('screen-auth');
            }, 500);
        }
    }
};

// Запуск при полной загрузке страницы
window.onload = () => AppLauncher.run();


