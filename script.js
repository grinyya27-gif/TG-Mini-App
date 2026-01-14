const tg = window.Telegram.WebApp;
tg.expand();

const game = {
    gold: 50, emeralds: 0, lvl: 1, xp: 0, nextXp: 100,
    inventory: [],

    setTab(id, el) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById('screen-' + id).classList.add('active');
        if (el) el.classList.add('active');
        tg.HapticFeedback.impactOccurred('light');
    },

    openLocation(id) {
        tg.showAlert("Вы прибыли в локацию: " + id + ". Скоро здесь появятся уникальные функции!");
    },

    doWork(type) {
        if (type === 'port') {
            let b = this.inventory.includes('rod1') ? 5 : 0;
            this.gold += (2 + b); this.addXp(5);
        } else {
            let b = this.inventory.includes('pick1') ? 4 : 0;
            let c = this.inventory.includes('pick1') ? 0.02 : 0.01;
            this.gold += (1 + b);
            if(Math.random() < c) { 
                this.emeralds++; 
                tg.HapticFeedback.notificationOccurred('success'); 
            }
            this.addXp(8);
        }
        tg.HapticFeedback.impactOccurred('medium');
        this.updateUI();
    },

    addXp(val) {
        this.xp += val;
        if(this.xp >= this.nextXp) {
            this.xp -= this.nextXp; this.lvl++;
            this.nextXp = Math.floor(this.nextXp * 1.6 + 50);
            tg.showAlert("Уровень повышен до " + this.lvl + "!");
        }
    },

    buy(id, price) {
        if(this.gold >= price && !this.inventory.includes(id)) {
            this.gold -= price; this.inventory.push(id);
            const btn = document.getElementById('btn-'+id);
            if (btn) {
                btn.innerText = "КУПЛЕНО";
                btn.classList.add('bought');
            }
            this.updateUI();
        } else if (this.inventory.includes(id)) {
            tg.showAlert("Уже куплено!");
        } else { 
            tg.showAlert("Недостаточно золота!"); 
        }
    },

    exchange() {
        if(this.emeralds >= 1) {
            this.emeralds--; this.gold += 500;
            this.updateUI();
            tg.showAlert("Обмен завершен! +500 золота.");
        } else { 
            tg.showAlert("У вас нет изумрудов!"); 
        }
    },

    updateUI() {
        document.getElementById('gold').innerText = Math.floor(this.gold);
        document.getElementById('emeralds').innerText = this.emeralds;
        document.getElementById('lvl').innerText = this.lvl;
        document.getElementById('xp-text').innerText = this.xp + "/" + this.nextXp;
        document.getElementById('exp-fill').style.width = (this.xp/this.nextXp*100) + "%";
        
        // Обновление наград на кнопках
        const pGoldText = document.getElementById('p-gold');
        const mGoldText = document.getElementById('m-gold');
        const mChanceText = document.getElementById('m-chance');

        if(pGoldText) pGoldText.innerText = this.inventory.includes('rod1') ? 7 : 2;
        if(mGoldText) mGoldText.innerText = this.inventory.includes('pick1') ? 5 : 1;
        if(mChanceText) mChanceText.innerText = this.inventory.includes('pick1') ? 2 : 1;
        
        let i = [];
        if(this.inventory.includes('rod1')) i.push("Удочка");
        if(this.inventory.includes('pick1')) i.push("Кирка");
        document.getElementById('inv').innerText = i.length ? i.join(", ") : "пусто";
    }
};

// Инициализация имени
if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
}

game.updateUI();
filterShop(category) {
    // Скрываем все разделы лавки
    document.getElementById('shop-content-rods').style.display = 'none';
    document.getElementById('shop-content-picks').style.display = 'none';
    
    // Снимаем выделение со всех табов
    document.getElementById('tab-rods').classList.remove('active');
    document.getElementById('tab-picks').classList.remove('active');
    
    // Показываем нужный раздел и выделяем таб
    if (category === 'rods') {
        document.getElementById('shop-content-rods').style.display = 'block';
        document.getElementById('tab-rods').classList.add('active');
    } else {
        document.getElementById('shop-content-picks').style.display = 'block';
        document.getElementById('tab-picks').classList.add('active');
    }
    tg.HapticFeedback.impactOccurred('light');
},


