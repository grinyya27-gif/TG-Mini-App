const tg = window.Telegram.WebApp;
tg.expand();

// Класс управления игрой
class WarGame {
    constructor() {
        this.state = JSON.parse(localStorage.getItem('war_game_save')) || {
            gold: 500,
            emeralds: 10,
            power: 10,
            armor: 5,
            hp: 100,
            maxHp: 100,
            lvl: 1,
            exp: 0,
            inventory: []
        };
        
        this.init();
    }

    init() {
        this.updateUI();
        if (tg.initDataUnsafe?.user) {
            document.getElementById('username').innerText = tg.initDataUnsafe.user.first_name;
        }
        
        document.getElementById('start-btn').onclick = () => {
            document.getElementById('splash-screen').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
            this.log("Вы вошли в игру. Удачной охоты!");
        };
    }

    // Сохранение
    save() {
        localStorage.setItem('war_game_save', JSON.stringify(this.state));
        this.updateUI();
    }

    updateUI() {
        document.getElementById('gold').innerText = this.state.gold;
        document.getElementById('emeralds').innerText = this.state.emeralds;
        document.getElementById('power').innerText = this.state.power;
        document.getElementById('armor').innerText = this.state.armor;
        document.getElementById('hp').innerText = `${this.state.hp}/${this.state.maxHp}`;
        document.getElementById('user-level').innerText = `Уровень ${this.state.lvl}`;
    }

    log(msg) {
        const logBox = document.getElementById('game-log');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logBox.prepend(entry);
    }

    // Система локаций
    goTo(loc) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        modal.classList.remove('hidden');
        tg.HapticFeedback.impactOccurred('medium');

        switch(loc) {
            case 'traktir':
                title.innerText = "🍻 Трактир «У Хромого Орка»";
                body.innerHTML = `
                    <p>Здесь можно найти подработку или отдохнуть.</p>
                    <button class="btn-red" onclick="game.action('work')">Мыть полы (+10 🪙)</button>
                    <button class="btn-red" onclick="game.action('drink')">Выпить эля (-20 🪙, +20 ❤️)</button>
                `;
                break;
            case 'shop':
                title.innerText = "🛒 Имперский Магазин";
                body.innerHTML = `
                    <p>Товары высшего качества:</p>
                    <button class="btn-red" onclick="game.buy('power', 100, 5)">Сила +5 (100 🪙)</button>
                    <button class="btn-red" onclick="game.buy('hp_max', 200, 50)">Макс HP +50 (200 🪙)</button>
                `;
                break;
            case 'arena':
                title.innerText = "🏟️ Гладиаторская Арена";
                body.innerHTML = `
                    <p>Сразитесь за славу и золото!</p>
                    <button class="btn-red" onclick="game.action('fight')">Найти противника (Риск!)</button>
                `;
                break;
        }
    }

    action(type) {
        if (type === 'work') {
            this.state.gold += 10;
            this.log("Вы вымыли полы и получили 10 золотых.");
        } else if (type === 'drink') {
            if (this.state.gold >= 20) {
                this.state.gold -= 20;
                this.state.hp = Math.min(this.state.maxHp, this.state.hp + 20);
                this.log("Эль восстановил ваши силы.");
            }
        } else if (type === 'fight') {
            let win = Math.random() > 0.4;
            if (win) {
                let prize = 50 + (this.state.lvl * 10);
                this.state.gold += prize;
                this.state.exp += 20;
                this.log(`Победа! Вы получили ${prize} золотых.`);
            } else {
                this.state.hp -= 30;
                this.log("Поражение... Вы едва ушли живым.");
                if (this.state.hp <= 0) {
                    this.state.hp = 10;
                    this.log("Вы потеряли сознание и очнулись в канаве.");
                }
            }
        }
        this.save();
        this.closeModal();
    }

    buy(stat, cost, value) {
        if (this.state.gold >= cost) {
            this.state.gold -= cost;
            if (stat === 'power') this.state.power += value;
            if (stat === 'hp_max') this.state.maxHp += value;
            this.log(`Покупка совершена!`);
            this.save();
            this.closeModal();
        } else {
            alert("Недостаточно золота!");
        }
    }

    closeModal() {
        document.getElementById('modal').classList.add('hidden');
    }
}

// Запуск
const game = new WarGame();
