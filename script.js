/* ===============================
   TELEGRAM INIT
================================ */
let tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
}

/* ===============================
   GAME STATE
================================ */
const game = {
    player: {
        name: "Безымянный",
        level: 1,
        exp: 0,
        expNext: 100,
        title: "Бродяга",
        gold: 0,
        emeralds: 0,
        energy: 100,
        maxEnergy: 100,
        daysPlayed: 1,
        inventory: [],
        equipment: {
            weapon: null,
            armor: null
        },
        lastDaily: null
    }
};

/* ===============================
   LEVEL TITLES
================================ */
const levelTitles = {
    1: "Бродяга",
    3: "Подмастерье",
    5: "Работяга",
    10: "Горожанин",
    15: "Охотник",
    20: "Воин",
    30: "Рыцарь",
    40: "Лорд",
    50: "Барон",
    70: "Герцог",
    100: "Легенда эпохи"
};

/* ===============================
   SAVE / LOAD
================================ */
function saveGame() {
    localStorage.setItem("darkAgesSave", JSON.stringify(game));
}

function loadGame() {
    const save = localStorage.getItem("darkAgesSave");
    if (save) {
        Object.assign(game, JSON.parse(save));
    }
}

/* ===============================
   UI UPDATE
================================ */
function updateUI() {
    document.getElementById("gold").textContent = game.player.gold;
    document.getElementById("emeralds").textContent = game.player.emeralds;
    document.getElementById("energy").textContent = game.player.energy;
    document.getElementById("maxEnergy").textContent = game.player.maxEnergy;
    document.getElementById("level").textContent = game.player.level;
    document.getElementById("exp").textContent = game.player.exp;
    document.getElementById("expNext").textContent = game.player.expNext;
    document.getElementById("playerName").textContent = game.player.name;
    document.getElementById("title").textContent = game.player.title;
    document.getElementById("daysPlayed").textContent = game.player.daysPlayed;

    const expPercent = (game.player.exp / game.player.expNext) * 100;
    document.getElementById("expBar").style.width = expPercent + "%";

    updateLocks();
}

/* ===============================
   LEVEL SYSTEM
================================ */
function addExp(amount) {
    game.player.exp += amount;

    while (game.player.exp >= game.player.expNext) {
        game.player.exp -= game.player.expNext;
        game.player.level++;
        game.player.expNext = Math.floor(game.player.expNext * 1.4);
        game.player.maxEnergy += 5;
        game.player.energy = game.player.maxEnergy;

        if (levelTitles[game.player.level]) {
            game.player.title = levelTitles[game.player.level];
        }
    }

    updateUI();
    saveGame();
}

/* ===============================
   LOCKED CONTENT
================================ */
function updateLocks() {
    const mine = document.getElementById("jobMineCard");
    const hunt = document.getElementById("jobHuntCard");

    if (game.player.level >= 5) mine.classList.remove("locked");
    if (game.player.level >= 15) hunt.classList.remove("locked");
}

/* ===============================
   ENERGY
================================ */
function useEnergy(amount) {
    if (game.player.energy < amount) {
        alert("Недостаточно энергии");
        return false;
    }
    game.player.energy -= amount;
    return true;
}

/* ===============================
   JOBS
================================ */
document.getElementById("jobFishing").onclick = () => {
    if (!useEnergy(1)) return;

    const gold = 1 + Math.floor(Math.random() * 2);
    game.player.gold += gold;
    addExp(5);
    updateUI();
    saveGame();
};

document.getElementById("jobMine").onclick = () => {
    if (game.player.level < 5) return;
    if (!useEnergy(2)) return;

    const gold = 4 + Math.floor(Math.random() * 3);
    game.player.gold += gold;

    if (Math.random() <= 0.01) {
        game.player.emeralds++;
        alert("Ты нашёл изумруд!");
    }

    addExp(8);
    updateUI();
    saveGame();
};

document.getElementById("jobHunt").onclick = () => {
    if (game.player.level < 15) return;

    const hasBow = game.player.inventory.includes("bow") || game.player.equipment.weapon === "bow";
    if (!hasBow) {
        alert("Нужен лук");
        return;
    }

    if (!useEnergy(3)) return;

    let gold = 8 + Math.floor(Math.random() * 5);

    if (game.player.equipment.weapon === "crossbow") {
        gold += 5;
    }

    game.player.gold += gold;
    addExp(12);
    updateUI();
    saveGame();
};

/* ===============================
   MARKET
================================ */
document.querySelectorAll("#market .item-card button").forEach(btn => {
    btn.onclick = () => {
        const item = btn.parentElement.querySelector("h4").textContent;

        if (item.includes("Лук")) buyItem("bow", 1000);
        if (item.includes("Арбалет")) buyItem("crossbow", 5000);
        if (item.includes("Кожаная")) buyItem("armor_leather", 800);
    };
});

function buyItem(item, price) {
    if (game.player.gold < price) {
        alert("Недостаточно золота");
        return;
    }

    game.player.gold -= price;
    game.player.inventory.push(item);

    if (item === "bow" || item === "crossbow") {
        game.player.equipment.weapon = item;
    }

    saveGame();
    updateUI();
}

/* ===============================
   BANK
================================ */
document.querySelectorAll("#bank button")[0].onclick = () => {
    if (game.player.gold >= 100) {
        game.player.gold -= 100;
        game.player.emeralds += 1;
    }
    updateUI();
    saveGame();
};

document.querySelectorAll("#bank button")[1].onclick = () => {
    if (game.player.emeralds >= 1) {
        game.player.emeralds -= 1;
        game.player.gold += 80;
    }
    updateUI();
    saveGame();
};

/* ===============================
   DAILY BONUS
================================ */
document.getElementById("dailyBonus").onclick = () => {
    const today = new Date().toDateString();

    if (game.player.lastDaily === today) {
        alert("Бонус уже получен");
        return;
    }

    game.player.lastDaily = today;
    game.player.gold += 50;
    game.player.energy = game.player.maxEnergy;
    game.player.daysPlayed++;

    alert("Ежедневный бонус получен!");
    saveGame();
    updateUI();
};

/* ===============================
   NAVIGATION
================================ */
document.querySelectorAll(".main-navigation button").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
        document.getElementById(btn.dataset.tab).classList.add("active");

        document.querySelectorAll(".main-navigation button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    };
});

/* ===============================
   INIT
================================ */
loadGame();
updateUI();

