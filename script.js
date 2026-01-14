// ================================================
//   Ancient Destiny - RPG Clicker Mini App
//   JavaScript логика (большая версия)
//   Последнее обновление: январь 2026
// ================================================

// === 1. ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP ===========
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user || { first_name: "Странник", id: 0 };
document.getElementById("player-name").textContent = user.first_name || "Странник";

// === 2. ОСНОВНЫЕ ПЕРЕМЕННЫЕ ИГРЫ =================
const gameState = {
    gold: 0,
    emeralds: 0,
    fame: 0,
    level: 1,
    xp: 0,
    xpToNext: 100,
    clickPower: 1,
    passiveIncome: 0,
    
    // Данные о занятиях / работах
    activities: {
        fishing: { levelReq: 1,   baseMin: 1,  baseMax: 4,  passive: 0, unlocked: true  },
        farming: { levelReq: 3,   baseMin: 5,  baseMax: 12, passive: 0, unlocked: false },
        mining:  { levelReq: 5,   baseMin: 12, baseMax: 35, passive: 0, unlocked: false, emeraldChance: 0.015 },
        hunting: { levelReq: 15,  baseMin: 45, baseMax: 160,passive: 0, unlocked: false, weaponReq: true },
        guarding:{ levelReq: 20,  baseMin: 25, baseMax: 40, passive: 0, unlocked: false },
        praying: { levelReq: 28,  baseMin: 0,  baseMax: 0,  passive: 0, unlocked: false, special: true }
    },

    // Инвентарь (пока простая структура)
    inventory: [
        // {id: "simple_bow", name: "Простой лук", type: "weapon", equipped: false},
    ],

    // Флаги владения предметами
    hasBow: false,
    hasCrossbow: false,
    hasSword: false,
    hasArmor: false,
    hasAmulet: false,

    // Ежедневные награды
    lastDailyClaim: null,
    dailyStreak: 0,

    // Курсы обмена
    exchangeRates: {
        goldToEmerald: 220,
        emeraldToGold: 195
    },

    // Сохранение каждые 30 секунд + при выходе
    lastSave: Date.now()
};

// === 3. ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ DOM =====================
const els = {
    gold:           document.getElementById("gold-count"),
    emeralds:       document.getElementById("emerald-count"),
    fame:           document.getElementById("fame-count"),
    level:          document.getElementById("current-level"),
    xpBar:          document.getElementById("xp-progress"),
    xpText:         document.getElementById("xp-text"),
    playerTitle:    document.getElementById("player-title"),
    
    mainClickBtn:   document.getElementById("main-world-click"),
    
    tabs:           document.querySelectorAll(".tab-button"),
    tabPanels:      document.querySelectorAll(".tab-panel"),
    
    // Кнопки занятий
    btnFish:        document.getElementById("btn-fish"),
    btnFarm:        document.getElementById("activity-farming").querySelector(".activity-action-btn"),
    btnMine:        document.getElementById("activity-mining").querySelector(".activity-action-btn"),
    btnHunt:        document.getElementById("activity-hunting").querySelector(".activity-action-btn"),
    btnGuard:       document.getElementById("activity-guarding").querySelector(".activity-action-btn"),
    
    // Магазин
    buySimpleBow:   document.getElementById("buy-simple-bow"),
    buyCrossbow:    document.getElementById("buy-crossbow"),
    
    // Банк
    goldToEmInput:  document.getElementById("gold-to-em-amount"),
    btnGoldToEm:    document.getElementById("btn-gold-to-em"),
    emToGoldInput:  document.getElementById("em-to-gold-amount"),
    btnEmToGold:    document.getElementById("btn-em-to-gold"),
    
    // Ежедневка
    btnDaily:       document.getElementById("claim-daily-reward"),
    dailyMessage:   document.getElementById("daily-message")
};

// === 4. ПОМОГАЮЩИЕ ФУНКЦИИ ==========================

function formatNumber(num) {
    return Math.floor(num).toLocaleString("ru-RU");
}

function updateResourcesDisplay() {
    els.gold.textContent     = formatNumber(gameState.gold);
    els.emeralds.textContent = formatNumber(gameState.emeralds);
    els.fame.textContent     = formatNumber(gameState.fame);
}

