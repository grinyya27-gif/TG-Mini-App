alert("Скрипт запущен!");
// Функция, которая физически убирает черный экран
function forceStartGame() {
    console.log("Принудительный запуск игры...");
    const curtain = document.getElementById('app-curtain');
    const app = document.getElementById('app');

    if (curtain) {
        curtain.style.opacity = '0';
        setTimeout(() => {
            curtain.style.display = 'none';
            if (app) app.style.display = 'block';
        }, 1000);
    }
}

// ПРЕДОХРАНИТЕЛЬ: если через 4 секунды заставка всё ещё висит — убираем её силой
setTimeout(forceStartGame, 4000);

// Обычная логика загрузки
window.addEventListener('load', () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    // Пробуем мягко закрыть заставку через 2 секунды
    setTimeout(forceStartGame, 2000);
});

