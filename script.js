const tg = window.Telegram.WebApp;
tg.expand();

const game = {
    gold: 0,
    emeralds: 0,

    updateUI() {
        document.getElementById('gold').innerText = Math.floor(this.gold);
        document.getElementById('emeralds').innerText = this.emeralds;
    },

    // Универсальная функция для работы
    work(type) {
        if (type === 'mine') {
            // ЛОГИКА РУДНИКА
            this.gold += 10;
            // Шанс 15% найти изумруд
            if (Math.random() < 0.15) {
                this.emeralds += 1;
                tg.HapticFeedback.notificationOccurred('success'); // Сильная вибрация
            } else {
                tg.HapticFeedback.impactOccurred('medium'); // Средняя вибрация
            }
        } 
        else if (type === 'fish') {
            // ЛОГИКА РЫБАЛКИ
            this.gold += 15; // В порту золота чуть больше
            tg.HapticFeedback.impactOccurred('light'); // Легкая вибрация
        }

        this.updateUI();
    }
};

// Инициализация при старте
game.updateUI();