function updateLevelAndXp() {
    els.level.textContent = gameState.level;
    const percent = Math.min(100, (gameState.xp / gameState.xpToNext) * 100);
    els.xpBar.style.width = percent + "%";
    els.xpText.textContent = `${formatNumber(gameState.xp)} / ${formatNumber(gameState.xpToNext)}`;
    
    // Обновляем титул (примерная система)
    const titles = [
        {lvl:1,  name:"Крестьянин"},
        {lvl:5,  name:"Рудокоп"},
        {lvl:10, name:"Охотник"},
        {lvl:15, name:"Следопыт"},
        {lvl:20, name:"Стражник"},
        {lvl:30, name:"Рыцарь"},
        {lvl:45, name:"Барон"},
        {lvl:60, name:"Граф"},
        {lvl:80, name:"Герцог"},
        {lvl:100,name:"Легенда"}
    ];
    
    let currentTitle = titles[0].name;
    for (let t of titles) {
        if (gameState.level >= t.lvl) currentTitle = t.name;
        else break;
    }
    els.playerTitle.textContent = currentTitle;
    document.getElementById("stat-title").textContent = currentTitle;
}

function addGold(amount) {
    gameState.gold += Math.floor(amount);
    updateResourcesDisplay();
}

function addXp(amount) {
    gameState.xp += amount;
    while (gameState.xp >= gameState.xpToNext) {
        gameState.xp -= gameState.xpToNext;
        gameState.level++;
        gameState.xpToNext = Math.floor(gameState.xpToNext * 1.38);
        gameState.clickPower += Math.floor(gameState.level / 4) + 1;
    }
    updateLevelAndXp();
    checkUnlocks();
}

function checkUnlocks() {
    // Разблокировка активностей
    for (let key in gameState.activities) {
        const act = gameState.activities[key];
        if (!act.unlocked && gameState.level >= act.levelReq) {
            act.unlocked = true;
            const card = document.getElementById("activity-" + key);
            if (card) card.classList.remove("locked");
        }
    }
    
    // Охота требует оружие
    if (gameState.hasBow || gameState.hasCrossbow) {
        gameState.activities.hunting.weaponReq = false;
    }
    
    // Обновление кнопок в зависимости от условий
    els.btnHunt.disabled = !gameState.activities.hunting.unlocked || gameState.activities.hunting.weaponReq;
}

// === 5. ОСНОВНОЙ КЛИКЕР =============================
els.mainClickBtn.addEventListener("click", () => {
    const base = gameState.clickPower;
    const bonus = Math.floor(Math.random() * 3); // небольшой разброс
    addGold(base + bonus);
    addXp(1 + Math.floor(gameState.level / 10));
    
    // Визуальный фидбек (можно добавить анимацию позже)
    els.mainClickBtn.style.transform = "scale(1.08)";
    setTimeout(() => els.mainClickBtn.style.transform = "scale(1)", 120);
});

// === 6. ДЕЙСТВИЯ ПО РАБОТАМ =========================
function performActivity(type) {
    const act = gameState.activities[type];
    if (!act.unlocked) return;
    
    let reward = Math.floor(Math.random() * (act.baseMax - act.baseMin + 1)) + act.baseMin;
    
    // Множители от уровня/предметов
    reward = Math.floor(reward * (1 + gameState.level * 0.03));
    
    if (type === "mining" && Math.random() < act.emeraldChance) {
        gameState.emeralds += 1;
        alert("Вы нашли редкий изумруд!");
    }
    
    addGold(reward);
    addXp(Math.floor(reward / 8));
    
    // Пассивный доход увеличивается медленно
    if (Math.random() < 0.25) {
        act.passive += 0.1 + (gameState.level * 0.02);
        gameState.passiveIncome += 0.1 + (gameState.level * 0.02);
    }
}

els.btnFish.addEventListener("click", () => performActivity("fishing"));
els.btnFarm?.addEventListener("click", () => performActivity("farming"));
els.btnMine?.addEventListener("click", () => performActivity("mining"));
els.btnHunt?.addEventListener("click", () => performActivity("hunting"));

// === 7. ПЕРЕКЛЮЧЕНИЕ ТАБОВ ==========================
els.tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        els.tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        
        els.tabPanels.forEach(p => p.classList.remove("active"));
        document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
    });
});

// === 8. МАГАЗИН ======================================
els.buySimpleBow.addEventListener("click", () => {
    const price = 1450;
    if (gameState.gold >= price) {
        gameState.gold -= price;
        gameState.hasBow = true;
        gameState.activities.hunting.weaponReq = false;
        alert("Вы приобрели Простой охотничий лук!");
        updateResourcesDisplay();
        checkUnlocks();
    } else {
        alert("Недостаточно золота!");
    }
});

els.buyCrossbow.addEventListener("click", () => {
    const price = 6200;
    if (gameState.gold >= price && gameState.hasBow) {
        gameState.gold -= price;
        gameState.hasCrossbow = true;
        gameState.hasBow = false; // заменяем
        alert("Лук улучшен до тяжёлого арбалета!");
        updateResourcesDisplay();
    } else {
        alert("Недостаточно золота или нужен базовый лук!");
    }
});

