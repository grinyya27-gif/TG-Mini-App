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

    // === ИНИЦИАЛИЗАЦИЯ ===
    init() {
        this.load(); // Загрузка сохранения
        this.updateUI();
        this.startLoading();
        
        if(tg.initDataUnsafe?.user) {
            document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
        }

        // Проверка бонуса через 3 секунды после старта
        setTimeout(() => this.checkDaily(), 3000);
    },

    // === НАВИГАЦИЯ ===
    setTab(id, el) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const target = document.getElementById('screen-' + id);
        if (target) target.classList.add('active');
        if (el) el.classList.add('active');
        
        tg.HapticFeedback.impactOccurred('light');
    },

    filterShop(category) {
        const categories = ['rods', 'picks', 'weapons'];
        categories.forEach(cat => {
            document.getElementById('shop-content-' + cat).style.display = 'none';
            document.getElementById('tab-' + cat).classList.remove('active');
        });
        document.getElementById('shop-content-' + category).style.display = 'block';
        document.getElementById('tab-' + category).classList.add('active');
    },

    // === ЛОГИКА РАБОТЫ ===
    doWork(type) {
        let earnedGold = 0;
        let earnedXp = 0;

        if (type === 'port') {
            let bonus = this.inventory.includes('rod2') ? 15 : 0;
            earnedGold = 2 + bonus;
            earnedXp = 5;
        } 
        else if (type === 'mine') {
            let bonus = this.inventory.includes('pick3') ? 25 : 0;
            earnedGold = 1 + bonus;
            earnedXp = 8;
            if (Math.random() < 0.02) this.emeralds++; 
        } 
        else if (type === 'farm') {
            if (this.lvl < 15) return tg.showAlert("Нужен 15 уровень!");
            earnedGold = 15;
            earnedXp = 12;
        } 
        else if (type === 'hunt') {
            if (this.lvl < 25) return tg.showAlert("Нужен 25 уровень!");
            if (!this.inventory.includes('bow1')) return tg.showAlert("Сначала купите лук!");
            earnedGold = 50;
            earnedXp = 20;
        }

        this.gold += earnedGold;
        this.addXp(earnedXp);
        this.updateUI();
        this.save();
        tg.HapticFeedback.impactOccurred('medium');
    },

    addXp(val) {
        this.xp += val;
        if (this.xp >= this.nextXp) {
            this.xp -= this.nextXp;
            this.lvl++;
            this.nextXp = Math.floor(this.nextXp * 1.5);
            tg.showAlert("Уровень повышен до " + this.lvl + "!");
        }
    },

    // === МАГАЗИН И ОБМЕН ===
    buy(id, price) {
        if (this.gold >= price && !this.inventory.includes(id)) {
            this.gold -= price;
            this.inventory.push(id);
            this.updateUI();
            this.save();
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.showAlert(this.inventory.includes(id) ? "Уже куплено!" : "Недостаточно золота!");
        }
    },

    exchange() {
        if (this.emeralds >= 1) {
            this.emeralds--;
            this.gold += 500;
            this.updateUI();
            this.save();
        } else {
            tg.showAlert("Нужны изумруды!");
        }
    },

    // === ЕЖЕДНЕВНЫЙ БОНУС ===
    checkDaily() {
        const last = localStorage.getItem('lastBonus');
        const today = new Date().toDateString();
        if (last !== today) {
            document.getElementById('daily-modal').style.display = 'flex';
        }
    },

    closeDaily() {
        this.emeralds += 5;
        localStorage.setItem('lastBonus', new Date().toDateString());
        document.getElementById('daily-modal').style.display = 'none';
        this.updateUI();
        this.save();
    },

    // === ИНТЕРФЕЙС И СОХРАНЕНИЕ ===
    updateUI() {
        document.getElementById('gold').innerText = Math.floor(this.gold);
        document.getElementById('emeralds').innerText = this.emeralds;
        document.getElementById('lvl').innerText = this.lvl;
        document.getElementById('xp-text').innerText = this.xp + "/" + this.nextXp;
        document.getElementById('exp-fill').style.width = (this.xp / this.nextXp * 100) + "%";
        document.getElementById('inv').innerText = this.inventory.length;

        // Разблокировка работ
        if (this.lvl >= 15) document.getElementById('work-farm').classList.remove('locked-work');
        if (this.lvl >= 25) document.getElementById('work-hunt').classList.remove('locked-work');

        // Кнопки купить
        this.inventory.forEach(item => {
            const btn = document.getElementById('btn-' + item);
            if (btn) {
                btn.innerText = "Куплено";
                btn.style.background = "#333";
            }
        });
    },

    startLoading() {
        let w = 0;
        const progress = document.getElementById('load-progress');
        const interval = setInterval(() => {
            w += Math.random() * 15;
            if (w >= 100) {
                w = 100;
                clearInterval(interval);
                setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 500);
            }
            progress.style.width = w + "%";
        }, 150);
    },

    save() {
        const data = {
            gold: this.gold,
            emeralds: this.emeralds,
            lvl: this.lvl,
            xp: this.xp,
            inv: this.inventory,
            next: this.nextXp
        };
        localStorage.setItem('warSagaSave', JSON.stringify(data));
    },

    load() {
        const save = localStorage.getItem('warSagaSave');
        if (save) {
            const d = JSON.parse(save);
            this.gold = d.gold;
            this.emeralds = d.emeralds;
            this.lvl = d.lvl;
            this.xp = d.xp;
            this.inventory = d.inv;
            this.nextXp = d.next;
        }
    },

    openLocation(name) {
        tg.showAlert("Вы вошли в локацию: " + name);
    }
};

// Запуск игры
game.init();
