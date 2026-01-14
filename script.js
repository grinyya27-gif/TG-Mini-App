/* ================================
   TELEGRAM MINI APP INIT
================================ */
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.ready();
}

/* ================================
   GAME STATE
================================ */
let game = {
  currencies: {
    gold: 0,
    emeralds: 0
  },

  player: {
    level: 1,
    exp: 0,
    expToNext: 100,

    energy: 100,
    maxEnergy: 100,

    clickPower: 1
  },

  upgrades: {
    click: {
      level: 1,
      cost: 10
    },
    energy: {
      level: 1,
      cost: 20
    }
  },

  passive: {
    incomePerSecond: 0,
    mine: {
      level: 0,
      baseCost: 50,
      currentCost: 50,
      income: 1
    }
  },

  meta: {
    lastSave: Date.now()
  }
};

/* ================================
   SAVE / LOAD
================================ */
const SAVE_KEY = "telegram_rpg_clicker_save_v1";

function saveGame() {
  game.meta.lastSave = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(game));
}

function loadGame() {
  const data = localStorage.getItem(SAVE_KEY);
  if (data) {
    try {
      game = JSON.parse(data);
    } catch (e) {
      console.error("Save corrupted", e);
    }
  }
}

/* ================================
   UI HELPERS
================================ */
const UI = {
  gold: () => document.getElementById("gold"),
  emeralds: () => document.getElementById("emeralds"),
  level: () => document.getElementById("level"),
  exp: () => document.getElementById("exp"),
  expToNext: () => document.getElementById("expToNext"),
  energy: () => document.getElementById("energy"),
  maxEnergy: () => document.getElementById("maxEnergy"),

  clickCost: () => document.getElementById("clickCost"),
  energyCost: () => document.getElementById("energyCost"),

  mineLevel: () => document.getElementById("mineLevel"),
  mineCost: () => document.getElementById("mineCost"),
  passiveIncome: () => document.getElementById("passiveIncome"),

  workBtn: () => document.getElementById("workBtn"),
  upgradeClickBtn: () => document.getElementById("upgradeClick"),
  upgradeEnergyBtn: () => document.getElementById("upgradeEnergy"),
  buyMineBtn: () => document.getElementById("buyMine"),
  emeraldUpgradeBtn: () => document.getElementById("buyEmeraldUpgrade")
};

function updateUI() {
  UI.gold().textContent = game.currencies.gold;
  UI.emeralds().textContent = game.currencies.emeralds;

  UI.level().textContent = game.player.level;
  UI.exp().textContent = game.player.exp;
  UI.expToNext().textContent = game.player.expToNext;

  UI.energy().textContent = game.player.energy;
  UI.maxEnergy().textContent = game.player.maxEnergy;

  UI.clickCost().textContent = game.upgrades.click.cost;
  UI.energyCost().textContent = game.upgrades.energy.cost;

  UI.mineLevel().textContent = game.passive.mine.level;
  UI.mineCost().textContent = game.passive.mine.currentCost;
  UI.passiveIncome().textContent = game.passive.incomePerSecond;
}

/* ================================
   CORE GAME MECHANICS
================================ */
function work() {
  if (game.player.energy <= 0) return;

  game.player.energy -= 1;
  game.currencies.gold += game.player.clickPower;
  gainExp(5);

  saveGame();
  updateUI();
}

function gainExp(amount) {
  game.player.exp += amount;

  if (game.player.exp >= game.player.expToNext) {
    levelUp();
  }
}

function levelUp() {
  game.player.level++;
  game.player.exp = 0;
  game.player.expToNext = Math.floor(game.player.expToNext * 1.5);

  game.player.maxEnergy += 10;
  game.player.energy = game.player.maxEnergy;

  game.currencies.emeralds += 1;
}

/* ================================
   UPGRADES
================================ */
function upgradeClick() {
  const up = game.upgrades.click;
  if (game.currencies.gold < up.cost) return;

  game.currencies.gold -= up.cost;
  up.level++;
  game.player.clickPower++;
  up.cost = Math.floor(up.cost * 1.6);

  saveGame();
  updateUI();
}

function upgradeEnergy() {
  const up = game.upgrades.energy;
  if (game.currencies.gold < up.cost) return;

  game.currencies.gold -= up.cost;
  up.level++;
  game.player.maxEnergy += 10;
  game.player.energy = game.player.maxEnergy;
  up.cost = Math.floor(up.cost * 1.6);

  saveGame();
  updateUI();
}

function buyEmeraldUpgrade() {
  if (game.currencies.emeralds < 3) return;

  game.currencies.emeralds -= 3;
  game.passive.incomePerSecond += 1;

  saveGame();
  updateUI();
}

/* ================================
   PASSIVE INCOME
================================ */
function buyMine() {
  const mine = game.passive.mine;
  if (game.currencies.gold < mine.currentCost) return;

  game.currencies.gold -= mine.currentCost;
  mine.level++;
  game.passive.incomePerSecond += mine.income;
  mine.currentCost = Math.floor(mine.currentCost * 1.7);

  saveGame();
  updateUI();
}

setInterval(() => {
  game.currencies.gold += game.passive.incomePerSecond;
  saveGame();
  updateUI();
}, 1000);

/* ================================
   ENERGY REGEN
================================ */
setInterval(() => {
  if (game.player.energy < game.player.maxEnergy) {
    game.player.energy += 1;
    updateUI();
    saveGame();
  }
}, 5000);

/* ================================
   EVENTS
================================ */
function bindEvents() {
  UI.workBtn().addEventListener("click", work);
  UI.upgradeClickBtn().addEventListener("click", upgradeClick);
  UI.upgradeEnergyBtn().addEventListener("click", upgradeEnergy);
  UI.buyMineBtn().addEventListener("click", buyMine);
  UI.emeraldUpgradeBtn().addEventListener("click", buyEmeraldUpgrade);
}

/* ================================
   OFFLINE INCOME
================================ */
function applyOfflineIncome() {
  const now = Date.now();
  const diff = Math.floor((now - game.meta.lastSave) / 1000);
  if (diff > 0) {
    const earned = diff * game.passive.incomePerSecond;
    game.currencies.gold += earned;
  }
}

/* ================================
   INIT
================================ */
loadGame();
applyOfflineIncome();
bindEvents();
updateUI();