// === 9. ЕЖЕДНЕВНАЯ НАГРАДА ===========================
function canClaimDaily() {
    if (!gameState.lastDailyClaim) return true;
    
    const last = new Date(gameState.lastDailyClaim);
    const now = new Date();
    
    // Сбрасываем в 00:00 по местному времени
    const lastMidnight = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return todayMidnight > lastMidnight;
}

function getDailyReward(streak) {
    const base = 100 + streak * 50;
    return {
        gold: base,
        extra: streak >= 7 ? 1 : 0, // изумруд каждые 7 дней
        xp: 30 + streak * 15
    };
}

els.btnDaily.addEventListener("click", () => {
    if (!canClaimDaily()) {
        els.dailyMessage.textContent = "Награду можно получить только раз в сутки";
        return;
    }
    
    const reward = getDailyReward(gameState.dailyStreak + 1);
    
    gameState.gold += reward.gold;
    gameState.xp += reward.xp;
    if (reward.extra) gameState.emeralds += reward.extra;
    
    gameState.lastDailyClaim = Date.now();
    gameState.dailyStreak++;
    
    updateResourcesDisplay();
    updateLevelAndXp();
    
    els.dailyMessage.textContent = `Получено: ${reward.gold} золота, ${reward.xp} опыта` +
        (reward.extra ? ` + ${reward.extra} изумруд!` : "");
    
    alert("Ежедневная награда получена!\nСерия: " + gameState.dailyStreak);
});

// === 10. БАНК / ОБМЕН =================================
els.btnGoldToEm.addEventListener("click", () => {
    const amount = parseInt(els.goldToEmInput.value) || 0;
    if (amount <= 0 || gameState.gold < amount) {
        alert("Некорректная сумма или недостаточно золота");
        return;
    }
    
    const getEmeralds = Math.floor(amount / gameState.exchangeRates.goldToEmerald);
    if (getEmeralds < 1) {
        alert("Слишком мало для обмена");
        return;
    }
    
    gameState.gold -= amount;
    gameState.emeralds += getEmeralds;
    
    alert(`Обмен выполнен!\nПолучено: ${getEmeralds} изумрудов`);
    updateResourcesDisplay();
});

els.btnEmToGold.addEventListener("click", () => {
    const amount = parseInt(els.emToGoldInput.value) || 0;
    if (amount <= 0 || gameState.emeralds < amount) {
        alert("Некорректная сумма или недостаточно изумрудов");
        return;
    }
    
    const getGold = Math.floor(amount * gameState.exchangeRates.emeraldToGold);
    gameState.emeralds -= amount;
    gameState.gold += getGold;
    
    alert(`Обмен выполнен!\nПолучено: ${formatNumber(getGold)} золота`);
    updateResourcesDisplay();
});

// === 11. ПАССИВНЫЙ ДОХОД (ТИК КАЖДУЮ СЕКУНДУ) ========
setInterval(() => {
    if (gameState.passiveIncome > 0) {
        addGold(gameState.passiveIncome);
        // Маленький бонус опыта от пассива
        addXp(Math.floor(gameState.passiveIncome * 0.4));
    }
}, 1000);

// === 12. СОХРАНЕНИЕ / ЗАГРУЗКА =======================
function saveGame() {
    localStorage.setItem("ancient_destiny_save", JSON.stringify(gameState));
    gameState.lastSave = Date.now();
}

function loadGame() {
    const saved = localStorage.getItem("ancient_destiny_save");
    if (!saved) return;
    
    try {
        const data = JSON.parse(saved);
        Object.assign(gameState, data);
        
        // Исправляем возможные старые/битые данные
        if (!gameState.activities) gameState.activities = {...initialActivities};
        
        updateResourcesDisplay();
        updateLevelAndXp();
        checkUnlocks();
        
        // Восстанавливаем пассивный доход
        let totalPassive = 0;
        for (let key in gameState.activities) {
            totalPassive += gameState.activities[key].passive || 0;
        }
        gameState.passiveIncome = totalPassive;
        
    } catch (e) {
        console.error("Ошибка загрузки сохранения", e);
    }
}

// Автосохранение
setInterval(saveGame, 30000); // каждые 30 сек

// Сохранение при закрытии/перезагрузке
window.addEventListener("beforeunload", saveGame);

// === 13. ЗАПУСК ИГРЫ =================================
function initGame() {
    loadGame();
    updateResourcesDisplay();
    updateLevelAndXp();
    checkUnlocks();
    
    // Проверка ежедневки при запуске
    if (canClaimDaily()) {
        els.dailyMessage.textContent = "Награда доступна!";
    } else {
        els.dailyMessage.textContent = "Сегодня награда уже получена";
    }
}

initGame();

// === 14. ДЛЯ ОТЛАДКИ (можно удалить позже) ===========
window.debugGame = () => {
    console.log("Текущее состояние игры:", gameState);
    return gameState;
};

// Конец основного скрипта
console.log("Ancient Destiny Game initialized");
