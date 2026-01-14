// Инициализация Telegram
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние игрока (в идеале загружается с вашего сервера)
let player = {
    gold: 100,
    emeralds: 5,
    level: 1,
    exp: 0,
    power: 10
};

// Функция обновления интерфейса
function updateUI() {
    document.getElementById('gold-count').innerText = Math.floor(player.gold);
    document.getElementById('emerald-count').innerText = player.emeralds;
    
    // Если есть данные из ТГ
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        document.getElementById('username').innerText = tg.initDataUnsafe.user.first_name;
    }
}

// Логика кнопок меню
document.querySelectorAll('.menu-item').forEach(button => {
    button.addEventListener('click', () => {
        const loc = button.getAttribute('data-loc');
        handleLocation(loc);
        tg.HapticFeedback.impactOccurred('light');
    });
});

// Простая механика симулятора
function handleLocation(loc) {
    switch(loc) {
        case 'traktir':
            // В трактире можно поработать
            const earned = 10 + (player.level * 2);
            player.gold += earned;
            showFloatingText(`+${earned} 🪙`);
            break;
            
        case 'shop':
            if (player.gold >= 50) {
                player.gold -= 50;
                player.power += 5;
                alert("Куплен ржавый меч! Сила +5");
            } else {
                alert("Недостаточно золота!");
            }
            break;

        case 'stats':
            alert(`Уровень: ${player.level}\nСила: ${player.power}\nОпыт: ${player.exp}`);
            break;

        default:
            alert("Эта локация будет доступна в следующем обновлении!");
    }
    updateUI();
}

// Визуальный эффект получения денег
function showFloatingText(text) {
    const el = document.createElement('div');
    el.innerText = text;
    el.style.position = 'fixed';
    el.style.top = '50%';
    el.style.left = '50%';
    el.style.color = '#ffd700';
    el.style.fontWeight = 'bold';
    el.style.animation = 'floatUp 1s forwards';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

// Анимация для вылетающего текста (добавить в CSS)
// @keyframes floatUp { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-50px); opacity: 0; } }

// Старт игры
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('splash-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    updateUI();
});
